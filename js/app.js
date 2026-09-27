import {
  SUBJECTS, REGIONS, METRICS, DEFAULT_FILTERS, escapeHTML as esc, icon, initials,
  readFilters, filterQuery, filterUniversities, loadData, readSaved, formatScore, metricValue, toCSV,
} from './utilities.js';
import { createMapView } from './map.js';

const isMap = document.body.dataset.view === 'map';
let filters = readFilters(location.search);
let rankings, countries, visible = [], mapView;
let saved;
try { saved = readSaved(localStorage); } catch { saved = new Set(); }
const compared = new Set();
const $ = selector => document.querySelector(selector);
const options = (values, selected) => Object.entries(values).map(([value, label]) =>
  `<option value="${esc(value)}" ${value === String(selected) ? 'selected' : ''}>${esc(label)}</option>`).join('');
const uniIndex = uni => rankings[filters.subject].indexOf(uni);

function layout() {
  $('#app').innerHTML = `
    <header class="site-header">
      <a class="brand" href="../index.html" aria-label="UNISEEK home"><span class="brand-mark">${icon('cap')}</span>uniseek<span class="brand-dot">.</span></a>
      <nav class="main-nav" aria-label="Main navigation">
        <a href="chart.html" data-view="chart" aria-label="Rankings" ${!isMap ? 'aria-current="page"' : ''}>${icon('chart')}<span>Rankings</span></a>
        <a href="map.html" data-view="map" aria-label="Explore map" ${isMap ? 'aria-current="page"' : ''}>${icon('globe')}<span>Explore map</span></a>
      </nav>
      <a class="header-saved" href="chart.html?saved=1" aria-label="Saved universities">${icon('bookmark')}<span>Saved</span><span id="saved-count" class="count-badge">${saved.size}</span></a>
    </header>
    <div class="workspace">
      <aside class="filter-sidebar" aria-label="University filters">
        <div class="sidebar-heading"><span>${icon('filter')} Refine your search</span><button class="text-button" data-action="reset" type="button">Reset</button></div>
        <button class="filter-toggle button" type="button" aria-expanded="false" aria-controls="filter-form">${icon('filter')} Filters <span id="filter-count"></span></button>
        <form id="filter-form" class="filter-form">
          <div class="field"><label for="select-subject">Subject area</label><select id="select-subject" name="subject">${options(SUBJECTS, filters.subject)}</select></div>
          <div class="field"><label for="select-region">Region</label><select id="select-region" name="region"><option value="">Anywhere in the world</option>${options(REGIONS, filters.region)}</select></div>
          <div class="field"><label for="select-country">Country / territory</label><select id="select-country" name="country"><option value="">All countries & territories</option></select></div>
          <fieldset class="rank-field"><legend>World rank</legend><div class="rank-inputs"><div><label for="select-rank-s">From</label><input id="select-rank-s" name="min" type="number" min="1" max="50" value="${filters.min}" required aria-describedby="rank-error"></div><span aria-hidden="true">—</span><div><label for="select-rank-e">To</label><input id="select-rank-e" name="max" type="number" min="1" max="50" value="${filters.max}" required aria-describedby="rank-error"></div></div><p id="rank-error" class="field-error" role="alert" hidden></p></fieldset>
          <div class="quick-ranks" aria-label="Quick rank filters"><button type="button" data-action="rank" data-max="10">Top 10</button><button type="button" data-action="rank" data-max="25">Top 25</button><button type="button" data-action="rank" data-max="50">Top 50</button></div>
          <label class="saved-filter"><input type="checkbox" name="saved" id="saved-only" ${filters.saved ? 'checked' : ''}> ${icon('bookmark')} My saved universities</label>
          <button type="submit" class="button button-primary mobile-apply">Show results ${icon('arrow')}</button>
        </form>
        <div class="sidebar-note"><span class="note-icon">${icon('book')}</span><h2>A starting point for your next chapter.</h2><p>Look beyond a single number. Explore locations, subjects, and the scores that matter to you.</p><a href="../index.html#about">About this project ${icon('arrow')}</a></div>
        <div class="sidebar-footer">Made for curious minds.<br><span>© 2022–2026 Jose Zhang Haozhe</span></div>
      </aside>
      <main class="explorer-main" id="main-content">
        <div class="page-heading"><div><p class="eyebrow">A WORLD OF POSSIBILITIES</p><h1>${isMap ? 'Your future, on the map.' : 'Find a university. Find your path.'}</h1><p class="page-description">${isMap ? 'Explore where the world’s leading universities call home.' : 'Explore the world’s leading universities and see what sets them apart.'}</p></div><span class="edition-badge"><span></span>2021 edition</span></div>
        <div class="stats-strip" aria-label="Results summary"><div><span class="stat-icon">${icon('cap')}</span><div><strong id="stat-universities">—</strong><span>universities</span></div></div><div><span class="stat-icon lilac">${icon('globe')}</span><div><strong id="stat-countries">—</strong><span>countries & territories</span></div></div><div><span class="stat-icon sand">${icon('book')}</span><div><strong id="stat-subject">Overall</strong><span>selected subject area</span></div></div></div>
        <section class="results-panel" aria-labelledby="results-heading" aria-busy="true">
          <div class="results-topline"><div><h2 id="results-heading">${isMap ? 'Explore universities' : 'University rankings'}</h2><p id="result-count" role="status">Loading the 2021 dataset…</p></div><div class="view-switch" aria-label="View"><a href="chart.html" data-view="chart" aria-label="Rankings view" ${!isMap ? 'aria-current="page"' : ''}>${icon('chart')}</a><a href="map.html" data-view="map" aria-label="Map view" ${isMap ? 'aria-current="page"' : ''}>${icon('globe')}</a></div></div>
          <div class="results-toolbar"><div class="search-field">${icon('search')}<label class="sr-only" for="university-search">Search universities</label><input id="university-search" type="search" placeholder="Search a university…" value="${esc(filters.q)}" maxlength="200" autocomplete="off"></div><div class="sort-field"><label for="sort">Sort by</label><select id="sort">${options({rank:'World rank',score:'Overall score',academic:'Academic reputation',employer:'Employer reputation',name:'Name A–Z'}, filters.sort)}</select></div><button class="icon-button export-button" data-action="export" aria-label="Download results as CSV" title="Download results as CSV" disabled>${icon('download')}</button></div>
          <div id="active-filters" class="active-filters" aria-label="Active filters"></div>
          <div id="results-body"><div class="loading-state"><div class="loading-dot"></div>Finding your possibilities…</div></div>
        </section>
        <p class="data-note">${icon('book')} Historical data from the bundled QS 2021 dataset. Scores are shown as recorded, on a 0–100 scale. This is not a current ranking.</p>
      </main>
    </div>
    <div id="compare-tray" class="compare-tray" aria-label="Comparison selection" hidden></div>
    <dialog id="detail-dialog" aria-labelledby="dialog-title"><div id="dialog-content"></div></dialog>
    <div class="toast" id="toast" role="status" hidden></div>`;
}

function saveButton(uni) {
  const selected = saved.has(uni.Institution);
  return `<button class="icon-button save-button ${selected ? 'is-saved' : ''}" data-action="save" data-index="${uniIndex(uni)}" aria-label="${selected ? 'Unsave' : 'Save'} ${esc(uni.Institution)}" aria-pressed="${selected}" title="${selected ? 'Remove from saved' : 'Save university'}">${icon('bookmark')}</button>`;
}

function compareCheckbox(uni) {
  return `<input type="checkbox" class="compare-checkbox" data-action="compare" data-index="${uniIndex(uni)}" aria-label="Compare ${esc(uni.Institution)}" ${compared.has(uni.Institution) ? 'checked' : ''}>`;
}

function universityIdentity(uni) {
  return `<span class="university-avatar tone-${uniIndex(uni) % 4}" aria-hidden="true">${esc(initials(uni.Institution))}</span><div><button class="university-name" data-action="detail" data-index="${uniIndex(uni)}">${esc(uni.Institution)}</button><span class="university-subtitle">${esc(uni.Location)}</span></div>`;
}

function scoreBar(value, className = '') {
  return `<span class="score-bar ${className}" aria-hidden="true"><span style="width:${Math.max(0, Math.min(100, metricValue(value) ?? 0))}%"></span></span>`;
}

function renderTable() {
  return `<div class="table-scroll" tabindex="0" role="region" aria-label="University rankings table"><table class="ranking-table"><caption class="sr-only">${esc(SUBJECTS[filters.subject])}, 2021. Select up to three universities to compare.</caption><thead><tr><th scope="col"><span class="sr-only">Compare</span></th><th scope="col">Rank</th><th scope="col">University</th><th scope="col" class="country-column">Country / territory</th><th scope="col">Overall score</th><th scope="col"><span class="sr-only">Save</span></th></tr></thead><tbody>${visible.map(uni => `<tr><td>${compareCheckbox(uni)}</td><td><span class="rank-badge ${Number(uni['2021']) <= 3 ? 'top-rank' : ''}">${esc(uni['2021'])}</span></td><td><div class="university-identity">${universityIdentity(uni)}</div></td><td class="country-column"><span class="country-code">${esc(countries.country_code[0][uni.Location]?.toUpperCase())}</span>${esc(uni.Location)}</td><td><div class="score-cell"><strong>${formatScore(uni.Score)}</strong>${scoreBar(uni.Score)}</div></td><td>${saveButton(uni)}</td></tr>`).join('')}</tbody></table></div><div class="table-footer"><span>Showing all ${visible.length} ${visible.length === 1 ? 'result' : 'results'}</span><span>${icon('compare')} Select up to 3 to compare</span></div>`;
}

function renderMapList() {
  return visible.map(uni => `<article class="map-result"><div class="map-result-heading"><span class="rank-badge">${esc(uni['2021'])}</span><span class="map-score">${formatScore(uni.Score)}<small> / 100</small></span>${saveButton(uni)}</div><button class="university-name" data-action="locate" data-index="${uniIndex(uni)}">${esc(uni.Institution)}</button><p>${icon('pin')} ${esc(uni.Location)}</p><div class="map-result-actions"><label>${compareCheckbox(uni)} Compare</label><button class="text-button" data-action="detail" data-index="${uniIndex(uni)}">View scores ${icon('arrow')}</button></div></article>`).join('');
}

function render() {
  visible = filterUniversities(rankings, filters, countries.region[0], saved);
  $('#stat-universities').textContent = visible.length;
  $('#stat-countries').textContent = new Set(visible.map(uni => uni.Location)).size;
  $('#stat-subject').textContent = SUBJECTS[filters.subject].replace(' rankings', '');
  $('#result-count').textContent = `${visible.length} ${visible.length === 1 ? 'university' : 'universities'} · ${SUBJECTS[filters.subject]} · 2021`;
  $('.results-panel').setAttribute('aria-busy', 'false');
  $('.export-button').disabled = !visible.length;
  if (!isMap) $('#results-body').innerHTML = visible.length ? renderTable() : emptyState();
  else {
    if (!$('#map')) {
      $('#results-body').innerHTML = '<div class="map-layout"><div id="map-results" class="map-results" aria-label="University results"></div><div class="map-container"><div id="map" aria-label="University locations" tabindex="0"></div><button class="button map-fit" data-action="fit">Show all results</button><p id="map-status" class="map-status" role="status" hidden></p></div></div>';
      mapView = createMapView($('#map'), $('#map-status'));
    }
    $('#map-results').innerHTML = visible.length ? renderMapList() : emptyState();
    mapView.render(visible, uni => `<div class="map-popup"><span class="eyebrow">${esc(SUBJECTS[filters.subject])} · 2021</span><h3>${esc(uni.Institution)}</h3><p>#${esc(uni['2021'])} · ${esc(uni.Location)}</p><p class="popup-score">${formatScore(uni.Score)} <span>overall score</span></p><button class="button button-primary" data-action="detail" data-index="${uniIndex(uni)}">View all scores</button></div>`);
  }
  renderChips();
  updateLinks();
  updateSelection();
}

function emptyState() {
  return `<div class="empty-state">${icon(filters.saved ? 'bookmark' : 'search')}<h3>${filters.saved ? 'Your next chapter starts with a save.' : 'No universities found.'}</h3><p>${filters.saved ? 'Use the bookmark icon to save universities. Try clearing other filters if you already have a shortlist.' : 'Try another name, a wider rank range, or a different country.'}</p><button class="button" data-action="reset">Reset filters</button></div>`;
}

function updateLinks() {
  const query = filterQuery(filters);
  document.querySelectorAll('[data-view]').forEach(link => { link.href = `${link.dataset.view}.html${query}`; });
  history.replaceState(null, '', `${location.pathname}${query}`);
}

function renderChips() {
  const chips = [];
  if (filters.country) chips.push(['country', filters.country]);
  if (filters.region) chips.push(['region', REGIONS[filters.region]]);
  if (filters.min !== 1 || filters.max !== 50) chips.push(['rank', `Rank ${filters.min}–${filters.max}`]);
  if (filters.q) chips.push(['q', `“${filters.q}”`]);
  if (filters.saved) chips.push(['saved', 'Saved universities']);
  $('#active-filters').innerHTML = chips.map(([key, label]) => `<button class="filter-chip" data-action="remove-filter" data-key="${key}" aria-label="Remove ${esc(label)} filter">${esc(label)} ${icon('close')}</button>`).join('');
  $('#active-filters').hidden = !chips.length;
  $('#filter-count').textContent = chips.length ? `(${chips.length})` : '';
  document.querySelectorAll('[data-action="rank"]').forEach(button => button.setAttribute('aria-pressed', String(filters.min === 1 && filters.max === Number(button.dataset.max))));
}

function syncForm() {
  for (const key of ['subject', 'country', 'region', 'min', 'max']) $('#filter-form').elements[key].value = filters[key];
  $('#saved-only').checked = filters.saved;
  $('#university-search').value = filters.q;
  $('#sort').value = filters.sort;
  $('#rank-error').hidden = true;
  for (const id of ['#select-rank-s', '#select-rank-e']) $(id).removeAttribute('aria-invalid');
}

function applyFilters() {
  const form = $('#filter-form');
  const min = Number(form.elements.min.value), max = Number(form.elements.max.value);
  const valid = Number.isInteger(min) && Number.isInteger(max) && min >= 1 && max <= 50 && min <= max;
  $('#rank-error').hidden = valid;
  for (const id of ['#select-rank-s', '#select-rank-e']) $(id).setAttribute('aria-invalid', String(!valid));
  if (!valid) { $('#rank-error').textContent = 'Choose a range from 1 to 50, with “From” no greater than “To”.'; return false; }
  if (filters.subject !== form.elements.subject.value) {
    if (compared.size) announce('Comparison cleared for the new subject area.');
    compared.clear();
  }
  filters = { subject: form.elements.subject.value, country: form.elements.country.value,
    region: form.elements.region.value, min, max, q: $('#university-search').value,
    sort: $('#sort').value, saved: $('#saved-only').checked };
  render();
  return true;
}

function updateSelection() {
  $('#saved-count').textContent = saved.size;
  document.querySelectorAll('.save-button').forEach(button => {
    const uni = rankings[filters.subject][Number(button.dataset.index)];
    const selected = saved.has(uni.Institution);
    button.classList.toggle('is-saved', selected);
    button.setAttribute('aria-pressed', String(selected));
    button.setAttribute('aria-label', `${selected ? 'Unsave' : 'Save'} ${uni.Institution}`);
    button.title = selected ? 'Remove from saved' : 'Save university';
  });
  document.querySelectorAll('.compare-checkbox').forEach(input => {
    input.checked = compared.has(rankings[filters.subject][Number(input.dataset.index)].Institution);
  });
  const tray = $('#compare-tray');
  tray.hidden = compared.size === 0;
  document.body.classList.toggle('has-comparison', compared.size > 0);
  tray.innerHTML = `<div class="compare-summary"><span class="compare-symbol">${icon('compare')}</span><div><strong>${compared.size} of 3 selected</strong><span>Compare within ${esc(SUBJECTS[filters.subject])}</span></div></div><div class="compare-names">${[...compared].map(name => `<button data-action="uncompare" data-name="${esc(name)}" title="Remove ${esc(name)}" aria-label="Remove ${esc(name)} from comparison">${esc(initials(name))}${icon('close')}</button>`).join('')}</div><button class="text-button" data-action="clear-compare">Clear</button><button class="button button-primary" data-action="open-compare" ${compared.size < 2 ? 'disabled' : ''}>Compare${compared.size > 1 ? ` (${compared.size})` : ''} ${icon('arrow')}</button>`;
}

function openDialog(content) {
  $('#dialog-content').innerHTML = `<button class="icon-button dialog-close" data-action="close-dialog" aria-label="Close dialog">${icon('close')}</button>${content}`;
  $('#detail-dialog').showModal();
}

function showDetails(uni) {
  openDialog(`<p class="eyebrow">${esc(SUBJECTS[filters.subject])} · 2021 EDITION</p><span class="university-avatar large tone-${uniIndex(uni) % 4}">${esc(initials(uni.Institution))}</span><h2 id="dialog-title">${esc(uni.Institution)}</h2><p class="detail-location">${icon('pin')} ${esc(uni.Location)} <span>World rank #${esc(uni['2021'])}</span></p><div class="metric-list">${METRICS.map(([key, label]) => `<div class="metric-row"><div><span>${label}</span><strong>${formatScore(uni[key])}</strong></div>${scoreBar(uni[key], key === 'Score' ? '' : 'secondary')}</div>`).join('')}</div><p class="dialog-note">Scores from the bundled 2021 dataset, shown as recorded. Subject categories use different methodologies; compare universities within the same subject.</p><div class="detail-actions">${saveButton(uni)}<span>Save to your shortlist</span></div>`);
}

function showComparison() {
  const unis = rankings[filters.subject].filter(uni => compared.has(uni.Institution));
  if (unis.length < 2) return;
  openDialog(`<p class="eyebrow">A CLOSER LOOK · 2021 EDITION</p><h2 id="dialog-title">Different strengths. Your choice.</h2><p class="dialog-note">${esc(SUBJECTS[filters.subject])} · Compare scores on the same 0–100 scale.</p><div class="comparison-scroll" tabindex="0" role="region" aria-label="University score comparison"><table class="comparison-table"><thead><tr><th scope="col">University</th>${unis.map(uni => `<th scope="col"><span class="university-avatar tone-${uniIndex(uni) % 4}">${esc(initials(uni.Institution))}</span>${esc(uni.Institution)}<small>${esc(uni.Location)} · #${esc(uni['2021'])}</small></th>`).join('')}</tr></thead><tbody>${METRICS.map(([key, label]) => {
    const highest = Math.max(...unis.map(uni => metricValue(uni[key]) ?? -Infinity));
    return `<tr><th scope="row">${label}</th>${unis.map(uni => `<td class="${metricValue(uni[key]) === highest ? 'highest-score' : ''}"><strong>${formatScore(uni[key])}</strong>${scoreBar(uni[key])}${metricValue(uni[key]) === highest ? '<span class="sr-only">Highest in this comparison</span>' : ''}</td>`).join('')}</tr>`;
  }).join('')}</tbody></table></div><p class="dialog-note">Highlighted values are the highest in this selection. Rankings are one part of finding the right university for you.</p>`);
}

let toastTimer;
function announce(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 4500);
}

function handleAction(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const uni = rankings?.[filters.subject][Number(button.dataset.index)];
  switch (button.dataset.action) {
    case 'reset': filters = { ...DEFAULT_FILTERS }; compared.clear(); syncForm(); render(); break;
    case 'rank': $('#select-rank-s').value = 1; $('#select-rank-e').value = button.dataset.max; applyFilters(); break;
    case 'remove-filter': {
      const key = button.dataset.key;
      if (key === 'rank') { filters.min = 1; filters.max = 50; } else filters[key] = DEFAULT_FILTERS[key];
      syncForm(); render(); break;
    }
    case 'save': {
      saved.has(uni.Institution) ? saved.delete(uni.Institution) : saved.add(uni.Institution);
      let persisted = true;
      try { localStorage.setItem('uniseek:saved', JSON.stringify([...saved])); } catch { persisted = false; }
      announce(persisted ? (saved.has(uni.Institution) ? 'University added to your shortlist.' : 'University removed from your shortlist.') : 'Saved for this session. Browser storage is unavailable.');
      filters.saved ? render() : updateSelection(); break;
    }
    case 'compare':
      if (compared.has(uni.Institution)) compared.delete(uni.Institution);
      else if (compared.size < 3) compared.add(uni.Institution);
      else announce('You can compare up to 3 universities. Remove one to add another.');
      updateSelection(); break;
    case 'uncompare': compared.delete(button.dataset.name); updateSelection(); break;
    case 'clear-compare': compared.clear(); updateSelection(); break;
    case 'open-compare': showComparison(); break;
    case 'detail': showDetails(uni); break;
    case 'close-dialog': $('#detail-dialog').close(); break;
    case 'locate': mapView.focus(uni); break;
    case 'fit': mapView.fit(); break;
    case 'export': {
      const url = URL.createObjectURL(new Blob(['\ufeff', toCSV(visible, filters.subject)], {type:'text/csv;charset=utf-8'}));
      const link = document.createElement('a');
      link.href = url; link.download = `uniseek-2021-${filters.subject}.csv`;
      link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); break;
    }
  }
}

async function boot() {
  layout();
  try {
    ({ rankings, countries } = await loadData());
    $('#select-country').insertAdjacentHTML('beforeend', options(Object.fromEntries(Object.keys(countries.country_code[0]).sort().map(country => [country, country])), filters.country));
    if (!Object.hasOwn(countries.country_code[0], filters.country)) filters.country = '';
    if (filters.min > filters.max) [filters.min, filters.max] = [filters.max, filters.min];
    syncForm();
    $('#filter-form').addEventListener('change', applyFilters);
    $('#filter-form').addEventListener('submit', event => {
      event.preventDefault();
      if (applyFilters()) { $('.filter-toggle').setAttribute('aria-expanded', 'false'); $('#filter-form').classList.remove('is-open'); }
    });
    $('.filter-toggle').addEventListener('click', () => {
      const expanded = $('.filter-toggle').getAttribute('aria-expanded') !== 'true';
      $('.filter-toggle').setAttribute('aria-expanded', String(expanded));
      $('#filter-form').classList.toggle('is-open', expanded);
    });
    $('#university-search').addEventListener('input', applyFilters);
    $('#sort').addEventListener('change', applyFilters);
    $('#detail-dialog').addEventListener('click', event => {
      if (event.target === $('#detail-dialog')) {
        const rect = $('#detail-dialog').getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) $('#detail-dialog').close();
      }
    });
    render();
  } catch (error) {
    $('.results-panel').setAttribute('aria-busy', 'false');
    $('#result-count').textContent = 'The dataset could not be loaded.';
    $('#results-body').innerHTML = '<div class="empty-state" role="alert"><h3>Let’s try that again.</h3><p>We couldn’t load the university data. Check your connection and reload the page.</p><button class="button button-primary" id="retry-load">Try again</button></div>';
    $('#retry-load').addEventListener('click', boot);
    $('#filter-form').querySelectorAll('input, select, button').forEach(control => { control.disabled = true; });
    $('#university-search').disabled = true; $('#sort').disabled = true;
  }
}

document.addEventListener('click', event => { if (rankings) handleAction(event); });
window.addEventListener('storage', event => {
  if (event.key === 'uniseek:saved' || event.key === null) {
    try { saved = readSaved(localStorage); } catch { saved = new Set(); }
    if (rankings) filters.saved ? render() : updateSelection();
  }
});
boot();
