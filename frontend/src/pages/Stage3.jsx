import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { InvestigationContext } from '../contexts/InvestigationContext'

export default function Stage3() {
  const navigate = useNavigate()
  const { data, updateData } = useContext(InvestigationContext)
  const [loading, setLoading] = useState(false)

  const geometry = data.geometry
  const traceback = data.traceback
  const confidenceValue = traceback ? parseFloat(traceback.confidence_score) || 0 : 0

  const runHindcast = async () => {
    if (!geometry) return

    setLoading(true)

    try {
      const response = await fetch('http://localhost:8000/api/v1/hindcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'success',
          stage: 2,
          geometry
        })
      })

      if (!response.ok) {
        throw new Error('Hindcast failed')
      }

      const json = await response.json()
      updateData('traceback', json.data)
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-panel">
      <div className="stage-heading">
        <div>
          <p className="stage-kicker">STAGE 03</p>
          <h2>Source Traceback</h2>
          <p className="stage-description">
            Reconstruct the possible spill origin by running a backward drift
            simulation from the detected location.
          </p>
        </div>

        <div className="model-tag">OpenOil Hindcast</div>
      </div>

      {!geometry && (
        <div className="stage-warning">
          Geometry data is missing. Complete Stage 2 first.
        </div>
      )}

      <div className="trace-layout">
        <div className="trace-visual">
          <div className="section-title">SOURCE RECONSTRUCTION</div>

          <div className="trace-map">
            {traceback ? (
              <>
                <div className="origin-zone">
                  <span>
                    Estimated
                    <br />
                    Origin
                  </span>
                </div>

                <div className="trace-path">
                  <span>←</span>
                  <span>←</span>
                  <span>←</span>
                </div>

                <div className="spill-point">
                  <div className="spill-dot"></div>
                  <span>Detected Spill</span>
                </div>
              </>
            ) : (
              <div className="trace-placeholder">
                <div className="trace-placeholder-icon">↺</div>
                <strong>No traceback simulation yet</strong>
                <span>
                  Run the hindcast model to estimate the possible source region.
                </span>
              </div>
            )}
          </div>

          <div className="trace-note">Backward particle drift reconstruction</div>
        </div>

        <div className="trace-results">
          <div className="section-title">HINDCAST RESULTS</div>

          {traceback ? (
            <>
              <div className="trace-stat">
                <span>DETECTED LOCATION</span>
                <strong>
                  {traceback.spill_location.lat.toFixed(4)}°
                  <br />
                  {traceback.spill_location.lon.toFixed(4)}°
                </strong>
              </div>

              <div className="trace-stat">
                <span>ESTIMATED RELEASE TIME</span>
                <strong className="trace-time">
                  {traceback.estimated_dump_time}
                </strong>
              </div>

              <div className="trace-stat">
                <span>SOURCE CONFIDENCE</span>

                <div className="confidence-row">
                  <strong>{traceback.confidence_score}</strong>

                  <div className="confidence-track">
                    <div
                      className="confidence-fill"
                      style={{ width: `${confidenceValue}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="origin-list">
                <span className="origin-title">ESTIMATED SOURCE REGION</span>

                {traceback.origin_polygon.map((point, index) => (
                  <div className="origin-point" key={index}>
                    <span>P{index + 1}</span>
                    <strong>
                      {point.lat.toFixed(4)}, {point.lon.toFixed(4)}
                    </strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="trace-results-empty">Waiting for hindcast results</div>
          )}
        </div>
      </div>

      <div className="simulation-strip">
        <div>
          <span>SIMULATION</span>
          <strong>Backward Drift</strong>
        </div>

        <div>
          <span>TIME WINDOW</span>
          <strong>12 Hours</strong>
        </div>

        <div>
          <span>PARTICLES</span>
          <strong>500</strong>
        </div>

        <div>
          <span>OUTPUT</span>
          <strong>Source Region</strong>
        </div>
      </div>

      <div className="stage-actions">
        <button
          className="secondary-btn"
          onClick={() => navigate('/stage2')}
        >
          ← Back to Characterization
        </button>

        <div className="right-actions">
          <button
            className="btn primary-btn"
            onClick={runHindcast}
            disabled={!geometry || loading}
          >
            {loading ? 'Running Hindcast...' : traceback ? 'Run Again' : 'Run Hindcast'}
          </button>

          <button
            className="next-btn"
            onClick={() => navigate('/stage4')}
            disabled={!traceback}
          >
            Analyze AIS Vessels
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  )
}
