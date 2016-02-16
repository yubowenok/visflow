/**
 * @fileoverview DataTables externs.
 */

/**
 * @constructor
 * @return {!DataTables}
 */
function DataTables() {}

/**
 * @param {Object=} arg
 * @return {!DataTables}
 */
jQuery.prototype.DataTable = function(arg) {};

/** @type {?} */
jQuery.prototype.dataTable;

/**
 * @param {number|string} arg
 * @return {!DataTables.Api}
 */
DataTables.prototype.column = function(arg) {};

/**
 * @param {(string|Object)=} arg
 * @return {!DataTables.Api}
 */
DataTables.prototype.rows = function(arg) {};

DataTables.prototype.destroy = function() {};

/**
 * @typedef {!Array<!Object>}
 */
DataTables.Api;

/**
 * @return {!DataTables.Api}
 */
DataTables.Api.prototype.api = function() {};

/**
 * @param {boolean} arg
 */
DataTables.Api.prototype.visible = function(arg) {};

DataTables.Api.prototype.select = function() {};

DataTables.Api.prototype.deselect = function() {};

/**
 * @typedef {Object}
 */
DataTables.Page;

/**
 * @type {DataTables.Page}
 */
DataTables.Api.prototype.page;

/**
 * @return {{
 *   page: number,
 *   pages: number
 * }}
 */
DataTables.Page.prototype.info = function() {};
