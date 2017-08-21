// Source, data, path specification.

var orderedSrc = [
  'src/visflow.js',
  'src/common/defs.js',
  'src/common/*.js',
  'src/history/history.js',
  'src/history/*.js',
  'src/menu/*.js',
  'src/view-manager.js',
  'src/interaction.js',
  'src/contextmenu/*.js',
  'src/dialog/*.js',
  'src/tooltip/*.js',
  'src/progress/*.js',
  'src/upload/*.js',
  'src/parser.js',
  'src/user/*.js',
  'src/backdrop/*.js',
  'src/nlp/nlp.js',
  'src/nlp/**/*.js',

  'src/save.js',
  'src/node/save.js',
  'src/**/save.js',

  'src/options.js',
  'src/node/options.js',
  'src/**/options.js',

  'src/params.js',
  'src/**/params.js',

  'src/data/*.js',

  'src/node/index.js',
  'src/node/*.js',
  'src/edge/index.js',
  'src/edge/*.js',
  'src/port/index.js',
  'src/port/multiple-port/index.js',
  'src/port/selection-port/index.js',

  'src/unit/select/index.js',
  'src/unit/**/*.js',

  'src/panel/panel.js',
  'src/panel/**/*.js',

  'src/data-source/index.js',
  'src/data-source/*.js',

  'src/filter/index.js',
  'src/filter/**/index.js',
  'src/filter/**/*.js',

  'src/property/index.js',
  'src/property/**/index.js',
  'src/property/**/*.js',

  'src/set/index.js',
  'src/set/**/index.js',
  'src/set/**/*.js',

  'src/value/index.js',
  'src/value/**/index.js',
  'src/value/**/*.js',

  'src/visualization/index.js',
  'src/visualization/**/index.js',
  'src/visualization/**/*.js',

  'src/diagram/diagram.js',
  'src/flow/**/*.js',
  'src/welcome/welcome.js',

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
  imgs: [
    'imgs/**/*',
  ],
  docJs: [
    'doc/doc.js'
  ],
  docScss: [
    'doc/doc.scss'
  ],
  docImgs: [
    'doc/*.png'
  ],
  externs: [
    'src/externs/**/*.js'
  ],
  scss: [
    'src/**/*.scss',
    'src/**/*.css'
  ],
  less: [
    'src/**/*.less'
  ],
  html: [
    'src/**/*.html'
  ],
  fonts: [
    'bower_components/bootstrap/dist/fonts/*'
  ],
  index: ['index.html'],
  gulpTasks: ['gulp/**/*.js']
};
