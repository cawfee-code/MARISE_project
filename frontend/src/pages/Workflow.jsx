import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, LoaderCircle, Satellite, Upload } from 'lucide-react';
import { stagesData } from '../data/stagesData';
import { coordinateFields } from '../config/sceneConfig';
import { canRunStage, validateBounds } from '../services/pipeline';
import Detection from '../components/investigation/Detection';
import Characterization from '../components/investigation/Characterization';
import Backtracking from '../components/investigation/Backtracking';
import AIS from '../components/investigation/AIS';
import Attribution from '../components/investigation/Attribution';
import Forecast from '../components/investigation/Forecast';
import BackendOutput from '../components/investigation/BackendOutput';

const phases = [Detection, Characterization, Backtracking, AIS, Attribution, Forecast];

export default function Workflow({ session }) {
  const {
    file,
    bounds,
    results,
    active,
    preview,
    demoMode,
    selectFile,
    updateBounds,
    loadDemo,
    run,
    cancel,
    error,
    notice
  } = session;

  const input = useRef();
  const startedDemo = useRef(false);
  const [inputError, setInputError] = useState('');
  const [checking, setChecking] = useState(false);
  const [viewStage, setViewStage] = useState(0);

  const busy = active !== null;
  const complete = results.filter(Boolean).length;
  const next = Array.from({ length: 6 }, (_, i) => i).find(i => !results[i]) ?? 0;
  const Phase = phases[viewStage];
  const selectedStage = stagesData[viewStage];

  useEffect(() => {
    if (!startedDemo.current && !file && !results.length) {
      startedDemo.current = true;
      loadDemo();
    }
  }, [file, results.length, loadDemo]);

  useEffect(() => {
    if (!results.some(Boolean)) setViewStage(0);
  }, [results]);

  async function choose(nextFile) {
    if (!nextFile) return;
    setInputError('');
    setChecking(true);

    try {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(nextFile.type) || nextFile.size > 20 * 1024 * 1024) {
        throw new Error('Choose a PNG, JPEG or WebP image under 20 MB.');
      }

      const bitmap = await createImageBitmap(nextFile);
      const pixels = bitmap.width * bitmap.height;
      bitmap.close();

      if (pixels > 40_000_000) throw new Error('Choose an image under 40 megapixels.');
      selectFile(nextFile);
      setViewStage(0);
    } catch (e) {
      setInputError(e.message);
    } finally {
      setChecking(false);
      input.current.value = '';
    }
  }

  return (
    <div className="workflow workflow-console page-enter">
      <section className="console-heading">
        <div>
          <span className="eyebrow">MARISE INVESTIGATION</span>
          <h1>Follow the evidence.</h1>
        </div>
        <div className="console-progress" aria-label={`${complete} of 6 stages complete`}>
          <strong>{String(complete).padStart(2, '0')}</strong>
          <span>/ 06</span>
        </div>
      </section>

      <section className="scene-console" id="investigation">
        <div className="scene-console-preview">
          {preview ? <img src={preview} alt="Selected SAR observation" /> : <Satellite size={34} strokeWidth={1.2} />}
        </div>

        <div className="scene-console-copy">
          <h2>{demoMode ? 'Demo observation' : file ? 'SAR observation' : 'Satellite scene'}</h2>
          <p>{demoMode ? 'Sample image loaded automatically. Upload your own image to investigate another scene.' : 'Upload once, then run the full pipeline.'}</p>
        </div>

        <input
          ref={input}
          type="file"
          hidden
          accept="image/png,image/jpeg,image/webp"
          onChange={e => choose(e.target.files[0])}
        />

        <button className="secondary-button console-upload" disabled={busy || checking} onClick={() => input.current.click()}>
          <Upload size={16} />
          {checking ? 'Reading…' : file && !demoMode ? 'Replace' : 'Upload image'}
        </button>
        {!file && <button className="secondary-button" disabled={busy} onClick={loadDemo}>Replay sample</button>}

        {(
          <div className="console-bounds">
            {coordinateFields.map(([key, label]) => (
              <label key={key}>
                <span>{label}</span>
                <input
                  type="number"
                  step="any"
                  min={key.includes('lat') ? -90 : -180}
                  max={key.includes('lat') ? 90 : 180}
                  value={bounds[key]}
                  onChange={e => updateBounds({ ...bounds, [key]: e.target.value })}
                />
              </label>
            ))}
          </div>
        )}

        {(
          <div className="console-action">
            {busy ? (
              <button className="secondary-button" onClick={cancel}>Stop</button>
            ) : (
              <button
                className="liquid-button"
                disabled={!canRunStage(next, results, file, bounds) || checking}
                onClick={() => demoMode ? input.current?.click() : run(next, true)}
              >
                {demoMode ? 'Investigate another image' : complete === 6 ? 'Run full investigation again' : next > 0 ? 'Continue full investigation' : 'Run full investigation'}
                <ArrowRight size={17} />
              </button>
            )}
          </div>
        )}
      </section>

      {inputError && <p className="pipeline-message error" role="alert">{inputError}</p>}
      {!demoMode && validateBounds(bounds) && file && <p className="pipeline-message" role="status">{validateBounds(bounds)}</p>}
      {error && <p className="pipeline-message error" role="alert">{error}</p>}
      {notice && <p className="pipeline-message" role="status">{notice}</p>}

      <section className="stage-console" aria-label="MARISE investigation stages">
        <nav className="stage-rail" aria-label="Investigation pipeline">
          {stagesData.map((stage, index) => {
            const isRunning = active === index;
            const isComplete = Boolean(results[index]);
            const isSelected = viewStage === index;

            return (
              <button
                key={stage.number}
                className={`stage-rail-item ${isSelected ? 'is-selected' : ''} ${isRunning ? 'is-running' : ''} ${isComplete ? 'is-complete' : ''}`}
                onClick={() => setViewStage(index)}
                aria-current={isSelected ? 'step' : undefined}
              >
                <span className="stage-rail-number">{stage.number}</span>
                <span className="stage-rail-label">{stage.label}</span>
                <span className="stage-rail-marker" aria-hidden="true">
                  {isRunning ? <LoaderCircle className="spinning" size={13} /> : isComplete ? <Check size={13} /> : null}
                </span>
              </button>
            );
          })}
        </nav>

        <article className={`stage-focus ${active === viewStage ? 'is-running' : ''}`} key={viewStage}>
          <header className="stage-focus-heading">
            <span>{selectedStage.number}</span>
            <div>
              <h2>{selectedStage.label}</h2>
              <p>{selectedStage.title}</p>
            </div>
            {!demoMode && !busy && <button className="secondary-button stage-run-button" disabled={checking || !canRunStage(viewStage, results, file, bounds)} onClick={() => run(viewStage)}><ArrowRight size={15} />{results[viewStage] ? 'Rerun this stage' : 'Run this stage'}</button>}
            {active === viewStage && <div className="stage-focus-running"><LoaderCircle className="spinning" size={16} /> Processing</div>}
          </header>

          <div className="stage-focus-content" aria-busy={active === viewStage}>
            <Phase {...session} />
          </div>
          {!demoMode && <BackendOutput result={results[viewStage]} stage={viewStage + 1} demoMode={false} />}
        </article>
      </section>
    </div>
  );
}
