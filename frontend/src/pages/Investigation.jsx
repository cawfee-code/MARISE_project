import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, LoaderCircle } from 'lucide-react';
import { stagesData } from '../data/stagesData';
import { canRunStage, validateBounds } from '../services/pipeline';
import { checkBackend } from '../services/api';

import Detection from '../components/investigation/Detection';
import Characterization from '../components/investigation/Characterization';
import Backtracking from '../components/investigation/Backtracking';
import AIS from '../components/investigation/AIS';
import Attribution from '../components/investigation/Attribution';
import Forecast from '../components/investigation/Forecast';
import BackendOutput from '../components/investigation/BackendOutput';
const phases = [Detection, Characterization, Backtracking, AIS, Attribution, Forecast];
const actions = ['Detect spill', 'Characterize mask', 'Run backtracking', 'Generate AIS candidates', 'Generate attribution', 'Run 48-hour forecast'];
export default function Investigation({ session }) {

  const { stage, setStage, file, bounds, results, active, run, cancel, error, notice, demoMode } = session;
  const [connection, setConnection] = useState('unchecked');
  const [connectionMessage, setConnectionMessage] = useState('');
  const probe = useRef(null);
  useEffect(() => () => probe.current?.abort(), []);
  async function check() {
    probe.current?.abort();
    const controller = new AbortController(); probe.current = controller;
    setConnection('checking'); setConnectionMessage('');
    try { const title = await checkBackend(controller.signal); setConnection('connected'); setConnectionMessage(`${title}: all six endpoints are available.`); }
    catch (e) { if (e.name !== 'AbortError') { setConnection('unavailable'); setConnectionMessage(e.message); } }
  }
  const data = stagesData[stage], Phase = phases[stage];
  const busy = active !== null;
  const firstIncomplete = Array.from({ length: 6 }, (_, i) => i).find(i => !results[i]);
  const continuation = firstIncomplete ?? 0;
  return <div className="investigation page-enter">
    <div className="workspace-top"><a href="#investigation"><ArrowLeft size={14}/> All stages</a><span>INVESTIGATION / {results[4]?.data?.case_id || 'NEW SCENE'}</span><button className="connection-button" onClick={check} disabled={connection === 'checking'}>{connection === 'checking' ? 'Checking backend…' : connection === 'connected' ? 'Backend reachable · recheck' : 'Check backend connection'}</button></div>
    {connectionMessage && <p className={`connection-message ${connection === 'unavailable' ? 'error' : ''}`} role="status">{connectionMessage}</p>}
    <div className="provenance-strip">SAR model + geometry · Drift uses fallback conditions · AIS and attribution use simulated vessels</div>
    <nav className="phase-nav" aria-label="Investigation phases">{stagesData.map((s, i) => <button key={s.number} aria-current={i === stage ? 'step' : undefined} onClick={() => setStage(i)}><span>{s.number}</span>{s.label}{active === i ? <LoaderCircle className="spinning" size={13} aria-label="Running"/> : results[i] ? <Check size={13} aria-label="Complete"/> : null}</button>)}</nav>
    <div className="stage-heading"><div><span className="eyebrow">PHASE {data.number} / {data.subtitle}</span><h1>{data.title}</h1></div><p>{data.description}</p></div>
    <div className="pipeline-controls">
      <div><span className="eyebrow">{busy ? `RUNNING PHASE ${String(active + 1).padStart(2,'0')}` : `${results.filter(Boolean).length} / 6 PHASES RETURNED`}</span><p>{busy ? 'Analysis can take several minutes. Keep this workspace open.' : file ? (demoMode ? 'Demo SAR observation' : 'Uploaded SAR observation') : 'Choose a SAR image to begin; all coordinates are optional.'}</p></div>
      <div className="pipeline-actions">{busy ? <button className="small-button" onClick={cancel}>Cancel analysis</button> : <><button className="small-button" disabled={!canRunStage(stage, results, file, bounds)} onClick={() => run(stage)}>{results[stage] ? `Rerun / ${actions[stage]}` : actions[stage]}</button><button className="liquid-button" disabled={!canRunStage(continuation, results, file, bounds)} onClick={() => run(continuation, true)}>{firstIncomplete === undefined ? 'Restart full investigation' : firstIncomplete === 0 ? 'Run full investigation' : 'Continue remaining phases'}<ArrowRight size={16}/></button></>}</div>
    </div>
    {error && <p className="pipeline-message error" role="alert">{error} Completed results are retained; retry the failed phase when ready.</p>}
    {notice && <p className="pipeline-message" role="status">{notice}</p>}
    <div className="stage-content" key={stage} aria-busy={busy && active === stage}><Phase {...session}/></div>
    {!demoMode && <BackendOutput result={results[stage]} stage={stage + 1} demoMode={false} />}
    <div className="stage-bottom"><span>{validateBounds(bounds) ? 'CHECK OPTIONAL COORDINATES' : 'RESULTS FROM YOUR BACKEND · SEE DATA LIMITATIONS'}</span><div><button disabled={stage === 0} onClick={() => setStage(stage - 1)} aria-label="Previous phase"><ArrowLeft size={18}/></button><button disabled={stage === 5} onClick={() => setStage(stage + 1)}>{stage === 5 ? 'Final phase' : `Next / ${stagesData[stage + 1].label}`}<ArrowRight size={18}/></button></div></div>
  </div>;
}
