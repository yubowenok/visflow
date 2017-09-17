var gulp = require('gulp');

var runSequence = require('run-sequence');
var requireDir = require('require-dir');

var paths = require('./gulp/paths.js');

requireDir('./gulp', {recurse: true});

// Watch the sources and automatically rebuild when files change.
gulp.task('watch', function() {
  gulp.watch([
    'index.html',
    paths.src,
    paths.srcDev,
    paths.scss,
    paths.docJs,
    paths.docScss,
    paths.externs,
    paths.html
  ], ['build-dev-express']);
});

gulp.task('watch-doc', function() {
  gulp.watch([
    'doc.html',
    paths.docJs,
    paths.docScss
  ], ['build-doc']);
});

// Dev task. Build without code minification.
gulp.task('dev', ['lint', 'build-dev', 'build-doc']);

// Default task. Build with code minification.
gulp.task('default', ['lint', 'build', 'build-doc']);

// Do everything.
gulp.task('all', function(cb) {
  runSequence(
    'dist',
    'lint',
    ['build', 'build-doc'],
    cb);
});
