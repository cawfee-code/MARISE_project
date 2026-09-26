import * as api from './api.js';

export function validateBounds(values = {}) {
  for (const [key, limit, label] of [
    ['lat', 90, 'Latitude'], ['lon', 180, 'Longitude'],
    ['max_lat', 90, 'Max latitude'], ['min_lat', 90, 'Min latitude'],
    ['max_lon', 180, 'Max longitude'], ['min_lon', 180, 'Min longitude']
  ]) {
    const value = values[key];
    if (value !== '' && value !== undefined && value !== null &&
        (!Number.isFinite(Number(value)) || Math.abs(Number(value)) > limit)) {
      return `${label} must be between ${-limit} and ${limit}.`;
    }
  }
  if (values.min_lat !== '' && values.max_lat !== '' && values.min_lat != null && values.max_lat != null && Number(values.max_lat) <= Number(values.min_lat)) {
    return 'Max latitude must be greater than min latitude.';
  }
  if (values.min_lon !== '' && values.max_lon !== '' && values.min_lon != null && values.max_lon != null && Number(values.max_lon) <= Number(values.min_lon)) {
    return 'Max longitude must be greater than min longitude.';
  }
  return '';
}
export const hasSpill = results => results[1]?.geometry?.status === 'success' && results[1].geometry.area_pixels > 0;
export const canRunStage = (index, results, file, bounds) => {
  if (!file || validateBounds(bounds)) return false;
  if (index === 0) return true;
  if (index === 1) return !!results[0];
  if (!hasSpill(results)) return false;
  return index === 5 ? !!results[2] : !!results[index - 1];
};
// Preserve exact nested envelopes required by FastAPI's Pydantic models.
export async function executeStage(index, results, file, bounds, signal) {
  if (!canRunStage(index, results, file, bounds)) throw new Error('Complete the required earlier phase and check optional coordinates.');
  switch (index) {
    case 0: return api.detectSpill(file, bounds, signal);
    case 1: return api.characterizeSpill(results[0], bounds, signal);
    case 2: return api.runBacktracking(results[1], signal);
    case 3: return api.getAISCandidates(results[2], signal);
    case 4: return api.runAttribution(results[3], signal);
    case 5: return api.runForecast(results[2].data.spill_location, signal);
    default: throw new Error('Unknown investigation phase.');
  }
}

