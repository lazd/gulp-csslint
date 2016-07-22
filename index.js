'use strict';

var gutil = require('gulp-util');
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
  var rcLoader = new RcLoader('.csslintrc', options, { loader: 'async' });
  return through.obj(function(file, enc, cb) {
    if (file.isNull()) return cb(null, file); // pass along
    if (file.isStream()) return cb(new gutil.PluginError('gulp-csslint: Streaming not supported'), file);

    var ruleset = {};
    // Build a list of all available rules
    csslint.getRules().forEach(function(rule) {
      ruleset[rule.id] = 1;
    });

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

cssLintPlugin.formatter = function(customFormatter, options) {
  var formatter = csslint.getFormatter('text');
  var builtInFormatter = true;
  var output;

  options = options || {};

  var logger = options.logger || process.stdout.write.bind(process.stdout);

  if (typeof customFormatter === 'function') {
    formatter = customFormatter;
    builtInFormatter = false;
  }
  else if (typeof customFormatter === 'string') {
    if (customFormatter === 'fail') {
      return cssLintPlugin.failFormatter();
    }

    formatter = csslint.getFormatter(customFormatter);
  }

  if (typeof formatter === 'undefined') {
    throw new Error('Invalid formatter');
  }

  if (builtInFormatter) {
    output = [formatter.startFormat()];
  }

  return through.obj(
    function(file, enc, cb) {
      // Only report if CSSLint was ran and errors were found
      if (file.csslint && !file.csslint.success) {
        if (builtInFormatter) {
          output.push(formatter.formatResults(file.csslint.originalReport, file.path, options));
        }
        else {
          formatter(file);
        }
      }

      return cb(null, file);
    },
    function(cb) {
      if (builtInFormatter) {
        output.push(formatter.endFormat());

        output
          .filter(function(str) {
            return str;
          })
          .forEach(logger);
      }

      return cb();
    }
  ).resume(); // Force flow-mode https://nodejs.org/docs/latest/api/stream.html#stream_event_end
};

cssLintPlugin.addRule = function(rule) {
  if (typeof rule !== 'object') {
    throw new Error('Invalid rule: rules need to be objects.');
  }
  csslint.addRule(rule);
};

cssLintPlugin.failFormatter = function() {
  return through.obj(function(file, enc, cb) {
    // Nothing to report or no errors
    if (!file.csslint || file.csslint.success) {
      return cb(null, file);
    }

    return cb(new gutil.PluginError('gulp-csslint', 'CSSLint failed for ' + file.relative), file);
  });
};

module.exports = cssLintPlugin;
