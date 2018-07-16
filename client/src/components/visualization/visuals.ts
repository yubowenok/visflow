import _ from 'lodash';

import { VisualProperties } from '@/data/package/subset-package';

// Supports numerical property multipliers.
interface VisualMultiplier {
  size?: number;
  borderWidth?: number;
  opacity?: number;
}

/**
 * Highlight effect for selected elements. The size and width are multiplied by this factor.
 */
const selectedVisualMultiplier: VisualMultiplier = {
  size: 1.2,
  borderWidth: 1.2,
};

export const multiplyVisuals = (visuals: VisualProperties, multiplier: VisualMultiplier = selectedVisualMultiplier) => {
  if (visuals.size !== undefined && multiplier.size !== undefined) {
    visuals.size *= multiplier.size;
  }
  if (visuals.borderWidth !== undefined && multiplier.borderWidth !== undefined) {
    visuals.borderWidth *= multiplier.borderWidth;
  }
  if (visuals.opacity !== undefined && multiplier.opacity !== undefined) {
    visuals.opacity *= multiplier.opacity;
  }
};
