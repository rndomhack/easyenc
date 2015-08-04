"use strict";

var fs = require("fs");
var path = require("path");
var os = require("os");
var assert = require("assert");
var rimraf = require("rimraf");

var manager = require("../../../../cli/src/manager.js");
var Core = manager.Core;
var Plugin = manager.Plugin;
var Manager = manager.Manager;

describe("manager", () => {

    var tmp = path.join(os.tmpdir(), "autoconvert_test");
    var tmp2 = path.join(tmp, "test_plugin");

    before(() => {
        // dummy plugin
        var json = {
            "main": "main.js"
        };
        var main = `"use strict";
core.on("initialize", co.wrap(function* (options) {
    options.name = "test";
}));`;

        rimraf.sync(tmp);
        fs.mkdirSync(tmp);
        fs.mkdirSync(tmp2);
        fs.writeFileSync(path.join(tmp2, "plugin.json"), JSON.stringify(json), "utf8");
        fs.writeFileSync(path.join(tmp2, "main.js"), main, "utf8");
    });

    after(() => {
        rimraf.sync(tmp);
    });

    it("Core", done => {

        var core = new Core();

        var flag = 0;
        var opt = {"manager": "core"};
        var fn = options => {
            assert.strictEqual(options, opt, "options");
            return new Promise(resolve => {
                flag++;
                process.nextTick(() => resolve());
            });
        };

        core.on("test", fn).emit("test", opt).then(() => {
            assert.strictEqual(flag, 1, "on");
            core.off("test", fn).emit("test").then(() => {
                assert.strictEqual(flag, 1, "off");
                done();
            });
        });

    });

    it("Plugin", done => {
        var opt = {};
        var plugin = new Plugin(tmp2);
        plugin.init()
        .then(() => plugin.core.emit("initialize", opt))
        .then(() => {
            assert.strictEqual(opt.name, "test");
            done();
        });
    });

    it("Manager", () => {
        var maanger = new Manager(tmp);
        maanger.init();
        assert(true);
    });

});
