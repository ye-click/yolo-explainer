<script>
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';

  export let keptBoxes = [];
  export let suppressedBoxes = [];

  const dispatch = createEventDispatcher();
  let svgEl;
  let imageW = 400, imageH = 400;
  let showSuppressed = false;

  $: {
    if (svgEl) {
      drawNMS();
    }
  }

  function drawNMS() {
    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    // Background
    svg.append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .style('fill', '#f0f0f0')
      .style('rx', 6);

    svg.append('text')
      .attr('x', imageW / 2)
      .attr('y', imageH / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('font-size', '14px')
      .style('fill', '#bbb')
      .style('font-style', 'italic')
      .text('Detection Area');

    // Draw boxes
    const allBoxes = [
      ...keptBoxes.map(b => ({...b, suppressed: false})),
      ...suppressedBoxes.map(b => ({...b, suppressed: true}))
    ];

    allBoxes.forEach(box => {
      if (box.suppressed && !showSuppressed) return;

      const x = (box.x - box.w / 2) * imageW;
      const y = (box.y - box.h / 2) * imageH;
      const w = box.w * imageW;
      const h = box.h * imageH;

      if (w <= 0 || h <= 0) return;

      const color = d3.schemeCategory10[box.classId % 10];
      const opacity = box.suppressed ? 0.3 : 0.85;

      svg.append('rect')
        .attr('x', x)
        .attr('y', y)
        .attr('width', w)
        .attr('height', h)
        .style('fill', 'none')
        .style('stroke', color)
        .style('stroke-width', box.suppressed ? 1.5 : 3)
        .style('stroke-dasharray', box.suppressed ? '6,4' : 'none')
        .style('opacity', opacity);

      if (!box.suppressed) {
        svg.append('text')
          .attr('x', x)
          .attr('y', y - 4)
          .style('font-size', '11px')
          .style('fill', color)
          .style('font-weight', 'bold')
          .style('stroke', '#fff')
          .style('stroke-width', '0.3px')
          .text(`${box.className} ${(box.confidence * 100).toFixed(0)}%`);
      }

      if (box.suppressed && showSuppressed) {
        svg.append('text')
          .attr('x', x + w / 2)
          .attr('y', y + h / 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .style('font-size', '9px')
          .style('fill', '#e74c3c')
          .style('font-weight', 'bold')
          .text('×');
      }
    });
  }

  function close() {
    dispatch('close');
  }
</script>

<div class="nms-view">
  <div class="nms-header">
    <span>Non-Maximum Suppression (NMS)</span>
    <label class="toggle-label">
      <input type="checkbox" bind:checked={showSuppressed}>
      Show suppressed
    </label>
  </div>
  <div class="info-text">
    <span style="color:#27ae60">● {keptBoxes.length} kept</span>
    <span style="color:#e74c3c; margin-left: 12px;">● {suppressedBoxes.length} suppressed</span>
  </div>
  <svg bind:this={svgEl} width={imageW} height={imageH}></svg>
  <div class="nms-explanation">
    <p>NMS removes duplicate detections by suppressing boxes with IoU above a threshold (typically 0.5).<br>
    Only the highest-confidence box per object is kept.</p>
  </div>
</div>

<style>
  .nms-view {
    background: #fff;
    border: 1px solid #eee;
    border-radius: 6px;
    padding: 12px;
  }
  .nms-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    font-size: 13px;
    font-weight: 600;
  }
  .toggle-label {
    font-size: 12px;
    font-weight: normal;
    cursor: pointer;
  }
  .toggle-label input {
    margin-right: 4px;
  }
  svg {
    display: block;
    margin: 0 auto;
    border-radius: 4px;
  }
  .info-text {
    text-align: center;
    margin-bottom: 8px;
    font-size: 12px;
  }
  .nms-explanation {
    margin-top: 8px;
    font-size: 11px;
    color: #777;
    text-align: center;
  }
  .nms-explanation p {
    margin: 0;
  }
</style>
