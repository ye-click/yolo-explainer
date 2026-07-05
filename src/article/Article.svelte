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
  <h2>什么是 YOLO？</h2>
  <p>
    <strong>YOLO（You Only Look Once）</strong> 是一种先进的实时目标检测系统。
    传统目标检测方法将分类器改造为检测器（在不同位置和尺度上运行分类器），
    而 YOLO 将目标检测定义为一个<strong>单一的回归问题</strong>——
    直接从图像像素映射到边界框坐标和类别概率。
  </p>

  <div class="highlight-box">
    <strong>核心思想：</strong>使用 YOLO，你只需"看一眼"（一次前向传播）图像，
    就能预测出图像中存在哪些物体及其位置。整个检测流水线是一个可以端到端优化的单一神经网络。
  </div>

  <h2>统一的检测流水线</h2>
  <p>
    YOLO 将目标检测的各个独立组件统一为一个单一的神经网络。流程异常简洁：
  </p>
  <ol>
    <li><strong>调整大小</strong> — 将输入图像调整为 448×448 像素。</li>
    <li><strong>运行卷积网络</strong> — 在图像上执行一次前向传播。</li>
    <li><strong>阈值筛选</strong> — 根据模型输出的置信度分数筛选检测结果。</li>
  </ol>

  <h2>S×S 网格系统</h2>
  <p>
    YOLO 的核心创新在于它对图像的分割方式。YOLO 将输入图像划分为一个
    <strong>S × S 网格</strong>。在 PASCAL VOC 数据集上，S = 7，即共有 49 个网格单元格。
  </p>
  <p>
    如果一个物体的<strong>中心</strong>落入某个网格单元格，该单元格就负责检测这个物体。
    每个网格单元格预测：
  </p>
  <ul>
    <li><strong>B</strong> 个边界框（坐标 + 置信度）</li>
    <li><strong>C</strong> 个条件类别概率（每个单元格一组，而非每个框一组）</li>
  </ul>

  <h2>边界框预测</h2>
  <p>
    每个单元格的 <strong>B = 2</strong> 个边界框各包含 <strong>5 个预测值</strong>：
  </p>
  <ul>
    <li><strong>x, y</strong> — 框中心相对于网格单元格边界的偏移量（0 到 1）</li>
    <li><strong>w, h</strong> — 框的宽度和高度相对于整张图像的比例（0 到 1）</li>
    <li><strong>confidence（置信度）</strong> — Pr(Object) × IoU(pred, truth)，
    表示模型对框内含有物体的确信程度以及框的准确度</li>
  </ul>

  <h2>类别预测</h2>
  <p>
    每个网格单元格预测 <strong>C 个条件类别概率</strong> Pr(Class<sub>i</sub> | Object)。
    在 PASCAL VOC 上，C = 20 个类别。每个网格单元格<strong>只</strong>预测一组类别概率，
    与边界框数量 B 无关。
  </p>
  <p>
    在测试时，条件类别概率与每个框的置信度相乘：
  </p>
  <div class="formula">
    Pr(Class<sub>i</sub> | Object) × Pr(Object) × IoU<sup>truth</sup><sub>pred</sub>
    = Pr(Class<sub>i</sub>) × IoU<sup>truth</sup><sub>pred</sub>
  </div>
  <p>
    这样就得到了每个框的<strong>类别特定置信度分数</strong>，
    同时编码了该类别出现在框中的概率和框与物体的匹配程度。
  </p>

  <h2>输出张量</h2>
  <p>
    最终预测是一个 <strong>7 × 7 × 30 的张量</strong>：
  </p>
  <div class="formula">
    S × S × (B × 5 + C) = 7 × 7 × (2 × 5 + 20) = 7 × 7 × 30
  </div>
  <p>
    对于 49 个网格单元格中的每一个，30 个值的编码方式为：
    框 1（x, y, w, h, 置信度）+ 框 2（x, y, w, h, 置信度）+ 20 个类别概率。
  </p>

  <h2>网络架构</h2>
  <p>
    YOLO 的架构受 GoogLeNet 启发，包含 <strong>24 个卷积层</strong>后接
    <strong>2 个全连接层</strong>：
  </p>
  <ul>
    <li>使用 1×1 降维层后接 3×3 卷积层（类似于 Network in Network）</li>
    <li>在 ImageNet 上以 224×224 分辨率预训练（前 20 个卷积层）</li>
    <li>以 448×448 分辨率微调用于检测任务</li>
    <li>最后一层使用<strong>线性激活函数</strong>；其余所有层使用
    <strong>Leaky ReLU</strong>（φ(x) = x 若 x &gt; 0，否则为 0.1x）</li>
  </ul>

  <p>
    更快速的版本 <strong>Fast YOLO</strong> 仅使用 <strong>9 个卷积层</strong>和更少的滤波器，
    达到了 155 FPS，同时准确率仍然是其他实时检测器的两倍。
  </p>

  <h2>损失函数</h2>
  <p>
    YOLO 使用平方和误差优化一个多部分损失函数：
  </p>
  <div class="formula">
    Loss = λ<sub>coord</sub> Σ (x − x̂)² + (y − ŷ)²  &lt;-- 坐标损失<br>
    &nbsp;&nbsp;&nbsp;&nbsp;+ λ<sub>coord</sub> Σ (√w − √ŵ)² + (√h − √ĥ)²  &lt;-- 尺寸损失（平方根处理小框）<br>
    &nbsp;&nbsp;&nbsp;&nbsp;+ Σ (C − Ĉ)²  &lt;-- 包含物体的置信度损失<br>
    &nbsp;&nbsp;&nbsp;&nbsp;+ λ<sub>noobj</sub> Σ (C − Ĉ)²  &lt;-- 不包含物体的置信度损失<br>
    &nbsp;&nbsp;&nbsp;&nbsp;+ Σ Σ (p(c) − p̂(c))²  &lt;-- 类别损失<br><br>
    其中 λ<sub>coord</sub> = 5（强调定位准确性）<br>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;λ<sub>noobj</sub> = 0.5（降低背景的权重）
  </div>

  <div class="highlight-box">
    <strong>设计考量：</strong>λ<sub>coord</sub> = 5 增加了定位误差的惩罚，
    而 λ<sub>noobj</sub> = 0.5 降低了无物体单元格的置信度惩罚。
    这防止了模型被大量不包含物体的网格单元格所主导。
  </div>

  <h2>非极大值抑制（NMS）</h2>
  <p>
    虽然网格设计强制了空间多样性，但大物体或靠近边界的物体可能被多个单元格检测到。
    <strong>非极大值抑制</strong>用于消除重复检测：
  </p>
  <ol>
    <li>按置信度分数对所有检测框排序（最高优先）。</li>
    <li>选取最高分的框，移除同一类中与该框 IoU &gt; 0.5 的其他框。</li>
    <li>重复上述步骤，直到所有框要么被保留、要么被抑制。</li>
  </ol>
  <p>
    NMS 为 YOLO 带来约 2-3% 的 mAP 提升（对 YOLO 而言不如对 R-CNN 或 DPM 那么关键）。
  </p>

  <h2>性能对比</h2>
  <div class="formula" style="font-size:13px;">
    ┌─────────────────────┬──────┬──────┐<br>
    │ 模型                │ mAP  │ FPS  │<br>
    ├─────────────────────┼──────┼──────┤<br>
    │ Fast YOLO           │ 52.7 │ 155  │<br>
    │ YOLO                │ 63.4 │ 45   │<br>
    │ Faster R-CNN (VGG)  │ 73.2 │ 7    │<br>
    │ Fast R-CNN          │ 70.0 │ 0.5  │<br>
    └─────────────────────┴──────┴──────┘
  </div>
  <p>
    YOLO 在保持有竞争力的准确率的同时实现了实时性能。它产生的
    <strong>背景误报</strong>比 Fast R-CNN 少得多（不到一半），但<strong>定位误差</strong>更多。
    当与 Fast R-CNN 结合时，YOLO 可以将其 mAP 提升 3.2%（从 71.8% 到 75.0%）。
  </p>

  <h2>局限性</h2>
  <ul>
    <li><strong>空间约束：</strong>每个单元格只预测 2 个框和 1 个类别，限制了近距离或小物体的检测（如鸟群）。</li>
    <li><strong>泛化能力：</strong>因为边界框是从训练数据中学习的，所以在新颖或不常见宽高比的目标上表现欠佳。</li>
    <li><strong>特征粗糙：</strong>多个下采样层导致用于预测边界框的特征相对粗糙。</li>
    <li><strong>误差均等加权：</strong>平方和误差对小框和大框的误差一视同仁，而大框中小的定位误差实际上影响更小。</li>
  </ul>

  <h2>总结</h2>
  <p>
    YOLO 通过将目标定义为一个<strong>单一的回归问题</strong>而非复杂的多阶段流水线，
    引入了目标检测领域的范式转变。其统一的架构实现了：
  </p>
  <ul>
    <li><strong>极致的速度</strong> — 以 45-155 FPS 实现实时检测</li>
    <li><strong>全局推理</strong> — 一次性处理整幅图像，编码上下文信息</li>
    <li><strong>可泛化的表征</strong> — 即使在艺术作品等其他领域也能有良好表现</li>
    <li><strong>端到端训练</strong> — 直接优化检测性能</li>
  </ul>
  <p>
    "You Only Look Once" 的理念启发了后续多代 YOLO 模型（YOLOv2、YOLOv3、YOLOv4 等），
    使其成为计算机视觉领域最具影响力的目标检测框架之一。
  </p>
</div>
