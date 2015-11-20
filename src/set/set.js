/**
 * @fileoverview VisFlow set base module.
 */

'use strict';

/**
 * @param params
 * @constructor
 */
visflow.Set = function(params) {
  visflow.Set.base.constructor.call(this, params);

  /** @inheritDoc */
  this.ports = {
    in: new visflow.Port(this, 'in', 'in-multiple', 'D'),
    out: new visflow.Port(this, 'out', 'out-multiple', 'D')
  };

  this.lastConnectionNumber = 0;
};

visflow.utils.inherit(visflow.Set, visflow.Node);

/** @inheritDoc */
visflow.Set.prototype.SHAPE_CLASS = 'set';

/** @inheritDoc */
visflow.Set.prototype.contextmenuDisabled = {
  details: true,
  options: true
};

/**
 * Handles in port change event. This may be because of removed connections.
 */
visflow.Set.prototype.inPortsChanged = function() {
  if (this.lastConnectionNumber != this.ports['in'].connections.length) {
    this.lastConnectionNumber = this.ports['in'].connections.length;
    return true;
  }
  return visflow.Set.base.inPortsChanged.call(this);
};

/** @inheritDoc */
visflow.Set.prototype.showDetails = function() {
  visflow.Set.base.showDetails.call(this);
};

/** @inheritDoc */
visflow.Set.prototype.show = function() {
  visflow.Set.base.show.call(this);
};


