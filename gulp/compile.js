// Compile the sources using closure-compiler.
var gulp = require('gulp');
var del = require('del');
var runSequence = require('run-sequence');
var closureCompiler = require('gulp-closure-compiler');

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
      fileName: 'genotet.js',
      compilerFlags: {
        jscomp_error: jscompErrors,
        jscomp_warning: jscompWarnings,
        compilation_level: 'SIMPLE_OPTIMIZATIONS',
        externs: externs,
        output_wrapper: '(function(){%output%}).call(window);'
      }
    }).on('error', function(err) {
      del([
        'visflow.js'
      ]);
      cb(err);
    }));
};

gulp.task('compile', function(cb) {
  return compile(cb, paths.src)
    .pipe(gulp.dest(paths.dist));
});

gulp.task('compile-dev', function(cb) {
  // Virtual compilation: no output file is created.
  return compile(cb, paths.src.concat(paths.dev));
});

gulp.task('compile-all', function(cb) {
  runSequence('compile', 'compile-dev', cb);
});
