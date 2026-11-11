# Object Identification System: Conversation Export

## User request

Build a complete, modern, responsive Object Identification System website using HTML, CSS, and JavaScript.
The website should allow users to upload images or use a webcam and automatically identify objects using AI. Display object names, confidence percentages, bounding boxes, and the total number of detected objects.
Use TensorFlow.js and the COCO-SSD pretrained model.
Important: Do not require a GPU, paid APIs, subscriptions, or expensive resources. Use free tools and run AI processing directly in the browser.
Provide complete, working source code with no fake detection or unfinished features, and explain how to run the project.

## Claude's response

The site is built as three files: `index.html`, `style.css` and `script.js`. It was not run in a browser during the conversation (the sandbox had no internet), so it is untested.

### How to run it

1. Put the three files in one folder, for example `object-identification`.
2. Start a small local server, because webcams work reliably only on `localhost` or `https`. In that folder, run:
   ```
   python -m http.server 8000
   ```
   Or, with Node, run `npx serve`. Opening `index.html` by double-click works for image upload in most browsers, but the webcam may be blocked.
3. Open `http://localhost:8000` in Chrome, Edge, Firefox or Safari.
4. Wait for the status badge to say "Model ready". Then drop in an image, or open the Webcam tab and allow camera access.

An internet connection is needed on first load, because TensorFlow.js, the COCO-SSD library and the model weights are downloaded from public CDNs. After that, the browser caches them. Everything is free, with no keys or accounts. Images and video are processed in the browser and never uploaded.

### What it does

- **Upload mode:** pick an image or drag one in. It draws a box and a label with the object name and confidence on each object.
- **Webcam mode:** runs detection continuously on the live video and shows the frame rate. Speed depends on your hardware.
- **Results panel:** total object count, a count per type (for example "person × 3"), and a detection list with confidence bars.
- **Minimum confidence slider:** re-filters results instantly. The lowest setting is 50% because COCO-SSD drops anything below that internally.
- **Model choice:** the default is the fast lite MobileNet v2. You can switch to the more accurate, slower MobileNet v2.
- **Save annotated image:** downloads a PNG with the boxes drawn on, in both upload and webcam mode.
- **Error handling:** clear messages for denied camera permission, no camera, a failed model download and bad image files.

### Limits to know about

- COCO-SSD recognises 80 object types (people, vehicles, animals, furniture, food, electronics and so on). Anything outside those won't be labelled, and small or blurry objects can be missed.
- With no GPU, the model uses WebGL on integrated graphics when available and falls back to the CPU otherwise. The fast model keeps the webcam usable on a plain laptop, but expect a lower frame rate on older machines.

## Source code

### index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Object Identification System</title>
  <meta name="description" content="Identify and count objects in photos or on your webcam. AI runs entirely in your browser.">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Instrument+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body>

  <header class="top">
    <div class="brand">
      <svg class="logo" viewBox="0 0 32 32" aria-hidden="true">
        <rect x="3" y="3" width="26" height="26" rx="5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="7 4"/>
        <circle cx="16" cy="16" r="4.5" fill="currentColor"/>
      </svg>
      <div>
        <h1>Object Identification System</h1>
        <p>Find and count everyday objects in a photo or on your webcam. Everything runs in your browser.</p>
      </div>
    </div>
    <div class="status" id="status" data-state="loading" role="status" aria-live="polite">
      <span class="dot" aria-hidden="true"></span>
      <span id="statusText">Loading AI model…</span>
    </div>
  </header>

  <main class="layout">

    <section class="workbench" aria-label="Detector">
      <div class="tabs" role="tablist" aria-label="Input source">
        <button type="button" role="tab" id="tabUpload" aria-selected="true" aria-controls="paneUpload">Upload image</button>
        <button type="button" role="tab" id="tabWebcam" aria-selected="false" aria-controls="paneWebcam" tabindex="-1">Webcam</button>
      </div>

      <p class="notice" id="notice" role="alert" hidden></p>

      <!-- Upload pane -->
      <div class="stage" id="paneUpload" role="tabpanel" aria-labelledby="tabUpload">
        <div class="empty" id="dropzone">
          <p class="empty-title">Drop an image here</p>
          <p class="empty-hint">JPG, PNG, WebP or GIF. Your image stays on this device.</p>
          <button type="button" class="btn primary" id="dropBtn">Choose an image</button>
        </div>
        <canvas id="imageCanvas" hidden aria-label="Uploaded image with detected objects outlined"></canvas>
      </div>

      <!-- Webcam pane -->
      <div class="stage" id="paneWebcam" role="tabpanel" aria-labelledby="tabWebcam" hidden>
        <div class="empty" id="camEmpty">
          <p class="empty-title">Detect objects live</p>
          <p class="empty-hint">Your browser will ask for camera permission. Video is processed locally and never uploaded.</p>
          <button type="button" class="btn primary" id="camStartBtn">Start webcam</button>
        </div>
        <div class="cam-wrap" id="camWrap" hidden>
          <video id="video" playsinline muted></video>
          <canvas id="overlay" aria-hidden="true"></canvas>
        </div>
      </div>

      <div class="toolbar">
        <button type="button" class="btn" id="chooseBtn">Choose another image</button>
        <button type="button" class="btn" id="camStopBtn" hidden>Stop webcam</button>
        <button type="button" class="btn" id="snapBtn" disabled>Save annotated image</button>
        <button type="button" class="btn quiet" id="clearBtn" disabled>Clear</button>
      </div>

      <input type="file" id="fileInput" accept="image/*" hidden>
    </section>

    <aside class="results" aria-label="Results">
      <div class="count-block">
        <output class="count" id="count" aria-live="polite">0</output>
        <div>
          <p class="count-label" id="countLabel">objects detected</p>
          <p class="meta" id="meta">Add an image or start the webcam.</p>
        </div>
      </div>

      <div class="chips" id="summary" aria-label="Count by type"></div>

      <h2 class="section-title">Detections</h2>
      <ol class="list" id="list">
        <li class="list-empty">Nothing yet.</li>
      </ol>

      <h2 class="section-title">Settings</h2>
      <div class="field">
        <label for="threshold">Minimum confidence <output id="thresholdOut">60%</output></label>
        <input type="range" id="threshold" min="50" max="95" step="5" value="60">
      </div>
      <div class="field">
        <label for="modelSelect">Model</label>
        <select id="modelSelect">
          <option value="lite_mobilenet_v2" selected>Fast (lite MobileNet v2)</option>
          <option value="mobilenet_v2">More accurate (MobileNet v2, slower)</option>
        </select>
      </div>
      <p class="fine">The COCO-SSD model recognises 80 common object types such as people, cars, animals, furniture, food and electronics. Anything outside those types will not be labelled.</p>
    </aside>

  </main>

  <footer class="foot">
    Built with TensorFlow.js and the COCO-SSD model. No account, server or paid service is involved.
  </footer>

  <!-- Pinned versions; loaded from the jsDelivr CDN -->
  <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js" defer></script>
  <script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js" defer></script>
  <script src="script.js" defer></script>
</body>
</html>
```

### style.css

```css
:root {
  --ground: #edf0f3;
  --panel: #ffffff;
  --ink: #12202b;
  --muted: #566672;
  --line: #d5dce2;
  --stage: #0e1821;
  --stage-text: #c9d4dc;
  --accent: #2457ff;
  --accent-ink: #ffffff;
  --ok: #1a8f5f;
  --warn: #b7791f;
  --err: #c23a3a;
  --font-body: "Instrument Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-display: "Bricolage Grotesque", "Instrument Sans", system-ui, sans-serif;
}

*, *::before, *::after { box-sizing: border-box; }

html { -webkit-text-size-adjust: 100%; }

body {
  margin: 0;
  background: var(--ground);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.5;
}

[hidden] { display: none !important; }

:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
}

/* ---------- Header ---------- */
.top {
  max-width: 1200px;
  margin: 0 auto;
  padding: 28px 20px 8px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px 24px;
  flex-wrap: wrap;
}

.brand { display: flex; gap: 14px; align-items: flex-start; max-width: 640px; }
.logo { width: 38px; height: 38px; flex: none; color: var(--accent); margin-top: 4px; }

h1 {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(1.5rem, 3.2vw, 2.1rem);
  line-height: 1.15;
  letter-spacing: -0.01em;
}

.brand p { margin: 6px 0 0; color: var(--muted); max-width: 60ch; }

.status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--panel);
  font-size: 0.9rem;
  font-weight: 500;
}
.status .dot { width: 9px; height: 9px; border-radius: 50%; background: var(--warn); }
.status[data-state="ready"] .dot { background: var(--ok); }
.status[data-state="error"] .dot { background: var(--err); }
.status[data-state="loading"] .dot { animation: pulse 1.1s ease-in-out infinite; }

@keyframes pulse { 50% { opacity: 0.25; } }

/* ---------- Layout ---------- */
.layout {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 20px 32px;
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(300px, 1fr);
  gap: 20px;
  align-items: start;
}

.workbench, .results {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 16px;
}

.workbench { padding: 14px; }
.results { padding: 22px; }

/* ---------- Tabs ---------- */
.tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  margin-bottom: 12px;
  background: var(--ground);
  border-radius: 10px;
  width: fit-content;
}

.tabs button {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--muted);
  font: inherit;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 7px;
  cursor: pointer;
}
.tabs button[aria-selected="true"] { background: var(--panel); color: var(--ink); }

/* ---------- Notice ---------- */
.notice {
  margin: 0 0 12px;
  padding: 10px 14px;
  border-radius: 8px;
  background: #fdeeee;
  color: #7c1f1f;
  border: 1px solid #f0c4c4;
  font-size: 0.95rem;
}

/* ---------- Stage ---------- */
.stage {
  background: var(--stage);
  border-radius: 10px;
  min-height: 360px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}
.stage.dragging { outline: 3px dashed var(--accent); outline-offset: -10px; }

.empty {
  text-align: center;
  padding: 32px 24px;
  color: var(--stage-text);
  max-width: 420px;
}
.empty-title {
  margin: 0 0 6px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.4rem;
  color: #fff;
}
.empty-hint { margin: 0 0 20px; font-size: 0.95rem; }

#imageCanvas {
  display: block;
  max-width: 100%;
  max-height: 70vh;
  width: auto;
  height: auto;
}

.cam-wrap { position: relative; display: block; max-width: 100%; line-height: 0; }
.cam-wrap video { display: block; max-width: 100%; max-height: 70vh; width: auto; height: auto; }
.cam-wrap canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }

/* ---------- Buttons ---------- */
.toolbar { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }

.btn {
  appearance: none;
  font: inherit;
  font-weight: 600;
  padding: 9px 16px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: var(--panel);
  color: var(--ink);
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s;
}
.btn:hover:not(:disabled) { border-color: var(--ink); }
.btn.primary { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }
.btn.primary:hover:not(:disabled) { background: #1a45d6; border-color: #1a45d6; }
.btn.quiet { color: var(--muted); }
.btn:disabled { opacity: 0.45; cursor: not-allowed; }

/* ---------- Results ---------- */
.count-block { display: flex; align-items: center; gap: 16px; }

.count {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(3.5rem, 8vw, 5.5rem);
  line-height: 0.95;
  letter-spacing: -0.03em;
  min-width: 1ch;
  font-variant-numeric: tabular-nums;
}
.count-label { margin: 0; font-weight: 600; font-size: 1.05rem; }
.meta { margin: 2px 0 0; color: var(--muted); font-size: 0.9rem; }

.chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 16px 0 0; min-height: 4px; }
.chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 3px 10px 3px 8px;
  border: 1px solid var(--line);
  border-radius: 999px;
  font-size: 0.88rem;
  font-weight: 500;
}
.swatch { width: 10px; height: 10px; border-radius: 3px; flex: none; }

.section-title {
  margin: 24px 0 8px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.1rem;
}

.list { list-style: none; margin: 0; padding: 0; max-height: 320px; overflow-y: auto; }
.list li { padding: 8px 0; border-top: 1px solid var(--line); }
.list li:first-child { border-top: 0; }
.list-empty { color: var(--muted); }
.row { display: flex; align-items: center; gap: 8px; }
.row .name { flex: 1; font-weight: 600; text-transform: capitalize; }
.row .pct { font-variant-numeric: tabular-nums; color: var(--muted); }
.bar { height: 5px; margin-top: 6px; background: var(--ground); border-radius: 3px; overflow: hidden; }
.bar span { display: block; height: 100%; border-radius: 3px; }

.field { margin-bottom: 14px; }
.field label { display: flex; justify-content: space-between; font-weight: 600; font-size: 0.92rem; margin-bottom: 6px; }
.field select { width: 100%; font: inherit; padding: 8px 10px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); color: var(--ink); }
.field input[type="range"] { width: 100%; accent-color: var(--accent); }

.fine { color: var(--muted); font-size: 0.85rem; margin: 0; max-width: 60ch; }

.foot {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px 32px;
  color: var(--muted);
  font-size: 0.88rem;
}

/* ---------- Responsive ---------- */
@media (max-width: 900px) {
  .layout { grid-template-columns: minmax(0, 1fr); }
  .stage { min-height: 260px; }
  .list { max-height: none; }
}

@media (max-width: 480px) {
  .top { padding-top: 20px; }
  .results { padding: 18px; }
  .toolbar .btn { flex: 1 1 auto; }
}

@media (prefers-reduced-motion: reduce) {
  .status[data-state="loading"] .dot { animation: none; }
  .btn { transition: none; }
}
```

### script.js

```javascript
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);

  const els = {
    status: $('status'),
    statusText: $('statusText'),
    notice: $('notice'),
    tabUpload: $('tabUpload'),
    tabWebcam: $('tabWebcam'),
    paneUpload: $('paneUpload'),
    paneWebcam: $('paneWebcam'),
    dropzone: $('dropzone'),
    dropBtn: $('dropBtn'),
    fileInput: $('fileInput'),
    imageCanvas: $('imageCanvas'),
    camEmpty: $('camEmpty'),
    camWrap: $('camWrap'),
    video: $('video'),
    overlay: $('overlay'),
    camStartBtn: $('camStartBtn'),
    camStopBtn: $('camStopBtn'),
    chooseBtn: $('chooseBtn'),
    snapBtn: $('snapBtn'),
    clearBtn: $('clearBtn'),
    count: $('count'),
    countLabel: $('countLabel'),
    meta: $('meta'),
    summary: $('summary'),
    list: $('list'),
    threshold: $('threshold'),
    thresholdOut: $('thresholdOut'),
    modelSelect: $('modelSelect'),
  };

  const MAX_CANVAS_SIDE = 1600; // keeps very large photos from using too much memory
  const MAX_BOXES = 50;

  const state = {
    model: null,
    modelRequest: 0,
    mode: 'upload',
    image: null,
    stream: null,
    running: false,
    raf: 0,
    predictions: [],   // everything the model returned for the current image/frame
    threshold: 0.6,
    metaText: 'Add an image or start the webcam.',
    fps: 0,
  };

  /* ---------------- Helpers ---------------- */

  function setStatus(kind, text) {
    els.status.dataset.state = kind;
    els.statusText.textContent = text;
  }

  function showNotice(message) {
    els.notice.textContent = message;
    els.notice.hidden = false;
  }

  function hideNotice() {
    els.notice.hidden = true;
    els.notice.textContent = '';
  }

  function colorFor(name, lightness) {
    let hue = 0;
    for (const ch of name) hue = (hue * 31 + ch.charCodeAt(0)) % 360;
    return `hsl(${hue} 80% ${lightness}%)`;
  }

  function visiblePredictions() {
    return state.predictions
      .filter((p) => p.score >= state.threshold)
      .sort((a, b) => b.score - a.score);
  }

  /* ---------------- Model ---------------- */

  async function loadModel(base) {
    const request = ++state.modelRequest;
    state.model = null;
    els.modelSelect.disabled = true;
    setStatus('loading', 'Loading AI model…');

    try {
      if (typeof tf === 'undefined' || typeof cocoSsd === 'undefined') {
        throw new Error('TensorFlow.js or COCO-SSD did not load. Check your internet connection.');
      }
      await tf.ready();
      const model = await cocoSsd.load({ base });
      if (request !== state.modelRequest) return; // a newer load replaced this one
      state.model = model;
      setStatus('ready', `Model ready (${tf.getBackend()} backend)`);
      hideNotice();
      if (state.mode === 'upload' && state.image) detectImage();
    } catch (err) {
      if (request !== state.modelRequest) return;
      console.error(err);
      setStatus('error', 'Model failed to load');
      showNotice('The AI model could not be loaded. Check your internet connection, then reload the page. ' + (err.message || ''));
    } finally {
      if (request === state.modelRequest) els.modelSelect.disabled = false;
    }
  }

  /* ---------------- Drawing ---------------- */

  function drawPredictions(ctx, width, height, predictions, k = 1) {
    const s = Math.max(1, Math.max(width, height) / 900);
    ctx.lineWidth = 3 * s;
    ctx.font = `600 ${14 * s}px "Instrument Sans", system-ui, sans-serif`;
    ctx.textBaseline = 'middle';

    for (const p of predictions) {
      const [bx, by, bw, bh] = p.bbox.map((v) => v * k);
      const stroke = colorFor(p.class, 55);

      ctx.strokeStyle = stroke;
      ctx.strokeRect(bx, by, bw, bh);

      const label = `${p.class} ${Math.round(p.score * 100)}%`;
      const padX = 6 * s;
      const labelH = 22 * s;
      const labelW = ctx.measureText(label).width + padX * 2;
      let ly = by - labelH;
      if (ly < 0) ly = by;
      const lx = Math.max(0, Math.min(bx, width - labelW));

      ctx.fillStyle = colorFor(p.class, 30);
      ctx.fillRect(lx, ly, labelW, labelH);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, lx + padX, ly + labelH / 2 + s * 0.5);
    }
  }

  function renderImage() {
    const img = state.image;
    if (!img) return;
    const k = Math.min(1, MAX_CANVAS_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * k);
    const h = Math.round(img.naturalHeight * k);
    const canvas = els.imageCanvas;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    drawPredictions(ctx, w, h, visiblePredictions(), k);
  }

  function renderOverlay() {
    const canvas = els.overlay;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPredictions(ctx, canvas.width, canvas.height, visiblePredictions(), 1);
  }

  /* ---------------- Results panel ---------------- */

  function updateResults(predictions, metaText) {
    state.metaText = metaText;
    els.count.textContent = String(predictions.length);
    els.countLabel.textContent = predictions.length === 1 ? 'object detected' : 'objects detected';
    els.meta.textContent = metaText;

    // Count by type
    const counts = new Map();
    for (const p of predictions) counts.set(p.class, (counts.get(p.class) || 0) + 1);

    els.summary.replaceChildren();
    [...counts.entries()].sort((a, b) => b[1] - a[1]).forEach(([name, n]) => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      const sw = document.createElement('span');
      sw.className = 'swatch';
      sw.style.background = colorFor(name, 45);
      chip.append(sw, `${name} × ${n}`);
      els.summary.appendChild(chip);
    });

    // Detection list
    els.list.replaceChildren();
    if (predictions.length === 0) {
      const li = document.createElement('li');
      li.className = 'list-empty';
      li.textContent = 'No objects found at this confidence level. Try lowering the minimum confidence.';
      els.list.appendChild(li);
      return;
    }
    for (const p of predictions) {
      const pct = Math.round(p.score * 100);
      const li = document.createElement('li');

      const row = document.createElement('div');
      row.className = 'row';
      const sw = document.createElement('span');
      sw.className = 'swatch';
      sw.style.background = colorFor(p.class, 45);
      const name = document.createElement('span');
      name.className = 'name';
      name.textContent = p.class;
      const pctEl = document.createElement('span');
      pctEl.className = 'pct';
      pctEl.textContent = `${pct}%`;
      row.append(sw, name, pctEl);

      const bar = document.createElement('div');
      bar.className = 'bar';
      const fill = document.createElement('span');
      fill.style.width = `${pct}%`;
      fill.style.background = colorFor(p.class, 45);
      bar.appendChild(fill);

      li.append(row, bar);
      els.list.appendChild(li);
    }
  }

  function resetResults(message) {
    state.predictions = [];
    updateResults([], message);
    els.list.replaceChildren();
    const li = document.createElement('li');
    li.className = 'list-empty';
    li.textContent = 'Nothing yet.';
    els.list.appendChild(li);
  }

  function refreshButtons() {
    const hasContent = state.mode === 'upload' ? !!state.image : state.running;
    els.snapBtn.disabled = !hasContent;
    els.clearBtn.disabled = !hasContent;
    els.chooseBtn.hidden = state.mode !== 'upload';
    els.camStopBtn.hidden = !(state.mode === 'webcam' && state.running);
  }

  /* ---------------- Upload mode ---------------- */

  function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showNotice('That file is not an image. Choose a JPG, PNG, WebP or GIF file.');
      return;
    }
    hideNotice();
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      state.image = img;
      state.predictions = [];
      els.dropzone.hidden = true;
      els.imageCanvas.hidden = false;
      renderImage();
      refreshButtons();
      detectImage();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      showNotice('This image could not be opened. Try a different file.');
    };
    img.src = url;
  }

  async function detectImage() {
    const img = state.image;
    if (!img) return;

    if (!state.model) {
      renderImage();
      updateResults([], 'Waiting for the model to finish loading…');
      return;
    }

    updateResults([], 'Analyzing…');
    const started = performance.now();
    try {
      const predictions = await state.model.detect(img, MAX_BOXES);
      if (img !== state.image) return; // a different image was chosen meanwhile
      state.predictions = predictions;
      const ms = Math.round(performance.now() - started);
      renderImage();
      updateResults(visiblePredictions(), `Analyzed in ${ms} ms`);
    } catch (err) {
      console.error(err);
      showNotice('Detection failed for this image. Try another one.');
    }
  }

  function clearImage() {
    state.image = null;
    state.predictions = [];
    els.fileInput.value = '';
    els.imageCanvas.hidden = true;
    els.dropzone.hidden = false;
    resetResults('Add an image or start the webcam.');
    refreshButtons();
  }

  /* ---------------- Webcam mode ---------------- */

  async function startWebcam() {
    hideNotice();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showNotice('This browser cannot access a camera here. Use a current browser and open the page from localhost or https.');
      return;
    }
    els.camStartBtn.disabled = true;
    try {
      state.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 720 } },
        audio: false,
      });
      els.camEmpty.hidden = true;
      els.camWrap.hidden = false;
      els.video.srcObject = state.stream;
      await els.video.play();
      els.overlay.width = els.video.videoWidth;
      els.overlay.height = els.video.videoHeight;
      state.running = true;
      state.fps = 0;
      refreshButtons();
      loop();
    } catch (err) {
      console.error(err);
      stopWebcam();
      const messages = {
        NotAllowedError: 'Camera permission was denied. Allow camera access in your browser settings and try again.',
        NotFoundError: 'No camera was found on this device.',
        NotReadableError: 'The camera is in use by another app. Close it and try again.',
      };
      showNotice(messages[err.name] || 'The camera could not be started. ' + (err.message || ''));
    } finally {
      els.camStartBtn.disabled = false;
    }
  }

  async function loop() {
    if (!state.running) return;

    if (state.model && els.video.readyState >= 2) {
      const started = performance.now();
      try {
        const predictions = await state.model.detect(els.video, MAX_BOXES);
        if (!state.running) return;
        state.predictions = predictions;
        const ms = Math.max(1, performance.now() - started);
        state.fps = state.fps ? state.fps * 0.8 + (1000 / ms) * 0.2 : 1000 / ms;
        renderOverlay();
        updateResults(visiblePredictions(), `Live, about ${Math.round(state.fps)} frames per second`);
      } catch (err) {
        console.error(err);
        stopWebcam();
        showNotice('Live detection stopped because of an error. Start the webcam to try again.');
        return;
      }
    } else if (!state.model) {
      els.meta.textContent = 'Waiting for the model to finish loading…';
    }

    state.raf = requestAnimationFrame(loop);
  }

  function stopWebcam() {
    state.running = false;
    cancelAnimationFrame(state.raf);
    if (state.stream) {
      state.stream.getTracks().forEach((t) => t.stop());
      state.stream = null;
    }
    els.video.srcObject = null;
    els.overlay.getContext('2d').clearRect(0, 0, els.overlay.width, els.overlay.height);
    els.camWrap.hidden = true;
    els.camEmpty.hidden = false;
    if (state.mode === 'webcam') resetResults('Add an image or start the webcam.');
    refreshButtons();
  }

  /* ---------------- Snapshot ---------------- */

  function saveSnapshot() {
    let source;
    if (state.mode === 'upload' && state.image) {
      source = els.imageCanvas;
    } else if (state.mode === 'webcam' && state.running) {
      source = document.createElement('canvas');
      source.width = els.video.videoWidth;
      source.height = els.video.videoHeight;
      const ctx = source.getContext('2d');
      ctx.drawImage(els.video, 0, 0);
      ctx.drawImage(els.overlay, 0, 0);
    } else {
      return;
    }
    source.toBlob((blob) => {
      if (!blob) {
        showNotice('The annotated image could not be created.');
        return;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'objects-detected.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }, 'image/png');
  }

  /* ---------------- Tabs ---------------- */

  function setMode(mode) {
    if (mode === state.mode) return;
    hideNotice();
    if (state.mode === 'webcam') stopWebcam();
    state.mode = mode;

    const upload = mode === 'upload';
    els.tabUpload.setAttribute('aria-selected', String(upload));
    els.tabWebcam.setAttribute('aria-selected', String(!upload));
    els.tabUpload.tabIndex = upload ? 0 : -1;
    els.tabWebcam.tabIndex = upload ? -1 : 0;
    els.paneUpload.hidden = !upload;
    els.paneWebcam.hidden = upload;

    if (upload && state.image) {
      renderImage();
      updateResults(visiblePredictions(), state.metaText);
    } else {
      resetResults('Add an image or start the webcam.');
    }
    refreshButtons();
  }

  /* ---------------- Events ---------------- */

  els.tabUpload.addEventListener('click', () => setMode('upload'));
  els.tabWebcam.addEventListener('click', () => setMode('webcam'));
  [els.tabUpload, els.tabWebcam].forEach((tab) => {
    tab.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const next = state.mode === 'upload' ? els.tabWebcam : els.tabUpload;
        next.click();
        next.focus();
      }
    });
  });

  els.dropBtn.addEventListener('click', () => els.fileInput.click());
  els.chooseBtn.addEventListener('click', () => els.fileInput.click());
  els.fileInput.addEventListener('change', () => {
    handleFile(els.fileInput.files[0]);
    els.fileInput.value = '';
  });

  els.paneUpload.addEventListener('dragover', (e) => {
    e.preventDefault();
    els.paneUpload.classList.add('dragging');
  });
  els.paneUpload.addEventListener('dragleave', () => els.paneUpload.classList.remove('dragging'));
  els.paneUpload.addEventListener('drop', (e) => {
    e.preventDefault();
    els.paneUpload.classList.remove('dragging');
    handleFile(e.dataTransfer.files[0]);
  });

  els.camStartBtn.addEventListener('click', startWebcam);
  els.camStopBtn.addEventListener('click', stopWebcam);
  els.snapBtn.addEventListener('click', saveSnapshot);
  els.clearBtn.addEventListener('click', () => {
    if (state.mode === 'upload') clearImage();
    else stopWebcam();
  });

  els.threshold.addEventListener('input', () => {
    state.threshold = Number(els.threshold.value) / 100;
    els.thresholdOut.textContent = `${els.threshold.value}%`;
    if (state.mode === 'upload' && state.image) {
      renderImage();
      updateResults(visiblePredictions(), state.metaText);
    }
    // In webcam mode the new value is applied on the next frame.
  });

  els.modelSelect.addEventListener('change', () => loadModel(els.modelSelect.value));

  window.addEventListener('pagehide', () => {
    if (state.stream) state.stream.getTracks().forEach((t) => t.stop());
  });

  /* ---------------- Start ---------------- */

  state.threshold = Number(els.threshold.value) / 100;
  els.thresholdOut.textContent = `${els.threshold.value}%`;
  refreshButtons();
  loadModel(els.modelSelect.value);
})();
```
