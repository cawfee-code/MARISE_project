import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import * as api from '../src/services/api.js';
import { canRunStage, executeStage, validateBounds } from '../src/services/pipeline.js';

// Contract fixtures only. These are never imported by the frontend.
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const bounds = { min_lat: 18.2, max_lat: 18.8, min_lon: 72.2, max_lon: 72.8 };
const file = new File(['test-image'], 'scene.png', { type: 'image/png' });
const png = new Blob([new Uint8Array([137,80,78,71,13,10,26,10,0])], { type: 'image/png' });
const geometry = { status:'success', image_width:512, image_height:256, area_pixels:900, area_km2:.09, centroid_x:128, centroid_y:100, orientation_deg:42, confidence:'HIGH', lat:18.5, lon:72.5, ...bounds };
const stage2 = { status:'success', stage:2, geometry };
const stage3 = { status:'success', stage:3, data:{ spill_location:{lat:18.56,lon:72.35}, origin_polygon:[{lat:18.6,lon:72.2},{lat:18.6,lon:72.3},{lat:18.5,lon:72.3},{lat:18.5,lon:72.2}], estimated_dump_time:'Lookback Window: -2h to -12h', confidence_score:'90%' } };
const vessel = { mmsi:'123456789', name:'TEST VESSEL', type:'Crude Oil Tanker', lat:18.55, lon:72.25, speed_knots:4.2, status:'FLAGGED - Polygon Intersection', match_confidence:'91%' };
const stage4 = { status:'success', stage:4, data:{ total_ships_scanned:6000, ships_in_vicinity:1, flagged_vessels:[vessel], all_nearby_vessels:[vessel] } };
const stage5 = { status:'success', stage:5, data:{ case_id:'TEST-ONLY', ranked_candidates:[{ mmsi:vessel.mmsi,vessel_name:vessel.name,evidence_breakdown:{} }] } };
const stage6 = { status:'success', stage:6, data:{ projections:[{timeframe:'+6h',lat:18.54,lon:72.4,uncertainty_radius_km:2}] } };
const response = body => Response.json(body);

test('detection sends image without requiring coordinates', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/v1/detect');
    assert.equal(options.body.get('file').name, 'scene.png');
    assert.equal(options.body.has('image'), false);
    assert.equal(options.body.has('lat'), false);
    assert.equal(options.body.has('lon'), false);
    assert.equal(options.body.has('min_lat'), false);
    assert.equal(options.headers['Content-Type'], undefined);
    return new Response(png, { headers:{'Content-Type':'image/png'} });
  };
  assert.equal((await api.detectSpill(file,{lat:'',lon:''})).type, 'image/png');
});

test('characterization omits blank optional coordinates', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/v1/characterize');
    assert.equal(options.body.get('mask_file').name, 'spill-mask.png');
    assert.equal(options.body.get('lat'), '18.5');
    assert.equal(options.body.get('lon'), '72.5');
    assert.equal(options.body.has('max_lon'), false);
    return response(stage2);
  };
  assert.deepEqual(await api.characterizeSpill(png,{lat:18.5,lon:72.5}),stage2);
});

test('six-phase workflow forwards exact envelopes and forecast lat/lon', async () => {
  const seen=[];
  const payloads=[png,stage2,stage3,stage4,stage5,stage6];
  globalThis.fetch = async (url,options) => {
    const index=seen.length;
    seen.push({url,body:options.body});
    return index===0 ? new Response(png,{headers:{'Content-Type':'image/png'}}) : response(payloads[index]);
  };
  const results=[];
  for(let i=0;i<6;i++) results[i]=await executeStage(i,results,file,bounds);
  assert.deepEqual(seen.map(v=>v.url),['detect','characterize','hindcast','ais_match','attribution','forecast'].map(v=>`/api/v1/${v}`));
  assert.deepEqual(JSON.parse(seen[2].body),stage2);
  assert.deepEqual(JSON.parse(seen[3].body),stage3);
  assert.deepEqual(JSON.parse(seen[4].body),stage4);
  assert.deepEqual(JSON.parse(seen[5].body),stage3.data.spill_location);
});

test('empty geometry blocks all downstream analysis', async () => {
  const results=[png,{...stage2,geometry:{...geometry,status:'empty',area_pixels:0,area_km2:0}}];
  for(let i=2;i<6;i++) {
    assert.equal(canRunStage(i,results,file,bounds),false);
    await assert.rejects(executeStage(i,results,file,bounds),/required earlier phase/);
  }
});

test('forecast can run after hindcast without waiting for simulated AIS', () => {
  assert.equal(canRunStage(5,[png,stage2,stage3],file,bounds),true);
});

test('six optional coordinates accept blanks, reject invalid values, and require an image', () => {
  assert.equal(validateBounds({}), '');
  assert.equal(validateBounds({lat:'',lon:''}), '');
  assert.equal(validateBounds({lat:0,lon:0}), '');
  assert.match(validateBounds({lat:91}),/Latitude/);
  assert.match(validateBounds({lon:-181}),/Longitude/);
  assert.match(validateBounds({max_lat:91}),/Max latitude/);
  assert.match(validateBounds({max_lon:181}),/Max longitude/);
  assert.match(validateBounds({min_lat:10,max_lat:5}),/Max latitude must be greater/);
  assert.equal(canRunStage(0,[],file,{}),true);
  assert.equal(canRunStage(0,[],null,{}),false);
});

test('FastAPI validation detail is readable and no success is fabricated', async () => {
  globalThis.fetch=async()=>new Response(JSON.stringify({detail:[{loc:['body','file'],msg:'Field required'}]}),{status:422,headers:{'Content-Type':'application/json'}});
  await assert.rejects(api.detectSpill(file,bounds),/body.file: Field required/);
});

test('network failures explain how to connect the backend', async () => {
  globalThis.fetch=async()=>{throw new TypeError('Failed to fetch');};
  await assert.rejects(api.runBacktracking(stage2),/Cannot reach the MARISE backend/);
});

test('HTML responses and corrupt masks cannot become results', async () => {
  globalThis.fetch=async()=>new Response('<html>proxy</html>',{headers:{'Content-Type':'text/html'}});
  await assert.rejects(api.runBacktracking(stage2),/Expected JSON/);
  globalThis.fetch=async()=>new Response('invalid',{headers:{'Content-Type':'image/png'}});
  await assert.rejects(api.detectSpill(file,bounds),/invalid PNG/);
});

test('malformed geospatial payloads are rejected before rendering', () => {
  assert.throws(()=>api.validateStage(3,{...stage3,data:{...stage3.data,origin_polygon:[{lat:500,lon:2}]}}),/invalid origin polygon/);
  assert.throws(()=>api.validateStage(6,{...stage6,data:{projections:[{timeframe:'+6h',lat:NaN,lon:3,uncertainty_radius_km:2}]}}),/invalid forecast/);
});

test('inconclusive attribution is a valid empty result', async () => {
  const inconclusive={status:'success',stage:5,data:{status:'inconclusive',verdict:'No candidates'}};
  globalThis.fetch=async()=>response(inconclusive);
  assert.deepEqual(await api.runAttribution(stage4),inconclusive);
});

test('cancellation propagates AbortError rather than a service failure', async () => {
  globalThis.fetch=(_url,{signal})=>new Promise((_resolve,reject)=>{
    if(signal.aborted) reject(new DOMException('Aborted','AbortError'));
    else signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true});
  });
  const controller=new AbortController();
  const pending=api.runBacktracking(stage2,controller.signal);
  controller.abort();
  await assert.rejects(pending,{name:'AbortError'});
});

test('connection check verifies the six actual backend routes', async () => {
  globalThis.fetch=async(url,options)=>{
    assert.equal(url,'/openapi.json'); assert.equal(options.method,'GET');
    return response({info:{title:'MARISE Oil Spill Pipeline'},paths:Object.fromEntries(['detect','characterize','hindcast','ais_match','attribution','forecast'].map(p=>[`/api/v1/${p}`,{post:{}}]))});
  };
  assert.equal(await api.checkBackend(),'MARISE Oil Spill Pipeline');
});

test('optional coordinates preserve zero, send supplied bounds, and omit blanks', async () => {
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.body.get('lat'),'0');
    assert.equal(options.body.get('lon'),'0');
    assert.equal(options.body.get('max_lat'),'26.8');
    for (const key of ['min_lat','min_lon','max_lon']) assert.equal(options.body.has(key),false);
    return new Response(png,{headers:{'Content-Type':'image/png'}});
  };
  await api.detectSpill(file,{lat:0,lon:0,max_lat:26.8,min_lat:'',max_lon:'',min_lon:''});
});
