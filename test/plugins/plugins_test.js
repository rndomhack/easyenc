"use strict";

var fs = require("fs");
var path = require("path");
var os = require("os");
var assert = require("assert");
var del = require("del");

var tmp = path.join(os.tmpdir(), "autoconvert_test_plugin");

var Plugin = require("../../cli/src/manager").Plugin;

class PluginTest {

    constructor(name) {
        this._name = name;
        this._plugin = new Plugin(path.resolve(__dirname, "..", "..", "plugins", name));
        this._errors = [];
    }

    resetErrors() {
        this._errors = [];
    }

    initTest() {
        it("should initialize", (() =>
            this._plugin.init()
                .then(() => assert(true))
                .catch((() => {
                    throw new Error(this._errors.join(" "));
                }).bind(this))
        ).bind(this));
    }

    emitTest(event, options) {
        options.log = () => {};
        options.error = (function(...args) {
            this._errors.push(args.join(" "));
        }).bind(this);
        options.global = {};
        options.params = options.params || {};
        options.path = options.path || {};
        options.path.user = path.join(__dirname, this._name);
        options.path.temp = path.join(tmp, "test");

        it("should exec " + event, (() =>
            this._plugin.core.emit(event, options)
                .then(result => assert(result))
                .catch((() => {
                    throw new Error(this._errors.join(" "));
                }).bind(this))
        ).bind(this));
    }

}

var plugins = fs.readdirSync(__dirname)
    .filter(f => fs.statSync(path.join(__dirname, f)).isDirectory())
    .map(name => ({
        name: name,
        test: require("./" + name + "/" + name + "_test.js")
    }));

describe("Plugins", () => {

    before(() => {
        del.sync(tmp, { force: true });
        fs.mkdirSync(tmp);
    });

    after(() => {
        del.sync(tmp, { force: true });
    });

    plugins.forEach(p => {
        if (typeof p.test !== "function") {
            it(p.name);
            return;
        }
        var plugin = new PluginTest(p.name);
        describe(p.name, () => {
            after(() => {
                plugin.resetErrors();
                del.sync(path.join(tmp, "**/*"), { force: true });
            });
            p.test(plugin);
        });
    });

});
