/**
 * @fileoverview Node save record.
 */

/**
 * @param {{
 *   visModeOn: (boolean|undefined),
 *   labelOn: (boolean|undefined),
 *   detailsOn: (boolean|undefined),
 *   label: string,
 *   css: !Object<string|number>,
 *   visCss: !Object<string|number>,
 *   options: !Object
 * }} params
 * @constructor
 */
visflow.save.Node = function(params) {
  /** @type {boolean|undefined} */
  this.visModeOn = params.visModeOn;

  /** @type {boolean|undefined} */
  this.labelOn = params.labelOn;

  /** @type {boolean|undefined} */
  this.detailsOn = params.detailsOn;

  /** @type {string} */
  this.label = params.label;

  /** @type {!Object<string|number>} */
  this.css = params.css;

  /** @type {!Object<string|number>} */
  this.visCss = params.visCss;

  /** @type {!Object} */
  this.options = params.options;
};
