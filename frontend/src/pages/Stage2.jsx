import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { InvestigationContext } from '../contexts/InvestigationContext'

export default function Stage2() {
  const navigate = useNavigate()

  const { data, updateData } =
    useContext(InvestigationContext)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const maskUrl = data.maskurl
  const maskBlob = data.maskblob
  const geometry = data.geometry

  const runCharacterization = async () => {
    if (!maskBlob) {
      setError(
        'Detection mask is unavailable. Please run Stage 1 detection again.'
      )
      return
    }

    setLoading(true)
    setError(null)

    const formData = new FormData()

    formData.append(
      'mask_file',
      maskBlob,
      'mask.png'
    )

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/api/v1/characterize',
        {
          method: 'POST',
          body: formData
        }
      )

      if (!response.ok) {
        const text = await response.text()

        console.error(text)

        throw new Error(
          `Characterization failed: ${response.status}`
        )
      }

      const json = await response.json()

      console.log(
        'STAGE 2 CHARACTERIZATION RESPONSE:',
        json
      )

      const geometryData =
        json?.geometry ??
        json?.data?.geometry ??
        json?.data ??
        json

      console.log(
        'GEOMETRY DATA:',
        geometryData
      )

      updateData(
        'geometry',
        geometryData
      )
    } catch (error) {
      console.error(
        'Characterization error:',
        error
      )

      if (error instanceof TypeError) {
        setError(
          'Unable to connect to the backend.'
        )
      } else {
        setError(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const formatLabel = key => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, letter =>
        letter.toUpperCase()
      )
  }

  const formatValue = value => {
    if (
      value === null ||
      value === undefined
    ) {
      return 'N/A'
    }

    if (typeof value === 'number') {
      if (!Number.isInteger(value)) {
        return value.toFixed(3)
      }

      return value
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    }

    if (Array.isArray(value)) {
      return value
        .map(item => {
          if (
            typeof item === 'object' &&
            item !== null
          ) {
            return JSON.stringify(item)
          }

          return item
        })
        .join(', ')
    }

    if (typeof value === 'object') {
      return JSON.stringify(
        value,
        null,
        2
      )
    }

    return value
  }

  const mainFields = [
    'area_pixels',
    'centroid_x',
    'centroid_y',
    'confidence'
  ]

  const extraGeometryEntries =
    geometry
      ? Object.entries(geometry).filter(
          ([key]) =>
            !mainFields.includes(key)
        )
      : []

  return (
    <div className="glass-panel">
      <div className="stage-heading">
        <div>
          <p className="stage-kicker">
            STAGE 02
          </p>

          <h2>
            Spill Characterization
          </h2>

          <p className="stage-description">
            Analyze the segmented spill
            region and extract geometric
            properties for source
            reconstruction.
          </p>
        </div>

        <div className="model-tag">
          Geometry Analysis
        </div>
      </div>

      {!maskUrl && (
        <div className="stage-warning">
          No detection mask found.
          Complete Stage 1 first.
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="characterization-layout">
        <div className="mask-section">
          <div className="section-title">
            DETECTION MASK
          </div>

          <div className="mask-preview">
            {maskUrl ? (
              <img
                src={maskUrl}
                alt="Detected spill mask"
              />
            ) : (
              <div className="empty-mask">
                No mask available
              </div>
            )}
          </div>
        </div>

        <div className="geometry-section">
          <div className="section-title">
            SPILL MEASUREMENTS
          </div>

          {geometry ? (
            <div className="geometry-results">
              {geometry.area_pixels !==
                undefined && (
                <div className="geometry-item">
                  <span>
                    SPILL AREA
                  </span>

                  <strong>
                    {formatValue(
                      geometry.area_pixels
                    )}
                    <small> px</small>
                  </strong>
                </div>
              )}

              {geometry.centroid_x !==
                undefined && (
                <div className="geometry-item">
                  <span>
                    CENTROID X
                  </span>

                  <strong>
                    {formatValue(
                      geometry.centroid_x
                    )}
                  </strong>
                </div>
              )}

              {geometry.centroid_y !==
                undefined && (
                <div className="geometry-item">
                  <span>
                    CENTROID Y
                  </span>

                  <strong>
                    {formatValue(
                      geometry.centroid_y
                    )}
                  </strong>
                </div>
              )}

              {geometry.confidence !==
                undefined && (
                <div className="geometry-item">
                  <span>
                    CONFIDENCE
                  </span>

                  <strong className="geometry-status">
                    {formatValue(
                      geometry.confidence
                    )}
                  </strong>
                </div>
              )}
            </div>
          ) : (
            <div className="geometry-empty">
              <div className="geometry-empty-icon">
                +
              </div>

              <strong>
                Geometry not extracted
              </strong>

              <span>
                Run characterization to
                calculate spill geometry.
              </span>
            </div>
          )}
        </div>
      </div>

      {geometry &&
        extraGeometryEntries.length >
          0 && (
          <div
            className="geometry-section"
            style={{
              marginTop: '24px'
            }}
          >
            <div className="section-title">
              ADDITIONAL SPILL
              MEASUREMENTS
            </div>

            <div className="geometry-results">
              {extraGeometryEntries.map(
                ([key, value]) => (
                  <div
                    className="geometry-item"
                    key={key}
                  >
                    <span>
                      {formatLabel(key)}
                    </span>

                    <strong
                      style={{
                        whiteSpace:
                          'pre-wrap',
                        wordBreak:
                          'break-word'
                      }}
                    >
                      {formatValue(value)}
                    </strong>
                  </div>
                )
              )}
            </div>
          </div>
        )}

      <div className="analysis-flow">
        <div className="flow-step completed">
          <span>01</span>
          Detection
        </div>

        <div className="flow-line"></div>

        <div
          className={`flow-step ${
            geometry
              ? 'completed'
              : 'active'
          }`}
        >
          <span>02</span>
          Geometry
        </div>

        <div className="flow-line"></div>

        <div className="flow-step">
          <span>03</span>
          Source Trace
        </div>
      </div>

      <div className="stage-actions">
        <button
          className="secondary-btn"
          onClick={() =>
            navigate('/stage1')
          }
        >
          ← Back to Detection
        </button>

        <div className="right-actions">
          <button
            className="btn primary-btn"
            onClick={
              runCharacterization
            }
            disabled={
              !maskBlob ||
              loading
            }
          >
            {loading
              ? 'Analyzing...'
              : geometry
              ? 'Run Again'
              : 'Characterize Spill'}
          </button>

          <button
            className="next-btn"
            onClick={() =>
              navigate('/stage3')
            }
            disabled={!geometry}
          >
            Trace Source Region
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  )
}