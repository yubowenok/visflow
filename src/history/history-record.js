/**
 * A single record of an action in the history.
 * @param {visflow.history.Type} type
 * @param {*} data
 * @constructor
 */
visflow.HistoryRecord = function(type, data) {
  /** @type {visflow.history.Type} */
  this.type = type;

  /**
   * Data that is associated with the record.
   * Data type varies among different history actions.
   * @type {*}
   */
  this.data = data;
};

/**
 * Executes the history record.
 */
visflow.HistoryRecord.prototype.execute = function() {};

/**
 * Reverse executes (undo) the history record.
 */
visflow.HistoryRecord.prototype.reverseExecute = function() {};