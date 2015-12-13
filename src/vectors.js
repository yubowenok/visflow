/**
 * @fileoverview VisFlow vector library.
 */

'use strict';

/** @const */
visflow.vectors = {};

/**
 * Vector type of arbitrary length.
 * @typedef {!Array<number>} Vector
 */
visflow.Vector;

/**
 * Vector type of length 2.
 * @typedef {!Array<number>} Vector2
 */
visflow.Vector2;

/**
 * Gets the middle point of two 2D points.
 * @param {visflow.Vector2} p1 Point 1.
 * @param {visflow.Vector2} p2 Point 2.
 * @return {visflow.Vector2} The middle point.
 */
visflow.vectors.middlePoint = function(p1, p2) {
  return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
};

/**
 * Gets the mirrored point of p, with respect to the line (lp1, lp2).
 * The distance of the mirrored point will be k times of the distance
 * from p to (lp1, lp2).
 * @param {visflow.Vector2} p Point to be mirrored.
 * @param {visflow.Vector2} lp1 Point on the line.
 * @param {visflow.Vector2} lp2 Another point on the line.
 * @return {visflow.Vector2} Mirrored point.
 */
visflow.vectors.mirrorPoint = function(p, lp1, lp2, opt_k) {
  var lineVector = this.normalizeVector(this.subtractVector(lp2, lp1));
  var projectedOffset = this.dotVector(
    this.subtractVector(p, lp1), lineVector);
  var d = this.multiplyVector(lineVector, projectedOffset);
  var m = this.addVector(lp1, d);
  var offset = this.subtractVector(m, p);
  return this.addVector(m, offset);
};

/**
 * Gets the dot product of two 2D vectors.
 * @param {visflow.Vector2} p1 Vector 1.
 * @param {visflow.Vector2} p2 Vector 2.
 * @return {number} The dot product.
 */
visflow.vectors.dotVector = function(p1, p2) {
  return p1[0] * p2[0] + p1[1] * p2[1];
};

/**
 * Rotates a vector by 90 degrees counter-clockwise.
 * @param {visflow.Vector2} p Input vector.
 */
visflow.vectors.perpendicularVector = function(p) {
  return [p[1], -p[0]];
};

/**
 * Normalize a vector.
 * @param {visflow.Vector2} p
 */
visflow.vectors.normalizeVector = function(p) {
  var len = this.vectorLength(p);
  return this.multiplyVector(p, 1 / len);
};

/**
 * Gets the length of a vector.
 * @param {visflow.Vector2} p Input vector.
 */
visflow.vectors.vectorLength = function(p) {
  return Math.sqrt(p[0] * p[0] + p[1] * p[1]);
};

/**
 * Compute the distance between two 2D points
 * @param {visflow.Vector2} p1 Point 1.
 * @param {visflow.Vector2} p2 Point 2.
 */
visflow.vectors.vectorDistance = function(p1, p2) {
  return this.vectorLength(this.subtractVector(p1, p2));
};

/**
 * Adds two 2D vectors.
 * @param {visflow.Vector2} p1 Vector 1.
 * @param {visflow.Vector2} p2 Vector 2.
 */
visflow.vectors.addVector = function(p1, p2) {
  return [p1[0] + p2[0], p1[1] + p2[1]];
};

/**
 * Subtracts a 2D vector from another.
 * @param {visflow.Vector2} p1 Vector 1.
 * @param {visflow.Vector2} p2 Vector 2.
 */
visflow.vectors.subtractVector = function(p1, p2) {
  return [p1[0] - p2[0], p1[1] - p2[1]];
};

/**
 * Multiply a 2D vector by a constant.
 * @param {visflow.Vector2} p Input vector.
 * @param {number} k Input constant.
 */
visflow.vectors.multiplyVector = function(p, k) {
  return [p[0] * k, p[1] * k];
};
