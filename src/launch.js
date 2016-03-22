/**
 * @fileoverview Launch Visflow.
 */

$(document).ready(function() {
  visflow.init();
  if (visflow.dev) {
    visflow.dev.run();
  }
});
