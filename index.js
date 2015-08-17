'use strict';

var gutil = require('gulp-util');
var error = gutil.PluginError;
var through = require('through2');
var csslint = require('csslint').CSSLint;
var RcLoader = require('rcloader');

var formatOutput = function(report, file, options) {
  if (!report.messages.length) {
    return {
      success: true
    };
  }

  var filePath = (file.path || 'stdin');

  // Handle errors
  var results = report.messages.map(function(err) {
    if (!err) return;
    return { file: filePath, error: err };
  }).filter(function(err) {
    return err;
  });

  return {
    originalReport: report,
    errorCount: results.length,
    success: false,
    results: results,
    options: options
  };
};

var cssLintPlugin = function(options) {
  options = options || {};

  var ruleset = {};

  var rcLoader = new RcLoader('.csslintrc', options, { loader: 'async' });

  // Build a list of all available rules
  csslint.getRules().forEach(function(rule) {
    ruleset[rule.id] = 1;
  });

  return through.obj(function(file, enc, cb) {
    if (file.isNull()) return cb(null, file); // pass along
    if (file.isStream()) return cb(new error('gulp-csslint: Streaming not supported'), file);

    var content = file.contents.toString(enc);

    if (!content) return cb(null, file); // pass along

    rcLoader.for(file.path, function(err, opts) {
      if (err) return cb(err);

      for (var rule in opts) {
        if (!opts[rule]) {
          // Remove rules that are turned off
          delete ruleset[rule];
        }
        else {
          ruleset[rule] = opts[rule];
        }
      }

      var report = csslint.verify(content, ruleset);

      // send status down-stream
      file.csslint = formatOutput(report, file, ruleset);

      cb(null, file);
    });
  });
};

cssLintPlugin.reporter = function(customReporter) {
  var reporter = csslint.getFormatter('text');
  var builtInReporter = true;
  var output;

  if (typeof customReporter === 'function') {
    reporter = customReporter;
    builtInReporter = false;
  }
  else if (typeof customReporter === 'string') {
    if (customReporter === 'fail') {
      return cssLintPlugin.failReporter();
    }

    reporter = csslint.getFormatter(customReporter);
  }

  if (typeof reporter === 'undefined') {
    throw new Error('Invalid reporter');
  }

  if (builtInReporter) {
    output = reporter.startFormat();
  }

  return through.obj(
    function(file, enc, cb) {
      // Only report if CSSLint was ran and errors were found
      if (file.csslint && !file.csslint.success) {
        if (builtInReporter) {
          output += reporter.formatResults(file.csslint.originalReport, file.path);
        }
        else {
          reporter(file);
        }
      }

      return cb(null, file);
    },
    function(cb) {
      if (builtInReporter) {
        output += reporter.endFormat();

        gutil.log(output);
      }

      return cb();
    }
  );
};

cssLintPlugin.addRule = function(rule) {
  if(typeof rule !== 'object') {
    throw new Error('Invalid rule: rules need to be objects.');
  }
  csslint.addRule(rule);
};

cssLintPlugin.failReporter = function() {
  return through.obj(function(file, enc, cb) {
    // Nothing to report or no errors
    if (!file.csslint || file.csslint.success) {
      return cb(null, file);
    }

    return cb(new gutil.PluginError('gulp-csslint', 'CSSLint failed for '+file.relative), file);
  });
};

module.exports = cssLintPlugin;
