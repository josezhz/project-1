import { escapeHTML } from './utilities.js';

export function createMapView(container, status) {
  if (!window.L) {
    status.hidden = false;
    status.textContent = 'The map could not load. You can still explore universities and scores in the results list.';
    return { render() {}, fit() {}, focus() {} };
  }
  const L = window.L;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const map = L.map(container, {
    zoomControl: false, minZoom: 2, maxZoom: 18, worldCopyJump: true,
    scrollWheelZoom: false, zoomAnimation: !reducedMotion, fadeAnimation: !reducedMotion,
  }).setView([25, 10], 2);
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);
  let loadedTiles = 0;
  tiles.on('tileerror', () => {
    if (!loadedTiles) {
      status.textContent = 'Map tiles are unavailable. University markers and the results list are still available.';
      status.hidden = false;
    }
  });
  tiles.on('tileload', () => { loadedTiles++; status.hidden = true; });
  const layer = L.featureGroup().addTo(map);
  const markers = new Map();
  const fit = () => {
    map.invalidateSize();
    if (layer.getLayers().length) map.fitBounds(layer.getBounds(), { padding: [45, 45], maxZoom: 11, animate: false });
    else map.setView([25, 10], 2, { animate: false });
  };
  return {
    render(universities, popup) {
      layer.clearLayers(); markers.clear();
      for (const uni of universities) {
        if (!Number.isFinite(Number(uni.lat)) || !Number.isFinite(Number(uni.lng))) continue;
        const marker = L.marker([Number(uni.lat), Number(uni.lng)], {
          title: uni.Institution, alt: `${uni.Institution}, rank ${uni['2021']}`,
          icon: L.divIcon({ className: 'university-marker', html: `<span>${escapeHTML(uni['2021'])}</span>`, iconSize: [34, 34], iconAnchor: [17, 17] }),
          riseOnHover: true,
        }).bindPopup(popup(uni), { maxWidth: 290, minWidth: 220 });
        marker.addTo(layer); markers.set(uni.Institution, marker);
      }
      fit();
    },
    fit,
    focus(uni) {
      const marker = markers.get(uni.Institution);
      if (!marker) return;
      container.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'nearest' });
      map.setView(marker.getLatLng(), 12, { animate: false });
      marker.openPopup();
    },
  };
}
