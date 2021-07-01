const gulp = require('gulp');
const cachebust = require('gulp-cache-bust');

gulp.task('cache', () =>
  gulp
    .src('./dist/*/*.html')
    .pipe(
      cachebust({
        type: 'timestamp',
      })
    )
    .pipe(gulp.dest('./dist'))
);
