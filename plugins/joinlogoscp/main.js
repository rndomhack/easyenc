"use strict";

core.on("initialize", co.wrap(function* (options) {
    var logoframe = new File(options.params.logoframe_path);
    var chapterexe = new File(options.params.chapterexe_path);
    var joinlogoscp = new File(options.params.joinlogoscp_path);
    var cmd = new File(options.params.joinlogoscp_cmd);
    var avs = new File(options.params.avs_path);

    if (!(yield logoframe.exists())) {
        options.log("Error: logoframeが存在しません");
        return false;
    }
    if (!(yield chapterexe.exists())) {
        options.log("Error: chapter_exeが存在しません");
        return false;
    }
    if (!(yield joinlogoscp.exists())) {
        options.log("Error: join_logo_scpが存在しません");
        return false;
    }
    if (!(yield cmd.exists())) {
        options.log("Error: cmdが存在しません");
        return false;
    }
    if (!(yield avs.exists())) {
        options.log("Error: avsが存在しません");
        return false;
    }

    return true;
}));

core.on("others", co.wrap(function* (options) {
    var avs = new File(options.params.avs_path);
    var joinlogoscp_avs = new File(options.path.temp + ".joinlogoscp.avs");
    var logoframe_txt = new File(options.path.temp + ".logoframe.txt");
    var chapterexe_txt = new File(options.path.temp + ".chapterexe.txt");
    var joinlogoscp_txt = new File(options.path.temp + ".joinlogoscp.txt");

    // avsの読み込み
    var script;
    try {
        script = yield avs.read("sjis");
    } catch(err) {
        options.error("avsの読み込みに失敗しました");
        return false;
    }

    // avsの置き換え
    for (let key in options.global.avisynth) {
        script = script.replace(key, options.global.avisynth[key]);
    }

    // avsの書き込み
    try {
        yield joinlogoscp_avs.write(script, "sjis");
    } catch(err) {
        options.error("joinlogoscp.avsの書き込みに失敗しました");
        return false;
    }

    if (options.params.logoframe) {
        // logoframe_logoの設定
        var logoframe_logo = "";
        for (let i = 0; i < options.addons.logo.length; i++) {
            // TODO
            logoframe_logo += ' -logo' + (i + 1) + ' "' + options.addons.logo[i].path + '"';
        }

        // logoframeの実行
        var proc = new Process('"${logoframe}" "${input}" ${logo} -oa "${output}" ${args}');
        var exec = yield proc.exec({
            logoframe: options.params.logoframe_path,
            input: joinlogoscp_avs.path,
            logo: logoframe_logo,
            output: logoframe_txt.path,
            args: options.params.logoframe_args
        });
        if (exec.error) {
            options.error("logoframeの実行に失敗しました");
            return false;
        }

        // ファイルチェック
        if (!(yield logoframe_txt.exists())) {
            options.error("logoframe.txtが存在しません");
            return false;
        }
    }

    if (options.params.chapterexe) {
        // chapterexeの実行
        var proc2 = new Process('"${chapterexe}" -v "${input}" -o "${output}" ${args}');
        var exec2 = yield proc2.exec({
            chapterexe: options.params.chapterexe_path,
            input: joinlogoscp_avs.path,
            output: chapterexe_txt.path,
            args: options.params.chapterexe_args
        });
        if (exec2.error) {
            options.error("chapter_exeの実行に失敗しました");
            return false;
        }

        // ファイルチェック
        if (!(yield chapterexe_txt.exists())) {
            options.error("chapterexe.txtが存在しません");
            return false;
        }
    }

    // joinlogoscpの実行
    var proc3 = new options.Cp('"${joinlogoscp}" ${logoframe} ${chapterexe} -incmd "${cmd}" -o "${output}" ${args}');
    var exec3 = yield proc3.exec({
        joinlogoscp: options.params.joinlogoscp_path,
        logoframe: options.params.logoframe ? '-inlogo "' + logoframe_txt.path + '"' : "",
        chapterexe: options.params.chapterexe ? '-inscp "' + chapterexe_txt.path + '"' : "",
        cmd: options.params.joinlogoscp_cmd,
        output: joinlogoscp_txt.path,
        args: options.params.joinlogoscp_args
    });
    if (exec3.error) {
        options.error("join_logo_scpの実行に失敗しました");
        return false;
    }

    // ファイルチェック
    if (!(yield joinlogoscp_txt.exists())) {
        options.error("joinlogoscp.txtが存在しません");
        return false;
    }

    // trim情報を取得
    var loinlogoscp_out;
    try {
        loinlogoscp_out = yield joinlogoscp_txt.read("sjis");
    } catch(err) {
        options.error("joinlogoscp.txtの読み込みに失敗しました");
        return false;
    }

    var loinlogoscp_arr = loinlogoscp_out.split(/\r\n|\r|\n/);
    var trim_format = / *(\+\+|) *trim *\( *(\d+) *, *(\d+) *\)/ig;
    var trim = options.global.trim = [];

    var check = loinlogoscp_arr.some(value => {
        if (/^#/.test(value)) return false;
        var test = trim_format.test(value);
        if (test) {
            value.replace(trim_format, ($0, $1, $2, $3) => {
                trim.push({
                    start: parseInt($2),
                    end: parseInt($3)
                });
            });
            return true;
        }
    });
    if (!check) {
        options.error("trimの取得に失敗しました");
        return false;
    }

    return true;
}));
