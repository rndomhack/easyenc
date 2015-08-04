"use strict";

var assert = require("assert");

var Process = require("../../../../cli/lib/cpw.js").Process;

describe("cpw", () => {

    describe("Process", () => {

        it("should get command", () => {
            var process = new Process("node");
            assert.strictEqual(process.command, "node");
        });

        it("should set command", () => {
            var process = new Process("node");
            process.command = "iojs";
            assert.strictEqual(process.command, "iojs");
        });

        it("should get options", () => {
            var process = new Process("node", { param: "test" });
            var options = process.options;
            assert.strictEqual(options.param, "test");
        });

        it("should set options", () => {
            var process = new Process("node");
            process.options = { param: "test" };
            var options = process.options;
            assert.strictEqual(options.param, "test");
        });

        it("should exec", done => {
            var process = new Process("node -e process.exit(1)");
            process.exec().then(returns => {
                assert.strictEqual(returns.error.code, 1);
                done();
            }).catch(() => {
                assert(false);
                done();
            });
        });

    });

});
