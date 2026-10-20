#!/usr/bin/env bash
# World Pulse — instalare / actualizare pe server (idempotent; rulează ca root).
#
#   bash install.sh <domeniu> [port]
#   ex.: bash install.sh pulse.example.com 8090
#
# Ce face:
#   1. ia codul din acest repo (REPO_URL implicit: github.com/hirjoabaioan/world-pulse; alternativ
#      REPO_DIR, dacă ai deja o clonă locală/privată) → /opt/world-pulse
#   2. păstrează datele în /var/lib/world-pulse (cache, sources.local.json) între actualizări
#   3. pornește serviciul cu pm2 (dacă există) sau systemd, ascultând doar pe 127.0.0.1:<port>
#   4. configurează nginx ca reverse proxy pentru <domeniu> și, dacă există certbot + EMAIL, HTTPS
#
# Variabile opționale: REPO_URL (implicit repo-ul public), REPO_DIR, BRANCH, EMAIL (pentru certbot),
#                      GDELT_REGIONS (implicit toate), SKIP_NGINX=1
set -euo pipefail

DOMAIN="${1:-}"
PORT="${2:-8090}"
BRANCH="${BRANCH:-main}"
REPO_URL="${REPO_URL:-https://github.com/hirjoabaioan/world-pulse.git}"
REPO_DIR="${REPO_DIR:-}"
APP_DIR=/opt/world-pulse
DATA_DIR=/var/lib/world-pulse
NAME=world-pulse

log() { printf '\033[1;34m[world-pulse]\033[0m %s\n' "$*"; }
die() { printf '\033[1;31m[world-pulse] EROARE:\033[0m %s\n' "$*" >&2; exit 1; }

[ "$(id -u)" = 0 ] || die "rulează ca root"
[ -n "$DOMAIN" ] || [ "${SKIP_NGINX:-}" = 1 ] || die "folosire: bash install.sh <domeniu> [port]"

# --- Node >= 18 -------------------------------------------------------------
command -v node >/dev/null || die "Node.js lipsește (necesar >= 18)"
NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
[ "$NODE_MAJOR" -ge 18 ] || die "Node $NODE_MAJOR e prea vechi (necesar >= 18)"
log "Node $(node -v)"

# --- cod sursă --------------------------------------------------------------
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
if [ -n "$REPO_DIR" ] && [ -d "$REPO_DIR/.git" ]; then
  log "iau $BRANCH prin $REPO_DIR (fetch + archive, fără a modifica ramura curentă)"
  git -C "$REPO_DIR" fetch -q origin "$BRANCH"
  mkdir -p "$TMP/src"
  git -C "$REPO_DIR" archive FETCH_HEAD | tar -x -C "$TMP/src"
elif [ -n "$REPO_URL" ]; then
  log "clonez $BRANCH din $REPO_URL"
  git clone -q --depth 1 --branch "$BRANCH" "$REPO_URL" "$TMP/src"
  rm -rf "$TMP/src/.git"
else
  die "setează REPO_DIR sau REPO_URL"
fi
[ -f "$TMP/src/server.js" ] || die "arhiva nu conține server.js"

log "rulez testele pe versiunea nouă"
(cd "$TMP/src" && node --test >/dev/null 2>&1) || die "testele au eșuat — nu instalez versiunea nouă"

mkdir -p "$DATA_DIR"
if [ -d "$APP_DIR" ]; then rm -rf "$APP_DIR.prev"; mv "$APP_DIR" "$APP_DIR.prev"; fi
mv "$TMP/src" "$APP_DIR"
log "cod instalat în $APP_DIR (versiunea anterioară: $APP_DIR.prev)"

# --- serviciu ---------------------------------------------------------------
# Secrete opționale (ex. BLUESKY_IDENTIFIER/BLUESKY_APP_PASSWORD, YOUTUBE_API_KEY — vezi README)
# NU stau în git; fișierul local (format KEY=VALUE, un rând pe linie) supraviețuiește fiecărui
# redeploy pentru că e în afara $APP_DIR (care e rescris complet la fiecare instalare).
SECRETS_FILE="${SECRETS_FILE:-$DATA_DIR/secrets.env}"
ENV_VARS=(PORT="$PORT" HOST=127.0.0.1 DATA_DIR="$DATA_DIR")
[ -n "${GDELT_REGIONS:-}" ] && ENV_VARS+=(GDELT_REGIONS="$GDELT_REGIONS")
if [ -f "$SECRETS_FILE" ]; then
  log "citesc secrete din $SECRETS_FILE"
  while IFS='=' read -r k v; do
    [ -z "$k" ] && continue
    case "$k" in \#*) continue ;; esac
    ENV_VARS+=("$k=$v")
  done < "$SECRETS_FILE"
fi
if command -v pm2 >/dev/null; then
  log "pornesc cu pm2"
  pm2 delete "$NAME" >/dev/null 2>&1 || true
  env "${ENV_VARS[@]}" pm2 start "$APP_DIR/server.js" --name "$NAME" --cwd "$APP_DIR" --update-env >/dev/null
  pm2 save >/dev/null
else
  log "pornesc cu systemd"
  id -u "$NAME" >/dev/null 2>&1 || useradd --system --no-create-home --shell /usr/sbin/nologin "$NAME"
  chown -R "$NAME": "$DATA_DIR"
  cat > /etc/systemd/system/$NAME.service <<UNIT
[Unit]
Description=World Pulse (hartă globală de știri și conflicte)
After=network-online.target

[Service]
WorkingDirectory=$APP_DIR
ExecStart=$(command -v node) $APP_DIR/server.js
$(for kv in "${ENV_VARS[@]}"; do echo "Environment=$kv"; done)
User=$NAME
Restart=always
RestartSec=5
NoNewPrivileges=yes
ProtectSystem=full

[Install]
WantedBy=multi-user.target
UNIT
  systemctl daemon-reload
  systemctl enable --now $NAME
  systemctl restart $NAME
fi

for i in $(seq 1 20); do
  curl -fsS "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1 && break
  sleep 1
done
curl -fsS "http://127.0.0.1:$PORT/api/health" >/dev/null || die "serviciul nu răspunde pe portul $PORT (vezi: pm2 logs $NAME / journalctl -u $NAME)"
log "serviciul răspunde pe 127.0.0.1:$PORT"

# --- nginx ------------------------------------------------------------------
if [ "${SKIP_NGINX:-}" != 1 ]; then
  command -v nginx >/dev/null || die "nginx lipsește (sau rulează cu SKIP_NGINX=1)"
  if [ -d /etc/nginx/sites-available ]; then
    CONF=/etc/nginx/sites-available/$NAME.conf
    ln -sf "$CONF" /etc/nginx/sites-enabled/$NAME.conf
  else
    CONF=/etc/nginx/conf.d/$NAME.conf
  fi
  if [ ! -f "$CONF" ] || ! grep -q "managed-by-certbot\|ssl_certificate" "$CONF"; then
    sed -e "s/__DOMAIN__/$DOMAIN/g" -e "s/__PORT__/$PORT/g" "$APP_DIR/deploy/nginx.conf" > "$CONF"
    log "config nginx scris în $CONF"
  else
    log "păstrez $CONF (conține deja HTTPS)"
  fi
  nginx -t && systemctl reload nginx
  if [ -n "${EMAIL:-}" ] && command -v certbot >/dev/null && ! grep -q ssl_certificate "$CONF"; then
    log "cer certificat HTTPS pentru $DOMAIN"
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect || log "certbot a eșuat (DNS-ul pointează spre server?) — site-ul rămâne pe HTTP"
  fi
  log "gata: http://$DOMAIN  (DNS-ul pentru $DOMAIN trebuie să pointeze spre acest server)"
fi

log "verificare surse (opțional, ~1–2 min): cd $APP_DIR && DATA_DIR=$DATA_DIR node scripts/check-sources.js --disable-failing"
