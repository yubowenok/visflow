
/*
-mpg REAL 1 float
-cylinders REAL 2 int
-displacement REAL 3 float
-horsepower REAL 4 float
-weight REAL 5 int
-acceleration REAL 6 float
-model.year REAL 7 int + 1900
-origin REAL 8 string []
*/

'use strict';

function parseOrigin(p) {
  p = parseInt(p);
  if(p == 1) return 'American';
  if(p == 2) return 'European';
  if(p == 3) return 'Japanese';
  console.error('unhandled car category');
};
function parseInt1900(p) {
  return parseInt(p) + 1900;
}

var dimTypes = ['string', 'float', 'int', 'float', 'float', 'int', 'float', 'int', 'string'];
var parses = [parseFloat, parseInt, parseFloat, parseFloat, parseInt, parseFloat, parseInt1900, parseOrigin];

var fs = require('fs');

fs.readFile('car', function(err, data) {
    if(err)
      throw err;
    var array = data.toString().split('\n');
    var cars = [];
    var dims = [];
    var stage = '';
    var j;
    for(var i in array) {
      var line = array[i];
      var cline = line.match(/\S+/)[0];
      if (cline.substr(0,2) === '//') {
        if (cline === '//dimensions') {
          stage = 'dim';
        } else if (cline === '//names') {
          stage = 'name';
        } else if (cline === '//values') {
          stage = 'value';
          j = 0; // car counter
        }
      } else {

        var vals = line.match(/\S+/g);
        vals[0] = vals[0].substr(1);

        if (stage === 'dim') {
          dims.push(vals[0]);
        } else if (stage === 'name') {
          var name = line.substr(1).match(/[\w\s\d-().\/]+/);
          cars.push([name[0]]);
        } else {

          for(var k = 0; k < dims.length; k++){
            if(vals[k] === 'NA') {
              // remove this car
              cars.splice(j,1);
              j--;
              break;
            }
            cars[j].push( parses[k](vals[k]) );
          }
          j++;
        }
      }
    }
    dims = ['name'].concat(dims);
    var data = {
      type: 'car',
      dimensions: dims,
      dimensionTypes: dimTypes,
      values: cars
    };
    var output = JSON.stringify(data);

    fs.writeFile('car.json', output, function(err) {
    if(err) {
        console.log(err);
    } else {
        console.log('file saved');
    }
});
});