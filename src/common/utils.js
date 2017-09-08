/**
 * @fileoverview Utility functions for VisFlow.
 */

/** @const */
visflow.utils = {};

/**
 * Initializes the utils. Creates underscore mixins.
 */
visflow.utils.init = function() {
  // This requires externs to be added for underscore.
  _.mixin({
    popFront: visflow.utils.popFront_,
    keySet: visflow.utils.keySet_,
    getValue: visflow.utils.getValue_,
    fadeOut: visflow.utils.fadeOut_,
    inherit: visflow.utils.inherit_,
    d3: visflow.utils.d3_
  });
};

/**
 * Gets mouse event offset corresponding to a given element 'e'.
 * @param {!jQuery.Event} event
 * @param {!jQuery} element
 * @return {visflow.Offset} Offset computed.
 */
visflow.utils.mouseOffset = function(event, element) {
  var offset = element.offset();
  var paddingLeft = parseInt(element.css('padding-left'), 10);
  var paddingTop = parseInt(element.css('padding-top'), 10);
  return {
    left: event.pageX - offset.left - paddingLeft,
    top: event.pageY - offset.top - paddingTop
  };
};

/**
 * Gets the offset of an element 'e1' relative to another element 'e2'.
 * @param {!jQuery} e1
 * @param {!jQuery} e2
 * @return {visflow.Offset}
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
 * @return {visflow.Offset}
 */
visflow.utils.offsetMain = function(e) {
  return visflow.utils.offset(e, $('#main'));
};

/**
 * Checks whether a point is inside a box, 2D.
 * @param {!visflow.Point} point
 * @param {visflow.Rect2Points} box
 * @return {boolean}
 */
visflow.utils.pointInBox = function(point, box) {
  return box.x1 <= point.x && point.x <= box.x2 &&
      box.y1 <= point.y && point.y <= box.y2;
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
 * @param {visflow.Vector} p1
 * @param {visflow.Vector} p2
 * @param {visflow.Vector} q1
 * @param {visflow.Vector} q2
 * @return {boolean}
 */
visflow.utils.intersect = function(p1, p2, q1, q2) {
  return visflow.utils.twosides(p1, p2, q1, q2) &&
    visflow.utils.twosides(q1, q2, p1, p2);
};

/**
 * Checks if q1, q2 are on two different sides of line (p1, p2).
 * @param {visflow.Vector} p1
 * @param {visflow.Vector} p2
 * @param {visflow.Vector} q1
 * @param {visflow.Vector} q2
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
 * Checks if a string is a valid hex color.
 * @param {string} color
 * @return {boolean}
 */
visflow.utils.isColor = function(color) {
  if (color == 'none') {
    return true;
  }
  var m = color.match(/#?[a-f0-9]{6}/);
  return m != null && m[0] == color;
};

/**
 * Compares array or number lexicographically.
 * @param {number|string|!Array<number>} a
 * @param {number|string|!Array<number>} b
 * @return {number} -1, 0, 1 for a < b, a = b and a > b.
 */
visflow.utils.compare = function(a, b) {
  if (a instanceof Array) {
    if (a.length != b.length) {
      visflow.error('array length not match');
      return a.length - b.length;
    }
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
 * Hashes a string using polynomial hash (rolling hash) with multiplier = 3,
 * mod = 1000000007.
 * @param {string} s
 * @return {number} Hash value between [0, 1000000007), or -1 on error.
 */
visflow.utils.hashString = function(s) {
  if (typeof s != 'string') {
    visflow.error('x is not a string to hash');
    return -1;
  }
  var a = 3, p = 1000000007;
  var result = 0;
  for (var i = 0; i < s.length; i++) {
    var x = s.charCodeAt(i);
    result = (result * a + x) % p;
  }
  return result;
};

/**
 * Combines translate and scale into a CSS transform string.
 * @param {visflow.Vector} opt_translate Zoom translate.
 * @param {number=} opt_scale Zoom scale.
 * @param {number=} opt_rotate Rotation degree.
 * @return {visflow.Transform} CSS string of the transform.
 */
visflow.utils.getTransform = function(opt_translate, opt_scale, opt_rotate) {
  var result = '';
  if (opt_translate != null) {
    result += 'translate(' + opt_translate + ')';
  }
  if (opt_scale != null) {
    result += 'scale(' + opt_scale + ')';
  }
  if (opt_rotate != null) {
    result += 'rotate(' + opt_rotate + ')';
  }
  return result;
};

/**
 * Gets an array as the compare key of rendering properties.
 * @param {visflow.Properties} properties
 * @return {!Array<number|string>}
 */
visflow.utils.propertiesCompareKey = function(properties) {
  var result = [];
  ['color', 'border', 'width', 'opacity'].forEach(function(key) {
    var p = key in properties ? properties[key] : '';
    if (key == 'color') {
      p = d3.hsl(d3.rgb('' + p));
      p = [isNaN(p.h) ? 0 : p.h, isNaN(p.s) ? 0 : p.s, p.l];
      result = result.concat(p);
    } else {
      result.push(p);
    }
  });
  return result;
};

/**
 * Compares two rendering property objects.
 * @param {!{
 *   properties: visflow.Properties,
 *   propertiesKey: !Array<string|number>
 * }} a
 * @param {!{
 *   properties: visflow.Properties,
 *   propertiesKey: !Array<string|number>
 * }} b
 * @return {number} -1, 0, 1 for a < b, a = b, a > b.
 */
visflow.utils.propertiesCompare = function(a, b) {
  if (!('propertiesKey' in a)) {
    a.propertiesKey = visflow.utils.propertiesCompareKey(a.properties);
  }
  if (!('propertiesKey' in b)) {
    b.propertiesKey = visflow.utils.propertiesCompareKey(b.properties);
  }
  return visflow.utils.compare(a.propertiesKey, b.propertiesKey);
};

/**
 * Gets a standardized URL (add protocol).
 * @param {string} url
 * @return {string}
 */
visflow.utils.standardUrl = function(url) {
  if (url.substr(0, 4) != 'http') {
    return 'http://' + url;
  }
  return url;
};

/**
 * Creates a FormData object with the parameters specified in formParams.
 * @param {!Object<Blob|null|string>} formParams
 * @return {FormData}
 */
visflow.utils.formData = function(formParams) {
  var formData = new FormData();
  for (var key in formParams) {
    formData.append(key, formParams[key]);
  }
  return formData;
};

/**
 * Converts an array of string or object with string keys to a set with strings
 * as keys. The values will be set to all true.
 * @param {!Array<T>|!Object<T>} collection
 * @return {!Object<T, boolean>}
 * @template T
 * @private
 */
visflow.utils.keySet_ = function(collection) {
  var obj = {};
  if (collection instanceof Array) {
    collection.forEach(function(element) {
      obj[element] = true;
    });
  } else {
    for (var key in collection) {
      obj[key] = true;
    }
  }
  return obj;
};

/**
 * Provides a function that gets the value of a given key, from a given object.
 * If suffix is given, then concat suffix at the end of the return value.
 * @param {string} key
 * @param {string=} opt_suffix
 * @return {function(!Object): *}
 * @private
 */
visflow.utils.getValue_ = function(key, opt_suffix) {
  return function(obj) {
    return opt_suffix ? obj[this] + opt_suffix : obj[this];
  }.bind(key);
};

/**
 * Fades out a D3 selection by opacity change.
 * @param {!d3} obj
 * @private
 */
visflow.utils.fadeOut_ = function(obj) {
  obj.transition()
    .style('opacity', 0)
    .remove();
};

/**
 * Returns the first element of the array and pop_front the array.
 * This has linear time and shall only be used on small array.
 * @param {!Array} arr
 * @param {number=} opt_count
 * @return {*} If the array is empty, return undefined.
 * @private
 */
visflow.utils.popFront_ = function(arr, opt_count) {
  var count = opt_count === undefined ? 1 : opt_count;
  var first = arr[0];
  arr.splice(0, count);
  return first;
};

/**
 * Returns an empty d3 selection.
 * @return {!d3}
 * @private
 */
visflow.utils.d3_ = function() {
  return d3.select('#empty-selection');
};

/**
 * Makes 'child' class inherit 'base' class.
 * @param {Function} child
 * @param {*} base
 * @private
 */
visflow.utils.inherit_ = function(child, base) {
  child.prototype = Object.create(base.prototype);
  child.prototype.constructor = child;
  child.base = base.prototype;
};

/**
 * Checks if a token is a numeric number.
 * @param {string} token
 * @return {boolean}
 */
visflow.utils.isNumber = function(token) {
  return !isNaN(token);
};

/**
 * Checks if a string is probably a date.
 * @param {string|number|null|undefined} text
 * @param {boolean=} opt_strict
 * @return {boolean}
 */
visflow.utils.isProbablyDate = function(text, opt_strict) {
  if (text == null || text == undefined) {
    return false;
  }
  var strict = opt_strict !== undefined ? !!opt_strict : true;
  // Strangely, recently implementation change of Date.parse()
  // parses '10' into Mon Oct 01 2001 00:00:00 GMT-0400 (EDT) ???
  // We handle those special exceptions.
  // Make sure that text is not a number.
  if (strict && Number(text) == text) {
    // TODO(bowen): we may want to double-check how to handle pure years like
    // '2001', '1975', etc.
    return false;
  }
  var date = new Date(text);
  return date != 'Invalid Date' &&
    date >= Date.parse('Jan 1 1000') &&
    date <= Date.parse('Jan 1 2200');
};

/**
 * Strips the given text. Removes leading and trailing newlines and empty
 * spaces.
 * @param {string} text
 * @return {string}
 */
visflow.utils.strip = function(text) {
  return text.replace(/^[\s\n]+/, '').replace(/[\s\n]+$/, '');
};

/**
 * Visually shakes a jQuery element.
 * @param {!jQuery} element
 */
visflow.utils.shake = function(element) {
  var left = element.offset().left;
  for (var i = 0; i < 2; i++) {
    setTimeout(function() {
      element.css('left', left - 5);
    }, i * 100 + 0);
    setTimeout(function() {
      element.css('left', left + 5);
    }, i * 100 + 50);
  }
  element.css('left', left);
};

/**
 * Formats the given value as time.
 * @param {number|string} value
 * @return {string}
 */
visflow.utils.formatTime = function(value) {
  if (visflow.utils.isNumber('' + value) &&
    ('' + value).match(/^\d{4}$/) == null) {
    // Note that we cannot create new Date() with UTC time string like
    // '1490285474832', which would throw "Invalid Date".
    // The exception is four-digit string year, which we should keep intact.
    value = +value;
  }
  return moment(new Date(value)).format(visflow.const.TIME_FORMAT);
};

/**
 * Performs utils initialization.
 */
visflow.utils.init();
