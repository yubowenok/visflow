/**
 * @fileoverview Data namespace and registry. Data registry is used to avoid
 * reloading the same dataset.
 */

/**
 * @typedef {{
 *   dimensions: !Array<string>,
 *   dimensionTypes: !Array<visflow.ValueType>,
 *   dimensionDuplicate: !Array<boolean>,
 *   values: !Array<!Array<string|number>>,
 *   type: string,
 *   name: string,
 *   file: string,
 *   hash: string
 * }}
 */
visflow.TabularData;

/** @const */
visflow.data = {};

/**
 * Dimension index of item table index.
 * @const {number}
 */
visflow.data.INDEX_DIM = -1;

/** @const {string} */
visflow.data.INDEX_TEXT = '[index]';

/** @const {string} */
visflow.data.EMPTY_DATA_ID = 'empty';

/**
 * @typedef {{
 *   id: number,
 *   name: string,
 *   file: string
 * }}
 *   id: Data id used by the server.
 *   name: Data name.
 *   file: Data file name.
 */
visflow.data.Info;

/**
 * Listed data info by the server.
 * @typedef {{
 *   id: number,
 *   name: string,
 *   file: string,
 *   mtime: number,
 *   size: number,
 *   shareWith: string,
 *   owner: string
 * }}
 */
visflow.data.ListInfo;

/**
 * Raw data references by the hashed values of their loading info, i.e. name,
 * file. It is considered not possible to duplicate if all
 * these three entries match.
 * @type {!Object<visflow.TabularData>}
 */
visflow.data.infoHashToRawData = {};

/**
 * Returns a hash that uniquely identifies a dataset.
 * If the hash value matches, the data should be the same.
 * @param {visflow.data.Info} dataInfo
 * @return {string}
 */
visflow.data.infoHash = function(dataInfo) {
  // We currently just use the server's data id as primary key.
  return '' + dataInfo.id;
};

/**
 * Checks for duplicate data.
 * @param {visflow.data.Info} dataInfo
 * @return {?visflow.TabularData} null if no duplicate, and the duplicate data
 *   otherwise.
 */
visflow.data.duplicateData = function(dataInfo) {
  var infoHash = visflow.data.infoHash(dataInfo);
  if (infoHash in visflow.data.infoHashToRawData) {
    return visflow.data.infoHashToRawData[infoHash];
  }
  return null;
};

/**
 * Registers the raw data.
 * @param {visflow.data.Info} dataInfo
 * @param {visflow.TabularData} data
 */
visflow.data.registerRawData = function(dataInfo, data) {
  var infoHash = visflow.data.infoHash(dataInfo);
  visflow.data.infoHashToRawData[infoHash] = data;
};

/**
 * Lists the datasets from the server.
 * @param {function(!Array)} done Callback on successful load.
 */
visflow.data.listData = function(done) {
  $.get(visflow.url.LIST_DATA)
    .done(done)
    .fail(function(res) {
      visflow.error('cannot list server data:', res.responseText);
    });
};
