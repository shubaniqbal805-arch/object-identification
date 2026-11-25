# Object Identification System

A browser-based object detection app that lets you:

- upload an image and detect objects
- use your webcam for live object detection
- view detected object names, confidence values, counts, and bounding boxes
- see an overview of recognized image contents, source dimensions, and each object's approximate location and boxed image area
- see general possible-use notes for recognized object categories
- save an annotated image with the overlays

Built with:

- HTML
- CSS
- JavaScript
- TensorFlow.js
- COCO-SSD
- Transformers.js (optional wider-vocabulary model)

## Recognition modes

- **Fast** and **More accurate** use COCO-SSD, which recognizes 80 predefined object classes.
- **Detailed — wider vocabulary** is the default image-analysis mode. It uses OWLv2 to search beyond COCO-SSD's 80 classes and can take tens of seconds on an uploaded image. It downloads about 194 MB on first use. Enter up to 20 custom names to focus the search, or leave the field blank for the built-in object and food names.
- No model can guarantee it will name every visible thing. Results depend on image quality and model accuracy.
- The wider-vocabulary model can return false labels or overlapping boxes. Verify results, especially before relying on them.
- Image overviews and object locations are derived from detections; the app does not infer a complete scene description or details that the model cannot see.
- Possible-use notes are local, general examples for supported categories. Unknown labels get a clear note when no usage information is available; verify the detected name before relying on any suggestion.

## Run locally

From the project folder, start a local web server:

### Option 1: Python

```powershell
cd "C:\Users\itachi\Desktop\object_identification"
python -m http.server 8000 --bind 0.0.0.0
```

If `python` does not work, try:

```powershell
py -m http.server 8000 --bind 0.0.0.0
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

## Open it on your phone

1. Connect your phone and computer to the same private Wi-Fi network.
2. Start the server with `start-local-server.bat` or the Python command above, and leave its window running.
3. On the computer, run `ipconfig` and note the IPv4 address under its active Wi-Fi adapter.
4. On your phone, open `http://<computer-ip>:8000` (for example, `http://192.168.1.25:8000`).
5. If Windows Firewall prompts you, allow Python on **Private networks only**.

This local server has no access controls, so use it only on a trusted private network and stop it with Ctrl+C when finished. Image uploads work over this connection; phone webcam access may require HTTPS.

## Notes

- On first visit, the browser downloads TensorFlow.js and the COCO-SSD model from public CDNs. Selecting Wider vocabulary downloads Transformers.js and its model weights.
- Webcam access requires localhost or HTTPS.
- Image and camera processing happen in the browser; images are not uploaded to a server.
- COCO-SSD recognizes 80 common object classes and may miss objects outside that set.
- The wider-vocabulary model is optional; image processing stays in your browser, but its code and weights are fetched from public CDNs.
