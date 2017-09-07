/**
 * @fileoverview VisFlow selection port.
 */

/**
 * @param {visflow.params.Port} params
 * @constructor
 * @extends {visflow.MultiSubsetPort}
 */
visflow.SelectionPort = function(params) {
  var paramsApplied = _.extend(
    {
      isInput: false,
      text: 'selected'
    },
    params
  );
  visflow.SelectionPort.base.constructor.call(this, paramsApplied);
};

_.inherit(visflow.SelectionPort, visflow.MultiSubsetPort);

/** @inheritDoc */
visflow.SelectionPort.prototype.setContainer = function(container) {
  visflow.SelectionPort.base.setContainer.call(this, container);
  container.find('.port-icon').addClass('selection');
};
