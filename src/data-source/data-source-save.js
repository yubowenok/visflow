/**
 * @fileoverview Data source save record.
 */

/**
 * @param {{
 *   dataSelected: (string|undefined),
 *   dataFile: (string|undefined),
 *   dataName: (string|undefined),
 *   data: !Array<visflow.data.Info>
 * }} params
 * @constructor
 * @extends {visflow.save.Node}
 */
visflow.save.DataSource = function(params) {
  visflow.save.DataSource.base.constructor.call(this, params);

  /** @type {string|undefined} */
  this.dataSelected = params.dataSelected;

  /** @type {string|undefined} */
  this.dataFile = params.dataFile;

  /** @type {string|undefined} */
  this.dataName = params.dataName;

  /** @type {!Array<visflow.data.Info>} */
  this.data = params.data;
};

_.inherit(visflow.save.DataSource, visflow.save.Node);
