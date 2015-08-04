"use strict";

core.on("initialize", co.wrap(function* (options) {
    return true;
}));

core.on("source", co.wrap(function* (options) {
    if (options.global.info.general.format !== "MPEG-4") {
        error("L-SMASH Sourceで読み込めない形式です");
        return false;
    }

    var info = options.global.info;
    var vformat = "LSMASHVideoSource_", aformat = "LSMASHAudioSource_";
    var video_delay = "source_delay" in info.video[0] ? info.video[0].source_delay : 0;

    // global.inputの設定
    var video = {
        path: options.input,
        id: info.video[0].id
    };
    var audio = info.audio.map(value => {
        return {
            path: options.input,
            id: value.id,
            delay: "source_delay" in value ? (value.source_delay - video_delay) / 1000 : -(video_delay / 1000)
        };
    });
    var input = options.global.input = {
        video: video,
        audio: audio
    };

    // scriptの形式に変換
    var script_video = `${vformat}("${input.video.path}", track = ${input.video.id})`;
    var script_audio = "";
    var script_delay = "";

    input.audio.forEach((value, index) => {
        var script_audio_selected = `${aformat}("${value.path}", track = ${value.id})`;
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
