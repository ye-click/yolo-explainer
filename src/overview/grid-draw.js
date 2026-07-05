import { yoloConfig } from '../config.js';

const { S, classNames, gridColors, B, C } = yoloConfig;

/**
 * Draw the S×S grid overlay on the input image.
 */
export function drawGrid(svg, width, height, imageWidth, imageHeight, onCellClick, onCellHover, onCellLeave) {
  const cellW = imageWidth / S;
  const cellH = imageHeight / S;

  const gridGroup = svg.append('g').attr('class', 'grid-group');

  for (let i = 0; i < S; i++) {
    for (let j = 0; j < S; j++) {
      const cellGroup = gridGroup.append('g')
        .attr('class', 'grid-cell')
        .attr('data-row', i)
        .attr('data-col', j)
        .style('cursor', 'pointer');

      cellGroup.append('rect')
        .attr('class', 'cell-bg')
        .attr('x', j * cellW)
        .attr('y', i * cellH)
        .attr('width', cellW)
        .attr('height', cellH)
        .style('fill', 'none')
        .style('stroke', '#333')
        .style('stroke-width', 1.5)
        .style('opacity', 0.6);

      cellGroup.append('text')
        .attr('class', 'cell-label')
        .attr('x', j * cellW + cellW / 2)
        .attr('y', i * cellH + cellH / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('font-size', '10px')
        .style('fill', '#fff')
        .style('opacity', 0.7)
        .style('pointer-events', 'none')
        .text(`(${i},${j})`);

      cellGroup.on('click', () => onCellClick(i, j));
      cellGroup.on('mouseenter', () => onCellHover(i, j));
      cellGroup.on('mouseleave', onCellLeave);
    }
  }

  return gridGroup;
}

/**
 * Highlight a specific grid cell.
 */
export function highlightCell(svg, row, col, imageWidth, imageHeight) {
  svg.selectAll('.cell-bg-highlight').remove();
  svg.selectAll('.cell-border-highlight').remove();

  const cellW = imageWidth / S;
  const cellH = imageHeight / S;

  svg.append('rect')
    .attr('class', 'cell-bg-highlight')
    .attr('x', col * cellW)
    .attr('y', row * cellH)
    .attr('width', cellW)
    .attr('height', cellH)
    .style('fill', 'rgba(255, 200, 0, 0.15)')
    .style('pointer-events', 'none');

  svg.append('rect')
    .attr('class', 'cell-border-highlight')
    .attr('x', col * cellW)
    .attr('y', row * cellH)
    .attr('width', cellW)
    .attr('height', cellH)
    .style('fill', 'none')
    .style('stroke', '#FFD700')
    .style('stroke-width', 3)
    .style('pointer-events', 'none');
}

/**
 * Draw bounding boxes on the image.
 */
export function drawBoxes(svg, boxes, imageWidth, imageHeight, showSuppressed = false) {
  // Remove previous boxes
  svg.selectAll('.detection-box').remove();

  const boxGroup = svg.append('g').attr('class', 'detection-box-group');

  boxes.forEach(box => {
    const x = (box.x - box.w / 2) * imageWidth;
    const y = (box.y - box.h / 2) * imageHeight;
    const w = box.w * imageWidth;
    const h = box.h * imageHeight;
    const color = gridColors[box.classId % gridColors.length];
    const opacity = box.suppressed ? 0.3 : 0.8;

    const g = boxGroup.append('g')
      .attr('class', 'detection-box')
      .style('opacity', opacity);

    g.append('rect')
      .attr('x', x)
      .attr('y', y)
      .attr('width', w)
      .attr('height', h)
      .style('fill', 'none')
      .style('stroke', color)
      .style('stroke-width', box.suppressed ? 1 : 2.5)
      .style('stroke-dasharray', box.suppressed ? '5,5' : 'none');

    if (!box.suppressed || showSuppressed) {
      g.append('text')
        .attr('x', x)
        .attr('y', y - 5)
        .style('font-size', '11px')
        .style('fill', color)
        .style('font-weight', 'bold')
        .style('stroke', '#fff')
        .style('stroke-width', '0.3px')
        .text(`${box.className} ${(box.confidence * 100).toFixed(0)}%`);
    }
  });
}

/**
 * Draw the class probability bars for a cell.
 */
export function drawClassProbabilities(container, cell, imageWidth) {
  container.selectAll('.class-bar').remove();
  container.selectAll('.class-label').remove();

  const classProbs = cell.slice(B * 5);
  const barHeight = Math.min(14, (imageWidth * 0.3) / C);

  const g = container.append('g')
    .attr('class', 'class-prob-group');

  classProbs.forEach((prob, idx) => {
    const y = idx * (barHeight + 2);
    const barWidth = prob * 120;

    g.append('text')
      .attr('class', 'class-label')
      .attr('x', 0)
      .attr('y', y + barHeight - 2)
      .style('font-size', '9px')
      .style('fill', '#555')
      .text(classNames[idx].substring(0, 6));

    g.append('rect')
      .attr('class', 'class-bar')
      .attr('x', 65)
      .attr('y', y)
      .attr('width', Math.max(barWidth, 2))
      .attr('height', barHeight)
      .style('fill', gridColors[idx % gridColors.length])
      .style('opacity', 0.8)
      .style('rx', 2);

    g.append('text')
      .attr('class', 'class-bar-label')
      .attr('x', 68 + Math.max(barWidth, 2))
      .attr('y', y + barHeight - 2)
      .style('font-size', '8px')
      .style('fill', '#888')
      .text(prob > 0.01 ? prob.toFixed(2) : '');
  });
}

/**
 * Draw the network architecture as a flow diagram.
 */
export function drawNetworkArchitecture(svg, width) {
  const layers = yoloConfig.networkArchitecture;
  const layerHeight = 24;
  const layerGap = 4;
  const totalHeight = layers.length * (layerHeight + layerGap) + 40;

  const g = svg.append('g')
    .attr('class', 'network-group')
    .attr('transform', `translate(10, 10)`);

  g.append('text')
    .attr('x', 0)
    .attr('y', 16)
    .style('font-size', '14px')
    .style('font-weight', 'bold')
    .style('fill', '#333')
    .text('Network Architecture');

  layers.forEach((layer, idx) => {
    const y = 30 + idx * (layerHeight + layerGap);
    const isConv = layer.type === 'conv';
    const isPool = layer.type === 'maxpool';
    const isFC = layer.type === 'fc';

    let color = '#6baed6';
    if (isPool) color = '#74c476';
    else if (isFC) color = '#fd8d3c';
    else if (layer.type === 'reshape') color = '#9e9ac8';

    g.append('rect')
      .attr('x', 0)
      .attr('y', y)
      .attr('width', Math.min(width * 0.85, 280))
      .attr('height', layerHeight)
      .style('fill', color)
      .style('opacity', 0.8)
      .style('rx', 3);

    g.append('text')
      .attr('x', 8)
      .attr('y', y + layerHeight / 2 + 4)
      .style('font-size', '10px')
      .style('fill', '#fff')
      .style('font-weight', '500')
      .text(layer.name);
  });

  return totalHeight;
}

/**
 * Draw the output tensor as a grid of cells.
 */
export function drawOutputTensor(svg, tensor, width, height) {
  const cellSize = Math.min(width / S - 4, 40);
  const gap = 3;
  const startX = (width - S * (cellSize + gap)) / 2;

  const g = svg.append('g')
    .attr('class', 'output-tensor-group');

  for (let i = 0; i < S; i++) {
    for (let j = 0; j < S; j++) {
      const x = startX + j * (cellSize + gap);
      const y = i * (cellSize + gap);

      const cell = tensor[i][j];
      const boxConf = Math.max(cell[4], cell[9]);
      const opacity = 0.2 + boxConf * 0.8;

      g.append('rect')
        .attr('x', x)
        .attr('y', y)
        .attr('width', cellSize)
        .attr('height', cellSize)
        .style('fill', '#e34a33')
        .style('opacity', opacity)
        .style('stroke', '#999')
        .style('stroke-width', 0.5)
        .style('rx', 2);
    }
  }

  g.append('text')
    .attr('x', width / 2)
    .attr('y', S * (cellSize + gap) + 16)
    .attr('text-anchor', 'middle')
    .style('font-size', '11px')
    .style('fill', '#666')
    .text('7×7×30 Prediction Tensor');

  return g;
}
