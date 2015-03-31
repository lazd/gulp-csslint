# gulp-csslint [![NPM version][npm-image]][npm-url] [![Build status][travis-image]][travis-url] [![Dependency status][david-image]][david-url]
> CSSLint plugin for gulp 3

## Usage

First, install `gulp-csslint` as a development dependency:

```shell
npm install --save-dev gulp-csslint
```

Then, add it to your `gulpfile.js`:

```javascript
var csslint = require('gulp-csslint');

gulp.task('css', function() {
  gulp.src('client/css/*.css')
    .pipe(csslint())
    .pipe(csslint.reporter());
});
```

## API

### csslint(ruleConfiguration)

#### ruleConfiguration
Type: `Object`

If you pass `lookup: false`, the local .csslintrc is not looked up automatically.

You can pass rule configuration as an object. See the [list of rules by ID on the CSSLint wiki](https://github.com/stubbornella/csslint/wiki/Rules-by-ID) for valid rule IDs.

Any properties passed wil be in _addition_ to (or overwriting) the ones in .csslintrc (unless `lookup: false` is passed).

```javascript
gulp.src('client/css/*.css')
  .pipe(csslint({
    'shorthand': false
  }))
  .pipe(csslint.reporter());
```

### csslint(csslintrc)

#### csslintrc
Type: `String`

You can also pass the path to your csslintrc file instead of a rule configuration object.

```javascript
gulp.src('client/css/*.css')
  .pipe(csslint('csslintrc.json'))
  .pipe(csslint.reporter());
```

## Results

Adds the following properties to the file object:

```javascript
file.csslint.success = true; // or false
file.csslint.errorCount = 0; // number of errors returned by CSSLint
file.csslint.results = []; // CSSLint errors
file.csslint.opt = {}; // The options you passed to CSSLint
```

## Custom Reporters

Custom reporter functions can be passed as `csslint.reporter(reporterFunc)`. The reporter function will be called for each linted file and passed the file object as described above.

```javascript
var csslint = require('gulp-csslint');
var gutil = require('gulp-util');

var customReporter = function(file) {
  gutil.log(gutil.colors.cyan(file.csslint.errorCount)+' errors in '+gutil.colors.magenta(file.path));

  file.csslint.results.forEach(function(result) {
    gutil.log(result.error.message+' on line '+result.error.line);
  });
};

gulp.task('lint', function() {
  gulp.files('lib/*.css')
    .pipe(csslint())
    .pipe(csslint.reporter(customReporter));
});
```

## Fail on errors

Pipe the file stream to `csslint.failReporter()` to fail on errors.

```javascript
var csslint = require('gulp-csslint');

gulp.task('lint', function() {
  gulp.files('lib/*.css')
    .pipe(csslint())
    .pipe(csslint.reporter()) // Display errors
    .pipe(csslint.failReporter()); // Fail on error
});
```


[travis-url]: http://travis-ci.org/lazd/gulp-csslint
[travis-image]: https://img.shields.io/travis/lazd/gulp-csslint.png
[npm-url]: https://npmjs.org/package/gulp-csslint
[npm-image]: https://img.shields.io/npm/v/gulp-csslint.svg
[david-url]: https://david-dm.org/lazd/gulp-csslint
[david-image]: https://img.shields.io/david/lazd/gulp-csslint.png
