# gulp-csslint [![NPM version][npm-image]][npm-url] [![Build status][travis-image]][travis-url] [![Test coverage][coveralls-image]][coveralls-url] [![Dependency status][david-image]][david-url]
> CSSLint plugin for gulp 3

## Usage

First, install `gulp-csslint` as a development dependency:

```shell
npm install --save-dev gulp-csslint
```

Then, add it to your `gulpfile.js`:

```js
var csslint = require('gulp-csslint');

gulp.task('css', function() {
  gulp.src('client/css/*.css')
    .pipe(csslint())
    .pipe(csslint.formatter());
});
```

## API

### csslint(ruleConfiguration)

#### ruleConfiguration
Type: `Object`

If you pass `lookup: false`, the local .csslintrc is not looked up automatically.

You can pass rule configuration as an object. See the [list of rules by ID on the CSSLint wiki](https://github.com/stubbornella/csslint/wiki/Rules-by-ID) for valid rule IDs.

Any properties passed will be in _addition_ to (or overwriting) the ones in .csslintrc (unless `lookup: false` is passed).

```js
gulp.src('client/css/*.css')
  .pipe(csslint({
    'shorthand': false
  }))
  .pipe(csslint.formatter());
```

### csslint(csslintrc)

#### csslintrc
Type: `String`

You can also pass the path to your csslintrc file instead of a rule configuration object.

```js
gulp.src('client/css/*.css')
  .pipe(csslint('csslintrc.json'))
  .pipe(csslint.formatter());
```

## Results

Adds the following properties to the file object:

```js
file.csslint.success = true; // or false
file.csslint.report = {}; // The report from CSSLint after linting the file
```

## Using formatters

Several formatters come built-in to CSSLint. To use one of these formatters, pass the name to `csslint.formatter`.

For a list of all formatters supported by `csslint`, see the [csslint wiki](https://github.com/CSSLint/csslint/wiki/Command-line-interface#--format).

```js
gulp.task('lint', function() {
  gulp.src('lib/*.css')
    .pipe(csslint())
    .pipe(csslint.formatter('junit-xml'));
```

### Custom formatters

Custom formatters can be provided by first adding a valid CSSLint-formatter, such as `csslint-stylish`, then using it:

```js
var csslint = require('gulp-csslint');

csslint.addFormatter('csslint-stylish');

gulp.task('lint', function() {
  gulp.src('lib/*.css')
    .pipe(csslint())
    .pipe(csslint.formatter('stylish'))
});
```

You can provide the formatter by requiring it directly as well:

```js
var csslint = require('gulp-csslint');

gulp.task('lint', function() {
  gulp.src('lib/*.css')
    .pipe(csslint())
    .pipe(csslint.formatter(require('csslint-stylish')))
});
```

You can also provide an object with the following contract to implement your own formatter:

```js
{
  id: 'string', // Name passed to csslint.formatter
  startFormat: function() {}, // Called before parsing any files, should return a string
  startFormat: function() {}, // Called after parsing all files, should return a string
  formatResult: function (results, filename, options) {} // Called with a results-object per file linted. Optionally called with a filename, and options passed to csslint.formatter(*formatter*, *options*)
}
```

You can also provide a function, which is called for each file linted with the same arguments as `formatResults`.

### Formatter options
You can also pass options to the built-in formatter, by passing a second option to `formatter`.

```js
gulp.task('lint', function() {
  gulp.src('lib/*.css')
    .pipe(csslint())
    .pipe(csslint.formatter('junit-xml', options));
});
```

See the documentation for the formatters regarding what options they support.

This plugin supports one option outside of that, called `logger`, allowing you to specify how to log out the report.
Default is using `process.stdout.write`, but you can use e.g. `console.log`, or `gutil.log`.

```js
gulp.task('lint', function() {
  gulp.src('lib/*.css')
    .pipe(csslint())
    .pipe(csslint.formatter('junit-xml', {logger: console.log.bind(console)}));
});
```

```js
gulp.task('lint', function() {
  gulp.src('lib/*.css')
    .pipe(csslint())
    .pipe(csslint.formatter('junit-xml', {logger: gutil.log.bind(null, 'gulp-csslint:')}));
});
```

`logger` is called once for the starting format of the formatter, then once for each file containing violations, then
lastly once for the ending format. Instead of writing to `stdout`, you can write to file using this option.

```js
gulp.task('lint', function(cb) {
  var fs = require('fs');
  var output = '';

  gulp.src('lib/*.css')
    .pipe(csslint())
    .pipe(csslint.formatter('junit-xml', {logger: function(str) { output += str; }}))
    .on('end', function(err) {
      if (err) return cb(err);

      fs.writeFile('some/path/junit.xml', output, cb);
    });
});
```

This functionality is only available when not using a custom formatting function.

## Custom rules

Use the `csslint.addRule(rule)` method to define custom rules that run in addition to the rules defined in the csslintrc file. See [Working with Rules](https://github.com/CSSLint/csslint/wiki/Working-with-Rules) for details.

```js
var csslint = require('gulp-csslint');

csslint.addRule({
  // rule information
});

gulp.task('lint', function() {
  gulp.src('lib/*.css')
    .pipe(csslint())
    .pipe(csslint.formatter())
});
```

## Fail on errors

Pipe the file stream to `csslint.failFormatter()` to fail on errors.

```js
var csslint = require('gulp-csslint');

gulp.task('lint', function() {
  gulp.src('lib/*.css')
    .pipe(csslint())
    .pipe(csslint.formatter()) // Display errors
    .pipe(csslint.formatter('fail')); // Fail on error (or csslint.failFormatter())
});
```


[travis-url]: http://travis-ci.org/lazd/gulp-csslint
[travis-image]: https://img.shields.io/travis/lazd/gulp-csslint.svg
[npm-url]: https://npmjs.org/package/gulp-csslint
[npm-image]: https://img.shields.io/npm/v/gulp-csslint.svg
[david-url]: https://david-dm.org/lazd/gulp-csslint
[david-image]: https://img.shields.io/david/lazd/gulp-csslint.svg
[coveralls-url]: https://coveralls.io/r/lazd/gulp-csslint
[coveralls-image]: https://img.shields.io/coveralls/lazd/gulp-csslint.svg
