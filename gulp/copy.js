// Copy resources to the dist folder.

var gulp = require('gulp');
var flatten = require('gulp-flatten');

var paths = require('./paths.js');

gulp.task('copy', function() {
  return gulp.src(paths.html)
    .pipe(flatten())
    .pipe(gulp.dest(paths.dist + 'html'));
});
