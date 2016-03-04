// Lint js sources.
var gulp = require('gulp');
var gjslint = require('gulp-gjslint');
var scsslint = require('gulp-scss-lint');
var scssStylish = require('gulp-scss-lint-stylish2');
var gutil = require('gulp-util');

var paths = require('./paths.js');

gulp.task('lint-js', function(cb) {
  return gulp.src(paths.srcDev)
    .pipe(gjslint({
      customReport: function(file, ss) {
        console.log(file, ss);
      }
    }))
    .pipe(gjslint.reporter('console'))
    .pipe(gjslint.reporter('fail'))
    .on('error', function(err) {
      cb(err);
    });
});

gulp.task('lint-gulp', function(cb) {
  return gulp.src(paths.gulpTasks)
    .pipe(gjslint())
    .pipe(gjslint.reporter('console'))
    .pipe(gjslint.reporter('fail'))
    .on('error', function(err) {
      cb(err);
    });
});

/** @const {string} */
var SELECTOR_FORMAT_IGNORES = [
  '`select2.*`',
  '`dataTables.*`',
  '`paginate_button`'
];

/**
 * Checks if the scss-lint selectorFormat warning has keywords that we should
 * ignore.
 * @param {string} reason scss-lint reason.
 * @return {boolean} Whether the scss warning shall be filtered.
 */
var selectorFormatFilter = function(reason) {
  for (var i = 0; i < SELECTOR_FORMAT_IGNORES.length; i++) {
    var ignore = RegExp(SELECTOR_FORMAT_IGNORES[i]);
    if (reason.match(ignore) != null) {
      return true;
    }
  }
  return false;
};

gulp.task('lint-scss', function(cb) {
  var reporter = scssStylish();
  var reporterWrapper = function(file, stream) {
    var hasCriticalWarning = false;
    var issues = file.scsslint.issues;
    issues.forEach(function(issue) {
      if (issue.severity == 'warning') {
        var filtered = false;
        if (issue.linter == 'SelectorFormat') {
          filtered = selectorFormatFilter(issue.reason);
        }
        if (filtered) {
          issue.filtered = true;
          file.scsslint.warnings--;
          return;
        }
        hasCriticalWarning = true;
      }
    });
    file.scsslint.issues = issues.filter(function(issue) {
      return !issue.filtered;
    });
    if (file.scsslint.warnings || file.scsslint.errors) {
      reporter.issues(file, stream);
    }
    if (hasCriticalWarning) {
      stream.emit('error', new gutil.PluginError('scss-lint', 'scss-lint has ' +
        'critical warnings'));
    }
  };
  return gulp.src(paths.scss.concat(paths.docScss))
    .pipe(scsslint({
      config: 'gulp/scss-lint.yml',
      customReport: reporterWrapper
    }).on('error', function(err) {
      cb(err);
    }))
    .pipe(scsslint.failReporter('E'));
});

gulp.task('lint', [
  'lint-js',
  'lint-gulp',
  'lint-scss'
]);
