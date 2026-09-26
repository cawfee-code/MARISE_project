import { Note } from './StageParts';
export function EmptyPhase({ title, description }) {
  return <><div className="image-empty"><span className="eyebrow">AWAITING ANALYSIS</span><h3>{title}</h3><p>{description}</p></div><aside className="analysis-side"><span className="eyebrow">EVIDENCE FIRST</span><Note>Results appear only after a successful backend response. Complete the required earlier phases, or use “Run full investigation” from Detection.</Note></aside></>;
}
