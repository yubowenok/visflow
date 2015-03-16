
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
  },

  // test if two segments p1-p2 and q1-q2 intersect
  intersect: function(p1, p2, q1, q2) {
    return this.twosides(p1,p2,q1,q2) && this.twosides(q1,q2,p1,p2);
  },

  // test if q1,q2 are on two sides of line p1-p2
  twosides: function(p1, p2, q1, q2) {
    var a = p2[1] - p1[1],
        b = p1[0] - p2[0],
        c = p2[0] * p1[1] - p1[0] * p2[1];
    var v1 = a * q1[0] + b * q1[1] + c,
        v2 = a * q2[0] + b * q2[1] + c;

    var eps = 1E-9;
    if (Math.abs(v1) < eps || Math.abs(v2) < eps) // touch
      return true;
    return v1 * v2 < 0;
  },

  // hash a string
  hashString: function(s) {
    if (typeof s != "string") {
      return console.error("x is not a string to hash");
    }
    var a = 3, p = 1000000007;
    var result = 0;
    for (var i = 0; i < s.length; i++) {
      var x = s.charCodeAt(i);
      result = (result * a + x) % p;
    }
    return result;
  }
};
