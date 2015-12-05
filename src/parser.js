/**
 * @fileoverview VisFlow data parser.
 */

'use strict';

/** @const */
visflow.parser = {};

/**
 * Mapping from value grades to value types.
 * @const {!Object<string>}
 */
visflow.parser.GRADE_TO_TYPE = {
  0: 'empty',
  1: 'int',
  2: 'float',
  3: 'time',
  4: 'string'
};

/**
 * Mapping from value types to value grades.
 * @const {!Object<number>}
 */
visflow.parser.TYPE_TO_GRADE = {
  empty: 0,
  int: 1,
  float: 2,
  time: 3,
  string: 4
};

/**
 * Parses a token and returns its value and type.
 * @param {string} text
 */
visflow.parser.checkToken = function(text) {
  // grades: [empty, int, float, string]
  text += ''; // convert to string
  var res;
  res = text.match(/^-?[0-9]+/);
  if (res && res[0] === text) {
    return {
      type: 'int',
      value: parseInt(text)
    };
  }
  res = text.match(/^-?([0-9]*\.[0-9]+|[0-9]+\.[0-9]*)/);
  if (res && res[0] === text) {
    return {
      type: 'float',
      value: parseFloat(text)
    };
  }
  if (text === '') {  // empty constants are ignored
    return {
      type: 'empty',
      value: ''
    };
  }
  var date = new Date(text);
  if (date != 'Invalid Date') {
    return {
      type: 'time',
      value: date.getTime()
    };
  }
  return {
    type: 'string',
    value: text
  };
};

/**
 * Tokenizes the input value to form a value of chosen type.
 * @param {string} value
 * @param {string=} opt_type
 */
visflow.parser.tokenize = function(value, opt_type) {
  var type = opt_type == null ?
      visflow.parser.checkToken(value).type : opt_type;
  switch(type) {
    case 'int':
      return parseInt(value);
    case 'float':
      return parseFloat(value);
    case 'time':
      return new Date(value).getTime();
    case 'string':
      return '' + value;
    case 'empty':
      return '';
  }
};

/**
 * Parses a csv string and generates the TabularData.
 * @param {string} csv
 * @param {{
 *   delimiter: string
 * }=} opt_params
 * @return {!visflow.TabularData}
 */
visflow.parser.csv = function(csv, opt_params) {
  var params = _({}).extend(opt_params);
  var values = d3.csv.parseRows(csv);
  var dimensions = values.splice(0, 1)[0];
  var dimensionTypes = [];
  dimensions.forEach(function(dimName, dimIndex) {
    var grade = d3.max(values.map(function(row) {
      var val = row[dimIndex];
      return visflow.parser.TYPE_TO_GRADE[visflow.parser.checkToken(val).type];
    }));
    var type = visflow.parser.GRADE_TO_TYPE[grade];
    for (var i = 0; i < values.length; i++) {
      values[i][dimIndex] = visflow.parser.tokenize(values[i][dimIndex], type);
    }
    dimensionTypes.push(type);
  }.bind(this));

  var typeString = dimensions.concat(dimensionTypes).join(',');
  var hashType = CryptoJS.SHA256(typeString).toString();
  return {
    type: hashType,
    values: values,
    dimensions: dimensions,
    dimensionTypes: dimensionTypes
  };
};
