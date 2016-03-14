// Copy resources to the dist folder.

var gulp = require('gulp');
var flatten = require('gulp-flatten');

var paths = require('./paths.js');

gulp.task('copy', function() {
  return gulp.src(paths.html)
    .pipe(gulp.dest(paths.dist + 'html'));
});

gulp.task('copy-doc', function() {
  return gulp.src(paths.docJs)
    .pipe(gulp.dest(paths.dist));
});
