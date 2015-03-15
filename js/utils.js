
/*
 * utility functions
 */

"use strict";

var Utils = {
  // get event offset corresponding to parent element
  getOffset: function(event, jqthis) {
    var parentOffset = jqthis.parent().offset();
    return [event.pageX - parentOffset.left, event.pageY - parentOffset.top];
  },

  // generate a random string of given length
  randomString: function(len) {
    return Math.random().toString(36).substr(2, len);
  }
};
