/**
 * @fileoverview VisFlow right side panel.
 */

/** @const */
visflow.sidePanel = {};

/** @const {number} */
visflow.sidePanel.COLLAPSED_WIDTH = 32;
/** @const {number} */
visflow.sidePanel.TRANSITION_TIME = 250;

/**
 * Whether the panel is toggled on.
 * @private {boolean}
 */
visflow.sidePanel.showPanel_ = true;

/**
 * Side panel container.
 * @private {jQuery}
 */
visflow.sidePanel.container_ = null;

/**
 * Initializes the side panel.
 */
visflow.sidePanel.init = function(e) {
  this.container_ = $('#side-panel');
  this.container_.children('#btn-toggle').click(function() {
    this.togglePanel_();
  }.bind(this));
};

/**
 * Gets the current width of the side panel. This is used to set the
 * horizontal panel offset (right parameter).
 * @return {number} Current width of the panel.
 * @private
 */
visflow.sidePanel.getWidth_ = function() {
  return this.container_.find('.tab-content').outerWidth() +
    this.COLLAPSED_WIDTH;
};

/**
 * Toggles the side panel.
 * @private
 */
visflow.sidePanel.togglePanel_ = function() {
  this.container_.toggleClass('active');
  this.showPanel_ = !this.showPanel_;
  var rightValue = this.showPanel_ ?
    0 : -(this.getWidth_() - this.COLLAPSED_WIDTH);
  this.container_.animate({
    right: rightValue + 'px'
  }, {
    duration: this.TRANSITION_TIME,
    complete: function() {
      $('#icon-button')
        .toggleClass('glyphicon-chevron-right glyphicon-chevron-left');
    }.bind(this)
  });
};

/**
 * Creates a panel for a newly create node.
 * @param {!visflow.Node} node
 */
visflow.sidePanel.addPanel = function(node) {
};

/**
 * Removes the panel associated with a node.
 * @param {!visflow.Node} node
 */
visflow.sidePanel.removePanel = function(node) {
};
