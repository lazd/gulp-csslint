/*jshint expr: true*/

var cssLintPlugin = require('../');
var should = require('should');
var gutil = require('gulp-util');
var fs = require('fs');
var path = require('path');
var sinon = require('sinon');

var getFile = function(filePath) {
  filePath = 'test/'+filePath;
  return new gutil.File({
    path: filePath,
    cwd: 'test/',
    base: path.dirname(filePath),
    contents: fs.readFileSync(filePath)
  });
};

var getContents = function(filePath) {
  filePath = 'test/'+filePath;
  return fs.readFileSync(filePath, 'utf8');
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
        should.exist(newFile.csslint.results);
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

        //initialization
        init: function(parser, reporter) {
          'use strict';
          var rule = this;
          parser.addListener('startrule', function(event) {
            var line = event.line,
                col = event.col;

            for (var i=0,len=event.selectors.length; i < len; i++) {
              var selectors = event.selectors[i].text.split(/(?=\.)/);
              for (var s=0,l=selectors.length; s < l; s++){
                var selector = selectors[s].trim();
                if(selector.charAt(0) !== '.'){
                  return;
                }
                if(!selector.match(/^\.(_)?(o|c|u|is|has|js|qa)-[a-z0-9]+$/)){
                  reporter.warn('Bad naming: '+selector, line, col, rule);
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
        should.exist(newFile.csslint.results);
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

    it('should support built-in CSSLint formatters', sinon.test(function(done) {
      var a = 0;

      var file = getFile('fixtures/usingImportant.css');
      var expected = getContents('expected/checkstyle-xml.xml');

      var lintStream = cssLintPlugin();
      var reporterStream = cssLintPlugin.reporter('checkstyle-xml');

      sinon.stub(gutil, 'log');

      reporterStream.on('data', function() {
        ++a;
      });
      lintStream.on('data', function(file) {
        reporterStream.write(file);
      });
      lintStream.once('end', function() {
        reporterStream.end();
      });

      reporterStream.once('end', function() {
        a.should.equal(1);
        sinon.assert.calledOnce(gutil.log);
        sinon.assert.calledWith(gutil.log, expected);

        gutil.log.restore();
        done();
      });

      lintStream.write(file);
      lintStream.end();
    }));
  });
});
