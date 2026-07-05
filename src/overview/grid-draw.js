import { yoloConfig } from '../config.js';

const { S, classNames, gridColors, B, C } = yoloConfig;

/**
 * Draw the actual input image (SVG) inside the SVG visualization.
 */
export function drawInputImage(svg, imgSrc, imageWidth, imageHeight) {
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
    .style('rx', 6);

  imgGroup.append('image')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', imageWidth)
    .attr('height', imageHeight)
    .attr('href', imgSrc)
    .style('opacity', 0)
    .transition()
    .duration(600)
    .style('opacity', 1);
}

/**
 * Draw the S×S grid overlay with animation.
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

      const rect = cellGroup.append('rect')
        .attr('class', 'cell-bg')
        .attr('x', j * cellW)
        .attr('y', i * cellH)
        .attr('width', cellW)
        .attr('height', cellH)
        .style('fill', 'rgba(0,0,0,0.03)')
        .style('stroke', 'rgba(50, 115, 220, 0.5)')
        .style('stroke-width', 1.5)
        .style('opacity', 0);

      rect.transition()
        .delay((i * S + j) * 20)
        .duration(300)
        .style('opacity', 0.7);

      const label = cellGroup.append('text')
        .attr('class', 'cell-label')
        .attr('x', j * cellW + 4)
        .attr('y', i * cellH + 14)
        .style('font-size', '11px')
        .style('fill', 'rgba(50, 115, 220, 0.7)')
        .style('font-weight', '600')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .text(`(${i},${j})`);

      label.transition()
        .delay((i * S + j) * 20 + 200)
        .duration(200)
        .style('opacity', 0.8);

      // Hover effects
      cellGroup.on('mouseenter', function() {
        d3.select(this).select('.cell-bg')
          .style('fill', 'rgba(255, 200, 0, 0.12)')
          .style('stroke', '#FFD700')
          .style('stroke-width', 2.5);
      });
      cellGroup.on('mouseleave', function() {
        d3.select(this).select('.cell-bg')
          .style('fill', 'rgba(0,0,0,0.03)')
          .style('stroke', 'rgba(50, 115, 220, 0.5)')
          .style('stroke-width', 1.5);
      });

      cellGroup.on('click', () => onCellClick(i, j));
      cellGroup.on('mouseenter', () => onCellHover(i, j));
      cellGroup.on('mouseleave', onCellLeave);
    }
  }

  return gridGroup;
}

/**
 * Animate the grid appearing with a wave effect.
 */
export function animateGridAppear(svg) {
  svg.selectAll('.cell-bg')
    .each(function(d, i) {
      const el = d3.select(this);
      const origOpacity = el.style('opacity');
      el.style('opacity', 0)
        .transition()
        .delay(i * 15)
        .duration(400)
        .style('opacity', origOpacity);
    });
}

/**
 * Highlight a specific grid cell with animation.
 */
export function highlightCell(svg, row, col, imageWidth, imageHeight) {
  svg.selectAll('.cell-bg-highlight').remove();
  svg.selectAll('.cell-border-highlight').remove();

  const cellW = imageWidth / S;
  const cellH = imageHeight / S;

  const bgHighlight = svg.append('rect')
    .attr('class', 'cell-bg-highlight')
    .attr('x', col * cellW)
    .attr('y', row * cellH)
    .attr('width', cellW)
    .attr('height', cellH)
    .style('fill', 'rgba(255, 200, 0, 0.2)')
    .style('pointer-events', 'none')
    .style('opacity', 0);

  bgHighlight.transition()
    .duration(300)
    .style('opacity', 1);

  const borderHighlight = svg.append('rect')
    .attr('class', 'cell-border-highlight')
    .attr('x', col * cellW)
    .attr('y', row * cellH)
    .attr('width', cellW)
    .attr('height', cellH)
    .style('fill', 'none')
    .style('stroke', '#FFD700')
    .style('stroke-width', 4)
    .style('pointer-events', 'none')
    .style('stroke-dasharray', `${cellW + cellH}`)
    .style('stroke-dashoffset', `${cellW + cellH}`);

  borderHighlight.transition()
    .duration(500)
    .style('stroke-dashoffset', 0);

  // Pulse animation
  borderHighlight.append('animate')
    .attr('attributeName', 'stroke-width')
    .attr('values', '4;6;4')
    .attr('dur', '1.5s')
    .attr('repeatCount', 'indefinite');
}

/**
 * Draw bounding boxes with animation and visual effects.
 */
export function drawBoxes(svg, boxes, imageWidth, imageHeight, showSuppressed = false) {
  svg.selectAll('.detection-box').remove();
  svg.selectAll('.detection-box-label').remove();

  const boxGroup = svg.append('g').attr('class', 'detection-box-group');

  boxes.forEach(box => {
    const x = (box.x - box.w / 2) * imageWidth;
    const y = (box.y - box.h / 2) * imageHeight;
    const w = box.w * imageWidth;
    const h = box.h * imageHeight;
    const color = gridColors[box.classId % gridColors.length];
    const isKept = !box.suppressed;
    const opacityVal = isKept ? 0.9 : 0.3;

    if (w <= 0 || h <= 0) return;

    const g = boxGroup.append('g')
      .attr('class', 'detection-box')
      .style('opacity', 0);

    // Glow for kept boxes
    if (isKept) {
      g.append('rect')
        .attr('x', x - 1)
        .attr('y', y - 1)
        .attr('width', w + 2)
        .attr('height', h + 2)
        .style('fill', 'none')
        .style('stroke', color)
        .style('stroke-width', 6)
        .style('opacity', 0.2)
        .style('filter', 'url(#glow)');
    }

    // Dashed border animation
    const boxRect = g.append('rect')
      .attr('x', x)
      .attr('y', y)
      .attr('width', w)
      .attr('height', h)
      .style('fill', isKept ? 'rgba(255,255,255,0.1)' : 'none')
      .style('stroke', color)
      .style('stroke-width', isKept ? 3 : 1.5)
      .style('stroke-dasharray', isKept ? 'none' : '6,4')
      .style('rx', 2);

    if (isKept) {
      const perimeter = 2 * (w + h);
      boxRect.style('stroke-dasharray', `${perimeter}`)
        .style('stroke-dashoffset', perimeter)
        .transition()
        .duration(600)
        .style('stroke-dashoffset', 0);
    }

    // Label
    if (isKept || showSuppressed) {
      const labelBg = g.append('rect')
        .attr('class', 'detection-box-label')
        .attr('x', x)
        .attr('y', y - 20)
        .attr('width', 0)
        .attr('height', 18)
        .style('fill', color)
        .style('rx', 3)
        .style('opacity', 0.9);

      const labelText = `${box.className} ${(box.confidence * 100).toFixed(0)}%`;
      const textEl = g.append('text')
        .attr('class', 'detection-box-label')
        .attr('x', x + 4)
        .attr('y', y - 7)
        .style('font-size', '12px')
        .style('fill', '#fff')
        .style('font-weight', '700')
        .style('opacity', 0)
        .text(labelText);

      // Animate label
      const textWidth = labelText.length * 7 + 8;
      
      if (isKept) {
        labelBg.transition()
          .delay(400)
          .duration(200)
          .attr('width', textWidth);

        textEl.transition()
          .delay(500)
          .duration(200)
          .style('opacity', 1);
      } else {
        labelBg.attr('width', textWidth);
        textEl.style('opacity', 0.6);
      }
    }

    // Cross out suppressed boxes
    if (box.suppressed) {
      g.append('line')
        .attr('x1', x)
        .attr('y1', y)
        .attr('x2', x + w)
        .attr('y2', y + h)
        .style('stroke', '#e74c3c')
        .style('stroke-width', 2)
        .style('opacity', 0.6);
      g.append('line')
        .attr('x1', x + w)
        .attr('y1', y)
        .attr('x2', x)
        .attr('y2', y + h)
        .style('stroke', '#e74c3c')
        .style('stroke-width', 2)
        .style('opacity', 0.6);
    }

    // Fade in the whole group
    g.transition()
      .delay(200)
      .duration(400)
      .style('opacity', opacityVal);
  });
}

/**
 * Animate boxes appearing sequentially.
 */
export function animateBoxesAppear(svg, imageWidth, imageHeight) {
  svg.selectAll('.detection-box')
    .each(function(d, i) {
      d3.select(this)
        .style('opacity', 0)
        .transition()
        .delay(i * 100 + 300)
        .duration(500)
        .style('opacity', 0.9);
    });
}

/**
 * Draw the class probability bars for a cell.
 */
export function drawClassProbabilities(container, cell) {
  container.selectAll('.class-bar, .class-label, .class-bar-label').remove();

  const classProbs = cell.slice(B * 5);
  const barHeight = Math.min(14, 12);
  const maxBarWidth = 140;

  const g = container.append('g')
    .attr('class', 'class-prob-group');

  classProbs.forEach((prob, idx) => {
    const y = idx * (barHeight + 2);
    const barWidth = prob * maxBarWidth;

    g.append('text')
      .attr('class', 'class-label')
      .attr('x', 0)
      .attr('y', y + barHeight - 2)
      .style('font-size', '10px')
      .style('fill', '#555')
      .text(classNames[idx].substring(0, 7));

    const bar = g.append('rect')
      .attr('class', 'class-bar')
      .attr('x', 70)
      .attr('y', y)
      .attr('width', 0)
      .attr('height', barHeight)
      .style('fill', gridColors[idx % gridColors.length])
      .style('opacity', 0.85)
      .style('rx', 3);

    bar.transition()
      .delay(idx * 30)
      .duration(400)
      .attr('width', Math.max(barWidth, 2));

    g.append('text')
      .attr('class', 'class-bar-label')
      .attr('x', 72 + Math.max(barWidth, 2))
      .attr('y', y + barHeight - 2)
      .style('font-size', '9px')
      .style('fill', '#888')
      .text(prob > 0.01 ? (prob * 100).toFixed(1) + '%' : '');
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

    let color = '#4292c6';
    if (layer.type === 'maxpool') color = '#41ab5d';
    else if (layer.type === 'fc') color = '#ef8a34';
    else if (layer.type === 'reshape') color = '#807dba';

    const rect = g.append('rect')
      .attr('x', 0)
      .attr('y', y)
      .attr('width', 0)
      .attr('height', layerHeight)
      .style('fill', color)
      .style('opacity', 0.85)
      .style('rx', 3);

    rect.transition()
      .delay(idx * 30)
      .duration(400)
      .attr('width', Math.min(width * 0.85, 280));

    const text = g.append('text')
      .attr('x', 8)
      .attr('y', y + layerHeight / 2 + 4)
      .style('font-size', '10px')
      .style('fill', '#fff')
      .style('font-weight', '500')
      .style('opacity', 0)
      .text(layer.name);

    text.transition()
      .delay(idx * 30 + 300)
      .duration(200)
      .style('opacity', 1);
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

      const r = g.append('rect')
        .attr('x', x)
        .attr('y', y)
        .attr('width', 0)
        .attr('height', cellSize)
        .style('fill', '#e34a33')
        .style('opacity', opacity)
        .style('stroke', '#999')
        .style('stroke-width', 0.5)
        .style('rx', 2);

      r.transition()
        .delay((i * S + j) * 15)
        .duration(300)
        .attr('width', cellSize);
    }
  }

  g.append('text')
    .attr('x', width / 2)
    .attr('y', S * (cellSize + gap) + 16)
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .style('fill', '#666')
    .style('font-weight', '500')
    .text('7×7×30 Prediction Tensor');

  return g;
}
