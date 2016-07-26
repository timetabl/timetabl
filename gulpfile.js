'use strict';

const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');

const prefix = 's/' + Date.now().toString(36);

gulp.task('test', () => {
  gulp.src('test/**/*.js', {read: false})
    .pipe(require('gulp-mocha')());
});

gulp.task('clean', () => {
  require('del')(['www/s', 'lib/revision']);
});

gulp.task('uglify', () => {
  gulp.src('www/js/*.js')
    .pipe(require('gulp-uglify')())
    .pipe(gulp.dest(`www/${prefix}/js`))
});

gulp.task('stylus', () => {
  gulp.src('css/{style,all}.styl')
    .pipe(require('gulp-stylus')({compress: true}))
    .pipe(gulp.dest(`www/${prefix}/css`))
});

gulp.task('stylus:dev', () => {
  gulp.src('css/{style,all}.styl')
    .pipe(sourcemaps.init())
    .pipe(require('gulp-stylus')())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('www/css'))
});

gulp.task('revision', () => {
  require('fs').writeFileSync('lib/revision', prefix);
});

gulp.task('build', () => {
  gulp.start('revision', 'uglify', 'stylus');
});

gulp.task('default', ['stylus:dev'], () => {
  gulp.watch('css/*', ['stylus:dev']);

  const LIVERELOAD_PORT = 2015;
  const server = require('gulp-live-server')('index.js', {
    env: {
      LIVERELOAD_PORT: LIVERELOAD_PORT,
      HTTP_BIND: 'localhost',
    },
  }, LIVERELOAD_PORT);
  server.start();

  gulp.watch('lib/*', server.start.bind(server));
  gulp.watch(['www/**', 'views/*']).on('change', server.notify.bind(server));
});
