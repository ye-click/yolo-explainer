<div align="center">
  <img src="public/assets/img/favicon.svg" width="80" height="80">
  <h1>YOLO Explainer</h1>
  <p><strong>An Interactive Visualization System for Learning YOLO Object Detection</strong></p>
  <p>基于 YOLO 论文的交互式可视化学习工具 | <a href="https://arxiv.org/abs/1506.02640">You Only Look Once: Unified, Real-Time Object Detection</a></p>

  <p>
    <a href="#features">Features</a> ·
    <a href="#quick-start">Quick Start</a> ·
    <a href="#project-structure">Structure</a> ·
    <a href="#how-it-works">How It Works</a> ·
    <a href="#references">References</a>
  </p>
</div>

---

## Features

- **Interactive 7×7 Grid** — Click any grid cell to inspect its 2 bounding box predictions and 20 class probabilities
- **Real-time Detection Stats** — See how many boxes are kept vs suppressed via Non-Maximum Suppression
- **Network Architecture** — Visualize YOLO's 24-layer convolutional architecture
- **NMS Visualization** — Understand how duplicate detections are removed
- **Educational Article** — Comprehensive walkthrough of YOLO theory, loss function, and performance
- **Built with Svelte + D3.js** — Same tech stack as [CNN Explainer](https://github.com/poloclub/cnn-explainer)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/ye-click/yolo-explainer.git
cd yolo-explainer

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open **http://localhost:3000** in your browser.

## Project Structure

```
yolo-explainer/
├── public/                     # Static assets
│   ├── index.html              # Entry HTML
│   └── global.css              # Global styles
├── src/
│   ├── main.js                 # App entry point
│   ├── App.svelte              # Root Svelte component
│   ├── Header.svelte           # Header with logo and links
│   ├── Explainer.svelte        # Main layout container
│   ├── config.js               # YOLO configuration (S, B, C, architecture)
│   ├── stores.js               # Svelte stores (state management)
│   ├── overview/
│   │   ├── Overview.svelte     # Main visualization view
│   │   └── grid-draw.js        # D3.js drawing utilities
│   ├── detail-view/
│   │   ├── GridCellView.svelte # Cell-level prediction details
│   │   ├── NetworkView.svelte  # Network architecture diagram
│   │   └── NMSView.svelte      # Non-max suppression visualization
│   ├── article/
│   │   └── Article.svelte      # Educational article
│   └── utils/
│       └── yolo.js             # YOLO logic (decoding, NMS, loss)
├── rollup.config.js            # Rollup bundler configuration
└── package.json                # Dependencies and scripts
```

## How It Works

### The YOLO Detection Pipeline

YOLO frames object detection as a **single regression problem** — from image pixels to bounding box coordinates and class probabilities — in one forward pass.

### 7 × 7 Grid System

The input image (448×448) is divided into an **S × S grid** (S=7). Each grid cell is responsible for detecting objects whose center falls within it.

### Output Tensor

Each grid cell predicts:

| Component | Size | Description |
|-----------|------|-------------|
| Box 1     | 5    | x, y, w, h, confidence |
| Box 2     | 5    | x, y, w, h, confidence |
| Classes   | 20   | Pr(Classᵢ | Object) for PASCAL VOC |

**Total:** 7 × 7 × 30 = **1470 values**

### Non-Maximum Suppression

Duplicate detections are removed by comparing IoU (Intersection over Union) between boxes of the same class, keeping only the highest-confidence prediction per object.

## Tech Stack

- **Framework:** [Svelte](https://svelte.dev/) v3
- **Bundler:** [Rollup](https://rollupjs.org/)
- **Visualization:** [D3.js](https://d3js.org/) v5
- **CSS:** [Bulma](https://bulma.io/) v0.8
- **Styling:** Svelte scoped CSS + CSS custom properties

## References

- **Paper:** [You Only Look Once: Unified, Real-Time Object Detection](https://arxiv.org/abs/1506.02640) — Redmon et al., CVPR 2016
- **Original Project:** [pjreddie.com/yolo](https://pjreddie.com/darknet/yolo/)
- **Inspiration:** [CNN Explainer](https://github.com/poloclub/cnn-explainer) — The interactive visualization system that inspired this project

## License

This project is for educational purposes. The YOLO paper and associated materials are © their respective authors.
