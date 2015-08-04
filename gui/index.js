"use strict";

var flags = [
    "--es_staging",
    "--harmony",
    "--harmony_shipping",
    "--harmony_modules",
    "--harmony_regexps",
    "--harmony_proxies",
    "--harmony_numeric_literals",
    "--harmony_arrays",
    "--harmony_array_includes",
    "--harmony_arrow_functions",
    "--harmony_rest_parameters",
    "--harmony_sloppy",
    "--harmony_unicode",
    "--harmony_unicode_regexps",
    "--harmony_computed_property_names"
];

var v8 = require("v8");
flags.forEach(function(flag) {
    v8.setFlagsFromString(flag);
});

var app = require("app");
app.commandLine.appendSwitch("js-flags", flags.join(" "));

require("./main.js");
