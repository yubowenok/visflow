// Clean and create dist repository.
var gulp = require('gulp');
var del = require('del');
var fs = require('fs');
var paths = require('./paths.js');

// Dist directory structure
var dirs = [
  'dist',
  'dist/html',
  'dist/doc'
];

gulp.task('clean', function() {
  return del([
    paths.dist + '**/*'
  ]);
});

gulp.task('dist', ['clean'], function() {
  dirs.forEach(function(dir) {
    try {
      fs.mkdirSync(dir);
    } catch (err) {
      if (err.code != 'EEXIST') {
        throw err;
      }
    }
  });
});
