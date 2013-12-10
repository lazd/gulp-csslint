# gulp-csslint  [![Build status][travis-image]][travis-url]  [![NPM version][npm-image]][npm-url]

> CSSLint plugin for gulp

## Usage

First, install `gulp-csslint` as a development dependency:

```shell
npm install --save-dev gulp-csslint
```

Then, add it to your `gulpfile.js`:

```javascript
var jshint = require('gulp-csslint');

gulp.task('css', function() {
  gulp.src('./client/css/*.css')
    .pipe(csslint())
    .pipe(csslint.reporter());
});
```

## Options

### Rule configuration

You can pass rule configuration as an object. See the [list of rules by ID on the CSSLint wiki](https://github.com/stubbornella/csslint/wiki/Rules-by-ID) for valid rule IDs.

```javascript
gulp.src('./client/css/*.css')
  .pipe(csslint({
    'shorthand': false
  }))
  .pipe(csslint.reporter());
```

### CSSLint RC

You can also pass the path to your csslintrc file:

```javascript
gulp.src('./client/css/*.css')
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

Custom reporter functions can be passed as `cssline.reporter(reporterFunc)`. The reporter function will be called for each linted file and passed the file object as described above.

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
  gulp.files('./lib/*.js')
    .pipe(csslint())
    .pipe(csslint.reporter(customReporter));
});
```

[travis-url]: http://travis-ci.org/lazd/gulp-csslint
[travis-image]: https://secure.travis-ci.org/lazd/gulp-csslint.png?branch=master
[npm-url]: https://npmjs.org/package/gulp-csslint
[npm-image]: https://badge.fury.io/js/gulp-csslint.png
