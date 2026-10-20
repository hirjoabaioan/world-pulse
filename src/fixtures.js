'use strict';
// Încărcare fixture-uri (mod DEMO și teste). Fișierele conțin marcaje de timp relative,
// înlocuite la încărcare, ca datele demo să fie mereu „recente”:
//   {{RFC822:-90}}  → data de acum 90 de minute, format RSS (RFC 822)
//   {{ISO:-90}}     → ISO 8601
//   {{GDELT:-90}}   → 20260927T101500Z (formatul GDELT „seendate”)
//   {{MS:-90}}      → milisecunde epoch (USGS)
//   {{GDELT14:-90}} → 20260927101500 (GDELT Events DATEADDED)

const fs = require('fs');

function fmt(kind, date) {
  switch (kind) {
    case 'RFC822':
      return date.toUTCString();
    case 'ISO':
      return date.toISOString();
    case 'GDELT':
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    case 'MS':
      return String(date.getTime());
    case 'GDELT14':
      return date.toISOString().replace(/[-:T]/g, '').slice(0, 14);
    default:
      throw new Error(`Marcaj necunoscut: ${kind}`);
  }
}

function expandTimes(text, now = Date.now()) {
  return text.replace(/\{\{(RFC822|ISO|GDELT14|GDELT|MS):(-?\d+)\}\}/g, (_, kind, min) =>
    fmt(kind, new Date(now + Number(min) * 60000))
  );
}

function loadFixture(file, now = Date.now()) {
  return expandTimes(fs.readFileSync(file, 'utf8'), now);
}

module.exports = { loadFixture, expandTimes };
