import { getAllNodes } from './util';
import FlowsenseUpdateTracker from './tracker';

/**
 * Applies auto layout on all the diagram nodes.
 */
export const autoLayout = (tracker: FlowsenseUpdateTracker) => {
  tracker.toAutoLayout(getAllNodes());
};
