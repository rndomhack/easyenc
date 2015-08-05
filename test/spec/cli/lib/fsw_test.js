"use strict";

var fs = require("fs");
var path = require("path");
var os = require("os");
var assert = require("assert");
var del = require("del");

var fsw = require("../../../../cli/lib/fsw.js");

describe("fsw", () => {

    var tmp = os.tmpdir();
    var tmpName = "easyenc_test";
    var tmpPath = path.join(tmp, tmpName);

    describe("File", () => {

        var file1_base = "easyenc";
        var file1_ext = ".txt";
        var file1 = file1_base + file1_ext;

        var file2 = "easyenc2";
        var file3 = "easyenc3";

        var tmpContent = Math.random().toString(36).slice(2) + "あいうえお日本語";

        before(() => {
            del.sync(tmpPath, { force: true });
            fs.mkdirSync(tmpPath);
            fs.writeFileSync(path.join(tmpPath, file1), tmpContent, "utf8");
        });

        after(() => {
            del.sync(tmpPath, { force: true });
        });

        afterEach(() => {
            del.sync([
                path.join(tmpPath, file2),
                path.join(tmpPath, file3)
            ], { force: true });
        });

        it("should get path", () => {
            var p = path.join(tmpPath, file1);
            var file = new fsw.File(p);
            assert.strictEqual(file.path, p);
        });

        it("should construct with multiple path", () => {
            var file = new fsw.File(tmpPath, file1);
            assert.strictEqual(file.path, path.join(tmpPath, file1));
        });

        it("should get name", () => {
            var file = new fsw.File(tmpPath, file1);
            assert.strictEqual(file.name, file1);
        });

        it("should get base", () => {
            var file = new fsw.File(tmpPath, file1);
            assert.strictEqual(file.base, file1_base);
        });

        it("should get ext", () => {
            var file = new fsw.File(tmpPath, file1);
            assert.strictEqual(file.ext, file1_ext);
        });

        it("should get stats", () => {
            var file = new fsw.File(tmpPath, file1);
            return file.stat().then(() => assert(true));
        });

        it("should exist", () => {
            var file = new fsw.File(tmpPath, file1);
            return file.exists().then(exists => assert(exists));
        });

        it("should get parent directory", () => {
            var file = new fsw.File(tmpPath, file1);
            var parent = file.parent();
            assert(parent instanceof fsw.Folder, "instanceof fsw.Folder");
            assert.strictEqual(parent.path, path.dirname(file.path), "path");
        });

        it("should copy", () => {
            var file = new fsw.File(tmpPath, file1);
            var destFile = new fsw.File(tmpPath, file2);
            return file.copy(destFile).then(() => {
                var txt = fs.readFileSync(destFile.path, "utf8");
                assert.strictEqual(txt, tmpContent);
            });
        });

        it("should move", () => {
            var file = new fsw.File(tmpPath, file2);
            var destFile = new fsw.File(tmpPath, file3);

            fs.writeFileSync(file.path, tmpContent, "utf8");

            return file.move(destFile)
                .then(() => file.exists())
                .then(exists => {
                    assert(!exists);
                    return destFile.exists();
                })
                .then(exists => {
                    var txt = fs.readFileSync(destFile.path, "utf8");
                    assert.strictEqual(txt, tmpContent);
                });
        });

        it("should make", () => {
            var file = new fsw.File(tmpPath, file2);

            return file.make()
                .then(() => file.exists())
                .then(exists => assert(exists));
        });

        it("should remove", () => {
            var file = new fsw.File(tmpPath, file2);

            return file.make()
                .then(() => file.exists())
                .then(exists => {
                    assert(exists);
                    return file.remove();
                })
                .then(() => file.exists())
                .then(exists => assert(!exists));
        });

        it("should read", () => {
            var file = new fsw.File(tmpPath, file1);

            return file.read("utf8").then(txt => {
                assert.strictEqual(txt, tmpContent);
            });
        });

        it("should write", () => {
            var file = new fsw.File(tmpPath, file2);

            return file.write(tmpContent, "utf8").then(() => {
                var txt = fs.readFileSync(file.path, "utf8");
                assert.strictEqual(txt, tmpContent);
            });
        });

        it("should write and read in SJIS", () => {
            var file = new fsw.File(tmpPath, file2);

            return file.write(tmpContent, "SJIS")
                .then(() => file.read("SJIS"))
                .then(txt => {
                    assert.strictEqual(txt, tmpContent);
                });
        });

    });

    describe("Folder", () => {

        var dir1 = "tmp1";
        var dir2 = "tmp2";

        before(() => {
            del.sync(tmpPath, { force: true });
            fs.mkdirSync(tmpPath);
        });

        after(() => {
            del.sync(tmpPath, { force: true });
        });

        afterEach(() => {
            del.sync([
                path.join(tmpPath, dir1),
                path.join(tmpPath, dir2)
            ], { force: true });
        });

        it("should get path", () => {
            var folder = new fsw.Folder(tmpPath);
            assert.strictEqual(folder.path, tmpPath);
        });

        it("should construct with multiple path", () => {
            var folder = new fsw.Folder(tmpPath, dir1);
            assert.strictEqual(folder.path, path.join(tmpPath, dir1));
        });

        it("should get stats", () => {
            var folder = new fsw.Folder(tmpPath);
            return folder.stat().then(() => assert(true));
        });

        it("should exist", () => {
            var folder = new fsw.Folder(tmpPath);
            return folder.exists().then(exists => assert(exists));
        });

        it("should get parent directory", () => {
            var folder = new fsw.Folder(tmpPath, dir1);
            var parent = folder.parent();
            assert(parent instanceof fsw.Folder, "instanceof fsw.Folder");
            assert.strictEqual(parent.path, tmpPath, "path");
        });

        it("should make", () => {
            var folder = new fsw.Folder(tmpPath, dir1);

            return folder.make()
                .then(() => folder.exists())
                .then(exists => assert(exists));
        });

        it("should remove", () => {
            var folder = new fsw.Folder(tmpPath, dir1);

            return folder.make()
                .then(folder.remove())
                .then(() => folder.exists())
                .then(exists => assert(!exists));
        });

        it("should get childFile", () => {
            var folder = new fsw.Folder(tmpPath);
            var child = folder.childFile(dir1);
            assert(child instanceof fsw.File, "instanceof fsw.File");
            assert.strictEqual(child.path, path.join(tmpPath, dir1), "path");
        });

        it("should get childFile with multiple path", () => {
            var folder = new fsw.Folder(tmpPath);
            var child = folder.childFile(dir1, dir2);
            assert(child instanceof fsw.File, "instanceof fsw.File");
            assert.strictEqual(child.path, path.join(tmpPath, dir1, dir2), "path");
        });

        it("should get childFolder", () => {
            var folder = new fsw.Folder(tmpPath);
            var child = folder.childFolder(dir1);
            assert(child instanceof fsw.Folder, "instanceof fsw.Direcotry");
            assert.strictEqual(child.path, path.join(tmpPath, dir1), "path");
        });

        it("should get childFolder with multiple path", () => {
            var folder = new fsw.Folder(tmpPath);
            var child = folder.childFolder(dir1, dir2);
            assert(child instanceof fsw.Folder, "instanceof fsw.Folder");
            assert.strictEqual(child.path, path.join(tmpPath, dir1, dir2), "path");
        });

        it("should get children", () => {
            fs.mkdirSync(path.join(tmpPath, dir1));
            fs.writeFileSync(path.join(tmpPath, dir2), "", "utf8");
            var folder = new fsw.Folder(tmpPath);

            return folder.children().then(children => {
                assert(children.length === 2, "length");
                assert(children[0] instanceof fsw.Folder, "first child is folder");
                assert(children[1] instanceof fsw.File, "second child is file");
                assert(children[0].path, path.join(tmpPath, dir1), "first child path");
                assert(children[1].path, path.join(tmpPath, dir2), "second child path");
            });
        });

        it("should get children with regexp", () => {
            fs.mkdirSync(path.join(tmpPath, dir1));
            fs.writeFileSync(path.join(tmpPath, dir2), "", "utf8");

            var folder = new fsw.Folder(tmpPath);
            var regexp = new RegExp(dir2);

            return folder.children(regexp).then(children => {
                assert(children.length === 1, "length");
                assert(children[0] instanceof fsw.File, "first child is file");
                assert(children[0].path, path.join(tmpPath, dir2), "first child path");
            });
        });

        it("should get childFiles", () => {
            fs.mkdirSync(path.join(tmpPath, dir1));
            fs.writeFileSync(path.join(tmpPath, dir2), "", "utf8");

            var folder = new fsw.Folder(tmpPath);

            return folder.childFiles().then(children => {
                assert(children.length === 1, "length");
                assert(children[0] instanceof fsw.File, "first child is file");
                assert(children[0].path, path.join(tmpPath, dir2), "first child path");
            });
        });

        it("should get childFolders", () => {
            fs.mkdirSync(path.join(tmpPath, dir1));
            fs.writeFileSync(path.join(tmpPath, dir2), "", "utf8");

            var folder = new fsw.Folder(tmpPath);

            return folder.childFolders().then(children => {
                assert(children.length === 1, "length");
                assert(children[0] instanceof fsw.Folder, "first child is Folder");
                assert(children[0].path, path.join(tmpPath, dir1), "first child path");
            });
        });

    });

});
