
/*
 * utility functions
 */

"use strict";

var Utils = {
  // get event offset corresponding to parent element
  getOffset: function(event, jqthis) {
    var parentOffset = jqthis.parent().offset();
    if (parentOffset == null) {
      console.log("?");
    }
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

  // compare function
  compare: function(a, b, type) {
    if (a instanceof Array) {
      if (a.length != b.length)
        return console.error("array length not match");
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
  },

  // remove the bumpy jquery ui style widget header for table
  blendTableHeader: function(jqview) {
    jqview.find(".ui-widget-header")
      .removeClass("ui-widget-header");
  },

  // parse a token and returns its value and type
  gradeToType: ["empty", "int", "float", "string"],
  typeToGrade: {
    empty: 0,
    int: 1,
    float: 2,
    stirng: 3
  },
  parseToken: function(text) {
    // grades: [empty, int, float, string]
    text += ""; // convert to string
    var res;
    res = text.match(/^-?[0-9]+/);
    if (res && res[0] === text) {
      return {
        type: "int",
        value: parseInt(text),
        grade: 1
      };
    }
    res = text.match(/^-?([0-9]*\.[0-9]+|[0-9]+\.[0-9]*)/);
    if (res && res[0] === text) {
      return {
        type: "float",
        value: parseFloat(text),
        grade: 2
      };
    }
    if (text === "") {  // empty constants are ignored
      return {
        type: "empty",
        value: null,
        grade: 0
      };
    }
    return {
      type: "string",
      value: text,
      grade: 3
    };
  }
};
