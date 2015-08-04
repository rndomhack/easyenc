"use strict";

var fs = require("fs");
var path = require("path");
var util = require("util");
var encoding = require("encoding-japanese");

class Fs {
    constructor(...args) {
        this._path = path.resolve(path.join.apply(null, args));
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
        return new Promise(((resolve, reject) => {
            this.stat().then(() => {
                resolve(true);
            }).catch(() => {
                resolve(false);
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

class File extends Fs {
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

            fs.rename(this._path, dest.path, (err => {
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
            if (encode === void 0) encode = "";
            if (typeof encode !== "string")
                throw new TypeError("Encode is not a string");

            fs.readFile(this._path, {encoding: null}, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (encode === "") {
                    resolve(data);
                } else {
                    var converted;
                    try {
                        converted = encoding.convert(new Uint8Array(data), {
                            to: "UNICODE",
                            from: encode,
                            type: "string"
                        });
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
            if (encode === void 0) encode = "";
            if (typeof encode !== "string")
                throw new TypeError("Encode is not a string");

            if (encode !== "") {
                try {
                    data = new Buffer(encoding.convert(data, {
                        to: encode,
                        from: "UNICODE",
                        type: "array"
                    }));
                } catch(err) {
                    reject(err);
                    return;
                }
            }
            fs.writeFile(this._path, data, {encoding: null}, err => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve();
            });
        }).bind(this));
    }
}

class Folder extends Fs {
    make() {
        return new Promise(((resolve, reject) => {
            fs.mkdir(this._path, err => {
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
            fs.rmdir(this._path, err => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve();
            });
        }).bind(this));
    }

    childFile(...args) {
        return new File(path.join.apply(null, [this._path].concat(args)));
    }

    childFolder(...args) {
        return new Folder(path.join.apply(null, [this._path].concat(args)));
    }

    children() {
        var readdir = (arg) => {
            return new Promise((resolve2, reject2) => {
                fs.readdir(arg, (err, files) => {
                    if (err) {
                        reject2(err);
                        return;
                    }

                    files = files.map(value => path.join(arg, value));
                    resolve2(files);
                });
            });
        };

        var identify = (args) => {
            return Promise.all(args.map(value => {
                return new Promise((resolve2, reject2) => {
                    fs.stat(value, (err, stats) => {
                        if (err) {
                            reject2(err);
                            return;
                        }

                        if (stats.isFile()) {
                            resolve2(new File(value));
                        } else {
                            resolve2(new Folder(value));
                        }
                    });
                });
            }));
        };

        return readdir(this._path).then((files) => {
            return identify(files);
        });
    }

    childFiles() {
        return this.children().then(files => {
            return files.filter(value => {
                return value instanceof File;
            });
        });
    }

    childFolders() {
        return this.children().then(files => {
            return files.filter(value => {
                return value instanceof Folder;
            });
        });
    }
}

module.exports = {
    File: File,
    Folder: Folder
};
