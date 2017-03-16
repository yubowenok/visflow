/**
 * @fileoverview VisFlow data parser.
 */

/** @const */
visflow.parser = {};

/**
 * Value types, going from strictest to weakest typing.
 * @enum {number}
 */
visflow.ValueType = {
  EMPTY: 0,
  TIME: 1,
  INT: 2,
  FLOAT: 3,
  STRING: 4,
  ERROR: -1
};

/**
 * Value types enum to string.
 * @const {!Object<string>}
 */
visflow.ValueTypeName = {
  0: 'empty',
  1: 'time',
  2: 'int',
  3: 'float',
  4: 'string'
};


/**
 * Parses a token and returns its value and type.
 * @param {string} text
 * @param {Array=} opt_ignoredTypes
 * @return {{
 *   type: !visflow.ValueType,
 *   value: (number|string)
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

  if (!(visflow.ValueType.TIME in ignored) &&
    visflow.utils.isProbablyDate(text)) {
    return {
      type: visflow.ValueType.TIME,
      value: new Date(text).getTime()
    };
  }
  var res;
  res = text.match(/^-?[0-9]+/);
  if (!(visflow.ValueType.INT in ignored) && res && res[0] === text) {
    return {
      type: visflow.ValueType.INT,
      value: parseInt(text, 10)
    };
  }
  if (!(visflow.ValueType.FLOAT in ignored) && Number(text) == text) {
    return {
      type: visflow.ValueType.FLOAT,
      value: parseFloat(text)
    };
  }
  if (!(visflow.ValueType.STRING in ignored)) {
    return {
      type: visflow.ValueType.STRING,
      value: text
    };
  }
  visflow.error('none of the value types matched', text);
  return {
    type: visflow.ValueType.ERROR,
    value: ''
  };
};

/**
 * Tokenizes the input value to form a value of chosen type.
 * @param {string} value
 * @param {visflow.ValueType=} opt_type
 * @return {number|string}
 */
visflow.parser.tokenize = function(value, opt_type) {
  var type = opt_type == null ?
      visflow.parser.checkToken(value).type : opt_type;
  if (value === '') {
    switch (type) {
      case visflow.ValueType.INT:
      case visflow.ValueType.FLOAT:
      case visflow.ValueType.TIME:
        return 0;
      default:
        return '';
    }
  }
  switch (type) {
    case visflow.ValueType.INT:
      return parseInt(value, 10);
    case visflow.ValueType.FLOAT:
      return parseFloat(value);
    case visflow.ValueType.TIME:
      return new Date(value).getTime();
    case visflow.ValueType.STRING:
      return '' + value;
    default:
      return '';
  }
};

/**
 * Parses a csv string and generates the TabularData.
 * @param {string} csv
 * @return {visflow.TabularData}
 */
visflow.parser.csv = function(csv) {
  var headerLine;
  var firstNewLine = csv.indexOf('\n');
  if (firstNewLine == -1) {
    headerLine = csv;
  } else {
    headerLine = csv.substr(0, firstNewLine);
  }
  var delimiter = headerLine.match(/[,;|]/);
  if (delimiter != null) {
    delimiter = delimiter[0];
  } else {
    delimiter = ',';
  }

  var values = d3.dsvFormat(delimiter).parseRows(csv);
  var dimensions = values.splice(0, 1)[0];
  if (_.last(dimensions) === '') {
    // In case there is a delimiter in the end.
    dimensions.pop();
  }
  var dimensionTypes = [];
  var dimensionDuplicate = [];

  dimensions.forEach(function(dimName, dimIndex) {
    var colInfo = visflow.parser.typingColumn(values, dimIndex);
    dimensionTypes.push(colInfo.type);
    dimensionDuplicate.push(colInfo.duplicate);
  });

  var data = {
    dimensions: dimensions,
    dimensionTypes: dimensionTypes,
    dimensionDuplicate: dimensionDuplicate,
    values: values
  };
  var typeHash = visflow.parser.dataTypeHash(data);
  var dataHash = visflow.parser.dataHash(data);
  return _.extend(data, {
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
  var colType = visflow.ValueType.EMPTY;
  values.forEach(function(row) {
    var type = visflow.parser.checkToken(row[colIndex]).type;
    if (type > colType) {
      colType = type;
    }
  });
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
 * @param {!visflow.Data} data
 * @param {Object} opt_items
 * @return {string}
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
 * Transposes the data on the given key dimensions.
 * @param {visflow.TabularData} data
 * @param {!Array<number>} dims
 * @param {!Array<number>} attrs
 * @param {string} name Column name for the attributes.
 * @return {{
 *   success: boolean,
 *   msg: (string|undefined),
 *   data: ?visflow.TabularData
 * }}
 */
visflow.parser.transpose = function(data, dims, attrs, name) {
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
    });
    keys.push(vals);
    keysSorted.push(vals);
  });

  // Check duplicates
  keysSorted.sort(visflow.utils.compare);
  for (var i = 1; i < keysSorted.length; i++) {
    if (visflow.utils.compare(keysSorted[i], keysSorted[i - 1]) == 0) {
      return {
        success: false,
        msg: 'duplicated keys not allowed for data transpose',
        data: null
      };
    }
  }

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
    attrs.forEach(function(dim) {
      values.push(key.concat([
        data.dimensions[dim],
        data.values[index][dim]
      ]));
    });
  });
  // Value column.
  var colInfo = visflow.parser.typingColumn(values, dims.length + 1);
  dimensions.push('value');
  dimensionTypes.push(colInfo.type);
  dimensionDuplicate.push(colInfo.duplicate);

  var resultData = {
    dimensions: dimensions,
    dimensionTypes: dimensionTypes,
    dimensionDuplicate: dimensionDuplicate,
    values: values
  };
  var typeHash = visflow.parser.dataTypeHash(resultData);
  var dataHash = visflow.parser.dataHash(resultData);
  return {
    success: true,
    data: _.extend(resultData, {
      type: typeHash,
      hash: dataHash
    })
  };
};

/**
 * Computes the hash value of the dimensions.
 * @param {{
 *   dimensions: !Array<string>
 * }} data
 * @return {string}
 */
visflow.parser.dataTypeHash = function(data) {
  return CryptoJS.SHA256(data.dimensions.join(',')).toString();
};

/**
 * Computes the hash value for the entire dataset.
 * @param {{
 *   dimensions: !Array<string>,
 *   values: !Array<!Array<string|number>>
 * }} data
 * @return {string}
 */
visflow.parser.dataHash = function(data) {
  return CryptoJS.SHA256(data.dimensions.join(',') + ',' +
      data.values.join(',')).toString();
};
