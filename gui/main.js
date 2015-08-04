"use strict";

var path = require("path");

require("crash-reporter").start();
var app = require("app");
var BrowserWindow = require("browser-window");
var Menu = require("menu");

var fileUrl = require("./util/fileUrl.js");

var mainWindow;

app.on("window-all-closed", () => {
    if (process.platform !== "darwin")
        app.quit();
});

app.on("ready", () => {
    mainWindow = new BrowserWindow({ width: 640, height: 480 });
    mainWindow.setMenu(null);
    mainWindow.loadUrl(fileUrl("index.html"));

    mainWindow.on("closed", () => {
        mainWindow = null;
    });
});
