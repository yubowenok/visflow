/**
 * @fileoverview Data source save record.
 */

/**
 * @param {{
 *   dataSelected: (string|undefined),
 *   dataFile: (string|undefined),
 *   dataName: (string|undefined),
 *   useServerData: (boolean|undefined),
 *   data: !Array<{file: string, name: string, isServerData: boolean}>
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

  /** @type {boolean|undefined} */
  this.useServerData = params.useServerData;

  /** @type {!Array<{file: string, name: string, isServerData: boolean}>} */
  this.data = params.data;
};

_.inherit(visflow.save.DataSource, visflow.save.Node);
