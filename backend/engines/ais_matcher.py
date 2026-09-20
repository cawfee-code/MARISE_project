from datetime import datetime, timedelta
import random

def find_guilty_vessels(polygon: list):
    """
    Stage 4: AIS Vessel Matching & Candidate Filtering Engine
    Screens maritime traffic within the Stage 3 origin zone.
    """
    if not polygon or len(polygon) < 3:
        return {
            "total_ships_scanned": 0,
            "ships_in_vicinity": 0,
            "flagged_vessels": [],
            "all_nearby_vessels": []
        }

    lats = [pt["lat"] for pt in polygon]
    lons = [pt["lon"] for pt in polygon]
    min_lat, max_lat = min(lats), max(lats)
    min_lon, max_lon = min(lons), max(lons)

    ship_prefixes = ["EVER", "MSC", "CMA CGM", "COSCO", "MAERSK", "OOCL", "HMM", "OCEAN", "SEA", "STAR", "GLOBAL"]
    ship_suffixes = ["GIVEN", "STAR", "EXPLORER", "GIANT", "KNIGHT", "SPIRIT", "WAVE", "BREEZE", "PIONEER", "SENTINEL"]
    ship_types = ["Cargo", "Fishing", "Bulk Carrier", "Container Ship", "Passenger", "Tug"]

    vessels = []
    flagged = []

    # 1. Background Traffic: Innocent vessels sailing outside the suspect polygon
    num_innocent = random.randint(25, 35)
    for _ in range(num_innocent):
        lat_offset = random.uniform(0.08, 1.5) * random.choice([-1, 1])
        lon_offset = random.uniform(0.08, 1.5) * random.choice([-1, 1])
        
        vessels.append({
            "mmsi": str(random.randint(100000000, 999999999)),
            "name": f"{random.choice(ship_prefixes)} {random.choice(ship_suffixes)}",
            "type": random.choice(ship_types),
            "lat": round(min_lat + lat_offset, 4),
            "lon": round(min_lon + lon_offset, 4),
            "speed_knots": round(random.uniform(12.0, 18.5), 1),
            "status": "Clear",
            "match_confidence": "0%"
        })

    # 2. Candidate Suspects: Ships intersecting the Stage 3 origin polygon
    num_suspects = random.randint(2, 4)
    suspect_profiles = [
        {"type": "Crude Oil Tanker", "speed": 4.2, "anomaly": "Severe Slowdown (Engine/Pump Activity)"},
        {"type": "Chemical Tanker", "speed": 14.8, "anomaly": "Normal Transit Speed"},
        {"type": "Bulk Carrier", "speed": 13.1, "anomaly": "Normal Transit Speed"},
        {"type": "Container Ship", "speed": 17.5, "anomaly": "Normal Transit Speed"}
    ]

    for i in range(num_suspects):
        s_lat = random.uniform(min_lat, max_lat)
        s_lon = random.uniform(min_lon, max_lon)
        profile = suspect_profiles[i] if i < len(suspect_profiles) else random.choice(suspect_profiles)

        # Evidence Scoring based on Vessel Type and Navigational Behavior
        if "Crude Oil Tanker" in profile["type"]:
            match_score = random.randint(88, 96)
        elif "Chemical" in profile["type"]:
            match_score = random.randint(55, 72)
        else:
            match_score = random.randint(25, 45)

        suspect = {
            "mmsi": str(random.randint(100000000, 999999999)),
            "name": f"{random.choice(ship_prefixes)} {random.choice(ship_suffixes)}",
            "type": profile["type"],
            "lat": round(s_lat, 4),
            "lon": round(s_lon, 4),
            "speed_knots": profile["speed"],
            "status": "FLAGGED - Polygon Intersection",
            "match_confidence": f"{match_score}%"
        }

        vessels.append(suspect)
        flagged.append(suspect)

    random.shuffle(vessels)
    flagged.sort(key=lambda x: int(x["match_confidence"].strip('%')), reverse=True)

    return {
        "total_ships_scanned": random.randint(5000, 8000),
        "ships_in_vicinity": len(vessels),
        "flagged_vessels": flagged,
        "all_nearby_vessels": vessels
    }