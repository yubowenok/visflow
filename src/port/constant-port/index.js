/**
 * @fileoverview Port for VisFlow subset flow constants.
 * TODO(bowen): separate subset port from constant port so that we don't do
 * nasty pack distinguishing.
 */

/**
 * ConstantPort constructor.
 * @param {visflow.params.Port} params
 * @extends {visflow.Port}
 * @constructor
 */
visflow.ConstantPort = function(params) {
};

/** @const {boolean} */
visflow.ConstantPort.prototype.IS_CONSTANT_PORT = true;
