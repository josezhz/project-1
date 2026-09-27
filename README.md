# UNISEEK — Find your next chapter

An independent university explorer by Jose Zhang Haozhe. Browse locations and scores, build a shortlist, and compare universities from the bundled **QS 2021 dataset**.

**[Explore UNISEEK](https://josezhz.github.io/project-1/)** · [Rankings](https://josezhz.github.io/project-1/html/chart.html) · [Map](https://josezhz.github.io/project-1/html/map.html)

## What you can do

- Explore 50 records in each of six categories: overall, arts and humanities, engineering and technology, life sciences and medicine, natural sciences, and social sciences and management.
- Filter instantly by university name, subject, country or territory, region, and published rank; sort by rank, name, or selected score.
- Move between rankings and map views without losing filters. The current filters are encoded in the URL for sharing or bookmarking.
- Save universities to a shortlist in your browser. When local storage is unavailable, bookmarks still work for the current session.
- Select two or three universities for a side-by-side comparison of all five recorded scores within one subject area.
- Open a university's score breakdown, locate it on the map, and export filtered results as CSV.
- Use responsive layouts, keyboard navigation, labeled form controls, a skip link, native dialogs, reduced motion, and descriptive loading, empty, and error states.

## Data and limitations

This is a historical discovery project, **not a source of current university rankings**. The original files in `json/` are preserved. The app uses `qs_2021_with_latlng.json` and `countries_info.json`.

Each category contains 50 university records. Across the dataset, there are 24 countries and territories. Scores (`Score`, `Academic`, `Employer`, `Citations`, and `H`) are displayed as recorded on a 0–100 scale. The app does not recalculate the overall score or claim that scores from different subjects use the same methodology. Rank filters use the recorded rank, including ties, rather than the array position.

Refer to [QS Top Universities](https://www.topuniversities.com/) for current rankings and methodology. University coordinates are the existing project data. Map tiles require an internet connection; filtering, score details, and comparisons use local data and continue to work when tiles are unavailable. Saved universities are stored on the current browser and device, without an account or cross-device synchronization.

## Run locally

Requires Node.js 20 or later. There is no build step or production npm dependency.

```sh
git clone https://github.com/josezhz/project-1.git
cd project-1
npm start
```

Open **http://127.0.0.1:8000**. Serve the files over HTTP; opening HTML directly with `file://` will not load ES modules and JSON reliably. Alternatively, use any static web server, such as `python3 -m http.server 8000`.

## Tests

```sh
npm ci
npm test
npx playwright install chromium --only-shell
npm run test:e2e
```

The unit tests cover the real dataset, combined filters, tied ranks, numeric sorting, query-string validation, unavailable storage, and CSV escaping. Browser tests cover navigation, desktop and mobile layouts, source scores, dialog focus, bookmarks, comparisons, exports, failed data requests, and map behavior without basemap tiles.

On Linux, Playwright may also need `npx playwright install-deps chromium`. An existing compatible Chromium executable can be supplied through `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

## Project structure

```text
index.html                 Landing page and subject discovery
html/chart.html            Rankings view
html/map.html              Map view
css/                       Shared design system and page styles
js/app.js                  Shared explorer UI and interactions
js/utilities.js            Data loading, filtering, formatting, and export
js/map.js                  Leaflet map adapter and graceful fallback
js/home.js                 Home-page icons
json/                      Original 2021 datasets
vendor/leaflet/             Pinned Leaflet 1.9.4 assets and license
scripts/serve.mjs           Local static development server
tests/                     Data and browser regression tests
```

The frontend uses semantic HTML, CSS, native JavaScript modules, `fetch`, and CSS score bars. Leaflet is vendored so the interface does not depend on third-party script CDNs, icon fonts, flag APIs, or a chart library. No API key is needed.

## Deployment

The project remains a static site compatible with GitHub Pages, including its existing `/project-1/` subpath and `html/map.html` / `html/chart.html` routes. Publish the root of `main` using the repository's existing Pages configuration. No build command or environment variables are required.

## Credits

- Original project and university data preparation: Jose Zhang Haozhe.
- Ranking source: [QS World University Rankings 2021](https://www.topuniversities.com/university-rankings/world-university-rankings/2021).
- Map engine: [Leaflet](https://leafletjs.com/), BSD 2-Clause license included in `vendor/leaflet/LICENSE`.
- Map data and tiles: [OpenStreetMap contributors](https://www.openstreetmap.org/copyright); attribution is retained on the map.
- Legacy project logos and image assets: [LOGO.com](https://logo.com/) and [Flaticon](https://www.flaticon.com/).
- Original coordinate preparation used Google Maps geocoding. The application now reads stored coordinates and contains no geocoding credential.
