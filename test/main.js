/* eslint-env mocha */

var cssLintPlugin = require('../');
var cssLint = require('csslint').CSSLint;
var should = require('should');
var gutil = require('gulp-util');
var fs = require('fs');
var path = require('path');
var sinon = require('sinon');

var getFile = function(filePath) {
  filePath = 'test/' + filePath;
  return new gutil.File({
    path: filePath,
    cwd: 'test/',
    base: path.dirname(filePath),
    contents: fs.readFileSync(filePath)
  });
};

var getContents = function(filePath) {
  filePath = 'test/' + filePath;
  return fs.readFileSync(filePath, 'utf8').trim();
};

describe('gulp-csslint', function() {
  describe('cssLintPlugin()', function() {
    it('should pass file through', function(done) {
      var a = 0;

      var file = getFile('fixtures/validCSS.css');

      var stream = cssLintPlugin();
      stream.on('data', function(newFile) {
        should.exist(newFile);
        should.exist(newFile.path);
        should.exist(newFile.relative);
        should.exist(newFile.contents);
        newFile.path.should.equal('test/fixtures/validCSS.css');
        newFile.relative.should.equal('validCSS.css');
        ++a;
      });

      stream.once('end', function() {
        a.should.equal(1);
        done();
      });

      stream.write(file);
      stream.end();
    });

    it('should send success status', function(done) {
      var a = 0;

      var file = getFile('fixtures/validCSS.css');

      var stream = cssLintPlugin();
      stream.on('data', function(newFile) {
        ++a;
        should.exist(newFile.csslint.success);
        newFile.csslint.success.should.equal(true);
        should.not.exist(newFile.csslint.results);
        should.not.exist(newFile.csslint.opt);
      });
      stream.once('end', function() {
        a.should.equal(1);
        done();
      });

      stream.write(file);
      stream.end();
    });

    it('should send failure status', function(done) {
      var a = 0;

      var file = getFile('fixtures/duplicateProperties.css');

      var stream = cssLintPlugin();
      stream.on('data', function(newFile) {
        ++a;
        should.exist(newFile.csslint.success);
        newFile.csslint.success.should.equal(false);
        should.exist(newFile.csslint.report);
      });
      stream.once('end', function() {
        a.should.equal(1);
        done();
      });

      stream.write(file);
      stream.end();
    });

    it('should lint two files', function(done) {
      var a = 0;

      var file1 = getFile('fixtures/duplicateProperties.css');
      var file2 = getFile('fixtures/missingPrefixes.css');

      var stream = cssLintPlugin();
      stream.on('data', function() {
        ++a;
      });

      stream.once('end', function() {
        a.should.equal(2);
        done();
      });

      stream.write(file1);
      stream.write(file2);
      stream.end();
    });

    it('should not leak options across files', function(done) {
      var failedFiles = 0;
      var file1 = getFile('fixtures/leaktest1.css');
      var file2 = getFile('fixtures/leaktest2.css');
      var stream = cssLintPlugin({});

      stream.on('data', function(newFile) {
        should.exist(newFile.csslint.success);
        if (!newFile.csslint.success) {
          failedFiles++;
        }
      });

      stream.once('end', function() {
        failedFiles.should.equal(1);
        done();
      });

      stream.write(file1);
      stream.write(file2);
      stream.end();
    });

    it('should support options', function(done) {
      var a = 0;

      var file = getFile('fixtures/usingImportant.css');

      var stream = cssLintPlugin({
        important: false
      });
      stream.on('data', function(newFile) {
        ++a;
        should.exist(newFile.csslint.success);
        newFile.csslint.success.should.equal(true);
        should.not.exist(newFile.csslint.results);
        should.not.exist(newFile.csslint.opt);
      });
      stream.once('end', function() {
        a.should.equal(1);
        done();
      });

      stream.write(file);
      stream.end();
    });

    it('should support csslintrc', function(done) {
      var a = 0;

      var file = getFile('fixtures/missingPrefixes.css');

      var stream = cssLintPlugin('test/.csslintrc');
      stream.on('data', function(newFile) {
        ++a;
        should.exist(newFile.csslint.success);
        newFile.csslint.success.should.equal(true);
        should.not.exist(newFile.csslint.results);
        should.not.exist(newFile.csslint.opt);
      });
      stream.once('end', function() {
        a.should.equal(1);
        done();
      });

      stream.write(file);
      stream.end();
    });

    it('should find csslintrc automatically', function(done) {
      var a = 0;

      var file = getFile('fixtures/missingPrefixes.css');

      var stream = cssLintPlugin();
      stream.on('data', function(newFile) {
        ++a;
        should.exist(newFile.csslint.success);
        newFile.csslint.success.should.equal(true);
        should.not.exist(newFile.csslint.results);
        should.not.exist(newFile.csslint.opt);
      });
      stream.once('end', function() {
        a.should.equal(1);
        done();
      });

      stream.write(file);
      stream.end();
    });

    it('should report added rule linting', function(done) {
      var a = 0;

      var file = getFile('fixtures/addRule.css');
      cssLintPlugin.addRule({
        id: 'oocss',
        name: 'OOCSS',
        desc: 'Class names must follow pattern',
        browsers: 'All',

        // initialization
        init: function(parser, formatter) {
          'use strict';
          var rule = this;
          parser.addListener('startrule', function(event) {
            var line = event.line;
            var col = event.col;

            for (var i = 0, len = event.selectors.length; i < len; i++) {
              var selectors = event.selectors[i].text.split(/(?=\.)/);
              for (var s = 0, l = selectors.length; s < l; s++) {
                var selector = selectors[s].trim();
                if (selector.charAt(0) !== '.') {
                  return;
                }
                if (!selector.match(/^\.(_)?(o|c|u|is|has|js|qa)-[a-z0-9]+$/)) {
                  formatter.warn('Bad naming: ' + selector, line, col, rule);
                }
              }
            }
          });
        }
      });

      var stream = cssLintPlugin();
      stream.on('data', function(newFile) {
        ++a;
        should.exist(newFile.csslint.success);
        newFile.csslint.success.should.equal(false);
        should.exist(newFile.csslint.report);
      });
      stream.once('end', function() {
        a.should.equal(1);
        done();
      });

      stream.write(file);
      stream.end();
    });

    it('should not fail on empty files', function(done) {
      var a = 0;

      var file = getFile('fixtures/empty.css');

      var stream = cssLintPlugin();

      stream.on('data', function(newFile) {
        ++a;
        should.not.exist(newFile.csslint);
      });
      stream.once('end', function() {
        a.should.equal(1);
        done();
      });

      stream.write(file);
      stream.end();
    });

    it('should default to text formatter', function(done) {
      var a = 0;

      var file = getFile('fixtures/usingImportant.css');
      var expected = getContents('expected/text.txt').trim();
      var callback = sinon.spy();

      var lintStream = cssLintPlugin();
      var formatterStream = cssLintPlugin.formatter(null, {logger: callback});

      formatterStream.on('data', function() {
        ++a;
      });
      lintStream.on('data', function(file) {
        formatterStream.write(file);
      });
      lintStream.once('end', function() {
        formatterStream.end();
      });

      formatterStream.once('end', function() {
        a.should.equal(1);
        sinon.assert.calledOnce(callback);
        callback.firstCall.args[0].trim().should.equal(expected);

        done();
      });

      lintStream.write(file);
      lintStream.end();
    });
  });

  describe('csslintPlugin.failFormatter()', function() {
    it('should do nothing on valid code', function(done) {
      var a = 0;

      var file = getFile('fixtures/validCSS.css');

      var lintStream = cssLintPlugin();
      var formatterStream = cssLintPlugin.formatter('fail');

      formatterStream.on('data', function() {
        ++a;
      });
      lintStream.on('data', function(file) {
        formatterStream.write(file);
      });
      lintStream.once('end', function() {
        formatterStream.end();
      });

      formatterStream.once('end', function() {
        a.should.equal(1);

        done();
      });

      lintStream.write(file);
      lintStream.end();
    });

    it('should throw on invalid code', function(done) {
      var file = getFile('fixtures/usingImportant.css');

      var lintStream = cssLintPlugin();
      var formatterStream = cssLintPlugin.formatter('fail');

      formatterStream.on('error', function(e) {
        e.message.should.equal('CSSLint failed for usingImportant.css');
        done();
      });
      lintStream.on('data', function(file) {
        formatterStream.write(file);
      });
      lintStream.once('end', function() {
        formatterStream.end();
      });

      lintStream.write(file);
      lintStream.end();
    });
  });

  describe('cssLintPlugin.formatter()', function() {
    it('should support built-in CSSLint formatters', function(done) {
      var a = 0;

      var file = getFile('fixtures/usingImportant.css');
      var expected = getContents('expected/checkstyle-xml.xml');
      var callback = sinon.spy();

      var lintStream = cssLintPlugin();
      var formatterStream = cssLintPlugin.formatter('checkstyle-xml', {logger: callback});

      formatterStream.on('data', function() {
        ++a;
      });
      lintStream.on('data', function(file) {
        formatterStream.write(file);
      });
      lintStream.once('end', function() {
        formatterStream.end();
      });

      formatterStream.once('end', function() {
        a.should.equal(1);
        sinon.assert.calledThrice(callback);
        callback.firstCall.args[0].should.equal('<?xml version="1.0" encoding="utf-8"?><checkstyle>');
        callback.secondCall.args[0].should.equal(expected);
        callback.thirdCall.args[0].should.equal('</checkstyle>');

        done();
      });

      lintStream.write(file);
      lintStream.end();
    });

    it('should write report to disk', function(done) {
      var a = 0;
      var output = '';

      var file = getFile('fixtures/usingImportant.css');
      var expected = getContents('expected/checkstyle-xml.xml');

      var lintStream = cssLintPlugin();
      var formatterStream = cssLintPlugin.formatter('checkstyle-xml', {
        logger: function(str) {
          output += str;
        }
      });

      sinon.stub(gutil, 'log');

      formatterStream.on('data', function() {
        ++a;
      });
      lintStream.on('data', function(file) {
        formatterStream.write(file);
      });
      lintStream.once('end', function() {
        formatterStream.end();
      });

      formatterStream.once('end', function() {
        fs.writeFile('test-output.xml', output, function() {
          a.should.equal(1);
          sinon.assert.notCalled(gutil.log);

          gutil.log.restore();

          fs.readFile('test-output.xml', function(err, content) {
            (err === null).should.be.true;

            var toString = content.toString();

            toString.should.equal('<?xml version="1.0" encoding="utf-8"?><checkstyle>' + expected + '</checkstyle>');
            done();
          });
        });
      });

      lintStream.write(file);
      lintStream.end();
    });

    it('should not print empty output by built-in CSSLint formatters', function(done) {
      var a = 0;

      var file = getFile('fixtures/validCSS.css');
      var callback = sinon.spy();

      var lintStream = cssLintPlugin();
      var formatterStream = cssLintPlugin.formatter('text', {logger: callback});

      formatterStream.on('data', function() {
        ++a;
      });
      lintStream.on('data', function(newFile) {
        should.exist(newFile.csslint.success);
        newFile.csslint.success.should.equal(true);
        formatterStream.write(newFile);
      });
      lintStream.once('end', function() {
        formatterStream.end();
      });

      formatterStream.once('end', function() {
        sinon.assert.notCalled(callback);
        a.should.equal(1);

        done();
      });

      lintStream.write(file);
      lintStream.end();
    });

    it('should allow function as reporter', function(done) {
      var a = 0;

      var file = getFile('fixtures/usingImportant.css');

      var lintStream = cssLintPlugin();
      var formatterStream = cssLintPlugin.formatter(function(results, filename, options) {
        ++a;
      });

      lintStream.on('data', function(file) {
        formatterStream.write(file);
      });
      lintStream.once('end', function() {
        formatterStream.end();
      });

      formatterStream.once('end', function() {
        a.should.equal(1);

        done();
      });

      lintStream.write(file);
      lintStream.end();
    });

    it('should have a fail reporter', function() {
      cssLintPlugin.formatter('fail').should.be.an.Object();
    });

    it('should accept object fulfilling the contract', function() {
      cssLintPlugin.formatter(require('csslint-stylish')).should.be.an.Object();
    });

    it('should throw on invalid formatter', function(done) {
      try {
        cssLintPlugin.formatter({ somehing: 'really random' });
      }
      catch (e) {
        e.message.should.equal('Invalid formatter: formatters need to be objects, and contain "id", "name", "startFormat", "endFormat" and "formatResults"');
        done();
      }
    });

    it('should throw on missing formatter', function(done) {
      try {
        cssLintPlugin.formatter('something-weird');
      }
      catch (e) {
        e.message.should.equal('Invalid reporter: something-weird');
        done();
      }
    });

    it('should throw on unknown parameter', function(done) {
      try {
        cssLintPlugin.formatter(true);
      }
      catch (e) {
        e.message.should.equal('Invalid custom formatter passed, please pass `null` or `undefined` if you want to pass options while using default formatter.');
        done();
      }
    });
  });

  describe('cssLintPlugin.addFormatter()', function() {
    afterEach(function() {
      delete require.cache[require.resolve('../')];
      delete require.cache[require.resolve('csslint')];

      cssLint = require('csslint').CSSLint;
      cssLintPlugin = require('../');
    });

    it('should be able to add custom formatters by passing strings', function() {
      cssLint.hasFormat('stylish').should.equal(false);
      cssLintPlugin.addFormatter('csslint-stylish');
      cssLint.hasFormat('stylish').should.equal(true);
    });

    it('should be able to add custom formatters by passing objects', function() {
      cssLint.hasFormat('stylish').should.equal(false);
      cssLintPlugin.addFormatter(require('csslint-stylish'));
      cssLint.hasFormat('stylish').should.equal(true);
    });
  });
});
