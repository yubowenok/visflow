/**
 * @fileoverview Scales used by VisFlow.
 */

/** @const */
visflow.scales = {};

/**
 * VisFlow scale type.
 * @enum {number}
 */
visflow.ScaleType = {
  NUMERICAL: 0,
  ORDINAL: 1,
  TIME: 2,
  UNKNOWN: -1
};

/**
 * @typedef {{
 *   scale: d3.Scale,
 *   id: string,
 *   text: string,
 *   contrastColor: string,
 *   gradientDiv: !jQuery
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
    range: d3.scaleOrdinal(d3.schemeCategory10).range(),
    isOrdinal: true
  }
};

/**
 * Gets an array list of color scales.
 * @return {!Array<visflow.Scale>}
 */
visflow.scales.getColorScales = function() {
  var list = [];
  for (var id in visflow.scales.SPECS_) {
    list.push(visflow.scales[id]);
  }
  return list;
};

/**
 * Initializes the scales.
 */
visflow.scales.init = function() {
  for (var id in visflow.scales.SPECS_) {
    var spec = visflow.scales.SPECS_[id];
    var gradientDiv = $('<div></div>')
      .addClass('gradient-div');
    var gradient = 'linear-gradient(to right,';

    var domain = spec.domain;
    var range = spec.range;

    // Generate gradient div and set domain/range for category scale.
    switch (spec.type) {
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
    switch (spec.type) {
      case 'color':
        scale = d3.scaleLinear()
          .domain(domain)
          .range(range);
        break;
      case 'color-category10':
        scale = d3.scaleOrdinal(d3.schemeCategory10)
          .domain(spec.domain);
        break;
    }
    gradient += ')';
    gradientDiv.css('background', gradient);

    visflow.scales[id] = {
      id: id,
      text: spec.text,
      scale: scale,
      contrastColor: spec.contrastColor,
      gradientDiv: gradientDiv,
      isOrdinal: spec.isOrdinal
    };
  }
};


/**
 * Gets a scale with domain set based on value types.
 * @param {!visflow.Data} data Data the scale is for.
 * @param {number} dim Dimension index of the data to process.
 * @param {!Object<boolean>} items Collection of items the scale is for.
 * @param {!Array<number>} range Range of the scale.
 * @param {{
 *   domainMargin: (number|undefined),
 *   rangeMargin: (number|undefined),
 *   ordinalRangeType: (string|undefined),
 *   ordinalPadding: (number|undefined),
 *   ordinalRange: (boolean|undefined)
 * }=} opt_params
 *   domainMargin: Margin percentage, this has no effect if domain span is zero.
 *   rangeMargin: Margin percentage, this has no effect if range span is zero.
 *   ordinalRangeType: rangePoints, rangeBands, rangeRoundBands.
 *   ordinalPadding: Padding used for ordinal range.
 *   ordinalRange: Whether to use d3.range(length) for ordinal scale's range.
 * @return {{
 *   scale: d3.Scale,
 *   type: !visflow.ScaleType
 * }}
 */
visflow.scales.getScale = function(data, dim, items, range, opt_params) {
  var params = opt_params == null ? {} : opt_params;
  var dimType = dim == visflow.data.INDEX_DIM ?
      visflow.ValueType.INT : data.dimensionTypes[dim];

  var domainMargin = params.domainMargin == null ? 0 : params.domainMargin;
  var rangeMargin = params.rangeMargin;
  if (rangeMargin != null) {
    // Make a copy.
    range = [range[0], range[1]];
    var span = range[1] - range[0];
    range[0] -= span * rangeMargin;
    range[1] += span * rangeMargin;
  }

  var scaleType;
  switch (dimType) {
    case visflow.ValueType.INT:
    case visflow.ValueType.FLOAT:
      scaleType = visflow.ScaleType.NUMERICAL;
      break;
    case visflow.ValueType.TIME:
      scaleType = visflow.ScaleType.TIME;
      break;
    default:
      scaleType = visflow.ScaleType.ORDINAL;
  }

  var values = _.allKeys(items).map(function(index) {
    return dim == visflow.data.INDEX_DIM ? +index : data.values[index][dim];
  });

  var scale;
  switch (scaleType) {
    case visflow.ScaleType.NUMERICAL:
      var minVal = d3.min(values);
      var maxVal = d3.max(values);
      var span = maxVal - minVal;
      if (span == 0) {
        span = 1; // Avoid single-point scale
      }
      scale = d3.scaleLinear()
        .domain([minVal - span * domainMargin, maxVal + span * domainMargin])
        .range(range);
      break;
    case visflow.ScaleType.TIME:
      var minVal = d3.min(values);
      var maxVal = d3.max(values);
      var span = maxVal - minVal;
      scale = d3.scaleTime()
        .domain([minVal - span * domainMargin, maxVal + span * domainMargin])
        .range(range);
      break;
    case visflow.ScaleType.ORDINAL:
      values = [];
      for (var itemIndex in items) {
        values.push(data.values[+itemIndex][dim]);
      }
      var uniqValues = _.uniq(values).sort();

      if (params.ordinalRange) {
        scale = d3.scaleOrdinal()
          .domain(uniqValues)
          .range(d3.range(uniqValues.length));
      } else {
        var ordinalPadding = params.ordinalPadding != null ?
          params.ordinalPadding : 0;
        switch (params.ordinalRangeType) {
          case 'rangeBands':
            scale = d3.scaleBand();
            scale.paddingOuter(ordinalPadding);
            break;
          case 'rangeRoundBands':
            scale = d3.scaleBand();
            scale.round(true);
            scale.paddingOuter(ordinalPadding);
            break;
          default:
            scale = d3.scalePoint();
            scale.padding(ordinalPadding);
        }
        scale.domain(uniqValues)
          .range(range);
      }
      break;
  }
  return {
    scale: scale,
    type: scaleType
  };
};
