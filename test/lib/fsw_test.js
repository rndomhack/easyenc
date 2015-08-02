"use strict";

var fs = require("fs");
var path = require("path");
var os = require("os");
var assert = require("assert");

var fsw = require("../../src/lib/fsw");

var tmpPath = path.join(os.tmpdir(), "autoconvert_test");
var tmpContent = "This is a file for AutoConvert test";

describe("fsw", () => {

    describe("File", () => {

        beforeEach(() => {
            fs.writeFileSync(tmpPath, tmpContent);
        });

        afterEach(() => {
            fs.unlinkSync(tmpPath);
        });

        it("should exist", done => {
            var file = new fsw.File(tmpPath);
            file.exists().then(() => {
                assert(true);
                done();
            }).catch(() => {
                assert(false);
                done();
            });
        });

    });

});
