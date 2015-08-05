"use strict";

core.on("initialize", co.wrap(function* (options) {
    var mediainfo = new File(options.params.mediainfo_path);

    if (!(yield mediainfo.exists())) {
        options.error("MediaInfoが存在しません");
        return false;
    }

    return true;
}));

core.on("preprocess", co.wrap(function* (options) {
    var mediainfo_txt = new File(options.path.temp + ".mediainfo.txt");

    // mediainfoの実行
    var proc = new Process('"${mediainfo}" "${input}" ${args} > "${stdout}"');
    var exec = yield proc.exec({
        mediainfo: options.params.mediainfo_path,
        input: options.path.input,
        args: "-f",
        stdout: mediainfo_txt.path
    });
    if (exec.error) {
        options.error("MediaInfoの実行に失敗しました");
        return false;
    }

    // mediainfo_txtの読み込み
    var mediainfo_out;
    try {
        mediainfo_out = yield mediainfo_txt.read("utf8");
    } catch(err) {
        options.error("mediainfo.txtの読み込みに失敗しました");
        return false;
    }

    // 出力情報の取得
    var mediainfo_arr = mediainfo_out.split(/\r\n|\r|\n/);
    var info = {
        general: {}
    };
    var current;
    mediainfo_arr.forEach(value => {
        var match = value.match(/^(.*?) +: +(.*)$/);
        if (!match) {
            if (value === "") {
                current = null;
            } else if (value === "General") {
                current = info.general;
            } else {
                var name = value.split(" ")[0].toLowerCase();
                if (!(name in info)) {
                    info[name] = [];
                }
                info[name].push({});
                current = info[name][info[name].length - 1];
            }
        } else {
            if (current === null) return;

            match[1] = match[1].split(/\W/g).join("_").toLowerCase();
            if (match[1] in current) return;

            if (match[2].match(/^-*\d+$/)) {
                match[2] = parseInt(match[2]);
            } else if (match[2].match(/^-*[\d.]+$/)) {
                match[2] = parseFloat(match[2]);
            }
            current[match[1]] = match[2];
        }
    });

    // ストリームチェック
    if (!("video" in info)) {
        options.error("映像が存在しません");
        return false;
    }
    if (!("video" in info)) {
        options.error("音声が存在しません");
        return false;
    }

    // global.infoの設定
    options.global.info = info;

    return true;
}));
