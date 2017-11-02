/*
 * @TODO add task for updating container
 */
var fs = require('fs');
var jsBeautify = require('js-beautify').js_beautify;

module.exports = function(grunt) {

  var footer = ['/*',
                ' * v<%= pkg.version %>',
                ' * Created by the Google Analytics consultants at http://www.lunametrics.com/',
                ' * Written by @notdanwilkerson',
                ' * Documentation: https://www.lunametrics.com/labs/recipes/engagement-timer/',
                ' * Licensed under the MIT License',
                ' */'
  ].join('\r\n');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      ignore_warning: {
        options: {
          '-W030': true,
          '-W058': true
        },
        src: ['./src/*.js']
      }
    },
    uglify: {
      options: {
        footer: '\r\n' + footer
      },
      build: {
        src: './src/engagement-timer.js',
        dest: './engagement-timer.min.js'
      }
    },
    appendFooter: {
      options: {
        build: {
          src: './src/engagement-timer.js',
          dest: './engagement-timer.js'
        },
        footer: footer
      }
    },
    updateContainer: {
      options: {
        build: {
          src: './engagement-timer.js',
          dest: './luna-gtm-engagement-timer.json'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('appendFooter', ['append credits to footer'], function() {

    var options = this.options();
    var data = fs.readFileSync(options.build.src, 'utf-8');
    fs.writeFileSync(options.build.dest, data + options.footer);
    console.log('appended footer to unminifed script');

  });

  /*grunt.registerTask('updateContainer', ['Updating container import file'], function() {

    var options = this.options();
    var oldContainer = require(options.build.dest);
    var newScript = fs.readFileSync(options.build.src, 'utf-8');
    var oldTag,
        oldParameter,
        i;

    for (i = 0; i < oldContainer.containerVersion.tag.length; i++) {

      if (oldContainer.containerVersion.tag[i].name === 'CU - Scroll Tracking - LunaMetrics Plugin') {

        oldTag = i;
        break;

      }

    }
    for (i = 0; i < oldContainer.containerVersion.tag[oldTag].parameter.length; i++) {

      if (oldContainer.containerVersion.tag[oldTag].parameter[i].key === 'html') {

        oldParameter = i;
        break;

      }

    }

    oldContainer.containerVersion.tag[oldTag].parameter[oldParameter].value = '<script type="text/javascript" id="gtm-scroll-tracking">\n' +
      newScript +
      '\n</script>';

    fs.writeFileSync(options.build.dest, jsBeautify(JSON.stringify(oldContainer)));

  });*/

  grunt.registerTask('default', ['jshint', 'appendFooter', 'uglify', /*'updateContainer'*/]);

};
