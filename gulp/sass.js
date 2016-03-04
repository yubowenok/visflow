// Sass build the css.
var gulp = require('gulp');
var sass = require('gulp-sass');
var flatten = require('gulp-flatten');
var concat = require('gulp-concat');
var autoprefixer = require('gulp-autoprefixer');

var paths = require('./paths.js');

var runSass = function(cb, path, outputFile, compressed) {
  return gulp.src(path)
    .pipe(concat(outputFile)
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
  return runSass(cb, paths.scss, 'visflow.css', true);
});

gulp.task('sass-dev', function(cb) {
  return runSass(cb, paths.scss, 'visflow.css', false);
});

gulp.task('sass-doc', function(cb) {
  return runSass(cb, paths.docScss, 'doc.css', false);
});
