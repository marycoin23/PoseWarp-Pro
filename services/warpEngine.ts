
import { Point, Pin } from '../types';

/**
 * Calculates the new position of a vertex based on current pin positions.
 */
export const calculateDeformedPoint = (
  v: Point,
  pins: Pin[],
  influence: number
): Point => {
  if (pins.length === 0) return { ...v };

  // Sort pins by depth to allow "overlapping" influence if needed, 
  // though for distance-weighting, we use all pins.
  let totalWeight = 0;
  let dx = 0;
  let dy = 0;

  for (const pin of pins) {
    const distSq = (v.x - pin.originalX) ** 2 + (v.y - pin.originalY) ** 2;
    
    // Weight function: standard inverse distance with influence scaling
    // Depth can slightly boost influence
    const depthBoost = 1 + (pin.depth * 0.1);
    const weight = (1 / (Math.pow(distSq / (influence * 100), 1.5) + 0.0001)) * depthBoost;
    
    let targetX = pin.x;
    let targetY = pin.y;

    // Apply fixed rotation if mode is set
    if (pin.rotationMode === 'Fixed' && pin.rotation !== 0) {
      const angle = (pin.rotation * Math.PI) / 180;
      const rx = v.x - pin.originalX;
      const ry = v.y - pin.originalY;
      
      const rotatedX = rx * Math.cos(angle) - ry * Math.sin(angle);
      const rotatedY = rx * Math.sin(angle) + ry * Math.cos(angle);
      
      targetX = pin.x + (rotatedX - rx);
      targetY = pin.y + (rotatedY - ry);
    }
    
    dx += (targetX - pin.originalX) * weight;
    dy += (targetY - pin.originalY) * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return { ...v };

  return {
    x: v.x + dx / totalWeight,
    y: v.y + dy / totalWeight,
  };
};

export const generateMesh = (
  width: number,
  height: number,
  density: number
) => {
  const stepsX = Math.max(2, Math.floor(width / (50 / density)));
  const stepsY = Math.max(2, Math.floor(height / (50 / density)));
  
  const vertices: Point[] = [];
  const indices: number[][] = [];

  for (let j = 0; j <= stepsY; j++) {
    for (let i = 0; i <= stepsX; i++) {
      vertices.push({
        x: (i / stepsX) * width,
        y: (j / stepsY) * height,
      });
    }
  }

  for (let j = 0; j < stepsY; j++) {
    for (let i = 0; i < stepsX; i++) {
      const p1 = j * (stepsX + 1) + i;
      const p2 = p1 + 1;
      const p3 = (j + 1) * (stepsX + 1) + i;
      const p4 = p3 + 1;

      indices.push([p1, p2, p3]);
      indices.push([p2, p4, p3]);
    }
  }

  return { vertices, indices };
};
