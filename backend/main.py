from fastapi import FastAPI, UploadFile, File, Form, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import cv2
import numpy as np
from typing import List, Optional

from backend.engines.ai_detection import run_detection
from backend.engines.characterize import analyze_spill_geometry
from backend.engines.physics_drift import run_hindcast
from backend.engines.ais_matcher import find_guilty_vessels
from backend.engines.attribution_report import generate_case_file
from backend.engines.forward_drift import run_forecast

app = FastAPI(title="MARISE Oil Spill Pipeline")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GeometryData(BaseModel):
    status: str
    image_width: int
    image_height: int
    area_pixels: int
    area_km2: float
    centroid_x: int
    centroid_y: int
    orientation_deg: float
    confidence: str
    lat: Optional[float] = 18.5000
    lon: Optional[float] = 72.5000
    min_lat: Optional[float] = 18.2000
    max_lat: Optional[float] = 18.8000
    min_lon: Optional[float] = 72.2000
    max_lon: Optional[float] = 72.8000

class Stage2Output(BaseModel):
    status: str
    stage: int
    geometry: GeometryData

class GeoPoint(BaseModel):
    lat: float
    lon: float

class SpillLocation(BaseModel):
    lat: float
    lon: float

class Stage3Data(BaseModel):
    spill_location: SpillLocation
    origin_polygon: List[GeoPoint]
    estimated_dump_time: str
    confidence_score: str

class Stage3Output(BaseModel):
    status: str
    stage: int
    data: Stage3Data

class Vessel(BaseModel):
    mmsi: str
    name: str
    type: str
    lat: float
    lon: float
    status: str
    match_confidence: str

class Stage4Data(BaseModel):
    total_ships_scanned: int
    ships_in_vicinity: int
    flagged_vessels: List[Vessel]
    all_nearby_vessels: List[Vessel]

class Stage4Output(BaseModel):
    status: str
    stage: int
    data: Stage4Data

class ForecastInput(BaseModel):
    lat: float
    lon: float


@app.post("/api/v1/detect")
async def detect_spill(
    file: UploadFile = File(...),
    lat: Optional[float] = Form(None),
    lon: Optional[float] = Form(None),
    min_lat: Optional[float] = Form(None),
    max_lat: Optional[float] = Form(None),
    min_lon: Optional[float] = Form(None),
    max_lon: Optional[float] = Form(None)
):
    image_bytes = await file.read()
    png_mask_bytes = run_detection(image_bytes, lat=lat, lon=lon)
    
    headers = {}
    if lat is not None and float(lat) != 0.0: headers["X-Lat"] = str(lat)
    if lon is not None and float(lon) != 0.0: headers["X-Lon"] = str(lon)
    if min_lat is not None and float(min_lat) != 0.0: headers["X-Min-Lat"] = str(min_lat)
    if max_lat is not None and float(max_lat) != 0.0: headers["X-Max-Lat"] = str(max_lat)
    if min_lon is not None and float(min_lon) != 0.0: headers["X-Min-Lon"] = str(min_lon)
    if max_lon is not None and float(max_lon) != 0.0: headers["X-Max-Lon"] = str(max_lon)

    return Response(content=png_mask_bytes, media_type="image/png", headers=headers)

@app.post("/api/v1/characterize")
async def characterize_spill(
    mask_file: UploadFile = File(...),
    lat: Optional[float] = Form(None),
    lon: Optional[float] = Form(None),
    min_lat: Optional[float] = Form(None),
    max_lat: Optional[float] = Form(None),
    min_lon: Optional[float] = Form(None),
    max_lon: Optional[float] = Form(None)
):
    mask_bytes = await mask_file.read()
    np_arr = np.frombuffer(mask_bytes, np.uint8)
    mask_image = cv2.imdecode(np_arr, cv2.IMREAD_GRAYSCALE)
    
    binary_mask = (mask_image > 127).astype(np.uint8)
    geometry = analyze_spill_geometry(
        binary_mask,
        lat=lat,
        lon=lon,
        min_lat=min_lat,
        max_lat=max_lat,
        min_lon=min_lon,
        max_lon=max_lon
    )
    return {"status": "success", "stage": 2, "geometry": geometry}

@app.post("/api/v1/hindcast")
async def traceback_spill(data: Stage2Output):
    image_bounds = (
        data.geometry.min_lon,
        data.geometry.min_lat,
        data.geometry.max_lon,
        data.geometry.max_lat
    )
    drift_results = run_hindcast(
        centroid_x=data.geometry.centroid_x, 
        centroid_y=data.geometry.centroid_y,
        width=data.geometry.image_width,
        height=data.geometry.image_height,
        image_bounds=image_bounds
    )
    return {"status": "success", "stage": 3, "data": drift_results}

@app.post("/api/v1/ais_match")
async def match_ais_data(payload: Stage3Output):
    poly_dicts = [{"lat": pt.lat, "lon": pt.lon} for pt in payload.data.origin_polygon]
    ais_results = find_guilty_vessels(poly_dicts)
    return {"status": "success", "stage": 4, "data": ais_results}

@app.post("/api/v1/attribution")
async def generate_final_report(payload: Stage4Output):
    flagged_dicts = [v.dict() for v in payload.data.flagged_vessels]
    case_report = generate_case_file(flagged_dicts, payload.data.total_ships_scanned)
    return {"status": "success", "stage": 5, "data": case_report}

@app.post("/api/v1/forecast")
async def generate_forecast(payload: ForecastInput):
    forecast_results = run_forecast(payload.lat, payload.lon)
    return {"status": "success", "stage": 6, "data": forecast_results}


@app.post("/api/v1/investigate")
async def run_complete_investigation(
    file: UploadFile = File(...),
    lat: Optional[float] = Form(None),
    lon: Optional[float] = Form(None),
    min_lat: Optional[float] = Form(None),
    max_lat: Optional[float] = Form(None),
    min_lon: Optional[float] = Form(None),
    max_lon: Optional[float] = Form(None)
):
    # 1. Detection
    image_bytes = await file.read()
    mask_bytes = run_detection(image_bytes, lat=lat, lon=lon)
    
    # 2. Characterization (Passes coordinates to Stage 2)
    np_arr = np.frombuffer(mask_bytes, np.uint8)
    mask_image = cv2.imdecode(np_arr, cv2.IMREAD_GRAYSCALE)
    binary_mask = (mask_image > 127).astype(np.uint8)
    geometry = analyze_spill_geometry(
        binary_mask,
        lat=lat,
        lon=lon,
        min_lat=min_lat,
        max_lat=max_lat,
        min_lon=min_lon,
        max_lon=max_lon
    )
    
    # 3. Hindcast (Uses coordinates resolved by Stage 2)
    image_bounds = (
        geometry["min_lon"],
        geometry["min_lat"],
        geometry["max_lon"],
        geometry["max_lat"]
    )
    hindcast = run_hindcast(
        centroid_x=geometry["centroid_x"], 
        centroid_y=geometry["centroid_y"],
        width=geometry["image_width"],
        height=geometry["image_height"],
        image_bounds=image_bounds
    )
    
    # 4. AIS Match
    poly_dicts = [{"lat": pt["lat"], "lon": pt["lon"]} for pt in hindcast["origin_polygon"]]
    ais_data = find_guilty_vessels(poly_dicts)
    
    # 5. Legal Attribution
    case_report = generate_case_file(ais_data["flagged_vessels"], ais_data["total_ships_scanned"])
    
    # 6. Forward Forecast
    forecast = run_forecast(hindcast["spill_location"]["lat"], hindcast["spill_location"]["lon"])
    
    # 7. Deliver the Unified Payload
    return {
        "status": "success",
        "case_id": case_report["case_id"],
        "timestamp": case_report["timestamp"],
        "data": {
            "geometry": geometry,
            "hindcast_source": hindcast,
            "ais_tracking": ais_data,
            "attribution_report": case_report,
            "future_forecast": forecast
        }
    }