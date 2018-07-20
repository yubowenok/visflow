import _ from 'lodash';

import { VisualProperties } from '@/data/visuals';

// Supports numerical property multipliers.
interface VisualMultiplier {
  size?: number;
  width?: number;
  opacity?: number;
}

/**
 * Highlight effect for selected elements. The size and width are multiplied by this factor.
 */
const selectedVisualMultiplier: VisualMultiplier = {
  size: 1.2,
  width: 1.2,
};

export const multiplyVisuals = (visuals: VisualProperties, multiplier: VisualMultiplier = selectedVisualMultiplier) => {
  if (visuals.size !== undefined && multiplier.size !== undefined) {
    visuals.size *= multiplier.size;
  }
  if (visuals.width !== undefined && multiplier.width !== undefined) {
    visuals.width *= multiplier.width;
  }
  if (visuals.opacity !== undefined && multiplier.opacity !== undefined) {
    visuals.opacity *= multiplier.opacity;
  }
};
