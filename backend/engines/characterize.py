import cv2
import numpy as np

def analyze_spill_geometry(binary_mask: np.ndarray, pixel_spacing_meters: float = 10.0):
    """
    Stage 2: Spill Characterization Engine
    Extracts total area, global centroid, boundary polygon, and orientation angle.
    """
    if binary_mask is None or np.sum(binary_mask) == 0:
        return {
            "status": "empty",
            "area_pixels": 0,
            "area_km2": 0.0,
            "centroid_x": 0,
            "centroid_y": 0,
            "orientation_deg": 0.0,
            "confidence": "NONE"
        }

    # 1. Extract all external contours
    contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        return {"status": "empty", "area_pixels": 0, "area_km2": 0.0, "centroid_x": 0, "centroid_y": 0, "orientation_deg": 0.0, "confidence": "NONE"}

    # 2. Filter out tiny speckles (< 20px) and sum all valid slick fragments
    valid_contours = [cnt for cnt in contours if cv2.contourArea(cnt) >= 20]
    if not valid_contours:
        return {"status": "empty", "area_pixels": 0, "area_km2": 0.0, "centroid_x": 0, "centroid_y": 0, "orientation_deg": 0.0, "confidence": "NONE"}

    total_pixel_area = sum(cv2.contourArea(cnt) for cnt in valid_contours)

    # 3. Global Center of Mass across the entire spill
    M = cv2.moments(binary_mask)
    if M["m00"] != 0:
        cx = int(M["m10"] / M["m00"])
        cy = int(M["m01"] / M["m00"])
    else:
        cx, cy = 0, 0

    # 4. Extract Orientation Angle from the primary slick body
    main_slick = max(valid_contours, key=cv2.contourArea)
    if len(main_slick) >= 5:
        # Fits a rotated bounding box: returns ((center), (width, height), angle_of_rotation)
        (_, _), (w, h), angle = cv2.minAreaRect(main_slick)
        # Standardize angle along the major axis
        orientation_deg = round(angle if w > h else angle + 90.0, 2)
    else:
        orientation_deg = 0.0

    # 5. Convert pixels to real-world km² (10m x 10m pixels = 100 m² per pixel)
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
        "confidence": "HIGH"
    }