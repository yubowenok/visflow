// Source, data, path specification.

var orderedSrc = [
  'src/visflow.js',
  'src/common/defs.js',
  'src/common/*.js',
  'src/menu/*.js',
  'src/view-manager.js',
  'src/interaction.js',
  'src/contextmenu/*.js',
  'src/dialog/*.js',
  'src/tooltip/*.js',
  'src/upload/*.js',
  'src/parser.js',

  'src/save.js',
  'src/node/node-save.js',
  'src/**/*save.js',

  'src/options.js',
  'src/node/node-options.js',
  'src/**/*options.js',

  'src/params.js',
  'src/node/node-params.js',
  'src/**/*params.js',

  'src/data/*.js',

  'src/node/**/*.js',
  'src/edge/**/*.js',
  'src/port/port.js',
  'src/port/*.js',

  'src/unit/select/select.js',
  'src/unit/**/*.js',

  'src/panel/**/*.js',

  'src/data-source/data-source.js',
  'src/data-source/*.js',

  'src/property/**/*.js',
  'src/set/**/*.js',
  'src/value/**/*.js',
  'src/filter/**/*.js',

  'src/visualization/visualization.js',
  'src/visualization/*.js',
  'src/visualization/**/*.js',

  'src/diagram.js',
  'src/flow.js',
  'src/launch.js',
  '!src/externs/**/*.js'
];

/** @const */
module.exports = {
  dist: 'dist/',
  src: orderedSrc,
  srcDev: orderedSrc.concat([
    'src/dev/**/*.js'
  ]),
  externs: [
    'src/externs/**/*.js'
  ],
  serverExterns: [
    'server/externs/*.js'
  ],
  scss: [
    '!src/common/documentation.css',
    'src/**/*.scss',
    'src/**/*.css'
  ],
  html: [
    'src/**/*.html'
  ],
  index: ['index.html'],
  gulpTasks: ['gulp/**/*.js']
};
