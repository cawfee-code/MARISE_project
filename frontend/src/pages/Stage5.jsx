import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { InvestigationContext } from '../contexts/InvestigationContext'

export default function Stage5() {
  const navigate = useNavigate()
  const { data, updateData } = useContext(InvestigationContext)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const aisData = data.ais
  const attribution = data.attribution

  const candidates = attribution?.ranked_candidates || []

  const generateCaseFile = async () => {
    if (!aisData) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        'http://localhost:8000/api/v1/attribution',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'success',
            stage: 4,
            data: aisData
          })
        }
      )

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Attribution failed')
      }

      const json = await response.json()

      updateData('attribution', json.data)
    } catch (err) {
      console.error(err)
      setError(
        'Could not generate the attribution report. Check the backend connection and AIS data.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-panel">

      <div className="stage-heading">
        <div>
          <p className="stage-kicker">STAGE 05</p>

          <h2>Vessel Attribution</h2>

          <p className="stage-description">
            Rank candidate vessels using spatial, temporal,
            cargo-risk and behavioral evidence.
          </p>
        </div>

        <div className="model-tag">
          Evidence Ranking
        </div>
      </div>


      {!aisData && (
        <div className="stage-warning">
          AIS analysis data is missing. Complete Stage 4 first.
        </div>
      )}


      {error && (
        <div className="stage-warning">
          {error}
        </div>
      )}


      {attribution && (
        <div className="case-summary">

          <div>
            <span>CASE ID</span>
            <strong>
              {attribution.case_id || 'N/A'}
            </strong>
          </div>

          <div>
            <span>GENERATED</span>
            <strong>
              {attribution.timestamp || 'N/A'}
            </strong>
          </div>

          <div>
            <span>CANDIDATES</span>
            <strong>
              {candidates.length}
            </strong>
          </div>

        </div>
      )}


      <div className="attribution-layout">

        <div className="ranking-section">

          <div className="section-title">
            INVESTIGATION RANKING
          </div>


          {candidates.length > 0 ? (

            <div className="ranking-list">

              {candidates.map((candidate) => {
                const score =
                  parseFloat(candidate.overall_compatibility) || 0

                const evidence =
                  candidate.evidence_breakdown

                return (
                  <div
                    className="ranking-card"
                    key={candidate.mmsi}
                  >

                    <div className="rank-column">
                      <span>RANK</span>

                      <strong>
                        {String(candidate.rank).padStart(2, '0')}
                      </strong>
                    </div>


                    <div className="rank-info">

                      <div className="rank-header">

                        <div>
                          <strong className="rank-name">
                            {candidate.vessel_name}
                          </strong>

                          <span className="rank-type">
                            {candidate.type}
                          </span>
                        </div>


                        <div className="priority-tag">
                          {candidate.investigation_priority}
                        </div>

                      </div>


                      <div className="rank-data">

                        <div>
                          <span>MMSI</span>
                          <strong>
                            {candidate.mmsi}
                          </strong>
                        </div>

                        <div>
                          <span>COMPATIBILITY</span>
                          <strong>
                            {candidate.overall_compatibility}
                          </strong>
                        </div>

                      </div>


                      <div className="score-track">
                        <div
                          className="score-fill"
                          style={{
                            width: `${Math.min(score, 100)}%`
                          }}
                        />
                      </div>


                      {evidence && (
                        <div className="evidence-breakdown">

                          <div>
                            <span>SPATIAL</span>
                            <strong>
                              {evidence.spatial_proximity_score || 'N/A'}
                            </strong>
                          </div>

                          <div>
                            <span>TEMPORAL</span>
                            <strong>
                              {evidence.temporal_match_score || 'N/A'}
                            </strong>
                          </div>

                          <div>
                            <span>CARGO RISK</span>
                            <strong>
                              {evidence.vessel_cargo_risk || 'N/A'}
                            </strong>
                          </div>

                          <div>
                            <span>BEHAVIOR</span>
                            <strong>
                              {evidence.behavioral_anomaly_score || 'N/A'}
                            </strong>
                          </div>

                        </div>
                      )}


                      {evidence?.behavioral_observation && (
                        <p className="behavior-note">
                          {evidence.behavioral_observation}
                        </p>
                      )}

                    </div>
                  </div>
                )
              })}

            </div>

          ) : (

            <div className="ranking-empty">

              <strong>
                {attribution
                  ? 'No candidate ranking available'
                  : 'No ranking generated'}
              </strong>

              <span>
                {attribution?.verdict_summary ||
                  attribution?.verdict ||
                  'Generate the case file to rank candidate vessels.'}
              </span>

            </div>

          )}

        </div>


        <div className="evidence-section">

          <div className="section-title">
            CASE SUMMARY
          </div>


          {attribution ? (

            <div className="evidence-card">

              <span className="evidence-label">
                ATTRIBUTION RESULT
              </span>

              <p>
                {attribution.verdict_summary ||
                  attribution.verdict ||
                  'No attribution summary available.'}
              </p>


              <div className="evidence-divider" />


              <span className="evidence-label">
                RECOMMENDED ACTION
              </span>

              <p>
                {attribution.recommended_action ||
                  'No recommendation available.'}
              </p>


              <div className="evidence-divider" />


              <span className="evidence-label">
                INVESTIGATION STATUS
              </span>

              <div className="investigation-status">
                {candidates.length > 0
                  ? 'Candidate ranking generated'
                  : 'Inconclusive / no ranked candidates'}
              </div>

            </div>

          ) : (

            <div className="evidence-empty">
              Waiting for attribution results
            </div>

          )}


          <div className="disclaimer-box">

            <strong>
              Investigative Use Only
            </strong>

            <p>
              {attribution?.system_disclaimer ||
                `Compatibility scores indicate investigative
                relevance and consistency with available evidence.
                They do not establish legal responsibility.`}
            </p>

          </div>

        </div>

      </div>


      <div className="stage-actions">

        <button
          className="secondary-btn"
          onClick={() => navigate('/stage4')}
        >
          ← Back to AIS Analysis
        </button>


        <div className="right-actions">

          <button
            className="btn primary-btn"
            onClick={generateCaseFile}
            disabled={!aisData || loading}
          >
            {loading
              ? 'Generating...'
              : attribution
                ? 'Regenerate Case File'
                : 'Generate Case File'}
          </button>


          <button
            className="next-btn"
            onClick={() => navigate('/stage6')}
            disabled={!attribution}
          >
            Forecast Spill Movement
            <span>→</span>
          </button>

        </div>

      </div>

    </div>
  )
}