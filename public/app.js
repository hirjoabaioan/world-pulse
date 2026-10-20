/* World Pulse – client (no framework, D3 globe). */
(function () {
  'use strict';

  var LAYERS = ['conflict', 'disaster', 'official', 'news']; // order = point draw/pick priority
  var CATEGORY_LABEL = {
    conflict: 'Conflict', disaster: 'Disaster', health: 'Health',
    politics: 'Politics', economy: 'Economy', general: 'General',
  };
  var NEWS_TOPIC_LABEL = {
    politics: 'Politics',
    business_economy: 'Business / economy',
    technology: 'Technology',
    science: 'Science',
    sports: 'Sports',
    entertainment_culture: 'Entertainment / culture',
    environment_climate: 'Environment / climate',
    crime_justice: 'Crime / justice',
    education: 'Education',
    religion: 'Religion',
    other: 'Other news',
  };
  var CONFLICT_TYPE_LABEL = {
    interstate_war: 'Interstate war',
    civil_war: 'Civil war',
    insurgency: 'Insurgency / rebellion',
    terrorism: 'Terrorism',
    ethnic_religious: 'Ethnic / religious violence',
    organized_crime: 'Organized crime / gang violence',
    coup_unrest: 'Coup / political violence / unrest',
    border_dispute: 'Border / territorial dispute',
    occupation: 'Occupation / annexation',
    ceasefire_diplomacy: 'Ceasefire / peace process',
    other: 'Other conflict',
  };
  var css = getComputedStyle(document.documentElement);
  var COLORS = {};
  LAYERS.forEach(function (l) { COLORS[l] = css.getPropertyValue('--' + l).trim(); });
  var LAND_COLOR = css.getPropertyValue('--land').trim();
  var PANEL2_COLOR = css.getPropertyValue('--panel-2').trim();

  var REFRESH_MS = 2 * 60 * 1000;
  var state = {
    events: [],
    active: new Set(LAYERS),
    hours: 24,
    severity: 0,
    conflictType: '',
    newsTopic: '',
    country: '',
    countryName: '',
    source: '',
    sort: 'newest',
    q: '',
  };

  // Per-user preferences (optional; the app works fine without storage)
  try {
    var saved = JSON.parse(localStorage.getItem('wp:prefs') || 'null');
    if (saved) {
      if (Array.isArray(saved.active)) state.active = new Set(saved.active.filter(function (l) { return LAYERS.indexOf(l) >= 0; }));
      if (saved.hours) state.hours = saved.hours;
      if (saved.severity != null) state.severity = saved.severity;
    }
  } catch (e) { /* ignored */ }
  function savePrefs() {
    try {
      localStorage.setItem('wp:prefs', JSON.stringify({ active: Array.from(state.active), hours: state.hours, severity: state.severity }));
    } catch (e) { /* ignored */ }
  }

  // ---------------------------------------------------------------- Utilities
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function safeUrl(u) {
    return /^https?:\/\//i.test(u || '') ? u : '#';
  }
  function ago(iso) {
    var diff = (Date.now() - Date.parse(iso)) / 60000;
    if (diff < 1) return 'just now';
    if (diff < 60) return Math.round(diff) + ' min ago';
    if (diff < 48 * 60) return Math.round(diff / 60) + ' h ago';
    return new Date(iso).toLocaleString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
  function primaryLayer(ev) {
    for (var i = 0; i < LAYERS.length; i++) {
      if (state.active.has(LAYERS[i]) && ev.layers.indexOf(LAYERS[i]) >= 0) return LAYERS[i];
    }
    return null;
  }
  function sevDots(s) {
    return s >= 2 ? '<span class="sev" title="severity ' + s + '/3">' + '●'.repeat(s - 1) + '</span>' : '';
  }

  // ---------------------------------------------------------------- Filtering
  function filtered() {
    var q = state.q.toLowerCase();
    return state.events.filter(function (ev) {
      if (!primaryLayer(ev)) return false;
      if (ev.severity < state.severity) return false;
      if (state.conflictType && (ev.category !== 'conflict' || ev.conflictType !== state.conflictType)) return false;
      if (state.newsTopic && ev.newsTopic !== state.newsTopic) return false;
      if (state.country && ev.country !== state.country) return false;
      if (state.source && !ev.sources.some(function (s) { return s.id === state.source; })) return false;
      if (q && (ev.title + ' ' + ev.summary + ' ' + (ev.place || '')).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
  }
  // Events that get an individual point on the globe. News is aggregated per-country as a
  // choropleth instead (a global feed produces far too many co-located points to plot usefully) —
  // an event still gets a point if its PRIMARY layer is conflict/disaster/official even when it also
  // came from a news source (e.g. a war news article promoted into the conflict layer by category).
  function pointEvents(list) {
    return list.filter(function (ev) { return primaryLayer(ev) !== 'news'; });
  }
  function newsCountsByCountry(list) {
    var counts = {};
    list.forEach(function (ev) {
      if (primaryLayer(ev) !== 'news' || !ev.country) return;
      counts[ev.country] = (counts[ev.country] || 0) + 1;
    });
    return counts;
  }
  function sortEvents(list) {
    var out = list.slice();
    if (state.sort === 'oldest') out.sort(function (a, b) { return a.publishedAt < b.publishedAt ? -1 : 1; });
    else if (state.sort === 'severity') out.sort(function (a, b) { return b.severity - a.severity || (a.publishedAt < b.publishedAt ? 1 : -1); });
    else out.sort(function (a, b) { return a.publishedAt < b.publishedAt ? 1 : -1; }); // newest first
    return out;
  }

  // ---------------------------------------------------------------- Globe
  var globeEl = document.getElementById('globe');
  var svg = d3.select(globeEl).append('svg');
  var sphereG = svg.append('g');
  var graticuleG = svg.append('g');
  var countriesG = svg.append('g');
  var pointsG = svg.append('g');
  var lightingCircle = svg.append('circle').attr('class', 'globe-lighting');
  var width = 0, height = 0;
  var baseScale = 200;
  var projection = d3.geoOrthographic().clipAngle(90).precision(0.4).rotate([-10, -25]);
  var pathGen = d3.geoPath(projection);
  var graticule = d3.geoGraticule();
  var countries = []; // [{...geojson feature, iso}]
  var countriesReady = false;

  // Radial gradient (lit from the upper-left) instead of a flat fill — see the CSS comment on
  // .globe-sphere for why a flat fill made the globe look like a see-through disc, not a solid ball.
  var defs = svg.append('defs');
  var sphereGradient = defs.append('radialGradient')
    .attr('id', 'globe-sphere-gradient')
    .attr('cx', '35%').attr('cy', '32%').attr('r', '75%');
  sphereGradient.append('stop').attr('offset', '0%').attr('stop-color', '#24354d');
  sphereGradient.append('stop').attr('offset', '60%').attr('stop-color', '#111a29');
  sphereGradient.append('stop').attr('offset', '100%').attr('stop-color', '#060a10');
  // Same lighting direction, applied ON TOP of countries+points via mix-blend-mode so land masses
  // get the same sense of volume as the ocean, not just a flat fill.
  var lightingGradient = defs.append('radialGradient')
    .attr('id', 'globe-lighting-gradient')
    .attr('cx', '35%').attr('cy', '32%').attr('r', '75%');
  lightingGradient.append('stop').attr('offset', '0%').attr('stop-color', '#ffffff').attr('stop-opacity', '0.18');
  lightingGradient.append('stop').attr('offset', '55%').attr('stop-color', '#ffffff').attr('stop-opacity', '0');
  lightingGradient.append('stop').attr('offset', '100%').attr('stop-color', '#000000').attr('stop-opacity', '0.45');
  lightingCircle.attr('fill', 'url(#globe-lighting-gradient)').style('mix-blend-mode', 'overlay').style('pointer-events', 'none');

  sphereG.append('path').datum({ type: 'Sphere' }).attr('class', 'globe-sphere');
  graticuleG.append('path').attr('class', 'globe-graticule');

  function resizeGlobe() {
    width = globeEl.clientWidth;
    height = globeEl.clientHeight;
    svg.attr('viewBox', '0 0 ' + width + ' ' + height);
    baseScale = Math.min(width, height) / 2 - 8;
    projection.translate([width / 2, height / 2]).scale(baseScale * currentZoomK);
    renderFrame();
  }

  var currentZoomK = 1;
  var zoom = d3.zoom()
    .scaleExtent([0.6, 6])
    .filter(function (event) { return event.type === 'wheel' || event.type === 'dblclick'; })
    .on('zoom', function (event) {
      currentZoomK = event.transform.k;
      projection.scale(baseScale * currentZoomK);
      renderFrame();
    });
  svg.call(zoom);

  var drag = d3.drag().on('drag', function (event) {
    var sensitivity = 75 / projection.scale();
    var r = projection.rotate();
    var nextPhi = r[1] - event.dy * sensitivity;
    projection.rotate([r[0] + event.dx * sensitivity, Math.max(-90, Math.min(90, nextPhi))]);
    renderFrame();
    hidePointPopup();
  });
  svg.call(drag);

  function drawCountries() {
    var sel = countriesG.selectAll('path.country-path').data(countries, function (f) { return f.id; });
    sel.exit().remove();
    var enter = sel.enter().append('path').attr('class', 'country-path');
    enter.append('title');
    enter.on('click', function (event, f) {
      if (f.iso) applyCountryFilter(f.iso, f.properties.name);
    });
    countriesReady = true;
    renderFrame();
  }

  function newsColorScale(max) {
    var domainMax = Math.sqrt(Math.max(1, max));
    var interp = d3.interpolate(PANEL2_COLOR, COLORS.news);
    return function (count) { return interp(Math.min(1, Math.sqrt(count) / domainMax)); };
  }

  var legendEl = null;
  function updateLegend(showChoropleth, max) {
    if (!legendEl) {
      legendEl = document.createElement('div');
      legendEl.className = 'legend';
      globeEl.appendChild(legendEl);
    }
    if (!showChoropleth) { legendEl.hidden = true; return; }
    legendEl.hidden = false;
    legendEl.innerHTML = 'Fewer news <span class="swatches">' +
      '<span style="background:' + PANEL2_COLOR + '"></span>' +
      '<span style="background:' + d3.interpolate(PANEL2_COLOR, COLORS.news)(0.5) + '"></span>' +
      '<span style="background:' + COLORS.news + '"></span>' +
      '</span> More news (max ' + max + ')';
  }

  function renderFrame() {
    sphereG.select('path').attr('d', pathGen);
    graticuleG.select('path').attr('d', pathGen(graticule()));
    var center = projection.translate();
    lightingCircle.attr('cx', center[0]).attr('cy', center[1]).attr('r', projection.scale());

    if (countriesReady) {
      var showChoropleth = state.active.has('news');
      var counts = showChoropleth ? newsCountsByCountry(filtered()) : {};
      var max = Math.max(0, ...Object.values(counts));
      var scale = max > 0 ? newsColorScale(max) : null;
      updateLegend(showChoropleth && max > 0, max);

      countriesG.selectAll('path.country-path')
        .attr('d', pathGen)
        .classed('selected', function (f) { return !!f.iso && f.iso === state.country; })
        .style('fill', function (f) {
          // .style (inline), not .attr: the .country-path CSS rule's `fill: var(--land)` otherwise
          // wins over an SVG presentation attribute — only an inline style outranks a class rule.
          if (scale && f.iso && counts[f.iso]) return scale(counts[f.iso]);
          return null; // removes the inline style, falls back to CSS var(--land)
        })
        .select('title')
        .text(function (f) {
          var n = counts[f.iso] || 0;
          return f.properties.name + (showChoropleth ? ' — ' + n + ' news' : '');
        });
    }

    var points = pointEvents(filtered()).filter(function (ev) { return ev.lat != null; });
    var psel = pointsG.selectAll('circle.event-point').data(points, function (ev) { return ev.id; });
    psel.exit().remove();
    var pEnter = psel.enter().append('circle').attr('class', 'event-point')
      .on('click', function (event, ev) { event.stopPropagation(); showPointPopup(ev, event); });
    var pMerged = pEnter.merge(psel);
    var rotate = projection.rotate();
    var viewCenter = [-rotate[0], -rotate[1]]; // the [lon,lat] currently facing the viewer
    pMerged.each(function (ev) {
      var el = d3.select(this);
      // projection([lon,lat]) is the raw math projection — it does NOT hide far-side points on its
      // own (clipAngle only affects path/line clipping, e.g. country borders, not point coordinates).
      // A point 90°+ of great-circle distance from what's currently facing the viewer is on the back
      // of the globe and must be hidden explicitly, or it "shows through" when rotating.
      if (d3.geoDistance([ev.lon, ev.lat], viewCenter) > Math.PI / 2 - 0.02) { el.attr('display', 'none'); return; }
      var p = projection([ev.lon, ev.lat]);
      if (!p) { el.attr('display', 'none'); return; }
      el.attr('display', null)
        .attr('cx', p[0]).attr('cy', p[1])
        .attr('r', 5 + ev.severity * 1.8)
        .attr('fill', COLORS[primaryLayer(ev)]);
    });
  }

  // ---------------------------------------------------------------- Point popup (replaces Leaflet popup)
  var popupEl = null;
  function popupHtml(ev) {
    return (
      '<button type="button" class="popup-close" aria-label="Close">×</button>' +
      '<h3><a href="' + esc(safeUrl(ev.url)) + '" target="_blank" rel="noopener noreferrer">' + esc(ev.title) + '</a></h3>' +
      '<div class="meta">' +
      '<span class="badge" style="--c:' + COLORS[primaryLayer(ev)] + '">' + esc(CATEGORY_LABEL[ev.category] || ev.category) + '</span>' +
      (ev.conflictType ? '<span class="badge">' + esc(CONFLICT_TYPE_LABEL[ev.conflictType] || ev.conflictType) + '</span>' : '') +
      (ev.newsTopic ? '<span class="badge">' + esc(NEWS_TOPIC_LABEL[ev.newsTopic] || ev.newsTopic) + '</span>' : '') +
      '<span>' + esc(ago(ev.publishedAt)) + '</span>' +
      (ev.place ? '<span>📍 ' + esc(ev.place) + (ev.geoPrecision === 'country' ? ' (approx.)' : '') + '</span>' : '') +
      '</div>' +
      (ev.summary ? '<p>' + esc(ev.summary) + '</p>' : '') +
      '<div class="meta">Source: ' + ev.sources.map(function (s) { return esc(s.name); }).join(', ') + '</div>' +
      (ev.country
        ? '<div class="meta"><button type="button" class="country-link" data-country="' + esc(ev.country) +
          '" data-name="' + esc(ev.place || ev.country) + '">See all news from ' + esc(ev.place || ev.country) + ' →</button></div>'
        : '') +
      '<div class="social-section">' +
      '<button type="button" class="social-toggle" data-id="' + esc(ev.id) + '">Show related social posts ▾</button>' +
      '<div class="social-results" hidden></div>' +
      '</div>'
    );
  }
  function socialPostHtml(p) {
    var meta = p.type === 'bluesky'
      ? (p.author ? esc(p.author) + (p.handle ? ' (@' + esc(p.handle) + ')' : '') : 'Bluesky')
      : esc(p.channel || 'YouTube');
    var text = p.type === 'bluesky' ? esc(p.text || '') : esc(p.title || '');
    return (
      '<a class="social-post" href="' + esc(safeUrl(p.url)) + '" target="_blank" rel="noopener noreferrer">' +
      (p.image ? '<img src="' + esc(p.image) + '" alt="">' : '<span class="social-noimg">' + (p.type === 'youtube' ? '▶' : '🦋') + '</span>') +
      '<span class="social-body"><b>' + meta + '</b><span>' + text + '</span></span>' +
      '</a>'
    );
  }
  function loadSocialPosts(container, id) {
    container.hidden = false;
    container.innerHTML = '<p class="social-loading">Searching Bluesky &amp; YouTube…</p>';
    fetch('api/social?id=' + encodeURIComponent(id))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var posts = (data.bluesky || []).concat(data.youtube || []);
        if (!posts.length) {
          container.innerHTML = '<p class="social-loading">No related social posts found' +
            (!data.bluesky || !data.youtube ? ' (or not configured on this server)' : '') + '.</p>';
          return;
        }
        container.innerHTML = posts.map(socialPostHtml).join('');
      })
      .catch(function () {
        container.innerHTML = '<p class="social-loading">Could not load social posts.</p>';
      });
  }
  function wirePopupInteractions(root) {
    var closeBtn = root.querySelector('.popup-close');
    if (closeBtn) closeBtn.addEventListener('click', hidePointPopup);
    var socialBtn = root.querySelector('.social-toggle');
    if (socialBtn) {
      socialBtn.addEventListener('click', function () {
        var container = root.querySelector('.social-results');
        if (!container.hidden) { container.hidden = true; return; }
        loadSocialPosts(container, socialBtn.getAttribute('data-id'));
      });
    }
  }
  function showPointPopup(ev, event) {
    hidePointPopup();
    popupEl = document.createElement('div');
    popupEl.className = 'point-popup';
    popupEl.innerHTML = popupHtml(ev);
    globeEl.appendChild(popupEl);
    var rect = globeEl.getBoundingClientRect();
    if (event) {
      var x = event.clientX - rect.left;
      var y = event.clientY - rect.top;
      var maxLeft = rect.width - popupEl.offsetWidth - 8;
      popupEl.style.left = Math.max(8, Math.min(x + 10, maxLeft)) + 'px';
      popupEl.style.top = Math.max(8, y - 10) + 'px';
    } else {
      popupEl.style.left = Math.max(8, (rect.width - popupEl.offsetWidth) / 2) + 'px';
      popupEl.style.top = '16px';
    }
    wirePopupInteractions(popupEl);
  }
  function hidePointPopup() {
    if (popupEl) { popupEl.remove(); popupEl = null; }
  }
  globeEl.addEventListener('click', function (e) {
    if (e.target === globeEl || e.target.tagName === 'svg') hidePointPopup();
  });

  // ---------------------------------------------------------------- Country selection panel
  var countryFilterEl = document.getElementById('country-filter');
  var countryFilterLabelEl = document.getElementById('country-filter-label');
  var countryFilterSourceEl = document.getElementById('country-filter-source');
  var countryFilterSearchEl = document.getElementById('country-filter-search');
  var mainSearchEl = document.getElementById('search');

  function applyCountryFilter(iso, name) {
    state.country = iso;
    state.countryName = name || iso;
    state.source = '';
    updateCountryChip();
    render();
  }
  function clearCountryFilter() {
    state.country = '';
    state.countryName = '';
    state.source = '';
    updateCountryChip();
    render();
  }
  function updateCountryChip() {
    if (!state.country) {
      countryFilterEl.hidden = true;
      return;
    }
    countryFilterEl.hidden = false;
    var inCountry = state.events.filter(function (ev) { return ev.country === state.country; });
    countryFilterLabelEl.textContent = state.countryName + ' — ' + inCountry.length + (inCountry.length === 1 ? ' event' : ' events');
    var sources = new Map();
    inCountry.forEach(function (ev) { ev.sources.forEach(function (s) { sources.set(s.id, s.name); }); });
    var current = state.source;
    countryFilterSourceEl.innerHTML = '<option value="">all</option>';
    Array.from(sources.entries()).sort(function (a, b) { return a[1].localeCompare(b[1]); }).forEach(function (entry) {
      var opt = document.createElement('option');
      opt.value = entry[0];
      opt.textContent = entry[1];
      countryFilterSourceEl.appendChild(opt);
    });
    countryFilterSourceEl.value = sources.has(current) ? current : '';
    state.source = countryFilterSourceEl.value;
    countryFilterSearchEl.value = state.q;
  }
  countryFilterSourceEl.addEventListener('change', function () {
    state.source = countryFilterSourceEl.value;
    render();
  });
  var countrySearchT;
  countryFilterSearchEl.addEventListener('input', function (e) {
    clearTimeout(countrySearchT);
    countrySearchT = setTimeout(function () {
      state.q = e.target.value.trim();
      mainSearchEl.value = state.q; // keep the header search box in sync
      render();
    }, 200);
  });
  document.getElementById('country-filter-clear').addEventListener('click', clearCountryFilter);
  // Delegated: the "See all news from X →" link lives inside a dynamically-created popup.
  document.addEventListener('click', function (e) {
    var el = e.target.closest('.country-link');
    if (el) { applyCountryFilter(el.getAttribute('data-country'), el.getAttribute('data-name')); hidePointPopup(); }
  });

  // ---------------------------------------------------------------- Feed list
  var feedList = document.getElementById('feed-list');
  function renderFeed() {
    var list = sortEvents(filtered());
    document.getElementById('feed-count').textContent = list.length + (list.length === 1 ? ' event' : ' events');
    if (!list.length) {
      feedList.innerHTML = '<li class="empty">No events match the selected filters.</li>';
      return;
    }
    feedList.innerHTML = list.slice(0, 400).map(function (ev) {
      var layer = primaryLayer(ev);
      return (
        '<li class="item" tabindex="0" data-id="' + esc(ev.id) + '" style="--c:' + COLORS[layer] + '">' +
        '<h3>' + esc(ev.title) + '</h3>' +
        '<div class="meta">' +
        '<span class="badge">' + esc(CATEGORY_LABEL[ev.category] || ev.category) + '</span>' +
        (ev.conflictType ? '<span class="badge">' + esc(CONFLICT_TYPE_LABEL[ev.conflictType] || ev.conflictType) + '</span>' : '') +
        (ev.newsTopic ? '<span class="badge">' + esc(NEWS_TOPIC_LABEL[ev.newsTopic] || ev.newsTopic) + '</span>' : '') +
        sevDots(ev.severity) +
        '<span>' + esc(ago(ev.publishedAt)) + '</span>' +
        '<span>' + esc(ev.sources[0].name) + (ev.sources.length > 1 ? ' +' + (ev.sources.length - 1) : '') + '</span>' +
        (ev.place ? '<span>📍 ' + esc(ev.place) + '</span>' : '<span class="nogeo">no location</span>') +
        '</div></li>'
      );
    }).join('');
  }

  function focusEvent(id) {
    var ev = state.events.find(function (e) { return e.id === id; });
    if (!ev) return;
    if (ev.lat != null) {
      projection.rotate([-ev.lon, -ev.lat]);
      renderFrame();
    }
    showPointPopup(ev, null); // centered detail popup — also works for events with no coordinates
  }
  feedList.addEventListener('click', function (e) {
    var li = e.target.closest('.item');
    if (li) focusEvent(li.getAttribute('data-id'));
  });
  feedList.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    var li = e.target.closest('.item');
    if (li) focusEvent(li.getAttribute('data-id'));
  });

  function renderCounts() {
    var counts = { conflict: 0, news: 0, official: 0, disaster: 0 };
    state.events.forEach(function (ev) { ev.layers.forEach(function (l) { counts[l]++; }); });
    Object.keys(counts).forEach(function (l) {
      document.querySelector('[data-count="' + l + '"]').textContent = counts[l];
    });
  }

  function render() {
    renderCounts();
    renderFrame();
    renderFeed();
  }

  // ---------------------------------------------------------------- Data
  function load() {
    return fetch('api/events?limit=6000&hours=' + state.hours)
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (data) {
        state.events = data.events;
        document.getElementById('demo-banner').hidden = !data.demo;
        document.getElementById('updated').textContent = data.lastUpdate
          ? 'updated ' + ago(data.lastUpdate)
          : 'collecting data…';
        if (state.country) updateCountryChip();
        render();
        // On first start the server is still fetching sources — retry more often.
        if (!data.lastUpdate) setTimeout(load, 5000);
      })
      .catch(function (err) {
        document.getElementById('updated').textContent = 'load error (' + err.message + ')';
      });
  }

  function loadGlobeGeometry() {
    return Promise.all([
      fetch('vendor/countries-110m.json').then(function (r) { return r.json(); }),
      fetch('vendor/country-iso.json').then(function (r) { return r.json(); }),
    ]).then(function (res) {
      var topo = res[0], isoMap = res[1];
      var geo = topojson.feature(topo, topo.objects.countries);
      countries = geo.features.map(function (f) { return Object.assign({}, f, { iso: isoMap[f.id] || null }); });
      drawCountries();
    }).catch(function (err) {
      console.error('Failed to load globe geometry:', err);
    });
  }

  // ---------------------------------------------------------------- Controls
  document.querySelectorAll('.chip').forEach(function (btn) {
    var l = btn.getAttribute('data-layer');
    btn.setAttribute('aria-pressed', String(state.active.has(l)));
    btn.addEventListener('click', function () {
      if (state.active.has(l)) state.active.delete(l); else state.active.add(l);
      btn.setAttribute('aria-pressed', String(state.active.has(l)));
      savePrefs();
      render();
    });
  });
  var hoursEl = document.getElementById('hours');
  hoursEl.value = String(state.hours);
  hoursEl.addEventListener('change', function () { state.hours = Number(hoursEl.value); savePrefs(); load(); });
  var sevEl = document.getElementById('severity');
  sevEl.value = String(state.severity);
  sevEl.addEventListener('change', function () { state.severity = Number(sevEl.value); savePrefs(); render(); });
  var conflictTypeEl = document.getElementById('conflict-type');
  Object.keys(CONFLICT_TYPE_LABEL).forEach(function (k) {
    var opt = document.createElement('option');
    opt.value = k;
    opt.textContent = CONFLICT_TYPE_LABEL[k];
    conflictTypeEl.appendChild(opt);
  });
  conflictTypeEl.addEventListener('change', function () { state.conflictType = conflictTypeEl.value; render(); });
  var newsTopicEl = document.getElementById('news-topic');
  Object.keys(NEWS_TOPIC_LABEL).forEach(function (k) {
    var opt = document.createElement('option');
    opt.value = k;
    opt.textContent = NEWS_TOPIC_LABEL[k];
    newsTopicEl.appendChild(opt);
  });
  newsTopicEl.addEventListener('change', function () { state.newsTopic = newsTopicEl.value; render(); });
  document.getElementById('sort').addEventListener('change', function (e) { state.sort = e.target.value; renderFeed(); });
  var t;
  mainSearchEl.addEventListener('input', function (e) {
    clearTimeout(t);
    t = setTimeout(function () {
      state.q = e.target.value.trim();
      countryFilterSearchEl.value = state.q; // keep the country panel's search box in sync
      render();
    }, 200);
  });

  window.addEventListener('resize', resizeGlobe);
  resizeGlobe();
  loadGlobeGeometry();
  load();
  setInterval(load, REFRESH_MS);
})();
