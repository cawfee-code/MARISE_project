export default function BackendOutput({ result, stage, demoMode }) {
  if (!result) return null;
  const output = stage === 1
    ? { format: demoMode ? 'JPEG screenshot of the PNG response' : 'image/png', size_bytes: result.size, response_headers: result.responseHeaders || {}, note: demoMode ? 'The project team supplied a screenshot of the mask, not the original PNG bytes.' : 'The returned PNG mask is displayed above.' }
    : result;
  return <details className="backend-output">
    <summary>{demoMode ? 'View supplied sample output' : 'View exact backend response'} <span>{stage === 1 ? (demoMode ? 'Mask screenshot + headers' : 'PNG + headers') : 'JSON'}</span></summary>
    <pre>{JSON.stringify(output, null, 2)}</pre>
  </details>;
}
