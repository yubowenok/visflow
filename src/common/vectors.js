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
visflow.vectors.mirrorPoint = function(p, lp1, lp2) {
  var lineVector = visflow.vectors.normalizeVector(
    visflow.vectors.subtractVector(lp2, lp1));
  var projectedOffset = visflow.vectors.dotVector(
    visflow.vectors.subtractVector(p, lp1), lineVector);
  var d = visflow.vectors.multiplyVector(lineVector, projectedOffset);
  var m = visflow.vectors.addVector(lp1, d);
  var offset = visflow.vectors.subtractVector(m, p);
  return visflow.vectors.addVector(m, offset);
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
 * @return {visflow.Vector2}
 */
visflow.vectors.perpendicularVector = function(p) {
  return [p[1], -p[0]];
};

/**
 * Normalize a vector.
 * @param {visflow.Vector2} p
 * @return {visflow.Vector2}
 */
visflow.vectors.normalizeVector = function(p) {
  var len = visflow.vectors.vectorLength(p);
  return visflow.vectors.multiplyVector(p, 1 / len);
};

/**
 * Gets the length of a vector.
 * @param {visflow.Vector2} p Input vector.
 * @return {number}
 */
visflow.vectors.vectorLength = function(p) {
  return Math.sqrt(p[0] * p[0] + p[1] * p[1]);
};

/**
 * Compute the distance between two 2D points
 * @param {visflow.Vector2} p1 Point 1.
 * @param {visflow.Vector2} p2 Point 2.
 * @return {number}
 */
visflow.vectors.vectorDistance = function(p1, p2) {
  return visflow.vectors.vectorLength(
    visflow.vectors.subtractVector(p1, p2));
};

/**
 * Adds two 2D vectors.
 * @param {visflow.Vector2} p1 Vector 1.
 * @param {visflow.Vector2} p2 Vector 2.
 * @return {visflow.Vector2}
 */
visflow.vectors.addVector = function(p1, p2) {
  return [p1[0] + p2[0], p1[1] + p2[1]];
};

/**
 * Subtracts a 2D vector from another.
 * @param {visflow.Vector2} p1 Vector 1.
 * @param {visflow.Vector2} p2 Vector 2.
 * @return {visflow.Vector2}
 */
visflow.vectors.subtractVector = function(p1, p2) {
  return [p1[0] - p2[0], p1[1] - p2[1]];
};

/**
 * Multiply a 2D vector by a constant.
 * @param {visflow.Vector2} p Input vector.
 * @param {number} k Input constant.
 * @return {visflow.Vector2}
 */
visflow.vectors.multiplyVector = function(p, k) {
  return [p[0] * k, p[1] * k];
};
