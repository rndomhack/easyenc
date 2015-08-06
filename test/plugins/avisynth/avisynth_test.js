"use strict";

var name = "avisynth";

var fs = require("fs");
var path = require("path");
var os = require("os");
var assert = require("assert");
var del = require("del");

var tmp = path.join(os.tmpdir(), "autoconvert_test_plugin");
var errors = [];

var options = {
    log: () => {},
    error: function(...args) {
        errors.push(args.join(" "));
    },
    params: {
        avs: "test.avs"
    },
    path: {
        user: __dirname,
        temp: path.join(tmp, "test")
    },
    global: {}
};

var Plugin = require("../../../cli/src/manager").Plugin;

describe(name, () => {
    var plugin = new Plugin(path.resolve(__dirname, "..", "..", "..", "plugins", name));

    before(() => {
        del.sync(tmp, { force: true });
        fs.mkdirSync(tmp);
    });

    after(() => {
        del.sync(tmp, { force: true });
    });

    afterEach(() => {
        errors = [];
    });

    it("should initialize", () => {
        return plugin.init()
            .then(() => assert(true))
            .catch(() => {
                throw new Error(errors.join(" "));
            });
    });

    it("should exec initialize", () => {
        return plugin.core.emit("initialize", options)
            .then(result => assert(result))
            .catch(() => {
                throw new Error(errors.join(" "));
            });
    });

    it("should exec frameserver", () => {
        return plugin.core.emit("frameserver", options)
            .then(result => assert(result))
            .catch(() => {
                throw new Error(errors.join(" "));
            });
    });

});
