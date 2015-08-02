"use strict";
var fs = require("fs");
var path = require("path");
var encoding = require("encoding-japanese");

class File {
    constructor(arg) {
        this._path = path.resolve(arg);
    }

    exists() {
        return new Promise((resolve, reject) => {
            fs.stat(this._path, (err, stats) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }

    copy(dest) {
        return new Promise((resolve, reject) => {
            if (!(dest instanceof File))
                throw new TypeError("Dest type is not File");

            var read = fs.createReadStream(this._path);
            var write = fs.createWriteStream(dest.path);
            read.on("error", err => reject(err));
            write.on("error", err => reject(err));
            write.on("close", () => resolve());
            read.pipe(write);
        });
    }
}
