// Compile the sources using closure-compiler.
var gulp = require('gulp');
var del = require('del');
var runSequence = require('run-sequence');
var closureCompiler = require('google-closure-compiler').gulp();
var concat = require('gulp-concat');

var paths = require('./paths.js');

var jscompErrors = [
  'checkVars',
  'duplicate',
  'undefinedVars'
];

var jscompWarnings = [
  'checkTypes',
  'globalThis',
  'missingProperties',
  'undefinedNames'
];

var closureContrib = 'node_modules/google-closure-compiler/contrib/';
var closureExterns = closureContrib + 'externs/';

var externs = [
  closureExterns + 'jquery-1.9.js',
  closureExterns + 'underscore-1.5.2.js'
].concat(paths.externs);


gulp.task('externs', function(cb, src) {
  return gulp.src(externs)
    .pipe(concat('externs.js'))
    .pipe(gulp.dest(paths.dist));
});

var compile = function(cb, src) {
  return gulp.src(src)
    .pipe(closureCompiler({
      js_output_file: 'visflow.js',
      jscomp_error: jscompErrors,
      jscomp_warning: jscompWarnings,
      compilation_level: 'SIMPLE_OPTIMIZATIONS',
      externs: paths.dist + '/externs.js',
      output_wrapper: '(function(){%output%}).call(window);'
    }).on('error', function(err) {
      del([
        'visflow.js'
      ]);
      cb(err);
    }));
};

gulp.task('closure-compile', function(cb) {
  return compile(cb, paths.src)
    .pipe(gulp.dest(paths.dist));
});

// Virtual compilation: no output file is created.
gulp.task('closure-compile-no-output', function(cb) {
  return compile(cb, paths.srcDev);
});

gulp.task('closure-compile-concat', function() {
  return gulp.src(paths.srcDev)
    .pipe(concat('visflow.js'))
    .pipe(gulp.dest(paths.dist));
});

// Really compiles.
gulp.task('compile', function(cb) {
  runSequence('externs', 'closure-compile', cb);
});

// Runs closure compiler but produces concatenated outputs.
gulp.task('compile-dev', function(cb) {
  runSequence('externs', 'closure-compile-no-output',
    'closure-compile-concat', cb);
});

// Does not run closure compiler and produces concatenated outputs.
gulp.task('compile-concat', function(cb) {
  runSequence('externs', 'closure-compile-concat', cb);
});
