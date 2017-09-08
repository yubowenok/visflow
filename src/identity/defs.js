/**
 * @fileoverview Identity defs.
 */

/** @inheritDoc */
visflow.Identity.prototype.NODE_CLASS = 'identity';

/** @inheritDoc */
visflow.Identity.prototype.DEFAULT_LABEL = 'Identity';

/**
 * Identity mimics async data processing.
 * @inheritDoc
 */
visflow.Identity.prototype.isAsyncProcess = true;

/**
 * Identity nodes specific options.
 * @return {!visflow.options.Node}
 */
visflow.Identity.prototype.identityOptions = function() {
  return new visflow.options.Node({});
};

/** @inheritDoc */
visflow.Identity.prototype.contextMenuItems = function() {
  var items = visflow.Identity.base.contextMenuItems();
  return items.concat([
  ]);
};

