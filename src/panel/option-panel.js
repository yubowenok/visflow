/**
 * @fileoverview VisFlow right option panel.
 */

/** @const */
visflow.optionPanel = {};

/** @const {number} */
visflow.optionPanel.COLLAPSED_WIDTH = 32;
/** @const {number} */
visflow.optionPanel.TRANSITION_TIME = 250;

/**
 * Whether the panel is toggled on.
 * @private {boolean}
 */
visflow.optionPanel.showPanel_ = true;

/**
 * Option panel container.
 * @private {jQuery}
 */
visflow.optionPanel.container_ = null;

/**
 * Initializes the option panel.
 */
visflow.optionPanel.init = function() {
  this.container_ = $('#option-panel');
  this.container_.children('#btn-toggle').click(function() {
    this.togglePanel_();
  }.bind(this));
};

/**
 * Gets the current width of the option panel. This is used to set the
 * horizontal panel offset (right parameter).
 * @return {number} Current width of the panel.
 * @private
 */
visflow.optionPanel.getWidth_ = function() {
  return this.container_.find('.tab-content').outerWidth() +
    this.COLLAPSED_WIDTH;
};

/**
 * Toggles the option panel.
 * @private
 */
visflow.optionPanel.togglePanel_ = function() {
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
visflow.optionPanel.addPanel = function(node) {
};

/**
 * Removes the panel associated with a node.
 * @param {!visflow.Node} node
 */
visflow.optionPanel.removePanel = function(node) {
};
