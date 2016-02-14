// Source, data, path specification.

/** @const */
module.exports = {
  dist: 'dist/',
  src: [
    '!src/externs/**/*.js',
    'src/visflow.js',
    'src/**/*.js'
  ],
  dev: [
    'dev/**/*.js'
  ],
  externs: [
    'src/externs/**/*.js'
  ],
  serverExterns: [
    'server/externs/*.js'
  ],
  scss: [
    'src/**/*.scss'
  ],
  html: [
    'src/**/*.html'
  ],
  index: ['index.html'],
  gulpTasks: ['gulp/**/*.js']
};
