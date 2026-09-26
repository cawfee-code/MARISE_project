// Geographic data plot. Every point comes from a backend response; no invented coastline.
export default function GeoView({ source, vessels = [], selectedMmsi, projections = [], selectedProjection }) {
  const polygon = source?.origin_polygon || [];
  const origin = source?.spill_location;
  const points = [...polygon, ...vessels, ...projections, ...(origin ? [origin] : [])];
  if (!points.length) return <div className="image-empty"><p>No geographic positions were returned.</p></div>;
  const referenceLat = points.reduce((sum,p) => sum + p.lat, 0) / points.length;
  const kmPerLon = Math.max(1, 111.32 * Math.cos(referenceLat * Math.PI / 180));
  const boundsPoints = [...points, ...projections.flatMap(p => [
    { lat:p.lat + p.uncertainty_radius_km / 111.32, lon:p.lon + p.uncertainty_radius_km / kmPerLon },
    { lat:p.lat - p.uncertainty_radius_km / 111.32, lon:p.lon - p.uncertainty_radius_km / kmPerLon },
  ])];
  let west = Math.min(...boundsPoints.map(p=>p.lon)), east = Math.max(...boundsPoints.map(p=>p.lon));
  let south = Math.min(...boundsPoints.map(p=>p.lat)), north = Math.max(...boundsPoints.map(p=>p.lat));
  const lonPad = Math.max(.015, (east-west)*.12), latPad = Math.max(.015, (north-south)*.16);
  west -= lonPad; east += lonPad; south -= latPad; north += latPad;
  // Match horizontal and vertical kilometer scales in the 650 x 330 plot region.
  const targetRatio = 650 / 330;
  const xSpanKm = (east-west)*kmPerLon, ySpanKm = (north-south)*111.32;
  if (xSpanKm / ySpanKm < targetRatio) { const extra = (ySpanKm*targetRatio/kmPerLon - (east-west))/2; west-=extra; east+=extra; }
  else { const extra = (xSpanKm/targetRatio/111.32 - (north-south))/2; south-=extra; north+=extra; }
  const x = lon => 90 + (lon-west)/(east-west)*650;
  const y = lat => 405 - (lat-south)/(north-south)*330;
  const poly = polygon.map(p=>`${x(p.lon)},${y(p.lat)}`).join(' ');
  const coordinates = p => `${p.lat.toFixed(4)}°, ${p.lon.toFixed(4)}°`;
  return <div className="geo-view data-map"><svg viewBox="0 0 800 480" role="img" aria-label="Geographic plot of backend coordinates. North is up. Not a navigation chart.">
    <rect width="800" height="480" fill="#102028"/>
    {Array.from({length:5},(_,i)=>{const lon=west+(east-west)*i/4,lat=south+(north-south)*i/4;return <g key={i}><path d={`M${x(lon)} 75V405 M90 ${y(lat)}H740`} stroke="#7c9ba4" strokeOpacity=".2"/><text x={x(lon)} y="433" textAnchor="middle" className="map-label">{lon.toFixed(3)}°</text><text x="78" y={y(lat)+4} textAnchor="end" className="map-label">{lat.toFixed(3)}°</text></g>;})}
    <text x="90" y="35" className="map-label">GEOGRAPHIC POSITIONS / WGS84</text><text x="740" y="35" textAnchor="end" className="map-label">N ↑</text>
    {polygon.length > 2 && <polygon points={poly} fill="#b1caba" fillOpacity=".12" stroke="#b1caba" strokeDasharray="5 5"><title>Backend reconstructed source corridor</title></polygon>}
    {projections.length > 0 && <polyline points={[...(origin?[origin]:[]),...projections].map(p=>`${x(p.lon)},${y(p.lat)}`).join(' ')} fill="none" stroke="#bbcec2" strokeWidth="1.5" strokeDasharray="5 5"/>}
    {projections.map((p,i)=><g key={`${p.timeframe}-${i}`} opacity={selectedProjection === undefined || selectedProjection === i ? 1 : .25}><ellipse cx={x(p.lon)} cy={y(p.lat)} rx={p.uncertainty_radius_km/kmPerLon/(east-west)*650} ry={p.uncertainty_radius_km/111.32/(north-south)*330} fill="#a9c4b3" fillOpacity=".12" stroke="#a9c4b3"/><circle cx={x(p.lon)} cy={y(p.lat)} r="4" fill="#cbdccc"/><text x={x(p.lon)+8} y={y(p.lat)-10} className="map-label">{p.timeframe}</text><title>{p.timeframe}: {coordinates(p)}; spread radius {p.uncertainty_radius_km} km</title></g>)}
    {vessels.map((v,i)=><g key={`${v.mmsi}-${i}`} opacity={!selectedMmsi || selectedMmsi===v.mmsi ? 1 : .35}><path d={`M${x(v.lon)} ${y(v.lat)-6}l-5 11h10z`} fill={selectedMmsi===v.mmsi?'#d6c39b':'#94b3b5'}/>{selectedMmsi===v.mmsi&&<circle cx={x(v.lon)} cy={y(v.lat)} r="12" fill="none" stroke="#d6c39b"/>}<title>{v.name} · {v.mmsi} · {coordinates(v)} · simulated vessel</title></g>)}
    {origin&&<g><circle cx={x(origin.lon)} cy={y(origin.lat)} r="6" fill="#e0e9df" stroke="#071014" strokeWidth="2"/><text x={x(origin.lon)+12} y={y(origin.lat)-8} className="map-label">Observed centroid</text><title>{coordinates(origin)}</title></g>}
    <text x="90" y="462" className="map-label">LONGITUDE → / LATITUDE ↑ · LOCAL APPROXIMATION</text>
  </svg></div>;
}
