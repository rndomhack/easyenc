"use strict";

core.on("initialize", co.wrap(function* (options) {
    var ffprobe = new File(options.params.ffprobe_path);

    if (!(yield ffprobe.exists())) {
        options.error("ffprobeが存在しません");
        return false;
    }

    return true;
}));

core.on("preprocess", co.wrap(function* (options) {
    var ffprobe_json = new File(options.temp + ".ffprobe.json");

    // ffprobeの実行
    var proc = new Process('"${ffprobe}" -i "${input}" ${args} > "${stdout}"');
    var exec = yield proc.exec({
        ffprobe: options.params.ffprobe_path,
        input: options.path.input,
        args: "-show_packets -show_streams -print_format json",
        stdout: ffprobe_json.path
    });
    if (exec.error) {
        options.error("ffprobeの実行に失敗しました");
        return false;
    }

    // ffprobe_jsonの読み込み
    var ffprobe_out;
    try {
        ffprobe_out = yield ffprobe_json.read("utf8");
    } catch(err) {
        options.error("ffprobe.jsonの読み込みに失敗しました");
        return false;
    }

    // 出力情報の取得
    var ffprobe_obj;
    try {
        ffprobe_obj = JSON.parse(ffprobe_out);
    } catch (err) {
        options.error("ffprobe.jsonの情報の取得に失敗しました");
        return false;
    }

    // durationによるストリームの選別
    var out = {
        video: {},
        audio: {}
    };
    ffprobe_obj.streams.forEach(value => {
        if (!("codec_type" in value)) return;

        out[value.codec_type][value.index] = {
            id: parseInt(value.id, 16),
            duration: 0,
            dts: 0
        };
    });
    ffprobe_obj.packets.forEach(value => {
        if (!("codec_type" in value)) return;

        var stream = out[value.codec_type][value.stream_index];
        var prev_dts = stream.dts;
        var dts = stream.dts = parseFloat(value.dts_time);
        var duration = dts - prev_dts;
        if (duration < 0 || duration > 1) return;

        stream.duration += duration;
    });

    var duration;
    var video = -1;
    var audio = [];
    duration = 0;
    for (let key in out.video) {
        if (out.video[key].duration > duration) {
            video = out.video[key].id;
            duration = out.video[key].duration;
        }
    }
    duration = 0;
    for (let key in out.audio) {
        if (out.audio[key].duration > duration) {
            duration = out.audio[key].duration;
        }
    }
    for (let key in out.audio) {
        if (out.audio[key].duration >= duration * options.params.audio_threshold) {
            audio.push(out.audio[key].id);
        }
    }

    // global.infoを置換
    var info = options.global.info;
    if ("video" in info) {
        info.video = info.video.filter(value => value.id === video);
    }
    if ("audio" in info) {
        info.audio = info.audio.filter(value => audio.includes(value.id));
    }

    return true;
}));
