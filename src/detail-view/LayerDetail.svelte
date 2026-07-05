<script>
  import { onMount } from 'svelte';
  import { yoloConfig } from '../config.js';

  export let layer = null;
  export let layerIndex = -1;

  $: if (layer) drawLayerOp();

  let svgEl;

  function drawLayerOp() {
    if (!svgEl || !layer) return;
    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const W = svgEl.clientWidth || 340;
    const H = 160;

    if (layer.type === 'conv') {
      drawConvOp(svg, W, H);
    } else if (layer.type === 'maxpool') {
      drawPoolOp(svg, W, H);
    } else if (layer.type === 'fc') {
      drawFcOp(svg, W, H);
    } else if (layer.type === 'reshape') {
      drawReshapeOp(svg, W, H);
    }
  }

  function drawConvOp(svg, W, H) {
    const cx = W / 2, cy = H / 2;
    const g = svg.append('g').attr('transform', `translate(${cx}, ${cy})`);

    // Input feature map
    g.append('rect').attr('x', -90).attr('y', -30).attr('width', 60).attr('height', 60)
      .style('fill', '#e3f2fd').style('stroke', '#4292c6').style('stroke-width', 1.5).style('rx', 4);
    g.append('text').attr('x', -60).attr('y', 0).attr('text-anchor', 'middle')
      .style('font-size', '11px').style('fill', '#555').text('输入');

    // Kernel
    g.append('rect').attr('x', -22).attr('y', -12).attr('width', 24).attr('height', 24)
      .style('fill', '#ffcc80').style('stroke', '#ef8a34').style('stroke-width', 1.5).style('rx', 2);
    g.append('text').attr('x', -10).attr('y', 4).attr('text-anchor', 'middle')
      .style('font-size', '9px').style('fill', '#555').text(`${layer.kernel}×${layer.kernel}`);

    // Output feature map
    g.append('rect').attr('x', 32).attr('y', -30).attr('width', 60).attr('height', 60)
      .style('fill', '#e8f5e9').style('stroke', '#41ab5d').style('stroke-width', 1.5).style('rx', 4);
    g.append('text').attr('x', 62).attr('y', 0).attr('text-anchor', 'middle')
      .style('font-size', '11px').style('fill', '#555').text('输出');

    // Arrow
    g.append('line').attr('x1', -28).attr('y1', 0).attr('x2', -3).attr('y2', 0)
      .style('stroke', '#999').style('stroke-width', 1.5).attr('marker-end', 'url(#arrow)');
    g.append('line').attr('x1', 4).attr('y1', 0).attr('x2', 28).attr('y2', 0)
      .style('stroke', '#999').style('stroke-width', 1.5).attr('marker-end', 'url(#arrow)');

    // Labels below
    const inputShape = layer.inputShape || [];
    const outputShape = layer.outputShape || [];
    g.append('text').attr('x', -60).attr('y', 50).attr('text-anchor', 'middle')
      .style('font-size', '10px').style('fill', '#888')
      .text(`${inputShape[0]}×${inputShape[1]}×${inputShape[2]}`);
    g.append('text').attr('x', 62).attr('y', 50).attr('text-anchor', 'middle')
      .style('font-size', '10px').style('fill', '#888')
      .text(`${outputShape[0]}×${outputShape[1]}×${outputShape[2]}`);
  }

  function drawPoolOp(svg, W, H) {
    const cx = W / 2, cy = H / 2;
    const g = svg.append('g').attr('transform', `translate(${cx}, ${cy})`);

    // Input grid
    const gridSize = 4, cellSize = 12;
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const val = Math.floor(Math.random() * 9) + 1;
        g.append('rect').attr('x', -50 + j * cellSize).attr('y', -24 + i * cellSize)
          .attr('width', cellSize).attr('height', cellSize)
          .style('fill', `rgba(66, 146, 198, ${val / 10})`).style('stroke', '#ccc').style('stroke-width', 0.5);
        g.append('text').attr('x', -50 + j * cellSize + cellSize / 2).attr('y', -24 + i * cellSize + cellSize / 2 + 1)
          .attr('text-anchor', 'middle').style('font-size', '7px').style('fill', '#333')
          .text(val);
      }
    }

    // Window highlight
    g.append('rect').attr('x', -50).attr('y', -24)
      .attr('width', cellSize * 2).attr('height', cellSize * 2)
      .style('fill', 'none').style('stroke', '#e74c3c').style('stroke-width', 2);

    // Arrow
    g.append('text').attr('x', 2).attr('y', 4)
      .style('font-size', '20px').style('fill', '#999').text('→');

    // Output
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        const val = (i === 0 && j === 0) ? 'max' : '—';
        g.append('text').attr('x', 24 + j * 24).attr('y', -4 + i * 20)
          .style('font-size', '11px').style('fill', '#555').style('font-weight', i === 0 && j === 0 ? '700' : '400')
          .text(val);
      }
    }

    g.append('text').attr('x', 0).attr('y', 50).attr('text-anchor', 'middle')
      .style('font-size', '11px').style('fill', '#888')
      .text(`${layer.kernel}×${layer.kernel} 窗口，步长 ${layer.stride}，取最大值`);
  }

  function drawFcOp(svg, W, H) {
    const g = svg.append('g').attr('transform', `translate(${W / 2}, ${H / 2})`);

    // Input dots
    for (let i = 0; i < 6; i++) {
      g.append('circle').attr('cx', -60).attr('cy', -24 + i * 10)
        .attr('r', 3).style('fill', '#4292c6').style('opacity', 0.7);
    }
    g.append('text').attr('x', -60).attr('y', 38).attr('text-anchor', 'middle')
      .style('font-size', '10px').style('fill', '#888').text('输入');

    // Weights lines
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 4; j++) {
        g.append('line').attr('x1', -54).attr('y1', -24 + i * 10)
          .attr('x2', 30).attr('y2', -14 + j * 10)
          .style('stroke', '#ccc').style('stroke-width', 0.4).style('opacity', 0.5);
      }
    }

    // Output dots
    for (let j = 0; j < 4; j++) {
      g.append('circle').attr('cx', 36).attr('cy', -14 + j * 10)
        .attr('r', 3).style('fill', '#ef8a34').style('opacity', 0.7);
    }
    g.append('text').attr('x', 36).attr('y', 38).attr('text-anchor', 'middle')
      .style('font-size', '10px').style('fill', '#888').text('输出');

    g.append('text').attr('x', 0).attr('y', -44).attr('text-anchor', 'middle')
      .style('font-size', '11px').style('fill', '#888')
      .text('全连接：每个输出神经元连接到所有输入');
  }

  function drawReshapeOp(svg, W, H) {
    const g = svg.append('g').attr('transform', `translate(${W / 2}, ${H / 2})`);

    g.append('rect').attr('x', -70).attr('y', -30).attr('width', 50).attr('height', 60)
      .style('fill', '#e3f2fd').style('stroke', '#807dba').style('stroke-width', 1.5).style('rx', 4);
    g.append('text').attr('x', -45).attr('y', 0).attr('text-anchor', 'middle')
      .style('font-size', '11px').style('fill', '#555').text('1470');

    g.append('text').attr('x', 0).attr('y', 4).style('font-size', '20px').style('fill', '#999').text('→');

    g.append('rect').attr('x', 18).attr('y', -30).attr('width', 60).attr('height', 60)
      .style('fill', '#f3e5f5').style('stroke', '#807dba').style('stroke-width', 1.5).style('rx', 4);
    g.append('text').attr('x', 48).attr('y', -4).attr('text-anchor', 'middle')
      .style('font-size', '9px').style('fill', '#555').text('7×7×30');
    g.append('text').attr('x', 48).attr('y', 8).attr('text-anchor', 'middle')
      .style('font-size', '9px').style('fill', '#888').text('(S×S×(B·5+C))');

    g.append('text').attr('x', 0).attr('y', 50).attr('text-anchor', 'middle')
      .style('font-size', '11px').style('fill', '#888')
      .text('一维向量 → 三维张量，形状不变');
  }
</script>

<div class="layer-detail">
  {#if layer}
    <h4 class="layer-name">
      <span class="layer-idx">#{layerIndex}</span>
      {layer.name}
    </h4>

    <div class="layer-meta">
      <div class="meta-row">
        <span class="meta-label">类型</span>
        <span class="meta-value">
          {layer.type === 'conv' ? '卷积层' :
           layer.type === 'maxpool' ? '池化层' :
           layer.type === 'fc' ? '全连接层' :
           layer.type === 'reshape' ? '重塑层' : layer.type}
        </span>
      </div>
      <div class="meta-row">
        <span class="meta-label">输入形状</span>
        <span class="meta-value">
          {layer.inputShape ? `${layer.inputShape[0]}×${layer.inputShape[1]}×${layer.inputShape[2]}` :
           layer.type === 'fc' && layerIndex > 0 ? `7×7×1024` : '-'}
        </span>
      </div>
      <div class="meta-row">
        <span class="meta-label">输出形状</span>
        <span class="meta-value">
          {layer.outputShape ? `${layer.outputShape[0]}×${layer.outputShape[1]}×${layer.outputShape[2]}` :
           layer.inputShape && layer.inputShape.length === 1 ? `${layer.inputShape[0]}` : '-'}
        </span>
      </div>
      {#if layer.type === 'conv'}
        <div class="meta-row">
          <span class="meta-label">卷积核</span>
          <span class="meta-value">{layer.kernel}×{layer.kernel}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">步长</span>
          <span class="meta-value">{layer.stride}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">填充</span>
          <span class="meta-value">{layer.padding}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">输出通道</span>
          <span class="meta-value">{layer.filters}</span>
        </div>
      {:else if layer.type === 'maxpool'}
        <div class="meta-row">
          <span class="meta-label">池化窗口</span>
          <span class="meta-value">{layer.kernel}×{layer.kernel}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">步长</span>
          <span class="meta-value">{layer.stride}</span>
        </div>
      {:else if layer.type === 'fc'}
        <div class="meta-row">
          <span class="meta-label">神经元</span>
          <span class="meta-value">{layer.size}</span>
        </div>
      {:else if layer.type === 'reshape'}
        <div class="meta-row">
          <span class="meta-label">目标形状</span>
          <span class="meta-value">{layer.shape.join('×')}</span>
        </div>
      {/if}
      <div class="meta-row">
        <span class="meta-label">参数量</span>
        <span class="meta-value">
          {layer.params ? `${(layer.params / 1000).toFixed(1)}K` : '0'}
        </span>
      </div>
      <div class="meta-row">
        <span class="meta-label">描述</span>
        <span class="meta-value desc">{layer.desc || '-'}</span>
      </div>
    </div>

    <div class="op-viz">
      <svg bind:this={svgEl} width="100%" height="160"></svg>
    </div>
  {:else}
    <div class="placeholder">
      <p>👆 点击上方的网络层查看详情</p>
    </div>
  {/if}
</div>

<style>
  .layer-detail {
    background: #fff; border: 1px solid #e0e0e0; border-radius: 8px;
    padding: 16px; font-size: 15px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
  .layer-name {
    font-size: 17px; font-weight: 700; margin-bottom: 12px; color: #222;
    display: flex; align-items: center; gap: 8px;
  }
  .layer-idx {
    display: inline-flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 50%;
    background: #3273dc; color: #fff; font-size: 13px;
  }
  .layer-meta { margin-bottom: 12px; }
  .meta-row {
    display: flex; justify-content: space-between; align-items: baseline;
    padding: 4px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px;
  }
  .meta-label { color: #888; min-width: 80px; }
  .meta-value { color: #333; font-weight: 500; text-align: right; }
  .meta-value.desc { font-weight: 400; color: #666; max-width: 220px; }
  .op-viz {
    margin-top: 8px; background: #fafafa; border-radius: 6px;
    border: 1px solid #eee; overflow: hidden;
  }
  .op-viz svg { display: block; }
  .placeholder {
    padding: 40px 20px; text-align: center; color: #999; font-size: 15px;
  }
</style>
