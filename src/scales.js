/**
 * @fileoverview Scales used by VisFlow.
 */

/** @const */
visflow.scales = {};

/**
 * 'numerical', 'ordinal'
 * @typedef {string}
 */
visflow.ScaleType;

/**
 * @typedef {{
 *   scale: !d3.scale,
 *   id: string,
 *   text: string,
 *   contrastColor: string
 * }}
 */
visflow.Scale;

/** @typedef {string} */
visflow.ScaleId;

/**
 * Specification used to create scale objects under visflow.scale.
 * @private @const
 */
visflow.scales.SPECS_ = {
  redGreen: {
    text: 'Red-Green',
    type: 'color',
    property: 'color',
    contrastColor: 'white',
    domain: [0.0, 0.5, 1.0],
    range: ['red', '#333', 'green']
  },
  CWYR: {
    text: 'CWYR',
    type: 'color',
    property: 'color',
    contrastColor: 'black',
    domain: [0.0, 0.25, 0.5, 0.75, 1.0],
    range: ['cyan', '#d5e9f0', 'white', 'yellow', 'red']
  },
  monochrome: {
    text: 'Monochrome',
    type: 'color',
    property: 'color',
    domain: [0.0, 1.0],
    range: ['black', 'white']
  },
  redYellow: {
    text: 'Red-Yellow',
    type: 'color',
    property: 'color',
    contrastColor: 'black',
    domain: [0.0, 0.5, 1.0],
    range: ['red', '#333', 'yellow']
  },
  yellowBlue: {
    text: 'Yellow-Blue',
    type: 'color',
    property: 'color',
    contrastColor: 'black',
    domain: [0.0, 0.5, 1.0],
    range: ['yellow', '#333', 'blue']
  },
  categorical: {
    text: 'Categorical',
    type: 'color-category10',
    property: 'color',
    contrastColor: 'black',
    domain: d3.range(10),
    range: d3.scale.category10().range()
  }
};

/**
 * Initializes the scales.
 */
visflow.scales.init = function() {
  for (var id in visflow.scales.SPECS_) {
    var spec = visflow.scales.SPECS_[id];
    var gradientDiv = $('<div></div>')
      .addClass('scale-div');
    var gradient = 'linear-gradient(to right,';

    var domain = spec.domain;
    var range = spec.range;

    // Generate gradient div and set domain/range for category scale.
    switch(spec.type) {
      case 'color':
        // Gradient div does not support uneven scales.
        gradient += spec.range.join(',');
        break;
      case 'color-category10':
        gradient += range.map(function(val, index) {
          return val + ' ' + (index * 100 / range.length) + '%,' +
              val + ' ' + ((index + 1) * 100 / range.length) + '%';
        }).join(',');
        break;
    }
    var scale;
    switch(spec.type) {
      case 'color':
        scale = d3.scale.linear()
          .domain(domain)
          .range(range);
        break;
      case 'color-category10':
        scale = d3.scale.category10();
        break;
    }

    gradient += ')';
    gradientDiv.css('background', gradient);
    visflow.scales[id] = {
      id: id,
      text: spec.text,
      scale: scale,
      contrastColor: spec.contrastColor
    };
  }
};
