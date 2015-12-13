
/*
 * data parser for general space/tab delimited table data
 * assuming the first row is dimensions
 */

'use strict';

var gradeTypes = ['int', 'float', 'string'];
// parse a token
var parseToken = function(text) {
  var res;
  res = text.match(/^-?[0-9]+/);
  if (res && res[0] === text) {
    return {
      type: 'int',
      value: parseInt(text),
      grade: 0
    };
  }
  res = text.match(/^-?([0-9]*\.[0-9]+|[0-9]+\.[0-9]*)/);
  if (res && res[0] === text) {
    return {
      type: 'float',
      value: parseFloat(text),
      grade: 1
    };
  }
  if (text === '') {  // empty constants are ignored
    return {
      type: 'empty',
      value: null,
      grade: -1
    };
  }
  return {
    type: 'string',
    value: text,
    grade: 2
  };
};

var fs = require('fs');

fs.readFile('input', function(err, data) {
  if(err)
      throw err;
  var lines = data.toString().split(/[\n\r]+/);

  var type = lines[0];  // remove return char
  var dims = lines[1].split(/\s+/);
  var dimTypes = [];
  var values = [];

  for (var i = 0; i < dims.length; i++)
    dimTypes.push(-1);  // default grade is nothing, triggers error

  for (var i = 2; i < lines.length; i++) {
    var tokens = lines[i].split(/\s+/);
    var row = [];
    for (var j in tokens) {
      var e = parseToken(tokens[j]);
      row.push(e.value);
      dimTypes[j] = Math.max(dimTypes[j], e.grade);
    }
    values.push(row);
  }

  for (var i = 0; i < dims.length; i++)
    dimTypes[i] = gradeTypes[dimTypes[i]];

  var data = {
    type: type,
    dimensions: dims,
    dimensionTypes: dimTypes,
    values: values
  };

  var output = JSON.stringify(data);

  fs.writeFile('output.json', output, function(err) {
    if(err) {
        console.log(err);
    } else {
        console.log('file saved');
    }
  });
});