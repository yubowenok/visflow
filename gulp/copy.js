// Copy resources to the dist folder.

var gulp = require('gulp');
var flatten = require('gulp-flatten');

var paths = require('./paths.js');

gulp.task('copy', function() {
  return gulp.src(paths.html)
    .pipe(gulp.dest(paths.dist + 'html'));
});

gulp.task('copy-doc-js', function() {
  return gulp.src(paths.docJs)
    .pipe(gulp.dest(paths.dist));
});

gulp.task('copy-doc-imgs', function() {
  return gulp.src(paths.docImgs)
    .pipe(gulp.dest(paths.dist + 'doc'));
});

gulp.task('copy-doc', ['copy-doc-js', 'copy-doc-imgs']);
