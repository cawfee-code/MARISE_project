import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { InvestigationContext } from '../contexts/InvestigationContext'

export default function Stage6() {
  const navigate = useNavigate()
  const { data, updateData } = useContext(InvestigationContext)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const traceback = data.traceback
  const forecast = data.forecast

  const projections = forecast?.projections || []

  const runForecast = async () => {
    if (!traceback?.spill_location) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        'http://localhost:8000/api/v1/forecast',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            lat: traceback.spill_location.lat,
            lon: traceback.spill_location.lon
          })
        }
      )

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || 'Forecast failed')
      }

      const json = await response.json()

      updateData('forecast', json.data)
    } catch (err) {
      console.error(err)

      setError(
        'Could not generate the spill forecast. Check the backend connection and source-trace data.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-panel">

      <div className="stage-heading">

        <div>
          <p className="stage-kicker">
            STAGE 06
          </p>

          <h2>
            Spill Trajectory Forecast
          </h2>

          <p className="stage-description">
            Simulate future spill movement and estimate
            projected positions over the next 48 hours.
          </p>
        </div>


        <div className="model-tag">
          OpenOil Forecast
        </div>

      </div>


      {!traceback?.spill_location && (
        <div className="stage-warning">
          Spill location is missing. Complete Stage 3 first.
        </div>
      )}


      {error && (
        <div className="stage-warning">
          {error}
        </div>
      )}


      {forecast && traceback?.spill_location && (

        <div className="forecast-summary">

          <div>
            <span>START LATITUDE</span>

            <strong>
              {Number(
                traceback.spill_location.lat
              ).toFixed(4)}
            </strong>
          </div>


          <div>
            <span>START LONGITUDE</span>

            <strong>
              {Number(
                traceback.spill_location.lon
              ).toFixed(4)}
            </strong>
          </div>


          <div>
            <span>FORECAST WINDOW</span>

            <strong>
              48 Hours
            </strong>
          </div>


          <div>
            <span>STATUS</span>

            <strong className="forecast-status">
              {forecast.warning_status || 'N/A'}
            </strong>
          </div>


          <div>
            <span>COASTAL IMPACT</span>

            <strong>
              {forecast.coastal_impact_risk || 'N/A'}
            </strong>
          </div>


          <div>
            <span>SHORELINE IMPACT</span>

            <strong>
              {forecast.projected_shoreline_impact_percent || 'N/A'}
            </strong>
          </div>

        </div>

      )}


      <div className="forecast-layout">

        <div className="forecast-map-section">

          <div className="section-title">
            PROJECTED TRAJECTORY
          </div>


          <div className="forecast-map">

            {projections.length > 0 ? (

              <>

                <div className="forecast-start">

                  <div className="forecast-start-dot" />

                  <span>
                    Current Spill
                  </span>

                </div>


                <div className="forecast-path-line" />


                {projections.map((point, index) => (

                  <div
                    key={point.timeframe}
                    className={`forecast-point forecast-point-${index + 1}`}
                  >

                    <div className="forecast-point-dot" />

                    <span>
                      {point.timeframe}
                    </span>

                  </div>

                ))}


                <div className="forecast-map-legend">

                  <div>
                    <span className="legend-current" />
                    Current position
                  </div>

                  <div>
                    <span className="legend-projected" />
                    Forecast position
                  </div>

                </div>

              </>

            ) : (

              <div className="trace-placeholder">

                <div className="trace-placeholder-icon">
                  →
                </div>

                <strong>
                  No trajectory forecast yet
                </strong>

                <span>
                  Run the forecast model to project spill
                  movement over the next 48 hours.
                </span>

              </div>

            )}

          </div>

        </div>


        <div className="projection-section">

          <div className="section-title">
            FORECAST TIMELINE
          </div>


          {projections.length > 0 ? (

            <div className="projection-list">

              {projections.map((point) => (

                <div
                  className="projection-card"
                  key={point.timeframe}
                >

                  <div className="projection-time">

                    <span>
                      FORECAST
                    </span>

                    <strong>
                      {point.timeframe}
                    </strong>


                    {point.projected_utc && (
                      <small className="projection-utc">
                        {point.projected_utc}
                      </small>
                    )}

                  </div>


                  <div className="projection-data">

                    <div>
                      <span>LATITUDE</span>

                      <strong>
                        {Number(point.lat).toFixed(4)}
                      </strong>
                    </div>


                    <div>
                      <span>LONGITUDE</span>

                      <strong>
                        {Number(point.lon).toFixed(4)}
                      </strong>
                    </div>


                    <div>
                      <span>UNCERTAINTY</span>

                      <strong>
                        ±{Number(
                          point.uncertainty_radius_km
                        ).toFixed(2)} km
                      </strong>
                    </div>

                  </div>

                </div>

              ))}

            </div>

          ) : (

            <div className="projection-empty">
              Waiting for forecast results
            </div>

          )}

        </div>

      </div>


      <div className="forecast-note">

        <div>
          <span>MODEL</span>

          <strong>
            OpenOil Forward Drift
          </strong>
        </div>


        <div>
          <span>PARTICLES</span>

          <strong>
            1000
          </strong>
        </div>


        <div>
          <span>INITIAL RADIUS</span>

          <strong>
            1000 m
          </strong>
        </div>


        <div>
          <span>PREDICTION</span>

          <strong>
            6h → 48h
          </strong>
        </div>

      </div>


      <div className="forecast-disclaimer">
        Forecast positions are model-based estimates generated
        using the environmental conditions configured in this
        prototype. Actual spill movement may vary with changing
        wind and ocean-current conditions.
      </div>


      <div className="stage-actions">

        <button
          className="secondary-btn"
          onClick={() => navigate('/stage5')}
        >
          ← Back to Attribution
        </button>


        <div className="right-actions">

          <button
            className="btn primary-btn"
            onClick={runForecast}
            disabled={!traceback?.spill_location || loading}
          >
            {loading
              ? 'Simulating...'
              : forecast
                ? 'Run Forecast Again'
                : 'Run Forecast'}
          </button>

        </div>

      </div>

    </div>
  )
}