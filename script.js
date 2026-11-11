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

  const MAX_CANVAS_SIDE = 1600;
  const MAX_BOXES = 50;

  const state = {
    model: null,
    modelRequest: 0,
    mode: 'upload',
    image: null,
    stream: null,
    running: false,
    raf: 0,
    predictions: [],
    threshold: 0.6,
    metaText: 'Add an image or start the webcam.',
    fps: 0,
  };

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
      if (request !== state.modelRequest) return;
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

  function updateResults(predictions, metaText) {
    state.metaText = metaText;
    els.count.textContent = String(predictions.length);
    els.countLabel.textContent = predictions.length === 1 ? 'object detected' : 'objects detected';
    els.meta.textContent = metaText;

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

    const model = state.model;
    if (!model) {
      renderImage();
      updateResults([], 'Waiting for the model to finish loading…');
      return;
    }

    updateResults([], 'Analyzing…');
    const started = performance.now();
    try {
      const predictions = await model.detect(img, MAX_BOXES);
      if (model !== state.model || img !== state.image) return;
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

    const model = state.model;
    if (model && els.video.readyState >= 2) {
      const started = performance.now();
      try {
        const predictions = await model.detect(els.video, MAX_BOXES);
        if (!state.running || model !== state.model) return;
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
    } else if (!model) {
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
    const file = els.fileInput.files && els.fileInput.files[0];
    if (file) {
      handleFile(file);
    }
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
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
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
  });

  els.modelSelect.addEventListener('change', () => loadModel(els.modelSelect.value));

  window.addEventListener('pagehide', () => {
    if (state.stream) state.stream.getTracks().forEach((t) => t.stop());
  });

  state.threshold = Number(els.threshold.value) / 100;
  els.thresholdOut.textContent = `${els.threshold.value}%`;
  refreshButtons();
  loadModel(els.modelSelect.value);
})();
