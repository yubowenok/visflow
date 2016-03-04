// Build tasks
var gulp = require('gulp');
var runSequence = require('run-sequence');

// Build with code minification.
gulp.task('build', function(cb) {
  runSequence(
    'dist',
    ['copy', 'sass', 'compile'],
    cb);
});

// Build without code minification.
gulp.task('build-dev', function(cb) {
  runSequence(
    'dist',
    'compile-dev',
    [
      'copy',
      'sass-dev'
    ],
    cb);
});

// Build doc.
gulp.task('build-doc', function(cb) {
  runSequence(
    'sass-doc',
    cb);
});
