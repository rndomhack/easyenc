"use strict";

var fs = require("fs"),
    path = require("path"),
    Mocha = require("mocha"),
    recursive = require("recursive-readdir");

var mocha = new Mocha();
var argv = process.argv.slice(2);

var test = (dir, filter) => {
    recursive(dir, (err, files) => {
        if (err) throw err;

        files.filter(file => typeof filter === "string" ?
            file.substr(-filter.length) === filter : true)
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
};

if (argv.includes("--plugins")) {
    test("test/plugins", "_test.js");
} else {
    test("test/spec", "_test.js");
}
