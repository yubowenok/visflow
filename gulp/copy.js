// Copy resources to the dist folder.

var gulp = require('gulp');
var flatten = require('gulp-flatten');

var paths = require('./paths.js');

gulp.task('copy-imgs', function() {
  return gulp.src(paths.imgs)
    .pipe(gulp.dest(paths.dist + 'css/imgs'));
});

gulp.task('copy-html', function() {
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

gulp.task('copy-fonts', function() {
  return gulp.src(paths.fonts)
    .pipe(gulp.dest(paths.dist + 'fonts'));
});


gulp.task('copy', ['copy-imgs', 'copy-html', 'copy-fonts']);

gulp.task('copy-doc', ['copy-doc-js', 'copy-doc-imgs', 'copy-fonts']);
