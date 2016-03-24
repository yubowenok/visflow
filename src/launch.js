/**
 * @fileoverview Launch VisFlow.
 */

$(document).ready(function() {
  visflow.init();
  if (visflow.dev) {
    visflow.dev.run();
  }
});
