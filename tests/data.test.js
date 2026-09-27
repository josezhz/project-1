import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DEFAULT_FILTERS, SUBJECTS, filterUniversities, readFilters, filterQuery, readSaved, formatScore, toCSV } from '../js/utilities.js';

const data = JSON.parse(await readFile(new URL('../json/qs_2021_with_latlng.json', import.meta.url)));
const countries = JSON.parse(await readFile(new URL('../json/countries_info.json', import.meta.url)));
const regions = countries.region[0];
const filter = values => filterUniversities(data, { ...DEFAULT_FILTERS, ...values }, regions);

test('all six categories load their 50 real records without changing source scores', () => {
  for (const subject of Object.keys(SUBJECTS)) assert.equal(filter({ subject }).length, 50);
  assert.equal(filter({})[0].Score, '96.3');
  assert.equal(formatScore(filter({})[0].Score), '96.3');
  assert.equal(formatScore(null), '—');
  assert.equal(formatScore(''), '—');
  assert.equal(formatScore('0'), '0.0');
});

test('country, region, search, and rank filters work together', () => {
  const singapore = filter({ country: 'Singapore', region: 'asia' });
  assert.equal(singapore.length, 2);
  assert.ok(singapore.every(uni => uni.Location === 'Singapore'));
  assert.equal(filter({ q: '  hArVaRd  ', min: 1, max: 5 })[0].Institution, 'Harvard University');
  assert.equal(filter({ country: 'Singapore', region: 'europe' }).length, 0);
  assert.equal(filter({ q: 'university-that-does-not-exist' }).length, 0);
  assert.equal(filter({ min: 40, max: 10 }).length, 0);
});

test('rank ranges include ties by published rank, rather than by array position', () => {
  const ties = { overall: [
    { '2021': '1', Institution: 'A', Location: 'Test' },
    { '2021': '=2', Institution: 'B', Location: 'Test' },
    { '2021': '2', Institution: 'C', Location: 'Test' },
    { '2021': '4', Institution: 'D', Location: 'Test' },
  ] };
  assert.deepEqual(filterUniversities(ties, { ...DEFAULT_FILTERS, min: 2, max: 2 }, {}).map(uni => uni.Institution), ['B', 'C']);
});

test('sorting uses numeric scores and leaves the source data unchanged', () => {
  const original = JSON.stringify(data);
  const scores = filter({ sort: 'score' }).map(uni => Number(uni.Score));
  assert.ok(scores.every((value, i) => i === 0 || scores[i - 1] >= value));
  const alphabetical = filter({ sort: 'name' }).map(uni => uni.Institution);
  assert.deepEqual(alphabetical, [...alphabetical].sort((a, b) => a.localeCompare(b)));
  assert.equal(JSON.stringify(data), original);
});

test('shareable URLs retain filters and reject malformed parameters', () => {
  const state = { ...DEFAULT_FILTERS, subject: 'natural_sciences', country: 'United States', min: 3, max: 20, q: 'MIT & science', saved: true, sort: 'academic' };
  assert.deepEqual(readFilters(filterQuery(state)), state);
  const invalid = readFilters('?subject=__proto__&region=constructor&min=-1&max=1000&sort=invalid');
  assert.deepEqual(invalid, DEFAULT_FILTERS);
  assert.equal(filterQuery(DEFAULT_FILTERS), '');
});

test('saved records are matched by institution and storage failures are recoverable', () => {
  const names = readSaved({ getItem: () => '["Harvard University",42]' });
  assert.deepEqual([...names], ['Harvard University']);
  assert.equal(filterUniversities(data, { ...DEFAULT_FILTERS, saved: true }, regions, names).length, 1);
  assert.equal(readSaved({ getItem: () => '{broken' }).size, 0);
  assert.equal(readSaved({ getItem: () => { throw new Error('storage blocked'); } }).size, 0);
});

test('CSV includes provenance, escapes names, and neutralizes formula cells', () => {
  const csv = toCSV([{ ...data.overall[0], Institution: '=DANGEROUS("x")', Location: 'A, B' }], 'overall');
  assert.ok(csv.includes('"2021","Overall rankings"'));
  assert.ok(csv.includes('"\'=DANGEROUS(""x"")"'));
  assert.ok(csv.includes('"A, B"'));
  assert.ok(csv.includes('"96.3"'));
});
