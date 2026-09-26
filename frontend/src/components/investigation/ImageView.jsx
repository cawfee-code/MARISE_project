export default function ImageView({ preview, maskURL, layer }) {
  if (layer === 'Segmentation' && !maskURL) return <div className="image-empty"><p>Preparing extracted spill mask…</p></div>;
  if (!preview) return <div className="image-empty"><span className="eyebrow">SAR OBSERVATION FIELD</span><p>No image loaded.</p><span>Select a satellite image to begin an investigation.</span></div>;
  return <div className="sar-image-view">
    <img className="sar-base" src={layer === 'Segmentation' ? maskURL : preview} alt={layer === 'Segmentation' ? 'Extracted spill mask' : 'Uploaded SAR scene'}/>
    {layer === 'Model overlay' && maskURL && <img className="sar-overlay" src={maskURL} alt="Backend segmentation overlaid on the original image"/>}
  </div>;
}
