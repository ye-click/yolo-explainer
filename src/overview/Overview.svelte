<script>
  import { onMount } from 'svelte';
  import { yoloConfig } from '../config.js';
  import {
    yoloStore, svgStore, selectedGridCell, hoverInfoStore,
    selectedImageStore, detectionResults, showNMSStore
  } from '../stores.js';
  import GridCellView from '../detail-view/GridCellView.svelte';
  import NetworkView from '../detail-view/NetworkView.svelte';
  import NMSView from '../detail-view/NMSView.svelte';
  import Article from '../article/Article.svelte';

  import {
    generateYOLOOutput, decodePredictions, nonMaxSuppression,
    getCellBoxes, getCellClassConfidences
  } from '../utils/yolo.js';
  import {
    drawGrid, highlightCell, drawBoxes, drawClassProbabilities,
    drawNetworkArchitecture, drawOutputTensor
  } from './grid-draw.js';

  const { S, B, C, classNames, gridColors } = yoloConfig;

  let overviewComponent;
  let svg, wholeSvg;
  let yoloOutput = null;
  let allBoxes = [];
  let keptBoxes = [];
  let suppressedBoxes = [];
  let selectedRow = -1, selectedCol = -1;
  let selectedCellBoxes = [];
  let selectedCellClasses = [];
  let imageWidth = 350, imageHeight = 350;
  let viewMode = 'overview'; // 'overview', 'grid', 'network', 'nms', 'tensor'
  let showArticle = true;

  const imageOptions = [
    {file: 'dog.jpg', class: 'dog', label: 'Dog'},
    {file: 'car.jpg', class: 'car', label: 'Car'},
    {file: 'person.jpg', class: 'person', label: 'Person'}
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
    hoverInfoStore.set({
      show: true,
      text: `Grid Cell (${row}, ${col})`
    });
  };

  const handleCellLeave = () => {
    hoverInfoStore.set({show: false, text: ''});
  };

  const loadImage = async (imgObj) => {
    selectedImage = imgObj;
    selectedImageStore.set(imgObj.file);

    yoloOutput = generateYOLOOutput(imgObj.class);
    yoloStore.set(yoloOutput);

    allBoxes = decodePredictions(yoloOutput);
    keptBoxes = nonMaxSuppression(allBoxes);
    suppressedBoxes = allBoxes.filter(b => !keptBoxes.includes(b));
    suppressedBoxes.forEach(b => b.suppressed = true);
    detectionResults.set(keptBoxes);

    selectedRow = -1;
    selectedCol = -1;

    redraw();
  };

  const redraw = () => {
    if (!svg || !yoloOutput) return;

    svg.selectAll('*').remove();

    // Draw input image placeholder
    const imgGroup = svg.append('g').attr('class', 'image-group');
    imgGroup.append('rect')
      .attr('class', 'image-bg')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', imageWidth)
      .attr('height', imageHeight)
      .style('fill', '#e8e8e8')
      .style('stroke', '#ccc')
      .style('stroke-width', 1)
      .style('rx', 4);

    imgGroup.append('text')
      .attr('x', imageWidth / 2)
      .attr('y', imageHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('font-size', '16px')
      .style('fill', '#999')
      .style('font-style', 'italic')
      .text(`Input Image ${imageWidth}×${imageWidth}`);

    if (viewMode === 'overview' || viewMode === 'grid') {
      drawGrid(svg, imageWidth, imageHeight, imageWidth, imageHeight,
        handleCellClick, handleCellHover, handleCellLeave);
    }

    if (viewMode === 'nms' || viewMode === 'overview') {
      const allBoxesMarked = [
        ...keptBoxes.map(b => ({...b, suppressed: false})),
        ...suppressedBoxes.map(b => ({...b, suppressed: true}))
      ];
      drawBoxes(svg, allBoxesMarked, imageWidth, imageHeight);
    }

    if (viewMode === 'overview' && selectedRow >= 0) {
      highlightCell(svg, selectedRow, selectedCol, imageWidth, imageHeight);
    }
  };

  const switchMode = (mode) => {
    viewMode = mode;
    redraw();
  };

  onMount(() => {
    wholeSvg = d3.select(overviewComponent).select('#yolo-svg');
    svg = wholeSvg.append('g')
      .attr('class', 'main-svg');
    svgStore.set(svg);

    loadImage(selectedImage);
  });
</script>

<style>
  .overview {
    padding: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
  }
  .control-container {
    padding: 8px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    flex-wrap: wrap;
    gap: 8px;
    background: #fff;
    border-bottom: 1px solid #eee;
  }
  .left-control {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }
  .right-control {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .image-container {
    width: 44px;
    height: 44px;
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 2.5px solid #1E1E1E;
    cursor: pointer;
    transition: border 300ms ease-in-out, opacity 300ms ease-in-out;
    background: #f0f0f0;
    font-size: 10px;
    color: #555;
    text-align: center;
    overflow: hidden;
  }
  .image-container.inactive {
    border: 2.5px solid rgb(220, 220, 220);
    opacity: 0.5;
  }
  .image-container.inactive:hover {
    opacity: 0.8;
    border: 2.5px solid #1E1E1E;
  }
  .main-area {
    display: flex;
    flex-direction: row;
    padding: 15px 20px;
    gap: 20px;
    flex-wrap: wrap;
  }
  .vis-area {
    flex: 1;
    min-width: 380px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .info-area {
    width: 320px;
    min-width: 280px;
  }
  svg#yolo-svg {
    width: 100%;
    max-width: 650px;
    height: auto;
    min-height: 400px;
    background: #fafafa;
    border-radius: 6px;
  }
  .view-tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 10px;
    flex-wrap: wrap;
  }
  .tab-btn {
    padding: 5px 12px;
    font-size: 12px;
    border: 1px solid #ddd;
    background: #fff;
    border-radius: 4px;
    cursor: pointer;
    transition: all 200ms;
  }
  .tab-btn:hover {
    background: #f0f0f0;
  }
  .tab-btn.active {
    background: #3273dc;
    color: #fff;
    border-color: #3273dc;
  }
  .cell-detail-panel {
    background: #fff;
    border: 1px solid #eee;
    border-radius: 6px;
    padding: 12px;
    font-size: 13px;
  }
  .cell-detail-panel h4 {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
    color: #333;
  }
  .box-info {
    background: #f8f8f8;
    border-radius: 4px;
    padding: 8px;
    margin-bottom: 8px;
    font-size: 12px;
  }
  .box-info strong {
    color: #3273dc;
  }
  .class-list {
    max-height: 300px;
    overflow-y: auto;
  }
  .class-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 0;
    font-size: 11px;
  }
  .class-bar-bg {
    height: 14px;
    background: #eee;
    border-radius: 3px;
    flex: 1;
    overflow: hidden;
  }
  .class-bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 300ms;
  }
  .class-name {
    width: 75px;
    text-align: right;
    color: #555;
  }
  .class-val {
    width: 35px;
    text-align: right;
    color: #888;
    font-size: 10px;
  }
  .stats-panel {
    background: #fff;
    border: 1px solid #eee;
    border-radius: 6px;
    padding: 12px;
    margin-top: 10px;
  }
  .stats-panel h4 {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 6px;
  }
  .stat-row {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    padding: 3px 0;
    border-bottom: 1px solid #f5f5f5;
  }
  :global(.hidden) {
    opacity: 0;
    pointer-events: none;
  }
</style>

<div class="overview" bind:this={overviewComponent}>
  <div class="control-container">
    <div class="left-control">
      {#each imageOptions as img}
        <div class="image-container"
          class:inactive={selectedImage.file !== img.file}
          on:click={() => loadImage(img)}
          on:keydown={(e) => e.key === 'Enter' && loadImage(img)}
          role="button"
          tabindex="0"
          title="{img.class}">
          <span>{img.label}</span>
        </div>
      {/each}

      <button class="button is-very-small is-link is-light"
        style="opacity:{hoverInfoStore.show ? 1 : 0}; transition: opacity 300ms;">
        <span class="icon is-small"><i class="fas fa-crosshairs"></i></span>
        <span>{hoverInfoStore.text}</span>
      </button>
    </div>

    <div class="right-control">
      <div class="view-tabs">
        <button class="tab-btn" class:active={viewMode === 'overview'}
          on:click={() => switchMode('overview')}>Overview</button>
        <button class="tab-btn" class:active={viewMode === 'grid'}
          on:click={() => switchMode('grid')}>Grid</button>
        <button class="tab-btn" class:active={viewMode === 'nms'}
          on:click={() => switchMode('nms')}>NMS</button>
      </div>
    </div>
  </div>

  <div class="main-area">
    <div class="vis-area">
      <svg id="yolo-svg"></svg>

      {#if yoloOutput}
        <div class="stats-panel">
          <h4>Detection Stats</h4>
          <div class="stat-row">
            <span>Total boxes (before NMS):</span>
            <strong>{allBoxes.length}</strong>
          </div>
          <div class="stat-row">
            <span>Kept (after NMS):</span>
            <strong style="color:#27ae60">{keptBoxes.length}</strong>
          </div>
          <div class="stat-row">
            <span>Suppressed:</span>
            <strong style="color:#e74c3c">{suppressedBoxes.length}</strong>
          </div>
          <div class="stat-row">
            <span>Grid:</span>
            <strong>{S}×{S} = {S*S} cells</strong>
          </div>
          <div class="stat-row">
            <span>Output tensor:</span>
            <strong>{S}×{S}×{B*5+C} = {S*S*(B*5+C)} values</strong>
          </div>
        </div>
      {/if}
    </div>

    <div class="info-area">
      {#if selectedRow >= 0 && yoloOutput}
        <div class="cell-detail-panel">
          <h4>Grid Cell ({selectedRow}, {selectedCol})</h4>

          <p style="font-size:12px;color:#666;margin-bottom:8px;">
            <strong>{B} bounding box predictions</strong> · <strong>{C} class probabilities</strong>
          </p>

          {#each selectedCellBoxes as box, i}
            <div class="box-info">
              <strong>Box {i + 1}:</strong>
              x={box.x.toFixed(2)}, y={box.y.toFixed(2)},
              w={box.w.toFixed(2)}, h={box.h.toFixed(2)},
              conf={box.confidence.toFixed(2)}
            </div>
          {/each}

          <h4 style="margin-top:10px;">Class Probabilities</h4>
          <div class="class-list">
            {#each selectedCellClasses.slice(0, 10) as cls}
              <div class="class-row">
                <span class="class-name">{cls.className}</span>
                <div class="class-bar-bg">
                  <div class="class-bar-fill"
                    style="width: {cls.probability * 100}%; background: {gridColors[cls.classIndex % gridColors.length]};"></div>
                </div>
                <span class="class-val">{cls.probability.toFixed(3)}</span>
              </div>
            {/each}
          </div>
        </div>
      {:else}
        <div class="cell-detail-panel">
          <h4>Click a Grid Cell</h4>
          <p style="font-size:12px;color:#888;">
            Click on any grid cell in the {S}×{S} grid above to inspect its
            bounding box predictions and class probabilities.
          </p>
        </div>
      {/if}

      <div class="stats-panel" style="margin-top:10px;">
        <h4>How YOLO Works</h4>
        <div style="font-size:12px;color:#555;line-height:1.5;">
          <p>YOLO divides the input image into a <strong>{S}×{S}</strong> grid.</p>
          <p>Each cell predicts <strong>{B}</strong> bounding boxes and
          <strong>{C}</strong> class probabilities.</p>
          <p>Output: <strong>{S}×{S}×{B*5+C}</strong> tensor
          ({S}×{S}×{S*S*(B*5+C)} values).</p>
        </div>
      </div>
    </div>
  </div>
</div>

<Article />
