"use strict";

core.on("initialize", co.wrap(function* (options) {
    var avs = new File(options.path.user, "avisynth_scripts", options.settings.avs);

    if (!(yield avs.exists())) {
        options.error("avsが存在しません");
        return false;
    }

    return true;
}));

core.on("frameserver", co.wrap(function* (options) {
    var scripts = new Folder(options.user, "avisynth_scripts");
    var orig_avs = scripts.childFile(options.settings.avs + ".avs");
    var avs = new File(options.path.temp + ".orig.avs");

    //avsiの取得
    var imports = "";
    var files;
    try {
        files = yield scripts.childFiles(/\.avsi$/);
    } catch(err) {
        options.error("avsiの取得に失敗しました");
        return false;
    }

    if (files.length !== 0) {
        files = files.map(function (value) {
            return '"' + value.path + '"';
        });
        imports = "Import(" + files.join(", ") + ")";
    }

    //avsの読み込み
    var script;
    try {
        script = yield orig_avs.read("sjis");
    } catch(err) {
        options.error("orig_avsの読み込みに失敗しました");
        return false;
    }

    //avsの置き換え
    script = script.replace(/__user__/g, options.user);
    script = script.replace(/#__import__/g, imports);

    //avsの書き込み
    try {
        yield avs.write(script, "sjis");
    } catch(err) {
        options.error("avsの書き込みに失敗しました");
        return false;
    }

    //global.avswriterの定義
    options.global.avswriter = {};

    return true;
}));
