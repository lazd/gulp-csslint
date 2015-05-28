/*jshint node:true */

'use strict';

var gutil = require('gulp-util');
var c = gutil.colors;
var error = gutil.PluginError;
var es = require('event-stream');
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

  var output = {
    errorCount: results.length,
    success: false,
    results: results,
    options: options
  };

  return output;
};

var cssLintPlugin = function(options) {
  if (!options) options = {};

  var ruleset = {};

  var rcLoader = new RcLoader('.csslintrc', options, { loader: 'async' });

  // Build a list of all available rules
  csslint.getRules().forEach(function(rule) {
    ruleset[rule.id] = 1;
  });

  return es.map(function(file, cb) {
    if (file.isNull()) return cb(null, file); // pass along
    if (file.isStream()) return cb(new error('gulp-csslint: Streaming not supported'));

    rcLoader.for(file.path, function(err, opts) {
      if (err) return cb(err);

      var str = file.contents.toString('utf8');

      for (var rule in opts) {
        if (!opts[rule]) {
          // Remove rules that are turned off
          delete ruleset[rule];
        }
        else {
          ruleset[rule] = opts[rule];
        }
      }

      var report = csslint.verify(str, ruleset);

      // send status down-stream
      file.csslint = formatOutput(report, file, ruleset);

      cb(null, file);
    });
  });
};

var defaultReporter = function(file) {
  var errorCount = file.csslint.errorCount;
  var plural = errorCount === 1 ? '' : 's';

  gutil.log(c.cyan(errorCount)+' error'+plural+' found in '+c.magenta(file.path));

  file.csslint.results.forEach(function(result) {
    var message = result.error;
    gutil.log(
      c.red('[') +
      (
        typeof message.line !== 'undefined' ?
          c.yellow( 'L' + message.line ) +
          c.red(':') +
          c.yellow( 'C' + message.col )
        :
          c.yellow('GENERAL')
      ) +
      c.red('] ') +
      message.message + ' ' + message.rule.desc + ' (' + message.rule.id + ')');
  });
};

cssLintPlugin.reporter = function(customReporter) {
  var reporter = defaultReporter;

  if (typeof customReporter === 'function') {
    reporter = customReporter;
  }

  if (typeof reporter === 'undefined') {
    throw new Error('Invalid reporter');
  }

  return es.map(function(file, cb) {
    // Only report if CSSLint was ran and errors were found
    if (file.csslint && !file.csslint.success) {
      reporter(file);
    }

    return cb(null, file);
  });
};

cssLintPlugin.addRule = function(rule) {
  if(typeof rule !== 'object') {
    throw new Error('Invalid rule: rules need to be objects.');
  }
  csslint.addRule(rule);
};

cssLintPlugin.failReporter = function() {
  return es.map(function(file, cb) {
    // Nothing to report or no errors
    if (!file.csslint || file.csslint.success) {
      return cb(null, file);
    }

    return cb(new gutil.PluginError('gulp-csslint', 'CSSLint failed for '+file.relative), file);
  });
};

module.exports = cssLintPlugin;
