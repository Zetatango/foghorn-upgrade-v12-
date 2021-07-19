// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

// eslint-disable-next-line @typescript-eslint/no-var-requires
process.env.CHROME_BIN = require('puppeteer').executablePath()

module.exports = function (config) {
  config.set({
    basePath: '../',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      'karma-*',
      '@angular-devkit/build-angular/plugins/karma'
    ],
    preprocessors: {
      'src/app/**/*.ts': ['coverage']
    },
    client:{
      jasmine: {
        random: false
      }
    },
    reporters: ['spec', 'coverage'],
    specReporter: {
      suppressSkipped: true
    },
    coverageReporter: {
      type: 'lcovonly',
      dir: 'coverage',
      subdir: 'angular',
      combineBrowserReports: true,
      fixWebpackSourcePaths: true,
      check: {
        global: {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        }
      }
    },
    logLevel: config.LOG_ERROR,
    autoWatch: false,
    singleRun: true,
    browserNoActivityTimeout: 40000,
    browsers: ['ChromeHeadlessCI'],
    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox']
      }
    }
  });
};
