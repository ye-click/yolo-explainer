import { yoloConfig } from '../config.js';

const { S, classNames, gridColors, B, C } = yoloConfig;

export function drawInputImage(svg, imgSrc, imageWidth, imageHeight) {
  const imgGroup = svg.append('g').attr('class', 'image-group');
  imgGroup.append('rect')
    .attr('class', 'image-bg')
    .attr('x', 0).attr('y', 0)
    .attr('width', imageWidth).attr('height', imageHeight)
    .style('fill', '#e8e8e8').style('stroke', '#ccc')
    .style('stroke-width', 1).style('rx', 6);

  imgGroup.append('image')
    .attr('x', 0).attr('y', 0)
    .attr('width', imageWidth).attr('height', imageHeight)
    .attr('href', imgSrc)
    .style('opacity', 0)
    .transition().duration(600).style('opacity', 1);
}

export function drawGrid(svg, imageWidth, imageHeight, onCellClick, onCellHover, onCellLeave) {
  const cellW = imageWidth / S, cellH = imageHeight / S;
  svg.selectAll('.grid-group').remove();
  const gridGroup = svg.append('g').attr('class', 'grid-group');

  for (let i = 0; i < S; i++) {
    for (let j = 0; j < S; j++) {
      const g = gridGroup.append('g')
        .attr('class', 'grid-cell').attr('data-row', i).attr('data-col', j)
        .style('cursor', 'pointer');

      g.append('rect').attr('class', 'cell-bg')
        .attr('x', j * cellW).attr('y', i * cellH)
        .attr('width', cellW).attr('height', cellH)
        .style('fill', 'rgba(0,0,0,0.02)')
        .style('stroke', 'rgba(50,115,220,0.5)').style('stroke-width', 1.5)
        .style('opacity', 0)
        .transition().delay((i * S + j) * 18).duration(300).style('opacity', 0.7);

      g.append('text').attr('class', 'cell-label')
        .attr('x', j * cellW + 4).attr('y', i * cellH + 14)
        .style('font-size', '11px').style('fill', 'rgba(50,115,220,0.7)')
        .style('font-weight', '600').style('pointer-events', 'none')
        .style('opacity', 0).text(`(${i},${j})`)
        .transition().delay((i * S + j) * 18 + 200).duration(200).style('opacity', 0.8);

      g.on('mouseenter', function() {
        d3.select(this).select('.cell-bg')
          .style('fill', 'rgba(255,200,0,0.12)').style('stroke', '#FFD700').style('stroke-width', 2.5);
      });
      g.on('mouseleave', function() {
        d3.select(this).select('.cell-bg')
          .style('fill', 'rgba(0,0,0,0.02)').style('stroke', 'rgba(50,115,220,0.5)').style('stroke-width', 1.5);
      });
      g.on('click', () => onCellClick(i, j));
      g.on('mouseenter', () => onCellHover(i, j));
      g.on('mouseleave', onCellLeave);
    }
  }
  return gridGroup;
}

export function drawConfidenceHeatmap(svg, tensor, imageWidth, imageHeight) {
  svg.selectAll('.heatmap-cell').remove();
  const cellW = imageWidth / S, cellH = imageHeight / S;
  const heatGroup = svg.insert('g', '.grid-group').attr('class', 'heatmap-group');

  for (let i = 0; i < S; i++) {
    for (let j = 0; j < S; j++) {
      const cell = tensor[i][j];
      const maxConf = Math.max(cell[4], cell[9]);
      const intensity = Math.min(maxConf * 1.5, 1);

      const r = heatGroup.append('rect').attr('class', 'heatmap-cell')
        .attr('x', j * cellW).attr('y', i * cellH)
        .attr('width', cellW).attr('height', cellH)
        .style('fill', '#e34a33').style('opacity', 0)
        .style('pointer-events', 'none');

      r.transition().delay((i * S + j) * 15).duration(400)
        .style('opacity', intensity * 0.35);
    }
  }
}

export function highlightCell(svg, row, col, imageWidth, imageHeight) {
  svg.selectAll('.cell-highlight-group').remove();
  const cellW = imageWidth / S, cellH = imageHeight / S;
  const g = svg.append('g').attr('class', 'cell-highlight-group');

  const bg = g.append('rect').attr('class', 'cell-bg-highlight')
    .attr('x', col * cellW).attr('y', row * cellH)
    .attr('width', cellW).attr('height', cellH)
    .style('fill', 'rgba(255,200,0,0.2)').style('pointer-events', 'none')
    .style('opacity', 0);
  bg.transition().duration(300).style('opacity', 1);

  const border = g.append('rect').attr('class', 'cell-border-highlight')
    .attr('x', col * cellW).attr('y', row * cellH)
    .attr('width', cellW).attr('height', cellH)
    .style('fill', 'none').style('stroke', '#FFD700').style('stroke-width', 4)
    .style('pointer-events', 'none')
    .style('stroke-dasharray', `${2*(cellW+cellH)}`)
    .style('stroke-dashoffset', `${2*(cellW+cellH)}`);
  border.transition().duration(500).style('stroke-dashoffset', 0);

  border.append('animate')
    .attr('attributeName', 'stroke-width')
    .attr('values', '4;6;4').attr('dur', '1.5s').attr('repeatCount', 'indefinite');
}

export function drawBoxes(svg, boxes, imageWidth, imageHeight) {
  svg.selectAll('.detection-group').remove();
  const group = svg.append('g').attr('class', 'detection-group');

  boxes.forEach((box, idx) => {
    const x = (box.x - box.w / 2) * imageWidth;
    const y = (box.y - box.h / 2) * imageHeight;
    const w = box.w * imageWidth, h = box.h * imageHeight;
    if (w <= 1 || h <= 1) return;
    const color = gridColors[box.classId % gridColors.length];
    const isKept = !box.suppressed;

    const g = group.append('g').attr('class', 'detection-box')
      .style('opacity', 0);

    // Glow for kept
    if (isKept) {
      g.append('rect').attr('x', x - 1).attr('y', y - 1)
        .attr('width', w + 2).attr('height', h + 2)
        .style('fill', 'none').style('stroke', color)
        .style('stroke-width', 6).style('opacity', 0.15);
    }

    const boxRect = g.append('rect')
      .attr('x', x).attr('y', y).attr('width', w).attr('height', h)
      .style('fill', isKept ? 'rgba(255,255,255,0.08)' : 'none')
      .style('stroke', color)
      .style('stroke-width', isKept ? 3 : 1.5)
      .style('stroke-dasharray', isKept ? 'none' : '5,4');

    if (isKept) {
      const p = 2 * (w + h);
      boxRect.style('stroke-dasharray', `${p}`).style('stroke-dashoffset', p)
        .transition().duration(500).style('stroke-dashoffset', 0);
    }

    // Label
    const labelText = `${box.className} ${(box.confidence * 100).toFixed(0)}%`;
    const tw = labelText.length * 7 + 8;
    const labelBg = g.append('rect')
      .attr('x', x).attr('y', y - 20)
      .attr('width', isKept ? 0 : tw).attr('height', 18)
      .style('fill', color).style('rx', 3).style('opacity', 0.9);
    g.append('text')
      .attr('x', x + 4).attr('y', y - 7)
      .style('font-size', '12px').style('fill', '#fff')
      .style('font-weight', '700').style('opacity', isKept ? 0 : 0.6)
      .text(labelText);

    if (isKept) {
      labelBg.transition().delay(350).duration(200).attr('width', tw);
      g.select('text').transition().delay(450).duration(200).style('opacity', 1);
    }

    // Suppression cross
    if (box.suppressed) {
      g.append('line').attr('x1', x).attr('y1', y).attr('x2', x + w).attr('y2', y + h)
        .style('stroke', '#e74c3c').style('stroke-width', 2).style('opacity', 0.5);
      g.append('line').attr('x1', x + w).attr('y1', y).attr('x2', x).attr('y2', y + h)
        .style('stroke', '#e74c3c').style('stroke-width', 2).style('opacity', 0.5);
    }

    g.transition().delay(idx * 80 + 200).duration(400)
      .style('opacity', isKept ? 0.95 : 0.35);
  });
}

export function drawNetworkArchitecture(svg, width, onLayerClick, selectedIdx = -1) {
  svg.selectAll('.arch-group').remove();
  const layers = yoloConfig.networkArchitecture;
  const lh = 22, gap = 5;
  const g = svg.append('g').attr('class', 'arch-group').attr('transform', 'translate(15, 15)');

  g.append('text').attr('x', width / 2 - 15).attr('y', 0)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px').style('font-weight', '700').style('fill', '#333')
    .text('YOLO 网络架构 (24 Conv + 2 FC)');

  const legend = [
    {label: '卷积', color: '#4292c6'}, {label: '池化', color: '#41ab5d'},
    {label: '全连接', color: '#ef8a34'}, {label: '重塑', color: '#807dba'}
  ];
  legend.forEach((item, i) => {
    const lx = i * 110 + 20;
    g.append('rect').attr('x', lx).attr('y', 12).attr('width', 14).attr('height', 14)
      .style('fill', item.color).style('rx', 2).style('opacity', 0.85);
    g.append('text').attr('x', lx + 20).attr('y', 23)
      .style('font-size', '12px').style('fill', '#555').text(item.label);
  });

  layers.forEach((layer, idx) => {
    const y = 38 + idx * (lh + gap);
    let color = '#4292c6';
    if (layer.type === 'maxpool') color = '#41ab5d';
    else if (layer.type === 'fc') color = '#ef8a34';
    else if (layer.type === 'reshape') color = '#807dba';

    const bw = layer.type === 'fc' ? Math.min(width * 0.5, 200) : Math.min(width * 0.7, 260);

    if (idx > 0) {
      const py = 38 + (idx - 1) * (lh + gap) + lh;
      g.append('line').attr('x1', '10').attr('y1', py).attr('x2', '10').attr('y2', y)
        .style('stroke', '#ccc').style('stroke-width', 1);
    }

    const lg = g.append('g').attr('class', 'arch-layer')
      .style('cursor', 'pointer')
      .on('click', () => onLayerClick && onLayerClick(idx));

    lg.append('rect').attr('x', 0).attr('y', y)
      .attr('width', 0).attr('height', lh)
      .style('fill', color).style('opacity', 0.85).style('rx', 3)
      .transition().delay(idx * 20).duration(300).attr('width', bw);

    lg.append('text').attr('x', 8).attr('y', y + lh / 2 + 4)
      .style('font-size', '10px').style('fill', '#fff').style('font-weight', '500')
      .style('opacity', 0).text(layer.name)
      .transition().delay(idx * 20 + 250).duration(200).style('opacity', 1);

    // Selection highlight
    if (idx === selectedIdx) {
      lg.append('rect').attr('x', -2).attr('y', y - 2)
        .attr('width', bw + 4).attr('height', lh + 4)
        .style('fill', 'none').style('stroke', '#FFD700').style('stroke-width', 3)
        .style('rx', 4).style('stroke-dasharray', '6,3')
        .style('pointer-events', 'none');
    }
  });
}

export function drawOutputTensor(svg, tensor, width, height) {
  svg.selectAll('.tensor-group').remove();
  const cellSize = Math.min(width / S - 4, 44);
  const gap = 4;
  const startX = (width - S * (cellSize + gap)) / 2;
  const g = svg.append('g').attr('class', 'tensor-group');

  // Title
  g.append('text').attr('x', width / 2).attr('y', 18)
    .attr('text-anchor', 'middle')
    .style('font-size', '15px').style('font-weight', '700').style('fill', '#333')
    .text('7×7×30 输出张量');

  // Subtitle
  g.append('text').attr('x', width / 2).attr('y', 36)
    .attr('text-anchor', 'middle')
    .style('font-size', '12px').style('fill', '#888')
    .text('每个单元格包含 2×5（边界框）+ 20（类别概率）个值');

  for (let i = 0; i < S; i++) {
    for (let j = 0; j < S; j++) {
      const x = startX + j * (cellSize + gap);
      const y = 48 + i * (cellSize + gap);
      const cell = tensor[i][j];
      const boxConf = Math.max(cell[4], cell[9]);
      const opacity = 0.15 + boxConf * 0.85;
      const classProbs = cell.slice(B * 5);
      const maxClassIdx = classProbs.indexOf(Math.max(...classProbs));

      const r = g.append('rect').attr('x', x).attr('y', y)
        .attr('width', 0).attr('height', cellSize)
        .style('fill', gridColors[maxClassIdx % gridColors.length])
        .style('opacity', opacity)
        .style('stroke', '#ccc').style('stroke-width', 0.5).style('rx', 2);

      r.transition().delay((i * S + j) * 12).duration(300).attr('width', cellSize);

      g.append('text').attr('x', x + cellSize / 2).attr('y', y + cellSize / 2 + 3)
        .attr('text-anchor', 'middle')
        .style('font-size', '9px').style('fill', '#333').style('font-weight', '600')
        .style('opacity', boxConf > 0.3 ? 0.9 : 0.3)
        .text(`(${i},${j})`);
    }
  }

  // Legend
  const legendY = 48 + S * (cellSize + gap) + 10;
  g.append('text').attr('x', width / 2).attr('y', legendY)
    .attr('text-anchor', 'middle')
    .style('font-size', '11px').style('fill', '#999')
    .text('单元格颜色 = 最高置信度类别; 不透明度 = 置信度强度');
}

export function drawForwardPass(svg, tensor, width, height) {
  svg.selectAll('.forward-group').remove();
  const g = svg.append('g').attr('class', 'forward-group')
    .attr('transform', `translate(${width/2}, ${height/2})`);

  // Arrow flow
  const arrowData = [
    {label: '输入图像\n448×448×3', x: -280, color: '#6baed6'},
    {label: '24 个卷积层\n特征提取', x: -100, color: '#4292c6'},
    {label: '2 个全连接层\n回归预测', x: 80, color: '#ef8a34'},
    {label: '输出张量\n7×7×30', x: 240, color: '#e34a33'}
  ];

  arrowData.forEach((item, i) => {
    const grp = g.append('g').attr('class', 'flow-node').style('opacity', 0);

    grp.append('rect')
      .attr('x', item.x - 75).attr('y', -30)
      .attr('width', 150).attr('height', 60)
      .style('fill', item.color).style('opacity', 0.85).style('rx', 8);

    const lines = item.label.split('\n');
    lines.forEach((line, li) => {
      grp.append('text')
        .attr('x', item.x).attr('y', li === 0 ? -6 : 12)
        .attr('text-anchor', 'middle')
        .style('font-size', '13px').style('fill', '#fff')
        .style('font-weight', li === 0 ? '700' : '400')
        .text(line);
    });

    grp.transition().delay(i * 500).duration(400).style('opacity', 1);

    // Arrow between nodes
    if (i < arrowData.length - 1) {
      const ax1 = item.x + 75, ax2 = arrowData[i + 1].x - 75;
      g.append('line').attr('class', 'flow-arrow')
        .attr('x1', ax1).attr('y1', 0)
        .attr('x2', ax1).attr('y2', 0)
        .style('stroke', '#999').style('stroke-width', 2)
        .attr('marker-end', 'url(#arrow)')
        .transition().delay(i * 500 + 300).duration(400)
        .attr('x2', ax2);
    }
  });

  // Explanation
  const ex = g.append('text')
    .attr('x', 0).attr('y', 70)
    .attr('text-anchor', 'middle')
    .style('font-size', '13px').style('fill', '#888')
    .style('opacity', 0)
    .text('一次前向传播：从图像像素 → 边界框坐标 + 类别概率');

  ex.transition().delay(2200).duration(500).style('opacity', 1);
}
