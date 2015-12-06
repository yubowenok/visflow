/**
 * @fileoverview VisFlow selection port.
 */

'use strict';

/**
 * @param params
 * @constructor
 * @extends {visflow.Port}
 */
visflow.SelectionPort = function(params) {
  var params = _.extend(
    {
      isInput: false,
      isConstants: false,
      text: 'selected'
    },
    params
  );
  visflow.SelectionPort.base.constructor.call(this, params);
};

visflow.utils.inherit(visflow.SelectionPort, visflow.MultiplePort);

/** @inheritDoc */
visflow.SelectionPort.prototype.setContainer = function(container) {
  visflow.SelectionPort.base.setContainer.call(this, container);
  container.find('.port-icon').addClass('selection');
};
