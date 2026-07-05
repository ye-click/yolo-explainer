<script>
</script>

<style>
  .article-container {
    max-width: 800px;
    margin: 30px auto;
    padding: 0 20px 60px;
    font-size: 16px;
    line-height: 1.7;
    color: #333;
  }
  .article-container h2 {
    font-size: 24px;
    margin: 30px 0 15px;
    color: #222;
    border-bottom: 2px solid #3273dc;
    padding-bottom: 8px;
  }

  .article-container p {
    margin: 12px 0;
    text-align: justify;
  }
  .article-container ul, .article-container ol {
    margin: 10px 0 10px 24px;
  }
  .article-container li {
    margin: 6px 0;
  }
  .article-container strong {
    color: #222;
  }
  .highlight-box {
    background: #f0f6ff;
    border-left: 4px solid #3273dc;
    padding: 14px 18px;
    margin: 16px 0;
    border-radius: 0 6px 6px 0;
    font-size: 15px;
  }
  .formula {
    background: #f8f8f8;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    padding: 14px 18px;
    margin: 14px 0;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    overflow-x: auto;
    line-height: 1.6;
    color: #333;
  }

</style>

<div class="article-container">
  <h2>What is YOLO?</h2>
  <p>
    <strong>YOLO (You Only Look Once)</strong> is a state-of-the-art, real-time object detection system.
    Unlike traditional object detection approaches that repurpose classifiers to perform detection
    (running a classifier at various locations and scales), YOLO frames object detection as a
    <strong>single regression problem</strong> — straight from image pixels to bounding box coordinates
    and class probabilities.
  </p>

  <div class="highlight-box">
    <strong>Key Insight:</strong> With YOLO, you only look once (one forward pass) at an image to
    predict what objects are present and where they are. The entire detection pipeline is a single
    neural network that can be optimized end-to-end.
  </div>

  <h2>The Unified Detection Pipeline</h2>
  <p>
    YOLO unifies the separate components of object detection into a single neural network. The process
    is remarkably simple:
  </p>
  <ol>
    <li><strong>Resize</strong> the input image to 448×448 pixels.</li>
    <li>Run a single <strong>convolutional network</strong> on the image.</li>
    <li><strong>Threshold</strong> the resulting detections by the model's confidence scores.</li>
  </ol>

  <h2>The S×S Grid System</h2>
  <p>
    The core innovation of YOLO is how it divides the image. YOLO partitions the input image into an
    <strong>S × S grid</strong>. For PASCAL VOC, S = 7, so there are 49 grid cells.
  </p>
  <p>
    If the <strong>center of an object</strong> falls into a grid cell, that grid cell is responsible
    for detecting that object. Each grid cell predicts:
  </p>
  <ul>
    <li><strong>B</strong> bounding boxes (coordinates + confidence)</li>
    <li><strong>C</strong> conditional class probabilities (one set per cell, not per box)</li>
  </ul>

  <h2>Bounding Box Predictions</h2>
  <p>
    Each of the <strong>B = 2</strong> bounding boxes per cell consists of <strong>5 predictions</strong>:
  </p>
  <ul>
    <li><strong>x, y</strong> — center of the box relative to the grid cell bounds (0 to 1)</li>
    <li><strong>w, h</strong> — width and height relative to the whole image (0 to 1)</li>
    <li><strong>confidence</strong> — Pr(Object) × IoU(pred, truth) — how confident the model is
    that the box contains an object and how accurate it thinks the box is</li>
  </ul>

  <h2>Class Predictions</h2>
  <p>
    Each grid cell predicts <strong>C conditional class probabilities</strong>,
    Pr(Class<sub>i</sub> | Object). On PASCAL VOC, C = 20 classes. Only <strong>one</strong> set of
    class probabilities is predicted per grid cell, regardless of the number of boxes B.
  </p>
  <p>
    At test time, the conditional class probabilities and the individual box confidence predictions
    are multiplied:
  </p>
  <div class="formula">
    Pr(Class<sub>i</sub> | Object) × Pr(Object) × IoU<sup>truth</sup><sub>pred</sub>
    = Pr(Class<sub>i</sub>) × IoU<sup>truth</sup><sub>pred</sub>
  </div>
  <p>
    This gives <strong>class-specific confidence scores</strong> for each box, encoding both the
    probability of that class appearing in the box and how well the box fits the object.
  </p>

  <h2>Output Tensor</h2>
  <p>
    The final prediction is a <strong>7 × 7 × 30 tensor</strong>:
  </p>
  <div class="formula">
    S × S × (B × 5 + C) = 7 × 7 × (2 × 5 + 20) = 7 × 7 × 30
  </div>
  <p>
    For each of the 49 grid cells, the 30 values encode:
    Box 1 (x, y, w, h, conf) + Box 2 (x, y, w, h, conf) + 20 class probabilities.
  </p>

  <h2>Network Architecture</h2>
  <p>
    YOLO's architecture is inspired by GoogLeNet. It has <strong>24 convolutional layers</strong>
    followed by <strong>2 fully connected layers</strong>:
  </p>
  <ul>
    <li>Uses 1×1 reduction layers followed by 3×3 convolutional layers (similar to Network in Network)</li>
    <li>Pre-trained on ImageNet at 224×224 resolution (first 20 conv layers)</li>
    <li>Fine-tuned for detection at 448×448 resolution</li>
    <li>Final layer uses <strong>linear activation</strong>; all other layers use <strong>leaky ReLU</strong>
    (φ(x) = x if x &gt; 0, else 0.1x)</li>
  </ul>

  <p>
    A faster version, <strong>Fast YOLO</strong>, uses only <strong>9 convolutional layers</strong>
    with fewer filters, achieving 155 FPS while still being twice as accurate as other real-time detectors.
  </p>

  <h2>Loss Function</h2>
  <p>
    YOLO optimizes a multi-part loss function using sum-squared error:
  </p>
  <div class="formula">
    Loss = λ<sub>coord</sub> Σ (x − x̂)² + (y − ŷ)²  &lt;-- coordinate loss<br>
    &nbsp;&nbsp;&nbsp;&nbsp;+ λ<sub>coord</sub> Σ (√w − √ŵ)² + (√h − √ĥ)²  &lt;-- size loss (sqrt for small boxes)<br>
    &nbsp;&nbsp;&nbsp;&nbsp;+ Σ (C − Ĉ)²  &lt;-- confidence loss (objects)<br>
    &nbsp;&nbsp;&nbsp;&nbsp;+ λ<sub>noobj</sub> Σ (C − Ĉ)²  &lt;-- confidence loss (no objects)<br>
    &nbsp;&nbsp;&nbsp;&nbsp;+ Σ Σ (p(c) − p̂(c))²  &lt;-- class loss<br><br>
    where λ<sub>coord</sub> = 5 (emphasize localization)<br>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;λ<sub>noobj</sub> = 0.5 (de-emphasize background)
  </div>

  <div class="highlight-box">
    <strong>Design Choice:</strong> λ<sub>coord</sub> = 5 increases the penalty for localization errors,
    while λ<sub>noobj</sub> = 0.5 decreases the penalty for confident background predictions. This
    prevents the model from being overwhelmed by the many grid cells that don't contain objects.
  </div>

  <h2>Non-Maximum Suppression (NMS)</h2>
  <p>
    While the grid design enforces spatial diversity, large objects or objects near cell borders can
    be detected by multiple cells. <strong>Non-maximum suppression</strong> removes duplicate detections:
  </p>
  <ol>
    <li>Sort all detection boxes by confidence score (highest first).</li>
    <li>Select the top box and remove any other box with IoU &gt; 0.5 of the same class.</li>
    <li>Repeat until all boxes are either selected or suppressed.</li>
  </ol>
  <p>
    NMS adds about 2-3% mAP improvement for YOLO (less critical than for R-CNN or DPM).
  </p>

  <h2>Performance</h2>
  <div class="formula" style="font-size:13px;">
    ┌─────────────────────┬──────┬──────┐<br>
    │ Model               │ mAP  │ FPS  │<br>
    ├─────────────────────┼──────┼──────┤<br>
    │ Fast YOLO           │ 52.7 │ 155  │<br>
    │ YOLO                │ 63.4 │ 45   │<br>
    │ Faster R-CNN (VGG)  │ 73.2 │ 7    │<br>
    │ Fast R-CNN          │ 70.0 │ 0.5  │<br>
    └─────────────────────┴──────┴──────┘
  </div>
  <p>
    YOLO achieves real-time performance while maintaining competitive accuracy. It makes
    <strong>fewer background errors</strong> than Fast R-CNN (less than half) but more
    <strong>localization errors</strong>. When combined with Fast R-CNN, YOLO can boost
    Fast R-CNN's mAP by 3.2% (from 71.8% to 75.0%).
  </p>

  <h2>Limitations</h2>
  <ul>
    <li><strong>Spatial constraints:</strong> Each cell predicts only 2 boxes and 1 class, limiting
    detection of nearby or small objects (e.g., flocks of birds).</li>
    <li><strong>Generalization:</strong> Struggles with new or unusual aspect ratios since bounding
    boxes are learned from training data.</li>
    <li><strong>Coarse features:</strong> Multiple downsampling layers result in relatively coarse
    features for predicting bounding boxes.</li>
    <li><strong>Equal error weighting:</strong> Sum-squared error treats small and large boxes
    equally, though small localization errors in large boxes are less significant.</li>
  </ul>

  <h2>Conclusion</h2>
  <p>
    YOLO introduced a paradigm shift in object detection by framing it as a <strong>single regression
    problem</strong> rather than a complex pipeline. Its unified architecture enables:
  </p>
  <ul>
    <li><strong>Extreme speed</strong> — real-time detection at 45-155 FPS</li>
    <li><strong>Global reasoning</strong> — the entire image is processed at once, encoding context</li>
    <li><strong>Generalizable representations</strong> — performs well even on artwork and other domains</li>
    <li><strong>End-to-end training</strong> — directly optimizes detection performance</li>
  </ul>
  <p>
    The "You Only Look Once" philosophy has inspired subsequent generations (YOLOv2, YOLOv3, YOLOv4,
    and beyond), making it one of the most influential object detection frameworks in computer vision.
  </p>
</div>
