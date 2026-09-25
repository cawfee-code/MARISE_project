import cv2
import numpy as np

def analyze_spill_geometry(
    binary_mask: np.ndarray, 
    pixel_spacing_meters: float = 10.0,
    lat: float = None,
    lon: float = None,
    min_lat: float = None,
    max_lat: float = None,
    min_lon: float = None,
    max_lon: float = None
):
    """
    Stage 2: Spill Characterization Engine
    Extracts total area, global centroid, orientation angle, and attaches coordinates.
    """
    # 1. Coordinate Resolution & Fallback Logic
    valid_custom_bounds = (
        min_lat is not None and max_lat is not None and min_lon is not None and max_lon is not None
        and float(max_lat) > float(min_lat) 
        and float(max_lon) > float(min_lon)
    )

    if valid_custom_bounds:
        resolved_min_lat = float(min_lat)
        resolved_max_lat = float(max_lat)
        resolved_min_lon = float(min_lon)
        resolved_max_lon = float(max_lon)
        resolved_lat = float(lat) if (lat is not None and float(lat) != 0.0) else round((resolved_min_lat + resolved_max_lat) / 2.0, 4)
        resolved_lon = float(lon) if (lon is not None and float(lon) != 0.0) else round((resolved_min_lon + resolved_max_lon) / 2.0, 4)
    elif lat is not None and lon is not None and float(lat) != 0.0 and float(lon) != 0.0:
        resolved_lat = float(lat)
        resolved_lon = float(lon)
        resolved_min_lat = round(resolved_lat - 0.3, 4)
        resolved_max_lat = round(resolved_lat + 0.3, 4)
        resolved_min_lon = round(resolved_lon - 0.3, 4)
        resolved_max_lon = round(resolved_lon + 0.3, 4)
    else:
        resolved_lat = 18.5000
        resolved_lon = 72.5000
        resolved_min_lat = 18.2000
        resolved_max_lat = 18.8000
        resolved_min_lon = 72.2000
        resolved_max_lon = 72.8000

    if binary_mask is None or np.sum(binary_mask) == 0:
        return {
            "status": "empty",
            "image_width": int(binary_mask.shape[1]) if binary_mask is not None else 0,
            "image_height": int(binary_mask.shape[0]) if binary_mask is not None else 0,
            "area_pixels": 0,
            "area_km2": 0.0,
            "centroid_x": 0,
            "centroid_y": 0,
            "orientation_deg": 0.0,
            "confidence": "NONE",
            "lat": resolved_lat,
            "lon": resolved_lon,
            "min_lat": resolved_min_lat,
            "max_lat": resolved_max_lat,
            "min_lon": resolved_min_lon,
            "max_lon": resolved_max_lon
        }

    # 2. Extract all external contours
    contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        return {
            "status": "empty",
            "image_width": int(binary_mask.shape[1]),
            "image_height": int(binary_mask.shape[0]),
            "area_pixels": 0,
            "area_km2": 0.0,
            "centroid_x": 0,
            "centroid_y": 0,
            "orientation_deg": 0.0,
            "confidence": "NONE",
            "lat": resolved_lat,
            "lon": resolved_lon,
            "min_lat": resolved_min_lat,
            "max_lat": resolved_max_lat,
            "min_lon": resolved_min_lon,
            "max_lon": resolved_max_lon
        }

    # 3. Filter out tiny speckles (< 20px) and sum all valid slick fragments
    valid_contours = [cnt for cnt in contours if cv2.contourArea(cnt) >= 20]
    if not valid_contours:
        return {
            "status": "empty",
            "image_width": int(binary_mask.shape[1]),
            "image_height": int(binary_mask.shape[0]),
            "area_pixels": 0,
            "area_km2": 0.0,
            "centroid_x": 0,
            "centroid_y": 0,
            "orientation_deg": 0.0,
            "confidence": "NONE",
            "lat": resolved_lat,
            "lon": resolved_lon,
            "min_lat": resolved_min_lat,
            "max_lat": resolved_max_lat,
            "min_lon": resolved_min_lon,
            "max_lon": resolved_max_lon
        }

    total_pixel_area = sum(cv2.contourArea(cnt) for cnt in valid_contours)

    # 4. Global Center of Mass across the entire spill
    M = cv2.moments(binary_mask)
    if M["m00"] != 0:
        cx = int(M["m10"] / M["m00"])
        cy = int(M["m01"] / M["m00"])
    else:
        cx, cy = 0, 0

    # 5. Extract Orientation Angle from the primary slick body
    main_slick = max(valid_contours, key=cv2.contourArea)
    if len(main_slick) >= 5:
        (_, _), (w, h), angle = cv2.minAreaRect(main_slick)
        orientation_deg = round(angle if w > h else angle + 90.0, 2)
    else:
        orientation_deg = 0.0

    # 6. Convert pixels to real-world km²
    pixel_area_m2 = pixel_spacing_meters * pixel_spacing_meters
    area_km2 = round((total_pixel_area * pixel_area_m2) / 1_000_000.0, 4)

    return {
        "status": "success",
        "image_width": int(binary_mask.shape[1]),
        "image_height": int(binary_mask.shape[0]),
        "area_pixels": int(total_pixel_area),
        "area_km2": area_km2,
        "centroid_x": cx,
        "centroid_y": cy,
        "orientation_deg": orientation_deg,
        "confidence": "HIGH",
        "lat": resolved_lat,
        "lon": resolved_lon,
        "min_lat": resolved_min_lat,
        "max_lat": resolved_max_lat,
        "min_lon": resolved_min_lon,
        "max_lon": resolved_max_lon
    }