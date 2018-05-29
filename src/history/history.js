/**
 * @fileoverview VisFlow history manager to support undo and redo.
 * Histories are stored only in memory and lost when the page reloads.
 */

/** @const */
visflow.history = {};

/** @enum {number} */
visflow.history.Type = {
  NODE_ADD: 0,
  NODE_REMOVE: 1,
  NODE_MOVE: 2,

  EDGE_ADD: 3,
  EDGE_REMOVE: 4,

  // A batch action is a list of multiple actions.
  // An NLP command executes multiple actions.
  BATCH: -1
};

/**
 * Structure of the stack
 *  [ possible undo's -- current -- possible redo's ]
 *                          ^
 * moves left when undo <- top -> moves right when redo
 *
 * If a record is pushed, clear the redo stack after it.
 * @type {!Array<!visflow.HistoryRecord>}
 */
visflow.history.records = [];

/**
 * Pointer to the top element in the history record.
 * @private {number}
 */
visflow.history.top_ = -1;

/**
 * Records an action type.
 * @param {!visflow.HistoryRecord} record
 */
visflow.history.push = function(record) {
  visflow.history.records[++visflow.history.top_] = record;
  // Remove trailing entries. Clear possible redos.
  visflow.history.records.splice(visflow.history.top_ + 1);
  visflow.signal(visflow.history, visflow.Event.PUSH);
};

/**
 * Executes the record on the redo stack.
 * Moves forward top pointer by one in the stack.
 */
visflow.history.redo = function() {
  visflow.history.execute_(visflow.history.top_++);
  if (visflow.history.records[visflow.history.top_] == null) {
    visflow.signal(visflow.history, visflow.Event.NO_REDO);
  }
};

/**
 * Reverse executes the record on the undo stack.
 * Moves backward top pointer by one in the stack.
 */
visflow.history.undo = function() {
  visflow.history.reverseExecute_(visflow.history.top_--);
  if (visflow.history.top_ < 0) {
    visflow.signal(visflow.history, visflow.Event.NO_UNDO);
  }
};

/**
 * Executes the record pointed by pointer.
 * @param {number} pointer
 * @private
 */
visflow.history.execute_ = function(pointer) {
  if (visflow.history.records[pointer] == null) {
    console.error('history pointer out of range');
    return;
  }
  // TODO(bowen): execute the record
};

/**
 * Reverse executes (undo) the record pointed by pointer.
 * @param {number} pointer
 * @private
 */
visflow.history.reverseExecute_ = function(pointer) {
  if (visflow.history.records[pointer] == null) {
    console.error('history pointer out of range');
    return;
  }
  // TODO(bowen): reverse execute the record
};

/**
 * Clears the history stack.
 */
visflow.history.clear = function() {
  visflow.history.records = [];
  visflow.history.top_ = -1;
};
