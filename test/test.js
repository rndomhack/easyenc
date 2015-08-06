"use strict";

var fs = require('fs'),
    path = require('path'),
    Mocha = require('mocha'),
    recursive = require("recursive-readdir");

var mocha = new Mocha();

recursive("test/spec", (err, files) => {
    if (err) throw err;

    files.filter(file => file.substr(-8) === "_test.js")
        .forEach(file => {
            mocha.addFile(path.join(file));
        });

    mocha.run((failures) => {
        process.on('exit', () => {
            /* eslint-disable no-process-exit */
            process.exit(failures);
            /* eslint-enable*/
        });
    });
});
