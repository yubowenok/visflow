/**
 * @fileoverview VisFlow data parser.
 */

'use strict';

/** @const */
visflow.parser = {};

/**
 * Value types.
 * @enum {number}
 */
visflow.ValueType = {
  EMPTY: 0,
  INT: 1,
  FLOAT: 2,
  TIME: 3,
  STRING: 4
};

/**
 * Value types enum to string.
 * @const {!Object<string>}
 */
visflow.ValueTypeName = {
  0: 'empty',
  1: 'int',
  2: 'float',
  3: 'time',
  4: 'string'
};


/**
 * Parses a token and returns its value and type.
 * @param {string} text
 * @param {Array=} opt_ignoredTypes
 * @return {{
 *   type: visflow.ValueType,
 *   value: number|string
 * }}
 */
visflow.parser.checkToken = function(text, opt_ignoredTypes) {
  var ignored = {};
  if (opt_ignoredTypes != null) {
    ignored = _.keySet(opt_ignoredTypes);
  }

  text += ''; // Convert to string
  if (!(visflow.ValueType.EMPTY in ignored) && text === '') {
    return {
      type: visflow.ValueType.EMPTY,
      value: ''
    };
  }

  var res;
  res = text.match(/^-?[0-9]+/);
  if (!(visflow.ValueType.INT in ignored) && res && res[0] === text) {
    return {
      type: visflow.ValueType.INT,
      value: parseInt(text)
    };
  }
  if (!(visflow.ValueType.FLOAT in ignored) && Number(text) == text) {
    return {
      type: visflow.ValueType.FLOAT,
      value: parseFloat(text)
    };
  }
  var date = new Date(text);
  if (!(visflow.ValueType.TIME in ignored) && date != 'Invalid Date') {
    return {
      type: visflow.ValueType.TIME,
      value: date.getTime()
    };
  }
  if (!(visflow.ValueType.STRING in ignored)) {
    return {
      type: visflow.ValueType.STRING,
      value: text
    };
  }
  visflow.error('none of the value types matched', text);
};

/**
 * Tokenizes the input value to form a value of chosen type.
 * @param {string} value
 * @param {visflow.ValueType=} opt_type
 */
visflow.parser.tokenize = function(value, opt_type) {
  var type = opt_type == null ?
      visflow.parser.checkToken(value).type : opt_type;
  switch(type) {
    case visflow.ValueType.EMPTY:
      return '';
    case visflow.ValueType.INT:
      return parseInt(value);
    case visflow.ValueType.FLOAT:
      return parseFloat(value);
    case visflow.ValueType.TIME:
      return new Date(value).getTime();
    case visflow.ValueType.STRING:
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
  var dimensionDuplicate = [];

  dimensions.forEach(function(dimName, dimIndex) {
    var colInfo = visflow.parser.typingColumn(values, dimIndex);
    dimensionTypes.push(colInfo.type);
    dimensionDuplicate.push(colInfo.duplicate);
  }.bind(this));

  var data = {
    dimensions: dimensions,
    dimensionTypes: dimensionTypes,
    dimensionDuplicate: dimensionDuplicate,
    values: values
  };
  var typeHash = visflow.parser.dataTypeHash(data);
  var dataHash = visflow.parser.dataHash(data);
  return _(data).extend({
    type: typeHash,
    hash: dataHash
  });
};

/**
 * Parses and returns the column value type. Also promotes the values in the
 * specified column.
 * @param {!Array<!Array>} values
 * @param {number} colIndex Column index.
 * @return {{
 *   type: visflow.ValueType,
 *   duplicate: boolean
 * }}
 */
visflow.parser.typingColumn = function(values, colIndex) {
  var hasEmpty = false;
  var colType = visflow.ValueType.EMPTY;
  values.forEach(function(row) {
    var type = visflow.parser.checkToken(row[colIndex]).type;
    if (type == visflow.ValueType.EMPTY) {
      hasEmpty = true;
    }
    if (type > colType) {
      colType = type;
    }
  });
  if (hasEmpty) {
    colType = visflow.ValueType.STRING;
  }
  var duplicate = false;
  var exist = {};
  values.forEach(function(row) {
    var val = visflow.parser.tokenize(row[colIndex], colType);
    row[colIndex] = val;
    if (duplicate) {
      return;
    }
    if (val in exist) {
      duplicate = true;
    } else {
      exist[val] = true;
    }
  });
  return {
    type: colType,
    duplicate: duplicate
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
      if (dim == visflow.data.INDEX_DIM) {
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
  var dimensionDuplicate = [];
  dims.forEach(function(dim) {
    if (dim == visflow.data.INDEX_DIM) {
      dimensions.push(visflow.data.INDEX_TEXT);
      dimensionTypes.push(visflow.ValueType.INT);
      dimensionDuplicate.push(false);
    } else {
      dimensions.push(data.dimensions[dim]);
      dimensionTypes.push(data.dimensionTypes[dim]);
      dimensionDuplicate.push(data.dimensionDuplicate[dim]);
    }
  });
  // Attribute column.
  dimensions.push(name);
  dimensionTypes.push(visflow.ValueType.STRING);

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
  // Value column.
  var colInfo = visflow.parser.typingColumn(values, dims.length + 1);
  dimensions.push('value');
  dimensionTypes.push(colInfo.type);
  dimensionDuplicate.push(colInfo.duplicate);

  var data = {
    dimensions: dimensions,
    dimensionTypes: dimensionTypes,
    dimensionDuplicate: dimensionDuplicate,
    values: values
  };
  var typeHash = visflow.parser.dataTypeHash(data);
  var dataHash = visflow.parser.dataHash(data);
  return {
    success: true,
    data: _(data).extend({
      type: typeHash,
      hash: dataHash
    })
  };
};

/**
 * Computes the hash value of the dimensions.
 * @param {!visflow.TabularData} data
 * @return {string}
 */
visflow.parser.dataTypeHash = function(data) {
  return CryptoJS.SHA256(data.dimensions.join(',')).toString();
};

/**
 * Computes the hash value for the entire dataset.
 * @param {!visflow.TabularData} data
 * @return {string}
 */
visflow.parser.dataHash = function(data) {
  return CryptoJS.SHA256(data.dimensions.join(',') + ',' +
      data.values.join(',')).toString();
};