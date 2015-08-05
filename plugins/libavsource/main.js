"use strict";

core.on("initialize", co.wrap(function* (options) {
    return true;
}));

core.on("source", co.wrap(function* (options) {
    // formatの定義
    var video_format =
        options.params.ownformat_video ?
            options.params.ownformat_video :
            'LWLibavVideoSource_("${path}"${args})';
    var audio_format =
        options.params.ownformat_audio ?
            options.params.ownformat_audio :
            'LWLibavAudioSource_("${path}"${args})';

    // formatの設定
    var video, audio;
    if ("info" in options.global) {
        var video_streamorder = options.global.info.video[0].streamorder.split("-");
        video = {
            path: options.path.input,
            format: video_format,
            index: parseInt(video_streamorder[video_streamorder.length - 1])
        };
        audio = [];
        options.global.info.audio.forEach(value => {
            var audio_streamorder = value.streamorder.split("-");
            input.audio.push({
                path: options.path.input,
                format: audio_format,
                index: parseInt(audio_streamorder[audio_streamorder.length - 1]),
                sync: true
            });
        });
    } else {
        video = {
            path: options.path.input,
            format: video_format
        };
        audio = [{
            path: options.path.input,
            format: audio_format,
            sync: true
        }];
    }
    var input = options.global.input = {
        video: video,
        audio: audio
    };

    // scriptの形式に変換
    var script_video, script_audio, script_delay;

    script_video = input.video.format.replace("${path}", input.video.path);

    var video_args = "";
    video_args += input.video.index ? ", stream_index = " + input.video.index : "";
    script_video = script_video.replace("${args}", video_args);

    input.audio.forEach((value, index) => {
        var script_audio_selected = value.format.replace("${path}", value.path);
        var script_delay_selected = "delay" in value ? value.delay : 0;

        var audio_args = "";
        audio_args += value.index ? ", stream_index = " + value.index : "";
        audio_args += value.sync ? ", av_sync = true" : "";
        script_audio_selected = script_audio_selected.replace("${args}", audio_args);

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
