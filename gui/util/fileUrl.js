"use strict";

var path = require("path");

module.exports = function() {
    var pathName = path.resolve(path.join.apply(null, arguments)).replace(/\\/g, "/");

    if (pathName[0] !== "/")
        pathName = "/" + pathName;

    return encodeURI("file://" + pathName);
};
