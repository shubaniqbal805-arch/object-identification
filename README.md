# Object Identification System

A browser-based object detection app that lets you:

- upload an image and detect objects
- use your webcam for live object detection
- view detected object names, confidence values, counts, and bounding boxes
- save an annotated image with the overlays

Built with:

- HTML
- CSS
- JavaScript
- TensorFlow.js
- COCO-SSD

## Run locally

From the project folder, start a local web server:

### Option 1: Python

```powershell
cd "C:\Users\itachi\Desktop\object_identification"
python -m http.server 8000
```

If `python` does not work, try:

```powershell
py -m http.server 8000
```

### Option 2: Node

```powershell
cd "C:\Users\itachi\Desktop\object_identification"
npx serve .
```

Then open:

```text
http://localhost:8000
```

## Notes

- On first visit, the browser will download TensorFlow.js and the COCO-SSD model from a public CDN.
- Webcam access requires localhost or HTTPS.
- Image and camera processing happen in the browser and are not uploaded to any server.
- COCO-SSD recognizes common object classes and may miss objects outside that set.
