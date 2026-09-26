import { useState } from 'react';
import GeoView from './GeoView';
import { Facts, Note } from './StageParts';
import { EmptyPhase } from './EmptyPhase';
export default function Forecast({ results }) {
  const [index,setIndex] = useState(0);
  const data = results[5]?.data;
  if (!data) return <EmptyPhase title="Project the next 48 hours." description="Run backtracking to resolve the spill coordinates, then request the forward forecast."/>;
  const projections = data.projections;
  const selected = projections[Math.min(index,projections.length-1)];
  if (!selected) return <EmptyPhase title="No forecast checkpoints returned." description="The backend completed without returning forecast positions. Inspect its output and retry the forecast."/>;
  return <><div className="analysis-main"><div className="toolbar"><span>RETURNED FORECAST / FALLBACK ENVIRONMENTAL FORCING</span></div><GeoView source={{spill_location:results[2]?.data?.spill_location}} projections={projections} selectedProjection={index}/><div className="forecast-checkpoints" role="group" aria-label="Forecast checkpoints">{projections.map((p,i)=><button key={`${p.timeframe}-${i}`} aria-pressed={index===i} onClick={()=>setIndex(i)}>{p.timeframe}<span>{p.projected_utc}</span></button>)}</div><Note>Connecting lines join returned checkpoints; they are not a continuous particle track. Rings show the backend's reported spread radius, not a confidence interval.</Note></div><aside className="analysis-side"><span className="eyebrow">06 / {selected.timeframe} OUTLOOK</span><h3>{selected.timeframe} from model start.</h3><Facts items={[["Projected time",selected.projected_utc],["Latitude",`${selected.lat}°`],["Longitude",`${selected.lon}°`],["Reported spread radius",`${selected.uncertainty_radius_km} km`],["Model coastal-risk tier",data.coastal_impact_risk || 'Not returned'],["Model stranded fraction",data.projected_shoreline_impact_percent || 'Not returned']]}/><p>{data.warning_status}</p><Note>OpenOil runs with fixed fallback currents and winds. The reported spread is forced to be at least 2 km and non-decreasing. Coastal impact is a model scenario, not an observed alert. Named affected regions are not supplied.</Note><div className="forecast-callout">A forecast is a scenario.<br/>Keep observing.</div></aside></>;
}
