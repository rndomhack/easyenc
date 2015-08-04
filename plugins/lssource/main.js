"use strict";

core.on("initialize", co.wrap(function* (options) {
    return true;
}));

core.on("source", co.wrap(function* (options) {
    if (options.global.info.general.format !== "MPEG-4") {
        error("L-SMASH Sourceで読み込めない形式です");
        return false;
    }

    var input = options.global.input = {};
    var info = options.global.info;
    var video_delay = "source_delay" in info.video[0] ? info.video[0].source_delay : 0;
    input.video = {
        path: options.input,
        format: 'LSMASHVideoSource("${path}", track = ' + info.video[0].id + ')'
    };
    input.audio = info.audio.map(function (value) {
        return {
            path: options.input,
            format: 'LSMASHAudioSource("${path}", track = ' + value.id + ')',
            delay: "source_delay" in value ? (value.source_delay - video_delay) / 1000 : -(video_delay / 1000)
        };
    });

    return true;
}));
