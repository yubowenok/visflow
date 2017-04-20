// Build tasks
var gulp = require('gulp');
var runSequence = require('run-sequence');

// Build with code minification.
gulp.task('build', function(cb) {
  runSequence(
    'dist',
    'compile',
    ['copy', 'css'],
    cb);
});

// Build without code minification.
gulp.task('build-dev', function(cb) {
  runSequence(
    'dist',
    'compile-dev',
    ['copy', 'css-dev'],
    cb);
});

// Build doc.
gulp.task('build-doc', function(cb) {
  runSequence(
    'sass-doc',
    'copy-doc',
    cb);
});

gulp.task('default', ['build']);
