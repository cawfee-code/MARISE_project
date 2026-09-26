# MARISE frontend

## Run locally

Use Node.js 20.19+ or 22.12+:

```sh
npm install
npm run dev
```

Open the address Vite prints. Click **Explore the investigation** to load the bundled SAR image automatically and populate Stages 1–6 while Stage 1 remains selected. Select any stage in the rail after it fills in. The automatic sample shows the exact Stage 2–6 values supplied by the project team on 26 September 2026 and their Stage 1 mask screenshot; it works without a backend. The upload and six optional coordinate inputs stay visible so visitors can submit another scene for a live backend analysis. **Investigate another image** opens the file picker.

For a real backend run, start the supplied FastAPI server on port 8000. Development and preview proxy `/api` and `/openapi.json` to `http://127.0.0.1:8000` by default. Set `API_PROXY_TARGET` in `.env` to change it. For static deployment, set `VITE_API_BASE_URL` to the backend origin before building and configure backend CORS.

## Replace the home image with your video

1. Put your video at `public/media/marise-hero.mp4`.
2. In `src/config/siteConfig.js`, change `heroVideo: ''` to `heroVideo: '/media/marise-hero.mp4'`.
3. The existing picture is used as the poster. To replace it, put an image at `public/media/marise-hero-poster.jpg` and set `heroPoster: '/media/marise-hero-poster.jpg'` in the same file.

The video autoplays muted and loops within the existing right-hand hero frame. The image remains the fallback when `heroVideo` is blank or the browser does not play video.

## Add team portraits

Put each picture in `public/media/team/` (for example `member-01.jpg`). Edit `src/data/teamData.js` to enter its name, team label, LinkedIn URL and image path:

```js
{ name: 'Your name', role: 'Your role', image: '/media/team/member-01.jpg', linkedin: 'https://www.linkedin.com/in/your-handle/' }
```

Keep `image: ''` for any person whose photo is not ready. The portrait placeholder will remain visible. Use a square image for the best crop.

## Demo data and real results

`public/media/demo-sar.png` is the bundled scene. `public/media/sample-stage1-mask.jpeg` is the supplied Stage 1 mask screenshot. `src/data/sampleBackendResponses.json` contains the supplied Stage 2–6 response snapshots. The screenshot dimensions may differ from the original PNG dimensions returned by the server. Uploaded images use the mask returned by the real `/api/v1/detect` endpoint and the geometry returned by `/api/v1/characterize`.

## Verification

```sh
npm run build
node --test tests/api.test.js
```
