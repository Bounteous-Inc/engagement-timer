module.exports = function(config) {
  'use strict';

  config.set({

    basePath: './',

    frameworks: ["jasmine", "sinon"],

    files: [
      'src/engagement-timer.js',
      'test/**/*.spec.js'
    ],

    autoWatch: true,

    browsers: ['Chrome']

  });
};
