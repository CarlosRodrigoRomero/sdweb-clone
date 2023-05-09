const gulp = require('gulp');
const file = require('gulp-file');

gulp.task('update-version', () => {
  const version = new Date().toISOString(); // Utiliza la fecha y hora actuales como identificador único de la versión

  return file('version.txt', version, { src: true }).pipe(gulp.dest('./'));
});
