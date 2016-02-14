// Sass build the css.
var gulp = require('gulp');
var sass = require('gulp-sass');
var flatten = require('gulp-flatten');
var concat = require('gulp-concat');
var autoprefixer = require('gulp-autoprefixer');

var paths = require('./paths.js');

var runSass = function(cb, compressed) {
  return gulp.src(paths.scss)
    .pipe(concat('visflow.scss')
      .on('error', function(err) {
        cb(err);
      }))
    .pipe(flatten()
      .on('error', function(err) {
        cb(err);
      }))
    .pipe(sass({
      outputStyle: compressed ? 'compressed' : ''
    }).on('error', sass.logError))
    .pipe(autoprefixer())
    .pipe(gulp.dest(paths.dist));
};

gulp.task('sass', function(cb) {
  return runSass(cb, true);
});

gulp.task('sass-dev', function(cb) {
  return runSass(cb, false);
});
