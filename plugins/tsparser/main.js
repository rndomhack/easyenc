"use strict";

core.on("initialize", co.wrap(function* (options) {
    var tsparser = new File(options.params.tsparser_path);

    if (!(yield tsparser.exists())) {
        options.error("ts_parserが存在しません");
        return false;
    }
    return true;
}));

core.on("source", co.wrap(function* (options) {
    var vformat = options.params.use_vfp ? "MPEG2VIDEO_" : "LWLibavVideoSource_",
        aformat = "LWLibavAudioSource_";
    var tsparser_txt = new File(options.path.temp + ".tsparser.txt");
    var demux_video = options.params.demux_video || options.params.use_vfp;

    //tsparserの実行
    var proc = new Process('"${tsparser}" --output "${output}" --mode ${mode} --delay-type ${delaytype} --debug 2 --log "${log}" "${input}"');
    var exec = yield proc.exec({
        tsparser: options.params.tsparser_path,
        output: options.path.temp + ".tsparser",
        mode: "d" + (demux_video ? "v" : "") + "a",
        delaytype: options.params.use_vfp ? "1" : "3",
        log: tsparser_txt.path,
        input: options.path.input
    });
    if (proc.error) {
        options.error("ts_parserの実行に失敗しました");
        return false;
    }

    //tsparser_txtの読み込み
    var tsparser_out;
    try {
        tsparser_out = yield tsparser_txt.read("sjis");
    } catch(err) {
        options.error("tsparser.txtの読み込みに失敗しました");
        return false;
    }
    var tsparser_arr = tsparser_out.split(/\r\n|\r|\n/);

    //pidの取得
    var video_id = [], audio_id = [];
    tsparser_arr.forEach(value => {
        var match = value.match(/\[check\] ([^ ]+) PID:(0x[\dA-F]+) {2}stream_type:(0x[\dA-F]+)/);
        if (!match) return;
        if (match[1] === "video") {
            video_id.push(parseInt(match[2], 16));
        }
        if (match[1] === "audio") {
            audio_id.push(parseInt(match[2], 16));
        }
    });
    if (video_id.length === 0) {
        options.error("映像PIDの取得に失敗しました");
        return false;
    }
    if (audio_id.length === 0) {
        options.error("音声PIDの取得に失敗しました");
        return false;
    }

    //ファイルチェック
    var regexp_base = (new File(options.path.temp).base + ".tsparser").replace(/\W/g, str => {
        return "\\" + str;
    });
    var temp_parent = new File(options.path.temp).parent();
    var files, video_files = [], audio_files = [];

    if (demux_video) {
        for (let i = 0; i < video_id.length; i++) {
            files = temp_parent.childFiles(new RegExp(regexp_base + " PID " + video_id[i].toString(16)));
            if (files.length !== 1) {
                options.error("出力映像ファイルが存在しません");
                return false;
            }
            video_files.push({
                path: files[0].path,
                id: video_id[i]
            });
        }
    } else {
        for (let i = 0; i < video_id.length; i++) {
            let obj = {
                path: options.path.input,
                id: video_id[i]
            };
            if ("info" in options.global) {
                for (let j = 0; j < options.global.info.video.length; j++) {
                    if (options.global.info.video[j].pid === video_id[i]) {
                        let streamorder = options.global.info.video[j].streamorder.split("-");
                        obj.index = parseInt(streamorder[streamorder.length - 1]);
                    }
                }
            }
            video_files.push(obj);
        }
    }

    for (let i = 0; i < audio_id.length; i++) {
        files = temp_parent.childFiles(new RegExp(regexp_base + " PID " + audio_id[i].toString(16)));
        if (files.length !== 1) {
            options.error("出力音声ファイルが存在しません");
            return false;
        }
        let match = files[0].base.match(/DELAY (-*\d+)ms/);
        audio_files.push({
            path: files[0].path,
            id: audio_id[i],
            delay: match ? parseInt(match[1]) / 1000 : 0
        });
    }

    //global.infoの内容と照合
    if ("info" in options.global) {
        video_files = video_files.filter(value => {
            var filter = options.global.info.video.filter(value2 => {
                return value.id === value2.id;
            });
            return filter.length !== 0;
        });
        if (video_files.length === 0) {
            options.error("必要な出力映像ファイルが存在しません");
            return false;
        }
        audio_files = audio_files.filter(value => {
            var filter = options.global.info.audio.filter(value2 => {
                return value.id === value2.id;
            });
            return filter.length !== 0;
        });
        if (audio_files.length === 0) {
            options.error("必要な出力音声ファイルが存在しません");
            return false;
        }
    }

    //global.inputの設定
    var input = options.global.input = {
        video: video_files[0],
        audio: audio_files
    };

    // scriptの形式に変換
    var script_video = `${vformat}("${input.video.path}"${"index" in input.video ? ", stream_index = " + input.video.index : ""})`;
    var script_audio = "";
    var script_delay = "";

    input.audio.forEach((value, index) => {
        var script_audio_selected = `${aformat}("${value.path}")`;
        var script_delay_selected = value.delay;

        if (index === 0) {
            script_audio = script_audio_selected;
            script_delay = script_delay_selected;
        } else {
            script_audio = '"__audioid__" == "' + index + '" ? ' + script_audio_selected + ' : ' + script_audio;
            script_delay = '"__audioid__" == "' + index + '" ? ' + script_delay_selected + ' : ' + script_delay;
        }
    });

    // global.avisynthに設定
    options.global.avisynth.__video__ = script_video;
    options.global.avisynth.__audio__ = script_audio;
    options.global.avisynth.__delay__ = script_delay;

    return true;
}));
