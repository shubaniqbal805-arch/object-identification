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
    sceneTitle: $('sceneTitle'),
    sceneSummary: $('sceneSummary'),
    list: $('list'),
    threshold: $('threshold'),
    thresholdOut: $('thresholdOut'),
    modelSelect: $('modelSelect'),
    customLabelsField: $('customLabelsField'),
    customLabels: $('customLabels'),
    applyLabelsBtn: $('applyLabelsBtn'),
  };

  const MAX_CANVAS_SIDE = 1600;
  const MAX_BOXES = 100;
  const OPEN_VOCABULARY_LABELS = [
    'person', 'child', 'dog', 'cat', 'bird', 'horse', 'cow', 'sheep', 'rabbit',
    'tree', 'flower', 'potted plant', 'mushroom',
    'bread', 'pizza', 'sandwich', 'hamburger', 'burger', 'hot dog', 'french fries',
    'potato fries', 'ketchup', 'dipping sauce', 'sauce cup', 'food tray', 'food container',
    'apple', 'banana', 'orange', 'strawberry', 'grapes', 'tomato', 'carrot', 'broccoli',
    'cake', 'cookie', 'donut', 'croissant', 'taco', 'rice', 'pasta', 'egg', 'cheese',
    'bottle', 'can', 'jar', 'cup', 'mug', 'glass', 'bowl', 'plate', 'fork', 'knife', 'spoon',
    'chair', 'table', 'dining table', 'sofa', 'bed', 'desk', 'lamp', 'television',
    'laptop', 'keyboard', 'computer mouse', 'mobile phone', 'book', 'backpack',
    'suitcase', 'umbrella', 'shoe', 'hat', 'shirt', 'car', 'bus', 'truck', 'bicycle',
    'motorcycle', 'airplane', 'boat', 'traffic light', 'stop sign', 'clock', 'toaster',
    'refrigerator', 'microwave', 'sink', 'toilet', 'scissors', 'hammer', 'toothbrush',
    'wallet', 'keys', 'watch', 'glasses', 'handbag', 'shopping bag', 'basket',
    'box', 'package', 'bag', 'pencil', 'pen', 'marker', 'notebook', 'newspaper',
    'magazine', 'newspaper', 'calendar', 'picture frame', 'mirror', 'window', 'door',
    'bed', 'pillow', 'blanket', 'curtain', 'rug', 'stair', 'wall', 'floor', 'ceiling',
    'fan', 'air conditioner', 'heater', 'smoke detector', 'camera', 'printer',
    'charger', 'headphones', 'earphones', 'speaker', 'router', 'remote control',
    'game controller', 'toy', 'teddy bear', 'ball', 'basketball', 'soccer ball',
    'skateboard', 'bicycle', 'motorcycle', 'car', 'bus', 'truck', 'train',
    'building', 'house', 'bridge', 'road', 'sign', 'fence', 'gate',
    'body of water', 'mountain', 'sky', 'cloud', 'grass', 'rock',
    'bathroom', 'bathtub', 'shower', 'toilet paper', 'soap', 'shampoo', 'towel',
    'toothpaste', 'hairbrush', 'comb', 'washing machine', 'laundry basket',
    'kettle', 'coffee maker', 'cutting board', 'frying pan', 'saucepan', 'cooking pot',
    'spatula', 'whisk', 'ladle', 'tongs', 'measuring cup', 'napkin', 'paper towel',
    'cereal', 'chips', 'candy', 'chocolate', 'ice cream', 'yogurt', 'juice', 'coffee',
    'tea', 'soda can', 'water bottle', 'meal', 'salad', 'soup', 'meat', 'fish',
    'shelf', 'cabinet', 'drawer', 'countertop', 'stove', 'dishwasher', 'trash can',
    'recycling bin', 'light switch', 'electrical outlet', 'extension cord', 'battery',
    'flashlight', 'candle', 'fire extinguisher', 'first aid kit', 'medicine bottle',
    'guitar', 'piano', 'violin', 'drum', 'microphone', 'musical instrument',
    'sunglasses', 'ring', 'necklace', 'bracelet', 'earrings', 'belt', 'scarf', 'glove',
    'socks', 'boot', 'sandal', 'coat', 'sweater', 'uniform',
    'suitcase', 'duffel bag', 'luggage', 'briefcase', 'plastic bag', 'paper bag',
    'envelope', 'folder', 'document', 'receipt', 'card', 'coin', 'paper money',
    'remote', 'tablet', 'smartphone', 'screen', 'monitor', 'webcam', 'memory card',
    'tripod', 'video game console', 'power strip', 'desk chair', 'office chair',
    'stool', 'bench', 'bookshelf', 'wardrobe', 'dresser', 'mattress',
    'plant pot', 'flower pot', 'vase', 'decorative object', 'picture', 'painting',
    'curtain rod', 'door handle', 'key', 'lock', 'doormat', 'shoe rack',
    'baby stroller', 'car seat', 'wheelchair', 'walking cane', 'helmet', 'safety vest',
    'toolbox', 'drill', 'screwdriver', 'wrench', 'pliers', 'tape measure', 'paint brush',
    'paint can', 'broom', 'mop', 'vacuum cleaner', 'iron', 'sewing machine',
    'basketball hoop', 'tennis racket', 'baseball bat', 'sports equipment',
    'dog leash', 'pet bowl', 'bird cage', 'animal carrier',
    'brick', 'wood plank', 'pipe', 'metal canister', 'bucket', 'ladder',
    'traffic cone', 'street lamp', 'mailbox', 'parking meter', 'fire hydrant',
    'boat', 'airplane', 'scooter', 'van', 'taxi', 'tractor', 'truck trailer',
    'leaf', 'branch', 'log', 'stone', 'sand', 'snow', 'ice', 'water',
  ];
  const USE_CATEGORIES = {
    person: ['person', 'baby', 'child', 'woman', 'man'],
    animal: [
      'dog', 'cat', 'horse', 'cow', 'sheep', 'goat', 'pig', 'chicken', 'duck', 'bird', 'parrot',
      'fish', 'turtle', 'snake', 'lizard', 'frog', 'rabbit', 'hamster', 'mouse', 'squirrel', 'deer',
      'bear', 'lion', 'tiger', 'elephant', 'giraffe', 'zebra', 'monkey', 'penguin', 'dolphin',
      'butterfly', 'bee', 'spider', 'insect',
    ],
    plant: ['tree', 'leaf', 'flower', 'rose', 'sunflower', 'potted plant', 'cactus'],
    food: [
      'bread', 'loaf of bread', 'baguette', 'croissant', 'donut', 'cake', 'cupcake', 'cookie',
      'pizza', 'sandwich', 'hamburger', 'burger', 'hot dog', 'taco', 'french fries', 'potato fries',
      'ketchup', 'dipping sauce', 'apple', 'banana', 'orange', 'strawberry', 'grapes', 'pineapple',
      'watermelon', 'lemon', 'tomato', 'potato', 'carrot', 'broccoli', 'lettuce', 'onion',
      'avocado', 'egg', 'cheese', 'milk', 'pasta', 'rice', 'bowl of soup',
    ],
    fungus: ['mushroom'],
    furniture: ['chair', 'table', 'dining table', 'sofa', 'couch', 'bed', 'desk', 'bench'],
    electronics: [
      'television', 'tv', 'computer monitor', 'laptop', 'keyboard', 'computer mouse',
      'mobile phone', 'cell phone', 'remote control',
    ],
    timekeeping: ['clock'],
    vehicle: ['car', 'bus', 'truck', 'motorcycle', 'bicycle', 'airplane', 'boat', 'train'],
    clothing: ['shoe', 'shoes', 'hat', 'shirt', 'jacket', 'pants', 'dress', 'tie'],
    accessory: ['backpack', 'suitcase', 'umbrella', 'handbag', 'watch', 'glasses', 'keys', 'wallet'],
    tool: [
      'scissors', 'knife', 'hammer', 'screwdriver', 'wrench', 'saw',
    ],
    personalCare: ['toothbrush', 'hair dryer', 'hair drier'],
    kitchenware: [
      'coffee cup', 'bottle', 'can', 'jar', 'cup', 'mug', 'glass', 'wine glass', 'plate',
      'fork', 'spoon', 'bowl', 'sink', 'sauce cup', 'food tray', 'food container',
    ],
    appliance: ['toaster', 'refrigerator', 'oven', 'microwave'],
    sports: [
      'skateboard', 'ball', 'sports ball', 'frisbee', 'skis', 'snowboard', 'kite', 'surfboard',
      'baseball bat', 'baseball glove', 'tennis racket',
    ],
    container: ['vase'],
    toy: ['teddy bear'],
    infrastructure: ['traffic light', 'stop sign', 'fire hydrant', 'parking meter', 'toilet'],
    reading: ['book', 'notebook', 'pen', 'pencil'],
  };
  const USE_NOTES = {
    person: 'A person; this app does not infer a person\'s role, identity, or purpose.',
    animal: 'Possible roles include companionship, assistance, farming, or wildlife; this depends on the species and context.',
    plant: 'May provide food, shade, materials, decoration, or habitat. Do not eat a plant based only on an image label.',
    food: 'May be eaten or used in a meal. Confirm the item and food safety before consuming it.',
    fungus: 'Some fungi are edible and others are poisonous. Never eat one based only on an image label.',
    furniture: 'Commonly used for sitting, sleeping, storage, or a work surface.',
    electronics: 'May support communication, computing, media, or control, depending on the device.',
    timekeeping: 'Commonly used to show or track the time.',
    vehicle: 'Commonly used to transport people or goods.',
    clothing: 'Worn for coverage, comfort, or protection from weather.',
    accessory: 'Often used to carry, protect, secure, or complement personal items.',
    tool: 'May be used for a specific task such as cutting, repair, or personal care. Follow relevant safety instructions.',
    personalCare: 'Often used for personal hygiene or grooming.',
    kitchenware: 'Often used to prepare, hold, serve, or consume food or drinks.',
    appliance: 'Commonly used to prepare, heat, or store food.',
    sports: 'May be used for sport, exercise, or recreation.',
    container: 'Often used to hold, store, or display items.',
    toy: 'Often used for play, comfort, or decoration.',
    infrastructure: 'Supports public facilities, sanitation, or traffic management.',
    reading: 'Often used for reading, writing, learning, or reference.',
  };
  const USE_CATEGORY_BY_LABEL = new Map();
  for (const [category, labels] of Object.entries(USE_CATEGORIES)) {
    labels.forEach((label) => USE_CATEGORY_BY_LABEL.set(label, category));
  }

  const state = {
    model: null,
    modelType: 'coco',
    RawImage: null,
    modelRequest: 0,
    mode: 'upload',
    image: null,
    stream: null,
    running: false,
    raf: 0,
    predictions: [],
    threshold: 0.6,
    customLabels: [],
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

  function possibleUsesFor(label) {
    const normalized = label.toLowerCase();
    if (normalized === 'mouse') {
      return 'Could mean a living animal or a computer input device; its use depends on the correct identification.';
    }
    const category = USE_CATEGORY_BY_LABEL.get(normalized);
    return category
      ? USE_NOTES[category]
      : 'No use note is available for this label. Verify the identification and context.';
  }

  function visiblePredictions() {
    return state.predictions
      .filter((p) => p.score >= state.threshold)
      .sort((a, b) => b.score - a.score);
  }

  function currentSourceDimensions() {
    if (state.mode === 'upload' && state.image) {
      return { width: state.image.naturalWidth, height: state.image.naturalHeight };
    }
    if (state.mode === 'webcam' && els.video.videoWidth && els.video.videoHeight) {
      return { width: els.video.videoWidth, height: els.video.videoHeight };
    }
    return null;
  }

  function locationAndAreaFor(prediction, dimensions) {
    if (!dimensions || !dimensions.width || !dimensions.height) {
      return 'Position and image area are unavailable.';
    }

    const [x, y, width, height] = prediction.bbox;
    const centerX = Math.max(0, Math.min(1, (x + width / 2) / dimensions.width));
    const centerY = Math.max(0, Math.min(1, (y + height / 2) / dimensions.height));
    const horizontal = centerX < 1 / 3 ? 'left' : centerX < 2 / 3 ? 'center' : 'right';
    const vertical = centerY < 1 / 3 ? 'upper' : centerY < 2 / 3 ? 'middle' : 'lower';
    const position = horizontal === 'center' && vertical === 'middle'
      ? 'center'
      : `${vertical} ${horizontal}`;
    const area = Math.max(0, Math.min(100, (width * height / (dimensions.width * dimensions.height)) * 100));
    const areaText = area < 10 ? area.toFixed(1) : String(Math.round(area));

    return `Position: ${position}. Approximate bounding-box area: ${areaText}% of the image.`;
  }

  function describeScene(predictions, metaText, dimensions) {
    const sourceAvailable = state.mode === 'upload' ? !!state.image : state.running;
    if (!sourceAvailable) {
      return 'Upload an image or start the webcam to see detected contents.';
    }
    if (metaText === 'Analyzing…' || metaText.startsWith('Waiting for')
      || metaText.startsWith('Wide-vocabulary analysis')) {
      return metaText;
    }

    const size = dimensions
      ? `Source dimensions: ${dimensions.width} × ${dimensions.height} pixels.`
      : '';
    if (predictions.length === 0) {
      return `${size} No objects were detected at the current confidence level. Try lowering the minimum confidence.`
        .trim();
    }

    const counts = new Map();
    for (const prediction of predictions) {
      counts.set(prediction.class, (counts.get(prediction.class) || 0) + 1);
    }
    const contents = [...counts.entries()]
      .map(([name, count]) => `${name} × ${count}`)
      .join(', ');
    const total = predictions.length === 1 ? '1 object' : `${predictions.length} objects`;
    return `${size} Detected ${total}: ${contents}.`.trim();
  }

  async function loadModel(base) {
    const request = ++state.modelRequest;
    state.model = null;
    const wideVocabulary = base === 'open_vocabulary';
    state.modelType = wideVocabulary ? 'open_vocabulary' : 'coco';
    state.threshold = wideVocabulary ? 0.15 : 0.6;
    els.threshold.min = wideVocabulary ? '5' : '50';
    els.threshold.step = '5';
    els.threshold.value = String(state.threshold * 100);
    els.thresholdOut.textContent = `${els.threshold.value}%`;
    els.customLabelsField.hidden = !wideVocabulary;
    els.modelSelect.disabled = true;
    setStatus('loading', wideVocabulary ? 'Loading wide-vocabulary model…' : 'Loading AI model…');

    try {
      let model;
      if (wideVocabulary) {
        const { pipeline, RawImage } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1');
        model = await pipeline('zero-shot-object-detection', 'Xenova/owlv2-base-patch16-ensemble', { dtype: 'q4' });
        if (request !== state.modelRequest) return;
        state.RawImage = RawImage;
      } else {
        if (typeof tf === 'undefined' || typeof cocoSsd === 'undefined') {
          throw new Error('TensorFlow.js or COCO-SSD did not load. Check your internet connection.');
        }
        await tf.ready();
        model = await cocoSsd.load({ base });
      }
      if (request !== state.modelRequest) return;
      state.model = model;
      setStatus('ready', wideVocabulary ? 'Wide-vocabulary model ready' : `Model ready (${tf.getBackend()} backend)`);
      hideNotice();
      if (state.mode === 'upload' && state.image) detectImage();
    } catch (err) {
      if (request !== state.modelRequest) return;
      console.error(err);
      setStatus('error', 'Model failed to load');
      showNotice('The AI model could not be loaded. Check your internet connection, then try selecting the model again. ' + (err.message || ''));
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
    els.sceneTitle.textContent = state.mode === 'upload' ? 'Image overview' : 'Live scene overview';
    const dimensions = currentSourceDimensions();
    els.sceneSummary.textContent = describeScene(predictions, metaText, dimensions);

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

      const useNote = document.createElement('p');
      useNote.className = 'use-note';
      useNote.textContent = `Possible uses: ${possibleUsesFor(p.class)}`;

      const detail = document.createElement('p');
      detail.className = 'detail-note';
      detail.textContent = locationAndAreaFor(p, dimensions);

      li.append(row, bar, detail, useNote);
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

  async function detect(input) {
    if (state.modelType === 'open_vocabulary') {
      const sourceWidth = input.videoWidth || input.naturalWidth || input.width;
      const sourceHeight = input.videoHeight || input.naturalHeight || input.height;
      if (!sourceWidth || !sourceHeight || !state.RawImage) {
        throw new Error('The image could not be prepared for wide-vocabulary detection.');
      }

      const scale = Math.min(1, MAX_CANVAS_SIDE / Math.max(sourceWidth, sourceHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(sourceWidth * scale);
      canvas.height = Math.round(sourceHeight * scale);
      const context = canvas.getContext('2d');
      if (!context) throw new Error('This browser could not prepare the image for detection.');
      context.drawImage(input, 0, 0, canvas.width, canvas.height);

      const labels = state.customLabels.length
        ? state.customLabels
        : [...new Set(OPEN_VOCABULARY_LABELS)];
      const prompts = labels.map((label) => `a photo of ${label}`);
      const labelByPrompt = new Map(prompts.map((prompt, index) => [prompt, labels[index]]));
      const model = state.model;
      if (!model) throw new Error('The object detection model is not ready.');
      const views = [{ canvas, x: 0, y: 0 }];
      if (state.mode === 'upload' && canvas.width >= 1200 && canvas.height >= 800) {
        const tileWidth = Math.ceil(canvas.width * 0.65);
        const tileHeight = Math.ceil(canvas.height * 0.65);
        const xOffsets = [0, canvas.width - tileWidth];
        const yOffsets = [0, canvas.height - tileHeight];
        for (const y of yOffsets) {
          for (const x of xOffsets) {
            const tile = document.createElement('canvas');
            tile.width = tileWidth;
            tile.height = tileHeight;
            const tileContext = tile.getContext('2d');
            if (!tileContext) throw new Error('This browser could not prepare image close-ups.');
            tileContext.drawImage(canvas, x, y, tileWidth, tileHeight, 0, 0, tileWidth, tileHeight);
            views.push({ canvas: tile, x, y });
          }
        }
      }

      const predictions = [];
      for (const view of views) {
        const image = state.RawImage.fromCanvas(view.canvas);
        const results = await model(image, prompts, { threshold: 0.0001, top_k: MAX_BOXES });
        for (const result of results) {
          predictions.push({
            class: labelByPrompt.get(result.label) || result.label,
            score: result.score,
            bbox: [
              (view.x + result.box.xmin) / scale,
              (view.y + result.box.ymin) / scale,
              (result.box.xmax - result.box.xmin) / scale,
              (result.box.ymax - result.box.ymin) / scale,
            ],
          });
        }
      }
      predictions.sort((a, b) => b.score - a.score);

      return predictions.filter((prediction, index) => !predictions.slice(0, index).some((other) => {
        const [ax, ay, aw, ah] = prediction.bbox;
        const [bx, by, bw, bh] = other.bbox;
        const intersection = Math.max(0, Math.min(ax + aw, bx + bw) - Math.max(ax, bx))
          * Math.max(0, Math.min(ay + ah, by + bh) - Math.max(ay, by));
        const union = aw * ah + bw * bh - intersection;
        const overlap = union > 0 ? intersection / union : 0;
        return overlap > 0.5
          && (prediction.class === other.class || overlap > 0.85);
      })).slice(0, MAX_BOXES);
    }
    return state.model.detect(input, MAX_BOXES);
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

    const usesCloseUps = state.modelType === 'open_vocabulary'
      && img.naturalWidth * Math.min(1, MAX_CANVAS_SIDE / Math.max(img.naturalWidth, img.naturalHeight)) >= 1200
      && img.naturalHeight * Math.min(1, MAX_CANVAS_SIDE / Math.max(img.naturalWidth, img.naturalHeight)) >= 800;
    updateResults([], state.modelType === 'open_vocabulary'
      ? usesCloseUps
        ? 'Wide-vocabulary analysis of the full image and close-ups can take longer…'
        : 'Wide-vocabulary analysis can take tens of seconds…'
      : 'Analyzing…');
    const started = performance.now();
    try {
      const predictions = await detect(img);
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
        const predictions = await detect(els.video);
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
  els.applyLabelsBtn.addEventListener('click', () => {
    const labels = els.customLabels.value.split(/[,;\n]/).map((label) => label.trim()).filter(Boolean);
    if (labels.length > 20) {
      showNotice('Add up to 20 custom names at a time.');
      return;
    }
    if (labels.some((label) => label.length > 80)) {
      showNotice('Each custom name must be 80 characters or fewer.');
      return;
    }
    state.customLabels = [...new Map(labels.map((label) => [label.toLowerCase(), label])).values()];
    hideNotice();
    if (state.mode === 'upload' && state.image) detectImage();
  });

  window.addEventListener('pagehide', () => {
    if (state.stream) state.stream.getTracks().forEach((t) => t.stop());
  });

  state.threshold = Number(els.threshold.value) / 100;
  els.thresholdOut.textContent = `${els.threshold.value}%`;
  refreshButtons();
  loadModel(els.modelSelect.value);
})();
