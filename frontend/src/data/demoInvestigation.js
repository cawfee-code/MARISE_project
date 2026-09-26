import sampleResponses from './sampleBackendResponses.json';

// Exact Stage 2–6 snapshots supplied by the project team on 26 September 2026.
// Stage 1 is a PNG mask; the corresponding supplied image is bundled separately.
export const demoCoordinates = {
  lat: 26.5, lon: 56.25,
  min_lat: 26.2, max_lat: 26.8,
  min_lon: 55.95, max_lon: 56.55,
};

export const emptyCoordinates = { lat: '', lon: '', max_lat: '', min_lat: '', max_lon: '', min_lon: '' };

export function createDemoResults(mask) {
  mask.responseHeaders = {
    'content-type': 'image/png',
    'x-lat': '26.5', 'x-lon': '56.25',
  };
  return [mask, ...[2, 3, 4, 5, 6].map(stage => sampleResponses[stage])];
}
