<script>
  import { onMount } from 'svelte';
  import { yoloConfig } from '../config.js';

  const { networkArchitecture } = yoloConfig;
  let svgEl;
  let svgWidth = 700;

  onMount(() => {
    drawNetwork();
  });

  function drawNetwork() {
    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const layerW = 60;
    const layerH = 22;
    const gap = 6;
    const startX = 20;
    const totalHeight = networkArchitecture.length * (layerH + gap) + 60;

    svg.attr('height', totalHeight);

    const defs = svg.append('defs');
    defs.append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .style('fill', '#999');

    const g = svg.append('g').attr('transform', 'translate(10, 10)');

    g.append('text')
      .attr('x', 0)
      .attr('y', 18)
      .style('font-size', '15px')
      .style('font-weight', 'bold')
      .style('fill', '#333')
      .text('YOLO Network Architecture');

    let layerColors = {
      'conv': '#4292c6',
      'maxpool': '#41ab5d',
      'fc': '#ef8a34',
      'reshape': '#807dba'
    };

    networkArchitecture.forEach((layer, idx) => {
      const y = 40 + idx * (layerH + gap);
      const color = layerColors[layer.type] || '#999';

      // Connection line (except first)
      if (idx > 0) {
        const prevY = 40 + (idx - 1) * (layerH + gap) + layerH;
        g.append('line')
          .attr('x1', startX + layerW / 2)
          .attr('y1', prevY)
          .attr('x2', startX + layerW / 2)
          .attr('y2', y)
          .style('stroke', '#bbb')
          .style('stroke-width', 1.5)
          .attr('marker-end', 'url(#arrow)');
      }

      // Layer box
      const boxWidth = layer.type === 'fc' ? layerW + 40 : layerW;
      const boxX = layer.type === 'fc' ? startX - 20 : startX;

      g.append('rect')
        .attr('x', boxX)
        .attr('y', y)
        .attr('width', boxWidth)
        .attr('height', layerH)
        .style('fill', color)
        .style('opacity', 0.85)
        .style('rx', 3)
        .style('stroke', '#fff')
        .style('stroke-width', 0.5);

      g.append('text')
        .attr('x', boxX + boxWidth / 2)
        .attr('y', y + layerH / 2 + 4)
        .attr('text-anchor', 'middle')
        .style('font-size', '9px')
        .style('fill', '#fff')
        .style('font-weight', '500')
        .text(layer.name);
    });

    // Legend
    const legendY = totalHeight - 30;
    const legendItems = [
      {label: 'Conv', color: '#4292c6'},
      {label: 'Pool', color: '#41ab5d'},
      {label: 'FC', color: '#ef8a34'},
      {label: 'Reshape', color: '#807dba'}
    ];
    legendItems.forEach((item, i) => {
      const lx = i * 100 + 20;
      g.append('rect')
        .attr('x', lx)
        .attr('y', legendY)
        .attr('width', 12)
        .attr('height', 12)
        .style('fill', item.color)
        .style('rx', 2);
      g.append('text')
        .attr('x', lx + 18)
        .attr('y', legendY + 10)
        .style('font-size', '11px')
        .style('fill', '#555')
        .text(item.label);
    });
  }
</script>

<div class="network-view">
  <svg bind:this={svgEl} width="100%"></svg>
</div>

<style>
  .network-view {
    background: #fff;
    border: 1px solid #eee;
    border-radius: 6px;
    padding: 10px;
    overflow-x: auto;
  }
  svg {
    display: block;
  }
</style>
