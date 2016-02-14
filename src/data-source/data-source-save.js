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
 * @extends {visflow.Node.Save}
 */
visflow.DataSource.Save = function(params) {
  visflow.DataSource.Save.base.constructor.call(this, params);

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

visflow.utils.inherit(visflow.DataSource.Save, visflow.Node.Save);
