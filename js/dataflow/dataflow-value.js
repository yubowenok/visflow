
/*
 * DataflowValue is essentially a single constant or a set of constants
 * used for filtering
 */

"use strict";

var extObject = {
  initialize: function() {
    this.isSet = false;  // a single item is considered non-set

    // un-initialized state
    this.numElements = 0;
    this.elements = [];
  },

  // add one element
  add: function(value) {
    this.numElements++;
    this.elements.push(value);
    this.isSet = this.numElements > 1;
  },

  // remove all elements, returns to un-initialized state
  clear: function() {
    this.numElements = 0;
    this.elements = [];
    this.isSet = false;
  }
};

var DataflowValue = Base.extend(extObject);
