<script>
  import { onMount } from 'svelte';
  import { yoloConfig } from '../config.js';
  import {
    yoloStore, svgStore, selectedGridCell, hoverInfoStore,
    selectedImageStore, detectionResults
  } from '../stores.js';
  import Article from '../article/Article.svelte';
  import LayerDetail from '../detail-view/LayerDetail.svelte';

  import {
    generateYOLOOutput, decodePredictions, nonMaxSuppression,
    getCellBoxes, getCellClassConfidences
  } from '../utils/yolo.js';
  import {
    drawInputImage, drawGrid, drawConfidenceHeatmap, highlightCell,
    drawBoxes, drawNetworkArchitecture, drawOutputTensor, drawForwardPass
  } from './grid-draw.js';

  const { S, B, C, classNames, gridColors } = yoloConfig;

  let overviewComponent;
  let svg, wholeSvg;
  let yoloOutput = null;
  let allBoxes = [], keptBoxes = [], suppressedBoxes = [];
  let selectedRow = -1, selectedCol = -1;
  let selectedCellBoxes = [], selectedCellClasses = [];
  let selectedLayer = null, selectedLayerIdx = -1;
  let imageWidth = 400, imageHeight = 400;
  let viewMode = 'overview';
  let nmsThreshold = 0.5;

  const imageOptions = [
    {file: 'dog.svg', class: 'dog', label: '狗'},
    {file: 'car.svg', class: 'car', label: '汽车'},
    {file: 'person.svg', class: 'person', label: '人'},
    {file: 'street.svg', class: 'street', label: '街景'}
  ];
  let selectedImage = imageOptions[0];

  const handleCellClick = (row, col) => {
    selectedRow = row;
    selectedCol = col;
    selectedGridCell.set({row, col});
    const cell = yoloOutput[row][col];
    selectedCellBoxes = getCellBoxes(cell, row, col);
    selectedCellClasses = getCellClassConfidences(cell);
    highlightCell(svg, row, col, imageWidth, imageHeight);
  };

  const handleCellHover = (row, col) => {
    hoverInfoStore.set({show: true, text: `网格 (${row}, ${col})`});
  };
  const handleCellLeave = () => {
    hoverInfoStore.set({show: false, text: ''});
  };

  function computeDetections(imgClass) {
    yoloOutput = generateYOLOOutput(imgClass);
    yoloStore.set(yoloOutput);
    allBoxes = decodePredictions(yoloOutput);
    keptBoxes = nonMaxSuppression(allBoxes, nmsThreshold);
    suppressedBoxes = allBoxes.filter(b => !keptBoxes.includes(b));
    suppressedBoxes.forEach(b => b.suppressed = true);
    detectionResults.set(keptBoxes);
  }

  const loadImage = async (imgObj) => {
    selectedImage = imgObj;
    selectedImageStore.set(imgObj.file);
    selectedRow = -1; selectedCol = -1;
    computeDetections(imgObj.class);
    redraw();
  };

  const redraw = () => {
    if (!svg || !yoloOutput) return;
    svg.selectAll('*').remove();

    if (viewMode === 'overview') {
      drawInputImage(svg, `PUBLIC_URL/assets/img/${selectedImage.file}`, imageWidth, imageHeight);
      drawConfidenceHeatmap(svg, yoloOutput, imageWidth, imageHeight);
      drawGrid(svg, imageWidth, imageHeight, handleCellClick, handleCellHover, handleCellLeave);
      const allMarked = [...keptBoxes.map(b => ({...b, suppressed: false})),
        ...suppressedBoxes.map(b => ({...b, suppressed: true}))];
      drawBoxes(svg, allMarked, imageWidth, imageHeight);
      if (selectedRow >= 0) highlightCell(svg, selectedRow, selectedCol, imageWidth, imageHeight);
    } else if (viewMode === 'forward') {
      drawForwardPass(svg, yoloOutput, imageWidth + 100, 300);
    } else if (viewMode === 'architecture') {
      drawNetworkArchitecture(svg, imageWidth + 100, handleLayerClick, selectedLayerIdx);
    } else if (viewMode === 'tensor') {
      drawOutputTensor(svg, yoloOutput, imageWidth + 100, 400);
    } else if (viewMode === 'nms') {
      drawInputImage(svg, `PUBLIC_URL/assets/img/${selectedImage.file}`, imageWidth, imageHeight);
      const allMarked = [...keptBoxes.map(b => ({...b, suppressed: false})),
        ...suppressedBoxes.map(b => ({...b, suppressed: true}))];
      drawBoxes(svg, allMarked, imageWidth, imageHeight);
    }
  };

  const handleLayerClick = (idx) => {
    selectedLayerIdx = idx;
    selectedLayer = yoloConfig.networkArchitecture[idx];
    redraw();
  };

  const switchMode = (mode) => {
    viewMode = mode;
    redraw();
  };

  function handleNmsThresholdChange() {
    if (!yoloOutput) return;
    keptBoxes = nonMaxSuppression(allBoxes, nmsThreshold);
    suppressedBoxes = allBoxes.filter(b => !keptBoxes.includes(b));
    suppressedBoxes.forEach(b => b.suppressed = true);
    detectionResults.set(keptBoxes);
    if (viewMode === 'overview' || viewMode === 'nms') redraw();
  }

  onMount(() => {
    wholeSvg = d3.select(overviewComponent).select('#yolo-svg');
    svg = wholeSvg.append('g').attr('class', 'main-svg');
    svgStore.set(svg);
    loadImage(selectedImage);
  });
</script>

<style>
  .overview { padding: 0; width: 100%; display: flex; flex-direction: column; }
  .control-container {
    padding: 12px 24px; display: flex; align-items: center;
    justify-content: space-between; width: 100%; flex-wrap: wrap; gap: 10px;
    background: #fff; border-bottom: 1px solid #eee;
  }
  .left-control { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
  .right-control { display: flex; align-items: center; gap: 8px; }
  .image-container {
    width: 56px; height: 56px; border-radius: 6px;
    display: inline-flex; align-items: center; justify-content: center;
    border: 3px solid #1E1E1E; cursor: pointer;
    transition: all 300ms ease; background: #fff; overflow: hidden; padding: 4px;
  }
  .image-container img { width: 100%; height: 100%; object-fit: contain; }
  .image-container.inactive { border: 3px solid #ddd; opacity: 0.5; }
  .image-container.inactive:hover { opacity: 0.85; border-color: #1E1E1E; }
  .main-area {
    display: flex; flex-direction: row; padding: 20px 24px; gap: 24px; flex-wrap: wrap;
  }
  .vis-area { flex: 1; min-width: 420px; display: flex; flex-direction: column; align-items: center; }
  .info-area { width: 360px; min-width: 300px; }
  svg#yolo-svg {
    width: 100%; max-width: 720px; height: auto; min-height: 380px;
    background: #fafafa; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  }
  .view-tabs { display: flex; gap: 3px; flex-wrap: wrap; }
  .tab-btn {
    padding: 7px 14px; font-size: 13px; border: 1px solid #ddd;
    background: #fff; border-radius: 4px; cursor: pointer;
    transition: all 200ms; font-weight: 500;
  }
  .tab-btn:hover { background: #f0f0f0; }
  .tab-btn.active { background: #3273dc; color: #fff; border-color: #3273dc; }
  .cell-detail-panel {
    background: #fff; border: 1px solid #e0e0e0; border-radius: 8px;
    padding: 16px; font-size: 15px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
  .cell-detail-panel h4 { font-size: 16px; font-weight: 700; margin-bottom: 10px; color: #222; }
  .box-info {
    background: #f5f7fa; border-radius: 6px; padding: 10px 12px;
    margin-bottom: 10px; font-size: 14px; border-left: 3px solid #3273dc;
  }
  .box-info strong { color: #3273dc; font-size: 14px; }
  .class-list { max-height: 350px; overflow-y: auto; }
  .class-row { display: flex; align-items: center; gap: 8px; padding: 3px 0; font-size: 13px; }
  .class-bar-bg { height: 16px; background: #eee; border-radius: 4px; flex: 1; overflow: hidden; }
  .class-bar-fill { height: 100%; border-radius: 4px; transition: width 400ms ease; }
  .class-name { width: 90px; text-align: right; color: #444; font-size: 13px; }
  .class-val { width: 45px; text-align: right; color: #888; font-size: 11px; }
  .stats-panel {
    background: #fff; border: 1px solid #e0e0e0; border-radius: 8px;
    padding: 14px 16px; margin-top: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
  .stats-panel h4 { font-size: 15px; font-weight: 700; margin-bottom: 8px; color: #222; }
  .stat-row { display: flex; justify-content: space-between; font-size: 14px; padding: 5px 0; border-bottom: 1px solid #f0f0f0; }
  .nms-slider { display: flex; align-items: center; gap: 10px; }
  .nms-slider input { flex: 1; }
  .nms-slider span { font-size: 14px; font-weight: 600; min-width: 36px; }
  :global(.hidden) { opacity: 0; pointer-events: none; }
</style>

<div class="overview" bind:this={overviewComponent}>
  <div class="control-container">
    <div class="left-control">
      <span style="font-size:15px;font-weight:600;color:#555;margin-right:6px;">输入图片:</span>
      {#each imageOptions as img}
        <div class="image-container" class:inactive={selectedImage.file !== img.file}
          on:click={() => loadImage(img)} on:keydown={(e) => e.key === 'Enter' && loadImage(img)}
          role="button" tabindex="0" title="{img.class}">
          <img src="PUBLIC_URL/assets/img/{img.file}" alt="{img.class}"/>
        </div>
      {/each}

      {#if viewMode === 'nms'}
        <div class="nms-slider">
          <span style="font-size:13px;font-weight:500;color:#555;">IoU 阈值:</span>
          <input type="range" min="0.1" max="0.9" step="0.05" bind:value={nmsThreshold}
            on:input={handleNmsThresholdChange} style="width:120px;">
          <span>{nmsThreshold.toFixed(2)}</span>
        </div>
      {/if}

      <button class="button is-small is-link is-light"
        style="opacity:{hoverInfoStore.show ? 1 : 0}; transition: opacity 300ms; font-size:13px;">
        <span class="icon is-small"><i class="fas fa-crosshairs"></i></span>
        <span>{hoverInfoStore.text}</span>
      </button>
    </div>

    <div class="right-control">
      <div class="view-tabs">
        <button class="tab-btn" class:active={viewMode === 'overview'}
          on:click={() => switchMode('overview')}>总览</button>
        <button class="tab-btn" class:active={viewMode === 'forward'}
          on:click={() => switchMode('forward')}>前向传播</button>
        <button class="tab-btn" class:active={viewMode === 'architecture'}
          on:click={() => switchMode('architecture')}>网络架构</button>
        <button class="tab-btn" class:active={viewMode === 'tensor'}
          on:click={() => switchMode('tensor')}>输出张量</button>
        <button class="tab-btn" class:active={viewMode === 'nms'}
          on:click={() => switchMode('nms')}>NMS</button>
      </div>
    </div>
  </div>

  <div class="main-area">
    <div class="vis-area">
      <svg id="yolo-svg">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#999"/>
          </marker>
        </defs>
      </svg>

      {#if yoloOutput}
        <div class="stats-panel" style="width:100%;max-width:720px;">
          <h4>检测统计</h4>
          <div class="stat-row">
            <span>检测框总数（NMS 前）:</span>
            <strong>{allBoxes.length}</strong>
          </div>
          <div class="stat-row">
            <span>保留（NMS 后）:</span>
            <strong style="color:#27ae60">{keptBoxes.length}</strong>
          </div>
          <div class="stat-row">
            <span>抑制（重复框）:</span>
            <strong style="color:#e74c3c">{suppressedBoxes.length}</strong>
          </div>
          <div class="stat-row">
            <span>网格:</span>
            <strong>{S}×{S} = {S*S} 个单元格</strong>
          </div>
          <div class="stat-row">
            <span>输出张量:</span>
            <strong>{S}×{S}×{B*5+C} = {S*S*(B*5+C)} 个值</strong>
          </div>
        </div>
      {/if}
    </div>

    <div class="info-area">
      {#if viewMode === 'overview' && selectedRow >= 0 && yoloOutput}
        <div class="cell-detail-panel">
          <h4>网格单元格 ({selectedRow}, {selectedCol})</h4>
          <p style="font-size:14px;color:#555;margin-bottom:10px;">
            <strong style="color:#3273dc">{B} 个边界框</strong> · <strong style="color:#3273dc">{C} 个类别</strong>
          </p>
          {#each selectedCellBoxes as box, i}
            <div class="box-info">
              <strong>框 {i + 1}</strong>
              <span style="color:#555;"> x={box.x.toFixed(3)} y={box.y.toFixed(3)} w={box.w.toFixed(3)} h={box.h.toFixed(3)}</span>
              <br>
              <span style="font-size:13px;">置信度: <strong style="color:{(box.confidence > 0.5 ? '#27ae60' : '#e67e22')};">{box.confidence.toFixed(3)}</strong></span>
            </div>
          {/each}
          <h4 style="margin-top:12px;">类别概率</h4>
          <div class="class-list">
            {#each selectedCellClasses.slice(0, 10) as cls}
              <div class="class-row">
                <span class="class-name">{cls.className}</span>
                <div class="class-bar-bg">
                  <div class="class-bar-fill"
                    style="width: {cls.probability * 100}%; background: {gridColors[cls.classIndex % gridColors.length]};"></div>
                </div>
                <span class="class-val">{(cls.probability * 100).toFixed(1)}%</span>
              </div>
            {/each}
          </div>
        </div>
      {:else if viewMode === 'overview'}
        <div class="cell-detail-panel">
          <h4>👆 点击网格单元格</h4>
          <p style="font-size:14px;color:#777;line-height:1.6;">
            在上方的 {S}×{S} 网格中点击任意单元格，查看其预测详情。<br>
            红色热力图表示每个网格的置信度强度。
          </p>
        </div>
      {:else if viewMode === 'nms'}
        <div class="cell-detail-panel">
          <h4>🧹 非极大值抑制 (NMS)</h4>
          <p style="font-size:14px;color:#555;line-height:1.6;">
            拖动滑块调整 IoU 阈值，观察检测框数量变化。
          </p>
          <div style="margin:12px 0;padding:10px;background:#f5f7fa;border-radius:6px;font-size:13px;">
            <div class="stat-row"><span>当前阈值:</span><strong>{nmsThreshold.toFixed(2)}</strong></div>
            <div class="stat-row"><span>保留框:</span><strong style="color:#27ae60">{keptBoxes.length}</strong></div>
            <div class="stat-row"><span>被抑制:</span><strong style="color:#e74c3c">{suppressedBoxes.length}</strong></div>
          </div>
          <p style="font-size:12px;color:#888;">
            IoU 阈值越低，抑制越多重复框（更严格）；阈值越高，保留越多框（更宽松）。
          </p>
        </div>
      {:else if viewMode === 'forward'}
        <div class="cell-detail-panel">
          <h4>🚀 前向传播</h4>
          <p style="font-size:14px;color:#555;line-height:1.6;">
            YOLO 将检测定义为单一的回归问题——一次前向传播直接从图像像素映射到边界框坐标和类别概率。
          </p>
          <ul style="font-size:13px;color:#666;margin-top:8px;">
            <li>输入: 448×448×3 图像</li>
            <li>24 个卷积层提取特征</li>
            <li>2 个全连接层回归预测</li>
            <li>输出: 7×7×30 张量</li>
          </ul>
        </div>
      {:else if viewMode === 'architecture'}
        <LayerDetail layer={selectedLayer} layerIndex={selectedLayerIdx} />
      {:else if viewMode === 'tensor'}
        <div class="cell-detail-panel">
          <h4>📊 输出张量</h4>
          <p style="font-size:14px;color:#555;line-height:1.6;">
            每个网格单元格（共 49 个）编码 30 个值：
          </p>
          <ul style="font-size:13px;color:#666;margin-top:8px;">
            <li>框 1: x, y, w, h, 置信度 (5 个)</li>
            <li>框 2: x, y, w, h, 置信度 (5 个)</li>
            <li>20 个类别概率</li>
            <li style="margin-top:4px;"><strong>合计: 7×7×30 = 1470 个值</strong></li>
          </ul>
        </div>
      {/if}
    </div>
  </div>
</div>

<Article />
