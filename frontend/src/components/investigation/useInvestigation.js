import { useEffect, useRef, useState } from 'react';
import { sceneConfig } from '../../config/sceneConfig';
import { createDemoResults, emptyCoordinates } from '../../data/demoInvestigation';
import { canRunStage, executeStage, validateBounds } from '../../services/pipeline';

export function useObjectURL(blob) {
  const [url, setURL] = useState('');
  useEffect(() => {
    if (!blob) { setURL(''); return; }
    const next = URL.createObjectURL(blob); setURL(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  return url;
}

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

export default function useInvestigation() {
  const [file, setFile] = useState(null);
  const [bounds, setBounds] = useState(emptyCoordinates);
  const [results, setResults] = useState([]);
  const [active, setActive] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [stage, setStage] = useState(0);
  const [demoMode, setDemoMode] = useState(false);
  const request = useRef(null), generation = useRef(0), demoLoading = useRef(false);
  const preview = useObjectURL(file), maskURL = useObjectURL(results[0]);

  useEffect(() => () => { generation.current++; request.current?.abort(); }, []);

  function cancel() {
    generation.current++; request.current?.abort(); request.current = null;
    demoLoading.current = false;
    setActive(null); setNotice('Cancelled. Completed phases are retained.');
  }

  function invalidate() {
    generation.current++; request.current?.abort(); request.current = null;
    demoLoading.current = false;
    setResults([]); setActive(null); setError(''); setNotice('');
  }

  function selectFile(next) {
    invalidate();
    setDemoMode(false);
    setFile(next);
    setBounds(emptyCoordinates);
    setStage(0);
  }

  function updateBounds(next) {
    invalidate();
    setDemoMode(false);
    setBounds(next);
  }

  async function loadDemo() {
    if (file || results.length || demoLoading.current) return;
    demoLoading.current = true;
    const token = ++generation.current;
    setError('');
    setNotice('Opening the built-in offline demonstration…');
    try {
      const [response, maskResponse] = await Promise.all([fetch(sceneConfig.imageUrl), fetch(sceneConfig.maskUrl)]);
      if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw new Error('The bundled demonstration image could not be loaded.');
      if (!maskResponse.ok || !maskResponse.headers.get('content-type')?.startsWith('image/')) throw new Error('The supplied Stage 1 mask could not be loaded.');
      const [blob, mask] = await Promise.all([response.blob(), maskResponse.blob()]);
      if (token !== generation.current) return;

      setFile(new File([blob], 'sample-sar.png', { type: blob.type }));
      setBounds({ ...sceneConfig.coordinates });
      setDemoMode(true);

      const demoResults = createDemoResults(mask);
      const progressive = [];
      for (let i = 0; i < demoResults.length; i++) {
        if (token !== generation.current) return;
        setActive(i);
        progressive[i] = demoResults[i];
        setResults([...progressive]);
        await pause(40);
      }
      if (token === generation.current) {
        setActive(null);
        setNotice('Sample responses from the project team are displayed. Upload a SAR image to obtain fresh results from your backend.');
      }
    } catch (failure) {
      if (token === generation.current) {
        setActive(null);
        setError(failure.message);
      }
    } finally {
      if (token === generation.current) demoLoading.current = false;
    }
  }

  async function run(index, all = false) {
    if (request.current) return;
    const invalid = validateBounds(bounds);
    if (!file || invalid) { setError(!file ? 'Choose a SAR image first.' : invalid); setStage(0); return; }
    if (!canRunStage(index, results, file, bounds)) { setError('Complete the required previous phases first.'); return; }
    const controller = new AbortController(); request.current = controller;
    const token = ++generation.current, current = results.slice(0, index);
    setDemoMode(false);
    setResults([...current]); setError(''); setNotice('');
    try {
      for (let i = index; i <= (all ? 5 : index); i++) {
        setActive(i); setStage(i);
        const value = await executeStage(i, current, file, bounds, controller.signal);
        if (token !== generation.current) return;
        current[i] = value; setResults([...current]);
        if (i === 1 && (value.geometry.status === 'empty' || value.geometry.area_pixels === 0)) {
          setNotice('No spill region survived the backend filters. Later phases have been stopped. An empty mask can also indicate a rejected input.');
          break;
        }
      }
    } catch (failure) {
      if (token === generation.current && failure.name !== 'AbortError') setError(failure.message);
    } finally {
      if (token === generation.current) { setActive(null); request.current = null; }
    }
  }

  return {
    file, bounds, results, active, error, notice, stage, setStage,
    preview, maskURL, demoMode, selectFile, updateBounds, loadDemo, run, cancel
  };
}
