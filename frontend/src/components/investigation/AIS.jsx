import { useState } from 'react';
import GeoView from './GeoView';
import { Facts, Note } from './StageParts';
import { EmptyPhase } from './EmptyPhase';
export default function AIS({ results }) {
  const [selectedId, setSelectedId] = useState('');
  const [showAll, setShowAll] = useState(false);
  const data = results[3]?.data;
  if (!data) return <EmptyPhase title="Compare candidate positions." description="Complete backtracking to supply the source polygon used by the backend's AIS simulator."/>;
  const candidates = data.flagged_vessels;
  const selected = candidates.find(v=>v.mmsi===selectedId) || candidates[0];
  const points = showAll ? data.all_nearby_vessels : candidates;
  return <><div className="analysis-main"><div className="toolbar"><span>BACKEND-GENERATED VESSELS / SIMULATED AIS</span></div><GeoView source={results[2]?.data} vessels={points} selectedMmsi={selected?.mmsi}/><label className="toggle-label"><input type="checkbox" checked={showAll} onChange={e=>setShowAll(e.target.checked)}/> Show all {data.all_nearby_vessels.length} simulated nearby vessels</label><div className="vessel-list">{candidates.length ? candidates.map((v,i)=><button key={`${v.mmsi}-${i}`} aria-pressed={selected?.mmsi===v.mmsi} onClick={()=>setSelectedId(v.mmsi)}><span>{String(i+1).padStart(2,'0')}</span><strong>{v.name}</strong><span>{v.match_confidence} match score</span></button>) : <p>No candidates returned in the source corridor.</p>}</div></div><aside className="analysis-side"><span className="eyebrow">04 / SIMULATED CANDIDATE</span><h3>{selected?.name || 'No candidate match.'}</h3><Facts items={[["Reported traffic count",String(data.total_ships_scanned)],["Generated nearby vessels",String(data.ships_in_vicinity)],...(selected ? [["MMSI (generated)",selected.mmsi],["Vessel type",selected.type],["Position",`${selected.lat}°, ${selected.lon}°`],["Speed",selected.speed_knots == null ? 'Not provided' : `${selected.speed_knots} kn`],["Simulated match score",selected.match_confidence],["Backend status",selected.status]] : [])]}/><Note>This backend generates random vessel names, MMSIs, positions and scores. These are not live AIS observations and may coincidentally resemble real vessels. No vessel tracks, timestamps or AIS gaps are returned.</Note></aside></>;
}
