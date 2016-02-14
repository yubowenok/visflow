/**
 * @fileoverview Manual test sequences of VisFlow.
 */

'use strict';

/** @const */
visflow.dev = {};

/**
 * Executes a sequence of commands for development testing purpose.
 */
visflow.dev.run = function() {
  visflow.diagram.download_('myDiagram');
};
