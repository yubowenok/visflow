/**
 * @fileoverview Utility functions for VisFlow.
 */

'use strict';

/** @const */
visflow.utils = {};

/**
 * Gets event offset corresponding to a given element 'e'.
 * @param {!jQuery.event} event
 * @param {!jQuery} e
 * @return {!Array<number>} Offset computed.
 */
visflow.utils.getOffset = function(event, e) {
  var offset = e.offset();
  return [
    event.pageX - offset.left,
    event.pageY - offset.top
  ];
};

/**
 * Gets the offset of an element 'e1' relative to another element 'e2'.
 * @param {!jQuery} e1
 * @param {!jQuery} e2
 */
visflow.utils.offset = function(e1, e2) {
  var offset1 = e1.offset(), offset2 = e2.offset();
  return {
    left: offset1.left - offset2.left,
    top: offset1.top - offset2.top
  };
};

/**
 * Gets the offset of an element relative to '#main'.
 * @param {!jQuery} e
 */
visflow.utils.offsetMain = function(e) {
  return visflow.utils.offset(e, $('#main'));
};

/**
 * Generates a random string of given length.
 * @param {number} len String length.
 * @return {string} A random string of length 'len'.
 */
visflow.utils.randomString = function(len) {
  return Math.random().toString(36).substr(2, len);
};

/**
 * Checks if two segments [p1, p2] and [q1, q2] intersect.
 * @param {!Array<number>} p1
 * @param {!Array<number>} p2
 * @param {!Array<number>} q1
 * @param {!Array<number>} q2
 */
visflow.utils.intersect = function(p1, p2, q1, q2) {
  return this.twosides(p1, p2, q1, q2) && this.twosides(q1, q2, p1, p2);
};

/**
 * Checks if q1, q2 are on two different sides of line (p1, p2).
 * @param {!Array<number>} p1
 * @param {!Array<number>} p2
 * @param {!Array<number>} q1
 * @param {!Array<number>} q2
 * @return {boolean} True if q1, q2 are on two different sides.
 */
visflow.utils.twosides = function(p1, p2, q1, q2) {
  var a = p2[1] - p1[1],
      b = p1[0] - p2[0],
      c = p2[0] * p1[1] - p1[0] * p2[1];
  var v1 = a * q1[0] + b * q1[1] + c,
      v2 = a * q2[0] + b * q2[1] + c;

  var eps = 1E-9;
  if (Math.abs(v1) < eps || Math.abs(v2) < eps) {
    // Touch
    return true;
  }
  return v1 * v2 < 0;
};

/**
 * Compares array or number lexicographically.
 * @param {number|!Array<number>} a
 * @param {number|!Array<number>} b
 * @return {number} -1, 0, 1 for a < b, a = b and a > b.
 */
visflow.utils.compare = function(a, b) {
  if (a instanceof Array) {
    if (a.length != b.length)
      return visflow.error('array length not match');
    for (var i = 0; i < a.length; i++) {
      if (a < b) return -1;
      else if (a > b) return 1;
    }
    return 0;
  } else {
    if (a < b) return -1;
    else if (a > b) return 1;
    return 0;
  }
};

/**
 * Hashes a string.
 * @param {string} s
 * @return {number} Hash value between [0, 1000000007).
 */
  visflow.utils.hashString = function(s) {
  if (typeof s != 'string') {
    return visflow.error('x is not a string to hash');
  }
  var a = 3, p = 1000000007;
  var result = 0;
  for (var i = 0; i < s.length; i++) {
    var x = s.charCodeAt(i);
    result = (result * a + x) % p;
  }
  return result;
};

/** @const {!Array<string>} */
visflow.utils.gradeToType = ['empty', 'int', 'float', 'string'];

/** @const {!Object<number>} */
visflow.utils.typeToGrade = {
  empty: 0,
  int: 1,
  float: 2,
  stirng: 3
};

/**
 * Parses a token and returns its value and type.
 * @param {string} text
 */
visflow.utils.parseToken = function(text) {
  // grades: [empty, int, float, string]
  text += ''; // convert to string
  var res;
  res = text.match(/^-?[0-9]+/);
  if (res && res[0] === text) {
    return {
      type: 'int',
      value: parseInt(text),
      grade: 1
    };
  }
  res = text.match(/^-?([0-9]*\.[0-9]+|[0-9]+\.[0-9]*)/);
  if (res && res[0] === text) {
    return {
      type: 'float',
      value: parseFloat(text),
      grade: 2
    };
  }
  if (text === '') {  // empty constants are ignored
    return {
      type: 'empty',
      value: null,
      grade: 0
    };
  }
  return {
    type: 'string',
    value: text,
    grade: 3
  };
};

/**
 * Converts an array of strings to a set with strings as keys.
 * The values will be set to all true.
 * @param {!Array<string>} arr
 * @return {!Object<boolean>}
 */
visflow.utils.keySet = function(arr) {
  var obj = {};
  arr.forEach(function(element) {
    obj[element] = true;
  });
  return obj;
};

/**
 * Makes 'child' class inherit 'base' class.
 * @param {*} child
 * @param {*} base
 */
visflow.utils.inherit = function(child, base) {
  child.prototype = Object.create(base.prototype);
  child.prototype.constructor = child;
  child.base = base.prototype;
};
