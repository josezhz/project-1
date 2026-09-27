export const SUBJECTS = {
  overall: 'Overall rankings',
  arts_and_humanities: 'Arts & Humanities',
  engineering_and_technology: 'Engineering & Technology',
  life_sciences_and_medicine: 'Life Sciences & Medicine',
  natural_sciences: 'Natural Sciences',
  social_sciences_and_management: 'Social Sciences & Management',
};

export const REGIONS = {
  asia: 'Asia', europe: 'Europe', latin_america: 'Latin America',
  north_america: 'North America', oceania: 'Oceania',
};

export const METRICS = [
  ['Score', 'Overall score'], ['Academic', 'Academic reputation'],
  ['Employer', 'Employer reputation'], ['Citations', 'Citations'], ['H', 'H-index'],
];

export const DEFAULT_FILTERS = Object.freeze({
  subject: 'overall', country: '', region: '', min: 1, max: 50,
  q: '', sort: 'rank', saved: false,
});

export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

export function rankOf(value) {
  const rank = Number.parseInt(String(value).replace(/^=/, ''), 10);
  return Number.isFinite(rank) ? rank : Infinity;
}

export function metricValue(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function formatScore(value) {
  const number = metricValue(value);
  return number === null ? '—' : number.toFixed(1);
}

export function readFilters(search = '') {
  const params = new URLSearchParams(search);
  const rank = key => {
    const value = Number(params.get(key));
    return Number.isInteger(value) && value >= 1 && value <= 50 ? value : DEFAULT_FILTERS[key];
  };
  return {
    subject: Object.hasOwn(SUBJECTS, params.get('subject')) ? params.get('subject') : 'overall',
    country: params.get('country') || '',
    region: Object.hasOwn(REGIONS, params.get('region')) ? params.get('region') : '',
    min: rank('min'), max: rank('max'), q: (params.get('q') || '').slice(0, 200),
    sort: ['rank', 'score', 'academic', 'employer', 'name'].includes(params.get('sort')) ? params.get('sort') : 'rank',
    saved: params.get('saved') === '1',
  };
}

export function filterQuery(filters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== DEFAULT_FILTERS[key]) params.set(key, value === true ? '1' : String(value));
  }
  return params.toString() ? `?${params}` : '';
}

export function filterUniversities(data, filters, regions, saved = new Set()) {
  const query = filters.q.trim().toLocaleLowerCase();
  const result = (data[filters.subject] || []).filter(uni => {
    const rank = rankOf(uni['2021']);
    return rank >= filters.min && rank <= filters.max
      && (!filters.country || uni.Location === filters.country)
      && (!filters.region || regions[uni.Location] === filters.region)
      && (!query || uni.Institution.toLocaleLowerCase().includes(query))
      && (!filters.saved || saved.has(uni.Institution));
  });
  const sortMetric = { score: 'Score', academic: 'Academic', employer: 'Employer' }[filters.sort];
  return result.sort((a, b) => {
    if (filters.sort === 'name') return a.Institution.localeCompare(b.Institution);
    if (sortMetric) {
      const difference = (metricValue(b[sortMetric]) ?? -Infinity) - (metricValue(a[sortMetric]) ?? -Infinity);
      if (difference) return difference;
    }
    return rankOf(a['2021']) - rankOf(b['2021']) || a.Institution.localeCompare(b.Institution);
  });
}

let dataRequest;
export function loadData() {
  if (!dataRequest) {
    dataRequest = Promise.all(['qs_2021_with_latlng', 'countries_info'].map(async name => {
      const response = await fetch(new URL(`../json/${name}.json`, import.meta.url));
      if (!response.ok) throw new Error(`Could not load ${name}`);
      return response.json();
    })).then(([rankings, countries]) => ({ rankings, countries })).catch(error => {
      dataRequest = undefined;
      throw error;
    });
  }
  return dataRequest;
}

export function readSaved(storage) {
  try {
    const values = JSON.parse(storage.getItem('uniseek:saved') || '[]');
    return new Set(Array.isArray(values) ? values.filter(value => typeof value === 'string') : []);
  } catch { return new Set(); }
}

export function toCSV(universities, subject) {
  const cell = value => {
    let text = String(value ?? '');
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  const rows = [['Year', 'Subject', 'Rank', 'University', 'Country', ...METRICS.map(([, label]) => label)],
    ...universities.map(uni => [2021, SUBJECTS[subject], uni['2021'], uni.Institution, uni.Location, ...METRICS.map(([key]) => uni[key])])];
  return rows.map(row => row.map(cell).join(',')).join('\r\n');
}

const paths = {
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 6.5h14M5 17.5h14"/>',
  chart: '<path d="M4 4v16h17M9 15V9m5 6V5m5 10v-4"/>',
  pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  bookmark: '<path d="M6 4h12v17l-6-4-6 4Z"/>',
  compare: '<path d="M5 5v14m7-14v14m7-14v14M2 8h6m1 8h6m1-6h6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  filter: '<path d="M4 7h16M7 12h10m-7 5h4"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  cap: '<path d="m2 9 10-5 10 5-10 5L2 9Zm4 3v5q6 5 12 0v-5m4-3v8"/>',
  book: '<path d="M12 5v15M3 4q5-1 9 2 4-3 9-2v14q-5-1-9 2-4-3-9-2Z"/>',
  code: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6M14 3l-4 18"/>',
  heart: '<path d="M20.5 5.5a5 5 0 0 0-8.5 3 5 5 0 0 0-8.5-3C-1 10 7 17 12 21c5-4 13-11 8.5-15.5Z"/>',
  atom: '<ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>',
  people: '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5v2"/>',
};

export function icon(name, className = '') {
  return `<svg class="icon ${className}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.cap}</svg>`;
}

export function initials(name) {
  const abbreviation = name.match(/\(([A-Z]{2,5})\)/)?.[1];
  return abbreviation || name.replace(/University of |University|Institute of |The |and /g, '').trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();
}
