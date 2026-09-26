# MARISE frontend changes

## Requested UI cleanup
- Removed `BWU Techade · SIH 2026` from the footer.
- Removed the `FIXED INPUT` badge from the Investigation landing screen.
- Removed the numeric bundled filename from visible UI.
- Renamed the bundled asset from `1542735832746.png` to `demo-sar.png`.
- Removed the sentence `This image stays the same throughout the workflow.`
- Removed `Optional` / `Required` placeholders from all coordinate inputs on the workflow and Stage 1 screens.

## Automatic no-backend demo
- Added `src/data/demoInvestigation.js` with clearly synthetic six-stage demo results.
- Clicking `Get Started` opens the Investigation workflow and automatically runs/populates all six demo stages.
- The bundled SAR scene and demo coordinates are used only behind the scenes for this offline demonstration.
- No backend connection is needed for the automatic demo.

## Real uploaded-image workflow retained
- The six stages remain available exactly as separate investigation stages.
- Choosing a new SAR image exits demo mode, clears synthetic results, and clears demo coordinates.
- The user then enters the real geographic coordinates and can run the existing backend-driven six-stage pipeline.
- Uploaded-image analysis still uses `/api/v1/detect`, `/characterize`, `/hindcast`, `/ais_match`, `/attribution`, and `/forecast`.

## Backend
- No backend code changes were required.
- Existing endpoint shapes are compatible with the manual frontend pipeline.
