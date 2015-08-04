(function() {
    "use strict";

    var remote = require("remote");
    var keyboardjs = require("keyboardjs");

    var showDevTools = () => remote.getCurrentWindow().toggleDevTools();
    keyboardjs.bind("ctrl+shift+i", showDevTools);
    keyboardjs.bind("f12", showDevTools);

})();
