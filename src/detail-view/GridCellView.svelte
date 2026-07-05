<script>
  import { createEventDispatcher } from 'svelte';
  import { yoloConfig } from '../config.js';
  export let cell = null;
  export let row = -1;
  export let col = -1;

  const { B, C, classNames, gridColors } = yoloConfig;
  const dispatch = createEventDispatcher();

  $: if (cell) {
    parseCell(cell);
  }

  let boxPredictions = [];
  let classProbs = [];

  function parseCell(cellData) {
    boxPredictions = [];
    classProbs = [];

    for (let b = 0; b < B; b++) {
      const offset = b * 5;
      boxPredictions.push({
        x: cellData[offset + 0],
        y: cellData[offset + 1],
        w: cellData[offset + 2],
        h: cellData[offset + 3],
        confidence: cellData[offset + 4]
      });
    }

    classProbs = cellData.slice(B * 5).map((p, i) => ({
      className: classNames[i],
      prob: p,
      idx: i
    }));
    classProbs.sort((a, b) => b.prob - a.prob);
  }

  function close() {
    dispatch('close');
  }
</script>

<div class="cell-panel">
  <div class="panel-header">
    <span>Grid Cell ({row}, {col})</span>
    <button class="close-btn" on:click={close}>&times;</button>
  </div>

  <div class="panel-body">
    <h4>Bounding Box Predictions</h4>
    {#each boxPredictions as box, i}
      <div class="box-item">
        <span class="box-label">Box {i + 1}</span>
        <div class="box-detail">
          <span>x: <strong>{box.x.toFixed(3)}</strong></span>
          <span>y: <strong>{box.y.toFixed(3)}</strong></span>
          <span>w: <strong>{box.w.toFixed(3)}</strong></span>
          <span>h: <strong>{box.h.toFixed(3)}</strong></span>
          <span>conf: <strong>{box.confidence.toFixed(3)}</strong></span>
        </div>
      </div>
    {/each}

    <h4>Class Probabilities (Top 10)</h4>
    <div class="class-list">
      {#each classProbs.slice(0, 10) as cls}
        <div class="class-row">
          <span class="cn">{cls.className}</span>
          <div class="bar-bg">
            <div class="bar-fill" style="width: {cls.prob * 100}%; background: {gridColors[cls.idx % gridColors.length]};"></div>
          </div>
          <span class="cv">{cls.prob.toFixed(3)}</span>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .cell-panel {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 6px;
    overflow: hidden;
  }
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: #3273dc;
    color: #fff;
    font-weight: 600;
    font-size: 13px;
  }
  .close-btn {
    background: none;
    border: none;
    color: #fff;
    font-size: 18px;
    cursor: pointer;
    padding: 0 4px;
  }
  .panel-body {
    padding: 10px 12px;
  }
  h4 {
    font-size: 12px;
    font-weight: 600;
    color: #555;
    margin: 8px 0 6px;
  }
  .box-item {
    background: #f5f5f5;
    border-radius: 4px;
    padding: 6px 8px;
    margin-bottom: 6px;
  }
  .box-label {
    font-weight: 600;
    font-size: 11px;
    color: #3273dc;
    display: block;
    margin-bottom: 3px;
  }
  .box-detail {
    display: flex;
    gap: 8px;
    font-size: 11px;
    color: #555;
    flex-wrap: wrap;
  }
  .class-list {
    max-height: 240px;
    overflow-y: auto;
  }
  .class-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 0;
    font-size: 11px;
  }
  .cn {
    width: 70px;
    text-align: right;
    color: #555;
  }
  .bar-bg {
    height: 12px;
    background: #eee;
    border-radius: 3px;
    flex: 1;
    overflow: hidden;
  }
  .bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 300ms;
  }
  .cv {
    width: 40px;
    text-align: right;
    color: #888;
    font-size: 10px;
  }
</style>
