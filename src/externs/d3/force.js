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
 * @param {number=} arg
 * @return {number}
 */
d3.ForceSimulation.prototype.alpha = function(arg) {};

/**
 * @param {number=} arg
 * @return {number}
 */
d3.ForceSimulation.prototype.alphaMin = function(arg) {};

/**
 * @param {number} arg
 * @return {number}
 */
d3.ForceSimulation.prototype.alphaDecay = function(arg) {};

/**
 * @param {Function} arg
 */
d3.ForceSimulation.prototype.tick = function(arg) {};

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
 * @param {number|Function} arg
 */
d3.ForceLink.prototype.distance = function(arg) {};

/** @typedef {Function} */
d3.ForceManyBody;

/** @return {d3.ForceManyBody} */
d3.forceManyBody = function() {};

/**
 * @param {number|Function} arg
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

/** @typedef {Function} */
d3.ForceCollide;

/** @return {d3.ForceCollide} */
d3.forceCollide = function() {};

/**
 * @param {number} arg
 */
d3.ForceCollide.prototype.iterations = function(arg) {};

/**
 * @param {number|Function} arg
 */
d3.ForceCollide.prototype.radius = function(arg) {};


// Positioning forces

/** @typedef {Function} */
d3.ForceX;

/** @return {d3.ForceX} */
d3.forceX = function() {};

/**
 * @param {number|function(): number} arg
 */
d3.ForceX.prototype.x = function(arg) {};

/**
 * @param {number|function(): number} arg
 */
d3.ForceX.prototype.strength = function(arg) {};

/** @typedef {Function} */
d3.ForceY;

/** @return {d3.ForceX} */
d3.forceY = function() {};

/**
 * @param {number|function(): number} arg
 */
d3.ForceY.prototype.y = function(arg) {};

/**
 * @param {number|function(): number} arg
 */
d3.ForceY.prototype.strength = function(arg) {};
