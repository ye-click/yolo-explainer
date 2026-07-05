import { yoloConfig } from '../config.js';

const { S, B, C } = yoloConfig;

/**
 * Generate a simulated YOLO output tensor for demonstration.
 * Creates a 7×7×30 tensor with realistic-ish values.
 * For a real system, this would come from running the actual YOLO model.
 */
export function generateYOLOOutput(imageContext = 'medium') {
  const tensor = [];
  for (let i = 0; i < S; i++) {
    const row = [];
    for (let j = 0; j < S; j++) {
      const cell = generateCellPredictions(i, j, imageContext);
      row.push(cell);
    }
    tensor.push(row);
  }
  return tensor;
}

function generateCellPredictions(row, col, context) {
  // Each cell: B boxes (each with x, y, w, h, confidence) + C class probs
  // = 2 * 5 + 20 = 30 values

  // Simulate where objects might be
  const centerRow = context === 'dog' ? 3 : context === 'car' ? 4 : 3;
  const centerCol = context === 'dog' ? 3 : context === 'car' ? 2 : 4;

  const isObjectCell = Math.abs(row - centerRow) <= 1 && Math.abs(col - centerCol) <= 1;
  const isCenterCell = row === centerRow && col === centerCol;

  const predictions = [];

  // Box 1
  if (isCenterCell) {
    predictions.push(0.5, 0.5, 0.3, 0.4, 0.92); // good box
    predictions.push(0.48, 0.52, 0.28, 0.38, 0.85); // slightly offset box
  } else if (isObjectCell) {
    const dx = (col - centerCol) * 0.15;
    const dy = (row - centerRow) * 0.15;
    predictions.push(0.5 + dx, 0.5 + dy, 0.25, 0.35, 0.6);
    predictions.push(0.5 + dx, 0.5 + dy, 0.35, 0.3, 0.4);
  } else {
    predictions.push(0.5, 0.5, 0.1, 0.1, 0.05);
    predictions.push(0.5, 0.5, 0.1, 0.1, 0.03);
  }

  // Class probabilities (20 classes)
  const classProbs = new Array(C).fill(0.01);
  if (isObjectCell) {
    // If context is dog, make class 12 (dog) have high prob
    const classIdx = context === 'dog' ? 12 : context === 'car' ? 6 : 7;
    classProbs[classIdx] = 0.85;
    if (isCenterCell) classProbs[classIdx] = 0.95;
    // Some noise in related classes
    classProbs[classIdx + 1] = 0.1;
    classProbs[classIdx - 1] = 0.08;
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
