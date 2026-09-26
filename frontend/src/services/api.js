// Matches backend/main.py. No synthetic analysis is generated in this client.
const configuredBase = (import.meta.env?.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const apiRoot = configuredBase.endsWith('/api/v1') ? configuredBase : `${configuredBase}/api/v1`;
const serviceRoot = configuredBase.replace(/\/api\/v1$/, '');
const REQUEST_TIMEOUT = 300_000;
export class ApiError extends Error {
  constructor(message, status) { super(message); this.name = 'ApiError'; this.status = status; }
}
async function send(url, { body, signal, binary = false, method = 'POST' } = {}) {
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, REQUEST_TIMEOUT);
  try {
    const isForm = body instanceof FormData;
    const response = await fetch(url, {
      method, signal: controller.signal,
      headers: body && !isForm ? { 'Content-Type': 'application/json' } : {},
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
    if (!response.ok) {
      let detail = '';
      try {
        const error = await response.json();
        detail = typeof error.detail === 'string' ? error.detail : Array.isArray(error.detail)
          ? error.detail.map(item => `${item.loc?.join('.') || 'Input'}: ${item.msg}`).join('; ') : '';
      } catch { /* Do not render HTML proxy errors as analysis results. */ }
      throw new ApiError(`Backend request failed (${response.status}). ${detail || (response.status >= 500 ? 'Check the backend terminal and retry this phase.' : 'Check the inputs and retry.')}`, response.status);
    }
    if (binary) {
      if (!response.headers.get('content-type')?.includes('image/png')) throw new ApiError('Detection returned an unexpected format. Expected a PNG mask.');
      const blob = await response.blob();
      const signature = new Uint8Array(await blob.slice(0, 8).arrayBuffer());
      if (![137,80,78,71,13,10,26,10].every((byte, i) => signature[i] === byte)) throw new ApiError('The backend returned an invalid PNG mask.');
      blob.responseHeaders = Object.fromEntries(['content-type','content-length','x-lat','x-lon','x-min-lat','x-max-lat','x-min-lon','x-max-lon'].map(key => [key, response.headers.get(key)]).filter(([, value]) => value !== null));
      return blob;
    }
    if (!response.headers.get('content-type')?.includes('application/json')) throw new ApiError('The backend returned an unexpected format. Expected JSON. Check the API URL.');
    return await response.json();
  } catch (error) {
    if (signal?.aborted) throw new DOMException('Analysis cancelled.', 'AbortError');
    if (timedOut) throw new ApiError('The backend did not respond within five minutes. Check its terminal, then retry this phase.');
    if (error instanceof ApiError) throw error;
    throw new ApiError('Cannot reach the MARISE backend. Start the FastAPI service and check the API URL, network and CORS configuration.');
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
}
function multipart(field, file, coordinates) {
  const form = new FormData();
  form.append(field, file, field === 'mask_file' ? 'spill-mask.png' : file.name || 'sar-image.png');
  for (const key of ['lat','lon','max_lat','min_lat','max_lon','min_lon']) {
    const value = coordinates?.[key];
    if (value !== undefined && value !== null && value !== '') form.append(key, String(value));
  }
  return form;
}
function assert(condition, detail) {
  if (!condition) throw new ApiError(`Invalid backend response: ${detail}. No results were applied.`);
}
const finite = value => typeof value === 'number' && Number.isFinite(value);
const point = value => value && finite(value.lat) && finite(value.lon) && Math.abs(value.lat) <= 90 && Math.abs(value.lon) <= 180;
export function validateStage(stage, result) {
  assert(result?.status === 'success' && result.stage === stage, `expected successful stage ${stage}`);
  const data = result.data;
  if (stage === 2) {
    const g = result.geometry;
    assert(g && ['success', 'empty'].includes(g.status), 'missing geometry status');
    for (const key of ['image_width','image_height','area_pixels','area_km2','centroid_x','centroid_y','orientation_deg','min_lat','max_lat','min_lon','max_lon']) assert(finite(g[key]), `geometry.${key} must be numeric`);
    assert(g.image_width > 0 && g.image_height > 0 && g.area_pixels >= 0 && g.area_km2 >= 0, 'invalid geometry dimensions or area');
    assert(g.max_lat > g.min_lat && g.max_lon > g.min_lon, 'invalid scene bounds');
  } else if (stage === 3) {
    assert(point(data?.spill_location), 'missing spill location');
    assert(Array.isArray(data.origin_polygon) && data.origin_polygon.length >= 3 && data.origin_polygon.every(point), 'invalid origin polygon');
  } else if (stage === 4) {
    assert(finite(data?.total_ships_scanned) && finite(data?.ships_in_vicinity), 'missing vessel counts');
    for (const key of ['flagged_vessels','all_nearby_vessels']) assert(Array.isArray(data[key]) && data[key].every(v => point(v) && typeof v.mmsi === 'string' && typeof v.name === 'string'), `invalid ${key}`);
  } else if (stage === 5) {
    assert(data && (data.status === 'inconclusive' || Array.isArray(data.ranked_candidates)), 'missing attribution report');
    if (data.ranked_candidates) assert(data.ranked_candidates.every(v => typeof v.mmsi === 'string' && typeof v.vessel_name === 'string' && v.evidence_breakdown), 'invalid attribution candidate');
  } else if (stage === 6) {
    assert(Array.isArray(data?.projections), 'missing forecast projections');
    assert(data.projections.every(p => point(p) && finite(p.uncertainty_radius_km) && p.uncertainty_radius_km >= 0 && typeof p.timeframe === 'string'), 'invalid forecast checkpoint');
  }
  return result;
}
async function jsonStage(stage, endpoint, body, signal) {
  return validateStage(stage, await send(`${apiRoot}/${endpoint}`, { body, signal }));
}
export const detectSpill = (file, coordinates, signal) => send(`${apiRoot}/detect`, { body: multipart('file', file, coordinates), binary: true, signal });
export const characterizeSpill = (mask, coordinates, signal) => jsonStage(2, 'characterize', multipart('mask_file', mask, coordinates), signal);
export const runBacktracking = (stage2, signal) => jsonStage(3, 'hindcast', stage2, signal);
export const getAISCandidates = (stage3, signal) => jsonStage(4, 'ais_match', stage3, signal);
export const runAttribution = (stage4, signal) => jsonStage(5, 'attribution', stage4, signal);
export const runForecast = (location, signal) => jsonStage(6, 'forecast', location, signal);
export async function checkBackend(signal) {
  const schema = await send(`${serviceRoot}/openapi.json`, { method: 'GET', signal });
  assert(['detect','characterize','hindcast','ais_match','attribution','forecast'].every(path => schema.paths?.[`/api/v1/${path}`]?.post), 'this server does not expose the six MARISE endpoints');
  return schema.info?.title || 'MARISE backend';
}
