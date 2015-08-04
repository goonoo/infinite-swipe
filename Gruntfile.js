"use strict";

module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    qunit: {
      all: ['test/*.html']
    },
    uglify: {
      options: {
        preserveComments: 'some'
      },
      compress: {
        files: {
          "dist/swipe.min.js": ['swipe.js']
        }
      }
    },
    cssmin: {
      options: {
      },
      compress: {
        files: {
          "dist/swipe.min.css": ['swipe.css']
        }
      }
    },
    watch: {
      scripts: {
        files: [ 'swipe.js' ],
        tasks: [ 'uglify' ]
      }
    }
  });

  // Loading dependencies
  for (var key in grunt.file.readJSON('package.json').devDependencies) {
    if (key !== 'grunt' && key.indexOf('grunt') === 0) {
      grunt.loadNpmTasks(key);
    }
  }

  grunt.registerTask('default', ['uglify', 'cssmin']);
  grunt.registerTask('ci', ['qunit']);
};
