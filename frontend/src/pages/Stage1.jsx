import { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { InvestigationContext } from '../contexts/InvestigationContext'

const blobToDataUrl = blob => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onloadend = () => {
      resolve(reader.result)
    }

    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export default function Stage1() {
  const navigate = useNavigate()
  const fileInput = useRef(null)

  const { updateData, setIsAutoRun } =
    useContext(InvestigationContext)

  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!image) {
      setImagePreview(null)
      return
    }

    const preview = URL.createObjectURL(image)
    setImagePreview(preview)

    return () => {
      URL.revokeObjectURL(preview)
    }
  }, [image])

  const handleFileChange = event => {
    const file = event.target.files[0]

    if (file) {
      setImage(file)
      setResult(null)
      setError(null)

      updateData('maskblob', null)
      updateData('maskurl', null)
    }
  }

  const runDetection = async () => {
    if (!image) return

    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', image)

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/api/v1/detect',
        {
          method: 'POST',
          body: formData
        }
      )

      if (!response.ok) {
        const text = await response.text()
        console.error(text)

        throw new Error(
          `Detection failed: ${response.status}`
        )
      }

      const blob = await response.blob()
      const maskUrl = await blobToDataUrl(blob)

      setResult(maskUrl)

      updateData('maskblob', blob)
      updateData('maskurl', maskUrl)
    } catch (error) {
      console.error(error)

      if (error instanceof TypeError) {
        setError(
          'Unable to connect to the backend. Make sure FastAPI is running on port 8000.'
        )
      } else {
        setError(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const runFullInvestigation = async () => {
    if (!image) return

    setLoading(true)
    setError(null)

    const detectionForm = new FormData()
    detectionForm.append('file', image)

    const investigationForm = new FormData()
    investigationForm.append('file', image)

    try {
      const detectionResponse = await fetch(
        'http://127.0.0.1:8000/api/v1/detect',
        {
          method: 'POST',
          body: detectionForm
        }
      )

      if (!detectionResponse.ok) {
        const text = await detectionResponse.text()
        console.error(text)

        throw new Error(
          `Detection failed: ${detectionResponse.status}`
        )
      }

      const blob = await detectionResponse.blob()
      const maskUrl = await blobToDataUrl(blob)

      setResult(maskUrl)

      updateData('maskblob', blob)
      updateData('maskurl', maskUrl)

      const investigationResponse = await fetch(
        'http://127.0.0.1:8000/api/v1/investigate',
        {
          method: 'POST',
          body: investigationForm
        }
      )

      if (!investigationResponse.ok) {
        const text = await investigationResponse.text()
        console.error(text)

        throw new Error(
          `Investigation failed: ${investigationResponse.status}`
        )
      }

      const json = await investigationResponse.json()

      console.log(
        'FULL INVESTIGATION RESULT:',
        json
      )

      if (json?.data) {
        updateData(
          'geometry',
          json.data.geometry
        )

        updateData(
          'traceback',
          json.data.hindcast_source
        )

        updateData(
          'ais',
          json.data.ais_tracking
        )

        updateData(
          'attribution',
          json.data.attribution_report
        )

        updateData(
          'forecast',
          json.data.future_forecast
        )
      }

      setIsAutoRun(true)

      navigate('/stage2')
    } catch (error) {
      console.error(
        'Full investigation error:',
        error
      )

      if (error instanceof TypeError) {
        setError(
          'Unable to connect to the backend. Make sure FastAPI is running on port 8000.'
        )
      } else {
        setError(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const resetImage = () => {
    setImage(null)
    setResult(null)
    setError(null)

    updateData('maskblob', null)
    updateData('maskurl', null)

    if (fileInput.current) {
      fileInput.current.value = ''
    }
  }

  return (
    <div className="glass-panel">
      <div className="stage-heading">
        <div>
          <p className="stage-kicker">
            STAGE 01
          </p>

          <h2>
            Satellite Oil Spill Detection
          </h2>

          <p className="stage-description">
            Upload SAR satellite imagery and analyze it using
            the segmentation model to identify potential oil
            spill regions.
          </p>
        </div>

        <div className="model-tag">
          U-Net / ResNet34
        </div>
      </div>

      <div
        className="upload-area detection-upload"
        onClick={() =>
          fileInput.current?.click()
        }
      >
        <input
          type="file"
          ref={fileInput}
          onChange={handleFileChange}
          accept="image/*"
          style={{ display: 'none' }}
        />

        <div className="upload-icon">
          +
        </div>

        <strong>
          {image
            ? image.name
            : 'Select SAR Image'}
        </strong>

        <span>
          PNG or JPG satellite imagery
        </span>
      </div>

      <div className="detection-info-grid">
        <div className="info-box">
          <span>INPUT</span>

          <strong>
            {image
              ? 'Image Ready'
              : 'Waiting'}
          </strong>
        </div>

        <div className="info-box">
          <span>MODEL</span>
          <strong>U-Net</strong>
        </div>

        <div className="info-box">
          <span>ENCODER</span>
          <strong>ResNet34</strong>
        </div>

        <div className="info-box">
          <span>STATUS</span>

          <strong>
            {loading
              ? 'Processing'
              : result
              ? 'Complete'
              : image
              ? 'Ready'
              : 'Idle'}
          </strong>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {(imagePreview || result) && (
        <div className="image-comparison">
          {imagePreview && (
            <div className="image-panel">
              <div className="image-panel-title">
                Original SAR
              </div>

              <div className="image-frame">
                <img
                  src={imagePreview}
                  alt="Original SAR input"
                />
              </div>
            </div>
          )}

          {imagePreview && result && (
            <div className="comparison-arrow">
              →
            </div>
          )}

          {result && (
            <div className="image-panel">
              <div className="image-panel-title">
                Detection Mask
              </div>

              <div className="image-frame">
                <img
                  src={result}
                  alt="Detected spill mask"
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="stage-actions">
        <div className="left-actions">
          <button
            className="btn primary-btn"
            onClick={runDetection}
            disabled={!image || loading}
          >
            {loading
              ? 'Processing...'
              : 'Run Detection'}
          </button>

          {image && (
            <button
              className="secondary-btn"
              onClick={resetImage}
              disabled={loading}
            >
              Choose Another Image
            </button>
          )}
        </div>

        <div className="right-actions">
          <button
            className="auto-run-btn"
            onClick={runFullInvestigation}
            disabled={!image || loading}
          >
            {loading
              ? 'Running...'
              : 'Run Full Investigation'}
          </button>

          <button
            className="next-btn"
            onClick={() =>
              navigate('/stage2')
            }
            disabled={!result || loading}
          >
            Continue to Stage 2
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  )
}