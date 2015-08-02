"use strict";
var fs = require("fs");
var path = require("path");
var encoding = require("encoding-japanese");

class File {
    constructor(arg) {
        this._path = path.resolve(arg);
    }

    exists() {
        return new Promise(((resolve, reject) => {
            fs.stat(this._path, (err, stats) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve();
            });
        }).bind(this));
    }

    copy(dest) {
        return new Promise(((resolve, reject) => {
            if (!(dest instanceof File))
                throw new TypeError("Dest type is not File");

            var read = fs.createReadStream(this._path);
            var write = fs.createWriteStream(dest.path);
            read.on("error", err => reject(err));
            write.on("error", err => reject(err));
            write.on("close", () => resolve());
            read.pipe(write);
        }).bind(this));
    }

    move(dest) {
        return new Promise(((resolve, reject) => {
            if (!(dest instanceof File))
                throw new TypeError("Dest type is not File");

            fs.rename(this._path, dest, (err => {
                if (err) {
                    this.copy(dest).then(() => {
                        return this.remove();
                    }).then(() => {
                        resolve();
                    }).catch(err2 => {
                        reject(err2);
                    });
                    return;
                }

                resolve();
            }).bind(this));
        }).bind(this));
    }

    remove() {
        return new Promise(((resolve, reject) => {
            fs.unlink(this._path, err => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve();
            });
        }).bind(this));
    }

    read(encode) {
        return new Promise(((resolve, reject) => {
            if (typeof encode !== "string")
                throw new TypeError("Encode is not a string");

            fs.readFile(this.path, {encoding: null}, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (encode === null) {
                    resolve(data);
                } else {
                    var converted;
                    try {
                        converted = encoding.convert(new Uint8Array(data), "UNICODE", encode, "string");
                    } catch(err2) {
                        reject(err2);
                        return;
                    }
                    resolve(converted);
                }
            });
        }).bind(this));
    }
}
