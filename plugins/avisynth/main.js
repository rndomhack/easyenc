"use strict";

core.on("initialize", co.wrap(function* (options) {
    var avs = new File(options.path.user, "avisynth_scripts", options.params.avs);

    if (!(yield avs.exists())) {
        options.error("avsが存在しません");
        return false;
    }

    return true;
}));

core.on("frameserver", co.wrap(function* (options) {
    var scripts = new Folder(options.path.user, "avisynth_scripts");
    var orig_avs = scripts.childFile(options.params.avs + ".avs");
    var avs = new File(options.path.temp + ".orig.avs");

    // avsiの取得
    var imports = "";
    var files;
    try {
        files = yield scripts.childFiles(/\.avsi$/);
    } catch(err) {
        options.error("avsiの取得に失敗しました");
        return false;
    }

    if (files.length !== 0) {
        files = files.map(value => {
            return '"' + value.path + '"';
        });
        imports = "Import(" + files.join(", ") + ")";
    }

    // avsの読み込み
    var script;
    try {
        script = yield orig_avs.read("sjis");
    } catch(err) {
        options.error("orig_avsの読み込みに失敗しました");
        return false;
    }

    // avsの置き換え
    script = script.replace(/__user__/g, options.path.user);
    script = script.replace(/#__import__/g, imports);

    // avsの書き込み
    try {
        yield avs.write(script, "sjis");
    } catch(err) {
        options.error("avsの書き込みに失敗しました");
        return false;
    }

    // global.avisynthの定義
    options.global.avisynth = {};

    return true;
}));

core.on("editor", co.wrap(function* (options) {
    var orig_avs = new File(options.path.temp + ".orig.avs");
    var avs = new File(options.path.temp + ".avs");

    //avsの読み込み
    var script;
    try {
        script = yield orig_avs.read("sjis");
    } catch(err) {
        options.error("orig_avsの読み込みに失敗しました");
        return false;
    }

    //avsの置き換え
    for (let key in options.global.avisynth) {
        script = script.replace(key, options.global.avisynth[key]);
    }

    //avsの書き込み
    try {
        yield avs.write(script, "sjis");
    } catch(err) {
        options.error("avsの書き込みに失敗しました");
        return false;
    }

    return true;
}));
