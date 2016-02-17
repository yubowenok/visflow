// Compile the sources using closure-compiler.
var gulp = require('gulp');
var del = require('del');
var runSequence = require('run-sequence');
var closureCompiler = require('gulp-closure-compiler');
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

var compilerPath = 'node_modules/google-closure-compiler/compiler.jar';
var closureContrib = 'node_modules/google-closure-compiler/contrib/';
var closureExterns = closureContrib + 'externs/';

var externs = [
  closureExterns + 'jquery-1.9.js',
  closureExterns + 'underscore-1.5.2.js'
].concat(paths.externs);

var compile = function(cb, src) {
  return gulp.src(src)
    .pipe(closureCompiler({
      compilerPath: compilerPath,
      fileName: 'visflow.js',
      compilerFlags: {
        jscomp_error: jscompErrors,
        jscomp_warning: jscompWarnings,
        compilation_level: 'SIMPLE_OPTIMIZATIONS',
        externs: externs,
        output_wrapper: '(function(){%output%}).call(window);'
      }
    }).on('error', function() {
      del([
        'visflow.js'
      ]);
    }));
};

// Virtual compilation: no output file is created.
gulp.task('closure-compile-dev', function(cb) {
  return compile(cb, paths.srcDev);
});

gulp.task('compile', function(cb) {
  return compile(cb, paths.src)
    .pipe(gulp.dest(paths.dist));
});

gulp.task('compile-concat', function() {
  return gulp.src(paths.srcDev)
    .pipe(concat('visflow.js'))
    .pipe(gulp.dest(paths.dist));
});

gulp.task('compile-dev', function(cb) {
  runSequence(
    ['closure-compile-dev', 'compile-concat'],
    cb);
});

gulp.task('compile-all', function(cb) {
  runSequence('compile', 'compile-dev', cb);
});
