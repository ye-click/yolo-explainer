import { yoloConfig } from '../config.js';

const { S, B, C, classNames } = yoloConfig;

// Predefined object configurations for each image context
const sceneObjects = {
  dog:  [{ row: 3, col: 3, classIdx: 11, dx: 0.0, dy: 0.0, w: 0.30, h: 0.32, conf: 0.92 }],
  car:  [{ row: 4, col: 2, classIdx: 6,  dx: 0.0, dy: 0.0, w: 0.35, h: 0.22, conf: 0.90 }],
  person: [{ row: 3, col: 4, classIdx: 14, dx: 0.0, dy: 0.0, w: 0.18, h: 0.35, conf: 0.88 }],
  street: [
    { row: 4, col: 1, classIdx: 6,  dx: 0.1, dy: 0.2, w: 0.28, h: 0.18, conf: 0.90 },
    { row: 3, col: 5, classIdx: 14, dx: 0.3, dy: -0.1, w: 0.15, h: 0.32, conf: 0.88 },
    { row: 1, col: 3, classIdx: 11, dx: -0.15, dy: 0.1, w: 0.22, h: 0.20, conf: 0.85 },
  ]
};

/**
 * Generate a simulated YOLO output tensor for demonstration.
 * Creates a 7×7×30 tensor with realistic-ish values.
 */
export function generateYOLOOutput(imageContext = 'medium') {
  const objects = sceneObjects[imageContext] || sceneObjects.dog;
  const tensor = [];
  for (let i = 0; i < S; i++) {
    const row = [];
    for (let j = 0; j < S; j++) {
      const cell = generateCellPredictions(i, j, objects);
      row.push(cell);
    }
    tensor.push(row);
  }
  return tensor;
}

function generateCellPredictions(row, col, objects) {
  // Each cell: B boxes (each with x, y, w, h, confidence) + C class probs
  // = 2 * 5 + 20 = 30 values

  // Find nearest object
  let nearestObj = null, nearestDist = Infinity;
  for (const obj of objects) {
    const d = Math.abs(row - obj.row) + Math.abs(col - obj.col);
    if (d < nearestDist) { nearestDist = d; nearestObj = obj; }
  }

  const isCenterCell = nearestObj && row === nearestObj.row && col === nearestObj.col;
  const isObjectCell = nearestObj && nearestDist <= 1 && nearestObj.conf > 0.2;

  const predictions = [];

  if (isCenterCell) {
    const dx = nearestObj.dx || 0, dy = nearestObj.dy || 0;
    predictions.push(0.5 + dx, 0.5 + dy, nearestObj.w, nearestObj.h, nearestObj.conf);
    predictions.push(0.48 + dx, 0.52 + dy, nearestObj.w * 0.9, nearestObj.h * 0.9, nearestObj.conf * 0.9);
  } else if (isObjectCell) {
    const dr = row - nearestObj.row, dc = col - nearestObj.col;
    const dx = dc * 0.12 + (nearestObj.dx || 0);
    const dy = dr * 0.12 + (nearestObj.dy || 0);
    predictions.push(0.5 + dx, 0.5 + dy, nearestObj.w * 0.8, nearestObj.h * 0.8, nearestObj.conf * 0.6);
    predictions.push(0.5 + dx, 0.5 + dy, nearestObj.w * 0.7, nearestObj.h * 0.7, nearestObj.conf * 0.4);
  } else {
    predictions.push(0.5, 0.5, 0.1, 0.1, 0.05);
    predictions.push(0.5, 0.5, 0.1, 0.1, 0.03);
  }

  // Class probabilities (20 classes)
  const classProbs = new Array(C).fill(0.01);
  if (nearestObj && isObjectCell) {
    classProbs[nearestObj.classIdx] = isCenterCell ? 0.95 : 0.75;
    const nearbyClasses = [nearestObj.classIdx + 1, nearestObj.classIdx - 1]
      .filter(idx => idx >= 0 && idx < C);
    nearbyClasses.forEach(idx => { classProbs[idx] = 0.12; });
  }
  // For multi-object scenes, give partial probability to other object classes
  if (objects.length > 1 && !isObjectCell) {
    for (const obj of objects) {
      if (obj !== nearestObj && Math.abs(row - obj.row) <= 2 && Math.abs(col - obj.col) <= 2) {
        classProbs[obj.classIdx] = Math.max(classProbs[obj.classIdx], 0.08);
      }
    }
  }

  return [...predictions, ...classProbs];
}

/**
 * Decode the YOLO output tensor into bounding boxes.
 */
export function decodePredictions(tensor, confidenceThreshold = 0.2) {
  const boxes = [];
  for (let i = 0; i < S; i++) {
    for (let j = 0; j < S; j++) {
      const cell = tensor[i][j];
      for (let b = 0; b < B; b++) {
        const offset = b * 5;
        const x = (j + cell[offset + 0]) / S;
        const y = (i + cell[offset + 1]) / S;
        const w = cell[offset + 2];
        const h = cell[offset + 3];
        const conf = cell[offset + 4];

        // Class probabilities start at index B*5
        const classProbs = cell.slice(B * 5);
        const maxClassProb = Math.max(...classProbs);
        const classId = classProbs.indexOf(maxClassProb);
        const classSpecificConf = conf * maxClassProb;

        if (classSpecificConf > confidenceThreshold) {
          boxes.push({
            x, y, w, h,
            confidence: classSpecificConf,
            classId,
            className: yoloConfig.classNames[classId],
            gridRow: i,
            gridCol: j,
            boxIdx: b
          });
        }
      }
    }
  }

  // Sort by confidence descending
  boxes.sort((a, b) => b.confidence - a.confidence);
  return boxes;
}

/**
 * Non-maximum suppression.
 */
export function nonMaxSuppression(boxes, iouThreshold = 0.5) {
  const selected = [];

  for (const box of boxes) {
    let shouldKeep = true;
    for (const sel of selected) {
      if (computeIOU(box, sel) > iouThreshold && box.classId === sel.classId) {
        shouldKeep = false;
        break;
      }
    }
    if (shouldKeep) {
      selected.push(box);
    }
  }

  return selected;
}

function computeIOU(box1, box2) {
  const x1 = Math.max(box1.x - box1.w / 2, box2.x - box2.w / 2);
  const y1 = Math.max(box1.y - box1.h / 2, box2.y - box2.h / 2);
  const x2 = Math.min(box1.x + box1.w / 2, box2.x + box2.w / 2);
  const y2 = Math.min(box1.y + box1.h / 2, box2.y + box2.h / 2);

  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const area1 = box1.w * box1.h;
  const area2 = box2.w * box2.h;
  const union = area1 + area2 - intersection;

  return union > 0 ? intersection / union : 0;
}

/**
 * Compute class-specific confidence scores for a cell.
 */
export function getCellClassConfidences(cell) {
  const classProbs = cell.slice(B * 5);
  const classConfidences = classProbs.map((prob, idx) => ({
    className: yoloConfig.classNames[idx],
    probability: prob,
    confidence: prob,
    classIndex: idx
  }));
  return classConfidences.sort((a, b) => b.probability - a.probability);
}

/**
 * Get box predictions for a specific grid cell.
 */
export function getCellBoxes(cell, gridRow, gridCol) {
  const boxes = [];
  for (let b = 0; b < B; b++) {
    const offset = b * 5;
    boxes.push({
      x: (gridCol + cell[offset + 0]) / S,
      y: (gridRow + cell[offset + 1]) / S,
      w: cell[offset + 2],
      h: cell[offset + 3],
      confidence: cell[offset + 4],
      gridRow, gridCol, boxIdx: b
    });
  }
  return boxes;
}

export function computeLoss(x, y, w, h, C) {
  // Simplified loss computation for demonstration
  return {
    coordLoss: Math.pow(x, 2) + Math.pow(y, 2),
    sizeLoss: Math.pow(Math.sqrt(w), 2) + Math.pow(Math.sqrt(h), 2),
    confLoss: Math.pow(C, 2),
    total: Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(Math.sqrt(w), 2) + Math.pow(Math.sqrt(h), 2) + Math.pow(C, 2)
  };
}
