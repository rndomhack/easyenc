"use strict";
var fs = require("fs");
var path = require("path");
var encoding = require("encoding-japanese");

class File {
    constructor(arg) {
        this._path = path.resolve(arg);
    }

    stat() {
        return new Promise(((resolve, reject) => {
            fs.stat(this._path, (err, stats) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(stats);
            });
        }).bind(this));
    }

    exists() {
        return this.stat();
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

    make() {
        return new Promise(((resolve, reject) => {
            fs.writeFile(this._path, "", err => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve();
            });
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

    write(data, encode) {
        return new Promise(((resolve, reject) => {
            if (typeof encode !== "string")
                throw new TypeError("Encode is not a string");

            if (encode !== null) {
                try {
                    data = new Buffer(encoding.convert(data, encode, "UNICODE", "Array"));
                } catch(err) {
                    reject(err);
                    return;
                }
            }
            fs.writeFile(this.path, data, {encoding: null}, err => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve();
            });
        }).bind(this));
    }

    parent() {
        return new Folder(path.dirname(this._path));
    }

    get path() {
        return this._path;
    }

    get name() {
        return path.basename(this._path);
    }

    get base() {
        return path.basename(this._path, path.extname(this._path));
    }

    get ext() {
        return path.extname(this._path);
    }
}

class Folder {
    constructor(arg) {
        this._path = path.resolve(arg);
    }
}

module.exports = {
    File: File,
    Folder: Folder
};
