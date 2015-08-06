"use strict";

var fs = require("fs"),
    path = require("path"),
    Mocha = require("mocha"),
    recursive = require("recursive-readdir");

var mocha = new Mocha();
var argv = process.argv.slice(2);

var mochaTest = () => {
    mocha.run((failures) => {
        process.on('exit', () => {
            /* eslint-disable no-process-exit */
            process.exit(failures);
            /* eslint-enable*/
        });
    });
};

var test = file => {
    mocha.addFile(file);
    mochaTest();
};

var testDir = (dir, filter) => {
    recursive(dir, (err, files) => {
        if (err) throw err;

        files.filter(file => typeof filter === "string" ?
            file.substr(-filter.length) === filter : true)
            .forEach(file => {
                mocha.addFile(file);
            });

        mochaTest();
    });
};

if (argv.includes("--plugins")) {
    test(path.join(__dirname, "plugins", "plugins_test.js"));
} else {
    testDir(path.join(__dirname, "spec"), "_test.js");
}
