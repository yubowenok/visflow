// Sass and Less build the css.
var gulp = require('gulp');
var sass = require('gulp-sass');
var less = require('gulp-less');
var flatten = require('gulp-flatten');
var concat = require('gulp-concat');
var autoprefixer = require('gulp-autoprefixer');
var cleanCSS = require('gulp-clean-css');
var gutil = require('gulp-util');

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
    .pipe(gulp.dest(paths.dist + 'css'));
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

var runLess = function(cb, path, outputFile, isDev) {
  var stream = gulp.src(path)
    .pipe(concat(outputFile)
      .on('error', function(err) {
        cb(err);
      }))
    .pipe(flatten()
      .on('error', function(err) {
        cb(err);
      }))
    .pipe(less().on('error', gutil.log));
  if (isDev) {
    stream.pipe(cleanCSS().on('error', gutil.log));
  }
  return stream.pipe(autoprefixer())
      .pipe(gulp.dest(paths.dist + 'css'));
};

gulp.task('less', function(cb) {
  return runLess(cb, paths.less, 'visflow_deps.css', false);
});

gulp.task('less-dev', function(cb) {
  return runLess(cb, paths.less, 'visflow_deps.css', true);
});

gulp.task('css', ['sass', 'less']);

gulp.task('css-dev', ['sass-dev', 'less-dev']);
