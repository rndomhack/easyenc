"use strict";

core.on("initialize", co.wrap(function* (options) {
    var dgindex = new File(options.settings[options.settings.dgindex_type + "_path"]);
    var ts2aac = new File(options.settings.ts2aac_path);

    if (!(yield dgindex.exists())) {
        error(options.settings.dgindex_type + "が存在しません");
        return false;
    }

    if (options.settings.ts2aac && !(yield ts2aac.exists())) {
        error("ts2aacが存在しません");
        return false;
    }

    return true;
}));

core.on("source", co.wrap(function* (options) {
    var avs = new File(options.temp + ".avs");
    var dgindex_avs = new File(options.temp + ".dgindex.avs");
    var fake_avs = new File(options.temp + ".dgindex.fake.avs");
    var ts2aac_txt = new File(options.temp + ".ts2aac.txt");
    var output_video, output_audio = [], output_delay = [], vformat = "";

    //pidの列挙
    var video_pid = -1;
    var audio_pid = [-1];
    if ("info" in options.global) {
        if ("video" in options.global.info || "audio" in options.global.info) {
            video_pid = options.global.info.video[0].id;
            audio_pid = options.global.info.audio.map(function (value) {
                return value.id;
            });
        }
    }

    //fake_avsの書き込み
    var fake_script = "__vid__\r\n__aud__\r\n__del__";
    try {
        yield fake_avs.write(fake_script, "sjis");
    } catch(err) {
        error("dgindex.fake.avsの書き込みに失敗しました");
        return false;
    }

    //dgindex_argsの設定
    var dgindex_args = "";
    if (options.settings.dgindex_type === "dgindex") {
        vformat = "MPEG2Source_";
        dgindex_args += options.settings.dgindex_args;
        dgindex_args += " -exit";
        if (video_pid !== -1) {
            dgindex_args += " -vp " + video_pid.toString(16);
            dgindex_args += " -ap " + audio_pid[0].toString(16);
        }
        dgindex_args += " -om " + (options.settings.ts2aac ? "0" : "1");
    }
    if (options.settings.dgindex_type === "dgindexnv") {
        vformat = "DGSource_";
        dgindex_args += options.settings.dgindexnv_args;
        dgindex_args += " -e";
        if (video_pid !== -1) {
            dgindex_args += " -v " + video_pid.toString(16);
        }
        dgindex_args += options.settings.ts2aac ? "" : " -a";
    }
    if (options.settings.dgindex_type === "dgindexim") {
        vformat = "DGSourceIM_";
        dgindex_args += options.settings.dgindexim_args;
        dgindex_args += " -e";
        if (video_pid !== -1) {
            dgindex_args += " -v " + video_pid.toString(16);
        }
        dgindex_args += options.settings.ts2aac ? "" : " -a";
    }

    //dgindexの実行
    var proc_command, proc_args;
    if (options.settings.dgindex_type === "dgindex") {
        proc_command = '"${dgindex}" -i "${input}" -o "${output}" -at "${avs}" ${args}';
        proc_args = {
            dgindex: options.settings.dgindex_path,
            input: options.input,
            output: options.temp + ".dgindex",
            avs: fake_avs.path,
            args: dgindex_args
        };
    }
    if (options.settings.dgindex_type === "dgindexnv") {
        proc_command = '"${dgindexnv}" -i "${input}" -o "${output}" -at "${avs}" ${args}';
        proc_args = {
            dgindexnv: options.settings.dgindexnv_path,
            input: options.input,
            output: options.temp + ".dgindex.dgi",
            avs: fake_avs.path,
            args: dgindex_args
        };
    }
    if (options.settings.dgindex_type === "dgindexim") {
        proc_command = '"${dgindexim}" -i "${input}" -o "${output}" -at "${avs}" ${args}';
        proc_args = {
            dgindexim: options.settings.dgindexim_path,
            input: options.input,
            output: options.temp + ".dgindex.dgi",
            avs: fake_avs.path,
            args: dgindex_args
        };
    }

    var proc = new Process(proc_command);
    var exec = yield proc.exec(proc_args);
    if (exec.error) {
        error(options.settings.dgindex_type + "の実行に失敗しました");
        return false;
    }

    //dgindex_avsの読み込み
    var dgindex_script;
    try {
        dgindex_script = yield dgindex_avs.read("sjis");
    } catch(err) {
        error("dgindex.avsの読み込みに失敗しました");
        return false;
    }

    var dgindex_arr = dgindex_script.split(/\r\n|\r|\n/);
    if (dgindex_arr[0] === "__vid__") {
        error((options.settings.dgindex_type === "dgindex" ? "d2v" : "dgi") + "へのパスの取得に失敗しました");
        return false;
    }
    if (!/[\\/]/.test(dgindex_arr[0])) {
        dgindex_arr[0] = new options.File(options.temp).parent().childFile(dgindex_arr[0]).path;
    }
    output_video = dgindex_arr[0];

    if (!options.settings.ts2aac) {
        if (dgindex_arr[1] === "__aud__" || dgindex_arr[2] === "__del__") {
            error("dgindex.avsの情報の取得に失敗しました");
            return false;
        }
        if (!/[\\/]/.test(dgindex_arr[1])) {
            dgindex_arr[1] = new File(options.temp).parent().childFile(dgindex_arr[1]).path;
        }
        output_audio.push(dgindex_arr[1]);
        output_delay.push(parseFloat(dgindex_arr[2]));
    }

    if (options.settings.ts2aac) {
        for (let i = 0; i < audio_pid.length; i++) {
            //ts2aac_argsの設定
            var ts2aac_args = options.settings.dgindex_type === "dgindexim" ? "" : "-B";
            if (video_pid !== -1) {
                ts2aac_args += " -v " + video_pid;
                ts2aac_args += " -a " + audio_pid[i];
            }

            //ts2aacの実行
            var proc2 = new Process('"${ts2aac}" -i "${input}" -o "${output}" ${args} > "${stdout}"');
            var exec2 = yield proc2.exec({
                ts2aac: options.settings.ts2aac_path,
                input: options.input,
                output: options.temp + ".ts2aac",
                args: ts2aac_args,
                stdout: ts2aac_txt.path
            });
            if (exec2.error) {
                options.log("Error: ts2aacの実行に失敗しました");
                return false;
            }

            //ts2aac_txtの読み込み
            var ts2aac_out;
            try {
                ts2aac_out = yield ts2aac_txt.read("sjis");
            } catch(err) {
                error("ts2aac.txtの読み込みに失敗しました");
                return false;
            }

            var ts2aac_arr = ts2aac_out.split(/\r\n|\r|\n/);
            var ts2aac_audio, ts2aac_delay;
            for (let j = 0; j < ts2aac_arr.length; j++) {
                if (/^outfile/.test(ts2aac_arr[j])) {
                    ts2aac_audio = ts2aac_arr[j].replace("outfile:", "");
                }
                if (/^audio/.test(ts2aac_arr[j])) {
                    ts2aac_delay = parseInt(ts2aac_arr[j].match(/(-*\d+)ms/)[1]) / 1000;
                }
            }
            if (!ts2aac_audio || !ts2aac_delay) {
                error("ts2aac.txtの情報の取得に失敗しました");
                return false;
            }
            output_audio.push(ts2aac_audio);
            output_delay.push(ts2aac_delay);
        }
    }

    //ファイルチェック
    var files = output_audio.concat(output_video);
    for (let i = 0; i < files.length; i++) {
        if (!(yield new File(files[i]).exists())) {
            error('"' + files[i] + '"が存在しません');
            return false;
        }
    }

    //global.inputの設定
    var video = {
        path: output_video,
        format: vformat + '("${path}")'
    };
    var audio = output_audio.map(function (value, index) {
        return {
            path: output_audio[index],
            delay: output_delay[index]
        };
    });
    options.global.input = {
        video: video,
        audio: audio
    };

    return true;
}));