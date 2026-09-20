import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { InvestigationContext } from '../contexts/InvestigationContext'

export default function Stage4() {
  const navigate = useNavigate()
  const { data, updateData } = useContext(InvestigationContext)
  const [loading, setLoading] = useState(false)

  const traceback = data.traceback
  const aisData = data.ais

  const runAisMatch = async () => {
    if (!traceback) return

    setLoading(true)

    try {
      const response = await fetch('http://localhost:8000/api/v1/ais_match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'success',
          stage: 3,
          data: traceback
        })
      })

      if (!response.ok) {
        throw new Error('AIS matching failed')
      }

      const json = await response.json()
      updateData('ais', json.data)
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
          <p className="stage-kicker">STAGE 04</p>
          <h2>AIS Vessel Analysis</h2>
          <p className="stage-description">
            Compare vessels inside the reconstructed source region and identify
            candidates that may require further investigation.
          </p>
        </div>

        <div className="simulated-tag">SIMULATED AIS</div>
      </div>

      {!traceback && (
        <div className="stage-warning">
          Traceback data is missing. Complete Stage 3 first.
        </div>
      )}

      {aisData && (
        <div className="ais-summary">
          <div className="ais-stat">
            <span>SHIPS SCANNED</span>
            <strong>{aisData.total_ships_scanned}</strong>
          </div>

          <div className="ais-stat">
            <span>IN VICINITY</span>
            <strong>{aisData.ships_in_vicinity}</strong>
          </div>

          <div className="ais-stat">
            <span>CANDIDATES FLAGGED</span>
            <strong>{aisData.flagged_vessels.length}</strong>
          </div>
        </div>
      )}

      <div className="ais-layout">
        <div className="ais-map-area">
          <div className="section-title">VESSEL SEARCH REGION</div>

          <div className="ais-map">
            {aisData ? (
              <>
                <div className="ais-origin-region">Estimated Source Region</div>

                {aisData.flagged_vessels.map((vessel, index) => (
                  <div
                    key={vessel.mmsi || index}
                    className={`ship-marker ship-${(index % 4) + 1}`}
                  >
                    ▲
                    <span>{index + 1}</span>
                  </div>
                ))}

                <div className="map-legend">
                  <div>
                    <span className="legend-source"></span>
                    Source Region
                  </div>

                  <div>
                    <span className="legend-vessel"></span>
                    Candidate Vessel
                  </div>
                </div>
              </>
            ) : (
              <div className="trace-placeholder">
                <div className="trace-placeholder-icon">◇</div>
                <strong>No AIS analysis yet</strong>
                <span>
                  Run vessel matching to search the reconstructed source region.
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="candidate-panel">
          <div className="section-title">CANDIDATE VESSELS</div>

          {aisData ? (
            <div className="candidate-list">
              {aisData.flagged_vessels.length > 0 ? (
                aisData.flagged_vessels.map((vessel, index) => (
                  <div className="candidate-card" key={vessel.mmsi || index}>
                    <div className="candidate-top">
                      <div className="candidate-number">
                        {String(index + 1).padStart(2, '0')}
                      </div>

                      <div className="candidate-name">
                        <strong>{vessel.name}</strong>
                        <span>{vessel.type}</span>
                      </div>

                      <div className="match-badge">
                        {vessel.match_confidence}
                      </div>
                    </div>

                    <div className="candidate-details">
                      <div>
                        <span>MMSI</span>
                        <strong>{vessel.mmsi}</strong>
                      </div>

                      <div>
                        <span>LATITUDE</span>
                        <strong>{vessel.lat.toFixed(4)}</strong>
                      </div>

                      <div>
                        <span>LONGITUDE</span>
                        <strong>{vessel.lon.toFixed(4)}</strong>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="candidate-empty">No candidate vessels found</div>
              )}
            </div>
          ) : (
            <div className="candidate-empty large">Waiting for AIS results</div>
          )}
        </div>
      </div>

      <div className="ais-note">
        <strong>Prototype Note</strong>
        <span>
          Vessel records shown in this stage are generated from simulated AIS
          data for demonstration purposes.
        </span>
      </div>

      <div className="stage-actions">
        <button
          className="secondary-btn"
          onClick={() => navigate('/stage3')}
        >
          ← Back to Source Trace
        </button>

        <div className="right-actions">
          <button
            className="btn primary-btn"
            onClick={runAisMatch}
            disabled={!traceback || loading}
          >
            {loading ? 'Matching Vessels...' : aisData ? 'Run Again' : 'Run AIS Match'}
          </button>

          <button
            className="next-btn"
            onClick={() => navigate('/stage5')}
            disabled={!aisData}
          >
            Rank Candidates
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  )
}
