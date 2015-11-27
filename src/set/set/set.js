/**
 * @fileoverview VisFlow set base module.
 */

'use strict';

/**
 * @param params
 * @constructor
 * @extends {visflow.Node}
 */
visflow.Set = function(params) {
  visflow.Set.base.constructor.call(this, params);

  /** @inheritDoc */
  this.ports = {
    in: new visflow.Port(this, 'in', 'in-multiple', 'D'),
    out: new visflow.Port(this, 'out', 'out-multiple', 'D')
  };

  /**
   * Stores the last connection index.
   * @type {number}
   */
  // TODO(bowen): check what this is for.
  this.lastConnectionNumber = 0;
};

visflow.utils.inherit(visflow.Set, visflow.Node);

/** @inheritDoc */
visflow.Set.prototype.RESIZABLE = false;
/** @inheritDoc */
visflow.Set.prototype.PANEL_TEMPLATE = './src/set/set/set-panel.html';

/** @inheritDoc */
visflow.Set.prototype.CONTEXTMENU_ITEMS = [
  {id: 'minimize', text: 'Minimize', icon: 'glyphicon glyphicon-minus'},
  {id: 'panel', text: 'Control Panel', icon: 'glyphicon glyphicon-th-list'},
  {id: 'delete', text: 'Delete', icon: 'glyphicon glyphicon-remove'}
];

/** @inheritDoc */
visflow.Set.prototype.init = function() {
  visflow.Set.base.init.call(this);
  this.container.addClass('set');
};

/** @inheritDoc */
visflow.Set.prototype.initPanelHeader = function(container) {
  visflow.Set.base.initPanelHeader.call(this, container);
  container.find('.panel-header').find('#vis-mode').hide();
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
visflow.Set.prototype.show = function() {
  visflow.Set.base.show.call(this);
  this.showIcon();
};
