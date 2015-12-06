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
  if (text === '') {  // empty constants are ignored
    return {
      type: 'empty',
      value: ''
    };
  }

  var res;
  res = text.match(/^-?[0-9]+/);
  if (res && res[0] === text) {
    return {
      type: 'int',
      value: parseInt(text)
    };
  }
  //res = text.match(/^-?([0-9]*\.[0-9]+|[0-9]+\.[0-9]*)/);
  if (Number(text) == text) {
    return {
      type: 'float',
      value: parseFloat(text)
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
    case 'empty':
      return '';
    case 'int':
      return parseInt(value);
    case 'float':
      return parseFloat(value);
    case 'time':
      return new Date(value).getTime();
    case 'string':
      return '' + value;
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
  // TODO(bowen): handle tsv and other delimiters
  var params = _({}).extend(opt_params);

  var values = d3.csv.parseRows(csv);
  var dimensions = values.splice(0, 1)[0];
  var dimensionTypes = [];
  dimensions.forEach(function(dimName, dimIndex) {
    var hasEmpty = false;
    var grade = d3.max(values.map(function(row) {
      var val = row[dimIndex];
      var type = visflow.parser.checkToken(val).type;
      if (type == 'empty') {
        hasEmpty = true;
      }
      return visflow.parser.TYPE_TO_GRADE[type];
    }));
    var type = visflow.parser.GRADE_TO_TYPE[grade];
    if (hasEmpty) {
      type = 'string';
    }
    for (var i = 0; i < values.length; i++) {
      values[i][dimIndex] = visflow.parser.tokenize(values[i][dimIndex], type);
    }
    dimensionTypes.push(type);
  }.bind(this));

  var hashType = CryptoJS.SHA256(dimensions.join(',')).toString();
  return {
    type: hashType,
    values: values,
    dimensions: dimensions,
    dimensionTypes: dimensionTypes
  };
};

/**
 * Converts visflow tabular data to csv.
 * @param {!visflow.TabularData} data
 * @param {Object} opt_items
 */
visflow.parser.tabularToCSV = function(data, opt_items) {
  var lines = [data.dimensions.join(',')];
  data.values.forEach(function(row, index) {
    if (opt_items == null || index in opt_items) {
      lines.push(row.join(','));
    }
  });
  return lines.join('\n');
};

/**
 * Crosses the data on the given key dimensions.
 * @param {!visflow.TabularData} data
 * @param {!Array<number>} dims
 * @param {string} name Column name for the attributes.
 * @return {!{
 *   success: boolean,
 *   msg: string,
 *   data: visflow.TabularData
 * }}
 */
visflow.parser.cross = function(data, dims, name) {
  var keysSorted = [];
  var keys = [];
  data.values.forEach(function(row, index) {
    var vals = [];
    dims.forEach(function(dim) {
      if (dim == -1) {
        vals.push(index);
      } else {
        vals.push(row[dim]);
      }
    }, this);
    keys.push(vals);
    keysSorted.push(vals);
  }, this);

  // Check duplicates
  keysSorted.sort(visflow.utils.compare);
  for (var i = 1; i < keysSorted.length; i++) {
    if (visflow.utils.compare(keysSorted[i], keysSorted[i - 1]) == 0) {
      return {
        success: false,
        msg: 'duplicated keys not allowed for data crossing'
      };
    }
  }

  var keyDims = _.keySet(dims);

  var dimensions = [];
  var dimensionTypes = [];
  dims.forEach(function(dim) {
    if (dim == -1) {
      dimensions.push('index');
      dimensionTypes.push('int');
    } else {
      dimensions.push(data.dimensions[dim]);
      dimensionTypes.push(data.dimensionTypes[dim]);
    }
  });
  // Attribute column.
  dimensions.push(name);
  dimensionTypes.push('string');
  // Value column.
  dimensions.push('value');
  dimensionTypes.push('string');

  var values = [];
  keys.forEach(function(key, index) {
    for (var dim = 0; dim < data.dimensions.length; dim++) {
      if (dim in keyDims) {
        continue;
      }
      values.push(key.concat([
        data.dimensions[dim],
        data.values[index][dim]
      ]));
    }
  }, this);

  var hashType = CryptoJS.SHA256(dimensions.join(',')).toString();
  return {
    success: true,
    data: {
      type: hashType,
      dimensions: dimensions,
      dimensionTypes: dimensionTypes,
      values: values
    }
  };
};
