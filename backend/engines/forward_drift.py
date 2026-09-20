from opendrift.models.openoil import OpenOil
from datetime import datetime, timedelta
import numpy as np

def run_forecast(current_lat: float, current_lon: float, observation_time: str = None):
    """
    Stage 6: Forward Drift Forecasting & Coastline Threat Assessment Engine.
    Simulates advective transport with true oceanic turbulence and coastline stranding.
    """
    # 1. Initialize OpenOil physics engine
    o = OpenOil(loglevel=50)

    # 2. Environmental Forcing (Regional West India Coastal Current + Monsoonal Wind)
    o.set_config('environment:fallback:x_wind', 4.0) 
    o.set_config('environment:fallback:y_wind', -1.5)
    o.set_config('environment:fallback:x_sea_water_velocity', 0.3)
    o.set_config('environment:fallback:y_sea_water_velocity', -0.2)

    # 3. Enable True Oceanic Turbulence (Gaussian Random Walk)
    # These two settings perturb velocities for each particle, expanding the slick over time
    try:
        o.set_config('drift:current_uncertainty', 0.2)   # 0.2 m/s ocean eddy turbulence
        o.set_config('drift:wind_uncertainty', 1.0)      # 1.0 m/s wind gust variance
    except (ValueError, KeyError):
        pass

    # 4. Enable Native Coastline Stranding
    try:
        o.set_config('general:coastline_action', 'stranding')
    except (ValueError, KeyError):
        pass

    # 5. Parse Start Timestamp
    if observation_time:
        try:
            start_time = datetime.fromisoformat(observation_time.replace("Z", "+00:00"))
        except Exception:
            start_time = datetime.utcnow()
    else:
        start_time = datetime.utcnow()

    # 6. Seed 1000 Lagrangian elements at the observed slick center
    o.seed_elements(lon=current_lon, lat=current_lat, radius=1000, number=1000, time=start_time)

    # 7. Run forward simulation for 48 hours (+3600s hourly time steps)
    o.run(steps=48, time_step=3600)
    
    # 8. Extract Trajectory Dataset
    ds = o.result
    max_time_steps = ds.sizes.get('time', 0)
    
    forecasts = []
    target_hours = [6, 12, 24, 48]
    total_stranded_percent = 0.0

    for hours in target_hours:
        step_idx = min(hours, max_time_steps - 1)
        if step_idx < 0:
            continue
            
        lat_array = ds.lat.isel(time=step_idx).values
        lon_array = ds.lon.isel(time=step_idx).values
        
        # Check native particle status: 0 = active floating, 2 = stranded on land
        if 'status' in ds:
            status_array = ds.status.isel(time=step_idx).values
            stranded_ratio = float(np.mean(status_array == 2)) * 100.0
            total_stranded_percent = max(total_stranded_percent, stranded_ratio)
        
        valid_lats = lat_array[~np.isnan(lat_array)]
        valid_lons = lon_array[~np.isnan(lon_array)]
        
        if len(valid_lats) > 0:
            lat_at_t = float(np.mean(valid_lats))
            lon_at_t = float(np.mean(valid_lons))
            
            # True dynamic standard deviation resulting from turbulent diffusion
            lat_std = float(np.std(valid_lats))
            lon_std = float(np.std(valid_lons))
            
            # 1 degree latitude ≈ 111 km; 1 degree longitude ≈ 105 km at 18°N
            dist_lat_km = lat_std * 111.0
            dist_lon_km = lon_std * 105.0
            uncertainty_km = round(np.sqrt(dist_lat_km**2 + dist_lon_km**2), 2)
        else:
            lat_at_t, lon_at_t, uncertainty_km = current_lat, current_lon, 2.0

        checkpoint_time = start_time + timedelta(hours=hours)

        # Enforce monotonic expansion: the uncertainty cone must never artificially shrink over time
        prev_uncertainty = forecasts[-1]["uncertainty_radius_km"] if forecasts else 2.0
        reported_uncertainty = max(uncertainty_km, prev_uncertainty, 2.0)

        forecasts.append({
            "timeframe": f"+{hours}h",
            "projected_utc": checkpoint_time.strftime("%Y-%m-%d %H:%M UTC"),
            "lat": round(lat_at_t, 4),
            "lon": round(lon_at_t, 4),
            "uncertainty_radius_km": round(reported_uncertainty, 2)
        })

    # Alert status based on physical stranding or approaching land
    has_coastal_impact = (total_stranded_percent > 0.0)

    # Determine alert tier based on real simulated impact
    if total_stranded_percent > 15.0:
        status_headline = f"CRITICAL - Massive Shoreline Landfall ({round(total_stranded_percent, 1)}% stranded)"
        risk_tier = "HIGH"
    elif total_stranded_percent > 0.0:
        status_headline = f"WARNING - Coastal Impact Detected ({round(total_stranded_percent, 1)}% stranded)"
        risk_tier = "MEDIUM"
    else:
        status_headline = "MONITORING - Open Water Drift (No Shoreline Impact Detected)"
        risk_tier = "LOW"

    return {
        "warning_status": status_headline,
        "coastal_impact_risk": risk_tier,
        "projected_shoreline_impact_percent": f"{round(total_stranded_percent, 1)}%",
        "projections": forecasts
    }