from pathlib import Path
import torch
import cv2
import numpy as np
import segmentation_models_pytorch as smp

DEVICE = torch.device("cpu")
MODEL_INPUT_SIZE = 256

_THIS_DIR = Path(__file__).resolve().parent
MODEL_WEIGHTS_PATH = _THIS_DIR.parent / "models" / "marise_sentinel_champion.pt"

def load_ai_model():
    model = smp.Unet(
        encoder_name="resnet34", 
        encoder_weights=None, 
        in_channels=1, 
        classes=1,
    )
    model.load_state_dict(torch.load(str(MODEL_WEIGHTS_PATH), map_location=DEVICE))
    model.eval()
    return model.float()

AI_MODEL = load_ai_model()

def empty_mask(target_h: int = 256, target_w: int = 256) -> bytes:
    """Returns an all-black mask matching the requested dimensions."""
    mask = np.zeros((target_h, target_w), dtype=np.uint8)
    return cv2.imencode(".png", mask)[1].tobytes()

def validate_input(color_img: np.ndarray, gray_img: np.ndarray) -> bool:
    if color_img is None or gray_img is None or gray_img.size == 0:
        return False
    # Reject optical RGB photography via HSV saturation
    hsv = cv2.cvtColor(color_img, cv2.COLOR_BGR2HSV)
    if float(np.mean(hsv[:, :, 1])) > 75.0:
        return False
    # Reject off-swath empty borders (> 35% pure black)
    if float(np.mean(gray_img <= 1)) > 0.35:
        return False
    return True

def run_detection(image_bytes: bytes, lat: float = None, lon: float = None) -> bytes:
    np_arr = np.frombuffer(image_bytes, dtype=np.uint8)
    color_img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    gray_img = cv2.imdecode(np_arr, cv2.IMREAD_GRAYSCALE)

    if color_img is None or gray_img is None:
        return empty_mask()

    # 1. Capture Original Satellite Dimensions Before Resizing
    orig_h, orig_w = gray_img.shape[:2]

    if not validate_input(color_img, gray_img):
        return empty_mask(orig_h, orig_w)

    # 2. Resize to 256x256 specifically for the Neural Network Input
    gray_256 = cv2.resize(gray_img, (MODEL_INPUT_SIZE, MODEL_INPUT_SIZE), interpolation=cv2.INTER_AREA)
    norm_tensor = (gray_256.astype(np.float32) / 255.0)
    tensor_img = torch.from_numpy(norm_tensor).float().unsqueeze(0).unsqueeze(0).to(DEVICE)

    # 3. Neural Forward Pass
    with torch.no_grad():
        logits = AI_MODEL(tensor_img)
        prob_map = torch.sigmoid(logits)[0, 0].cpu().numpy()

    # 4. Calibrated Decision Boundary
    binary_raw = (prob_map >= 0.82).astype(np.uint8) * 255

    if np.sum(binary_raw) == 0:
        return empty_mask(orig_h, orig_w)

    # 5. Component Analysis and Aspect Ratio Look-Alike Filter
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(binary_raw, connectivity=8)
    filtered_mask = np.zeros_like(binary_raw)

    for label_id in range(1, num_labels):
        area = stats[label_id, cv2.CC_STAT_AREA]
        
        # Discard sub-resolution speckles (< 40 px)
        if area < 40:
            continue

        # Prune top-edge boundary artifacts
        y = stats[label_id, cv2.CC_STAT_TOP]
        h = stats[label_id, cv2.CC_STAT_HEIGHT]
        if y <= 1 and h < 25:
            continue

        comp_mask = (labels == label_id).astype(np.uint8)
        contours, _ = cv2.findContours(comp_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            continue

        cnt = contours[0]
        
        # Calculate Aspect Ratio (Length / Width)
        if len(cnt) >= 5:
            (_, _), (width, height), _ = cv2.minAreaRect(cnt)
            major = max(width, height)
            minor = max(min(width, height), 1e-4)
            aspect_ratio = major / minor
        else:
            aspect_ratio = 1.0

        # Retain only elongated hydrodynamic plumes (Aspect Ratio >= 1.85)
        if aspect_ratio >= 1.85:
            filtered_mask[labels == label_id] = 255

    # 6. Post-Filter Micro-Stitch
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    stitched_256 = cv2.morphologyEx(filtered_mask, cv2.MORPH_CLOSE, kernel)

    # 7. Restore the Mask to the Original Satellite Dimensions
    if (orig_w != MODEL_INPUT_SIZE) or (orig_h != MODEL_INPUT_SIZE):
        final_native_mask = cv2.resize(stitched_256, (orig_w, orig_h), interpolation=cv2.INTER_NEAREST)
    else:
        final_native_mask = stitched_256

    ok, encoded = cv2.imencode(".png", final_native_mask)
    if not ok:
        return empty_mask(orig_h, orig_w)
    return encoded.tobytes()