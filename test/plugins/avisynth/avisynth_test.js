"use strict";

module.exports = pluginTest => {

    var options = {
        params: {
            avs: "test.avs"
        }
    };

    pluginTest.initTest();
    pluginTest.emitTest("init", options);
    pluginTest.emitTest("frameserver", options);
    pluginTest.emitTest("editor", options);
};
