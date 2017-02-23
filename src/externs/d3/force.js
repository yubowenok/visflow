/** @typedef {Function} */
d3.ForceSimulation;

/**
 * @param {Array=} nodes
 * @return {d3.ForceSimulation}
 */
d3.forceSimulation = function(nodes) {};

/**
 * @param {string} arg1
 * @param {*=} arg2
 */
d3.ForceSimulation.prototype.force = function(arg1, arg2) {};

/**
 * @param {number} arg
 */
d3.ForceSimulation.prototype.velocityDecay = function(arg) {};

/**
 * @param {number} x
 * @param {number} y
 */
d3.ForceSimulation.prototype.find = function(x, y) {};

d3.ForceSimulation.prototype.stop = function() {};

d3.ForceSimulation.prototype.restart = function() {};

/** @typedef {Function} */
d3.ForceLink;

/**
 * @param {Array=} links
 * @return {d3.ForceLink}
 */
d3.forceLink = function(links) {};

/**
 * @param {Function} arg
 */
d3.ForceLink.prototype.id = function(arg) {};

/**
 * @param {number} arg
 */
d3.ForceLink.prototype.distance = function(arg) {};

/** @typedef {Function} */
d3.ForceManyBody;

/** @return {d3.ForceManyBody} */
d3.forceManyBody = function() {};

/**
 * @param {number} arg
 */
d3.ForceManyBody.prototype.strength = function(arg) {};

/** @typedef {Function} */
d3.ForceCenter;

/**
 * @param {number} x
 * @param {number} y
 * @return {d3.ForceCenter}
 */
d3.forceCenter = function(x, y) {};


// v3 below
/**
 * @param {!Array<number>} arg
 */
//d3.force.prototype.size = function(arg) {};

/**
 * @param {!Array<*>} arg
 */
//d3.force.prototype.nodes = function(arg) {};

/**
 * @param {number} arg
 */
//d3.force.prototype.friction = function(arg) {};

/**
 * @param {number} arg
 */
//d3.force.prototype.gravity = function(arg) {};

/**
 * @param {number} arg
 */
//d3.force.prototype.linkDistance = function(arg) {};

/**
 * @return {!d3.Drag}
 */
//d3.force.prototype.drag = function() {};
