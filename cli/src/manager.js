"use strict";

var EventEmitter = require("events").EventEmitter;
var vm = require("vm");
var co = require("co");
var cpw = require("../lib/cpw.js");
var fsw = require("../lib/fsw.js");

class Core {
    constructor() {
        this._events = new Map();
    }

    on(event, func) {
        if (!this._events.has(event)) {
            this._events.set(event, new Set());
        }

        if (this._events.get(event).has(func)) {
            return this;
        }

        this._events.get(event).add(func);

        return this;
    }

    off(event, func) {
        if (!this._events.has(event)) {
            return this;
        }

        if (!this._events.get(event).has(func)) {
            return this;
        }

        this._events.get(event).delete(func);
        if (this._events.get(event).size === 0) {
            this._events.delete(event);
        }

        return this;
    }

    emit(event, options) {
        return co((function* () {
            if (!this._events.has(event)) {
                return;
            }

            this._events.get(event).forEach(func => {
                yield func(options);
            });
        }).bind(this));
    }
}

class Plugin {
    constructor(path) {
        this._path = path;
        this._core = new Core();
        this._settings = null;
    }

    init() {
        return co((function* () {
            var plugin_folder = new fsw.Folder(this._path);

            // Read plugin.json
            var plugin_json = plugin_folder.childFile("plugin.json");

            if (!(yield plugin_json.exists())) {
                throw new Error(`Plugin: Can't find plugin.json (${plugin_folder.name})`);
            }

            var plugin_json_read;
            try {
                plugin_json_read = yield plugin_json.read("utf8");
            } catch(err) {
                throw new Error(`Plugin: Can't read plugin.json (${plugin_folder.name})`);
            }

            var plugin_json_obj;
            try {
                plugin_json_obj = JSON.parse(plugin_json_read);
            } catch(err) {
                throw new Error(`Plugin: Can't parse plugin.json (${plugin_folder.name})`);
            }

            // Read main script
            var plugin_main = plugin_folder.childFile(plugin_json_obj.main);

            var plugin_main_read;
            try {
                plugin_main_read = yield plugin_main.read("utf8");
            } catch(err) {
                throw new Error(`Plugin: Can't read main script (${plugin_folder.name})`);
            }

            var context = {
                log: console.log,
                error: console.error,
                co: co,
                Process: cpw.Process,
                File: fsw.File,
                Folder: fsw.Folder,
                core: this._core
            };
            try {
                vm.runInNewContext(plugin_main_read, context);
            } catch(err) {
                throw new Error(`Plugin: Can't run main script (${plugin_folder.name})`);
            }

            this._settings = plugin_json_obj;
        }).bind(this));
    }

    get core() {
        return this._core;
    }

    get settings() {
        return this._settings;
    }

    /*check(settings) {
        if (typeof settings !== "object" || settings === null)
            return false;

        if (typeof settings.name !== "string")
            return false;
        if (typeof settings.description !== "string")
            return false;
        if (!Array.isArray(settings.dependencies))
            return false;
        if (![
            "frameserver",
            "preprocess",
            "source",
            "others",
            "video_encoder",
            "audio_encoder",
            "encoder",
            "muxer",
            "postprocess"
        ].includes(settings.type))
            return false;

        return true;
    }*/
}

class Manager {
    constructor(path) {
        this._path = path;
        this._plugins = null;
    }

    init() {
        return co((function* () {
            var plugins = {};
            var plugin_root = new fsw.Folder(this._path);
            var plugin_folders = yield plugin_root.childFolders();

            plugin_folders.forEach(plugin_folder => {
                var plugin = new Plugin(plugin_folder.path);
                try {
                    yield plugin.init();
                } catch(err) {
                    return;
                }
                plugins[plugin.settings.name] = plugin;
            });

            this._plugins = plugins;
        }).bind(this));
    }
}

module.exports = {
    Core: Core,
    Plugin: Plugin,
    Manager: Manager
};
