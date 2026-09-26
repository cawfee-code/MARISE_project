import GeoView from './GeoView';
import { Facts, Note } from './StageParts';
import { EmptyPhase } from './EmptyPhase';
export default function Backtracking({ results }) {
  const data = results[2]?.data;
  if (!data) return <EmptyPhase title="Reconstruct the source corridor." description="A non-empty characterized region is required before backtracking can run."/>;
  const points = data.origin_polygon || [];
  const minLat = Math.min(...points.map(p => p.lat));
  const maxLat = Math.max(...points.map(p => p.lat));
  const minLon = Math.min(...points.map(p => p.lon));
  const maxLon = Math.max(...points.map(p => p.lon));
  return <><div className="analysis-main"><div className="toolbar"><span>RETURNED SOURCE CORRIDOR / 12-HOUR HINDCAST</span></div><GeoView source={data}/><div className="image-meta"><span>DASHED POLYGON / MODEL SOURCE REGION</span><span>DOT / OBSERVED CENTROID</span></div><div className="polygon-points"><h4>Origin polygon · {points.length} points</h4><ol>{points.map((p,i)=><li key={i}><span>Point {i+1}</span><span>{p.lat.toFixed(4)}° lat · {p.lon.toFixed(4)}° lon</span></li>)}</ol></div></div><aside className="analysis-side"><span className="eyebrow">03 / REVERSE TRANSPORT</span><h3>A possible origin.</h3><Facts items={[["Observed latitude",`${data.spill_location.lat}°`],["Observed longitude",`${data.spill_location.lon}°`],["Polygon min latitude",`${minLat.toFixed(4)}°`],["Polygon max latitude",`${maxLat.toFixed(4)}°`],["Polygon min longitude",`${minLon.toFixed(4)}°`],["Polygon max longitude",`${maxLon.toFixed(4)}°`],["Backend heuristic score",data.confidence_score || 'Not returned'],["Lookback window",data.estimated_dump_time || 'Not returned'],["Environmental inputs","Fixed fallback wind + current"]]}/><Note>The polygon is the corridor returned by OpenOil. This endpoint supplies neither a timed particle trajectory nor an exact release location. Its confidence score is a dispersion heuristic, not a calibrated probability.</Note><Note>Wind: 4.0 / −1.5 m/s. Current: 0.3 / −0.2 m/s. The model starts from execution time because the endpoint does not accept acquisition time.</Note></aside></>;
}
