module.exports = function(config) {
  'use strict';

  config.set({

    basePath: './',

    frameworks: ["jasmine"],

    files: [
      'src/engagement-timer.js',
      'test/**/*.spec.js'
    ],

    autoWatch: true,

    browsers: ['PhantomJS']

  });
};
