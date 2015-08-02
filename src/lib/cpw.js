"use strict";
var child_process = require("child_process");

class Process {
    constructor(command, options) {
        this._command = command || "";
        this._options = options || {};
    }

    exec(args) {
        return new Promise(((resolve, reject) => {
            args = args || {};
            var command = this._command;

            Object.keys(args).forEach(key => {
                var reg;
                try {
                    reg = new RegExp("\\${" + key + "}", "g");
                } catch (err) {
                    return;
                }
                command = command.replace(reg, args[key]);
            });

            var exec = child_process.exec(command, this._options, (error, stdout, stderr) => {
                resolve(error, stdout, stderr);
            });
        }).bind(this));
    }

    get command() {
        return this._command;
    }

    set command(command) {
        if (typeof command !== "string")
            throw new TypeError("Command is not a string");

        this._command = command;
    }

    get options() {
        return this._options;
    }

    set options(options) {
        if (typeof options !== "object")
            throw new TypeError("Options is not an object");

        this._options = options;
    }
}

module.exports = Process;
