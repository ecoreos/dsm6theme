/* Copyright (c) INTEGRA EMPRESAS 2016. All rights reserved. */

Ext.namespace("SYNO.SDS.TaskRunner");
SYNO.SDS._TaskMgr = function(n) {
    var e = n || 10,
        h = [],
        a = [],
        d = 0,
        i = false,
        l = false,
        j = function(o, q) {
            var p;
            while (q !== 0) {
                p = o % q;
                o = q;
                q = p
            }
            return o
        },
        g = function() {
            var p, o, q = h[0].interval;
            for (p = 1;
                (o = h[p]); p++) {
                q = j(q, o.interval)
            }
            return Math.max(q, n)
        },
        f = function() {
            var o = g();
            if (o !== e) {
                e = o;
                return true
            }
            return false
        },
        c = function() {
            i = false;
            clearTimeout(d);
            d = 0
        },
        k = function() {
            if (!i) {
                i = true;
                f();
                setImmediate(m)
            }
        },
        b = function(o) {
            a.push(o);
            if (o.onStop) {
                o.onStop.apply(o.scope || o)
            }
        },
        m = function() {
            var u, s, r, o, p, w = false,
                q = new Date().getTime();
            for (u = 0;
                (s = a[u]); u++) {
                h.remove(s);
                w = true
            }
            a = [];
            if (!h.length) {
                c();
                return
            }
            for (u = 0;
                (s = h[u]); ++u) {
                s = h[u];
                if (l && s.preventHalt !== true) {
                    b(s);
                    continue
                }
                o = q - s.taskRunTime;
                if (s.interval <= o) {
                    try {
                        p = s.run.apply(s.scope || s, s.args || [++s.taskRunCount])
                    } catch (v) {
                        if (!Ext.isIE) {
                            SYNO.Debug.error("TaskRunner: task " + s.id + " exception: ", v);
                            if (Ext.isDefined(SYNO.SDS.JSDebug)) {
                                s.taskRunTime = q;
                                throw v
                            }
                        }
                    }
                    s.taskRunTime = q;
                    r = s.interval;
                    s.interval = s.adaptiveInterval();
                    if (r !== s.interval) {
                        w = true
                    }
                    if (p === false || s.taskRunCount === s.repeat) {
                        b(s);
                        return
                    }
                }
                if (s.duration && s.duration <= (q - s.taskStartTime)) {
                    b(s)
                }
            }
            if (w) {
                f()
            }
            d = setTimeout(m, e)
        };
    this.start = function(p, o) {
        var q = new Date().getTime();
        h.push(p);
        p.taskStartTime = q;
        p.taskRunTime = (false === o) ? q : 0;
        p.taskRunCount = 0;
        if (!i) {
            k()
        } else {
            f();
            clearTimeout(d);
            setImmediate(m)
        }
        return p
    };
    this.stop = function(o) {
        b(o);
        return o
    };
    this.stopAll = function() {
        var p, o;
        c();
        for (p = 0;
            (o = h[p]); p++) {
            if (o.onStop) {
                o.onStop()
            }
        }
        h = [];
        a = []
    };
    this.setHalt = function(o) {
        l = o
    }
};
SYNO.SDS.TaskMgr = new SYNO.SDS._TaskMgr(100);
SYNO.SDS.TaskRunner = Ext.extend(Ext.util.Observable, {
    tasks: null,
    constructor: function() {
        SYNO.SDS.TaskRunner.superclass.constructor.apply(this, arguments);
        this.addEvents("add", "remove", "beforestart");
        this.tasks = {}
    },
    destroy: function() {
        this.stopAll();
        this.tasks = {};
        this.isDestroyed = true
    },
    start: function(b, a) {
        if (this.isDestroyed) {
            return
        }
        if (!b.running) {
            this.fireEvent("beforestart", b);
            SYNO.SDS.TaskMgr.start(b, a)
        }
        b.running = true;
        return b
    },
    stop: function(a) {
        if (a.running) {
            SYNO.SDS.TaskMgr.stop(a)
        }
        a.running = false;
        return a
    },
    stopAll: function() {
        for (var a in this.tasks) {
            if (this.tasks.hasOwnProperty(a)) {
                if (!this.tasks[a].running) {
                    continue
                }
                SYNO.SDS.TaskMgr.stop(this.tasks[a])
            }
        }
    },
    addTask: function(a) {
        a.id = a.id || Ext.id();
        this.tasks[a.id] = a;
        this.fireEvent("add", a);
        return a
    },
    createTask: function(b) {
        b.id = b.id || Ext.id();
        var a = this.tasks[b.id];
        if (a) {
            a.apply(b)
        } else {
            a = new SYNO.SDS.TaskRunner.Task(b, this);
            this.addTask(a)
        }
        return a
    },
    createAjaxTask: function(b) {
        b.id = b.id || Ext.id();
        var a = this.tasks[b.id];
        if (a) {
            a.apply(b)
        } else {
            a = new SYNO.SDS.TaskRunner.AjaxTask(b, this);
            this.addTask(a)
        }
        return a
    },
    createWebAPITask: function(b) {
        b.id = b.id || Ext.id();
        var a = this.tasks[b.id];
        if (a) {
            a.apply(b)
        } else {
            a = new SYNO.SDS.TaskRunner.WebAPITask(b, this);
            this.addTask(a)
        }
        return a
    },
    removeTask: function(b) {
        var a = this.tasks[b];
        if (a) {
            this.fireEvent("remove", a);
            delete this.tasks[b]
        }
    },
    getTask: function(a) {
        return this.tasks[a] || null
    }
});
SYNO.SDS.TaskRunner.Task = Ext.extend(Ext.util.Observable, {
    INTERVAL_DEFAULT: 60000,
    INTERVAL_FALLBACK: 60000,
    manager: null,
    running: false,
    removed: false,
    taskFirstRunTime: 0,
    constructor: function(a, b) {
        SYNO.SDS.TaskRunner.Task.superclass.constructor.apply(this, arguments);
        this.manager = b;
        this.apply(a)
    },
    apply: function(a) {
        this.applyInterval(a.interval);
        delete a.interval;
        this.applyConfig(a)
    },
    applyConfig: function(a) {
        Ext.apply(this, a)
    },
    applyInterval: function(a) {
        this.intervalData = a;
        if (!Ext.isFunction(this.intervalData) && !Ext.isArray(this.intervalData) && !Ext.isNumber(this.intervalData)) {
            this.intervalData = this.INTERVAL_DEFAULT
        }
        this.interval = this.adaptiveInterval()
    },
    adaptiveInterval: function() {
        var c, b = 0,
            d = this.intervalData,
            a = null;
        if (this.taskFirstRunTime) {
            b = new Date().getTime() - this.taskFirstRunTime
        }
        if (Ext.isNumber(d)) {
            a = d
        } else {
            if (Ext.isFunction(d)) {
                a = d.call(this.scope || this, b)
            } else {
                if (Ext.isArray(d)) {
                    for (c = 0; c < d.length; ++c) {
                        if (d[c].time > b) {
                            break
                        }
                        a = d[c].interval
                    }
                }
            }
        }
        if (!Ext.isNumber(a)) {
            SYNO.Debug.debug("TaskRunner: Task " + this.id + " interval fallback to " + this.INTERVAL_FALLBACK);
            a = this.INTERVAL_FALLBACK
        }
        return a
    },
    start: function(a) {
        var b = new Date().getTime();
        if (this.removed) {
            return
        }
        if (!this.taskFirstRunTime) {
            this.taskFirstRunTime = (false === a) ? b + this.interval : b
        }
        return this.manager.start(this, a)
    },
    stop: function() {
        if (this.removed) {
            return
        }
        return this.manager.stop(this)
    },
    restart: function(a) {
        this.stop();
        this.start(a)
    },
    remove: function() {
        this.stop();
        this.manager.removeTask(this.id);
        this.removed = true
    }
});
SYNO.SDS.TaskRunner.AjaxTask = Ext.extend(SYNO.SDS.TaskRunner.Task, {
    constructor: function(a, b) {
        this.reqId = null;
        this.reqConfig = null;
        this.cbHandler = null;
        this.autoJsonDecode = false;
        this.single = false;
        SYNO.SDS.TaskRunner.AjaxTask.superclass.constructor.call(this, a, b)
    },
    applyConfig: function(a) {
        Ext.apply(this, {
            run: this.run,
            scope: this
        });
        this.autoJsonDecode = (true === a.autoJsonDecode);
        this.single = (true === a.single);
        this.preventHalt = (true === a.preventHalt);
        this.cbHandler = {};
        this.reqConfig = {};
        Ext.copyTo(this.cbHandler, a, ["scope", "callback", "success", "failure"]);
        Ext.apply(this.reqConfig, a);
        Ext.apply(this.reqConfig, {
            success: null,
            failure: null,
            callback: this.onCallback,
            scope: this
        });
        Ext.applyIf(this.reqConfig, {
            method: "GET"
        });
        delete this.reqConfig.id;
        delete this.reqConfig.autoJsonDecode;
        delete this.reqConfig.single
    },
    stop: function() {
        if (this.reqId) {
            Ext.Ajax.abort(this.reqId);
            this.reqId = null
        }
        SYNO.SDS.TaskRunner.AjaxTask.superclass.stop.apply(this, arguments)
    },
    run: function() {
        if (!this.reqConfig.url) {
            this.remove();
            return
        }
        SYNO.SDS.TaskRunner.AjaxTask.superclass.stop.call(this);
        this.reqId = Ext.Ajax.request(this.reqConfig)
    },
    onCallback: function(d, g, b) {
        var a = b,
            c = Ext.apply({}, d);
        Ext.apply(c, {
            scope: this.cbHandler.scope,
            callback: this.cbHandler.callback,
            success: this.cbHandler.success,
            failure: this.cbHandler.failure
        });
        if (g && this.autoJsonDecode) {
            try {
                a = Ext.util.JSON.decode(b.responseText)
            } catch (f) {
                a = {
                    success: false
                };
                g = false
            }
        }
        if (g && c.success) {
            c.success.call(c.scope, a, d)
        } else {
            if (!g && c.failure) {
                c.failure.call(c.scope, a, d)
            }
        }
        if (c.callback) {
            c.callback.call(c.scope, d, g, a)
        }
        this.fireEvent("callback", d, g, a);
        if (g && this.single) {
            this.reqId = null;
            this.remove()
        } else {
            if (this.reqId) {
                this.reqId = null;
                this.start(false)
            }
        }
    }
});
SYNO.SDS.TaskRunner.WebAPITask = Ext.extend(SYNO.SDS.TaskRunner.AjaxTask, {
    constructor: function(a, b) {
        SYNO.SDS.TaskRunner.WebAPITask.superclass.constructor.call(this, a, b)
    },
    applyConfig: function(a) {
        Ext.apply(this, {
            run: this.run,
            scope: this
        });
        this.single = (true === a.single);
        this.preventHalt = (true === a.preventHalt);
        this.cbHandler = {};
        this.reqConfig = {};
        Ext.copyTo(this.cbHandler, a, ["callback", "scope"]);
        Ext.apply(this.reqConfig, a);
        Ext.apply(this.reqConfig, {
            callback: this.onCallback,
            scope: this
        });
        delete this.reqConfig.id;
        delete this.reqConfig.single
    },
    run: function() {
        SYNO.SDS.TaskRunner.AjaxTask.superclass.stop.call(this);
        this.reqId = SYNO.API.Request(this.reqConfig)
    },
    onCallback: function(e, c, d, b) {
        var a = Ext.apply({}, b);
        Ext.apply(a, {
            scope: this.cbHandler.scope,
            callback: this.cbHandler.callback
        });
        if (a.callback) {
            a.callback.call(a.scope, e, c, d, a)
        }
        this.fireEvent("callback", e, c, d, a);
        if (this.single) {
            this.reqId = null;
            this.remove()
        } else {
            if (this.reqId) {
                this.reqId = null;
                this.start(false)
            }
        }
    }
});
SYNO.SDS.UIFeatures = function() {
    var b = {
        previewBox: (!Ext.isIE || Ext.isModernIE),
        expandMenuHideAll: true,
        windowGhost: !Ext.isIE || Ext.isModernIE,
        disableWindowShadow: Ext.isIE && !Ext.isModernIE,
        exposeWindow: (!Ext.isIE || Ext.isIE10p),
        msPointerEnabled: window.navigator.msPointerEnabled && window.navigator.msMaxTouchPoints > 0,
        isTouch: ("ontouchstart" in window) || (window.navigator.msPointerEnabled && window.navigator.msMaxTouchPoints > 0),
        isRetina: function() {
            var d = false;
            var c = "(-webkit-min-device-pixel-ratio: 1.5),(min--moz-device-pixel-ratio: 1.5),(-o-min-device-pixel-ratio: 3/2),(min-resolution: 1.5dppx)";
            if (window.devicePixelRatio >= 1.5) {
                d = true
            }
            if (window.matchMedia && window.matchMedia(c).matches) {
                d = true
            }
            return d
        }(),
        isSupportFullScreen: document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled || document.msFullscreenEnabled
    };
    var a = Ext.urlDecode(location.search.substr(1));
    Ext.iterate(a, function(c) {
        var d = a[c];
        if (Ext.isDefined(b[c])) {
            b[c] = (d === "false") ? false : true
        }
    });
    return {
        test: function(c) {
            return !!b[c]
        },
        listAll: function() {
            var c = "== Feature List ==\n";
            Ext.iterate(b, function(d) {
                c += String.format("{0}: {1}\n", d, b[d])
            })
        },
        isFullScreenMode: function() {
            return !!(document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement)
        }
    }
}();
Ext.define("SYNO.SDS.UIFeatures.IconSizeManager", {
    statics: {
        PortalIcon: 64,
        GroupView: 24,
        Taskbar: 32,
        GroupViewHover: 48,
        Desktop: 64,
        ClassicalDesktop: 48,
        AppView: 72,
        AppViewClassic: 48,
        Header: 24,
        HeaderV4: 16,
        TreeIcon: 16,
        StandaloneHeader: 24,
        FavHeader: 16,
        isEnableHDPack: false,
        cls: "synohdpack",
        debugCls: "synohdpackdebug",
        getAppPortalIconPath: function(b) {
            var e = this.getRetinaAndSynohdpackStatus();
            var a = e ? 256 : this.PortalIcon;
            var c = e ? "2x" : "1x";
            var d = String.format(b, a, c);
            return d
        },
        getIconPath: function(g, h, a) {
            var k, c, f = "webman/",
                d = "/synohdpack/images/dsm/";
            var i = this.getRetinaAndSynohdpackStatus();
            var e = function(m, o, n, l) {
                return m.replace(o, (o === "48") ? "128" : o * 2)
            };
            var b = function(m, o, n, l) {
                return m.replace(o, (o === "48") ? "128" : o * 2)
            };
            if (0 === g.indexOf("webman/3rdparty/")) {
                var j = String.format("webapi/entry.cgi?api=SYNO.Core.Synohdpack&version=1&method=getHDIcon&res={0}&retina={1}&path={2}", this.getRes(h), i, g);
                return j
            }
            if (-1 === g.indexOf("{1}")) {
                if (i) {
                    a = a || false;
                    if (a || -1 !== g.indexOf("shortcut_icons") || -1 !== g.indexOf("webfm/images")) {
                        c = g
                    } else {
                        if (0 === g.indexOf(f)) {
                            c = d + g.substr(f.length)
                        } else {
                            c = d + g
                        }
                    }
                } else {
                    c = g
                }
            } else {
                c = g.replace("{1}", i ? "2x" : "1x")
            }
            switch (h) {
                case "Taskbar":
                    k = String.format(c, i ? this.Taskbar * 2 : this.Taskbar);
                    break;
                case "Desktop":
                    if (-1 != c.indexOf("files_ext_48")) {
                        c = c.replace("files_ext_48", "files_ext_64")
                    }
                    if (-1 != c.indexOf("files_ext_")) {
                        c = c.replace(/webfm\/images/, i ? "images/2x" : "images/1x");
                        k = i ? c.replace(/.*\/files_ext_(\d+)\/.*/, e) : c
                    } else {
                        if (-1 != c.indexOf("shortcut_icons")) {
                            c = c.replace(/images\/shortcut_icons/, i ? "images/default/2x/shortcut_icons" : "images/default/1x/shortcut_icons");
                            k = i ? c.replace(/.*\/.*_(\d+)\.png$/, b) : c
                        } else {
                            k = String.format(c, i ? 256 : this.Desktop)
                        }
                    }
                    break;
                case "ClassicalDesktop":
                    if (-1 != c.indexOf("files_ext_")) {
                        c = c.replace(/webfm\/images/, i ? "images/2x" : "images/1x");
                        k = i ? c.replace(/.*\/files_ext_(\d+)\/.*/, e) : c
                    } else {
                        if (-1 != c.indexOf("shortcut_icons")) {
                            c = c.replace(/images\/shortcut_icons/, i ? "images/default/2x/shortcut_icons" : "images/default/1x/shortcut_icons");
                            k = i ? c.replace(/.*\/.*_(\d+)\.png$/, b) : c
                        } else {
                            k = String.format(c, i ? 256 : this.ClassicalDesktop)
                        }
                    }
                    break;
                case "AppView":
                    k = String.format(c, i ? 256 : this.AppView);
                    break;
                case "AppViewClassic":
                    k = String.format(c, i ? 256 : this.AppViewClassic);
                    break;
                case "Header":
                    k = String.format(c, i ? this.Header * 2 : this.Header);
                    break;
                case "HeaderV4":
                    k = String.format(c, i ? this.HeaderV4 * 2 : this.HeaderV4);
                    break;
                case "StandaloneHeader":
                    k = String.format(c, i ? this.StandaloneHeader * 2 : this.StandaloneHeader);
                    break;
                case "FavHeader":
                    k = String.format(c, i ? this.FavHeader * 2 : this.FavHeader);
                    break;
                case "FileType":
                    k = (i) ? c.replace(/.*\/files_ext_(\d+)\/.*/, e) : c;
                    break;
                case "TreeIcon":
                    k = String.format(c, i ? this.TreeIcon * 3 : this.TreeIcon);
                    break;
                default:
                    k = c;
                    break
            }
            if (-1 == k.indexOf(String.format("?v={0}", _S("fullversion"))) && ".png" === k.substr(k.length - 4)) {
                k += "?v=" + _S("fullversion")
            }
            k = encodeURI(k);
            return k
        },
        enableHDDisplay: function(a) {
            SYNO.SDS.UIFeatures.IconSizeManager.isEnableHDPack = a
        },
        getRetinaAndSynohdpackStatus: function() {
            return SYNO.SDS.UIFeatures.test("isRetina") && (this.isEnableHDPack || SYNO.SDS.Session.SynohdpackStatus || false)
        },
        addHDClsAndCSS: function(a) {
            if (a && SYNO.SDS.UIFeatures.test("isRetina")) {
                Ext.get(document.documentElement).addClass(this.cls)
            }
        },
        enableRetinaDisplay: function() {
            Ext.get(document.documentElement).removeClass(this.debugCls);
            Ext.get(document.documentElement).addClass(this.cls);
            SYNO.SDS.UIFeatures.IconSizeManager.isEnableHDPack = true
        },
        enableRetinaDebugMode: function() {
            Ext.get(document.documentElement).removeClass(this.cls);
            Ext.get(document.documentElement).addClass(this.debugCls);
            SYNO.SDS.UIFeatures.IconSizeManager.isEnableHDPack = true
        },
        disableRetinaDisplay: function() {
            Ext.get(document.documentElement).removeClass(this.cls);
            Ext.get(document.documentElement).removeClass(this.debugCls);
            SYNO.SDS.UIFeatures.IconSizeManager.isEnableHDPack = false
        },
        getRes: function(b) {
            switch (b) {
                case "Taskbar":
                    return this.Taskbar;
                case "Desktop":
                    return this.Desktop;
                case "ClassicalDesktop":
                    return this.ClassicalDesktop;
                case "AppView":
                    var a = SYNO.SDS.UserSettings.getProperty("Desktop", "appMenuStyle");
                    if (a === "classical") {
                        return this.AppViewClassic
                    }
                    return this.AppView;
                case "Header":
                    return this.Header;
                case "HeaderV4":
                    return this.HeaderV4;
                case "StandaloneHeader":
                    return this.StandaloneHeader;
                case "FileType":
                    return this.FileType;
                case "PortalIcon":
                    return this.PortalIcon;
                case "TreeIcon":
                    return this.TreeIcon;
                case "FavHeader":
                    return this.FavHeader;
                default:
                    return -1
            }
        }
    }
});
Ext.namespace("SYNO.SDS.Gesture");
SYNO.SDS.Gesture.EmptyGesture = Ext.extend(Ext.util.Observable, {
    onTouchStart: Ext.emptyFn,
    onTouchMove: Ext.emptyFn,
    onTouchEnd: Ext.emptyFn,
    onTouchCancel: Ext.emptyFn
});
SYNO.SDS.Gesture.BaseGesture = Ext.extend(SYNO.SDS.Gesture.EmptyGesture, {
    constructor: function() {
        SYNO.SDS.Gesture.BaseGesture.superclass.constructor.apply(this, arguments)
    },
    getBrowserEvent: function(a) {
        if (!a || !a.browserEvent) {
            return null
        }
        return a.browserEvent
    },
    getFirstTouch: function(a) {
        var c = null,
            b;
        b = this.getBrowserEvent(a);
        if (b && b.touches && b.touches.length > 0) {
            c = b.touches[0]
        }
        return c
    },
    getFirstChangedTouch: function(a) {
        var c = null,
            b;
        b = this.getBrowserEvent(a);
        if (b && b.changedTouches && b.changedTouches.length > 0) {
            c = b.changedTouches[0]
        }
        return c
    },
    getChangedTouchCount: function(a) {
        var b;
        b = this.getBrowserEvent(a);
        if (!b || !b.changedTouches || !Ext.isNumber(b.changedTouches.length)) {
            return -1
        }
        return b.changedTouches.length
    },
    getTouchCount: function(a) {
        var b;
        b = this.getBrowserEvent(a);
        if (!b || !b.touches || !Ext.isNumber(b.touches.length)) {
            return -1
        }
        return b.touches.length
    }
});
SYNO.SDS.Gesture.Swipe = Ext.extend(SYNO.SDS.Gesture.BaseGesture, {
    config: {
        minDistance: 80,
        maxOffset: 100,
        maxDuration: 1000
    },
    fireSwipe: function(a, e, c, d, b) {
        SYNO.SDS.GestureMgr.fireEvent("swipe", a, e, c, d, b)
    },
    getMinDistance: function() {
        return this.config.minDistance
    },
    getMaxOffset: function() {
        return this.config.maxOffset
    },
    getMaxDuration: function() {
        return this.config.maxDuration
    },
    setInitialXY: function(c) {
        var b, a, d;
        for (b = 0, a = c.changedTouches.length; b < a; b++) {
            d = c.changedTouches[b];
            this.initialTouches[d.identifier] = {
                x: d.pageX,
                y: d.pageY
            }
        }
    },
    getInitialXY: function(b) {
        var a = this.initialTouches[b.identifier];
        return {
            x: a.x,
            y: a.y
        }
    },
    onTouchStart: function(a, b, d) {
        var c = this.getBrowserEvent(a);
        this.startTime = c.timeStamp;
        this.isHorizontal = true;
        this.isVertical = true;
        if (!this.initialTouches) {
            this.initialTouches = {}
        }
        this.setInitialXY(c);
        this.touchCount = this.getTouchCount(a)
    },
    onTouchMove: function(a, b, c) {
        if (3 !== this.getTouchCount(a)) {
            return false
        }
        a.preventDefault();
        return this.checkTouchMove(a, b, c)
    },
    checkTouchXY: function(g, e, c) {
        var b, f, d, a;
        b = g.pageX;
        f = g.pageY;
        d = Math.abs(b - e);
        a = Math.abs(f - c);
        if (this.isVertical && d > this.getMaxOffset()) {
            this.isVertical = false
        }
        if (this.isHorizontal && a > this.getMaxOffset()) {
            this.isHorizontal = false
        }
        if (!this.isHorizontal && !this.isVertical) {
            return this.fail()
        }
    },
    checkTouchMove: function(j, b, d) {
        var g, i, c, h, a, f;
        h = this.getBrowserEvent(j);
        a = h.timeStamp;
        if (a - this.startTime > this.getMaxDuration()) {
            return this.fail()
        }
        for (g = 0, f = h.changedTouches.length; g < f; g++) {
            c = h.changedTouches[g];
            i = this.initialTouches[c.identifier];
            if (!i) {
                SYNO.Debug.error("Error: initial does not exist when handle touchmove, TouchEvent id:" + c.identifier);
                continue
            }
            if (false === this.checkTouchXY(c, i.x, i.y)) {
                return false
            }
        }
    },
    onTouchEnd: function(o, d, j) {
        var i, m, k, b, h, g, e, c, n, f, l, a;
        if (this.getTouchCount(o) !== 0) {
            return false
        }
        if (this.touchCount !== 3) {
            return false
        }
        i = this.getFirstChangedTouch(o);
        if (!i) {
            return false
        }
        m = i.pageX;
        k = i.pageY;
        b = this.getInitialXY(i);
        h = m - b.x;
        g = k - b.y;
        e = Math.abs(h);
        c = Math.abs(g);
        n = this.getMinDistance();
        f = o.browserEvent.timeStamp - this.startTime;
        if (this.isVertical && c < n) {
            this.isVertical = false
        }
        if (this.isHorizontal && e < n) {
            this.isHorizontal = false
        }
        if (this.isHorizontal) {
            l = (h < 0) ? "left" : "right";
            a = e
        } else {
            if (this.isVertical) {
                l = (g < 0) ? "up" : "down";
                a = c
            } else {
                return this.fail()
            }
        }
        this.fireSwipe(o, i, l, a, f)
    },
    fail: function() {
        return false
    }
});
SYNO.SDS.Gesture.LongPress = Ext.extend(SYNO.SDS.Gesture.BaseGesture, {
    config: {
        minDuration: 500
    },
    fireLongPress: function(a, b) {
        SYNO.SDS.GestureMgr.fireEvent("longpress", a, b)
    },
    getMinDuration: function() {
        return this.config.minDuration
    },
    onTouchStart: function(a, c, d) {
        var b = this;
        if (this.timer) {
            this.removeTimer()
        }
        this.timer = setTimeout(function() {
            b.fireLongPress(a, c);
            this.timer = null
        }, this.getMinDuration())
    },
    onTouchMove: function() {
        return this.fail()
    },
    onTouchEnd: function(a, b, c) {
        return this.fail()
    },
    removeTimer: function() {
        clearTimeout(this.timer);
        this.timer = null
    },
    fail: function() {
        this.removeTimer();
        return false
    }
});
SYNO.SDS.Gesture.DoubleTap = Ext.extend(SYNO.SDS.Gesture.BaseGesture, {
    config: {
        maxDuration: 300,
        maxOffset: 50
    },
    singleTapTimer: null,
    fireSingleTap: function(a, b) {},
    fireDoubleTap: function(a, b) {
        a.preventDefault();
        SYNO.SDS.GestureMgr.fireEvent("doubletap", a, b)
    },
    getMaxDuration: function() {
        return this.config.maxDuration
    },
    getMaxOffset: function() {
        return this.config.maxOffset
    },
    onTouchStart: function(a, b, c) {
        if (!a || !a.browserEvent) {
            return
        }
        if (this.isInMaxDuration(a.browserEvent.timeStamp, this.lastTapTime)) {
            a.preventDefault()
        }
    },
    onTouchMove: function() {
        return this.fail()
    },
    onTouchEnd: function(j, d, f) {
        var c, i = this.lastTapTime,
            b = this.lastX,
            a = this.lastY,
            e, h, g;
        if (this.getTouchCount(j) > 0) {
            return this.fail()
        }
        if (j && j.browserEvent) {
            c = j.browserEvent.timeStamp
        }
        this.lastTapTime = c;
        e = this.getFirstChangedTouch(j);
        if (!e) {
            return false
        }
        h = e.pageX;
        g = e.pageY;
        this.lastX = h;
        this.lastY = g;
        if (i && this.checkXY(b, a)) {
            if (this.isInMaxDuration(c, i)) {
                this.lastTapTime = 0;
                this.fireDoubleTap(j, d);
                return
            }
        }
    },
    checkXY: function(b, e) {
        var c = Math.abs(this.lastX - b),
            a = Math.abs(this.lastY - e),
            d = this.getMaxOffset();
        if (c < d && a < d) {
            return true
        }
        return false
    },
    isInMaxDuration: function(b, a) {
        if (!b || !a) {
            return false
        }
        return ((b - a) <= this.getMaxDuration()) ? true : false
    },
    fail: function() {
        this.lastTapTime = 0;
        this.lastX = undefined;
        this.lastY = undefined;
        return false
    }
});
Ext.ns("SYNO.SDS.Gesture.MS");
SYNO.SDS.Gesture.MS.Swipe = Ext.extend(SYNO.SDS.Gesture.Swipe, {
    config: {
        minDistance: 80,
        maxOffset: 500,
        maxDuration: 1000
    },
    constructor: function() {
        var a = this;
        SYNO.SDS.Gesture.MS.Swipe.superclass.constructor.apply(a, arguments)
    },
    setInitialXY: function(a) {
        this.initialTouches[a.pointerId] = {
            x: a.pageX,
            y: a.pageY
        }
    },
    getTouchCount: function() {
        var b, a = 0;
        if (this.initialTouches) {
            for (b in this.initialTouches) {
                if (this.initialTouches.hasOwnProperty(b)) {
                    a++
                }
            }
        }
        return a
    },
    checkTouchXY: function(g, e, c) {
        var b, f, d, a;
        b = g.pageX;
        f = g.pageY;
        d = Math.abs(b - e);
        a = Math.abs(f - c);
        if (this.isVertical && d > this.getMaxOffset()) {
            this.isVertical = false
        }
        if (this.isHorizontal && a > this.getMaxOffset()) {
            this.isHorizontal = false
        }
        if (!this.isHorizontal && !this.isVertical) {
            return this.fail()
        }
    },
    checkTouchMove: function(a, c, g) {
        var i, f, d;
        f = this.getBrowserEvent(a);
        d = f.timeStamp;
        if (d - this.startTime > this.getMaxDuration()) {
            return this.fail()
        }
        for (i in this.initialTouches) {
            if (this.initialTouches.hasOwnProperty(i)) {
                var b = this.initialTouches[i],
                    h;
                if (f && f.touches && f.touches.length > 0) {
                    h = f.touches[0]
                }
                if (!b) {
                    SYNO.Debug.error("Error: initial does not exist when handle touchmove, TouchEvent id:" + h.identifier);
                    continue
                }
                if (false === this.checkTouchXY(f, b.x, b.y)) {
                    return false
                }
            }
        }
    },
    onTouchStart: function(a, b, d) {
        var c = this.getBrowserEvent(a);
        this.startTime = c.timeStamp;
        this.isHorizontal = true;
        this.isVertical = true;
        if (!this.initialTouches) {
            this.initialTouches = {}
        }
        this.setInitialXY(c);
        this.touchCount = this.getTouchCount()
    },
    onTouchMove: function(a, b, c) {
        if (3 !== this.getTouchCount()) {
            return false
        }
        a.preventDefault();
        return this.checkTouchMove(a, b, c)
    },
    onTouchEnd: function(q, d, k) {
        var j, o, m, i, h, f, c, p, g, n, a, b, l = this.getBrowserEvent(q);
        if (!this.initialTouches || !this.initialTouches[l.pointerId]) {
            return false
        }
        b = this.initialTouches[l.pointerId];
        delete this.initialTouches[l.pointerId];
        if (this.getTouchCount() !== 0) {
            return false
        }
        if (this.touchCount !== 3) {
            return false
        }
        o = l.pageX;
        m = l.pageY;
        i = o - b.x;
        h = m - b.y;
        f = Math.abs(i);
        c = Math.abs(h);
        p = this.getMinDistance();
        g = l.timeStamp - this.startTime;
        if (this.isVertical && c < p) {
            this.isVertical = false
        }
        if (this.isHorizontal && f < p) {
            this.isHorizontal = false
        }
        if (this.isHorizontal) {
            n = (i < 0) ? "left" : "right";
            a = f
        } else {
            if (this.isVertical) {
                n = (h < 0) ? "up" : "down";
                a = c
            } else {
                return this.fail()
            }
        }
        this.fireSwipe(q, j, n, a, g)
    },
    onTouchCancel: function() {
        this.fail();
        delete this.initialTouches
    }
});
SYNO.SDS.Gesture.EmptyGestureObject = new SYNO.SDS.Gesture.EmptyGesture();
SYNO.SDS.Gesture.MS.EmptyGestureObject = SYNO.SDS.Gesture.EmptyGestureObject;
SYNO.SDS.Gesture.GestureFactory = Ext.extend(Object, {
    create: function(c) {
        var a = SYNO.SDS.UIFeatures.test("msPointerEnabled"),
            b = "SYNO.SDS.Gesture." + (a ? "MS." : "");
        switch (c) {
            case "Swipe":
                if (a && ((window.navigator.msMaxTouchPoints ? window.navigator.msMaxTouchPoints : 0) < 3)) {
                    return SYNO.SDS.Gesture.MS.EmptyGestureObject
                }
                b += c;
                break;
            case "LongPress":
                if (a) {
                    return SYNO.SDS.Gesture.MS.EmptyGestureObject
                }
                b += c;
                break;
            case "DoubleTap":
                if (a) {
                    return SYNO.SDS.Gesture.MS.EmptyGestureObject
                }
                b += c;
                break;
            default:
                if (a) {
                    return SYNO.SDS.Gesture.MS.EmptyGestureObject
                }
                return SYNO.SDS.Gesture.EmptyGestureObject
        }
        return this.getGestureInstance(b)
    },
    getGestureInstance: function(a) {
        var b = Ext.getClassByName(a);
        return new b()
    }
});
Ext.namespace("SYNO.SDS._GestureMgr");
SYNO.SDS._GestureMgr = Ext.extend(Ext.util.Observable, {
    constructor: function() {
        SYNO.SDS._GestureMgr.superclass.constructor.apply(this, arguments);
        this.gestures = ["Swipe", "LongPress", "DoubleTap"];
        this.init()
    },
    init: function() {
        var b, a, e, d, c = SYNO.SDS.UIFeatures.test("msPointerEnabled");
        e = Ext.getDoc();
        for (b = 0, a = this.gestures.length; b < a; b++) {
            d = this.getGestureInstance(this.gestures[b]);
            Ext.EventManager.on(e, c ? "MSPointerCancel" : "touchcancel", d.onTouchCancel, d);
            Ext.EventManager.on(e, c ? "MSPointerDown" : "touchstart", d.onTouchStart, d);
            Ext.EventManager.on(e, c ? "MSPointerUp" : "touchend", d.onTouchEnd, d);
            Ext.EventManager.on(e, c ? "MSPointerMove" : "touchmove", d.onTouchMove, d)
        }
        this.addGestureHandlers()
    },
    addGestureHandlers: function() {
        this.on("swipe", this.swipeHandler, this, {
            buffer: 10
        });
        this.on("longpress", this.longPressHandler, this);
        this.on("doubletap", this.doubleTapHandler, this)
    },
    getGestureInstance: function(a) {
        this.gestureFactory = this.gestureFactory || new SYNO.SDS.Gesture.GestureFactory();
        return this.gestureFactory.create(a)
    },
    swipeHandler: function(a, f, d, e, c) {
        var b;
        if (d === "right") {
            SYNO.SDS.TaskButtons.setRightWindowActive()
        } else {
            if (d === "left") {
                SYNO.SDS.TaskButtons.setLeftWindowActive()
            } else {
                if (d === "up") {
                    b = SYNO.SDS.WindowMgr.getActiveAppWindow();
                    if (b) {
                        b.minimize()
                    }
                }
            }
        }
    },
    longPressHandler: function(c, e) {
        var d, b, a;
        d = this.findEventHandlers(e, "contextmenu");
        for (b = 0, a = d.length; b < a; b++) {
            d[b](c.browserEvent)
        }
    },
    doubleTapHandler: function(c, e) {
        var d, b, a;
        d = this.findEventHandlers(e, "dblclick");
        for (b = 0, a = d.length; b < a; b++) {
            d[b](c.browserEvent)
        }
    },
    findEventHandlers: function(h, d) {
        var g = Ext.get(h),
            f, b, a, e, c = [];
        while (g) {
            f = Ext.EventManager.getListeners(g, d);
            if (!f) {
                g = g.parent();
                continue
            }
            for (b = 0, a = f.length; b < a; b++) {
                e = f[b];
                c.push(e[1])
            }
            break
        }
        return c
    }
});
Ext.BLANK_IMAGE_URL = "scripts/ext-3/resources/images/default/s.gif";
Ext.data.Connection.prototype.timeout = 120000;
Ext.form.BasicForm.prototype.timeout = 120;
Ext.QuickTip.prototype.maxWidth = 500;
Ext.override(Ext.QuickTip, {
    hide: function() {
        var a = function() {
            delete this.activeTarget;
            Ext.QuickTip.superclass.hide.call(this);
            this.getEl().setOpacity(1)
        };
        return this.getEl().animate({
            opacity: {
                from: 1,
                to: 0
            }
        }, 0.3, a.createDelegate(this))
    }
});
Ext.apply(SYNO.LayoutConfig.Defaults.combo, {
    getListParent: function() {
        return this.el.up(".sds-window")
    }
});
Ext.override(Ext.Element, {
    addClassOnHover: function(a) {
        var b = this;
        if (("ontouchstart" in window) || (window.navigator.msPointerEnabled && window.navigator.msMaxTouchPoints > 0)) {
            Ext.getDoc().on("click", function(c) {
                if (c.within(b)) {
                    b.addClass(a)
                } else {
                    b.removeClass(a)
                }
            }, b)
        } else {
            b.addClassOnOver(a)
        }
    }
});
Ext.override(Ext.Component, {
    getTaskRunner: function() {
        if (!this.taskRunner) {
            this.taskRunner = new SYNO.SDS.TaskRunner();
            this.addManagedComponent(this.taskRunner)
        }
        return this.taskRunner
    },
    addTask: function(a) {
        return this.getTaskRunner().createTask(a)
    },
    addAjaxTask: function(a) {
        return this.getTaskRunner().createAjaxTask(a)
    },
    addWebAPITask: function(a) {
        return this.getTaskRunner().createWebAPITask(a)
    },
    getTask: function(a) {
        if (!this.taskRunner) {
            return null
        }
        return this.taskRunner.getTask(a)
    },
    removeTask: function(b) {
        var a = this.getTask(b);
        if (a) {
            a.remove()
        }
        return a
    },
    addManagedComponent: function(a) {
        this.components = this.components || [];
        this.components.push(a);
        return a
    },
    removeManagedComponent: function(a) {
        this.components = this.components || [];
        this.components.remove(a);
        return a
    },
    beforeDestroy: function() {
        this.taskRunner = null;
        this.components = this.components || [];
        for (var a = 0; a < this.components.length; ++a) {
            try {
                this.components[a].destroy()
            } catch (b) {
                if (Ext.isDefined(SYNO.SDS.JSDebug)) {
                    SYNO.Debug.error(this.id, "sub-components[" + a + "] destroy failed.", this.components[a]);
                    throw b
                }
            }
        }
        delete this.components
    },
    findWindow: function() {
        var a = this;
        if (a instanceof SYNO.SDS.BaseWindow) {
            return a
        }
        for (; Ext.isObject(a.ownerCt); a = a.ownerCt) {}
        if (a instanceof SYNO.SDS.BaseWindow) {
            return a
        }
        return
    },
    findAppWindow: function() {
        var a = this,
            b = Ext.getClassByName("SYNO.SDS.AppWindow");
        if (Ext.isEmpty(b)) {
            return
        }
        if (a instanceof b) {
            return a
        }
        if (a._appWindow instanceof b) {
            return a._appWindow
        }
        for (; Ext.isObject(a.ownerCt); a = a.ownerCt) {}
        if (a instanceof b) {
            this._appWindow = a;
            return a
        }
        if (!Ext.isObject(a)) {
            return
        }
        for (; Ext.isObject(a.owner); a = a.owner) {}
        if (a instanceof b) {
            this._appWindow = a;
            return a
        }
        if (a.module && a.module.appWin && a.module.appWin instanceof b) {
            this._appWindow = a.module.appWin;
            return a.module.appWin
        }
        return
    },
    getDsmVersion: function() {
        var a = this.findAppWindow();
        if (a) {
            return a.getOpenConfig("dsm_version")
        } else {
            return null
        }
    },
    getDsmHttpPort: function() {
        var b = this.findAppWindow(),
            a;
        if (b && b.hasOpenConfig("cms_ds_data")) {
            a = b.getOpenConfig("cms_ds_data").http_port
        }
        return a
    },
    getDsmHost: function() {
        var a = this.findAppWindow(),
            b;
        if (a && a.hasOpenConfig("cms_ds_data")) {
            b = a.getOpenConfig("cms_ds_data").host
        }
        return b
    },
    getBaseURL: function(c, a, b) {
        c.appWindow = this.findAppWindow();
        return SYNO.API.GetBaseURL(c, a, b)
    },
    sendWebAPI: function(a) {
        a.appWindow = this.findAppWindow();
        return SYNO.API.Request(a)
    },
    pollReg: function(a) {
        a.appWindow = this.findAppWindow();
        return SYNO.API.Request.Polling.Register(a)
    },
    pollUnreg: function(a) {
        return SYNO.API.Request.Polling.Unregister(a)
    },
    pollList: function(a) {
        a.appWindow = this.findAppWindow();
        return SYNO.API.Request.Polling.List(a)
    },
    downloadWebAPI: function(a) {
        a.appWindow = this.findAppWindow();
        return SYNO.SDS.Utils.IFrame.requestWebAPI(a)
    },
    IsAllowRelay: function() {
        var a = this.findAppWindow();
        if (!Ext.isObject(a)) {
            return false
        }
        return SYNO.SDS.Utils.IsAllowRelay && SYNO.SDS.Utils.IsAllowRelay(a)
    },
    _S: function(b) {
        var a = this.findAppWindow();
        return SYNO.API.Info.GetSession(a, b)
    },
    _D: function(b, c) {
        var a = this.findAppWindow();
        return SYNO.API.Info.GetDefine(a, b, c)
    },
    getKnownAPI: function(b) {
        var a = this.findAppWindow();
        return SYNO.API.Info.GetKnownAPI(a, b)
    },
    IsKnownAPI: function(b, a) {
        var c = SYNO.API.Info.GetKnownAPI(this.findAppWindow(), b);
        if (!Ext.isObject(c)) {
            return false
        }
        if (a < c.minVersion || c.maxVersion < a) {
            return false
        }
        return true
    }
});
Ext.override(Ext.grid.GridView, {
    onLayout: function() {
        var b = this.el.select(".x-grid3-scroller", this);
        var a = b.elements[0];
        if (a.clientWidth === a.offsetWidth) {
            this.scrollOffset = 2
        } else {
            this.scrollOffset = undefined
        }
        this.fitColumns(false)
    }
});
Ext.override(Ext.data.Record, {
    set: function(a, d) {
        var b;
        var c = Ext.isPrimitive(d) ? String : Ext.encode;
        if (c(this.data[a]) == c(d)) {
            return
        }
        this.dirty = true;
        if (!this.modified) {
            this.modified = {}
        }
        if (a in this.modified && this.modified[a] === d) {
            this.dirty = false;
            delete this.modified[a];
            for (b in this.modified) {
                if (this.modified.hasOwnProperty(b)) {
                    this.dirty = true;
                    break
                }
            }
        } else {
            if (!(a in this.modified)) {
                this.modified[a] = this.data[a]
            }
        }
        this.data[a] = d;
        if (!this.editing) {
            this.afterEdit()
        }
    }
});
Ext.override(Ext.data.Store, {
    afterEdit: function(b) {
        var a = this.modified.indexOf(b);
        if (b.dirty && a == -1) {
            this.modified.push(b)
        } else {
            if (!b.dirty && a != -1) {
                this.modified.splice(a, 1)
            }
        }
        this.fireEvent("update", this, b, Ext.data.Record.EDIT)
    }
});
Ext.Element.addMethods(Ext.Fx);
Ext.override(Ext.dd.DragSource, {
    validateTarget: function(b, a, c) {
        if (c === a.getTarget().id || a.within(c)) {
            return true
        }
        this.getProxy().setStatus(this.dropNotAllowed);
        return false
    },
    beforeDragEnter: function(b, a, c) {
        return this.validateTarget(b, a, c)
    },
    beforeDragOver: function(c, b, d) {
        var a = this.validateTarget(c, b, d);
        if (this.proxy) {
            this.proxy.setStatus(a ? this.dropAllowed : this.dropNotAllowed)
        }
        return a
    },
    beforeDragOut: function(b, a, c) {
        return this.validateTarget(b, a, c)
    },
    beforeDragDrop: function(b, a, c) {
        if (this.validateTarget(b, a, c)) {
            return true
        }
        this.onInvalidDrop(b, a, c);
        return false
    }
});
Ext.override(Ext.form.CompositeField, {
    combineErrors: false
});
if (Ext.isIE) {
    Ext.menu.BaseItem.prototype.clickHideDelay = -1
}
Ext.override(Ext.Window, {
    onRender: function(b, a) {
        Ext.Window.superclass.onRender.call(this, b, a);
        if (this.plain) {
            this.el.addClass("x-window-plain")
        }
        this.focusEl = this.el.createChild({
            tag: "div",
            cls: "x-dlg-focus",
            tabIndex: "0",
            role: this.ariaRole || "dialog",
            "aria-label": this.title
        }, this.el.first());
        this.focusEl.swallowEvent("click", true);
        this.focusEl.addKeyListener(Ext.EventObject.TAB, this.onFirstTab, this);
        this.lastEl = this.el.createChild({
            tag: "div",
            cls: "x-dlg-focus",
            tabIndex: 0,
            role: "article",
            html: _T("desktop", "window_last_hint")
        });
        this.lastEl.addKeyListener(Ext.EventObject.TAB, this.onLastTab, this);
        this.proxy = this.el.createProxy("x-window-proxy");
        this.proxy.enableDisplayMode("block");
        if (this.modal) {
            this.maskEl = this.container.createChild({
                cls: "ext-el-mask"
            }, this.el.dom);
            this.maskEl.enableDisplayMode("block");
            this.maskEl.hide();
            this.mon(this.maskEl, "click", this.focus, this)
        }
        if (this.maximizable) {
            this.mon(this.header, "dblclick", this.toggleMaximize, this)
        }
        if (this.frame && this.header) {
            this.tl = this.header.dom.parentNode.parentNode.parentNode
        }
    },
    onLastTab: function(b, a) {
        if (a.shiftKey) {
            return
        }
        a.preventDefault();
        this.focusEl.focus()
    },
    onFirstTab: function(b, a) {
        if (a.shiftKey) {
            a.preventDefault();
            this.lastEl.focus()
        } else {
            if (Ext.isFunction(this.findTopWin)) {
                var c = this.findTopWin();
                if (c !== this) {
                    a.preventDefault();
                    c.focus()
                }
            }
        }
    },
    beforeShow: function() {
        delete this.el.lastXY;
        delete this.el.lastLT;
        if (this.x === undefined || this.y === undefined) {
            var a = this.el.getAlignToXY(this.container, "c-c");
            var b = this.el.translatePoints(a[0], a[1]);
            this.x = this.x === undefined ? b.left : this.x;
            this.y = this.y === undefined ? b.top : this.y
        }
        this.el.setLeftTop(this.x, this.y);
        if (this.expandOnShow) {
            this.expand(false)
        }
        if (this.modal) {
            Ext.getBody().addClass("x-body-masked");
            this.maskEl.setSize(Ext.lib.Dom.getViewWidth(true), Ext.lib.Dom.getViewHeight(true));
            this.maskEl.show()
        }
    },
    onWindowResize: function() {
        if (this.maximized) {
            this.fitContainer()
        }
        if (this.modal) {
            this.maskEl.setSize("100%", "100%");
            this.maskEl.setSize(Ext.lib.Dom.getViewWidth(true), Ext.lib.Dom.getViewHeight(true))
        }
        this.doConstrain()
    },
    setZIndex: function(a) {
        if (this.modal) {
            this.maskEl.setStyle("z-index", a)
        }
        this.el.setZIndex(++a);
        a += 5;
        if (this.resizer) {
            this.resizer.proxy.setStyle("z-index", ++a)
        }
        this.lastZIndex = a
    },
    beforeDestroy: function() {
        if (this.rendered) {
            this.hide();
            this.clearAnchor();
            Ext.destroy(this.focusEl, this.resizer, this.dd, this.proxy, this.maskEl)
        }
        Ext.Window.superclass.beforeDestroy.call(this)
    },
    hide: function(c, a, b) {
        if (this.hidden || this.fireEvent("beforehide", this) === false) {
            return this
        }
        if (a) {
            this.on("hide", a, b, {
                single: true
            })
        }
        this.hidden = true;
        if (c !== undefined) {
            this.setAnimateTarget(c)
        }
        if (this.modal) {
            this.maskEl.hide();
            Ext.getBody().removeClass("x-body-masked")
        }
        if (this.animateTarget) {
            this.animHide()
        } else {
            this.el.hide();
            this.afterHide()
        }
        return this
    },
    getFrameHeight: function() {
        var a = this.el.getFrameWidth("tb") + this.bwrap.getFrameWidth("tb");
        a += (this.tbar ? this.tbar.getHeight() : 0) + (this.bbar ? this.bbar.getHeight() : 0);
        if (this.frame) {
            a += (this.tl || this.el.dom.firstChild).offsetHeight + this.ft.dom.offsetHeight + this.mc.getFrameWidth("tb")
        } else {
            a += (this.header ? this.header.getHeight() : 0) + (this.footer ? this.footer.getHeight() : 0)
        }
        return a
    },
    toFront: function(a) {
        if (this.manager.bringToFront(this)) {
            this.focusLeave = false;
            if (!a || !a.getTarget().focus) {
                this.focus()
            } else {
                a.getTarget().focus();
                if (document.activeElement !== a.getTarget()) {
                    this.focus()
                }
            }
        }
    }
});
Ext.override(Ext.grid.RowSelectionModel, {
    silentMode: false,
    onRefresh: function() {
        var f = this.grid.store,
            d = this.getSelections(),
            c = 0,
            a = d.length,
            b, e;
        this.silent = this.silentMode && true;
        this.clearSelections(true);
        for (; c < a; c++) {
            e = d[c];
            if ((b = f.indexOfId(e.id)) != -1) {
                this.selectRow(b, true)
            }
        }
        if (d.length != this.selections.getCount()) {
            this.fireEvent("selectionchange", this)
        }
        this.silent = false
    }
});
Ext.override(Ext.grid.GridPanel, {
    getValues: function() {
        var b = [],
            a = this.getStore();
        if (!Ext.isObject(a)) {
            return b
        }
        a.each(function(e, d, c) {
            b.push(Ext.apply({}, e.data))
        }, this);
        return b
    },
    setValues: function(c) {
        var b = this.getStore();
        var a = [];
        if (!Ext.isObject(b) || !Ext.isArray(c)) {
            return false
        }
        b.removeAll();
        c.each(function(d) {
            a.push(new Ext.data.Record(d))
        }, this);
        b.add(a)
    }
});
Ext.override(Ext.grid.GridView.ColumnDragZone, {
    getDragData: function(c) {
        var a = Ext.lib.Event.getTarget(c),
            b = this.view.findHeaderCell(a);
        if (b) {
            return {
                ddel: Ext.fly(b).child("div.x-grid3-hd-inner", true),
                header: b
            }
        }
        return false
    }
});
Ext.override(Ext.grid.HeaderDropZone, {
    positionIndicator: function(d, j, i) {
        var a = Ext.lib.Event.getPageX(i),
            f = Ext.lib.Dom.getRegion(Ext.fly(j).child("div.x-grid3-hd-inner", true)),
            c, g, b = f.top + this.proxyOffsets[1];
        if ((f.right - a) <= (f.right - f.left) / 2) {
            c = f.right + this.view.borderWidth;
            g = "after"
        } else {
            c = f.left;
            g = "before"
        }
        if (this.grid.colModel.isFixed(this.view.getCellIndex(j))) {
            return false
        }
        c += this.proxyOffsets[0];
        this.proxyTop.setLeftTop(c, b);
        this.proxyTop.show();
        if (!this.bottomOffset) {
            this.bottomOffset = this.view.mainHd.getHeight()
        }
        this.proxyBottom.setLeftTop(c, b + this.proxyTop.dom.offsetHeight + this.bottomOffset);
        this.proxyBottom.show();
        return g
    },
    onNodeDrop: function(b, l, f, c) {
        var d = c.header;
        if (d != b) {
            var j = this.grid.colModel,
                i = Ext.lib.Event.getPageX(f),
                a = Ext.lib.Dom.getRegion(Ext.fly(b).child("div.x-grid3-hd-inner", true)),
                m = (a.right - i) <= ((a.right - a.left) / 2) ? "after" : "before",
                g = this.view.getCellIndex(d),
                k = this.view.getCellIndex(b);
            if (m == "after") {
                k++
            }
            if (g < k) {
                k--
            }
            j.moveColumn(g, k);
            return true
        }
        return false
    }
});
Ext.override(SYNO.ux.ModuleList, {
    getLocalizedString: function(a) {
        return SYNO.SDS.Utils.GetLocalizedString(a)
    }
});
Ext.override(SYNO.ux.FieldSet, {
    stateful: true,
    stateEvents: ["expand", "collapse"],
    getState: function() {
        return {
            collapsed: this.collapsed
        }
    },
    saveState: function() {
        var a = this.getState();
        this.setUserCollapseState(a.collapsed)
    },
    getUserCollapseState: function() {
        var c = this.getStateId();
        var b = this.findAppWindow();
        if (b && b.appInstance && c) {
            var a = b.appInstance.getUserSettings("fieldset_collapse_status") || {};
            return Ext.isBoolean(a[c]) ? a[c] : this.collapsed
        }
        return this.collapsed
    },
    setUserCollapseState: function(d) {
        var c = this.getStateId();
        var b = this.findAppWindow();
        if (b && b.appInstance && c) {
            var a = b.appInstance.getUserSettings("fieldset_collapse_status") || {};
            a[c] = d;
            b.appInstance.setUserSettings("fieldset_collapse_status", a)
        }
    },
    updateUserCollapseState: function() {
        var a = this.getUserCollapseState();
        var b = {
            collapsed: a
        };
        this.applyState(b)
    }
});
var _urlAppend = Ext.urlAppend;
Ext.urlAppend = function(c, d, b) {
    var a = Ext.urlDecode(d);
    b = typeof b !== "undefined" ? b : true;
    if (b && c.indexOf("SynoToken") === -1 && !Ext.isEmpty(_S("SynoToken"))) {
        a.SynoToken = decodeURIComponent(_S("SynoToken"))
    }
    return _urlAppend(c, Ext.urlEncode(a))
};
Ext.ns("SYNO.SDS");
SYNO.SDS.UpdateSynoToken = function(a) {
    Ext.Ajax.request({
        url: "webman/login.cgi",
        updateSynoToken: true,
        callback: function(c, e, b) {
            var d = Ext.util.JSON.decode(b.responseText);
            if (e && !Ext.isEmpty(d.SynoToken)) {
                SYNO.SDS.Session.SynoToken = encodeURIComponent(d.SynoToken)
            }
            if (Ext.isFunction(a)) {
                a(c, e, b)
            }
        }
    })
};
var _cookie = Ext.util.Cookies.get("id");
Ext.Ajax.on("beforerequest", function(b, a) {
    if (true === a.updateSynoToken) {
        return
    }
    if (!Ext.isEmpty(_cookie) && _cookie !== Ext.util.Cookies.get("id")) {
        b.abort();
        location.reload()
    } else {
        _cookie = Ext.util.Cookies.get("id")
    }
    if (Ext.isEmpty(a.skipSynoToken) && !Ext.isEmpty(_S("SynoToken"))) {
        if (Ext.isEmpty(a.headers)) {
            a.headers = {}
        }
        a.headers["X-SYNO-TOKEN"] = _S("SynoToken")
    }
});
Ext.util.Observable.observeClass(Ext.form.BasicForm);
Ext.form.BasicForm.on("beforeaction", function(a, b) {
    if (a.url) {
        a.url = Ext.urlAppend(a.url)
    }
});
Ext.util.Observable.observeClass(Ext.data.Connection);
Ext.data.Connection.on("beforerequest", function(a, b) {
    if (Ext.isEmpty(b.skipSynoToken) && !Ext.isEmpty(_S("SynoToken"))) {
        if (Ext.isEmpty(b.headers)) {
            b.headers = {}
        }
        b.headers["X-SYNO-TOKEN"] = _S("SynoToken")
    }
});
Ext.define("Ext.data.JsonP", {
    singleton: true,
    requestCount: 0,
    requests: {},
    timeout: 30000,
    disableCaching: true,
    disableCachingParam: "_dc",
    callbackKey: "callback",
    request: function(l) {
        l = Ext.apply({}, l);
        var h = this,
            c = Ext.isDefined(l.disableCaching) ? l.disableCaching : h.disableCaching,
            f = l.disableCachingParam || h.disableCachingParam,
            b = ++h.requestCount,
            j = l.callbackName || "callback" + b,
            g = l.callbackKey || h.callbackKey,
            k = Ext.isDefined(l.timeout) ? l.timeout : h.timeout,
            d = Ext.apply({}, l.params),
            a = l.url,
            e, i;
        if (c && !d[f]) {
            d[f] = new Date().getTime()
        }
        l.params = d;
        d[g] = "Ext.data.JsonP." + j;
        if (l.iframeUrl) {
            i = h.createIframe(a, d, l)
        } else {
            i = h.createScript(a, d, l)
        }
        h.requests[b] = e = {
            url: a,
            params: d,
            script: i,
            id: b,
            scope: l.scope,
            success: l.success,
            failure: l.failure,
            callback: l.callback,
            callbackKey: g,
            callbackName: j
        };
        if (k > 0) {
            e.timeout = setTimeout(Ext.createDelegate(h.handleTimeout, h, [e]), k)
        }
        h.setupErrorHandling(e);
        h[j] = Ext.createDelegate(h.handleResponse, h, [e], true);
        h.loadScript(e);
        return e
    },
    abort: function(c) {
        var b = this,
            d = b.requests,
            a;
        if (c) {
            if (!c.id) {
                c = d[c]
            }
            b.handleAbort(c)
        } else {
            for (a in d) {
                if (d.hasOwnProperty(a)) {
                    b.abort(d[a])
                }
            }
        }
    },
    setupErrorHandling: function(a) {
        a.script.onerror = Ext.createDelegate(this.handleError, this, [a])
    },
    handleAbort: function(a) {
        a.errorType = "abort";
        this.handleResponse(null, a)
    },
    handleError: function(a) {
        a.errorType = "error";
        this.handleResponse(null, a)
    },
    cleanupErrorHandling: function(a) {
        a.script.onerror = null
    },
    handleTimeout: function(a) {
        a.errorType = "timeout";
        this.handleResponse(null, a)
    },
    handleResponse: function(a, b) {
        var c = true;
        if (b.timeout) {
            clearTimeout(b.timeout)
        }
        delete this[b.callbackName];
        delete this.requests[b.id];
        this.cleanupErrorHandling(b);
        Ext.fly(b.script).remove();
        if (b.errorType) {
            c = false;
            Ext.callback(b.failure, b.scope, [b.errorType])
        } else {
            Ext.callback(b.success, b.scope, [a])
        }
        Ext.callback(b.callback, b.scope, [c, a, b.errorType])
    },
    createScript: function(c, d, b) {
        var a = document.createElement("script");
        a.setAttribute("src", Ext.urlAppend(c, Ext.urlEncode(d)));
        a.setAttribute("async", true);
        a.setAttribute("type", "text/javascript");
        return a
    },
    createIframe: function(c, f, b) {
        var d;
        var a = Ext.urlAppend(c, Ext.urlEncode(f), false);
        if (typeof b.iframeUrl === "undefined") {
            SYNO.Debug("no iframe url");
            return
        }
        var e = b.iframeUrl;
        e += "&url=" + encodeURIComponent(a);
        e = Ext.urlAppend(e, "", true);
        d = document.createElement("iframe");
        d.setAttribute("src", e);
        d.setAttribute("style", "visibility: hidden");
        return d
    },
    loadScript: function(a) {
        Ext.get(document.getElementsByTagName("head")[0]).appendChild(a.script)
    }
});
Ext.override(SYNO.ux.Button, {
    getUXMenu: function(b) {
        if (!Ext.menu.MenuMgr.getMenuList) {
            return Ext.menu.MenuMgr.get(b)
        }
        var a = Ext.menu.MenuMgr.getMenuList();
        if (typeof b == "string") {
            if (!a) {
                return null
            }
            return a[b]
        } else {
            if (b.events) {
                return b
            } else {
                if (typeof b.length == "number") {
                    return new SYNO.ux.Menu({
                        items: b
                    })
                } else {
                    return Ext.create(b, "syno_menu")
                }
            }
        }
    },
    initComponent: function() {
        if (this.menu) {
            if (Ext.isArray(this.menu)) {
                this.menu = {
                    items: this.menu
                }
            }
            if (Ext.isObject(this.menu)) {
                this.menu.ownerCt = this
            }
            this.menu = this.getUXMenu(this.menu);
            this.menu.ownerCt = undefined
        }
        SYNO.ux.Button.superclass.initComponent.call(this)
    }
});
Ext.override(SYNO.ux.ComboBox, {
    afterRender: function() {
        SYNO.ux.ComboBox.superclass.afterRender.call(this);
        this.mon(this, "expand", this.onListExpand, this)
    },
    onDestroy: function() {
        this.mun(this, "expand", this.onListExpand, this)
    },
    onListExpand: function() {
        if (!SYNO.SDS.Desktop) {
            return
        }
        var b = SYNO.SDS.UIFeatures.isFullScreenMode(),
            a = Ext.get(SYNO.SDS.Desktop.id);
        if (b && this.list.parent() === Ext.getBody()) {
            a.appendChild(this.list)
        } else {
            if (!b && this.list.parent() === a) {
                Ext.getBody().appendChild(this.list)
            }
        }
    }
});
Ext.override(SYNO.ux.DateField, {
    onDestroy: function() {
        if (this.menu) {
            this.mun(this.menu, "show", this.onMenuShow, this)
        }
        this.callParent(arguments)
    },
    onMenuShow: function() {
        if (!SYNO.SDS.Desktop) {
            return
        }
        var c = SYNO.SDS.UIFeatures.isFullScreenMode(),
            a = Ext.get(SYNO.SDS.Desktop.id),
            b = this.menu.el;
        if (c && b.parent() === Ext.getBody()) {
            a.appendChild(b)
        } else {
            if (!c && b.parent() === a) {
                Ext.getBody().appendChild(b)
            }
        }
    }
});
Ext.override(SYNO.ux.Menu, {
    onMenuShow: function() {
        if (!SYNO.SDS.Desktop) {
            return
        }
        var b = SYNO.SDS.UIFeatures.isFullScreenMode(),
            a = Ext.get(SYNO.SDS.Desktop.id);
        if (b && this.el.parent() === Ext.getBody()) {
            a.appendChild(this.el)
        } else {
            if (!b && this.el.parent() === a) {
                Ext.getBody().appendChild(this.el)
            }
        }
        this.resetWidthForFlexcroll()
    }
});
Ext.namespace("SYNO.API");
SYNO.API.getErrorString = function(c) {
    var b = 100,
        a, d;
    if (Ext.isNumber(c)) {
        b = c
    } else {
        if (Ext.isObject(c)) {
            a = SYNO.API.Util.GetFirstError(c);
            b = Ext.isNumber(a.code) ? a.code : 100
        }
    }
    if (b <= 118) {
        return SYNO.API.Errors.common[b]
    }
    d = Ext.isString(SYNO.API.Errors.core[b]) ? SYNO.API.Errors.core[b] : _T("common", "error_system");
    return d
};
SYNO.API.CheckSpecialError = function(a, d, b) {
    var c;
    if ("SYNO.DSM.Share" === b.api) {
        if ("delete" === b.method && 404 === d.code) {
            c = _T("error", "delete_default_share")
        } else {
            if ("edit" === b.method && 406 === d.code) {
                c = _T("error", "share_mounted_rename")
            }
        }
    }
    return c
};
SYNO.API.CheckResponse = function(a, h, d, g) {
    var b, f;
    if (a) {
        return true
    }
    if (Ext.isEmpty(h) || 0 === h.status) {
        return false
    }
    try {
        b = Ext.isDefined(h.status) ? 0 : (h.code || 100);
        if (b < SYNO.API.Errors.minCustomeError) {
            f = SYNO.API.Errors.common[b]
        } else {
            f = SYNO.API.CheckSpecialError(a, h, d) || SYNO.API.Errors.core[b]
        }
    } catch (c) {} finally {
        if (!f) {
            b = 100;
            f = SYNO.API.Errors.common[b]
        }
    }
    if (b >= 105 && b <= 107 && (!g || Ext.isEmpty(g.getResponseHeader("X-SYNO-SOURCE-ID")))) {
        SYNO.SDS.Utils.Logout.action(true, f, true)
    }
    return f
};
SYNO.API.CheckRelayResponse = function(h, d, g, c, f) {
    var b, a = false,
        e = Ext.getClassByName("SYNO.SDS.AppWindow");
    if (Ext.isEmpty(d) || (Ext.isObject(f) && 0 === f.status)) {
        return a
    }
    if (!SYNO.SDS.Utils.IsAllowRelay(c.appWindow) || Ext.isEmpty(e)) {
        return a
    }
    b = c.appWindow.findAppWindow();
    if (!(b instanceof e) || Ext.isEmpty(b.appInstance)) {
        return a
    }
    if (!Ext.isObject(c.params)) {
        return a
    }
    if (c.params.api === "SYNO.API.Info") {
        a = true
    } else {
        if (c.params.api !== '"SYNO.CMS.DS"' || c.params.method !== '"relay"') {
            return a
        }
    }
    if (true === a) {} else {
        if (Ext.isObject(f) && Ext.isEmpty(f.getResponseHeader("X-SYNO-SOURCE-ID"))) {
            if (Ext.isNumber(d.code) && (414 === d.code || 406 === d.code || 401 === d.code || 423 === d.code)) {
                a = true
            } else {
                if (Ext.isObject(f) && f.status >= 400 && f.status < 600) {
                    a = true
                }
            }
        } else {
            if (Ext.isObject(c.userInfo.params) && Ext.isArray(c.userInfo.params.compound)) {
                d.result.each(function(i) {
                    if (Ext.isObject(i.error) && i.error.code >= 105 && i.error.code <= 107) {
                        a = true;
                        return false
                    }
                }, this)
            } else {
                if (Ext.isNumber(d.code)) {
                    if (d.code >= 105 && d.code <= 107) {
                        a = true
                    }
                } else {
                    if (Ext.isObject(f) && f.status >= 400 && f.status < 600) {
                        a = true
                    }
                }
            }
        }
    }
    if (true === a) {
        b.getMsgBox().alert(_T("error", "error_error"), _T("cms", "relaunch_app"), function() {
            b.close()
        })
    }
    return a
};
SYNO.API.Manager = Ext.extend(Ext.util.Observable, {
    baseURL: "webapi",
    constructor: function() {
        SYNO.API.Manager.superclass.constructor.apply(this, arguments);
        this.jsDebug = Ext.urlDecode(location.search.substr(1)).jsDebug;
        this.knownAPI = {
            "SYNO.API.Info": {
                path: "query.cgi",
                minVersion: 1,
                maxVersion: 1
            }
        }
    },
    queryAPI: function(c, a, e, d) {
        var b = [];
        if (!Ext.isArray(c)) {
            c = [c]
        }
        Ext.each(c, function(f) {
            if (!this.knownAPI.hasOwnProperty(f)) {
                b.push(f)
            }
        }, this);
        this.requestAjaxAPI("SYNO.API.Info", "query", 1, {
            async: Ext.isBoolean(d) ? d : true
        }, {
            query: b.join(",")
        }, Ext.createDelegate(this.onQueryAPI, this, [a, e], true))
    },
    onQueryAPI: function(b, f, e, d, a, c) {
        if (b) {
            if (Ext.isObject(e) && "all" === e.query) {
                this.knownAPI = Ext.apply({}, f)
            } else {
                Ext.apply(this.knownAPI, f)
            }
        }
        if (a) {
            a.call(c, b, f, e, d)
        }
    },
    getKnownAPI: function(b, e) {
        var d = this.knownAPI[b],
            c, a;
        if (!Ext.isDefined(this.jsDebug) || !Ext.isObject(d)) {
            return d
        }
        c = d.path + "/";
        if ("SYNO.Entry.Request" === b && Ext.isObject(e) && Ext.isArray(e.compound)) {
            a = [];
            e.compound.each(function(f) {
                if (Ext.isString(f.api)) {
                    a.push(f.api)
                }
            });
            c += a.join()
        } else {
            c += b
        }
        return Ext.apply({}, {
            path: c
        }, d)
    },
    getBaseURL: function(j, a, l, k, b) {
        var f, h, e, c;
        if (Ext.isObject(j)) {
            h = j;
            k = a;
            b = l;
            if (h.webapi) {
                h = h.webapi
            }
            if (Ext.isObject(h.compound)) {
                if (!Ext.isArray(h.compound.params)) {
                    SYNO.Debug.error("params must be array", h.compound.params);
                    return
                }
                j = "SYNO.Entry.Request";
                a = "request";
                l = 1;
                var d = h.compound.params || [],
                    m = [];
                for (var g = 0; g < d.length; g++) {
                    m.push(Ext.apply({
                        api: d[g].api,
                        method: d[g].method,
                        version: d[g].version
                    }, d[g].params))
                }
                e = {
                    stop_when_error: Ext.isBoolean(h.compound.stopwhenerror) ? h.compound.stopwhenerror : false,
                    mode: Ext.isString(h.compound.mode) ? h.compound.mode : "sequential",
                    compound: m
                }
            } else {
                j = h.api;
                a = h.method;
                l = h.version;
                e = h.params
            }
        }
        f = this.getKnownAPI(j, e);
        if (!f) {
            SYNO.Debug.error("No Such API: " + j);
            return
        }
        c = this.baseURL + "/" + f.path;
        if (Ext.isString(b) && !Ext.isEmpty(b)) {
            c += "/" + window.encodeURIComponent(b)
        }
        if (!a || !l) {
            return c
        }
        h = {
            api: j,
            method: a,
            version: l
        };
        if (e) {
            Ext.apply(h, ("JSON" === f.requestFormat) ? SYNO.API.EncodeParams(e) : e)
        }
        return Ext.urlAppend(c, Ext.urlEncode(h), k)
    },
    requestAjaxAPI: function(l, d, e, b, g, o, c) {
        var h, v = SYNO.Util.copy(g),
            k, w, m = null,
            t;
        var n, s;
        if (Ext.isObject(l)) {
            k = l;
            if (k.webapi) {
                k = k.webapi
            }
            b = {};
            Ext.apply(b, k);
            delete b.api;
            delete b.method;
            delete b.version;
            delete b.scope;
            delete b.callback;
            o = k.callback || l.callback;
            c = k.scope || l.scope;
            b.appWindow = l.appWindow;
            if (Ext.isObject(k.compound)) {
                t = k.compound
            } else {
                l = k.api;
                d = k.method;
                e = k.version;
                v = k.params
            }
        }
        if (b && b.compound) {
            t = b.compound
        }
        if (t) {
            if (!Ext.isArray(t.params)) {
                SYNO.Debug.error("params must be array", t.params);
                return
            }
            l = "SYNO.Entry.Request";
            d = "request";
            e = 1;
            var u = t.params || [],
                a = [];
            for (var r = 0; r < u.length; r++) {
                a.push(Ext.apply({
                    api: u[r].api,
                    method: u[r].method,
                    version: u[r].version
                }, u[r].params))
            }
            v = {
                stop_when_error: Ext.isBoolean(t.stopwhenerror) ? t.stopwhenerror : false,
                mode: Ext.isString(t.mode) ? t.mode : "sequential",
                compound: a
            }
        }
        if (Ext.isObject(b.appWindow) && l !== "SYNO.API.Info") {
            h = SYNO.API.Info.GetKnownAPI(b.appWindow, l, v)
        } else {
            h = this.getKnownAPI(l, v)
        }
        if (!h) {
            s = Ext.isObject(b.appWindow) && b.appWindow.IsAllowRelay();
            SYNO.Debug.error("No Such API: " + l);
            n = {
                error: {
                    code: 101
                }
            };
            if (s) {
                SYNO.API.CheckRelayResponse(false, n, v, b)
            }
            if (Ext.isFunction(o)) {
                o.call(c || window, false, n, v, b)
            }
            return
        }
        if (e < h.minVersion || h.maxVersion < e) {
            SYNO.Debug.warn(String.format("WARN: API({0}) version ({1}) is higher then server ({2})", l, e, h.version))
        }
        if (!Ext.isObject(v) && !Ext.isEmpty(v)) {
            SYNO.Debug.error("params must be object, ", v);
            return
        }
        if (!Ext.isSecure && Ext.isArray(b.encryption)) {
            m = Ext.apply([], b.encryption)
        }
        delete b.encryption;
        var q = {
            api: l,
            method: d,
            version: e
        };
        var f = this.baseURL + "/" + h.path,
            j;
        if (b && b.url) {
            var p = b.url;
            j = Ext.urlDecode(p.substr(p.indexOf("?") + 1));
            if (j && j.api && j.method && j.version) {
                delete j.api;
                delete j.method;
                delete j.version;
                delete j.SynoToken;
                q = j;
                f = b.url
            }
        }
        if (b && Ext.isElement(b.form) && (/multipart\/form-data/i.test(b.form.enctype))) {
            f = SYNO.API.GetBaseURL(q);
            q = {}
        } else {
            if (Ext.isObject(b) && true === b.html5upload) {
                f = SYNO.API.GetBaseURL(Ext.apply({
                    params: v
                }, q));
                q = {};
                b.method = "POST"
            }
        }
        w = Ext.apply((b || {}), {
            url: f,
            params: Ext.apply({}, q, ("JSON" === h.requestFormat) ? SYNO.API.EncodeParams(v) : v),
            callback: this.onRequestAPI,
            userInfo: {
                params: v,
                cb: o,
                scope: c
            }
        });
        if (!Ext.isEmpty(m)) {
            return this.requestAjaxAPI("SYNO.API.Encryption", "getinfo", 1, {
                appWindow: w.appWindow || undefined,
                reqObj: w,
                reqEnc: m
            }, {
                format: "module"
            }, this.onEncryptRequestAPI, this)
        }
        return this.sendRequest(w)
    },
    onEncryptRequestAPI: function(n, k, f, a) {
        var d, h, g, c = a.reqObj,
            b = a.reqEnc,
            m = function(j) {
                for (var i in j) {
                    if (j.hasOwnProperty(i)) {
                        return false
                    }
                }
                return true
            };
        if (!n) {
            return Ext.Ajax.request(c)
        }
        SYNO.Encryption.CipherKey = k.cipherkey;
        SYNO.Encryption.RSAModulus = k.public_key;
        SYNO.Encryption.CipherToken = k.ciphertoken;
        SYNO.Encryption.TimeBias = k.server_time - Math.floor(+new Date() / 1000);
        if (Ext.isEmpty(c.params.compound)) {
            d = SYNO.Encryption.EncryptParam(Ext.copyTo({}, c.params, b));
            for (h = 0; h < b.length; h++) {
                delete c.params[b[h]]
            }
            c.params = Ext.apply(c.params, d);
            return this.sendRequest(c)
        } else {
            var o = Ext.apply({}, c.userInfo.params);
            var l = this,
                e = 5;
            if (Ext.isIE6 || Ext.isIE7 || Ext.isIE8) {
                e = 1
            }
            h = 0;
            var p = function() {
                for (; h < o.compound.length; h++) {
                    var j = Ext.apply({}, o.compound[h], o.compound[h].params);
                    var i = {};
                    d = {};
                    i = SYNO.API.EncodeParams(Ext.copyTo({}, j, b));
                    if (!m(i)) {
                        d = SYNO.Encryption.EncryptParam(i)
                    }
                    for (g = 0; g < b.length; g++) {
                        delete j[b[g]]
                    }
                    o.compound[h] = Ext.apply(j, d);
                    if (h + 1 === o.compound.length) {
                        Ext.apply(c.params, SYNO.API.EncodeParams(o));
                        l.sendRequest(c);
                        return
                    } else {
                        if (h % e === 0) {
                            h++;
                            window.setTimeout(p, 80);
                            return
                        }
                    }
                }
            };
            p()
        }
    },
    sendRequest: function(d) {
        var c = d.appWindow,
            a, f, e = this.getKnownAPI("SYNO.CMS.DS"),
            b;
        if (Ext.isObject(c)) {
            c = c.findAppWindow()
        }
        if (!Ext.isEmpty(e) && SYNO.SDS.Utils.IsAllowRelay(c) && c.hasOpenConfig("cms_id")) {
            f = c.getOpenConfig("cms_timeout") || 120;
            b = {
                api: "SYNO.CMS.DS",
                version: 1,
                method: "relay",
                id: c.getOpenConfig("cms_id"),
                timeout: f
            };
            if (Ext.isElement(d.form) && (/multipart\/form-data/i.test(d.form.enctype))) {
                a = Ext.urlDecode(d.url.substr(d.url.indexOf("?") + 1));
                b.webapi = Ext.encode(Ext.copyTo({}, a, "api,version,method"));
                if (a.SynoToken) {
                    b.SynoToken = a.SynoToken
                }
                d.url = this.baseURL + "/" + e.path + "?" + Ext.urlEncode(b)
            } else {
                d.url = this.baseURL + "/" + e.path;
                b.webapi = Ext.apply({
                    api: d.params.api,
                    version: d.params.version,
                    method: d.params.method
                }, d.userInfo.params);
                d.params = SYNO.API.EncodeParams(b)
            }
            d.timeout = d.timeout || (f + 10) * 1000
        }
        return Ext.Ajax.request(d)
    },
    requestAPI: function(d, f, b, e, a, c) {
        return this.requestAjaxAPI(d, f, b, {}, e, a, c)
    },
    onRequestAPI: function(b, a, g) {
        var h = false,
            d = g,
            f;
        if (a) {
            try {
                f = Ext.decode(g.responseText)
            } catch (c) {}
            if (Ext.isObject(f)) {
                if (f.success) {
                    h = true;
                    d = f.data
                } else {
                    h = false;
                    d = f.error
                }
            }
        }
        SYNO.API.CheckResponse(h, d, b.userInfo.params, g);
        if (SYNO.SDS.Utils.IsAllowRelay(b.appWindow) && SYNO.API.CheckRelayResponse(h, d, undefined, b, g)) {
            return
        }
        if (b.userInfo.cb) {
            b.userInfo.cb.call(b.userInfo.scope, h, d, b.userInfo.params, b)
        }
    }
});
SYNO.API.Store = Ext.extend(Ext.data.Store, {
    defaultParamNames: {
        start: "offset",
        limit: "limit",
        sort: "sort_by",
        dir: "sort_direction"
    },
    constructor: function(a) {
        if ((a.api && a.method && a.version) && !a.proxy) {
            if (!Ext.isObject(a.appWindow) && false !== a.appWindow) {
                SYNO.Debug.error("No appWindow!");
                SYNO.Debug.debug("SYNO.API.Store and SYNO.API.JsonStore require appWindow in config.");
                SYNO.Debug.debug("appWindow can be found by Ext.Component.findAppWindow");
                SYNO.Debug.debug("ex: this.findAppWindow() or config.module.appWin.findAppWindow()");
                return
            }
            this.proxy = new SYNO.API.Proxy({
                api: a.api,
                method: a.method,
                version: a.version,
                appWindow: a.appWindow,
                encryption: a.encryption
            })
        }
        SYNO.API.Store.superclass.constructor.apply(this, arguments)
    }
});
Ext.define("SYNO.API.CompoundReader", {
    extend: "Ext.data.JsonReader",
    constructor: function() {
        this.callParent(arguments)
    },
    readRecords: function(d) {
        var e, c = [],
            b = this.meta.roots,
            a = {
                success: false,
                records: [],
                totalRecords: 0
            };
        this.compoundData = d;
        if (!Ext.isObject(d)) {
            return a
        }
        d.result.each(function(h, g, f) {
            if (Ext.isArray(b)) {
                this.getRoot = this.createAccessor(b[g])
            }
            if (true === h.success) {
                e = this.superclass().readRecords.call(this, h.data)
            } else {
                c.push({
                    response: h,
                    index: g,
                    total: f
                })
            }
            if (Ext.isFunction(this.meta.onCompoundResponse)) {
                e = this.meta.onCompoundResponse(h, e)
            }
            a.records = a.records.concat(e.records);
            a.totalRecords += e.totalRecords
        }, this);
        a.success = !d.has_fail;
        if (false === a.success) {
            throw c
        }
        return a
    }
});
SYNO.API.CompoundStore = Ext.extend(SYNO.API.Store, {
    constructor: function(a) {
        Ext.apply(a, {
            api: "SYNO.Entry.Request",
            version: 1,
            method: "request"
        });
        SYNO.API.JsonStore.superclass.constructor.call(this, Ext.apply(a, {
            reader: new SYNO.API.CompoundReader(a)
        }))
    }
});
SYNO.API.JsonStore = Ext.extend(SYNO.API.Store, {
    constructor: function(a) {
        SYNO.API.JsonStore.superclass.constructor.call(this, Ext.apply(a, {
            reader: new Ext.data.JsonReader(a)
        }))
    }
});
SYNO.API.Proxy = Ext.extend(Ext.util.Observable, {
    constructor: function(c) {
        c = c || {};
        Ext.apply(this, c);
        this.addEvents("exception", "beforeload", "loadexception");
        SYNO.API.Proxy.superclass.constructor.call(this);
        var b = Ext.data.Api.actions;
        this.activeRequest = {};
        for (var a in b) {
            if (b.hasOwnProperty(a)) {
                this.activeRequest[b[a]] = undefined
            }
        }
    },
    request: function(e, b, f, a, g, d, c) {
        if (false !== this.fireEvent("beforeload", this, f)) {
            this.doRequest.apply(this, arguments)
        } else {
            g.call(d || this, null, c, false)
        }
    },
    doRequest: function(f, b, g, a, h, e, c) {
        var d = {
            appWindow: this.appWindow
        };
        if (!c.timeout && this.timeout) {
            Ext.apply(d, {
                timeout: this.timeout
            })
        }
        if (this.encryption) {
            Ext.apply(d, {
                encryption: this.encryption
            })
        }
        if (Ext.isObject(a.meta.compound) && Ext.isArray(a.meta.compound.params)) {
            d.compound = Ext.apply({}, a.meta.compound);
            if (Ext.isObject(g)) {
                d.compound.params.each(function(i) {
                    i.params = Ext.apply(i.params || {}, g)
                }, this)
            }
            g = {}
        }
        this.activeRequest[f] = SYNO.API.currentManager.requestAjaxAPI(this.api, this.method, this.version, d, g, Ext.createDelegate(this.onRequestAPI, this, [a, h, e, c, f], true));
        if (Ext.isEmpty(this.activeRequest[f])) {
            this.onRequestAPI(false, undefined, g, c, a, h, e, c, f)
        }
    },
    onRequestAPI: function(i, f, c, a, g, j, k, m, d) {
        this.activeRequest[d] = undefined;
        var l = null,
            b = null;
        if (i) {
            try {
                l = g.readRecords(f)
            } catch (h) {
                b = h;
                SYNO.Debug.error("Failed to read data, ", h)
            }
        }
        if (!i || b) {
            this.fireEvent("loadexception", this, m, f, b);
            this.fireEvent("exception", this, "response", Ext.data.Api.actions.read, m, f, b)
        } else {
            this.fireEvent("load", this, f, m)
        }
        j.call(k || this, l, m, i)
    }
});
SYNO.API.TreeLoader = Ext.extend(Ext.tree.TreeLoader, {
    load: function(b, c, a) {
        if (this.clearOnLoad) {
            while (b.firstChild) {
                b.removeChild(b.firstChild)
            }
        }
        if (this.doPreload(b)) {
            this.runCallback(c, a || b, [b])
        } else {
            if (this.directFn || (this.method && this.api)) {
                this.requestData(b, c, a || b)
            }
        }
    },
    requestData: function(b, c, a) {
        if (this.fireEvent("beforeload", this, b, c) !== false) {
            this.transId = this.doRequest.apply(this, arguments)
        } else {
            this.runCallback(c, a || b, [])
        }
    },
    doRequest: function(b, d, a) {
        var c = this.getParams(b);
        return SYNO.API.currentManager.requestAjaxAPI(this.api, this.method, this.version, {
            timeout: this.timeout,
            success: this.handleResponse,
            failure: this.handleFailure,
            scope: this,
            appWindow: this.appWindow || false,
            argument: {
                callback: d,
                node: b,
                scope: a
            }
        }, c, Ext.emptyFn)
    },
    processResponse: function(d, c, l, m) {
        var p = d.responseText;
        try {
            var a = d.responseData || Ext.decode(p);
            if (this.dataroot) {
                if (!Ext.isArray(this.dataroot)) {
                    this.dataroot = this.dataroot.split(",")
                }
                var g = this.dataroot;
                for (var k in g) {
                    if (g.hasOwnProperty(k)) {
                        a = a[g[k]]
                    }
                }
            }
            c.beginUpdate();
            for (var f = 0, h = a.length; f < h; f++) {
                var b = this.createNode(a[f], c);
                if (b) {
                    c.appendChild(b)
                }
            }
            c.endUpdate();
            this.runCallback(l, m || c, [c])
        } catch (j) {
            this.handleFailure(d)
        }
    }
});
SYNO.API.Form = {};
SYNO.API.Form.Traverse = function(g, a) {
    if (!g) {
        return
    }
    var f = g.elements || (document.forms[g] || Ext.getDom(g)).elements,
        b = false,
        c, e, d, h;
    Ext.each(f, function(i) {
        c = i.name;
        e = i.type;
        if (!(h = Ext.getCmp(i.id))) {
            return
        }
        if (Ext.isEmpty(c) && Ext.isFunction(h.getName)) {
            c = h.getName()
        }
        if (!i.disabled && c) {
            if (/select-(one|multiple)/i.test(e)) {
                Ext.each(i.options, function(j) {
                    if (j.selected) {
                        d = j.hasAttribute ? j.hasAttribute("value") : j.getAttributeNode("value").specified;
                        a(h, c, d ? j.value : j.text, e)
                    }
                })
            } else {
                if (!(/file|undefined|reset|button/i.test(e))) {
                    if (/radio/i.test(e) || h instanceof SYNO.ux.Radio) {
                        if (h.getValue()) {
                            a(h, c, h.getInputValue() || "", e)
                        }
                    } else {
                        if (/checkbox/i.test(e) || h instanceof SYNO.ux.Checkbox) {
                            a(h, c, h.getValue() ? true : false)
                        } else {
                            if (!(e == "submit" && b)) {
                                if (Ext.isFunction(h.getValue)) {
                                    a(h, c, h.getValue(), e)
                                } else {
                                    a(h, c, i.value, e)
                                }
                                b = /submit/i.test(e)
                            }
                        }
                    }
                }
            }
        }
    });
    return
};
SYNO.API.Form.Serialize = function(a, c) {
    var b = {};
    b = SYNO.API.Form.Retrieve(a, false, c);
    b = SYNO.API.DecodeFlatParams(b);
    b = SYNO.API.EncodeParams(b);
    return Ext.urlEncode(b)
};
SYNO.API.Form.Retrieve = function(b, e, d) {
    var a, f, c = {};
    SYNO.API.Form.Traverse(b, function(h, g, i) {
        if (d) {
            a = SYNO.ux.Utils.getFormFieldApi(h);
            if (!SYNO.ux.Utils.checkApiObjValid(a)) {
                return
            }
            if (d === "get" || d === "load") {
                f = a.method || a.methods.get
            } else {
                f = a.method || a.methods.set
            }
            g = a.api + "|" + f + "|" + a.version + "|" + g
        }
        c[g] = i
    });
    if (e) {
        c = SYNO.API.EncodeParams(c)
    }
    return c
};
SYNO.API.Form.Action = {};
SYNO.API.Form.Action.Load = Ext.extend(Ext.form.Action.Load, {
    run: function() {
        var d = this.options;
        var c = Ext.urlDecode(this.getParams());
        var b = this.form.webapi || this.form;
        var a = b.method || b.methods.get;
        SYNO.API.currentManager.requestAjaxAPI(b.api, a, b.version, Ext.apply(this.createCallback(d), {
            appWindow: this.form.appWindow,
            compound: d.compound,
            method: this.getMethod(),
            url: this.getUrl(false),
            headers: this.options.headers,
            encryption: this.form.encryption
        }), c, d.callback, d.scope)
    }
});
SYNO.API.Form.Action.Submit = Ext.extend(Ext.form.Action.Submit, {
    run: function() {
        var c = this.options;
        if (c.clientValidation === false || this.form.isValid()) {
            var e = Ext.urlDecode(this.getParams());
            var g = Ext.isBoolean(c.fileUpload) ? c.fileUpload : (this.form.fileUpload || (this.form.el && this.form.el.dom && (/multipart\/form-data/i.test(this.form.el.dom.getAttribute("enctype")))));
            var b = this.form.el ? this.form.el.dom : undefined;
            if (g) {
                var f = this.form.items,
                    a = function(l) {
                        if (!l.disabled && (l.inputType !== "file")) {
                            var k = l.getValue();
                            if (Ext.isBoolean(k)) {
                                e[l.getName()] = k
                            }
                            if (l.isComposite && l.rendered) {
                                l.items.each(a)
                            }
                        }
                    };
                f.each(a)
            } else {
                if (c.compound) {} else {
                    var d = SYNO.API.Form.Retrieve(b, false, "submit");
                    for (var i in d) {
                        if (d.hasOwnProperty(i)) {
                            e[i] = d[i]
                        }
                    }
                    e = SYNO.API.DecodeFlatParams(e)
                }
            }
            var h = this.form.webapi || this.form;
            var j = h.method || (h.methods ? h.methods.set : undefined);
            SYNO.API.currentManager.requestAjaxAPI(h.api, j, h.version, Ext.apply(this.createCallback(c), {
                appWindow: this.form.appWindow,
                compound: c.compound,
                form: g ? b : undefined,
                method: this.getMethod(),
                headers: c.headers,
                encryption: this.form.encryption
            }), e, c.callback, c.scope)
        } else {
            if (c.clientValidation !== false) {
                this.failureType = Ext.form.Action.CLIENT_INVALID;
                this.form.afterAction(this, false)
            }
        }
    }
});
SYNO.API.Form.BasicForm = Ext.extend(Ext.form.BasicForm, {
    doAction: function(b, a) {
        if (Ext.isString(b)) {
            if (b !== "load") {
                b = new SYNO.API.Form.Action.Submit(this, a)
            } else {
                b = new SYNO.API.Form.Action.Load(this, a)
            }
        }
        if (this.fireEvent("beforeaction", this, b) !== false) {
            this.beforeAction(b);
            b.run.defer(100, b)
        }
        return this
    },
    submit: function(c) {
        if (this.standardSubmit) {
            var e = {};
            var a = this.items,
                d = function(h) {
                    if (!h.disabled && (h.inputType !== "file")) {
                        var g = h.getValue();
                        if (Ext.isBoolean(g)) {
                            e[h.getName()] = g
                        }
                        if (h.isComposite && h.rendered) {
                            h.items.each(d)
                        }
                    }
                };
            a.each(d);
            var b = this.webapi || this;
            this.url = SYNO.API.GetBaseURL(Ext.apply(e, {
                api: b.api,
                method: b.method || b.methods.set,
                version: b.version
            }));
            return SYNO.API.Form.BasicForm.superclass.submit.call(this, c)
        }
        this.doAction("submit", c);
        return this
    },
    load: function(a) {
        this.doAction("load", a);
        return this
    },
    getValues: function(a, b) {
        if (a === true) {
            return SYNO.API.Form.Serialize(this.el.dom, b)
        }
        return SYNO.API.Form.Retrieve(this.el.dom, false, b)
    },
    loadRecords: function(c, b) {
        for (var a = 0; a < b.length; a++) {
            if (!c[a] || !b[a]) {
                break
            }
            if (!c[a].success) {
                continue
            }
            this.setFieldValues(c[a].data, b[a])
        }
    },
    setFieldValues: function(l, g) {
        var h, e, b, m, d, c, f, a;
        a = function(i) {
            if (this.trackResetOnLoad) {
                i.originalValue = i.getValue()
            }
        };
        if (Ext.isArray(l)) {
            for (d = 0, f = l.length; d < f; d++) {
                var k = l[d];
                m = this.findFields(k.id);
                for (c = 0; c < m.length; c++) {
                    h = m[c];
                    if (h) {
                        if (!SYNO.ux.Utils.checkFieldApiConsistency(h, g, "get")) {
                            continue
                        }
                        e = [h];
                        if ("radio" === h.inputType || h instanceof SYNO.ux.Radio) {
                            e = SYNO.ux.Utils.getRadioGroup(this, k.id)
                        }
                        h.setValue(k.value);
                        Ext.each(e, a, this)
                    }
                }
            }
        } else {
            for (b in l) {
                if (!Ext.isFunction(l[d])) {
                    m = this.findFields(b);
                    for (d = 0; d < m.length; d++) {
                        h = m[d];
                        if (!SYNO.ux.Utils.checkFieldApiConsistency(h, g, "get")) {
                            continue
                        }
                        e = [h];
                        if ("radio" === h.inputType || h instanceof SYNO.ux.Radio) {
                            e = SYNO.ux.Utils.getRadioGroup(this, b)
                        }
                        h.setValue(l[b]);
                        Ext.each(e, a, this)
                    }
                }
            }
        }
        return this
    },
    findFields: function(c) {
        var a = [];
        var b = function(d) {
            if (d.isFormField) {
                if (d.dataIndex == c || d.id == c || d.getName() == c) {
                    a.push(d);
                    return true
                } else {
                    if (d.isComposite) {
                        return d.items.each(b)
                    } else {
                        if (d instanceof Ext.form.CheckboxGroup && d.rendered) {
                            return d.eachItem(b)
                        }
                    }
                }
            }
        };
        this.items.each(b);
        return a
    }
});
SYNO.API.Form.FormPanel = Ext.extend(Ext.form.FormPanel, {
    createForm: function() {
        var a = Ext.applyIf({
            appWindow: this,
            listeners: {}
        }, this.initialConfig);
        return new SYNO.API.Form.BasicForm(null, a)
    }
});
SYNO.API.EncodeFlatParams = function(d) {
    var e = {};
    if (!d) {
        return e
    }
    var a = function(k, h, i) {
        for (var j in k) {
            if (k.hasOwnProperty(j)) {
                var g = k[j],
                    f = h ? (h + "|" + j) : j;
                if (Ext.isFunction(g)) {} else {
                    if (Ext.isObject(g)) {
                        a(k[j], f, i)
                    } else {
                        i[f] = g
                    }
                }
            }
        }
    };
    if (!Ext.isArray(d)) {
        a(d, undefined, e);
        return e
    }
    var c;
    for (var b = 0; b < c.length; b++) {
        if (c[b].api && c[b].method) {
            a(c[b], c[b].api + "|" + c[b].method, e)
        } else {
            a(d, undefined, e)
        }
    }
    return e
};
SYNO.API.DecodeFlatParams = function(b) {
    var d = {};
    var c = function(f, i, h) {
        var g = f.indexOf("|"),
            e;
        if (0 < g) {
            e = f.substring(0, g);
            if (!Ext.isObject(h[e])) {
                h[e] = {}
            }
            c(f.substring(g + 1), i, h[e])
        } else {
            h[f] = i
        }
    };
    for (var a in b) {
        if (!Ext.isObject(b[a])) {
            c(a, b[a], d)
        } else {
            d[a] = b[a]
        }
    }
    return d
};
SYNO.API.EscapeStr = function(a) {
    if (!a) {
        return ""
    }
    return a.replace(/[\\]/g, "\\\\").replace(/[,]/g, "\\,")
};
SYNO.API.EncodeParams = function(d) {
    var b = {};
    for (var a in d) {
        if (d.hasOwnProperty(a)) {
            b[a] = Ext.encode(d[a])
        }
    }
    return b
};
SYNO.API.DecodeParams = function(f) {
    var d = {};
    for (var a in f) {
        if (f.hasOwnProperty(a)) {
            try {
                d[a] = Ext.decode(f[a])
            } catch (b) {
                d[a] = SYNO.Util.copy(f[a])
            }
        }
    }
    return d
};
SYNO.API.Request = function(a) {
    return SYNO.API.currentManager.requestAjaxAPI(a)
};
SYNO.API.GetBaseURL = function(d, a, b) {
    var c = d.appWindow,
        e = function() {
            if (SYNO.ux.Utils.checkApiObjValid(d) && SYNO.SDS.Utils.IsAllowRelay(c) && c.hasOpenConfig("cms_id")) {
                return SYNO.API.currentManager.getBaseURL({
                    api: "SYNO.CMS.DS",
                    version: 1,
                    method: "relay",
                    params: {
                        id: c.getOpenConfig("cms_id"),
                        timeout: c.getOpenConfig("cms_timeout") || 120,
                        webapi: Ext.apply({
                            api: d.api,
                            version: d.version,
                            method: d.method
                        }, d.params)
                    }
                }, a, b)
            } else {
                return SYNO.API.currentManager.getBaseURL(d, a, b)
            }
        };
    return e()
};
SYNO.API.EncodeURL = function(a) {
    a = SYNO.API.EncodeParams(a);
    return Ext.urlEncode.apply(this, arguments)
};
SYNO.API.GetKnownAPI = function(a, b) {
    return SYNO.API.currentManager.getKnownAPI(a, b)
};
SYNO.API.Util = {};
SYNO.API.Util.GetReqByAPI = function(e, d, h, b) {
    var c, g, f;
    if (!Ext.isObject(e)) {
        return
    }
    c = e.compound;
    if (Ext.isObject(c)) {
        if (!Ext.isArray(c.params)) {
            return
        }
        g = c.params;
        for (var a = 0; a < g.length; a++) {
            f = g[a];
            if (d === f.api && h === f.method) {
                if (b) {
                    return Ext.isObject(f.params) ? (Ext.isDefined(f.params[b]) ? f.params[b] : f[b]) : f[b]
                }
                return f
            }
        }
    } else {
        if (Ext.isObject(e.params)) {
            if (b) {
                return e.params[b]
            }
            return e.params
        }
    }
    return
};
SYNO.API.Util.GetReqByIndex = function(d, a, b) {
    var c, e;
    if (!Ext.isObject(d)) {
        return
    }
    c = d.compound;
    if (Ext.isObject(c)) {
        if (!Ext.isArray(c.params)) {
            return
        }
        e = c.params;
        if (!Ext.isObject(e[a])) {
            return
        }
        e = e[a];
        if (b) {
            return Ext.isObject(e.params) ? (Ext.isDefined(e.params[b]) ? e.params[b] : e[b]) : e[b]
        }
        return e
    } else {
        if (Ext.isObject(d.params)) {
            if (b) {
                return d.params[b]
            }
            return d.params
        }
    }
    return
};
SYNO.API.Util.GetValByAPI = function(f, d, g, c) {
    if (Ext.isObject(f)) {
        if (Ext.isArray(f.result)) {
            var a = f.result;
            for (var b = 0; b < a.length; b++) {
                if (d === a[b].api && g === a[b].method) {
                    var e = a[b].data || a[b].error;
                    if (!e) {
                        return
                    }
                    if (c) {
                        return e[c]
                    }
                    return e
                }
            }
            return
        } else {
            if (c) {
                return f[c]
            } else {
                return f
            }
        }
    }
    return
};
SYNO.API.Util.GetValByIndex = function(e, b, c) {
    var a;
    if (!Ext.isObject(e)) {
        return
    }
    a = e.result;
    if (Ext.isArray(a)) {
        if (!Ext.isObject(a[b])) {
            return
        }
        var d = a[b].data || a[b].error;
        if (!d) {
            return
        }
        if (c) {
            return d[c]
        }
        return d
    } else {
        if (c) {
            return e[c]
        } else {
            return e
        }
    }
};
SYNO.API.Util.GetFirstError = function(c) {
    var a;
    if (!Ext.isObject(c)) {
        return
    }
    if (Ext.isBoolean(c.has_fail)) {
        if (c.has_fail && Ext.isArray(c.result)) {
            a = c.result;
            for (var b = 0; b < a.length; b++) {
                if (Ext.isObject(a[b]) && !a[b].success) {
                    return a[b].error
                }
            }
        }
    }
    return c
};
SYNO.API.Util.GetFirstErrorIndex = function(c) {
    var a;
    if (!Ext.isObject(c)) {
        return
    }
    if (Ext.isBoolean(c.has_fail)) {
        if (c.has_fail && Ext.isArray(c.result)) {
            a = c.result;
            for (var b = 0; b < a.length; b++) {
                if (Ext.isObject(a[b]) && !a[b].success) {
                    return b
                }
            }
        }
    }
    return 0
};
SYNO.API.Request.Polling = Ext.extend(Ext.util.Observable, {
    api: "SYNO.Entry.Request.Polling",
    version: 1,
    local: "polling_local_instance",
    queue: null,
    pool: null,
    reg: null,
    pollingId: null,
    jsDebug: undefined,
    constructor: function() {
        SYNO.API.Request.Polling.superclass.constructor.apply(this, arguments);
        this.queue = {};
        this.pool = {};
        this.reg = {};
        this.jsDebug = Ext.urlDecode(location.search.substr(1)).jsDebug
    },
    getInterval: function(e, b) {
        var c, a = 0,
            d;
        if (Ext.isNumber(e.firstRunTime)) {
            a = parseInt(new Date().getTime() / 1000, 10) - e.firstRunTime
        }
        if (Ext.isNumber(b)) {
            c = b
        } else {
            if (Ext.isFunction(b)) {
                c = b.call(e.scope || this, a)
            } else {
                if (Ext.isArray(b)) {
                    for (d = 0; d < b.length; ++d) {
                        if (b[d].time > a) {
                            break
                        }
                        c = b[d].interval
                    }
                }
            }
        }
        if (!Ext.isNumber(c)) {
            return false
        }
        if (c < 1) {
            c = 1
        }
        return c
    },
    addToQueue: function(d, a) {
        var c = this.reg[d],
            b;
        if (Ext.isEmpty(c)) {
            return false
        }
        b = this.getInterval(c, a);
        if (!Ext.isNumber(b)) {
            SYNO.Debug.error("[Polling]Register " + d + " interval is invalid");
            return false
        }
        this.queue[d] = b;
        return true
    },
    addToPool: function(b, a, d) {
        var c = this.getInstanceName(d);
        if (Ext.isEmpty(this.pool[c + b])) {
            this.pool[c + b] = Ext.apply({
                register_id_list: [],
                auto_remove: false,
                finish: false
            }, a || {})
        }
    },
    addToRegister: function(d) {
        var a, b, c, e = Ext.id(undefined, "webapi_polling_register_id");
        if ((Ext.isEmpty(d.task_id) && Ext.isEmpty(d.webapi)) || !Ext.isFunction(d.status_callback)) {
            return
        }
        if (!Ext.isNumber(d.interval) && !Ext.isFunction(d.interval) && !Ext.isArray(d.interval)) {
            return
        }
        if (Ext.isEmpty(d.webapi)) {
            a = this.getTask(d.task_id, d.appWindow);
            if (Ext.isEmpty(a)) {
                return
            }
            a.register_id_list = a.register_id_list.concat(e)
        }
        b = parseInt(new Date().getTime() / 1000, 10);
        c = d.immediate ? b : b + this.getInterval(d, d.interval);
        this.reg[e] = Ext.apply({
            firstRunTime: c
        }, d);
        return e
    },
    getTask: function(a, c) {
        var b = this.getInstanceName(c);
        if (Ext.isEmpty(a)) {
            return
        }
        return this.pool[b + a]
    },
    updateTask: function(b, a, d) {
        var c = this.getTask(b, d) || {
            register_id_list: []
        };
        Ext.copyTo(c, a, "auto_remove,finish")
    },
    removeTask: function(a, d) {
        var b = this.getTask(a, d),
            c = this.getInstanceName(d);
        if (Ext.isEmpty(b)) {
            return false
        }
        if (Ext.isEmpty(b.register_id_list) || !Ext.isArray(b.register_id_list)) {
            delete this.pool[c + a];
            return true
        }
        b.register_id_list.each(function(e) {
            delete this.queue[e];
            delete this.reg[e]
        }, this);
        delete this.pool[c + a];
        return true
    },
    removeRegister: function(c) {
        var a, b;
        if (Ext.isEmpty(c) || Ext.isEmpty(this.reg[c])) {
            SYNO.Debug.error("[Polling]No such register id");
            return false
        }
        b = this.reg[c];
        if (Ext.isEmpty(b.webapi)) {
            a = this.getTask(b.task_id, b.appWindow);
            if (Ext.isEmpty(a)) {
                SYNO.Debug.error("[Polling]No such task");
                return false
            }
            a.register_id_list.remove(c)
        }
        b.status_callback = null;
        delete this.reg[c];
        return true
    },
    convertToTaskUser: function(b) {
        var a;
        if (Ext.isEmpty(b)) {
            a = _S("user")
        } else {
            if ("admin" == b) {
                a = "@administrators"
            } else {
                if ("everyone" == b) {
                    a = "@users"
                }
            }
        }
        return a
    },
    notifyTaskStatus: function(a, e, f, d) {
        var b, c;
        b = this.getTask(a, d.app);
        if (Ext.isEmpty(b)) {
            return
        }
        b.register_id_list.each(function(h) {
            c = this.reg[h];
            if (Ext.isEmpty(c) || !Ext.isFunction(c.status_callback)) {
                return
            }
            try {
                c.status_callback.call(c.scope || this, a, e, f, d)
            } catch (g) {
                SYNO.Debug.error(g)
            }
        }, this)
    },
    notifyWebAPIStatus: function(d, g, e, f, c) {
        var a = this.reg[d];
        if (Ext.isEmpty(a)) {
            return
        }
        if (Ext.isDefined(this.jsDebug)) {
            a.status_callback.call(a.scope || this, g, e, f, c)
        } else {
            try {
                a.status_callback.call(a.scope || this, g, e, f, c)
            } catch (b) {
                SYNO.Debug.error(b)
            }
        }
    },
    beginPolling: function(e) {
        var b, d, g, a, f = false,
            c = {};
        if ("halt" === e) {
            delete this.pollingHalt
        }
        for (d in this.queue) {
            if (this.queue.hasOwnProperty(d)) {
                b = this.reg[d];
                if (Ext.isEmpty(b)) {
                    delete this.queue[d];
                    continue
                }
                if (true === this.pollingHalt && true !== b.preventHalt) {
                    continue
                }
                this.queue[d]--;
                if (this.queue[d] > 0) {
                    continue
                }
                delete this.queue[d];
                if (!Ext.isFunction(b.status_callback)) {
                    continue
                }
                g = b.appWindow || false;
                if (g && true === g.isDestroyed && true !== g.keepPolling) {
                    this.removeRegister(d);
                    continue
                }
                a = this.getInstanceName(g);
                if (Ext.isEmpty(c[a])) {
                    c[a] = {
                        task_id_list: [],
                        webapi: [],
                        reg: [],
                        opts: [],
                        app: g
                    }
                }
                if (!Ext.isEmpty(b.webapi)) {
                    f = true;
                    c[a].webapi.push(b.webapi);
                    c[a].reg.push(d);
                    c[a].opts.push(b.webapi);
                    continue
                }
                if (Ext.isEmpty(this.getTask(b.task_id, b.appWindow))) {
                    continue
                }
                f = true;
                if (c[a].task_id_list.indexOf(b.task_id) < 0) {
                    c[a].task_id_list = c[a].task_id_list.concat(b.task_id)
                }
            }
        }
        this.endPolling();
        if (false === f) {
            this.pollingId = this.beginPolling.defer(1000, this);
            return
        }
        for (a in c) {
            if (c.hasOwnProperty(a)) {
                if (!Ext.isEmpty(c[a].task_id_list)) {
                    c[a].webapi.push({
                        api: this.api,
                        version: this.version,
                        method: "status",
                        params: {
                            task_id_list: c[a].task_id_list
                        }
                    });
                    c[a].reg.push("TASK");
                    c[a].opts.push({
                        app: c[a].app,
                        task_id_list: c[a].task_id_list
                    })
                }
                this.reqId = SYNO.API.Request({
                    compound: {
                        stop_when_error: false,
                        mode: "parallel",
                        params: c[a].webapi
                    },
                    appWindow: c[a].app,
                    callback: this.pollingCompoundCallack,
                    reg_ref: c[a].reg,
                    opts_ref: c[a].opts,
                    timeout: 6000000,
                    scope: this
                })
            }
        }
    },
    endPolling: function(a) {
        if ("halt" === a) {
            this.pollingHalt = true;
            return
        }
        window.clearTimeout(this.pollingId);
        this.pollingId = null;
        if (!Ext.isEmpty(this.reqId)) {
            Ext.Ajax.abort(this.reqId);
            delete this.reqId
        }
    },
    collectToQueue: function(e, f) {
        var c = Ext.isArray(e) ? e : [],
            h, d, a, b, g = function(i) {
                i.each(function(k, j) {
                    d = this.reg[k];
                    if (Ext.isEmpty(d) || !Ext.isFunction(d.status_callback)) {
                        return
                    }
                    this.addToQueue(k, d.interval)
                }, this)
            };
        b = c.indexOf("TASK");
        if (-1 !== b) {
            h = f[b];
            c.splice(b, 1)
        }
        g.call(this, c);
        if (Ext.isObject(h) && Ext.isArray(h.task_id_list)) {
            h.task_id_list.each(function(i) {
                a = this.getTask(i, h.app);
                if (Ext.isEmpty(a)) {
                    return
                }
                if (true === a.finish) {
                    return
                }
                g.call(this, a.register_id_list)
            }, this)
        }
        if (Ext.isEmpty(this.pollingId)) {
            this.pollingId = this.beginPolling.defer(1000, this)
        }
    },
    pollingCompoundCallack: function(k, g, d, a) {
        var f, c, h, l, e, j, b;
        this.reqId = null;
        f = k ? g.result : [];
        c = a.reg_ref;
        h = a.opts_ref;
        if (c.length !== f.length) {
            this.collectToQueue(c, h);
            return
        }
        this.endPolling();
        for (e = 0; e < f.length; e++) {
            if (c[e] === "TASK") {
                this.pollingCallback(k, f[e].data, d.compound[e], h[e])
            } else {
                j = this.reg[c[e]];
                if (Ext.isEmpty(j)) {
                    continue
                }
                if (!Ext.isFunction(j.status_callback)) {
                    this.removeRegister(c[e]);
                    continue
                }
                b = j.appWindow || false;
                if (b && true === b.isDestroyed && true !== b.keepPolling) {
                    this.removeRegister(c[e]);
                    continue
                }
                l = f[e].success;
                this.notifyWebAPIStatus(c[e], l, l ? f[e].data : f[e].error, d.compound[e], h[e])
            }
        }
        this.collectToQueue(c, h)
    },
    pollingCallback: function(f, d, e, c) {
        var b, a;
        if (!f) {
            return
        }
        for (a in d) {
            if (d.hasOwnProperty(a)) {
                this.updateTask(a, d[a], c.app);
                b = this.getTask(a, c.app);
                if (Ext.isEmpty(b)) {
                    continue
                }
                this.notifyTaskStatus(a, d[a], e, c);
                if (b.finish && b.auto_remove) {
                    this.removeTask(a, c.app)
                }
            }
        }
    },
    list: function(a) {
        var c, b;
        b = Ext.apply({
            extra_group_tasks: [],
            task_id_prefix: "",
            callback: null
        }, a);
        if (!Ext.isArray(b.extra_group_tasks)) {
            SYNO.Debug.error("[Polling]Incorrect type parameter: extra_group_tasks");
            return
        }
        b.extra_group_tasks = b.extra_group_tasks.concat("user");
        c = Ext.copyTo({}, b, "extra_group_tasks,task_id_prefix");
        if (!Ext.isFunction(b.callback)) {
            SYNO.Debug.error("[Polling]No required parameter: callback");
            return
        }
        delete c.callback;
        delete c.scope;
        SYNO.API.Request({
            api: this.api,
            version: this.version,
            method: "list",
            params: c,
            appWindow: b.appWindow || false,
            callback: b.callback,
            scope: b.scope || this
        })
    },
    register: function(a) {
        var b;
        if ((Ext.isEmpty(a.task_id) && Ext.isEmpty(a.webapi)) || !Ext.isFunction(a.status_callback)) {
            SYNO.Debug.error("[Polling]register fail, no requried parameters");
            return
        }
        if (!Ext.isNumber(a.interval) && !Ext.isFunction(a.interval) && !Ext.isArray(a.interval)) {
            SYNO.Debug.error("[Polling]register fail, interval is invalid");
            return
        }
        if (!Ext.isEmpty(a.task_id)) {
            this.addToPool(a.task_id, {
                task_id: a.task_id
            }, a.appWindow)
        }
        b = this.addToRegister(a);
        if (true === a.immediate) {
            if (true === this.pollingHalt) {
                this.addToQueue(b, 0)
            } else {
                SYNO.API.Request(Ext.apply({
                    appWindow: a.appWindow,
                    callback: function(f, d, e, c) {
                        this.notifyWebAPIStatus(b, f, d, e, c);
                        this.addToQueue(b, a.interval)
                    },
                    scope: this
                }, a.webapi))
            }
        } else {
            this.addToQueue(b, a.interval)
        }
        return b
    },
    unregister: function(a) {
        return this.removeRegister(a)
    },
    getInstanceName: function(b) {
        var a = this.local;
        if (Ext.isObject(b) && SYNO.SDS.Utils.IsAllowRelay(b)) {
            if (b.hasOpenConfig("cms_id")) {
                a = "cms_ds_" + b.getOpenConfig("cms_id")
            }
        }
        return a
    }
});
SYNO.API.Request.Polling.InitInstance = function(a) {
    if (!a) {
        a = {}
    }
    if (Ext.isEmpty(a._Instance)) {
        a._Instance = new SYNO.API.Request.Polling();
        a._Instance.beginPolling()
    }
    return a._Instance
};
SYNO.API.Request.Polling.Instance = SYNO.API.Request.Polling.InitInstance(SYNO.API.Request.Polling.Instance);
SYNO.API.Request.Polling.List = function(a) {
    return SYNO.API.Request.Polling.Instance.list(a)
};
SYNO.API.Request.Polling.Register = function(a) {
    return SYNO.API.Request.Polling.Instance.register(a)
};
SYNO.API.Request.Polling.Unregister = function(a) {
    return SYNO.API.Request.Polling.Instance.unregister(a)
};
Ext.define("SYNO.API.Info", {
    extend: "Ext.util.Observable",
    local: "info_local",
    constructor: function() {
        this.callParent(arguments);
        this._session = {};
        this._define = {};
        this._knownAPI = {}
    },
    check: function(b) {
        var a;
        if (!Ext.isObject(b)) {
            throw "Error! appwindow is incorrect!"
        }
        if (!Ext.isFunction(b.findAppWindow)) {
            return
        }
        a = b.findAppWindow();
        if (!Ext.isObject(a) || !Ext.isObject(a.openConfig) || !Ext.isFunction(a.hasOpenConfig) || !Ext.isFunction(a.getOpenConfig) || !Ext.isFunction(a.setOpenConfig)) {
            return
        }
        return a
    },
    getInstName: function(c) {
        var b = this.local,
            a = this.check(c);
        if (Ext.isObject(a) && SYNO.SDS.Utils.IsAllowRelay(a)) {
            if (a.hasOpenConfig("cms_id")) {
                b = "cms_ds_" + a.getOpenConfig("cms_id")
            }
        }
        return b
    },
    getInstNameById: function(b) {
        var a = this.local;
        if (Ext.isNumber(b) && 0 <= b) {
            a = "cms_ds_" + b
        }
        return a
    },
    checkInst: function(d, a, b, c, e) {
        if (d === this.local) {
            return false
        }
        if (Ext.isObject(c) && Ext.isObject(b)) {
            this.handleResponse(a, b, c, e);
            return false
        }
        if (d in this._define && d in this._session && b !== true) {
            this.handleResponse({
                cms_id: 0
            }, undefined, undefined, e);
            return false
        }
        return true
    },
    updateInstById: function(b, a, e) {
        var d, c, f;
        if (Ext.isObject(b)) {
            c = b;
            b = c.cms_id;
            d = this.getInstNameById(c.cms_id);
            f = Ext.copyTo({}, c, "callback,args,scope")
        }
        if (false === this.checkInst(d, {
                cms_id: b
            }, a, e, f)) {
            return
        }
        SYNO.API.Request({
            api: "SYNO.CMS.DS",
            version: 1,
            method: "relay",
            timeout: 30000,
            params: {
                id: b,
                timeout: 30,
                webapi: {
                    api: "SYNO.API.Info",
                    version: 1,
                    method: "query"
                }
            },
            appOpt: f,
            cms_id: b,
            callback: function(j, h, i, g) {
                if (true !== j) {
                    this._knownAPI[d] = undefined
                } else {
                    this._knownAPI[d] = h
                }
            },
            scope: this
        });
        SYNO.API.Request({
            api: "SYNO.CMS.DS",
            version: 1,
            method: "relay",
            timeout: 30000,
            params: {
                id: b,
                timeout: 30,
                webapi: {
                    api: "SYNO.Entry.Request",
                    version: 1,
                    method: "request",
                    compound: [{
                        api: "SYNO.Core.System",
                        version: 1,
                        method: "info",
                        type: "define"
                    }, {
                        api: "SYNO.Core.System",
                        version: 1,
                        method: "info",
                        type: "session"
                    }]
                }
            },
            appOpt: f,
            cms_id: b,
            callback: this.onUpdateInst,
            scope: this
        })
    },
    updateInst: function(b, c, e) {
        var a = this.check(b),
            d = this.getInstName(b);
        if (false === this.checkInst(d, {
                appWindow: b
            }, c, e)) {
            return
        }
        a.sendWebAPI({
            api: "SYNO.API.Info",
            version: 1,
            method: "query",
            callback: function(i, g, h, f) {
                if (true !== i) {
                    this._knownAPI[d] = undefined
                } else {
                    this._knownAPI[d] = g
                }
            },
            scope: this
        });
        if (this._knownAPI.hasOwnProperty(d) && Ext.isEmpty(this._knownAPI[d])) {
            return
        }
        a.sendWebAPI({
            compound: {
                stopwhenerror: false,
                params: [{
                    api: "SYNO.Core.System",
                    version: 1,
                    method: "info",
                    params: {
                        type: "define"
                    }
                }, {
                    api: "SYNO.Core.System",
                    version: 1,
                    method: "info",
                    params: {
                        type: "session"
                    }
                }]
            },
            callback: this.onUpdateInst,
            scope: this
        })
    },
    checkUpdateResponse: function(e, c, d, a) {
        var b;
        if (Ext.isNumber(a.cms_id)) {
            b = this.getInstNameById(a.cms_id)
        } else {
            b = this.getInstName(a.appWindow)
        }
        if (!e) {
            SYNO.Debug.error("Update session and define fail");
            return false
        }
        if (b === this.local) {
            return false
        }
        if (c.result.length !== 2) {
            SYNO.Debug.error("Incorrect response:" + Ext.encode(c.result));
            return false
        }
        if (c.result[0].success === false || c.result[1].success === false) {
            delete this._session[b];
            delete this._define[b];
            return false
        }
        return true
    },
    onUpdateInst: function(d, b, c, a) {
        if (this.checkUpdateResponse(d, b, c, a)) {
            this.handleResponse(a, b.result[0].data, b.result[1].data, a.appOpt)
        } else {
            this.handleResponse({
                cms_id: 0
            }, undefined, undefined, a.appOpt)
        }
    },
    handleResponse: function(b, a, d, e) {
        var c;
        if (Ext.isNumber(b.cms_id)) {
            c = this.getInstNameById(b.cms_id)
        } else {
            c = this.getInstName(b.appWindow)
        }
        if (c !== this.local) {
            this._define[c] = Ext.apply({}, a);
            this._session[c] = Ext.apply({}, d)
        }
        if (Ext.isObject(e) && Ext.isFunction(e.callback)) {
            if (c in this._knownAPI) {
                e.callback.apply(e.scope || this, e.args)
            } else {
                e.callback.defer(1000, e.scope || this, e.args)
            }
        }
    },
    removeById: function(a) {
        var b = this.getInstNameById(a);
        if (b === this.local) {
            return
        }
        delete this._define[b];
        delete this._session[b];
        delete this._knownAPI[b]
    },
    getDefine: function(a, b, c) {
        var d = this.getInstName(a);
        if (d === this.local) {
            return _D(b, c)
        }
        if (Ext.isEmpty(this._session[d])) {
            this.updateInst(a);
            SYNO.Debug.error("Please update first");
            return
        }
        if (b in this._define[d]) {
            return this._define[d][b]
        }
        return Ext.isString(c) ? c : ""
    },
    getSession: function(a, b) {
        var c = this.getInstName(a);
        if (c === this.local) {
            return _S(b)
        }
        switch (b) {
            case "lang":
            case "isMobile":
            case "demo_mode":
            case "SynoToken":
                return _S(b);
            default:
                if (Ext.isEmpty(this._session[c])) {
                    this.updateInst(a);
                    SYNO.Debug.error("[Info]Please update first");
                    return
                } else {
                    return this._session[c][b]
                }
        }
    },
    getKnownAPI: function(a, b, d) {
        var c = this.getInstName(a);
        if (c === this.local) {
            return SYNO.API.GetKnownAPI(b, d)
        }
        if (Ext.isEmpty(this._knownAPI[c]) || Ext.isEmpty(this._knownAPI[c][b])) {
            this.updateInst(a);
            SYNO.Debug.error("[Info]Please update first");
            return
        }
        return this._knownAPI[c][b]
    }
});
SYNO.API.Info.InitInstance = function(a) {
    if (!a) {
        a = {}
    }
    if (Ext.isEmpty(a._Instance)) {
        a._Instance = new SYNO.API.Info()
    }
    return a._Instance
};
SYNO.API.Info.Instance = SYNO.API.Info.InitInstance(SYNO.API.Info.Instance);
SYNO.API.Info.GetSession = function(a, b) {
    return SYNO.API.Info.Instance.getSession(a, b)
};
SYNO.API.Info.GetDefine = function(a, b, c) {
    return SYNO.API.Info.Instance.getDefine(a, b, c)
};
SYNO.API.Info.GetKnownAPI = function(a, b, c) {
    return SYNO.API.Info.Instance.getKnownAPI(a, b, c)
};
SYNO.API.Info.Update = function(a, b, c) {
    return SYNO.API.Info.Instance.updateInst(a, b, c)
};
SYNO.API.Info.UpdateById = function(a) {
    return SYNO.API.Info.Instance.updateInstById(a)
};
SYNO.API.Info.RemoveById = function(a) {
    return SYNO.API.Info.Instance.removeById(a)
};
Ext.namespace("SYNO.API");
SYNO.API.GetErrors = function() {
    var a = {};
    a.minCustomeError = 400;
    a.common = {
        0: _T("common", "commfail"),
        100: _T("common", "error_system"),
        101: "Bad Request",
        102: "No Such API",
        103: "No Such Method",
        104: "Not Supported Version",
        105: _T("error", "error_privilege_not_enough"),
        106: _T("error", "error_timeout"),
        107: _T("login", "error_interrupt"),
        108: _T("user", "user_file_upload_fail"),
        109: _T("error", "error_error_system"),
        110: _T("error", "error_error_system"),
        111: _T("error", "error_error_system"),
        112: "Stop Handling Compound Request",
        113: "Invalid Compound Request",
        114: _T("error", "error_invalid"),
        115: _T("error", "error_invalid"),
        116: _JSLIBSTR("uicommon", "error_demo"),
        117: _T("error", "error_error_system"),
        118: _T("error", "error_error_system"),
        122: _T("error", "error_privilege_not_enough"),
        123: _T("error", "error_privilege_not_enough"),
        124: _T("error", "error_privilege_not_enough"),
        125: _T("error", "error_timeout"),
        126: _T("error", "error_privilege_not_enough"),
        127: _T("error", "error_privilege_not_enough")
    };
    a.core = {
        402: _T("share", "no_such_share"),
        403: _T("error", "error_invalid"),
        404: _T("error", "error_privilege_not_enough"),
        1101: _T("error", "error_subject"),
        1102: _T("firewall", "firewall_restore_failed"),
        1103: _T("firewall", "firewall_block_admin_client"),
        1104: _T("firewall", "firewall_rule_exceed_max_number"),
        1105: _T("firewall", "firewall_rule_disable_fail"),
        1198: _T("common", "version_not_support"),
        1201: _T("error", "error_subject"),
        1202: _T("firewall", "firewall_tc_ceil_exceed_system_upper_bound"),
        1203: _T("firewall", "firewall_tc_max_ceil_too_large"),
        1204: _T("firewall", "firewall_tc_restore_failed"),
        1301: _T("error", "error_subject"),
        1302: _T("firewall", "firewall_dos_restore_failed"),
        1402: _T("service", "service_ddns_domain_load_error"),
        1410: _T("service", "service_ddns_operation_fail"),
        1500: _T("common", "error_system"),
        1501: _T("common", "error_apply_occupied"),
        1502: _T("routerconf", "routerconf_external_ip_warning"),
        1503: _T("routerconf", "routerconf_require_gateway"),
        1510: _T("routerconf", "routerconf_update_db_failed"),
        1521: _T("routerconf", "routerconf_exceed_singel_max_port"),
        1522: _T("routerconf", "routerconf_exceed_combo_max_port"),
        1523: _T("routerconf", "routerconf_exceed_singel_range_max_port"),
        1524: _T("routerconf", "routerconf_exceed_max_rule"),
        1525: _T("routerconf", "routerconf_port_conflict"),
        1526: _T("routerconf", "routerconf_add_port_failed"),
        1527: _T("routerconf", "routerconf_apply_failed"),
        1530: _T("routerconf", "routerconf_syntax_version_error"),
        1600: _T("error", "error_error_system"),
        1601: _T("error", "error_error_system"),
        1602: _T("error", "error_error_system"),
        1701: _T("error", "error_port_conflict"),
        1702: _T("error", "error_file_exist"),
        1703: _T("error", "error_no_path"),
        1704: _T("error", "error_error_system"),
        1706: _T("error", "error_volume_ro"),
        1903: _T("error", "error_port_conflict"),
        1904: _T("error", "error_port_conflict"),
        1905: _T("ftp", "ftp_annoymous_root_share_invalid"),
        1951: _T("error", "error_port_conflict"),
        2001: _T("error", "error_error_system"),
        2002: _T("error", "error_error_system"),
        2101: _T("error", "error_error_system"),
        2102: _T("error", "error_error_system"),
        2201: _T("error", "error_error_system"),
        2202: _T("error", "error_error_system"),
        2301: _T("error", "error_invalid"),
        2303: _T("error", "error_port_conflict"),
        2331: _T("nfs", "nfs_key_wrong_format"),
        2332: _T("user", "user_file_upload_fail"),
        2371: _T("error", "error_mount_point_nfs"),
        2372: _T("error", "error_hfs_plus_mount_point_nfs"),
        2401: _T("error", "error_error_system"),
        2402: _T("error", "error_error_system"),
        2403: _T("error", "error_port_conflict"),
        2500: _T("error", "error_unknown_desc"),
        2502: _T("error", "error_invalid"),
        2503: _T("error", "error_error_system"),
        2504: _T("error", "error_error_system"),
        2505: _T("error", "error_error_system"),
        2601: _T("network", "domain_name_err"),
        2602: _T("network", "domain_dns_name_err"),
        2603: _T("network", "domain_kdc_ip_error"),
        2604: _T("network", "error_badgname"),
        2605: _T("network", "domain_unreachserver_err"),
        2606: _T("network", "domain_port_unreachable_err"),
        2607: _T("network", "domain_password_err"),
        2608: _T("network", "domain_acc_revoked_ads"),
        2609: _T("network", "domain_acc_revoked_rpc"),
        2610: _T("network", "domain_acc_err"),
        2611: _T("network", "domain_notadminuser"),
        2612: _T("network", "domain_change_passwd"),
        2613: _T("network", "domain_check_kdcip"),
        2614: _T("network", "domain_error_misc_rpc"),
        2615: _T("network", "domain_join_err"),
        2616: _T("directory_service", "warr_enable_samba"),
        2626: _T("directory_service", "warr_db_not_ready"),
        2702: _T("network", "status_connected"),
        2703: _T("network", "status_disconnected"),
        2704: _T("common", "error_occupied"),
        2705: _T("common", "error_system"),
        2706: _T("ldap_error", "ldap_invalid_credentials"),
        2707: _T("ldap_error", "ldap_operations_error"),
        2708: _T("ldap_error", "ldap_server_not_support"),
        2709: _T("domain", "domain_ldap_conflict"),
        2710: _T("ldap_error", "ldap_operations_error"),
        2712: _T("ldap_error", "ldap_no_such_object"),
        2713: _T("ldap_error", "ldap_protocol_error"),
        2714: _T("ldap_error", "ldap_invalid_dn_syntax"),
        2715: _T("ldap_error", "ldap_insufficient_access"),
        2716: _T("ldap_error", "ldap_insufficient_access"),
        2717: _T("ldap_error", "ldap_timelimit_exceeded"),
        2718: _T("ldap_error", "ldap_inappropriate_auth"),
        2719: _T("ldap_error", "ldap_smb2_enable_warning"),
        2721: _T("ldap_error", "ldap_confidentiality_required"),
        2799: _T("common", "error_system"),
        2800: _T("error", "error_unknown_desc"),
        2801: _T("error", "error_unknown_desc"),
        2900: _T("error", "error_unknown_desc"),
        2901: _T("error", "error_unknown_desc"),
        2902: _T("relayservice", "relayservice_err_network"),
        2903: _T("relayservice", "error_alias_server_internal"),
        2904: _T("relayservice", "relayservice_err_alias_in_use"),
        2905: _T("pkgmgr", "myds_error_account"),
        2906: _T("relayservice", "error_alias_used_in_your_own"),
        3000: _T("error", "error_unknown_desc"),
        3001: _T("error", "error_unknown_desc"),
        3002: _T("relayservice", "relayservice_err_resolv"),
        3003: _T("relayservice", "myds_server_internal_error"),
        3004: _T("error", "error_auth"),
        3005: _T("relayservice", "relayservice_err_alias_in_use"),
        3006: _T("relayservice", "myds_exceed_max_register_error"),
        3009: _T("error", "error_unknown_desc"),
        3010: _T("myds", "already_logged_in"),
        3013: _T("myds", "error_migrate_authen"),
        3106: _T("user", "no_such_user"),
        3107: _T("user", "error_nameused"),
        3108: _T("user", "error_nameused"),
        3109: _T("user", "error_disable_admin"),
        3110: _T("user", "error_too_much_user"),
        3111: _T("user", "homes_not_found"),
        3112: _T("common", "error_apply_occupied"),
        3113: _T("common", "error_occupied"),
        3114: _T("user", "error_nameused"),
        3115: _T("user", "user_cntrmvdefuser"),
        3116: _T("user", "user_set_fail"),
        3117: _T("user", "user_quota_set_fail"),
        3118: _T("common", "error_no_enough_space"),
        3119: _T("user", "error_home_is_moving"),
        3121: _T("common", "err_pass"),
        3191: _T("user", "user_file_open_fail"),
        3192: _T("user", "user_file_empty"),
        3193: _T("user", "user_file_not_utf8"),
        3194: _T("user", "user_upload_no_volume"),
        3202: _T("common", "error_occupied"),
        3204: _T("group", "failed_load_group"),
        3205: _T("group", "failed_load_group"),
        3206: _T("group", "error_nameused"),
        3207: _T("group", "error_nameused"),
        3208: _T("group", "error_badname"),
        3209: _T("group", "error_toomanygr"),
        3210: _T("group", "error_rmmember"),
        3221: _T("share", "error_too_many_acl_rules") + "(" + _WFT("acl_editor", "acl_rules_reach_limit_report").replace(/.*\//, "").trim().replace("_maxCount_", "200") + ")",
        3299: _T("common", "error_system"),
        3301: _T("share", "share_already_exist"),
        3302: _T("share", "share_acl_volume_not_support"),
        3303: _T("share", "error_encrypt_reserve"),
        3304: _T("share", "error_volume_not_found"),
        3305: _T("share", "error_badname"),
        3308: _T("common", "err_pass"),
        3309: _T("share", "error_toomanysh"),
        3313: _T("share", "error_volume_not_found"),
        3314: _T("share", "error_volume_read_only"),
        3319: _T("share", "error_nameused"),
        3320: _T("share", "share_space_not_enough"),
        3321: _T("share", "error_too_many_acl_rules") + "(" + _WFT("acl_editor", "acl_rules_reach_limit_report").replace(/.*\//, "").trim().replace("_maxCount_", "200") + ")",
        3322: _T("share", "mount_point_not_empty"),
        3323: _T("error", "error_mount_point_change_vol"),
        3324: _T("error", "error_mount_point_rename"),
        3326: _T("share", "error_key_file"),
        3327: _T("share", "share_conflict_on_new_volume"),
        3328: _T("share", "get_lock_failed"),
        3329: _T("share", "error_toomanysnapshot"),
        3330: _T("share", "share_snapshot_busy"),
        3332: _T("backup", "is_backing_up_restoring"),
        3334: _T("share", "error_mount_point_restore"),
        3335: _T("share", "share_cannot_move_fstype_not_support"),
        3336: _T("share", "share_cannot_move_replica_busy"),
        3337: _T("snapmgr", "snap_system_preserved"),
        3338: _T("share", "error_mounted_encrypt_restore"),
        3340: _T("snapmgr", "snap_restore_share_conf_err"),
        3341: _T("snapmgr", "err_quota_is_not_enough"),
        3400: _T("error", "error_error_system"),
        3401: _T("error", "error_error_system"),
        3402: _T("error", "error_error_system"),
        3403: _T("app_privilege", "error_no_such_user_or_group"),
        3500: _T("error", "error_invalid"),
        3501: _T("common", "error_badport"),
        3502: _T("ftp", "ftp_port_in_used"),
        3510: _T("error", "error_invalid"),
        3511: _T("app_port_alias", "err_port_dup"),
        3550: _T("volume", "volume_no_volumes"),
        3551: _T("error", "error_no_shared_folder"),
        3552: String.format(_T("volume", "volume_crashed_service_disable"), _T("common", "web_station")),
        3553: _T("volume", "volume_expanding_waiting"),
        3554: _T("error", "error_port_conflict"),
        3555: _T("common", "error_badport"),
        3603: _T("volume", "volume_share_volumeno"),
        3604: _T("error", "error_space_not_enough"),
        3605: _T("usb", "usb_printer_driver_fail"),
        3606: _T("login", "error_cantlogin"),
        3607: _T("common", "error_badip"),
        3608: _T("usb", "net_prntr_ip_exist_error"),
        3609: _T("usb", "net_prntr_ip_exist_unknown"),
        3610: _T("common", "error_demo"),
        3611: _T("usb", "net_prntr_name_exist_error"),
        3700: _T("error", "error_invalid"),
        3701: _T("status", "status_not_available"),
        3702: _T("error", "error_invalid"),
        3710: _T("status", "status_not_available"),
        3711: _T("error", "error_invalid"),
        3712: _T("cms", "fan_mode_not_supported"),
        3720: _T("status", "status_not_available"),
        3721: _T("error", "error_invalid"),
        3730: _T("status", "status_not_available"),
        3731: _T("error", "error_invalid"),
        3740: _T("status", "status_not_available"),
        3741: _T("error", "error_invalid"),
        3750: _T("status", "status_not_available"),
        3751: _T("error", "error_invalid"),
        3760: _T("status", "status_not_available"),
        3761: _T("error", "error_invalid"),
        3800: _T("error", "error_invalid"),
        3801: _T("error", "error_invalid"),
        4000: _T("error", "error_invalid"),
        4001: _T("error", "error_error_system"),
        4002: _T("dsmoption", "error_format"),
        4003: _T("dsmoption", "error_size"),
        4100: _T("error", "error_invalid"),
        4101: _T("error", "error_invalid"),
        4102: _T("app_port_alias", "err_alias_refused"),
        4103: _T("app_port_alias", "err_alias_used"),
        4104: _T("app_port_alias", "err_port_used"),
        4154: _T("app_port_alias", "err_fqdn_duplicated"),
        4156: _T("app_port_alias", "err_invalid_backend_host"),
        4300: _T("error", "error_error_system"),
        4301: _T("error", "error_error_system"),
        4302: _T("error", "error_error_system"),
        4303: _T("error", "error_invalid"),
        4304: _T("error", "error_error_system"),
        4305: _T("error", "error_error_system"),
        4306: _T("error", "error_error_system"),
        4307: _T("error", "error_error_system"),
        4308: _T("error", "error_error_system"),
        4309: _T("error", "error_invalid"),
        4310: _T("error", "error_error_system"),
        4311: _T("network", "interface_not_found"),
        4312: _T("tcpip", "tcpip_ip_used"),
        4313: _T("tcpip", "ipv6_ip_used"),
        4314: _T("tunnel", "tunnel_conn_fail"),
        4315: _T("tcpip", "ipv6_err_link_local"),
        4316: _T("network", "error_applying_network_setting"),
        4317: _T("common", "error_notmatch"),
        4319: _T("error", "error_error_system"),
        4320: _T("vpnc", "name_conflict"),
        4321: _T("service", "service_illegel_crt"),
        4322: _T("service", "service_illegel_key"),
        4323: _T("service", "service_ca_not_utf8"),
        4324: _T("service", "service_unknown_cipher"),
        4325: _T("vpnc", "l2tp_conflict"),
        4326: _T("vpnc", "vpns_conflict"),
        4327: _T("vpnc", "ovpnfile_invalid_format"),
        4340: _T("background_task", "task_processing"),
        4350: _T("tcpip", "ipv6_invalid_config"),
        4351: _T("tcpip", "ipv6_router_bad_lan_req"),
        4352: _T("tcpip", "ipv6_router_err_enable"),
        4353: _T("tcpip", "ipv6_router_err_disable"),
        4354: _T("tcpip", "ipv6_no_public_ip"),
        4370: _T("ovs", "ovs_not_support_bonding"),
        4371: _T("ovs", "ovs_not_support_vlan"),
        4372: _T("ovs", "ovs_not_support_bridge"),
        4500: _T("error", "error_error_system"),
        4501: _T("error", "error_error_system"),
        4502: _T("pkgmgr", "pkgmgr_space_not_ready"),
        4503: _T("error", "volume_creating"),
        4504: _T("pkgmgr", "error_sys_no_space"),
        4506: _T("pkgmgr", "noncancellable"),
        4520: _T("error", "error_space_not_enough"),
        4521: _T("pkgmgr", "pkgmgr_file_not_package"),
        4522: _T("pkgmgr", "broken_package"),
        4529: _T("pkgmgr", "pkgmgr_pkg_cannot_upgrade"),
        4530: _T("pkgmgr", "error_occupied"),
        4531: _T("pkgmgr", "pkgmgr_not_syno_publish"),
        4532: _T("pkgmgr", "pkgmgr_unknown_publisher"),
        4533: _T("pkgmgr", "pkgmgr_cert_expired"),
        4534: _T("pkgmgr", "pkgmgr_cert_revoked"),
        4535: _T("pkgmgr", "broken_package"),
        4540: _T("pkgmgr", "pkgmgr_file_install_failed"),
        4541: _T("pkgmgr", "upgrade_fail"),
        4542: _T("error", "error_error_system"),
        4543: _T("pkgmgr", "pkgmgr_file_not_package"),
        4544: _T("pkgmgr", "pkgmgr_pkg_install_already"),
        4545: _T("pkgmgr", "pkgmgr_pkg_not_available"),
        4548: _T("pkgmgr", "install_version_less_than_limit"),
        4549: _T("pkgmgr", "depend_cycle"),
        4570: _T("common", "error_invalid_serial"),
        4580: _T("pkgmgr", "pkgmgr_pkg_start_failed"),
        4581: _T("pkgmgr", "pkgmgr_pkg_stop_failed"),
        4590: _T("pkgmgr", "invalid_feed"),
        4591: _T("pkgmgr", "duplicate_feed"),
        4592: _T("pkgmgr", "duplicate_certificate"),
        4593: _T("pkgmgr", "duplicate_certificate_sys"),
        4594: _T("pkgmgr", "revoke_certificate"),
        4595: _T("service", "service_illegel_crt"),
        4600: _T("error", "error_error_system"),
        4601: _T("error", "error_error_system"),
        4602: _T("notification", "google_auth_failed"),
        4631: _T("error", "error_error_system"),
        4632: _T("error", "error_error_system"),
        4633: _T("error", "error_error_system"),
        4634: _T("error", "error_error_system"),
        4635: _T("error", "error_error_system"),
        4661: _T("pushservice", "error_update_ds_info"),
        4800: _T("error", "error_invalid"),
        4801: _T("error", "error_error_system"),
        4802: _T("error", "error_error_system"),
        4803: _T("error", "error_error_system"),
        4804: _T("error", "error_error_system"),
        4900: _T("error", "error_invalid"),
        4901: _T("error", "error_error_system"),
        4902: _T("user", "no_such_user"),
        4903: _T("report", "err_dest_share_not_exist"),
        4904: _T("error", "error_file_exist"),
        4905: _T("error", "error_space_not_enough"),
        5000: _T("error", "error_invalid"),
        5001: _T("error", "error_invalid"),
        5002: _T("error", "error_invalid"),
        5003: _T("error", "error_invalid"),
        5004: _T("error", "error_invalid"),
        5005: _T("syslog", "err_server_disconnected"),
        5006: _T("syslog", "service_ca_copy_failed"),
        5007: _T("syslog", "service_ca_copy_failed"),
        5008: _T("error", "error_invalid"),
        5009: _T("error", "error_port_conflict"),
        5010: _T("error", "error_invalid"),
        5011: _T("error", "error_invalid"),
        5012: _T("syslog", "err_name_conflict"),
        5100: _T("error", "error_invalid"),
        5101: _T("error", "error_invalid"),
        5102: _T("error", "error_invalid"),
        5103: _T("error", "error_invalid"),
        5104: _T("error", "error_invalid"),
        5105: _T("error", "error_invalid"),
        5106: _T("error", "error_invalid"),
        5202: _T("update", "error_apply_lock"),
        5203: _T("volume", "volume_busy_waiting"),
        5205: _T("update", "error_bad_dsm_version"),
        5206: _T("update", "update_notice"),
        5207: _T("update", "error_model"),
        5208: _T("update", "error_apply_lock"),
        5211: _T("update", "upload_err_no_space"),
        5213: _T("pkgmgr", "error_occupied"),
        5214: _T("update", "check_new_dsm_err"),
        5215: _T("error", "error_space_not_enough"),
        5216: _T("error", "error_fs_ro"),
        5217: _T("error", "error_dest_no_path"),
        5219: _T("update", "autoupdate_cancel_failed_running"),
        5220: _T("update", "autoupdate_cancel_failed_no_task"),
        5221: _T("update", "autoupdate_cancel_failed"),
        5222: _T("update", "error_verify_patch"),
        5223: _T("update", "error_updater_prehook_failed"),
        5300: _T("error", "error_invalid"),
        5301: _T("user", "no_such_user"),
        5510: _T("service", "service_illegel_crt"),
        5511: _T("service", "service_illegel_key"),
        5512: _T("service", "service_illegal_inter_crt"),
        5513: _T("service", "service_unknown_cypher"),
        5514: _T("service", "service_key_not_match"),
        5515: _T("service", "service_ca_copy_failed"),
        5516: _T("service", "service_ca_not_utf8"),
        5517: _T("certificate", "inter_and_crt_verify_error"),
        5518: _T("certificate", "not_support_dsa"),
        5519: _T("service", "service_illegal_csr"),
        5520: _T("backup", "general_backup_destination_no_response"),
        5521: _T("certificate", "err_connection"),
        5522: _T("certificate", "err_server_not_match"),
        5523: _T("certificate", "err_too_many_reg"),
        5524: _T("certificate", "err_too_many_req"),
        5525: _T("certificate", "err_mail"),
        5526: _T("s2s", "err_invalid_param_value"),
        5600: _T("error", "error_no_path"),
        5601: _T("file", "error_bad_file_content"),
        5602: _T("error", "error_error_system"),
        5603: _T("texteditor", "LoadFileFail"),
        5604: _T("texteditor", "SaveFileFail"),
        5605: _T("error", "error_privilege_not_enough"),
        5606: _T("texteditor", "CodepageConvertFail"),
        5607: _T("texteditor", "AskForceSave"),
        5608: _WFT("error", "error_encryption_long_path"),
        5609: _WFT("error", "error_long_path"),
        5610: _WFT("error", "error_quota_not_enough"),
        5611: _WFT("error", "error_space_not_enough"),
        5612: _WFT("error", "error_io"),
        5613: _WFT("error", "error_privilege_not_enough"),
        5614: _WFT("error", "error_fs_ro"),
        5615: _WFT("error", "error_file_exist"),
        5616: _WFT("error", "error_no_path"),
        5617: _WFT("error", "error_dest_no_path"),
        5618: _WFT("error", "error_testjoin"),
        5619: _WFT("error", "error_reserved_name"),
        5620: _WFT("error", "error_fat_reserved_name"),
        5621: _T("texteditor", "exceed_load_max"),
        5703: _T("time", "ntp_service_disable_warning"),
        5800: _T("error", "error_invalid"),
        5801: _T("share", "no_such_share"),
        5901: _T("error", "error_subject"),
        5902: _T("firewall", "firewall_vpnpassthrough_restore_failed"),
        5903: _T("firewall", "firewall_vpnpassthrough_specific_platform"),
        6000: _T("error", "error_error_system"),
        6001: _T("error", "error_error_system"),
        6002: _T("error", "error_error_system"),
        6003: _T("error", "error_error_system"),
        6004: _T("common", "loadsetting_fail"),
        6005: _T("error", "error_subject"),
        6006: _T("error", "error_service_start_failed"),
        6007: _T("error", "error_service_stop_failed"),
        6008: _T("error", "error_service_start_failed"),
        6009: _T("firewall", "firewall_save_failed"),
        6010: _T("common", "error_badip"),
        6011: _T("common", "error_badip"),
        6012: _T("common", "error_badip"),
        6013: _T("share", "no_such_share"),
        6014: _T("cms", "cms_no_volumes"),
        6200: _T("error", "error_error_system"),
        6201: _WFT("error", "error_acl_volume_not_support"),
        6202: _WFT("error", "error_fat_privilege"),
        6203: _WFT("error", "error_remote_privilege"),
        6204: _WFT("error", "error_fs_ro"),
        6205: _WFT("error", "error_privilege_not_enough"),
        6206: _WFT("error", "error_no_path"),
        6207: _WFT("error", "error_no_path"),
        6208: _WFT("error", "error_testjoin"),
        6209: _WFT("error", "error_privilege_not_enough"),
        6210: _WFT("acl_editor", "admin_cannot_set_acl_perm"),
        6211: _WFT("acl_editor", "error_invalid_user_or_group"),
        6212: _WFT("error", "error_acl_mp_not_support"),
        6213: _WFT("acl_editor", "quota_exceeded"),
        6703: _T("error", "error_port_conflict"),
        6704: _T("error", "error_port_conflict"),
        6705: _T("user", "no_such_user"),
        6706: _T("user", "error_nameused"),
        6708: _T("share", "error_volume_not_found"),
        6709: _T("netbackup", "err_create_service_share")
    };
    return a
};
SYNO.API.AssignErrorStr = function() {
    SYNO.API.Errors = SYNO.API.GetErrors()
};
SYNO.API.AssignErrorStr();
SYNO.API.Erros = function() {
    if (Ext.isIE8) {
        return SYNO.API.Errors
    }
    var c = {},
        b = function(d) {
            Object.defineProperty(c, d, {
                get: function() {
                    SYNO.Debug.error("SYNO.API.Erros is deprecated (typo), please use SYNO.API.Errors instead.");
                    return SYNO.API.Errors[d]
                },
                configurable: false
            })
        };
    for (var a in SYNO.API.Errors) {
        if (SYNO.API.Errors.hasOwnProperty(a)) {
            b(a)
        }
    }
    return c
}();
Ext.namespace("SYNO.SDS.Utils");
(function() {
    var h = "width: auto;";
    var g = "display: inline;";
    var e = "text-align: left;";
    var d = "overflow: hidden;";
    var b = d + g + e;
    var a = h + "margin-right: 5px;" + g + e;
    var i = b + "width: 0px; visibility: hidden;";
    var c = function(j, k) {
        if (undefined === k) {
            return String.format("margin-left: {0}px;", j)
        } else {
            return String.format("width: {0}px; margin-left: {1}px", k - j, j)
        }
    };
    var f = 167;
    Ext.apply(SYNO.SDS.Utils, {
        labelStyleL0: b + c(0, f),
        labelStyleL1: b + c(Ext.isIE ? 19 : 17, f),
        labelStyleL2: b + c(Ext.isIE ? 36 : 34, f),
        labelStyleL0Auto: a,
        labelStyleL1Auto: a + c(Ext.isIE ? 19 : 17),
        labelStyleL2Auto: a + c(Ext.isIE ? 36 : 34),
        labelStyleL0Hidden: i + c(0),
        labelStyleL1Hidden: i + c(Ext.isIE ? 16 : 14)
    })
})();
SYNO.SDS.Utils.FieldFind = function(b, a) {
    var c = b.findField(a);
    if (c === null) {
        c = Ext.getCmp(a)
    }
    return c
};
SYNO.SDS.Utils.DescribeGroup = function(a, d) {
    var c = function(e, g) {
            var f = e.getAriaEl().dom.getAttribute("aria-describedby") || "";
            f.replace(g.getAriaEl().id, "");
            e.getAriaEl().setARIA({
                describedby: f + " " + g.getAriaEl().id
            });
            g.tabIndex = -1;
            if (g instanceof SYNO.ux.DisplayField) {
                g.customTabIdx = -1
            }
            g.getAriaEl().set({
                tabIndex: -1
            })
        },
        b = function(e, f) {
            if (f.rendered) {
                c(e, f)
            } else {
                e.mon(f, "afterrender", c.createDelegate(e, [e, f]))
            }
        };
    if (Ext.isArray(d)) {
        Ext.each(d, function(e) {
            SYNO.SDS.Utils.DescribeGroup(a, e)
        });
        return
    } else {
        if (a.rendered) {
            b(a, d)
        } else {
            a.mon(a, "afterrender", b.createDelegate(a, [a, d]))
        }
    }
};
SYNO.SDS.Utils.EnableRadioGroup = Ext.extend(Object, {
    constructor: function(e, d, a) {
        this.form = e;
        this.members = a;
        var g = SYNO.SDS.Utils.getRadioGroup(e, d);
        for (var c = 0; c < g.length; c++) {
            var b = g[c];
            var f = b.el.dom.value;
            if (f in a) {
                b.mon(b, "check", this.onRadioCheck, this);
                b.mon(b, "enable", this.onRadioEnable, this, {
                    delay: 50
                });
                b.mon(b, "disable", this.onRadioEnable, this, {
                    delay: 50
                })
            }
        }
    },
    onRadioEnable: function(c) {
        var e = c.getRawValue();
        var a = this.members[e];
        var d = c.getValue();
        var b = d && (!c.disabled);
        Ext.each(a, function(g) {
            var h = SYNO.SDS.Utils.FieldFind(this.form, g);
            h.setDisabled(!b);
            if (Ext.isFunction(h.clearInvalid)) {
                h.clearInvalid()
            }
        }, this)
    },
    onRadioCheck: function(b, c) {
        var d = b.getRawValue();
        var a = this.members[d];
        Ext.each(a, function(e) {
            var g = SYNO.SDS.Utils.FieldFind(this.form, e);
            g.setDisabled(!c);
            if (Ext.isFunction(g.clearInvalid)) {
                g.clearInvalid()
            }
        }, this)
    }
});
SYNO.SDS.Utils.EnableCheckGroup = Ext.extend(Object, {
    constructor: function(c, b, f, e, a) {
        var d = SYNO.SDS.Utils.FieldFind(c, b);
        e = typeof(e) != "undefined" ? e : [];
        a = Ext.isDefined(a) ? a : {};
        this.enable_fields = f;
        this.disable_fields = e;
        this.config = a;
        this.form = c;
        d.mon(d, "check", this.checkHandler, this);
        d.mon(d, "enable", this.enableHandler, this, {
            delay: 50
        });
        d.mon(d, "disable", this.enableHandler, this, {
            delay: 50
        });
        this.checkHandler(d, d.getValue())
    },
    setFieldStatus: function(d, g, c, a) {
        var f, e, b;
        if (g.inputType == "radio") {
            f = SYNO.SDS.Utils.getRadioGroup(d, g.getName());
            for (b = 0; b < f.length; b++) {
                if (a) {
                    e = c ? f[b].disable() : f[b].enable()
                } else {
                    e = c ? f[b].enable() : f[b].disable()
                }
                if (Ext.isFunction(f[b].clearInvalid)) {
                    f[b].clearInvalid()
                }
            }
        } else {
            if (a) {
                e = c ? g.disable() : g.enable()
            } else {
                e = c ? g.enable() : g.disable()
            }
            if (Ext.isFunction(g.clearInvalid)) {
                g.clearInvalid()
            }
        }
    },
    enableField: function(b, c, a) {
        this.setFieldStatus(b, c, a, false)
    },
    IsNeedDisableGroup: function(a) {
        if (true === this.config.disable_group && true === a) {
            return true
        }
        return false
    },
    checkHandler: function(c, b) {
        var a, d;
        var e = this.IsNeedDisableGroup(c.disabled);
        for (a = 0; a < this.enable_fields.length; a++) {
            d = SYNO.SDS.Utils.FieldFind(this.form, this.enable_fields[a]);
            if (e) {
                this.enableField(this.form, d, false)
            } else {
                this.setFieldStatus(this.form, d, b, false)
            }
        }
        for (a = 0; a < this.disable_fields.length; a++) {
            d = SYNO.SDS.Utils.FieldFind(this.form, this.disable_fields[a]);
            if (e) {
                this.enableField(this.form, d, false)
            } else {
                this.setFieldStatus(this.form, d, b, true)
            }
        }
    },
    enableHandler: function(c) {
        var b, d;
        var a = (c.disabled === false && c.getRealValue() === true);
        var e = this.IsNeedDisableGroup(c.disabled);
        for (b = 0; b < this.enable_fields.length; b++) {
            d = SYNO.SDS.Utils.FieldFind(this.form, this.enable_fields[b]);
            if (e) {
                this.enableField(this.form, d, false)
            } else {
                this.setFieldStatus(this.form, d, a, false)
            }
        }
        for (b = 0; b < this.disable_fields.length; b++) {
            d = SYNO.SDS.Utils.FieldFind(this.form, this.disable_fields[b]);
            if (e) {
                this.enableField(this.form, d, false)
            } else {
                this.setFieldStatus(this.form, d, a, true)
            }
        }
    }
});
SYNO.SDS.Utils.DisplayField = function(c, a, g) {
    var f = c.findField(a);
    if (f && f.getEl()) {
        var b = f.getEl().findParent("div[class~=x-form-item]", c.el, true);
        if (b) {
            var e = b.isDisplayed();
            b.setDisplayed(g);
            if (e === false && g === true && f.msgTarget == "under") {
                var d = f.getEl().findParent(".x-form-element", 5, true);
                var h = d.child("div[class~=x-form-invalid-msg]");
                if (h) {
                    h.setWidth(d.getWidth(true) - 20)
                }
            }
        }
    }
};
SYNO.SDS.Utils.getRadioGroup = function(c, b) {
    var e = [];
    var d = c.el.query("input[name=" + b + "]");
    for (var a = 0; a < d.length; a++) {
        e.push(Ext.getCmp(d[a].id))
    }
    return e
};
SYNO.SDS.Utils.SymbolMap = {
    "+": "plus",
    "<": "smaller",
    ">": "greater",
    ",": "comma",
    ":": "colon",
    ";": "semicolon",
    "-": "minus",
    "~": "tilt"
};
SYNO.SDS.Utils.ConvertSingleSymbolToString = function(f, d, c) {
    var a = "g",
        b = "\\" + d,
        e = (c) ? new RegExp(b, a) : new RegExp(b);
    f = f.replace(e, _T("common", SYNO.SDS.Utils.SymbolMap[d] + "_str"));
    return f
};
SYNO.SDS.Utils.ConvertSymbolsToString = function(f) {
    var b = ["+", "<", ">", ",", ":", ";"],
        a = "g",
        d, c, e;
    for (c = 0; c < b.length; c++) {
        d = "\\" + b[c];
        e = new RegExp(d, a);
        f = f.replace(e, _T("common", SYNO.SDS.Utils.SymbolMap[b[c]] + "_str"))
    }
    return f
};
SYNO.SDS.Utils.isBrowserReservedPort = function(e, a) {
    var c = [1, 7, 9, 11, 13, 15, 17, 19, 20, 21, 22, 23, 25, 37, 42, 43, 53, 77, 79, 87, 95, 101, 102, 103, 104, 109, 110, 111, 113, 115, 117, 119, 123, 135, 139, 143, 179, 389, 465, 512, 513, 514, 515, 526, 530, 531, 532, 540, 556, 563, 587, 601, 636, 993, 995, 2049, 3659, 4045, 6000, 6665, 6666, 6667, 6668, 6669];
    var b = 0;
    if (e > a) {
        b = e;
        e = a;
        a = b
    }
    for (var d = 0; d < c.length; d++) {
        if (e <= c[d] && a >= c[d]) {
            return true
        }
    }
    return false
};
SYNO.SDS.Utils.isReservedPort = function(m, c, g) {
    var d = [20, 21, 22, 23, 25, 69, 80, 110, 111, 137, 138, 139, 143, 161, 162, 199, 443, 445, 514, 515, 543, 548, 587, 631, 873, 892, 914, 915, 916, 993, 995, 2049, 3260, 3306, 3493, 4662, 4672, 5000, 5001, 5005, 5006, 5335, 5432, 6281, 7000, 7001, 9000, 9002, 9900, 9901, 9997, 9998, 9999, 50001, 50002];
    var e = [];
    var f = [];
    var n = 0;
    if (c > g) {
        n = c;
        c = g;
        g = n
    }
    switch (m) {
        case "ftp":
            f = [21];
            break;
        case "ssh":
            f = [22];
            break;
        case "http":
            f = [80];
            break;
        case "https":
            f = [443];
            break;
        case "www":
            f = [80, 443];
            break;
        case "webman":
        case "dsm":
            f = [5000, 5001];
            break;
        case "cfs":
            f = [7000, 7001];
            break;
        case "webdav":
            f = [5005, 5006];
            break;
        case "custsurveillance":
            f = [9900, 9901];
            break;
        case "emule":
            f = [4662, 4672];
            break;
        case "syslog":
            f = [514];
            break;
        default:
            break
    }
    for (var l = 0; l < d.length; l++) {
        var k = false;
        for (var h = 0; h < f.length; h++) {
            if (d[l] == f[h]) {
                k = true;
                break
            }
        }
        if (!k) {
            e.push(d[l])
        }
    }
    for (l = 0; l < e.length; l++) {
        if (c <= e[l] && g >= e[l]) {
            return true
        }
    }
    if ("ftp" != m) {
        var b = parseInt(_D("ftp_pasv_def_min_port", "55536"), 10);
        var a = parseInt(_D("ftp_pasv_def_max_port", "55663"), 10);
        if (c <= a && a <= g) {
            return true
        }
        if (b <= g && g <= a) {
            return true
        }
    }
    if ("emule" != m) {
        if (c <= 4662 && 4662 <= g) {
            return true
        }
        if (c <= 4672 && 4672 <= g) {
            return true
        }
    }
    if ("surveillance" != m) {
        if (c <= 55863 && 55863 <= g) {
            return true
        }
        if (55736 <= g && g <= 55863) {
            return true
        }
    }
    if ("custsurveillance" != m) {
        if (c <= 9900 && 9900 <= g) {
            return true
        }
        if (c <= 9901 && 9901 <= g) {
            return true
        }
    }
    if ("cfs" != m) {
        if (c <= 7000 && 7000 <= g) {
            return true
        }
        if (c <= 7001 && 7001 <= g) {
            return true
        }
    }
    if ("webdav" != m) {
        if (c <= 5005 && 5005 <= g) {
            return true
        }
        if (c <= 5006 && 5006 <= g) {
            return true
        }
    }
    if (c <= 55910 && 55910 <= g) {
        return true
    }
    if (55900 <= g && g <= 55910) {
        return true
    }
    if (c <= 3259 && 3259 <= g) {
        return true
    }
    if (3240 <= g && g <= 3259) {
        return true
    }
    return false
};
SYNO.SDS.Utils.getTimeZoneStore = function() {
    if (SYNO.SDS.Utils._timezoneStore) {
        return SYNO.SDS.Utils._timezoneStore
    }
    var a = SYNO.SDS.Utils.getTimeZoneData();
    var c = [];
    Ext.each(a, function(d) {
        c.push([d.value, d.offset, d.display])
    });
    var b = new Ext.data.SimpleStore({
        id: 0,
        fields: ["value", "offset", "display"],
        data: c
    });
    SYNO.SDS.Utils._timezoneStore = b;
    return b
};
SYNO.SDS.Utils.getTimeZoneData = function() {
    if (SYNO.SDS.Utils._timezoneData) {
        return SYNO.SDS.Utils._timezoneData
    }
    var b = [
        ["Midway", -660],
        ["Hawaii", -600],
        ["Alaska", -540],
        ["Pacific", -480],
        ["Arizona", -420],
        ["Chihuahua", -420],
        ["Mountain", -420],
        ["Guatemala", -360],
        ["Central", -360],
        ["MexicoCity", -360],
        ["Saskatchewan", -360],
        ["Bogota", -300],
        ["Eastern", -300],
        ["EastIndiana", -300],
        ["Caracas", -270],
        ["Atlantic", -240],
        ["La_Paz", -240],
        ["Manaus", -240],
        ["Santiago", -240],
        ["Newfoundland", -210],
        ["Brasilia", -180],
        ["BuenosAires", -180],
        ["Godthab", -180],
        ["Montevideo", -180],
        ["South_Georgia", -120],
        ["Azores", -60],
        ["CapeVerde", -60],
        ["Casablanc", 0],
        ["Dublin", 0],
        ["Monrovia", 0],
        ["Amsterdam", 60],
        ["Belgrade", 60],
        ["Brussels", 60],
        ["Sarajevo", 60],
        ["WAT", 60],
        ["Windhoek", 60],
        ["Amman", 120],
        ["Athens", 120],
        ["Beirut", 120],
        ["Egypt", 120],
        ["Harare", 120],
        ["Helsinki", 120],
        ["Israel", 120],
        ["CAT", 120],
        ["EET", 120],
        ["Minsk", 180],
        ["Baghdad", 180],
        ["Kuwait", 180],
        ["Nairobi", 180],
        ["Moscow", 180],
        ["Tehran", 210],
        ["Muscat", 240],
        ["Baku", 240],
        ["Tbilisi", 240],
        ["Yerevan", 240],
        ["Kabul", 270],
        ["Karachi", 300],
        ["Ekaterinburg", 300],
        ["Calcutta", 330],
        ["Katmandu", 345],
        ["Almaty", 360],
        ["Dhaka", 360],
        ["Novosibirsk", 360],
        ["Rangoon", 390],
        ["Jakarta", 420],
        ["Krasnoyarsk", 420],
        ["Taipei", 480],
        ["Beijing", 480],
        ["Ulaanbaatar", 480],
        ["Singapore", 480],
        ["Perth", 480],
        ["Irkutsk", 480],
        ["Tokyo", 540],
        ["Seoul", 540],
        ["Yakutsk", 540],
        ["Adelaide", 570],
        ["Darwin", 570],
        ["Brisbane", 600],
        ["Melbourne", 600],
        ["Guam", 600],
        ["Tasmania", 600],
        ["Vladivostok", 600],
        ["Magadan", 600],
        ["Noumea", 660],
        ["Auckland", 720],
        ["Fiji", 720]
    ];

    function c(e) {
        var f = "";
        var d = Math.floor(Math.abs(e));
        if (d < 10) {
            f += "0"
        }
        return (f += d.toString())
    }
    var a = [];
    Ext.each(b, function(f) {
        var e = f[1];
        var d;
        if (e === 0) {
            d = "(GMT)"
        } else {
            d = String.format("(GMT{0}{1}:{2})", (e > 0) ? "+" : "-", c(e / 60), c(e % 60))
        }
        a.push({
            value: f[0],
            offset: f[1],
            display: _T("timezone", f[0]).replace(/\(GMT.{0,6}\)/g, d)
        })
    });
    SYNO.SDS.Utils._timezoneData = a;
    return a
};
SYNO.SDS.Utils.createTimeItemStore = function(e) {
    var a = [];
    var c = {
        hour: 24,
        min: 60,
        sec: 60
    };
    if (e in c) {
        for (var d = 0; d < c[e]; d++) {
            a.push([d, String.leftPad(String(d), 2, "0")])
        }
        var b = new Ext.data.SimpleStore({
            id: 0,
            fields: ["value", "display"],
            data: a
        });
        return b
    }
    return null
};
SYNO.SDS.Utils.GetLocalizedString = function(b, d) {
    if (!b) {
        return ""
    }
    var e, a, c = b.split(":", 3);
    if (2 < c.length) {
        return b
    }
    e = c[0];
    a = c[1];
    var f;
    if (d) {
        if (!Ext.isArray(d)) {
            d = [d]
        }
        Ext.each(d, function(g) {
            f = _TT(g, e, a);
            if (!Ext.isEmpty(f)) {
                return false
            }
        })
    }
    return f || _T(e, a) || c[2] || b
};
SYNO.SDS.Utils.CapacityRender = function(c, d) {
    var b = _T("common", "size_mb");
    var e = c;
    if (e < 0) {
        e = 0
    }
    if (e >= 1024) {
        e = e / 1024;
        b = _T("common", "size_gb")
    }
    if (e >= 1024) {
        e = e / 1024;
        b = _T("common", "size_tb")
    }
    var a = d || 2;
    return e.toFixed(a) + " " + b
};
Ext.override(Ext.form.Radio, {
    setValue: function(a) {
        if (typeof a == "boolean") {
            Ext.form.Radio.superclass.setValue.call(this, a)
        } else {
            if (this.rendered) {
                var b = this.getCheckEl().select("input[name=" + this.el.dom.name + "]");
                b.each(function(d) {
                    var c = Ext.getCmp(d.dom.id);
                    c.setValue((a === d.dom.value));
                    c.fireEvent("check", c, c.checked)
                }, this)
            }
        }
        return this
    },
    onClick: function() {
        if (this.el.dom.checked != this.checked) {
            this.setValue(this.el.dom.value)
        }
    }
});
SYNO.SDS.Utils.Checkbox = Ext.extend(Ext.form.Checkbox, {
    activeCls: "",
    isMouseOn: false,
    boxEl: null,
    clsStates: {
        check: {
            normal: "check",
            active: "checkActive"
        },
        nocheck: {
            normal: "nocheck",
            active: "nocheckActive"
        }
    },
    initComponent: function() {
        SYNO.SDS.Utils.Checkbox.superclass.initComponent.apply(this, arguments)
    },
    initEvents: function() {
        SYNO.SDS.Utils.Checkbox.superclass.initEvents.call(this);
        this.boxEl = this.el.next();
        this.mon(this, {
            scope: this,
            check: this.onChecked,
            focus: this.onFocus,
            blur: this.onBlur
        });
        this.mon(this.container, {
            scope: this,
            mouseenter: this.mouseOn,
            mouseleave: this.mouseOut
        })
    },
    mouseOn: function() {
        this.isMouseOn = true;
        this.updateStates(this.isMouseOn)
    },
    mouseOut: function() {
        this.isMouseOn = false;
        this.updateStates(this.isMouseOn)
    },
    onBlur: function() {
        this.updateStates(false)
    },
    onFocus: function() {
        this.updateStates(true)
    },
    onChecked: function() {
        this.updateStates(this.isMouseOn)
    },
    updateStates: function(b) {
        if (!this.boxEl) {
            return
        }
        var a = this.clsStates[this.getValue() ? "check" : "nocheck"][b ? "active" : "normal"];
        this.boxEl.removeClass(this.activeCls);
        this.boxEl.addClass(a);
        this.activeCls = a
    }
});
SYNO.SDS.Utils.SearchField = Ext.extend(SYNO.ux.FleXcroll.ComboBox, {
    constructor: function(a) {
        a.listeners = Ext.applyIf(a.listeners || {}, {
            render: {
                fn: function(b) {
                    b.trigger.hide();
                    b.trigger.removeClass("syno-ux-combobox-trigger")
                }
            }
        });
        SYNO.SDS.Utils.SearchField.superclass.constructor.call(this, Ext.apply({
            title: _T("common", "search_results"),
            loadingText: _T("common", "searching"),
            emptyText: _T("user", "search_user"),
            queryParam: "query",
            queryDelay: 500,
            listEmptyText: _T("search", "no_search_result"),
            grow: true,
            width: 200,
            listWidth: 360,
            maxHeight: 360,
            minChars: 1,
            autoSelect: false,
            typeAhead: false,
            editable: true,
            mode: "remote",
            listAlign: ["tr-br?", [16, 0]],
            ctCls: "syno-textfilter",
            cls: "syno-textfilter-text",
            listClass: "sds-search-result",
            triggerConfig: {
                tag: "button",
                "aria-label": _T("common", "clear_input"),
                cls: "x-form-trigger syno-textfilter-trigger"
            },
            store: new SYNO.API.JsonStore({
                autoDestroy: true,
                appWindow: this.findAppWindow() || false,
                api: "SYNO.Core.UISearch",
                method: "uisearch",
                version: 1,
                root: "items",
                id: "_random",
                fields: ["id", "title", "owner", "topic", "type", {
                    name: "desc",
                    convert: function(c, b) {
                        return String.format(c, _D("product"))
                    }
                }],
                baseParams: {
                    lang: _S("lang"),
                    type: a.type || "all"
                }
            })
        }, a))
    },
    initEvents: function() {
        SYNO.SDS.Utils.SearchField.superclass.initEvents.apply(this, arguments);
        this.keyNav.disable();
        this.mon(this.el, "click", this.onClick, this);
        this.mon(this.getStore(), "load", this.onStoreLoad, this);
        this.mon(this.el, "focus", this.setListAria, this, {
            single: true
        });
        this.enterNav = new Ext.KeyNav(this.el, {
            enter: this.focusResult,
            scope: this
        })
    },
    setListAria: function() {
        this.innerList.set({
            role: "listbox",
            tabindex: 0,
            "aria-label": _T("common", "search_results")
        });
        this.setListKeyNav()
    },
    setListKeyNav: function() {
        this.listKeyNav = new Ext.KeyNav(this.innerList, {
            up: function(a) {
                this.inKeyMode = true;
                this.selectPrev()
            },
            down: function(a) {
                if (!this.isExpanded()) {
                    this.onTriggerClick()
                } else {
                    this.inKeyMode = true;
                    this.selectNext()
                }
            },
            enter: function(a) {
                this.onViewClick(false)
            },
            esc: function(a) {
                this.collapse();
                this.getAriaEl().focus()
            },
            tab: function(a) {
                this.collapse();
                this.getAriaEl().focus()
            },
            scope: this,
            doRelay: function(c, b, a) {
                if (a == "down" || this.scope.isExpanded()) {
                    var d = Ext.KeyNav.prototype.doRelay.apply(this, arguments);
                    if (((Ext.isIE9 && Ext.isStrict) || !Ext.isIE) && Ext.EventManager.useKeydown) {
                        this.scope.fireKey(c)
                    }
                    return d
                }
                return true
            },
            forceKeyDown: true,
            defaultEventAction: "stopEvent"
        })
    },
    focusResult: function() {
        var a = this.getStore();
        if (a.getCount() === 0) {
            this.innerList.set({
                tabindex: 0,
                "aria-label": _T("search", "no_search_result")
            });
            this.innerList.dom.removeAttribute("role")
        } else {
            this.innerList.set({
                role: "listbox",
                tabindex: 0,
                "aria-label": _T("common", "search_results")
            })
        }
        this.innerList.focus()
    },
    onClick: function() {
        if (this.getValue().length >= this.minChars) {
            if (!this.hasFocus) {
                this.blur();
                this.focus()
            }
            this.expand()
        }
    },
    onStoreLoad: function(a) {
        function b(c) {
            var d = "";
            switch (c.get("type")) {
                case "app":
                    d = SYNO.SDS.Utils.ParseSearchID(c.get("id")).className;
                    if (SYNO.SDS.Utils.isHiddenControlPanelModule(c.get("id"))) {
                        return false
                    }
                    break;
                case "help":
                    d = "SYNO.SDS.HelpBrowser.Application";
                    break;
                default:
                    return true
            }
            return SYNO.SDS.StatusNotifier.isAppEnabled(d)
        }
        a.filterBy(b)
    },
    onSelect: function(a, b) {
        if (this.fireEvent("beforeselect", this, a, b) !== false) {
            this.collapse();
            this.fireEvent("select", this, a, b)
        }
    },
    select: function(a, d) {
        this.selectedIndex = a;
        this.view.select(a);
        if (d !== false) {
            var b = this.view.getNode(a);
            if (b) {
                this.innerList.scrollChildIntoView(b, false)
            }
        }
        var c = this.view.getSelectedNodes()[0];
        this.innerList.set({
            "aria-activedescendant": c.id
        })
    },
    onViewOver: function(d, b) {
        if (this.inKeyMode) {
            return
        }
        var c = this.view.findItemFromChild(b);
        if (c) {
            var a = this.view.indexOf(c);
            this.select(a, false)
        } else {
            this.view.clearSelections()
        }
    },
    onViewClick: function(b) {
        var a = this.view.getSelectedIndexes()[0],
            c = this.store,
            d = c.getAt(a);
        if (d) {
            this.onSelect(d, a);
            this.view.clearSelections()
        }
        if (b !== false) {
            this.el.focus()
        }
    },
    onKeyUp: function(c) {
        var a = c.getKey(),
            b = this.getValue();
        this.trigger.setVisible(!!b);
        if (b.length < this.minChars) {
            this.collapse()
        } else {
            if (b === this.lastQuery && c.ENTER === a) {
                this.expand()
            } else {
                if (this.editable !== false && this.readOnly !== true && (c.ENTER === a || c.BACKSPACE === a || c.DELETE === a || !c.isSpecialKey())) {
                    this.lastKey = a;
                    this.dqTask.delay(this.queryDelay)
                }
            }
        }
    },
    preFocus: function() {
        var a = this.el;
        if (this.emptyText) {
            if (a.dom.value === this.emptyText && this.el.hasClass(this.emptyClass)) {
                this.setRawValue("")
            }
            a.removeClass(this.emptyClass)
        }
        if (this.selectOnFocus) {
            a.dom.select()
        }
    },
    initQuery: function() {
        this.view.clearSelections();
        this.doQuery(this.getRawValue())
    },
    getRawValue: function() {
        var a = this.rendered ? this.el.getValue() : Ext.value(this.value, "");
        if (a === this.emptyText && this.el.hasClass(this.emptyClass)) {
            a = ""
        }
        return a
    },
    getValue: function() {
        if (!this.rendered) {
            return this.value
        }
        var a = this.el.getValue();
        if ((a === this.emptyText && this.el.hasClass(this.emptyClass)) || a === undefined) {
            a = ""
        }
        return a
    },
    onTriggerClick: function() {
        if (this.getValue()) {
            this.setValue("");
            this.trigger.hide();
            this.collapse()
        }
        this.focus(false, 200)
    }
});
SYNO.SDS.Utils.InnerGroupingView = Ext.extend(Ext.grid.GroupingView, {
    onLayout: function() {
        SYNO.SDS.Utils.InnerGroupingView.superclass.onLayout.call(this);
        Ext.grid.GroupingView.superclass.onLayout.call(this);
        var a = this.getGroups();
        if (a) {
            Ext.each(a, function(b) {
                var c = Ext.get(b.id).child(".x-grid-group-hd");
                if (c) {
                    c.on("mouseover", function() {
                        c.addClass("syno-ux-grid-group-hd-over")
                    });
                    c.on("mouseout", function() {
                        c.removeClass("syno-ux-grid-group-hd-over")
                    });
                    c.on("mousedown", function() {
                        c.addClass("syno-ux-grid-group-hd-click")
                    });
                    c.on("mouseup", function() {
                        c.removeClass("syno-ux-grid-group-hd-click")
                    })
                }
            })
        }
    }
});
SYNO.SDS.DefineGridView("SYNO.SDS.Utils.GroupingView", "SYNO.SDS.Utils.InnerGroupingView");
Ext.override(SYNO.SDS.Utils.GroupingView, {
    toggleGroup: function(e, c) {
        var d = this;
        var a = Ext.get(e),
            f = Ext.util.Format.htmlEncode(a.id);
        c = Ext.isDefined(c) ? c : a.hasClass("x-grid-group-collapsed");
        if (d.state[f] !== c) {
            if (d.cancelEditOnToggle !== false) {
                d.grid.stopEditing(true)
            }
            d.state[f] = c;
            var b = a.child(".x-grid-group-body");
            if (b) {
                b[c ? "slideIn" : "slideOut"]("t", {
                    duration: 0.25,
                    block: true,
                    scope: d,
                    callback: this.afterSlideEffect.createDelegate(this, [e, c])
                })
            } else {
                a[c ? "removeClass" : "addClass"]("x-grid-group-collapsed");
                this.onLayout.call(this);
                this.updateScroller()
            }
        }
    },
    afterSlideEffect: function(d, c) {
        var a = Ext.get(d);
        var b = a.child(".x-grid-group-body");
        b.removeClass("x-grid3-row-over");
        a[c ? "removeClass" : "addClass"]("x-grid-group-collapsed");
        b[c ? "show" : "hide"]("display");
        this.onLayout.call(this);
        this.updateScroller()
    }
});
SYNO.SDS.Utils.StateGridPanel = Ext.extend(SYNO.ux.GridPanel, {
    constructor: function(a) {
        var b = {};
        if (a.stateId) {
            this.stateId = a.stateId;
            b = {
                stateEvents: ["columnmove", "columnresize", "sortchange"],
                stateful: true,
                saveState: (function() {
                    var d = this.getState();
                    if (this.findAppWindow() && this.findAppWindow().appInstance) {
                        this.findAppWindow().appInstance.setUserSettings(this.stateId, d)
                    }
                }).createDelegate(this)
            }
        }
        Ext.apply(b, a);
        SYNO.SDS.Utils.StateGridPanel.superclass.constructor.call(this, b);
        if (a.stateId) {
            var c = function(d) {
                if (this.findAppWindow() && this.findAppWindow().appInstance) {
                    var f = this.findAppWindow().appInstance.getUserSettings(this.stateId);
                    if (f) {
                        try {
                            d.applyState(f)
                        } catch (g) {}
                    }
                }
            };
            this.mon(this, "beforerender", c, this, this);
            this.mon(this, "reconfigure", c, this, this)
        }
    }
});
SYNO.SDS.Utils.GridView = Ext.extend(Ext.grid.GridView, {
    onLayout: function() {}
});
SYNO.SDS.Utils.ParseSearchID = function(c) {
    var b = c.split("?", 2),
        a = {
            className: "",
            params: {}
        };
    a.className = b[0];
    if (2 === b.length) {
        a.params = Ext.urlDecode(b[1])
    }
    return a
};
SYNO.SDS.Utils.isControlPanelModule = function(b, a) {
    if (a === "SYNO.SDS.ControlPanel.Instance" && b !== "SYNO.SDS.ControlPanel.Instance" && !SYNO.SDS.Utils.isHiddenControlPanelModule(b)) {
        return true
    }
    return false
};
SYNO.SDS.Utils.isHiddenControlPanelModule = function(b) {
    var a = SYNO.SDS.Utils.ParseSearchID(b);
    if (a.className === "SYNO.SDS.ControlPanel.Instance") {
        if (a.params && a.params.fn) {
            if (Ext.isDefined(SYNO.SDS.AppPrivilege[a.params.fn]) && false === SYNO.SDS.AppPrivilege[a.params.fn]) {
                return true
            }
        }
    }
    return false
};
SYNO.SDS.Utils.GetAppIcon = function(c, b) {
    if (c in SYNO.SDS.Config.FnMap) {
        var a = SYNO.SDS.Config.FnMap[c].config;
        return SYNO.SDS.UIFeatures.IconSizeManager.getIconPath(a.jsBaseURL + "/" + a.icon, b)
    }
    return ""
};
SYNO.SDS.Utils.GetAppTitle = function(b) {
    if (b in SYNO.SDS.Config.FnMap) {
        var a = SYNO.SDS.Config.FnMap[b].config;
        return SYNO.SDS.Utils.GetLocalizedString(a.title, b)
    }
    return ""
};
SYNO.SDS.Utils.CheckWebapiError = function(e) {
    var c, b, d;
    try {
        if (Ext.isDefined(e.responseText)) {
            c = Ext.decode(e.responseText)
        } else {
            c = e
        }
        if (c.success) {
            return false
        }
        b = c.error.code || 100;
        d = SYNO.API.Errors.common[b]
    } catch (a) {}
    if (!d) {
        b = 100;
        d = SYNO.API.Errors.common[b]
    }
    window.alert(d);
    if (b >= 105) {
        window.onbeforeunload = null;
        window.location.href = "/"
    }
    return true
};
Ext.define("SYNO.SDS.Utils.Logout", {
    statics: {
        logoutTriggered: false,
        reserveQueryString: false,
        action: function(b, c, a) {
            if (a === true) {
                if (SYNO.SDS.Desktop) {
                    SYNO.SDS.Desktop.hide()
                }
                Ext.getBody().mask().addClass("desktop-timeout-mask")
            }
            if (Ext.isSafari && Ext.isMac) {
                this.logout.defer(10, this, [b, c])
            } else {
                this.logout(b, c)
            }
        },
        logout: function(a, b) {
            if (this.logoutTriggered) {
                return
            }
            if (Ext.isDefined(b)) {
                window.alert(b)
            }
            if (a === true) {
                window.onbeforeunload = null
            }
            if ("SYNOSSO" in window && SYNOSSO.logout) {
                SYNO.SDS.SSOUtils.logout(this.redirect)
            }
            if (Ext.isSafari && Ext.isMac) {
                this.redirect.defer(300, this)
            } else {
                this.redirect()
            }
        },
        setConfig: function(a) {
            Ext.apply(this, a)
        },
        redirect: function() {
            var a = "webman/logout.cgi";
            if (this.reserveQueryString) {
                a += window.location.search;
                a += window.location.hash
            }
            window.location.href = a;
            this.logoutTriggered = true
        }
    }
});
SYNO.SDS.Utils.CheckServerError = function(e) {
    var a, d, c;
    if (!e || !e.getResponseHeader) {
        return false
    }
    try {
        a = e.getResponseHeader("x-request-error") || e.getResponseHeader("X-Request-Error")
    } catch (b) {
        a = e.getResponseHeader["x-request-error"] || e.getResponseHeader["X-Request-Error"]
    }
    try {
        c = e.getResponseHeader("X-SYNO-SOURCE-ID")
    } catch (b) {
        c = undefined
    }
    if (a && Ext.isEmpty(c)) {
        a = Ext.util.Format.trim(a);
        switch (a) {
            case "timeout":
                d = _JSLIBSTR("uicommon", "error_timeout");
                break;
            case "unauth":
                d = _JSLIBSTR("uicommon", "error_unauth");
                break;
            case "noprivilege":
                d = _JSLIBSTR("uicommon", "error_noprivilege");
                break;
            case "relogin":
                d = _JSLIBSTR("uicommon", "error_relogin");
                break;
            case "errorip":
                d = undefined;
                break;
            default:
                d = _JSLIBSTR("uicommon", "error_system")
        }
        SYNO.SDS.Utils.Logout.action(true, d, true);
        return true
    }
    return false
};
SYNO.SDS.Utils.CheckServerErrorData = function(b) {
    var d = null,
        c, a;
    if (!Ext.isDefined(b)) {
        return false
    }
    c = b.section;
    a = b.key;
    if (c === "login") {
        switch (a) {
            case "error_timeout":
            case "error_noprivilege":
            case "error_interrupt":
                d = _JSLIBSTR("uicommon", a);
                break;
            default:
                d = _JSLIBSTR("uicommon", "error_system")
        }
    } else {
        if ("error" === c && "error_testjoin" === a) {
            d = _T("error", "error_testjoin")
        }
    }
    if (d) {
        alert(d);
        window.onbeforeunload = null;
        window.location.href = "/";
        return true
    }
    return false
};
SYNO.SDS.Utils.AddTip = function(d, k) {
    var j = document.createElement("a");
    var f = document.createElement("img");
    var a = "vertical-align:bottom; position: relative;";
    var h = Ext.getCmp(d.id);
    var b = Ext.id();
    var g = SYNO.SDS.UIFeatures.test("isRetina") ? SYNO.SDS.ThemeProvider.getPath("synoSDSjslib/images/default/2x/components/icon_information_mini.png") : SYNO.SDS.ThemeProvider.getPath("synoSDSjslib/images/default/1x/components/icon_information_mini.png");
    f.setAttribute("src", g);
    f.setAttribute("width", "24px");
    f.setAttribute("height", "24px");
    f.setAttribute("draggable", "false");
    if (h && h.defaultTriggerWidth) {
        a += " left:" + h.defaultTriggerWidth + "px;"
    }
    f.setAttribute("style", a);
    f.setAttribute("ext:qtip", k);
    f.setAttribute("alt", k);
    f.setAttribute("id", b);
    j.appendChild(f);
    if (h instanceof SYNO.ux.DisplayField) {
        d.appendChild(j)
    } else {
        if (h instanceof SYNO.ux.Button && Ext.getDom(d).nextSibling) {
            var i = d.dom.getAttribute("style") + " margin-right:0px !important;";
            var e = "margin-right:6px !important;";
            var c = Ext.getDom(d);
            c.setAttribute("style", i);
            j.setAttribute("style", e);
            c.parentNode.insertBefore(j, c.nextSibling)
        } else {
            if (h instanceof SYNO.ux.TextArea) {
                Ext.getDom(d).parentNode.parentNode.appendChild(j)
            } else {
                Ext.getDom(d).parentNode.appendChild(j)
            }
        }
    }
    if (h && h.el) {
        h.el.set({
            "aria-describedby": h.el.dom.getAttribute("aria-describedby") + " " + b
        })
    }
    return j
};
SYNO.SDS.Utils.CheckStrongPassword = Ext.extend(Object, {
    passwordPolicy: null,
    isFakePasswd: function(a, b) {
        if (a === "12345678" && b === "87654321") {
            return true
        }
    },
    getForm: null,
    getUserAcc: null,
    getUserDesc: null,
    getPasswd: null,
    getPasswdConfirm: null,
    getStartValidate: null,
    initPasswordChecker: function(a) {
        Ext.each(["getForm", "getUserAcc", "getUserDesc", "getPasswd", "getPasswdConfirm", "getStartValidate"], function(b) {
            this[b] = a[b]
        }, this)
    },
    setValue: function(a, b) {
        this.getForm().findField(this[a]).setValue(b)
    },
    getInfo: function(a) {
        if (Ext.isFunction(this[a])) {
            return this[a].call(this.scope || this)
        } else {
            if (Ext.isString(this[a])) {
                if (Ext.isFunction(this.getForm)) {
                    return this.getForm().findField(this[a]).getValue()
                } else {
                    return this[a]
                }
            }
        }
    },
    isStrongValidator: function() {
        var c = this.getInfo("getUserAcc");
        var b = this.getInfo("getUserDesc");
        var a = this.getInfo("getPasswd");
        var d = this.getInfo("getPasswdConfirm");
        var e = "";
        if (false === this.getStartValidate()) {
            return true
        }
        if (true === this.isFakePasswd(a, d)) {
            return true
        }
        e = this.isPasswordValid(a, c, b);
        return e
    },
    isPasswordValid: function(p, n, b) {
        var j = "abcdefghijklmnopqrstuvwxyz";
        var o = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var h = "~`!@#$%^&*()-_+={[}]|\\:;\"'<,>.?/ ";
        var m = "1234567890";
        var e = false;
        var l = false;
        var a = {
            mixed_case: false,
            included_special_char: false,
            included_numeric_char: false,
            exclude_username: false,
            min_length_enable: false
        };
        var d = [];
        var g = 0;
        var k = "";
        var f = Ext.util.Format.lowercase(p);
        var q = Ext.util.Format.lowercase(n);
        var c = Ext.util.Format.lowercase(b);
        if (q === "admin" && p.length < 6) {
            return String.format(_T("passwd", "min_length_default"), "admin", 6)
        }
        if (this.passwordPolicy.strong_password_enable === false) {
            return true
        }
        if ((q === "" || f.indexOf(q) === -1) && (c === "" || f.indexOf(c) === -1)) {
            a.exclude_username = true
        }
        for (g = 0; g < p.length; g++) {
            k = p.charAt(g);
            if (j.indexOf(k) !== -1) {
                e = true
            } else {
                if (o.indexOf(k) !== -1) {
                    l = true
                } else {
                    if (h.indexOf(k) !== -1) {
                        a.included_special_char = true
                    } else {
                        if (m.indexOf(k) !== -1) {
                            a.included_numeric_char = true
                        }
                    }
                }
            }
        }
        if (e === true && l === true) {
            a.mixed_case = true
        }
        if (p.length >= this.passwordPolicy.min_length) {
            a.min_length_enable = true
        }
        for (g in a) {
            if (true === this.passwordPolicy[g] && false === a[g]) {
                if (g === "min_length_enable") {
                    d.push(_T("passwd", g) + " " + this.passwordPolicy.min_length)
                } else {
                    d.push(_T("passwd", g))
                }
            }
        }
        if (0 !== d.length) {
            return _T("passwd", "passwd_strength_warn") + d.join(", ") + _T("common", "period")
        }
        return true
    }
});
SYNO.SDS.Utils.ActionGroup = Ext.extend(Object, {
    constructor: function(a) {
        this.list = [];
        this.dict = {};
        if (Ext.isObject(a)) {
            this.dict = a;
            Ext.iterate(a, function(b, c, d) {
                this.list.push(c)
            }, this)
        } else {
            if (Ext.isArray(a)) {
                this.list = a;
                Ext.each(a, function(d, b, c) {
                    this.dict[d.itemId] = d
                }, this)
            } else {
                SYNO.Debug.error("wrong parameters for ActionGroup")
            }
        }
    },
    enableAll: function() {
        Ext.each(this.list, function(c, a, b) {
            c.enable()
        }, this)
    },
    disableAll: function() {
        Ext.each(this.list, function(c, a, b) {
            c.disable()
        }, this)
    },
    enable: function(a) {
        if (this.dict[a]) {
            this.dict[a].enable()
        }
    },
    disable: function(a) {
        if (this.dict[a]) {
            this.dict[a].disable()
        }
    },
    add: function(a) {
        if (!a || !a.itemId) {
            SYNO.Debug.error("Invalid parameter for ActionGroup.add()");
            return
        }
        this.dict[a.itemId] = a;
        this.list.push(a)
    },
    get: function(a) {
        return this.dict[a]
    },
    getArray: function() {
        return this.list
    },
    showAll: function() {
        Ext.each(this.list, function(c, a, b) {
            c.show()
        }, this)
    },
    hideAll: function() {
        Ext.each(this.list, function(c, a, b) {
            c.hide()
        }, this)
    }
});
SYNO.SDS.Utils.isValidExtension = function(d, b) {
    var a = 0;
    var c = d.toLowerCase();
    if (!d.length || !b.length) {
        return false
    }
    a = c.lastIndexOf(b);
    if (-1 == a) {
        return false
    }
    if (c.length != (a + b.length)) {
        return false
    }
    return true
};
SYNO.SDS.Utils.getSupportedLanguage = function(a) {
    var e = {
        enu: _T("common", "language_enu"),
        fre: _T("common", "language_fre"),
        ger: _T("common", "language_ger"),
        ita: _T("common", "language_ita"),
        spn: _T("common", "language_spn"),
        cht: _T("common", "language_cht"),
        chs: _T("common", "language_chs"),
        jpn: _T("common", "language_jpn"),
        krn: _T("common", "language_krn"),
        ptb: _T("common", "language_ptb"),
        rus: _T("common", "language_rus"),
        dan: _T("common", "language_dan"),
        nor: _T("common", "language_nor"),
        sve: _T("common", "language_sve"),
        nld: _T("common", "language_nld"),
        plk: _T("common", "language_plk"),
        ptg: _T("common", "language_ptg"),
        hun: _T("common", "language_hun"),
        trk: _T("common", "language_trk"),
        csy: _T("common", "language_csy")
    };
    var f = [];
    var c = 0;
    for (var d in e) {
        if (e.hasOwnProperty(d)) {
            f[c++] = [d, e[d]]
        }
    }
    var b = function(h, g) {
        if (h[1] > g[1]) {
            return 1
        } else {
            if (h[1] < g[1]) {
                return -1
            } else {
                return 0
            }
        }
    };
    f = f.sort(b);
    if (a) {
        f.unshift(["def", _T("common", "language_def")])
    }
    return f
};
SYNO.SDS.Utils.getSupportedLanguageCodepage = function(a) {
    var e = {
        enu: _T("common", "language_enu"),
        fre: _T("common", "language_fre"),
        ger: _T("common", "language_ger"),
        gre: _T("common", "language_gre"),
        heb: _T("common", "language_heb"),
        ita: _T("common", "language_ita"),
        spn: _T("common", "language_spn"),
        cht: _T("common", "language_cht"),
        chs: _T("common", "language_chs"),
        jpn: _T("common", "language_jpn"),
        krn: _T("common", "language_krn"),
        ptb: _T("common", "language_ptb"),
        rus: _T("common", "language_rus"),
        dan: _T("common", "language_dan"),
        nor: _T("common", "language_nor"),
        sve: _T("common", "language_sve"),
        nld: _T("common", "language_nld"),
        plk: _T("common", "language_plk"),
        ptg: _T("common", "language_ptg"),
        hun: _T("common", "language_hun"),
        trk: _T("common", "language_trk"),
        csy: _T("common", "language_csy"),
        ara: _T("common", "language_ara")
    };
    var f = [];
    var c = 0;
    for (var d in e) {
        if (e.hasOwnProperty(d)) {
            f[c++] = [d, e[d]]
        }
    }
    var b = function(h, g) {
        if (h[1] > g[1]) {
            return 1
        } else {
            if (h[1] < g[1]) {
                return -1
            } else {
                return 0
            }
        }
    };
    f = f.sort(b);
    if (a) {
        f.unshift(["def", _T("common", "language_def")])
    }
    return f
};
SYNO.SDS.Utils.utfencode = function(b) {
    var e, d, a = "";
    b = b.replace(/\r\n/g, "\n");
    for (e = 0; e < b.length; e++) {
        d = b.charCodeAt(e);
        if (d < 128) {
            a += String.fromCharCode(d)
        } else {
            if ((d > 127) && (d < 2048)) {
                a += String.fromCharCode((d >> 6) | 192);
                a += String.fromCharCode((d & 63) | 128)
            } else {
                a += String.fromCharCode((d >> 12) | 224);
                a += String.fromCharCode(((d >> 6) & 63) | 128);
                a += String.fromCharCode((d & 63) | 128)
            }
        }
    }
    return a
};
SYNO.SDS.Utils.bin2hex = function(d) {
    var c, e = 0,
        b = [];
    d = SYNO.SDS.Utils.utfencode(d) + "";
    e = d.length;
    for (c = 0; c < e; c++) {
        b[c] = d.charCodeAt(c).toString(16).replace(/^([\da-f])$/, "0$1")
    }
    return b.join("")
};
SYNO.SDS.Utils.loadUIStrings = function(g, c, h) {
    var f = ["webapi/entry.cgi?api=SYNO.Core.Desktop.JSUIString&version=1&method=getjs&lang=" + g, "webapi/entry.cgi?api=SYNO.FileStation.UIString&version=1&method=getjs&lang=" + g, "webapi/entry.cgi?api=SYNO.Core.Desktop.UIString&version=1&method=getjs&lang=" + g];
    var e = 0;

    function b(i) {
        e++;
        if (e >= f.length) {
            h()
        }
    }

    function d() {
        if ("complete" !== this.readyState && "loaded" !== this.readyState) {
            return
        }
        this.onready()
    }
    if (g === "def" || g === _S("sys_lang")) {
        h();
        return
    }
    var a = document.getElementsByTagName("head")[0];
    Ext.each(f, function(j) {
        var k = j;
        k = Ext.urlAppend(k, "v=" + c);
        if (Ext.isDefined(SYNO.SDS.JSDebug)) {
            k = Ext.urlAppend(k, "_dc=" + (new Date().getTime()))
        }
        var i = document.createElement("script");
        i.type = "text/javascript";
        if (Ext.isIE) {
            i.onready = b.createCallback(j);
            i.onreadystatechange = d
        } else {
            i.onload = b.createCallback(j)
        }
        i.src = k;
        a.appendChild(i)
    })
};
SYNO.SDS.Utils.addFavIconLink = function(g, b) {
    var c = document.getElementsByTagName("link");
    var f = document.createElement("link");
    var e;
    f.rel = "shortcut icon";
    f.href = g;
    if (b) {
        f.type = b
    }
    var a = document.head || document.getElementsByTagName("head")[0];
    for (var d = c.length - 1; d >= 0; d--) {
        if (c[d] && c[d].getAttribute("rel") === "shortcut icon") {
            e = c[d].getAttribute("sizes");
            if (e === "16x16" || e === "32x32" || !e) {
                a.removeChild(c[d])
            }
        }
    }
    a.appendChild(f)
};
SYNO.SDS.Utils.listAllowAltPortApp = function() {
    var b = SYNO.SDS.Config.FnMap;
    var a = [];
    Ext.iterate(b, function(c, d, e) {
        if (d.config && (d.config.type === "app" || d.config.type === "url")) {
            if (d.config.allowAltPort === true) {
                a.push(c)
            }
        }
    });
    return a
};
SYNO.SDS.Utils.IconBadge = Ext.extend(Object, {
    constructor: function() {
        this.container = Ext.DomHelper.createDom({
            tag: "div",
            cls: "sds-expose-desc-ct"
        });
        this.el = Ext.get(this.container);
        this.icon = Ext.DomHelper.createDom({
            tag: "img",
            cls: "sds-expose-desc-img",
            style: String.format("width: {0}px", SYNO.SDS.UIFeatures.IconSizeManager.Header)
        });
        this.title = Ext.DomHelper.createDom({
            tag: "div",
            cls: "sds-expose-desc-text"
        });
        this.el.appendChild(this.icon);
        this.el.appendChild(this.title);
        Ext.get(document.body).appendChild(this.container)
    },
    setIconText: function(a, b) {
        this.icon.src = a;
        this.title.innerHTML = b
    },
    setXY: function(a, b) {
        this.el.setLeft(a);
        this.el.setTop(b)
    }
});
SYNO.SDS.Utils.isCJKLang = function() {
    switch (SYNO.SDS.Session.lang) {
        case "cht":
        case "chs":
        case "jpn":
        case "krn":
            return true;
        default:
            return false
    }
};
SYNO.SDS.Utils.is3rdPartyApp = function(b) {
    var a = SYNO.SDS.Config.FnMap[b];
    return (!a || a.jsFile.indexOf("webman/3rdparty/") === 0)
};
SYNO.SDS.Utils.clone = function(d) {
    if (!d || "object" !== typeof d) {
        return d
    }
    if ("function" === typeof d.clone) {
        return d.clone()
    }
    var e = "[object Array]" === Object.prototype.toString.call(d) ? [] : {};
    var b, a;
    for (b in d) {
        if (d.hasOwnProperty(b)) {
            a = d[b];
            if (a && "object" === typeof a) {
                e[b] = SYNO.SDS.Utils.clone(a)
            } else {
                e[b] = a
            }
        }
    }
    return e
};
SYNO.SDS.Utils.IsCJK = function(c) {
    if (!c) {
        return false
    }
    var e = function(g) {
        return /^[\u4E00-\u9FA5]|^[\uFE30-\uFFA0]/.test(g)
    };
    var f = function(g) {
        return /^[\u0800-\u4e00]/.test(g)
    };
    var b = function(g) {
        return /^[\u3130-\u318F]|^[\uAC00-\uD7AF]/.test(g)
    };
    var d;
    for (var a = 0; a < c.length; a++) {
        d = c[a];
        if (d === " ") {
            continue
        }
        if (d === undefined || (!e(d) && !f(d) && !b(d))) {
            return false
        }
    }
    return true
};
SYNO.SDS.Utils.SelectableCLS = "allowDefCtxMenu selectabletext";
SYNO.SDS.Utils.AutoResizeComboBox = Ext.extend(Ext.form.ComboBox, {
    expand: function() {
        var a = this;
        SYNO.SDS.Utils.AutoResizeComboBox.superclass.expand.call(a);
        if (a.comboBoxGrow === true) {
            a.autoResizeList(a.getWidth(), a.calcWidthFunc)
        }
    },
    doResize: function(a) {
        var b = this;
        if (!Ext.isDefined(b.listWidth) && b.comboBoxGrow === true) {
            b.autoResizeList(a, b.calcWidthFunc)
        }
    },
    autoResizeList: function(a, b) {
        var g = this,
            j = "",
            c = null,
            i = g.getStore();
        if (!i) {
            return
        }
        i.each(function(d) {
            if (j.length < d.data[g.displayField].length) {
                j = d.data[g.displayField];
                c = d
            }
        });
        var e = Ext.util.TextMetrics.createInstance(g.getEl());
        var f = document.createElement("div");
        f.appendChild(document.createTextNode(j));
        j = f.innerHTML;
        Ext.removeNode(f);
        f = null;
        j += "&#160;";
        var h = Math.min(g.comboBoxGrowMax || Number.MAX_VALUE, Math.max(((b && c) ? b(c, e.getWidth(j)) : e.getWidth(j)) + 10, a || 0));
        g.list.setWidth(h);
        g.innerList.setWidth(h - g.list.getFrameWidth("lr"))
    }
});
SYNO.SDS.Utils.IsAllowRelay = function(b) {
    var a, c, d = function(e) {
        if (true === e._relayObject && Ext.isFunction(e.findAppWindow) && Ext.isObject(e.openConfig) && Ext.isFunction(e.hasOpenConfig) && Ext.isFunction(e.getOpenConfig) && Ext.isFunction(e.setOpenConfig)) {
            return true
        }
        return false
    };
    if (!Ext.isObject(b)) {
        return false
    }
    a = Ext.getClassByName("SYNO.SDS.AdminCenter.MainWindow");
    c = Ext.getClassByName("SYNO.SDS.ResourceMonitor.App");
    if ((!Ext.isEmpty(a) && b instanceof a) || (!Ext.isEmpty(c) && b instanceof c) || true === d(b)) {
        if (b.hasOpenConfig("cms_id")) {
            return true
        }
    }
    return false
};
SYNO.SDS.Utils.IFrame = {
    createIFrame: function(d, c) {
        var e = SYNO.SDS.Utils.IFrame.createIFrame.iframeId || Ext.id(),
            a = d.getElementById(e),
            b = a || d.createElement("iframe");
        SYNO.SDS.Utils.IFrame.createIFrame.iframeId = e;
        b.setAttribute("src", "");
        b.setAttribute("id", e);
        b.setAttribute("name", e);
        if (c) {
            b.setAttribute("src", c)
        }
        b.setAttribute("frameBorder", "0");
        b.setAttribute("style", "border:0px none;width:0;height:0;position:absolute;top:-100000px");
        if (!a) {
            d.body.appendChild(b)
        }
        return b
    },
    cleanIframe: function(c, a) {
        try {
            Ext.EventManager.removeAll(a);
            Ext.destroy(a);
            c.body.removeChild(a);
            a = undefined
        } catch (b) {}
    },
    getWebAPIResp: function(a) {
        var c;
        try {
            c = Ext.decode(a.contentDocument.body.firstChild.innerHTML);
            if (Ext.isEmpty(c.success)) {
                c = undefined
            }
        } catch (b) {
            c = undefined
        }
        return c
    },
    request: function(a, d, k, f) {
        var h = document,
            j, e = SYNO.SDS.Utils.IFrame.createIFrame(h, f ? Ext.SSL_SECURE_URL : Ext.urlAppend(a)),
            b = Ext.isIE ? e.contentWindow.document : (e.contentDocument || window.frames[e.id].document),
            c;
        j = setTimeout((function() {
            SYNO.SDS.Utils.IFrame.cleanIframe.call(h, e);
            if (Ext.isFunction(d)) {
                d.call(k || this, "timeout", e)
            }
        }).createDelegate(this), 120000);
        if (f) {
            c = document.createElement("form");
            c.setAttribute("name", "dlform");
            c.setAttribute("action", Ext.urlAppend(a));
            c.setAttribute("method", "POST");
            for (var i in f) {
                if (f.hasOwnProperty(i)) {
                    var g = f[i];
                    c.appendChild(SYNO.SDS.Utils.IFrame.createHiddenInput(i, g))
                }
            }
            b.body.appendChild(c)
        }
        Ext.EventManager.on(e, "load", function() {
            var l;
            if (!Ext.isEmpty(j)) {
                clearTimeout(j)
            }
            SYNO.SDS.Utils.IFrame.cleanIframe.call(h, e);
            if (Ext.isFunction(d)) {
                l = this.getWebAPIResp(e);
                if (Ext.isObject(l)) {
                    d.call(k || this, "load", e, l.success, l.success ? l.data : l.error)
                } else {
                    d.call(k || this, "load", e)
                }
            }
        }, this, {
            single: true
        });
        Ext.EventManager.on(e, "error", function() {
            if (!Ext.isEmpty(j)) {
                clearTimeout(j)
            }
            SYNO.SDS.Utils.IFrame.cleanIframe.call(h, e);
            if (Ext.isFunction(d)) {
                d.call(k || this, "error", e)
            }
        }, this, {
            single: true
        });
        if (f) {
            b.dlform.submit();
            b.dlform.remove()
        }
        return e
    },
    requestWebAPI: function(e) {
        var d, f, c, b, g, a;
        if (!Ext.isObject(e.webapi) || !SYNO.ux.Utils.checkApiObjValid(e.webapi)) {
            SYNO.Debug.error("webapi is invalid");
            return
        }
        b = e.webapi;
        if (Ext.isObject(e.appWindow)) {
            c = e.appWindow.findAppWindow()
        } else {
            c = e.appWindow
        }
        if (SYNO.SDS.Utils.IsAllowRelay(c) && c.hasOpenConfig("cms_id")) {
            f = {
                api: "SYNO.CMS.DS",
                version: 1,
                method: "relay"
            };
            g = {
                id: c.getOpenConfig("cms_id"),
                timeout: c.getOpenConfig("cms_timeout") || 120,
                webapi: Ext.apply({
                    api: b.api,
                    version: b.version,
                    method: b.method
                }, b.params)
            };
            a = b.encryption ? ["webapi"] : null
        } else {
            if (false === c || c instanceof SYNO.SDS.AppWindow) {
                f = {
                    api: b.api,
                    method: b.method,
                    version: b.version
                };
                g = b.params;
                a = b.encryption
            } else {
                SYNO.Debug.error("appWindow is invalid!");
                SYNO.Debug.debug("appWindow can be found by Ext.Component.findAppWindow");
                SYNO.Debug.debug("ex: this.findAppWindow() or config.module.appWin.findAppWindow()");
                return
            }
        }
        if (!a) {
            f.params = g;
            d = SYNO.API.currentManager.getBaseURL(f, false, e.filename);
            return this.request(d, e.callback, e.scope)
        }
        d = SYNO.API.currentManager.getBaseURL(f, false, e.filename);
        g = this.encodeParams(f.api, g);
        return this.sendEncrypedRequest({
            reqObj: {
                url: d,
                params: g
            },
            reqEnc: a,
            config: e
        })
    },
    sendEncrypedRequest: function(a) {
        return SYNO.API.currentManager.requestAPI(Ext.apply({
            api: "SYNO.API.Encryption",
            method: "getinfo",
            version: 1,
            params: {
                format: "module"
            },
            callback: this.onEncryptRequestAPI,
            scope: this
        }, a))
    },
    onEncryptRequestAPI: function(j, h, f, a) {
        var e, g, d = a.config,
            c = a.reqObj,
            b = a.reqEnc;
        if (j) {
            SYNO.Encryption.CipherKey = h.cipherkey;
            SYNO.Encryption.RSAModulus = h.public_key;
            SYNO.Encryption.CipherToken = h.ciphertoken;
            SYNO.Encryption.TimeBias = h.server_time - Math.floor(+new Date() / 1000);
            e = Ext.copyTo({}, c.params, b);
            e = SYNO.Encryption.EncryptParam(e);
            for (g = 0; g < b.length; g++) {
                delete c.params[b[g]]
            }
            c.params = Ext.apply(c.params, e)
        }
        return this.request(c.url, d.callback, d.scope, c.params)
    },
    encodeParams: function(a, c) {
        var b = SYNO.API.GetKnownAPI(a, c);
        return ("JSON" === b.requestFormat) ? SYNO.API.EncodeParams(c) : c
    },
    createHiddenInput: function(b, c) {
        var a = document.createElement("input");
        a.setAttribute("type", "hidden");
        a.setAttribute("name", b);
        a.setAttribute("value", c);
        return a
    }
};
Ext.define("SYNO.SDS.Utils.HiDPI", {
    statics: {
        getRatio: function(b) {
            var a, d, c, e = ((window.matchMedia && (window.matchMedia("(-webkit-min-device-pixel-ratio: 1.5),(-moz-min-device-pixel-ratio: 1.5),(min-device-pixel-ratio: 1.5)").matches)) ? 1.5 : 1);
            a = window.devicePixelRatio || e;
            d = b.webkitBackingStorePixelRatio || b.mozBackingStorePixelRatio || b.msBackingStorePixelRatio || b.oBackingStorePixelRatio || b.backingStorePixelRatio || 1;
            c = a / d;
            return c
        }
    }
});
SYNO.SDS.Utils.isBSTinEffect = function() {
    var e, c, b, f, a, g = new Date();
    for (e = 31; e > 0; e--) {
        c = new Date(g.getFullYear(), 2, e);
        if (c.getDay() === 0) {
            f = c;
            break
        }
    }
    for (e = 31; e > 0; e--) {
        c = new Date(g.getFullYear(), 9, e);
        if (c.getDay() === 0) {
            a = c;
            break
        }
    }
    b = (g < f || g > a) ? false : true;
    return b
};
SYNO.SDS.Utils.isInVirtualDSM = function() {
    var a = _D("virtual_dsm");
    if (!a) {
        return false
    }
    return "yes" === a.toLowerCase()
};
SYNO.SDS.Utils.GetFeasibilityCheckMsg = function(c) {
    var g = "",
        d, b = c,
        a = [],
        e, f, h = true;
    if (c.isJSON()) {
        d = Ext.util.JSON.decode(c);
        if (d.task_i18n) {
            b = d.task_i18n
        } else {
            b = d.task;
            h = false
        }
        if (!b) {
            return ""
        }
        if (d.args) {
            a = d.args
        }
    }
    if (h) {
        e = b.split(":");
        if (1 === e.length) {
            g = b
        } else {
            if (2 === e.length) {
                g = (0 === _T(e[0], e[1]).length) ? _JSLIBSTR(e[0], e[1]) : _T(e[0], e[1])
            } else {
                if (3 === e.length) {
                    g = _TT(e[0], e[1], e[2])
                } else {
                    g = b
                }
            }
        }
    } else {
        g = b
    }
    if ((!Ext.isDefined(g) || 0 === g.length) && Ext.isObject(d)) {
        g = d.task
    }
    if (0 < a.length) {
        a.unshift(g);
        f = String.format.apply(String, a)
    } else {
        f = g
    }
    return f
};
SYNO.SDS.Utils.GetFeasibilityCheckMsgJoin = function(a, c) {
    var b = [];
    c = c || "<br> ";
    Ext.each(a, function(d) {
        b.push(SYNO.SDS.Utils.GetFeasibilityCheckMsg(d))
    }, this);
    return b.join(c)
};
Ext.define("SYNO.SDS.Utils.StrongPassValidator", {
    extend: "Ext.util.Observable",
    constructor: function(a, b) {
        this.rules = Ext.apply({
            default_admin_min_length: true
        }, a);
        this.username = b || ""
    },
    validate: function(a) {
        var b = this.getMatchError(a);
        if (b.length > 0) {
            return b[0]
        }
        return true
    },
    getStrength: function(a) {
        var b = this.getMatchError(a);
        return Math.max(3 - b.length, 1)
    },
    getMatchError: function(i) {
        var h, d = /[a-z]/,
            j = /[A-Z]/,
            g = /[0-9]/,
            c = /[~`!@#$%^&*()\-_+={[}]|\\:;"'<,>\.\? ]/,
            f, b = [],
            k = this.rules,
            e = this.username.toLowerCase(),
            a = k.min_length;
        for (h in k) {
            if (k[h] === true) {
                f = false;
                switch (h) {
                    case "exclude_username":
                        f = (e.length === 0 || i.toLowerCase().indexOf(e) < 0);
                        break;
                    case "included_numeric_char":
                        f = g.test(i);
                        break;
                    case "included_special_char":
                        f = c.test(i);
                        break;
                    case "min_length_enable":
                        f = (i.length >= a);
                        break;
                    case "mixed_case":
                        f = (d.test(i) && j.test(i));
                        break;
                    case "default_admin_min_length":
                        f = (e == "admin") ? (i.length >= 6) : true;
                        break;
                    default:
                        break
                }
                if (!f) {
                    b.push(this.getErrMsg(h))
                }
            }
        }
        return b
    },
    getErrMsg: function(a) {
        switch (a) {
            case "min_length_enable":
                return _T("passwd", a) + " " + this.rules.min_length;
            case "default_admin_min_length":
                return String.format(_T("passwd", "min_length_default"), "admin", 6);
            default:
                return _T("passwd", a)
        }
    }
});
Ext.namespace("SYNO.SDS.Relay");
SYNO.SDS.Relay.GenRelaydStatusStr = function() {
    var b = {
        err_unknown: _T("relayservice", "relayservice_err_unknown"),
        err_config: String.format(_T("relayservice", "relayservice_err_config"), "ERR_CONF"),
        err_register: String.format(_T("relayservice", "relayservice_err_register"), "ERR_REG"),
        err_network: _T("relayservice", "relayservice_err_network"),
        err_not_support: _T("relayservice", "relayservice_status_update_dsm"),
        err_resolv: _T("relayservice", "relayservice_err_resolv"),
        err_lock: String.format(_T("relayservice", "relayservice_err_lock"), "ERR_LOCK"),
        err_auth: _T("error", "error_auth"),
        err_server_limit: _T("relayservice", "relayservice_err_server_limit"),
        err_server_busy: String.format(_T("relayservice", "relayservice_err_server_busy"), "ERR_BUSY"),
        err_server_changed: String.format(_T("relayservice", "relayservice_err_register"), "ERR_REG"),
        success: undefined
    };
    var a = {
        not_running: _T("relayservice", "relayservice_disconnected"),
        starting: _T("relayservice", "relayservice_starting"),
        login: Ext.copyTo({
            success: _T("relayservice", "relayservice_login")
        }, b, "err_network,err_resolv,err_server_limit"),
        connected: Ext.copyTo({
            success: _T("relayservice", "relayservice_connected")
        }, b, "err_network,err_resolv"),
        direct_connect: _T("relayservice", "relayservice_direct_connect"),
        logout: _T("relayservice", "relayservice_stop"),
        stoped: Ext.applyIf({
            success: _T("relayservice", "relayservice_disconnected")
        }, b),
        "--": "--"
    };
    return function(d, c) {
        if (d in a) {
            if (Ext.isString(a[d])) {
                return a[d]
            }
            if (!Ext.isObject(a[d])) {
                throw Error("unknown status config")
            }
            if (c in a[d]) {
                return a[d][c]
            } else {
                return a[d].success
            }
        } else {
            if (c in b) {
                return a.stoped.success + "(" + b[c] + ")"
            } else {
                return a.stoped.success
            }
        }
    }
};
SYNO.SDS.Relay.GetRelaydStatusStr = SYNO.SDS.Relay.GenRelaydStatusStr();
Ext.ns("SYNO.SDS.Utils.DataView");
SYNO.SDS.Utils.DataView.FlexcrollDataView = Ext.extend(Ext.DataView, {
    scrollCls: " ux-scroll",
    overScrollCls: " ux-scroll-over",
    autoFlexcroll: true,
    trackResetOnLoad: true,
    initComponent: function() {
        var a = this;
        SYNO.SDS.Utils.DataView.FlexcrollDataView.superclass.initComponent.call(a);
        a.addEvents("refresh", "updateScrollbar");
        a.mon(a, "beforerender", function() {
            a.cls = a.cls ? a.cls + a.scrollCls : a.scrollCls;
            a.overCls = a.overCls ? a.overCls + a.overScrollCls : a.overScrollCls
        }, a)
    },
    onStoreException: function() {
        this.el.unmask()
    },
    onStoreLoad: function() {
        var a = this;
        a.updateScrollbar(a.trackResetOnLoad);
        a.fireEvent("afterUpdateScrollbar", a)
    },
    onStoreClear: function() {
        var a = this;
        a.updateScrollbar(a.trackResetOnLoad)
    },
    bindStore: function(a, b) {
        var c = this;
        SYNO.SDS.Utils.DataView.FlexcrollDataView.superclass.bindStore.apply(c, arguments);
        if (!b && this.store) {
            if (a !== this.store && this.store.autoDestroy) {
                this.store.destroy()
            } else {
                c.mun(a, "loadexception", c.onStoreException, c);
                c.mun(a, "load", c.onStoreLoad, c);
                c.mun(a, "clear", c.onStoreClear, c);
                c.mun(a, "datachanged", c.updateScrollbar, c);
                c.mun(a, "update", c.updateScrollbar, c)
            }
            if (!a) {
                this.store = null
            }
        }
        if (a) {
            a = Ext.StoreMgr.lookup(a);
            c.mon(a, "loadexception", c.onStoreException, c);
            c.mon(a, "load", c.onStoreLoad, c);
            c.mon(a, "clear", c.onStoreClear, c);
            c.mon(a, "datachanged", c.updateScrollbar, c);
            c.mon(a, "update", c.updateScrollbar, c)
        }
    },
    afterRender: function() {
        var a = this;
        SYNO.SDS.Utils.DataView.FlexcrollDataView.superclass.afterRender.call(a);
        a.mon(a, "resize", a.updateScrollbar, a);
        a.mon(a, "afterrender", a.updateScrollbar, a);
        a.mon(a, "afterlayout", a.updateScrollbar, a);
        a.mon(a, "updateScrollbar", a.onUpdateScrollbar, a, {
            buffer: 100
        });
        a.updateScrollbar()
    },
    getTemplateTarget: function() {
        var a = this;
        if (!a.el.dom) {
            return
        }
        a.scrollBar = a.scrollBar || a.el.createChild({
            tag: "div",
            style: "display:inline-block;width:100%;"
        });
        return a.scrollBar
    },
    updateScrollbar: function(a) {
        var b = this;
        a = Ext.isBoolean(a) ? a : false;
        if (a) {
            this.onUpdateScrollbar(a)
        } else {
            b.fireEvent("updateScrollbar", a)
        }
    },
    onUpdateScrollbar: function(a) {
        var b = this;
        if (b.isVisible()) {
            var c = b.el.dom;
            if (c && c.fleXcroll) {
                if (a) {
                    c.fleXcroll.setScrollPos(false, 0)
                }
                c.fleXcroll.updateScrollBars();
                if (!a) {
                    c.fleXcroll.setScrollPos(0, 0, true)
                }
            } else {
                if (c) {
                    fleXenv.fleXcrollMain(c, this.disableTextSelect);
                    c.onfleXcroll = (function() {
                        this.fireEvent("flexcroll", this, this.getFleXcrollInfo(b.el.dom))
                    }).createDelegate(this);
                    if (c.fleXcroll) {
                        this.fireEvent("flexcrollInitDone")
                    }
                }
            }
            c = null
        }
    },
    refresh: function() {
        var a = this;
        SYNO.SDS.Utils.DataView.FlexcrollDataView.superclass.refresh.call(a);
        a.fireEvent("refresh")
    },
    onDestroy: function() {
        var a = this;
        if (a.scrollBar) {
            Ext.destroy(a.scrollBar);
            delete a.scrollBar
        }
        SYNO.SDS.Utils.DataView.FlexcrollDataView.superclass.onDestroy.apply(a, arguments)
    }
});
SYNO.SDS.Utils.DataView.SquenceStrategy = function() {
    var a = this;
    if (a.isDestroyed) {
        return
    }
    if (a.all.getCount() === 0) {
        return
    }
    a.all.each(function(b) {
        this.updateItem(b)
    }, a)
};
SYNO.SDS.Utils.DataView.BinarySearchStrategy = function() {
    var e = this,
        d = null,
        a = -1,
        f = -1,
        h = -1,
        b = 0;
    var g = function() {
        var l = null,
            k = 0;
        var i = 0,
            m = e.all.getCount() - 1,
            j = -1;
        while (i <= m) {
            j = Math.floor((i + m) / 2);
            l = e.all.item(j);
            k = e.isIntens(l, e.getEl());
            if (l && (k === true)) {
                return j
            } else {
                if (k === false) {
                    i = j + 1
                } else {
                    if (k < 0) {
                        m = j - 1
                    }
                }
            }
        }
        return -1
    };
    if (e.isDestroyed) {
        return
    }
    if (e.all.getCount() === 0) {
        return
    }
    if ((d = e.all.first()) && (e.isIntens(d, e.getEl()) === true)) {
        a = 0
    } else {
        if ((d = e.all.last()) && (e.isIntens(d, e.getEl()) === true)) {
            a = e.all.getCount() - 1
        } else {
            a = g()
        }
    }
    if (a === -1) {
        e.all.each(function(i) {
            this.onUnLoadItem(i)
        }, e)
    } else {
        var c;
        for (b = a; b < e.all.getCount(); b++) {
            c = e.isIntens(e.all.item(b), e.getEl());
            if (c === true) {
                e.onLoadItem(d)
            } else {
                h = b;
                break
            }
        }
        for (b = a - 1; b >= 0; b--) {
            c = e.isIntens(e.all.item(b), e.getEl());
            if (c === true) {
                e.onLoadItem(d)
            } else {
                f = b;
                break
            }
        }
        if (f !== -1) {
            for (b = f; b >= 0; b--) {
                e.onUnLoadItem(d)
            }
        }
        if (h !== -1) {
            for (b = h; b < e.all.getCount(); b++) {
                e.onUnLoadItem(d)
            }
        }
    }
};
SYNO.SDS.Utils.DataView.ConstantSearchStrategy = function() {
    var f = this,
        e = null,
        b = -1,
        g = -1,
        h = -1,
        c = 0;
    var a = function(k) {
        var i = k.getSize(),
            j = k.getMargins(),
            l = f.el.dom.fleXdata ? f.el.dom.fleXdata.scrollPosition[1][0] : 0;
        return Math.floor(l / (i.height + j.top + j.bottom)) * Math.floor(f.el.getWidth() / (i.width + j.right + j.left))
    };
    if (f.isDestroyed) {
        return
    }
    if (f.all.getCount() === 0) {
        return
    }
    if ((e = f.all.first()) && (f.isIntens(e, f.getEl()) === true)) {
        b = 0
    } else {
        if ((e = f.all.last()) && (f.isIntens(e, f.getEl()) === true)) {
            b = f.all.getCount() - 1
        } else {
            b = a(f.all.first())
        }
    }
    if (b === -1) {
        f.all.each(function(i) {
            this.onUnLoadItem(i)
        }, f)
    } else {
        var d;
        for (c = b; c < f.all.getCount(); c++) {
            d = f.isIntens(f.all.item(c), f.getEl());
            if (d === true) {
                f.onLoadItem(e)
            } else {
                h = c;
                break
            }
        }
        for (c = b - 1; c >= 0; c--) {
            d = f.isIntens(f.all.item(c), f.getEl());
            if (d === true) {
                f.onLoadItem(e)
            } else {
                g = c;
                break
            }
        }
        if (g !== -1) {
            for (c = g; c >= 0; c--) {
                f.onUnLoadItem(f.all.item(c))
            }
        }
        if (h !== -1) {
            for (c = h; c < f.all.getCount(); c++) {
                f.onUnLoadItem(f.all.item(c))
            }
        }
    }
};
SYNO.SDS.Utils.DataView.LazyDataView = Ext.extend(SYNO.SDS.Utils.DataView.FlexcrollDataView, {
    delay: 600,
    widthThreshold: 0,
    heightThreshold: 0,
    autoHeightThreshold: true,
    constructor: function(a) {
        this.itemCls = a.itemCls || undefined;
        this.searchStrategy = this.searchStrategy || SYNO.SDS.Utils.DataView.SquenceStrategy.createDelegate(this);
        this.addPlugins(SYNO.ux.DataViewARIA, a);
        SYNO.SDS.Utils.DataView.LazyDataView.superclass.constructor.apply(this, [a]);
        this.last = false
    },
    initKeyNav: function() {
        var a;
        a = new Ext.KeyNav(this.el, {
            down: function(b) {
                this.onKeyDown(b)
            },
            up: function(b) {
                this.onKeyUp(b)
            },
            left: function(b) {
                this.onKeyLeft(b)
            },
            right: function(b) {
                this.onKeyRight(b)
            },
            esc: function(b) {
                this.onKeyEsc(b)
            },
            scope: this
        })
    },
    focusNode: function(c) {
        var b = this,
            a = b.getNode(c);
        if (!b.autoFlexcroll) {
            return
        }
        b.fleXcrollTo(a)
    },
    getFirstSelItemIdx: function() {
        return this.getSelectedIndexes()[0]
    },
    getLastSelItemIdx: function() {
        return this.getSelectedIndexes()[this.getSelectedIndexes().length - 1]
    },
    getThumbnailRowNum: function(a) {
        var c = a.getTemplateTarget(),
            b = a.selected.elements[0].getStyles(),
            d = parseInt(b.width, 10) + parseInt(b.marginLeft, 10) + parseInt(b.marginRight, 10);
        return Math.floor(c.getWidth() / d)
    },
    isNeedToShift: function() {
        var b = this,
            a = b.selected.elements[0];
        if (!a) {
            return false
        }
        return true
    },
    selectItem: function(a, b) {
        if (!b) {
            this.select(a)
        } else {
            this.select(a, true, true)
        }
        this.focusNode(a)
    },
    selectPreItem: function() {
        var b = this.getFirstSelItemIdx(),
            a;
        a = (b === 0) ? 0 : b - 1;
        this.selectItem(a)
    },
    selectNextItem: function() {
        var b = this.getFirstSelItemIdx(),
            c = this.store.getCount() - 1,
            a;
        a = (b == c) ? c : b + 1;
        this.selectItem(a)
    },
    selectPreRowItem: function(c) {
        var b = this.getFirstSelItemIdx(),
            a;
        if (b < c) {
            this.selectItem(b);
            return
        }
        a = b - c;
        this.selectItem(a)
    },
    selectNextRowItem: function(d) {
        var b = this.getFirstSelItemIdx(),
            c = this.store.getCount() - 1,
            a;
        a = b + d;
        if (a > c) {
            this.selectItem(b);
            return
        }
        this.selectItem(a)
    },
    selectPreItemIn: function() {
        var b = this.last,
            a;
        a = (this.getLastSelItemIdx() === 0) ? 0 : this.getLastSelItemIdx() - 1;
        this.selectRange(b, a);
        this.last = b
    },
    selectNextItemIn: function() {
        var b = this.last,
            c = this.store.getCount() - 1,
            a;
        a = (this.getLastSelItemIdx() + 1 > c) ? c : this.getLastSelItemIdx() + 1;
        this.selectRange(b, a);
        this.last = b
    },
    selectPreRowItemIn: function(c) {
        var b = this.last,
            a;
        a = (this.getLastSelItemIdx() < c) ? 0 : this.getLastSelItemIdx() - c;
        this.selectRange(b, a);
        this.last = b
    },
    selectNextRowItemIn: function(d) {
        var b = this.last,
            c = this.store.getCount() - 1,
            a;
        a = (this.getLastSelItemIdx() + d > c) ? c : this.getLastSelItemIdx() + d;
        this.selectRange(b, a);
        this.last = b
    },
    onKeyEsc: function(a) {
        this.clearAllSelections()
    },
    onKeyUp: function(b) {
        if (this.isNeedToShift() !== true) {
            this.selectItem(0);
            return
        }
        var a = this,
            c = a.getThumbnailRowNum(a);
        if (!b.shiftKey) {
            a.selectPreRowItem(c)
        } else {
            a.selectPreRowItemIn(c)
        }
    },
    onKeyDown: function(b) {
        if (this.isNeedToShift() !== true) {
            this.selectItem(0);
            return
        }
        var a = this,
            c = a.getThumbnailRowNum(a);
        if (!b.shiftKey) {
            a.selectNextRowItem(c)
        } else {
            a.selectNextRowItemIn(c)
        }
    },
    onKeyRight: function(b) {
        if (this.isNeedToShift() !== true) {
            this.selectItem(0);
            return
        }
        var a = this;
        if (!b.shiftKey) {
            a.selectNextItem()
        } else {
            a.selectNextItemIn()
        }
    },
    onKeyLeft: function(b) {
        if (this.isNeedToShift() !== true) {
            this.selectItem(0);
            return
        }
        var a = this;
        if (!b.shiftKey) {
            a.selectPreItem()
        } else {
            a.selectPreItemIn()
        }
    },
    setSearchStategy: function(a) {
        this.searchStrategy = a
    },
    onLoadItem: function(a) {},
    onUnLoadItem: function(a) {},
    belowthefold: function(c, a, d) {
        var b;
        b = (d || a.getY()) + a.dom.scrollTop + a.getHeight();
        return b - (c.getY() - this.heightThreshold)
    },
    rightoffold: function(d, b, a) {
        var c;
        c = (a || b.getX()) + b.dom.scrollLeft + b.getWidth();
        return c - (d.getX() - this.widthThreshold)
    },
    abovethetop: function(c, a, d) {
        var b;
        b = (d || a.getY()) + a.dom.scrollTop;
        return b >= c.getY() + this.heightThreshold + c.getHeight()
    },
    leftofbegin: function(d, b, a) {
        var c;
        c = (a || b.getX()) + b.dom.scrollLeft;
        return c >= d.getX() + this.widthThreshold + d.getWidth()
    },
    isIntens: function(e, d) {
        var f = this,
            b = 0,
            g = 0,
            c = d.getX(),
            a = d.getY();
        if (!f.isVisible()) {
            return false
        }
        if (!e) {
            return false
        }
        if (f.abovethetop(e, d, a) || f.leftofbegin(e, d, c)) {
            return false
        } else {
            if ((g = f.belowthefold(e, d, a)) >= 0 && (b = f.rightoffold(e, d, c)) >= 0) {
                return true
            } else {
                return b + g
            }
        }
    },
    fitWidth: function() {
        var e = this,
            a = e.getTemplateTarget(),
            f = 0,
            c = 0,
            d = 0,
            h = e.all.item(0),
            i = true,
            b = 0;
        if (!Ext.isObject(h) || !e.itemCls) {
            return
        }
        var g = Ext.util.CSS.getRule(e.itemCls);
        if (!g) {
            return
        }
        e.marginLeft = e.marginLeft || h.getMargins("l") || 0;
        e.marginRight = e.marginRight || h.getMargins("r") || 0;
        b = e.marginLeft + e.marginRight;
        if (!Ext.isNumber(b)) {
            return
        }
        d = h.getWidth() + b;
        c = Math.floor(a.getWidth() / d);
        if (c === 0) {
            return
        }
        f = Math.floor(a.getWidth() % d);
        if (h.getMargins("l") !== Math.floor((e.marginLeft + f / 2 / c))) {
            i = i && Ext.util.CSS.updateRule(e.itemCls, "margin-left", Math.floor((e.marginLeft + f / 2 / c)) + "px");
            i = i && Ext.util.CSS.updateRule(e.itemCls, "margin-right", Math.floor((e.marginRight + f / 2 / c)) + "px")
        }
        return i
    },
    updateScrollbar: function(a) {
        var b = this;
        a = Ext.isBoolean(a) ? a : false;
        if (a) {
            this.onUpdateScrollbar(a)
        } else {
            b.fireEvent("updateScrollbar", a)
        }
    },
    onUpdateScrollbar: function(a) {
        var b = this;
        if (b.isVisible()) {
            var c = b.el.dom;
            if (c && c.fleXcroll) {
                if (a) {
                    c.fleXcroll.setScrollPos(false, 0)
                }
                c.fleXcroll.updateScrollBars();
                if (!a) {
                    c.fleXcroll.setScrollPos(0, 0, true)
                }
            } else {
                if (c) {
                    fleXenv.fleXcrollMain(c, this.disableTextSelect);
                    c.onfleXcroll = (function() {
                        if (b.isVisible() && b.onUpdateView) {
                            b.onUpdateView()
                        }
                        this.fireEvent("flexcroll", this, this.getFleXcrollInfo(b.el.dom))
                    }).createDelegate(this);
                    if (c.fleXcroll) {
                        this.fireEvent("flexcrollInitDone")
                    }
                }
            }
            c = null
        }
    },
    afterRender: function() {
        var a = this;
        SYNO.SDS.Utils.DataView.LazyDataView.superclass.afterRender.call(a);
        a.mon(a, {
            resize: a.onResize,
            scope: a
        });
        a.initKeyNav();
        this.updateHeightThreshold()
    },
    onUserResize: function() {
        this.updateScrollbar();
        this.updateHeightThreshold();
        this.fitWidth.createSequence(function() {
            this.updateScrollbar.defer(300, this)
        }, this).defer(330, this)
    },
    onResize: function() {
        if (!this.resizeTask) {
            this.resizeTask = new Ext.util.DelayedTask(this.onUserResize, this)
        }
        this.resizeTask.delay(350)
    },
    updateHeightThreshold: function() {
        if (this.autoHeightThreshold && (!Ext.isIE || Ext.isModernIE)) {
            this.heightThreshold = this.getEl().getHeight()
        }
    },
    onUpdateView: function() {
        if (this.delay) {
            if (!this.renderTask) {
                this.renderTask = new Ext.util.DelayedTask(this.searchStrategy, this)
            }
            this.renderTask.delay(this.delay)
        } else {
            this.searchStrategy()
        }
    },
    updateItem: function(a) {
        var b = this;
        if (a.isVisible() && b.isIntens(a, b.getEl()) === true) {
            b.onLoadItem(a)
        } else {
            b.onUnLoadItem(a)
        }
    },
    lazyLoadItem: function(a) {
        var b = this;
        b.updateItem(Ext.fly(a))
    },
    onBeforeLoad: function() {
        if (this.loadingText) {
            this.clearSelections(false, true);
            this.getEl().mask(this.loadingText, "x-mask-loading");
            this.all.clear()
        }
    },
    refresh: function() {
        var a = this;
        if (this.loadingText) {
            this.getEl().unmask()
        }
        SYNO.SDS.Utils.DataView.LazyDataView.superclass.refresh.call(a);
        a.onUpdateView()
    },
    removeTask: function(b) {
        var a = this[b];
        if (a && a.cancel) {
            a.cancel();
            this[b] = null
        }
    },
    destroy: function() {
        this.removeTask("renderTask");
        this.removeTask("resizeTask");
        SYNO.SDS.Utils.DataView.LazyDataView.superclass.destroy.call(this)
    }
});
Ext.ns("SYNO.webfm.utils");
SYNO.webfm.Cfg = {};
Ext.apply(SYNO.webfm.Cfg, {
    timeout: 600000
});
Ext.apply(SYNO.webfm.utils, {
    ThumbSize: {
        SMALL: "S",
        MEDIUM: "M",
        LARGE: "L"
    }
});
SYNO.webfm.VFS = {};
Ext.apply(SYNO.webfm.VFS, {
    SupportChmodList: ["ftp", "sftp", "ftps"],
    isVFSPath: function(a) {
        if (!a) {
            return false
        }
        if ("/" !== a.charAt(0) && -1 != a.indexOf("://")) {
            return true
        }
        return false
    },
    isGDrivePath: function(a) {
        if (!this.isVFSPath(a)) {
            return false
        }
        if (0 !== a.indexOf("google://")) {
            return false
        }
        return true
    },
    isGDriveRootPath: function(a) {
        if (!this.isGDrivePath(a)) {
            return false
        }
        return -1 === a.indexOf("/", String("google://").length)
    },
    isGDriveDefaultFolder: function(c) {
        if (!this.isGDrivePath(c)) {
            return false
        }
        var b = c.substring(String("google://").length);
        var a = b.split("/", 3);
        return 2 === a.length
    },
    isGDriveStarsPath: function(c) {
        if (!this.isGDrivePath(c)) {
            return false
        }
        var b = c.substring(String("google://").length);
        var a = b.split("/", 3);
        return 2 === a.length && "Starred" === a[1]
    },
    isGDriveStarsFirstLevelPath: function(c) {
        if (!this.isGDrivePath(c)) {
            return false
        }
        var b = c.substring(String("google://").length);
        var a = b.split("/", 4);
        return 3 === a.length && "Starred" === a[1]
    },
    isOneDrivePath: function(a) {
        if (!this.isVFSPath(a)) {
            return false
        }
        if (0 !== a.indexOf("onedrive://")) {
            return false
        }
        return true
    },
    isSharingPath: function(a) {
        if (!this.isVFSPath(a)) {
            return false
        }
        if (0 !== a.indexOf("sharing://")) {
            return false
        }
        return true
    },
    getBaseURI: function(c) {
        if (!SYNO.webfm.VFS.isVFSPath(c)) {
            return ""
        }
        var a = c.indexOf("://");
        if (-1 === a) {
            return ""
        }
        var b = c.indexOf("/", a + 3);
        if (-1 === b) {
            return c
        }
        return c.substr(0, b)
    },
    isRootFolder: function(b) {
        if (!SYNO.webfm.VFS.isVFSPath(b)) {
            return false
        }
        var a = b.indexOf("://");
        if (-1 === a) {
            return false
        }
        a = b.indexOf("/", a + 3);
        if (-1 === a) {
            return true
        }
        return false
    },
    getSchemaFromPath: function(b) {
        if (!SYNO.webfm.VFS.isVFSPath(b)) {
            return ""
        }
        var a = b.indexOf("://");
        if (-1 === a) {
            return ""
        }
        return b.substr(0, a)
    }
});
SYNO.webfm.SmartDDMVCPMgr = {};
Ext.apply(SYNO.webfm.SmartDDMVCPMgr, {
    filename: "",
    blCtrl: false,
    blShift: false,
    blDisableUpate: false,
    blHotkey: false,
    blSrcReadOnly: false,
    operation: "mvcp",
    action: "move",
    defaultAction: "move",
    ghost: null,
    proxy: null,
    sourceType: null,
    onAction: function(i, c, a) {
        var f = SYNO.webfm.SmartDDMVCPMgr;
        var d = a.getXY();
        var g = (SYNO.SDS.UserSettings.getProperty("SYNO.SDS.App.PersonalSettings.Instance", "isfirstdd") === false) ? false : true;
        var b = SYNO.SDS.UserSettings.getProperty("SYNO.SDS.App.PersonalSettings.Instance", "enablesmartmvcp");
        var h = Ext.isEmpty(b);
        if (h || g) {
            var e = new SYNO.FileStation.DragDropHintDialog({
                owner: c.owner
            });
            e.on("onAskDone", function(j) {
                f.doAction(i, c, d, j)
            });
            e.show().center()
        } else {
            f.doAction(i, c, d, f.isEnable())
        }
    },
    doAction: function(e, b, a, d) {
        var c = SYNO.webfm.SmartDDMVCPMgr;
        if (d) {
            b.FileAction.onBeforeSmartDDMVCP(b.ddParams.src, e.action, b.ddParams.target, b.ddParams);
            c.updateHotkeyAction("keyup")
        } else {
            if (!b.onCheckVFSAction("copy", b.ddParams.src, b.ddParams.target)) {
                e.getComponent("copy_skip").disable();
                e.getComponent("copy_overwrite").disable()
            }
            if (!b.onCheckVFSAction("move", b.ddParams.src, b.ddParams.target)) {
                e.getComponent("move_skip").disable();
                e.getComponent("move_overwrite").disable()
            }
            e.showAt(a)
        }
    },
    initDragData: function(a, c) {
        var b = SYNO.webfm.SmartDDMVCPMgr;
        b.blSrcReadOnly = false;
        if (!b.isEnable() || !Ext.isDefined(c) || 0 === c.length) {
            return
        }
        if (!a.onCheckPrivilege("move", c, false, false)) {
            b.blSrcReadOnly = true
        }
        b.sourceType = b.getSourceTypeByPath(a, c[0].get("path"))
    },
    setDragDropData: function(b, a, c, e) {
        var d = SYNO.webfm.SmartDDMVCPMgr;
        d.filename = b;
        d.operation = a;
        d.proxy = c;
        d.ghost = c.getGhost()
    },
    bindHotKey: function(b) {
        var a = SYNO.webfm.SmartDDMVCPMgr;
        b.mon(b.getEl(), "keydown", a.updateHotkey, a);
        b.mon(b.getEl(), "keyup", a.updateHotkey, a)
    },
    focus: function(a, b) {
        if (b.grid) {
            a.enableHotKeyByFocusGrid(b.grid)
        } else {
            if (b.from) {
                a.enableHotKeyByFocusDataView(b.from)
            } else {
                a.getEl().focus()
            }
        }
    },
    disableUpateDDText: function(a) {
        var b = SYNO.webfm.SmartDDMVCPMgr;
        b.blDisableUpadte = a
    },
    isEnable: function() {
        var a = SYNO.SDS.UserSettings.getProperty("SYNO.SDS.App.PersonalSettings.Instance", "enablesmartmvcp");
        return a
    },
    onDragOver: function(c) {
        var d = c.browserEvent.ctrlKey;
        var a = c.browserEvent.shiftKey;
        var b = SYNO.webfm.SmartDDMVCPMgr;
        if (!d && !a) {
            b.action = b.defaultAction;
            b.blHotkey = false
        }
        if (d && b.action == "move") {
            b.blHotkey = true;
            b.action = "copy"
        }
        if (a && b.action == "copy") {
            b.blHotkey = true;
            b.action = "move"
        }
        b.updateDDText()
    },
    updateHotkey: function(b) {
        var a = SYNO.webfm.SmartDDMVCPMgr;
        if (!a.isEnable() || !b || ("keydown" === b.type && !b.ctrlKey && !b.shiftKey) || ("keyup" === b.type && (b.ctrlKey || b.shiftKey))) {
            return
        }
        a.blCtrl = b.ctrlKey;
        a.blShift = b.shiftKey;
        a.updateHotkeyAction(b.type);
        a.updateDDText()
    },
    updateDefaultAction: function(b, a, e) {
        var d = SYNO.webfm.SmartDDMVCPMgr;
        var c = (d.blSrcReadOnly) ? "copy" : "move";
        if (a || e || (b && (d.sourceType !== b))) {
            c = "copy"
        }
        d.defaultAction = c
    },
    updateHotkeyAction: function(b) {
        var a = SYNO.webfm.SmartDDMVCPMgr;
        if (!a.blHotkey) {
            a.action = a.defaultAction
        }
        if ("copy" === a.action && "keydown" === b && a.blShift) {
            a.blHotkey = true;
            a.action = "move"
        } else {
            if ("move" === a.action && "keydown" === b && a.blCtrl) {
                a.blHotkey = true;
                a.action = "copy"
            } else {
                if ("keyup" === b) {
                    a.blHotkey = false;
                    a.action = a.defaultAction
                }
            }
        }
    },
    updateDDText: function() {
        var a = SYNO.webfm.SmartDDMVCPMgr;
        if (!a.blDisableUpadte && a.ghost && a.proxy && a.proxy.dropNotAllowed !== a.proxy.dropStatus) {
            a.ghost.update(String.format(a.getDDText(), Ext.util.Format.htmlEncode(a.filename)))
        }
    },
    getAction: function() {
        var a = SYNO.webfm.SmartDDMVCPMgr;
        var b = (a.blHotkey) ? a.action : a.defaultAction;
        return ("upload" === a.operation) ? "copy" : b
    },
    getDDText: function(c) {
        var a = SYNO.webfm.SmartDDMVCPMgr;
        var b = (a.blHotkey) ? a.action : a.defaultAction;
        var d = "";
        if (c) {
            d = _WFT("filetable", "filetable_copy_to") + " {0}";
            return d
        }
        if ("upload" === a.operation) {
            d = _WFT("filetable", "upload_ddtext")
        } else {
            if ("copy" === b) {
                if ("download" === a.operation) {
                    d = _WFT("filetable", "filetable_download") + " " + _WFT("filetable", "filetable_copy_to") + " {0}"
                } else {
                    d = _WFT("filetable", "filetable_copy_to") + " {0}"
                }
            } else {
                if ("move" === b) {
                    if ("download" === a.operation) {
                        d = _WFT("filetable", "filetable_download") + " " + _WFT("filetable", "filetable_move_to") + " {0}"
                    } else {
                        d = _WFT("filetable", "filetable_move_to") + " {0}"
                    }
                }
            }
        }
        return d
    },
    getSourceTypeByPath: function(b, f, h) {
        var a = 1,
            e;
        var g = (f || b.getCurrentDir()) + "/";
        var d = h || b.getCurrentSource();
        var c;
        if (SYNO.webfm.utils.isLocalSource(d)) {
            return d
        }
        if (SYNO.webfm.VFS.isVFSPath(g)) {
            return SYNO.webfm.utils.source.remotevfs
        }
        while (-1 !== (a = g.indexOf("/", a))) {
            e = g.substr(0, a);
            c = b.dirTree.getNodeById(d + e);
            if (c && c.attributes && ((c.attributes.type === SYNO.webfm.utils.source.remotev) || (c.attributes.mountType === "iso"))) {
                return SYNO.webfm.utils.source.remotev
            } else {
                if (c && c.attributes && ((c.attributes.type === SYNO.webfm.utils.source.remoter) || (c.attributes.mountType == "remote"))) {
                    return SYNO.webfm.utils.source.remoter
                }
            }
            a++
        }
        return d
    }
});
Ext.apply(SYNO.webfm.utils, {
    hotKey: "hotKey",
    source: {
        local: "local",
        localh: "localh",
        remote: "remote",
        remotes: "remotes",
        remotev: "remotev",
        remoter: "remoter",
        remotefav: "remotefav",
        remotevfs: "remotevfs"
    },
    snapshotTimeRenderer: function(i) {
        var h = /GMT\-(\d+)\.(\d+)\.(\d+)\-(\d+)\.(\d+)\.(\d+)/,
            a = /GMT(\+|\-)(\d+)\-(\d+)\.(\d+)\.(\d+)\-(\d+)\.(\d+)\.(\d+)/,
            b = new Date(),
            g, c, d, e, f;
        f = h.exec(i) || a.exec(i);
        if (!f || f.length < 7) {
            return i
        }
        g = (f.length === 7) ? 1 : 3;
        b.setUTCFullYear(f[g++]);
        b.setUTCMonth(parseInt(f[g++], 10) - 1);
        b.setUTCDate(f[g++]);
        b.setUTCHours(f[g++]);
        b.setUTCMinutes(f[g++]);
        b.setUTCSeconds(f[g++]);
        if (f.length > 7) {
            c = f[1] === "+" ? -1 : 1;
            d = parseInt(f[2].substr(0, 2), 10);
            e = f[2].length > 2 ? parseInt(f[2].substr(2), 10) : 0;
            b = b.add(Date.HOUR, c * d);
            b = b.add(Date.MINUTE, c * e)
        }
        return b.toLocaleString()
    },
    isRemoteSource: function(a) {
        var b = SYNO.webfm.utils.source;
        return (a && a.substr(0, 6) === b.remote && a !== b.remotes)
    },
    isLocalSource: function(a) {
        var b = SYNO.webfm.utils.source;
        return (a && a.substr(0, 5) === b.local)
    },
    isFavSource: function(a) {
        var b = SYNO.webfm.utils.source;
        return (a.substr(0, 9) === b.remotefav)
    },
    isSharingUpload: function() {
        return !Ext.isEmpty(_S("sharing_id"))
    },
    isSupportFileSystem: function() {
        if (window.requestFileSysteme || window.webkitRequestFileSystem || window.mozRequestFileSystem) {
            return true
        }
        return false
    },
    isSupportMultiDownload: function() {
        if (SYNO.webfm.utils.isSupportFileSystem() && 0 === AppletProgram.blJavaPermission && !_S("standalone") && !Ext.isMac) {
            return true
        }
        return false
    },
    getWebAPIErrStr: function(a, c, b) {
        if (!c) {
            return _WFT("error", "error_error_system")
        }
        switch (c.code) {
            case 400:
                return _WFT("error", "error_error_system");
            case 401:
                return _WFT("error", "error_error_system");
            case 402:
                return _WFT("error", "error_error_system");
            case 403:
                return _WFT("error", "error_invalid_user_group");
            case 404:
                return _WFT("error", "error_invalid_user_group");
            case 405:
                return _WFT("error", "error_invalid_user_group");
            case 406:
                return _WFT("error", "error_testjoin");
            case 407:
                return _WFT("error", "error_privilege_not_enough");
            case 408:
                return _WFT("error", "error_no_path");
            case 409:
                return _WFT("error", "error_privilege_not_enough");
            case 410:
                return _WFT("error", "conn_rv_fail");
            case 411:
                return _WFT("error", "error_fs_ro");
            case 412:
                return _WFT("error", "error_long_path");
            case 413:
                return _WFT("error", "error_encryption_long_path");
            case 414:
                return _WFT("error", "error_file_exist");
            case 415:
                return _WFT("error", "error_quota_not_enough");
            case 416:
                return _WFT("error", "error_space_not_enough");
            case 417:
                return _WFT("error", "error_io");
            case 418:
                return _WFT("error", "error_reserved_name");
            case 419:
                return _WFT("error", "error_fat_reserved_name");
            case 420:
                return _WFT("error", "error_error_system");
            case 421:
                return _WFT("error", "error_folder_busy");
            case 422:
                return _WFT("error", "not_support");
            case 423:
                return _WFT("error", "volume_no_volumes");
            case 424:
                return _WFT("error", "umount_fail");
            case 425:
                return _WFT("error", "disconnect_fail");
            case 426:
                return _WFT("error", "mount_iso_fail");
            case 427:
                return _WFT("property", "error_save_property");
            case 428:
                return _WFT("error", "error_mp_external");
            case 429:
                return _WFT("error", "error_mp_encshare");
            case 430:
                return _WFT("error", "error_mp_mp");
            case 431:
                return _WFT("error", "mount_fail_reach_limit");
            case 432:
                return _WFT("mount", "err_user_home");
            case 433:
                return _WFT("mount", "err_cloud_station");
            case 434:
                return _WFT("error", "error_mp_share");
            case 435:
                return _WFT("mount", "invalid_local_host");
            case 436:
                return _WFT("mount", "bad_remote_folder");
            case 437:
                return _WFT("error", "error_mp_nfs");
            case 438:
                return _WFT("mount", "err_permission_denied");
            case 439:
                return _WFT("error", "mount_remote_fail_reach_limit");
            case 440:
                return _WFT("mount", "err_no_such_device");
            case 441:
                return _WFT("error", "mount_point_not_empty");
            case 442:
                return _WFT("error", "error_dest_no_path");
            case 443:
                return _WFT("error", "error_acl_volume_not_support");
            case 444:
                return _WFT("error", "error_fat_privilege");
            case 445:
                return _WFT("error", "error_remote_privilege");
            case 446:
                return _WFT("error", "error_no_shared_folder");
            case 447:
                return String.format(_WFT("acl_editor", "error_privilage_mode"), c.errno.arg);
            case 448:
                return _WFT("property", "error_invalid_domain_user");
            case 449:
                return _WFT("property", "error_invalid_domain_group");
            case 450:
                return _WFT("mount", "config_remote_warning");
            case 451:
                return _WFT("error", "nfs_conn_rv_fail");
            case 599:
                return "";
            case 600:
                return _WFT("search", "no_search_cache");
            case 800:
                return String.format(_WFT("favorite", "same_favorite_path"), Ext.util.Format.htmlEncode(c.errors[0].path), Ext.util.Format.htmlEncode(c.errors[0].name));
            case 801:
                return String.format(_WFT("favorite", "same_favorite_name"), Ext.util.Format.htmlEncode(c.errors[0].name));
            case 802:
                return _WFT("favorite", "over_limit");
            case 900:
                return _WFT("error", "delete_error_rmdir");
            case 1004:
                return _WFT("error", "error_overwrite_fail");
            case 1005:
                return _WFT("error", "error_select_conflict");
            case 1006:
                return _WFT("error", "mvcp_filename_illegal");
            case 1007:
                return _WFT("error", "mvcp_file_too_big");
            case 1100:
                return _WFT("error", "error_error_system");
            case 1101:
                return _WFT("error", "error_too_many_folder");
            case 1200:
                return _WFT("error", "error_error_system");
            case 1300:
                return _WFT("error", "error_error_system");
            case 1301:
                return _WFT("compress", "compress_error_long_name");
            case 1400:
                return _WFT("error", "error_error_system");
            case 1401:
                return _WFT("error", "error_invalid_archive");
            case 1402:
                return _WFT("error", "error_invalid_archive_data");
            case 1403:
                return _WFT("error", "extract_passwd_missing");
            case 1404:
                return _WFT("error", "error_error_system");
            case 1405:
                return _WFT("error", "error_error_system");
            case 1800:
                return _WFT("upload", "upload_error_data");
            case 1801:
                return _WFT("upload", "upload_error_timeout");
            case 1802:
                return _WFT("upload", "upload_nofile");
            case 1803:
                return _WFT("connections", "kick_connection");
            case 1804:
                return _WFT("error", "mvcp_file_too_big");
            case 1805:
                return _WFT("error", "error_select_conflict");
            case 1806:
                return _WFT("error", "upload_add_vfs_queue");
            case 1807:
                return _WFT("error", "error_io");
            case 1808:
                return _WFT("error", "upload_zero_size_file_error");
            case 1809:
                return _WFT("error", "error_file_exist");
            case 1810:
                return _WFT("upload", "upload_nofile");
            case 1811:
                return _WFT("error", "error_no_path");
            case 1812:
                return _WFT("upload", "upload_exceed_maximum_filesize");
            case 1813:
                return _WFT("extract", "extract_file_exist");
            case 1900:
                return _WFT("error", "download_add_vfs_queue");
            case 2001:
                return _WFT("error", "over_account_limit");
            case 2002:
                return _WFT("error", "unknown_db_error");
            case 2100:
                return _WFT("error", "vfs_no_such_server");
            case 2101:
                return _WFT("error", "vfs_duplicated_connection");
            case 2102:
                return _WFT("error", "vfs_authentication_failed");
            case 2103:
                return _WFT("error", "vfs_host_unreachable");
            case 2104:
                return _WFT("error", "vfs_connection_refused");
            case 2105:
                return _WFT("error", "vfs_read_config_failed");
            case 2106:
                return _WFT("error", "vfs_write_config_failed");
            case 2107:
                return _WFT("error", "vfs_wrong_fingerprint");
            case 2108:
                return _WFT("error", "vfs_identity_wrong");
            case 2109:
                return _WFT("error", "vfs_conn_rv_fail");
            case 2110:
                return _WFT("error", "vfs_reach_max_server_per_protocol");
            case 2111:
                return _WFT("error", "vfs_proxy_authentication_failed");
            case 2112:
                return _WFT("error", "vfs_err_ca_wrong");
            case 2113:
                return _WFT("error", "vfs_duplicated_profile");
            case 2114:
                return _WFT("error", "vfs_root_ioerror");
            case 2115:
                return _WFT("error", "vfs_token_expired");
            case 2116:
                return _WFT("error", "vfs_filesize_too_large");
            case 2117:
                return _T("ddsm", "unsupport_on_non_privileged_mode");
            case 2118:
                return _T("login", "error_maxtried");
            case 2119:
                return _WFT("error", "mvcp_filename_illegal");
            default:
                return _WFT("error", "error_error_system")
        }
    },
    getWebAPIErr: function(h, d, b) {
        var j, f, a, e, g, c, k;
        if (!h) {
            if (!d) {
                return _WFT("error", "error_error_system")
            } else {
                if (d && d.code < 400) {
                    return SYNO.API.CheckResponse(h, d, b)
                } else {
                    j = d.errors;
                    if (d.code !== 800 && d.code !== 801 && j && Ext.isArray(j) && j && 0 < j.length) {
                        c = (j.length > 15) ? 15 : j.length;
                        g = _WFT("error", "error_files");
                        for (f = 0; f < c; f++) {
                            e = j[f];
                            if (!e.path) {
                                continue
                            }
                            k = e.path;
                            if (k.length > 52) {
                                k = '<span ext:qtip="' + Ext.util.Format.htmlEncode(Ext.util.Format.htmlEncode(e.path)) + '">' + Ext.util.Format.htmlEncode(k.substr(0, 25) + " ... " + k.substr(k.length - 25)) + "</span>"
                            } else {
                                k = Ext.util.Format.htmlEncode(k)
                            }
                            g += "<br>" + k;
                            a = SYNO.webfm.utils.getWebAPIErr(h, e, b);
                            if (a) {
                                g += "&nbsp;(" + a + ")"
                            }
                        }
                        if (c < j.length) {
                            g += "<br>..."
                        }
                    }
                    if (!g) {
                        g = SYNO.webfm.utils.getWebAPIErrStr(h, d, b)
                    }
                    return g
                }
            }
        }
    },
    isCompressFile: function(a, d) {
        d = d.toLowerCase();
        if (-1 !== SYNO.webfm.utils.archive_type.indexOf(d)) {
            return true
        }
        var b = a.split("."),
            c;
        if (2 < b.length) {
            c = b[b.length - 1].toLowerCase();
            if (-1 !== SYNO.webfm.utils.archive_type.indexOf(c) && (d === "001" || d === "000")) {
                return true
            }
        }
        return false
    },
    getPathSeparator: function(b) {
        var a = b ? SYNO.webfm.utils.isLocalSource(b) : false;
        return (a && Ext.isWindows) ? "\\" : "/"
    },
    checkFileLen: function(b, c) {
        var a = window.unescape(encodeURIComponent(b)).length;
        if (c) {
            a += c
        }
        return (a <= 255)
    },
    getLangText: function(a) {
        return _WFT(a.section, a.key)
    },
    isNameReserved: function(b) {
        var a = b.toLowerCase();
        return ("@eaDir" == a)
    },
    isNameCharIllegal: function(a) {
        if (-1 != a.indexOf("/")) {
            return true
        } else {
            return false
        }
    },
    ParseArrToFileName: function(d, c, e) {
        var a = e ? e : "/";
        var g = [],
            f, b;
        for (b = 0; b < d.length; b++) {
            g.push(SYNO.webfm.utils.parseFullPathToFileName(d[b], a))
        }
        f = g.join(", ");
        return f
    },
    ParseArr: function(c, b) {
        var d = [],
            a;
        for (a = 0; a < c.length; a++) {
            d.push(c[a].get(b))
        }
        return d
    },
    ParsePairArr: function(d, c, b) {
        var e = [],
            a;
        for (a = 0; a < d.length; a++) {
            e.push({
                file: d[a].get(c),
                path: b[a]
            })
        }
        return e
    },
    ParseArrToJSON: function(c, b) {
        var d = [],
            a;
        for (a = 0; a < c.length; a++) {
            d.push(c[a].get(b))
        }
        return Ext.util.JSON.encode(d)
    },
    isConflictTargetPath: function(e, b, d) {
        var a = d ? d : "/";
        var c = "";
        var g = "";
        if (b.length < e.length) {
            var f = e.lastIndexOf(a);
            if (d === "\\" && e[f - 1] === ":") {
                f++
            }
            g = e.substring(f);
            return (b + g == e)
        } else {
            if (b.length == e.length) {
                return (b == e)
            } else {
                c = b.substring(0, e.length);
                g = b.substring(e.length);
                return ((c == e) && (a == g.charAt(0)))
            }
        }
    },
    isSubNotEqualPath: function(e, b, d) {
        var a = d ? d : "/";
        var c = "";
        var f = "";
        if (b.length <= e.length) {
            return false
        } else {
            c = b.substring(0, e.length);
            f = b.substring(e.length);
            return ((c == e) && (a == f.charAt(0)))
        }
    },
    getParentDirArr: function(g, e) {
        var b = e ? e : "/";
        var a = [];
        var h = -1;
        var f = "";
        if (!(g instanceof Array)) {
            h = g.lastIndexOf(b);
            f = g.substring(0, h);
            if ("\\" === b && -1 === f.indexOf(b)) {
                f += "\\"
            }
            a.push(f);
            return a
        }
        var d = g[0].data || g[0];
        a = this.getParentDirArr(d.file_id, b);
        for (var c = 0; c < g.length; c++) {
            d = g[c].data || g[c];
            if (!(d.isdir)) {
                continue
            }
            f = d.file_id;
            h = f.lastIndexOf(b);
            f = f.substring(0, h);
            if ("\\" === b && -1 === f.indexOf(b)) {
                f += "\\"
            }
            if (!this.strElementInArray(f, a)) {
                a.push(f)
            }
        }
        return a
    },
    strElementInArray: function(c, a) {
        for (var b = 0; b < a.length; b++) {
            if (c == a[b]) {
                return true
            }
        }
        return false
    },
    replaceDLNameSpecChars: function(a) {
        var b = Ext.isWindows ? /[\/\\\:\?\>\<\*\"\|]/g : /[\/\\\:]/g;
        return a.replace(b, "-")
    },
    checkIfNeedRedirect: function(c, a, b) {
        if ((b && "login" == c) || ("error" == c && "error_testjoin" == a)) {
            if ("true" == _S("customized")) {
                window.location = "webUI/logout.cgi"
            } else {
                window.location = "/index.cgi"
            }
            alert(_WFT(c, a));
            return true
        }
        return false
    },
    parseFullPathToFileName: function(d, c) {
        var b = c ? c : "/";
        var a = "";
        var e = d.lastIndexOf(b);
        if (-1 == e) {
            e = d.lastIndexOf(b === "\\" ? "/" : "\\")
        }
        a = d.substring(e + 1);
        return a
    },
    isParentDir: function(d, c) {
        if (!d || !c) {
            return false
        }
        var b = d.lastIndexOf("/");
        if (-1 === b || 0 === b) {
            return false
        }
        var a = d.substring(0, b);
        return (a == c)
    },
    isWinParentDir: function(d, c) {
        if (!d || !c) {
            return false
        }
        var b = d.lastIndexOf("\\");
        if (b < 2) {
            return false
        }
        var a;
        if (d.length != 3) {
            a = d.substring(0, b + 1)
        } else {
            a = d
        }
        return (a == c)
    },
    utfencode: function(b) {
        b = b.replace(/\r\n/g, "\n");
        var a = "";
        for (var e = 0; e < b.length; e++) {
            var d = b.charCodeAt(e);
            if (d < 128) {
                a += String.fromCharCode(d)
            } else {
                if ((d > 127) && (d < 2048)) {
                    a += String.fromCharCode((d >> 6) | 192);
                    a += String.fromCharCode((d & 63) | 128)
                } else {
                    a += String.fromCharCode((d >> 12) | 224);
                    a += String.fromCharCode(((d >> 6) & 63) | 128);
                    a += String.fromCharCode((d & 63) | 128)
                }
            }
        }
        return a
    },
    bin2hex: function(d) {
        d = SYNO.webfm.utils.utfencode(d);
        var c, e = 0,
            b = [];
        d += "";
        e = d.length;
        for (c = 0; c < e; c++) {
            b[c] = d.charCodeAt(c).toString(16).replace(/^([\da-f])$/, "0$1")
        }
        return b.join("")
    },
    checkPointInBox: function(c, b, a) {
        if (b < c.x || a < c.y) {
            return false
        }
        return ((c.right > b) && (c.bottom > a))
    },
    getBaseName: function(e, d) {
        var c = d ? d : "/";
        if (!Ext.isDefined(e)) {
            return ""
        }
        var b = "";
        var a = e.lastIndexOf(c);
        if (a != -1) {
            b = e.substr(a + 1)
        }
        return b
    },
    getExt: function(b) {
        var c = SYNO.webfm.utils.getBaseName(b);
        b = !c ? b : c;
        var a = b.lastIndexOf(".");
        if (-1 === a) {
            return ""
        }
        return b.substr(a + 1).toLowerCase()
    },
    getFullSize: function(a) {
        var b = 0;
        b = parseFloat(a);
        if (!Ext.isString(a)) {
            return b
        }
        if (a.indexOf("KB") > 0) {
            b *= 1024
        } else {
            if (a.indexOf("MB") > 0) {
                b *= 1048576
            } else {
                if (a.indexOf("GB") > 0) {
                    b *= 1073741824
                }
            }
        }
        return b
    },
    doesIncludeMountPoint: function(a) {
        if (a) {
            Ext.each(a, function(b) {
                if (b.data && "" !== b.data.mountType) {
                    return true
                }
            })
        }
        return false
    },
    getSupportedLanguage: function() {
        var a = SYNO.SDS.Utils.getSupportedLanguageCodepage();
        a.push(["utf8", _WFT("codepage", "unicode")]);
        return a
    },
    transNodeToRecs: function(b) {
        var k = b.attributes.path || "";
        var g = b.attributes.real_path;
        var a = b.attributes.name;
        var f = b.attributes.uid;
        var e = b.attributes.gid;
        var i = b.attributes.right;
        var j = b.attributes.ftpright;
        var c = b.attributes.isMountPoint;
        var d = b.attributes.mountType;
        var h = [];
        h[0] = new Ext.data.Record({
            uid: f,
            gid: e,
            isdir: true,
            ftpright: j,
            fileprivilege: i,
            file_id: k,
            real_path: g,
            isMountPoint: c,
            mountType: d,
            filename: a,
            size: 0
        });
        return h
    },
    isShareByPath: function(a) {
        if (-1 === (a.indexOf("/", 1))) {
            return true
        }
        return false
    },
    getRemoteTreeParams: function(c, b, a) {
        delete c.baseParams.folder_path;
        delete c.baseParams.type;
        if (a) {
            c.api = "SYNO.FileStation.VirtualFolder";
            c.method = "list";
            c.version = 2;
            c.dataroot = ["data", "folders"];
            c.baseParams.type = a
        } else {
            if (b.id === "fm_fav_root") {
                c.api = "SYNO.FileStation.Favorite";
                c.method = "list";
                c.version = 2;
                c.dataroot = ["data", "favorites"];
                c.baseParams.enum_cluster = true
            } else {
                if (b.id === "fm_root") {
                    c.api = "SYNO.FileStation.List";
                    c.method = "list_share";
                    c.version = 2;
                    c.dataroot = ["data", "shares"]
                } else {
                    if (b.id === "fm_rf_root") {
                        c.api = "SYNO.FileStation.VirtualFolder";
                        c.method = "list";
                        c.version = 2;
                        c.dataroot = ["data", "folders"];
                        c.baseParams.type = ["cifs", "nfs"]
                    } else {
                        if (b.id === "fm_vd_root") {
                            c.api = "SYNO.FileStation.VirtualFolder";
                            c.method = "list";
                            c.version = 2;
                            c.dataroot = ["data", "folders"];
                            c.baseParams.type = "iso"
                        } else {
                            c.api = "SYNO.FileStation.List";
                            c.method = "list";
                            c.version = 2;
                            c.dataroot = ["data", "files"];
                            c.baseParams.folder_path = b.attributes.path
                        }
                    }
                }
            }
        }
    },
    parseRemoteTreeNode: function(b, f) {
        if (!f) {
            return
        }
        var a = b.additional;
        b.leaf = false;
        if (f.id === "fm_root") {
            b.draggable = false
        } else {
            b.draggable = true
        }
        var e = "";
        if (f.attributes.type) {
            e = f.attributes.type
        }
        switch (f.id) {
            case "fm_fav_root":
                e = SYNO.webfm.utils.source.remotefav + b.name;
                break;
            case "fm_vd_root":
                e = SYNO.webfm.utils.source.remotev;
                break;
            case "fm_rf_root":
                e = SYNO.webfm.utils.source.remoter;
                b.draggable = false;
                break;
            default:
                if (f.parentNode.id === "fm_top_root") {
                    e = SYNO.webfm.utils.source.remote
                }
                break
        }
        b.id = e + b.path;
        b.type = e;
        b.text = b.name;
        b.qtip = b.text;
        if (b.children && b.children.files) {
            b.children = b.children.files
        }
        if (!a) {
            return b
        }
        if (a.volume) {
            b.qtip = String.format("{0} @{1}", b.qtip, a.volume)
        }
        if (a.volume_status) {
            var d = a.volume_status;
            if (d.totalspace && d.freespace) {
                b.qtip = String.format("{0}, {1}", b.qtip, String.format(_T("filetable", "space_size"), Ext.util.Format.fileSize(d.freespace), Ext.util.Format.fileSize(d.totalspace)))
            }
        }
        b.real_path = a.real_path;
        b.isMountPoint = !Ext.isEmpty(a.mount_point_type);
        b.mountType = a.mount_point_type;
        if (a.time) {
            b.mt = a.time.mtime;
            b.at = a.time.atime;
            b.ct = a.time.crtime
        }
        if (a.perm) {
            if (a.perm.posix) {
                b.privilege = a.perm.posix
            }
            if (a.perm.acl) {
                var c = a.perm.acl,
                    g;
                if (c.append) {
                    g |= SYNO.webfm.utils.Mode_Append
                }
                if (c.del) {
                    g |= SYNO.webfm.utils.Mode_Del
                }
                if (c.exec) {
                    g |= SYNO.webfm.utils.Mode_Exec
                }
                if (c.read) {
                    g |= SYNO.webfm.utils.Mode_Read
                }
                if (c.write) {
                    g |= SYNO.webfm.utils.Mode_Write
                }
                b.right = g
            }
            if (a.perm.share_right) {
                b.right = a.perm.share_right
            }
            if (Ext.isBoolean(a.perm.acl_enable)) {
                b.isACLPrivilege = a.perm.acl_enable
            }
            b.ftpright = 0;
            if (a.perm && a.perm.adv_right) {
                if (Ext.isBoolean(a.perm.adv_right.disable_download)) {
                    if (a.perm.adv_right.disable_download) {
                        b.ftpright |= SYNO.webfm.utils.FTP_PRIV_DISABLE_DOWNLOAD
                    }
                    b.is_disable_download = a.perm.adv_right.disable_download
                }
                if (Ext.isBoolean(a.perm.adv_right.disable_modify)) {
                    if (a.perm.adv_right.disable_modify) {
                        b.ftpright |= SYNO.webfm.utils.FTP_PRIV_DISABLE_MODIFY
                    }
                    b.is_disable_modify = a.perm.adv_right.disable_modify
                }
                if (Ext.isBoolean(a.perm.adv_right.disable_list)) {
                    if (a.perm.adv_right.disable_list) {
                        b.ftpright |= SYNO.webfm.utils.FTP_PRIV_DISABLE_LIST
                    }
                    b.bldisablesearch = true;
                    b.is_disable_list = a.perm.adv_right.disable_list
                }
            }
        }
        if (a.owner) {
            b.owner = a.owner.user;
            b.group = a.owner.group;
            b.uid = a.owner.uid;
            b.gid = a.owner.gid
        }
        if (Ext.isBoolean(a.sync_share)) {
            b.is_sync_share = a.sync_share
        }
        b.bldisablesearch = false;
        if (SYNO.webfm.utils.isRecycleBinFolder(b.path)) {
            b.bldisablesearch = true
        }
        if (b.isMountPoint && b.mountType) {
            if ("iso" == b.mountType) {
                b.cls = "isomountpoint_node"
            } else {
                if ("remote" == b.mountType) {
                    b.cls = "remotemountpoint_node"
                } else {
                    if ("remotefail" == b.mountType) {
                        b.cls = "remotefailmountpoint_node"
                    }
                }
            }
        }
        if (f.attributes.isMountPoint) {
            SYNO.webfm.utils.updateRemoteMountIconByNode(f)
        }
        if (b.status === "broken") {
            b.cls = "tree-node-broken-folder"
        }
        SYNO.webfm.utils.IndexFolderMap[b.path] = a.indexed || false;
        return b
    },
    isRecycleBinFolder: function(b) {
        if (!b) {
            return false
        }
        var a = b.split("/", 7);
        return (a.length === 3 && a[2] === "#recycle") || (a.length === 4 && a[1] === "homes" && a[3] === "#recycle") || (a.length === 6 && a[1] === "homes" && a[5] === "#recycle")
    },
    isSnapshotFolder: function(a, c, b) {
        return this.isSnapshotShareFolder(a, c, b) || this.isSnapshotTopFolder(a, c)
    },
    isSnapshotShareFolder: function(b, d, c) {
        if (!b || !d || !c) {
            return false
        }
        var a = b.split("/", 7);
        return (a.length === 4 && a[2] === "#snapshot")
    },
    isSnapshotTopFolder: function(b, c) {
        if (!b || !c) {
            return false
        }
        var a = b.split("/", 7);
        return (a.length === 3 && a[2] === "#snapshot")
    },
    isWebFolder: function(a) {
        if (!a) {
            return false
        }
        if ("/" !== a[a.length - 1]) {
            a += "/"
        }
        if (0 === a.indexOf("/web/") || 0 === a.indexOf("/home/www/")) {
            return true
        }
        if (0 === a.indexOf("/homes/") && -1 !== a.indexOf("/www/")) {
            return true
        }
        return false
    },
    createCAErrorMsg: function(b) {
        var a = new Date();
        var c = _WFT("error", "vfs_ca_unknown") + "<br>";
        c += _T("certificate", "server_crt") + ":<br>";
        c += String.format(_WFT("vfs", "vfs_ca_subject"), b.subject) + "<br>";
        c += String.format(_WFT("vfs", "vfs_ca_issuer"), b.issuer) + "<br>";
        if (b.availDate > a.getTime() / 1000 || b.expDate < a.getTime() / 1000) {
            c += String.format(_WFT("vfs", "vfs_ca_availdate"), this.getTimeFormat(b.availDate * 1000)) + "<br>";
            c += String.format(_WFT("vfs", "vfs_ca_expdate"), this.getTimeFormat(b.expDate * 1000)) + "<br>"
        }
        return c
    },
    getThumbName: function(d) {
        var b = "misc.png";
        if (d.isdir) {
            var c = d.mountType;
            if (!Ext.isEmpty(c)) {
                switch (c) {
                    case "remote":
                        return "remotemountpoint.png";
                    case "remotefail":
                        return "remotefailmountpoint.png";
                    case "iso":
                        return "isomountpoint.png"
                }
            }
            if (SYNO.webfm.utils.isRecycleBinFolder(d.path)) {
                return "recycle_bin.png"
            }
            if (SYNO.webfm.utils.isSnapshotFolder(d.path, d.is_snapshot, d.is_btrfs_subvol)) {
                return "snapshot.png"
            }
            return "folder.png"
        }
        var a = d.type;
        if (!a) {
            return b
        }
        a = a.toLowerCase();
        if (-1 !== SYNO.webfm.utils.icon_type.indexOf(a)) {
            return a + ".png"
        }
        return b
    },
    onMailTo: function(c) {
        var b = "My DS Shared File Links";
        var d = c;
        var a = "mailto:?subject=" + b + "&body=" + d;
        window.open(a, "_blank")
    },
    handleRemoteConnectionException: function(f, c, h, i, j, k, d) {
        var e = SYNO.API.Util.GetFirstError(f);
        var g = function(l) {
            if ("yes" !== l) {
                j.call(this);
                return
            }
            if (!d) {
                h.sendWebAPI({
                    timeout: 3600000,
                    api: "SYNO.FileStation.VFS.Connection",
                    method: "create",
                    version: 1,
                    params: {
                        profile_id: c.id,
                        force: true
                    },
                    encryption: ["password", "access_token", "refresh_token"],
                    scope: k,
                    callback: function(p, m, o, n) {
                        i.call(this)
                    }
                })
            } else {
                i.call(this)
            }
        };
        var a = function(m) {
            if ("yes" !== m) {
                j.call(this);
                return
            }
            var n = c.id;
            var o = SYNO.webfm.VFS.getSchemaFromPath(c.id);
            var l = function(p) {
                p.id = n;
                var q = [{
                    timeout: 3600000,
                    api: "SYNO.FileStation.VFS.Connection",
                    method: "set",
                    version: 1,
                    params: p
                }, {
                    api: "SYNO.FileStation.VFS.Profile",
                    method: "set",
                    version: 1,
                    params: p
                }];
                h.sendWebAPI({
                    params: {},
                    compound: {
                        stopwhenerror: true,
                        params: q
                    },
                    encryption: ["password", "access_token", "refresh_token"],
                    scope: k,
                    callback: function(u, r, t, s) {
                        if (h.isDestroyed) {
                            return
                        }
                        i.call(k)
                    }
                })
            };
            SYNO.webfm.utils.startOAuth(o, l, k)
        };
        var b = function(m) {
            if ("yes" !== m) {
                j.call(this);
                return
            }
            var l = new SYNO.FileStation.RemoteConnection.EditDialog({
                owner: h,
                title: _WFT("vfs", "edit_profile")
            });
            this.mon(l, "editcomplete", i.createDelegate(k));
            l.load(c.id)
        };
        switch (e.code) {
            case 2102:
                h.getMsgBox().confirm("", _WFT("error", "vfs_confirm_edit_profile"), b, k);
                break;
            case 2107:
                h.getMsgBox().confirm("", String.format(_WFT("error", "vfs_identity_unknown"), e.errors[0].fingerprint), g, k);
                break;
            case 2112:
                h.getMsgBox().confirm("", SYNO.webfm.utils.createCAErrorMsg(e.errors[0]), g, k);
                break;
            case 2115:
                h.getMsgBox().confirm("", _WFT("error", "vfs_confirm_refresh_oauth"), a, k);
                break;
            default:
                break
        }
    },
    startOAuth: function(g, f, c) {
        var a = window.location.href.indexOf("/", window.location.protocol.length + 2);
        var d = window.location.href.slice(0, a);
        if (_S("rewrite_mode")) {
            var e = window.location.href.indexOf("/", a + 1);
            if (-1 !== e) {
                var b = window.location.href.slice(a, e);
                d += b
            }
        }
        window._webfmOAuthCallback = function(h) {
            h.protocol = g;
            f.call(c, h)
        };
        window.open("https://synooauth.synology.com/FileStation/Cloud/login.php?" + Ext.urlEncode({
            major: _S("majorversion"),
            minor: _S("minorversion"),
            version: _S("version"),
            fullversion: _S("fullversion"),
            unique: _D("unique"),
            timezone: _D("timezone"),
            callback: "_webfmOAuthCallback",
            host: d,
            type: g
        }), "mywindow", "menubar=1,resizable=0,width=600,height=520, top=100, left=300")
    },
    updateRemoteMountIconByNode: function(a) {
        if (a && a.ui && a.ui.elNode && "remotefail" === a.attributes.mountType) {
            if (Ext.fly(a.ui.elNode).hasClass("remotefailmountpoint_node")) {
                Ext.fly(a.ui.elNode).replaceClass("remotefailmountpoint_node", "remotemountpoint_node");
                a.attributes.mountType = "remote"
            }
        }
    }
});
SYNO.webfm.utils.FTP_PRIV_DISABLE_LIST = 1;
SYNO.webfm.utils.FTP_PRIV_DISABLE_MODIFY = 2;
SYNO.webfm.utils.FTP_PRIV_DISABLE_DOWNLOAD = 4;
SYNO.webfm.utils.NA = 1;
SYNO.webfm.utils.RW = 2;
SYNO.webfm.utils.RO = 4;
SYNO.webfm.utils.Mode_Exec = 1;
SYNO.webfm.utils.Mode_Write = 2;
SYNO.webfm.utils.Mode_Read = 4;
SYNO.webfm.utils.Mode_Append = 8;
SYNO.webfm.utils.Mode_Del = 512;
SYNO.webfm.utils.Mode_All = 8191;
SYNO.webfm.utils.ReqPrivilege = {};
SYNO.webfm.utils.ReqPrivilege.SrcFolder = {};
SYNO.webfm.utils.ReqPrivilege.DestFolder = {};
SYNO.webfm.utils.ReqPrivilege.SrcFile = {};
SYNO.webfm.utils.ReqPrivilege.DestFolder.Create = SYNO.webfm.utils.Mode_Exec | SYNO.webfm.utils.Mode_Append;
SYNO.webfm.utils.ReqPrivilege.SrcFile.Copy = SYNO.webfm.utils.Mode_Read;
SYNO.webfm.utils.ReqPrivilege.DestFolder.Copy = SYNO.webfm.utils.Mode_Write | SYNO.webfm.utils.Mode_Exec;
SYNO.webfm.utils.ReqPrivilege.DestFolder.CopyDir = SYNO.webfm.utils.Mode_Read | SYNO.webfm.utils.Mode_Exec;
SYNO.webfm.utils.ReqPrivilege.SrcFile.Move = SYNO.webfm.utils.Mode_Del;
SYNO.webfm.utils.ReqPrivilege.DestFolder.Move = SYNO.webfm.utils.Mode_Write | SYNO.webfm.utils.Mode_Exec;
SYNO.webfm.utils.ReqPrivilege.DestFolder.MoveDir = SYNO.webfm.utils.Mode_Read | SYNO.webfm.utils.Mode_Exec;
SYNO.webfm.utils.ReqPrivilege.SrcFile.Delete = SYNO.webfm.utils.Mode_Del;
SYNO.webfm.utils.ReqPrivilege.DestFolder.Upload = SYNO.webfm.utils.Mode_Write | SYNO.webfm.utils.Mode_Exec;
SYNO.webfm.utils.ReqPrivilege.DestFolder.UploadDir = SYNO.webfm.utils.Mode_Exec | SYNO.webfm.utils.Mode_Append;
SYNO.webfm.utils.ReqPrivilege.SrcFile.Download = SYNO.webfm.utils.Mode_Read;
SYNO.webfm.utils.ReqPrivilege.SrcFolder.Download = SYNO.webfm.utils.Mode_Read | SYNO.webfm.utils.Mode_Exec;
SYNO.webfm.utils.ReqPrivilege.DestFolder.Navigate = SYNO.webfm.utils.Mode_Exec;
SYNO.webfm.utils.ReqPrivilege.SrcFile.Extract = SYNO.webfm.utils.Mode_Read;
SYNO.webfm.utils.ReqPrivilege.DestFolder.Extract = SYNO.webfm.utils.Mode_Read | SYNO.webfm.utils.Mode_Write | SYNO.webfm.utils.Mode_Exec;
SYNO.webfm.utils.ReqPrivilege.DestFolder.ExtractDir = SYNO.webfm.utils.Mode_Read | SYNO.webfm.utils.Mode_Write | SYNO.webfm.utils.Mode_Exec;
SYNO.webfm.utils.ReqPrivilege.SrcFile.Compress = SYNO.webfm.utils.Mode_Read;
SYNO.webfm.utils.ReqPrivilege.SrcFolder.Compress = SYNO.webfm.utils.Mode_Read | SYNO.webfm.utils.Mode_Exec;
SYNO.webfm.utils.ReqPrivilege.DestFolder.Compress = SYNO.webfm.utils.Mode_Read | SYNO.webfm.utils.Mode_Write | SYNO.webfm.utils.Mode_Exec;
SYNO.webfm.utils.ReqPrivilege.SrcFile.ISO = SYNO.webfm.utils.Mode_Read;
SYNO.webfm.utils.ReqPrivilege.DestFolder.Mount = SYNO.webfm.utils.Mode_Read | SYNO.webfm.utils.Mode_Write | SYNO.webfm.utils.Mode_Exec;
SYNO.webfm.utils.IndexFolderMap = {};
SYNO.webfm.utils.checkShareRight = function(a, b) {
    var c;
    if (a == "NA") {
        c = SYNO.webfm.utils.NA
    } else {
        if (a == "RW") {
            c = SYNO.webfm.utils.RW
        } else {
            if (a == "RO") {
                c = SYNO.webfm.utils.RO
            }
        }
    }
    if (b & c) {
        return true
    }
    return false
};
SYNO.webfm.utils.checkFileRight = function(b) {
    if (_S("is_admin") === true || _S("domainUser") == "true") {
        return true
    }
    var c = b.right;
    var a = c & ~(SYNO.webfm.utils.Mode_All & ~b.needRight);
    if (a == b.needRight) {
        return true
    }
    return false
};
SYNO.webfm.utils.parseMode = function(c) {
    var e = 0;
    var b = 0,
        d = 0,
        a = 0;
    e = parseInt(c, 10);
    if (e >= 100) {
        b = Math.floor(e / 100);
        e -= b * 100
    }
    if (e >= 10) {
        d = Math.floor(e / 10);
        e -= d * 10
    }
    a = e;
    return {
        owner: b,
        group: d,
        others: a
    }
};
SYNO.webfm.utils.getShareRight = function(b, d) {
    if (d.parentNode.id === "fm_root") {
        return d.attributes.right
    }
    var e = d.attributes.path,
        f, a;
    if ((a = e.indexOf("/", 1)) != -1) {
        var c = e.substring(0, a);
        f = b.getNodeById(SYNO.webfm.utils.source.remote + c)
    } else {
        f = b.getNodeById(SYNO.webfm.utils.source.remote + e)
    }
    if (f) {
        return f.attributes.right
    }
    return null
};
SYNO.webfm.utils.IsFolderIndexed = function(a) {
    if (Ext.isEmpty(a)) {
        return false
    }
    return SYNO.webfm.utils.IndexFolderMap[a]
};
SYNO.webfm.utils.IsShareForceRO = function(b, d) {
    var a = d.indexOf("/", 1);
    if (a === -1) {
        return false
    }
    var c = b.getNodeById(SYNO.webfm.utils.source.remote + d.substring(0, a));
    if (c) {
        return c.attributes.additional.perm.is_share_readonly
    }
    return false
};
SYNO.webfm.utils.getShareRightBySPath = function(b, d) {
    var e, a;
    if ((a = d.indexOf("/", 1)) != -1) {
        var c = d.substring(0, a);
        e = b.getNodeById(SYNO.webfm.utils.source.remote + c)
    } else {
        e = b.getNodeById(SYNO.webfm.utils.source.remote + d)
    }
    if (e) {
        return e.attributes.right
    }
    return null
};
SYNO.webfm.utils.getShareFtpRight = function(a, b) {
    var c = b.attributes.path;
    return SYNO.webfm.utils.getShareFtpRightByPath(a, c)
};
SYNO.webfm.utils.getShareFtpRightByPath = function(b, d) {
    var e, a;
    if ((a = d.indexOf("/", 1)) != -1) {
        var c = d.substring(0, a);
        e = b.getNodeById(SYNO.webfm.utils.source.remote + c)
    } else {
        e = b.getNodeById(SYNO.webfm.utils.source.remote + d)
    }
    if (e) {
        return e.attributes.ftpright
    }
    return null
};
SYNO.webfm.utils.getZipName = function(b) {
    var a = b.lastIndexOf(".");
    b = b.substr(0, a);
    a = b.lastIndexOf(".");
    if (b.substr(a + 1).toLowerCase() == "tar") {
        b = b.substr(0, a)
    }
    return b
};
SYNO.webfm.utils.getImageName = function(b) {
    var a = b.lastIndexOf(".");
    if (-1 === a) {
        return ""
    }
    b = b.substr(0, a);
    return b
};
SYNO.webfm.utils.GridDropTarget = function(c, b, a) {
    this.webfm = a;
    SYNO.webfm.utils.GridDropTarget.superclass.constructor.call(this, c, b)
};
Ext.extend(SYNO.webfm.utils.GridDropTarget, Ext.dd.DropTarget, {
    notifyOverAndDrop: function(p, m, h, j, l, g) {
        var q = p.getProxy().getGhost();
        if (j.activeDS === j.remoteSearchDS && (l !== true)) {
            return this.dropNotAllowed
        }
        if (p.tree) {
            if (p.tree === j.dirTree || p.tree === j.dirLocalTree) {
                return this.dropNotAllowed
            }
            var i = h.node.parentNode;
            if (i && i.id === "fm_fav_root") {
                q.update(_WFT("favorite", "insert_invalid_favorite"));
                return this.dropNotAllowed
            }
        }
        var b = h.node,
            a = h.from || p.grid,
            o, f, d = b ? b.attributes.type : (a ? a.getStore().storetype : null),
            c = SYNO.webfm.utils.isLocalSource(j.activeDS.storetype),
            n = SYNO.webfm.utils.isLocalSource(d);
        if (g) {
            f = (g.blTgtTreeType) ? g.target.attributes.path : g.target.get("path")
        }
        if (a) {
            o = a.getSelectionModel().getSelections()
        }
        if (!c && n) {
            if (!this.webfm.onCheckVFSAction("upload", f)) {
                return this.dropNotAllowed
            }
        } else {
            if (c && !n) {
                if (!this.webfm.onCheckVFSAction("download", b || o)) {
                    return this.dropNotAllowed
                }
                var k = true;
                if (a) {
                    Ext.each(o, function(e) {
                        k = !this.webfm.checkFTPDownloadRightByPath(e.get("file_id"));
                        return k
                    }, this)
                } else {
                    if (b) {
                        if (this.webfm.checkFTPDownloadRight(b)) {
                            k = false
                        }
                    }
                }
                if (!k) {
                    q.update(_WFT("error", "error_privilege_not_enough"));
                    return this.dropNotAllowed
                }
            } else {
                if ((!SYNO.webfm.SmartDDMVCPMgr.isEnable() && !j.onCheckVFSAction("copy", b || o, f) && !j.onCheckVFSAction("move", b || o, f)) || (SYNO.webfm.SmartDDMVCPMgr.isEnable() && !j.onCheckVFSAction(SYNO.webfm.SmartDDMVCPMgr.getAction(), b || o, f))) {
                    return this.dropNotAllowed
                }
            }
        }
        return this.dropAllowed
    },
    updateDefalutDDText: function(a, f, c) {
        SYNO.webfm.SmartDDMVCPMgr.disableUpateDDText(true);
        var d = a.getProxy().getGhost();
        if (a.tree) {
            d.update("");
            c.node.ui.appendDDGhost(d.dom)
        } else {
            if (a.grid) {
                var b = a.grid.getDragDropText();
                d.update(b)
            } else {
                if (a.dataview) {
                    d.update(a.dataview.getDragDropText())
                }
            }
        }
    },
    notifyOut: function(a, c, b) {
        this.updateDefalutDDText(a, c, b)
    },
    notifyOver: function(w, u, z) {
        var g = this.webfm;
        var k, v, p;
        var j = false,
            x = true;
        var t = u.getTarget(),
            y;
        if (SYNO.webfm.SmartDDMVCPMgr.isEnable()) {
            SYNO.webfm.SmartDDMVCPMgr.focus(g, z);
            SYNO.webfm.SmartDDMVCPMgr.onDragOver(u)
        }
        if (t && (Ext.fly(t).findParentNode("div.syno-sds-fs-tree", Number.MAX_VALUE))) {
            return this.dropAllowed
        }
        if ((k = this.getTarget(w, u, z)) === false) {
            this.updateDefalutDDText(w, u, z)
        } else {
            if ((p = this.getSource(w, u, z)) === false) {
                this.updateDefalutDDText(w, u, z)
            } else {
                if (!w.tree && !w.grid && !w.dataview) {
                    return this.dropNotAllowed
                }
                v = k.blTgtTreeType;
                y = k.target;
                var d = w.getProxy().getGhost();
                var q;
                if (v) {
                    q = y.attributes.text
                } else {
                    q = y.get("filename");
                    j = y.get("isdir")
                }
                q = Ext.util.Format.htmlEncode(q);
                q = Ext.util.Format.ellipsis(q, 36);
                var f = z.node;
                var n = z.from || w.grid;
                var c = f ? f.attributes.type : (n ? n.getStore().storetype : null);
                var l = SYNO.webfm.utils.isLocalSource(g.activeDS.storetype);
                var o = SYNO.webfm.utils.isLocalSource(c),
                    m, i;
                if (!l && o) {
                    m = String.format(_WFT("filetable", "upload_ddtext"), q);
                    i = "upload"
                } else {
                    if (l && !o) {
                        m = String.format(_WFT("download", "download_to"), q);
                        i = "download"
                    } else {
                        m = String.format(_WFT("filetable", "mvcp_ddtext"), q);
                        i = "mvcp"
                    }
                }
                var s = (SYNO.SDS.UserSettings.getProperty("SYNO.SDS.App.PersonalSettings.Instance", "isfirstdd") === false) ? false : true;
                var b = false;
                if (SYNO.webfm.SmartDDMVCPMgr.isEnable() || s) {
                    var a, r = false,
                        h = false;
                    if (0 < p.length) {
                        r = SYNO.webfm.VFS.isVFSPath(p[0].get("path"));
                        b = SYNO.webfm.VFS.isSharingPath(p[0].get("path")) || SYNO.webfm.VFS.isGDriveStarsFirstLevelPath(p[0].get("path"))
                    }
                    if (!v && "remote" === y.get("mountType")) {
                        a = SYNO.webfm.utils.source.remoter
                    } else {
                        if (!v && "iso" === y.get("mountType")) {
                            a = SYNO.webfm.utils.source.remotev
                        } else {
                            if (!v) {
                                h = SYNO.webfm.VFS.isVFSPath(y.get("path"));
                                a = SYNO.webfm.SmartDDMVCPMgr.getSourceTypeByPath(this.webfm, y.get("path"))
                            } else {
                                h = SYNO.webfm.VFS.isVFSPath(y.attributes.path);
                                a = SYNO.webfm.SmartDDMVCPMgr.getSourceTypeByPath(this.webfm, y.attributes.path)
                            }
                        }
                    }
                    SYNO.webfm.SmartDDMVCPMgr.disableUpateDDText(b);
                    SYNO.webfm.SmartDDMVCPMgr.setDragDropData(q, i, w.getProxy());
                    SYNO.webfm.SmartDDMVCPMgr.updateDefaultAction(a, r, h);
                    if (!s) {
                        m = String.format(SYNO.webfm.SmartDDMVCPMgr.getDDText(b), q)
                    }
                }
                d.update(m)
            }
        }
        if (!x) {
            return this.dropNotAllowed
        }
        return this.notifyOverAndDrop(w, u, z, g, j, k)
    },
    getTarget: function(a, h, f) {
        var d = this.webfm;
        var g;
        var b = Ext.lib.Event.getTarget(h);
        var c = d.grid.getView().findRowIndex(b);
        var i = true;
        if (c !== false && !Ext.isDefined(g = d.activeDS.getAt(c))) {
            return false
        } else {
            if (c === false || !g.get("isdir")) {
                if (a.grid && a.grid === d.grid) {
                    return false
                }
                g = d.dirTree.getSelectionModel().getSelectedNode()
            } else {
                i = false
            }
        }
        return {
            target: g,
            blTgtTreeType: i
        }
    },
    getSource: function(a, d, c) {
        var b;
        if (a.tree) {
            b = c.node
        } else {
            if (a.grid || a.dataview) {
                b = c.selections
            } else {
                return false
            }
        }
        return b
    },
    notifyDrop: function(w, s, y) {
        var c = this.webfm;
        var r = s.getTarget();
        if (r && (r = (Ext.fly(r).findParentNode("div.syno-sds-fs-win")))) {
            if (r !== this.webfm.owner.el.dom) {
                return false
            }
        }
        if (!w.grid && !w.tree && !w.dataview) {
            return false
        }
        var m, x;
        var g, u;
        if ((g = this.getTarget(w, s, y)) === false) {
            return false
        }
        u = g.blTgtTreeType;
        x = g.target;
        var f = u ? false : x.get("isdir");
        if (this.notifyOverAndDrop(w, s, y, c, f, g) === this.dropNotAllowed) {
            return false
        }
        if ((m = this.getSource(w, s, y)) === false) {
            return false
        }
        var j = w.grid || w.dataview;
        var a = (u) ? x.attributes.real_path : x.get("real_path");
        var z = _T("tree", "leaf_filebrowser");
        var h = SYNO.webfm.utils.isLocalSource(c.activeDS.storetype);
        var l = w.tree ? SYNO.webfm.utils.isLocalSource(m.attributes.type) : SYNO.webfm.utils.isLocalSource(j.getStore().storetype);
        if (h === l) {
            var k = h && Ext.isWindows ? "\\" : "/";
            if (w.tree) {
                if (SYNO.webfm.utils.isConflictTargetPath(m.attributes.real_path, a, k)) {
                    c.owner.getMsgBox().alert(z, _WFT("error", "error_select_conflict"));
                    return false
                }
            } else {
                if (w.grid || w.dataview) {
                    for (var q = 0; q < m.length; q++) {
                        var b = m[q].get("real_path");
                        if (SYNO.webfm.utils.isConflictTargetPath(b, a, k)) {
                            c.owner.getMsgBox().alert(z, _WFT("error", "error_select_conflict"));
                            return false
                        }
                    }
                }
            }
        }
        c.ddParams = {
            src: (w.tree) ? m.attributes.path : m,
            target: (u) ? x.attributes.path : x.get("file_id"),
            srcsource: (w.tree) ? m.attributes.type : j.getStore().storetype,
            srcnode: (w.tree) ? w.dragData.node : undefined
        };
        if (j && j.getStore().storetype === SYNO.webfm.utils.source.remotes) {
            Ext.apply(c.ddParams, {
                search_taskid: j.getStore().search_taskid,
                blsame: (!u) && (w.grid === c.grid)
            })
        }
        var p = (u) ? x.attributes.text : x.get("filename");
        p = "<b>[" + Ext.util.Format.ellipsis(Ext.util.Format.htmlEncode(p), 36) + "]</b>";
        var t = c.copymoveCtxMenu;
        var v = t.items;
        v.each(function(e) {
            e.enable();
            e.show()
        });
        var n = c.dirTree.getSelectionModel().getSelectedNode();
        var o, d;
        if (!h && l) {
            if (_S("demo_mode") === true) {
                c.owner.getMsgBox().alert(_WFT("filetable", "filetable_upload"), _JSLIBSTR("uicommon", "error_demo"));
                return false
            }
            if (!c.checkUploadRight(n)) {
                c.owner.getMsgBox().alert(_WFT("filetable", "filetable_upload"), _WFT("error", "error_privilege_not_enough"));
                return false
            }
            d = c.checkFtpModifyRight(n);
            if (d) {
                v.get("copy_overwrite").disable()
            }
            v.get("move_skip").hide();
            v.get("move_overwrite").hide();
            v.get("text").setText(String.format("<b>" + _WFT("filetable", "upload_ddtext") + "&nbsp</b>", Ext.util.Format.htmlEncode(p)));
            o = "upload"
        } else {
            if (h && !l) {
                if (c.checkFTPDownloadRight(n)) {
                    c.owner.getMsgBox().alert(_WFT("filetable", "filetable_download"), _WFT("error", "error_privilege_not_enough"));
                    return
                }
                d = c.checkFtpModifyRight(n);
                if (d || (this.isSrcReadOnly(w, m))) {
                    v.get("move_overwrite").disable();
                    v.get("move_skip").disable()
                }
                v.get("text").setText(String.format("<b>" + _WFT("download", "download_to") + "&nbsp</b>", p));
                o = "download"
            } else {
                if (this.isSrcReadOnly(w, m)) {
                    v.get("move_overwrite").disable();
                    v.get("move_skip").disable()
                }
                v.get("text").setText(p);
                o = "copymove"
            }
        }
        t.action = o;
        SYNO.webfm.SmartDDMVCPMgr.onAction(t, c, s);
        return true
    },
    isSrcReadOnly: function(a, b) {
        return ((a.tree && b.attributes && ((b.attributes.is_snapshot) || (b.attributes.type === SYNO.webfm.utils.source.remotev || b.attributes.isMountPoint))) || (a.grid && SYNO.webfm.utils.doesIncludeMountPoint(a.grid.getSelectionModel().getSelections())) || (a.grid && a.grid.owner && SYNO.webfm.utils.source.remotev === a.grid.owner.getCurrentSource()) || (a.dataview && SYNO.webfm.utils.doesIncludeMountPoint(a.dataview.getSelectionModel().getSelections())) || (a.dataview && a.dataview.owner && SYNO.webfm.utils.source.remotev === a.dataview.owner.getCurrentSource()))
    }
});
SYNO.webfm.utils.DataViewDragZone = function(a, b) {
    SYNO.webfm.utils.DataViewDragZone.superclass.constructor.call(this, a.getEl(), b);
    this.dataview = a;
    this.scroll = false;
    this.ddel = document.createElement("div");
    this.ddel.className = "x-grid-dd-wrap";
    this.preventDefault = true
};
Ext.extend(SYNO.webfm.utils.DataViewDragZone, Ext.dd.DragZone, {
    proxy: new Ext.dd.StatusProxy({
        animRepair: false
    }),
    onGetShortCutRecs: function(a) {},
    getDragData: function(f) {
        var a = this.dataview,
            b = f.getTarget(a.itemSelector, 10);
        if (b) {
            var i = a.getSelectionModel(),
                c, g = b.cloneNode(true),
                h = a.indexOf(b);
            g.id = Ext.id();
            if (h !== -1 && !a.isSelected(h) && !f.hasModifier()) {
                a.select(h, false)
            }
            if (h === -1 || !a.isSelected(h) || f.hasModifier()) {
                return
            }
            c = i.getSelections();
            return {
                from: a,
                ddel: this.ddel,
                index: h,
                selections: c,
                SDSShortCut: this.onGetShortCutRecs(c),
                _fromFile: true,
                ddText: _T("desktop", "add_shortcut")
            }
        }
        return false
    },
    validateTarget: function(f, d, i) {
        var a = f.getEl();
        if (Ext.fly(a).findParentNode("div.syno-sds-aceeditor-main-panel") || Ext.fly(a).findParentNode("div.sds-audioplayer-mini-player-window") || Ext.fly(a).findParentNode("div.syno-sds-filestation-available-drop-target")) {
            return true
        }
        var h = d.getTarget("li.launch-icon");
        if (SYNO.SDS.Desktop.el.id === d.getTarget().id || (h && Ext.fly(h).findParentNode(".sds-desktop-shortcut"))) {
            var b = this.dragData;
            if (b && b.from && SYNO.webfm.utils.isLocalSource(b.from.getStore().storetype)) {
                return false
            }
            return true
        }
        h = d.getTarget();
        var c, g;
        if ((h && (Ext.fly(h).is("div.syno-sds-fs-grid-scroller") || Ext.fly(h).is("div.syno-sds-fs-thumbnailsView") || (g = Ext.fly(h).findParentNode("div.syno-sds-fs-grid-scroller")) || (g = Ext.fly(h).findParentNode("div.syno-sds-fs-thumbnailsView")) || (g = Ext.fly(h).findParentNode("div.syno-sds-fs-tree", Number.MAX_VALUE))))) {
            g = g || h;
            g = (Ext.fly(g).findParentNode("div.syno-sds-fs-win", Number.MAX_VALUE));
            c = SYNO.SDS.WindowMgr.get(g.id);
            if (c) {
                c.toFront()
            }
            return true
        }
        g = g || h;
        if (g && (g = (Ext.fly(g).findParentNode("div.syno-sds-fs-win", Number.MAX_VALUE)))) {
            c = SYNO.SDS.WindowMgr.get(g.id);
            if (c) {
                c.toFront()
            }
        }
        return false
    }
});
SYNO.webfm.utils.DataViewDropTarget = function(a, c, b) {
    this.webfm = b;
    this.dataview = a;
    SYNO.webfm.utils.DataViewDropTarget.superclass.constructor.call(this, a.getEl(), c)
};
Ext.extend(SYNO.webfm.utils.DataViewDropTarget, Ext.dd.DropTarget, {
    notifyOverAndDrop: function(p, m, h, j, l, g) {
        var q = p.getProxy().getGhost();
        if (j.activeDS === j.remoteSearchDS && (l !== true)) {
            return this.dropNotAllowed
        }
        if (p.tree) {
            if (p.tree === j.dirTree || p.tree === j.dirLocalTree) {
                return this.dropNotAllowed
            }
            var i = h.node.parentNode;
            if (i && i.id === "fm_fav_root") {
                q.update(_WFT("favorite", "insert_invalid_favorite"));
                return this.dropNotAllowed
            }
        }
        var b = h.node;
        var a = h.from || p.grid,
            o, f;
        var d = b ? b.attributes.type : (a ? a.getStore().storetype : null);
        var c = SYNO.webfm.utils.isLocalSource(j.activeDS.storetype);
        var n = SYNO.webfm.utils.isLocalSource(d);
        if (g) {
            f = (g.blTgtTreeType) ? g.target.attributes.path : g.target.get("path")
        }
        if (a) {
            o = a.getSelectionModel().getSelections()
        }
        if (!c && n) {
            if (!j.onCheckVFSAction("upload", f)) {
                return this.dropNotAllowed
            }
        } else {
            if (c && !n) {
                if (!j.onCheckVFSAction("download", b || o)) {
                    return this.dropNotAllowed
                }
                var k = true;
                if (a) {
                    Ext.each(o, function(e) {
                        k = !this.webfm.checkFTPDownloadRightByPath(e.get("file_id"));
                        return k
                    }, this)
                } else {
                    if (b) {
                        if (this.webfm.checkFTPDownloadRight(b)) {
                            k = false
                        }
                    }
                }
                if (!k) {
                    q.update(_WFT("error", "error_privilege_not_enough"));
                    return this.dropNotAllowed
                }
            } else {
                if ((!SYNO.webfm.SmartDDMVCPMgr.isEnable() && !j.onCheckVFSAction("copy", b || o, f) && !j.onCheckVFSAction("move", b || o, f)) || (SYNO.webfm.SmartDDMVCPMgr.isEnable() && !j.onCheckVFSAction(SYNO.webfm.SmartDDMVCPMgr.getAction(), b || o, f))) {
                    return this.dropNotAllowed
                }
            }
        }
        return this.dropAllowed
    },
    updateDefalutDDText: function(a, f, c) {
        SYNO.webfm.SmartDDMVCPMgr.disableUpateDDText(true);
        var d = a.getProxy().getGhost();
        if (a.tree) {
            d.update("");
            c.node.ui.appendDDGhost(d.dom)
        } else {
            if (a.grid) {
                var b = a.grid.getDragDropText();
                d.update(b)
            } else {
                if (a.dataview) {
                    d.update(a.dataview.getDragDropText())
                }
            }
        }
    },
    notifyOut: function(a, c, b) {
        this.updateDefalutDDText(a, c, b)
    },
    notifyOver: function(w, u, z) {
        var g = this.webfm;
        var k, v, p, x;
        var j = false,
            y = true;
        var t = u.getTarget();
        if (SYNO.webfm.SmartDDMVCPMgr.isEnable()) {
            SYNO.webfm.SmartDDMVCPMgr.focus(g, z);
            SYNO.webfm.SmartDDMVCPMgr.onDragOver(u)
        }
        if (t && (Ext.fly(t).findParentNode("div.syno-sds-fs-tree", Number.MAX_VALUE))) {
            return this.dropAllowed
        }
        if ((k = this.getTarget(w, u, z)) === false) {
            this.updateDefalutDDText(w, u, z)
        } else {
            if ((p = this.getSource(w, u, z)) === false) {
                this.updateDefalutDDText(w, u, z)
            } else {
                if (!w.tree && !w.grid && !w.dataview) {
                    return this.dropNotAllowed
                }
                v = k.blTgtTreeType;
                x = k.target;
                var d = w.getProxy().getGhost();
                var q;
                if (v) {
                    q = x.attributes.text
                } else {
                    q = x.get("filename");
                    j = x.get("isdir")
                }
                q = Ext.util.Format.htmlEncode(q);
                q = Ext.util.Format.ellipsis(q, 36);
                var f = z.node;
                var n = z.from;
                var c = f ? f.attributes.type : (n ? n.getStore().storetype : null);
                var l = SYNO.webfm.utils.isLocalSource(g.activeDS.storetype);
                var o = SYNO.webfm.utils.isLocalSource(c),
                    m, i;
                if (!l && o) {
                    m = String.format(_WFT("filetable", "upload_ddtext"), q);
                    i = "upload"
                } else {
                    if (l && !o) {
                        m = String.format(_WFT("download", "download_to"), q);
                        i = "download"
                    } else {
                        m = String.format(_WFT("filetable", "mvcp_ddtext"), q);
                        i = "mvcp"
                    }
                }
                var s = (SYNO.SDS.UserSettings.getProperty("SYNO.SDS.App.PersonalSettings.Instance", "isfirstdd") === false) ? false : true;
                var b = false;
                if (SYNO.webfm.SmartDDMVCPMgr.isEnable() || s) {
                    var a, r = false,
                        h = false;
                    if (0 < p.length) {
                        r = SYNO.webfm.VFS.isVFSPath(p[0].get("path"));
                        b = SYNO.webfm.VFS.isSharingPath(p[0].get("path")) || SYNO.webfm.VFS.isGDriveStarsFirstLevelPath(p[0].get("path"))
                    }
                    if (!v && "remote" === x.get("mountType")) {
                        a = SYNO.webfm.utils.source.remoter
                    } else {
                        if (!v && "iso" === x.get("mountType")) {
                            a = SYNO.webfm.utils.source.remotev
                        } else {
                            if (!v) {
                                h = SYNO.webfm.VFS.isVFSPath(x.get("path"));
                                a = SYNO.webfm.SmartDDMVCPMgr.getSourceTypeByPath(this.webfm, x.get("path"))
                            } else {
                                h = SYNO.webfm.VFS.isVFSPath(x.attributes.path);
                                a = SYNO.webfm.SmartDDMVCPMgr.getSourceTypeByPath(this.webfm, x.attributes.path)
                            }
                        }
                    }
                    SYNO.webfm.SmartDDMVCPMgr.disableUpateDDText(b);
                    SYNO.webfm.SmartDDMVCPMgr.setDragDropData(q, i, w.getProxy());
                    SYNO.webfm.SmartDDMVCPMgr.updateDefaultAction(a, r, h);
                    if (!s) {
                        m = String.format(SYNO.webfm.SmartDDMVCPMgr.getDDText(b), q)
                    }
                }
                d.update(m)
            }
        }
        if (!y) {
            return this.dropNotAllowed
        }
        return this.notifyOverAndDrop(w, u, z, g, j, k)
    },
    getTarget: function(a, h, f) {
        var d = this.webfm,
            b = h.getTarget(this.dataview.itemSelector, 10),
            c = b ? this.dataview.indexOf(b) : -1,
            i = true,
            g;
        if (c !== -1 && !Ext.isDefined(g = d.activeDS.getAt(c))) {
            return false
        } else {
            if (c === -1 || !g.get("isdir")) {
                if (a.dataview && a.dataview === d.thumbnailView) {
                    return false
                }
                g = d.dirTree.getSelectionModel().getSelectedNode()
            } else {
                i = false
            }
        }
        return {
            target: g,
            blTgtTreeType: i
        }
    },
    getSource: function(a, d, c) {
        var b;
        if (a.tree) {
            b = c.node
        } else {
            if (a.dataview || a.grid) {
                b = c.selections
            } else {
                return false
            }
        }
        return b
    },
    notifyDrop: function(w, s, y) {
        var c = this.webfm;
        var r = s.getTarget();
        if (r && (r = (Ext.fly(r).findParentNode("div.syno-sds-fs-win")))) {
            if (r !== this.webfm.owner.el.dom) {
                return false
            }
        }
        if (!w.dataview && !w.grid && !w.tree) {
            return false
        }
        var m, x;
        var g, u;
        if ((g = this.getTarget(w, s, y)) === false) {
            return false
        }
        u = g.blTgtTreeType;
        x = g.target;
        var f = u ? false : x.get("isdir");
        if (this.notifyOverAndDrop(w, s, y, c, f, g) === this.dropNotAllowed) {
            return false
        }
        if ((m = this.getSource(w, s, y)) === false) {
            return false
        }
        var a = (u) ? x.attributes.real_path : x.get("real_path");
        var z = _T("tree", "leaf_filebrowser");
        var h = SYNO.webfm.utils.isLocalSource(c.activeDS.storetype);
        var b = w.grid || w.dataview;
        var l = w.tree ? SYNO.webfm.utils.isLocalSource(m.attributes.type) : SYNO.webfm.utils.isLocalSource(b.getStore().storetype);
        if (h === l) {
            var k = h && Ext.isWindows ? "\\" : "/";
            if (w.tree) {
                if (SYNO.webfm.utils.isConflictTargetPath(m.attributes.real_path, a, k)) {
                    c.owner.getMsgBox().alert(z, _WFT("error", "error_select_conflict"));
                    return false
                }
            } else {
                if (w.grid || w.dataview) {
                    for (var q = 0; q < m.length; q++) {
                        var j = m[q].get("real_path");
                        if (SYNO.webfm.utils.isConflictTargetPath(j, a, k)) {
                            c.owner.getMsgBox().alert(z, _WFT("error", "error_select_conflict"));
                            return false
                        }
                    }
                }
            }
        }
        c.ddParams = {
            src: (w.tree) ? m.attributes.path : m,
            target: (u) ? x.attributes.path : x.get("file_id"),
            srcsource: (w.tree) ? m.attributes.type : b.getStore().storetype,
            srcnode: (w.tree) ? w.dragData.node : undefined
        };
        if ((b && b.getStore().storetype === SYNO.webfm.utils.source.remotes)) {
            Ext.apply(c.ddParams, {
                search_taskid: b.getStore().search_taskid,
                blsame: (!u) && (b === c.dataview)
            })
        }
        var p = (u) ? x.attributes.text : x.get("filename");
        p = "<b>[" + Ext.util.Format.ellipsis(Ext.util.Format.htmlEncode(p), 36) + "]</b>";
        var t = c.copymoveCtxMenu;
        var v = t.items;
        v.each(function(e) {
            e.enable();
            e.show()
        });
        var n = c.dirTree.getSelectionModel().getSelectedNode();
        var o, d;
        if (!h && l) {
            if (_S("demo_mode") === true) {
                c.owner.getMsgBox().alert(_WFT("filetable", "filetable_upload"), _JSLIBSTR("uicommon", "error_demo"));
                return false
            }
            if (!c.checkUploadRight(n)) {
                c.owner.getMsgBox().alert(_WFT("filetable", "filetable_upload"), _WFT("error", "error_privilege_not_enough"));
                return false
            }
            d = c.checkFtpModifyRight(n);
            if (d) {
                v.get("copy_overwrite").disable()
            }
            v.get("move_skip").hide();
            v.get("move_overwrite").hide();
            v.get("text").setText(String.format("<b>" + _WFT("filetable", "upload_ddtext") + "&nbsp</b>", Ext.util.Format.htmlEncode(p)));
            o = "upload"
        } else {
            if (h && !l) {
                if (c.checkFTPDownloadRight(n)) {
                    c.owner.getMsgBox().alert(_WFT("filetable", "filetable_download"), _WFT("error", "error_privilege_not_enough"));
                    return
                }
                d = c.checkFtpModifyRight(n);
                if (d || (this.isSrcReadOnly(w, m))) {
                    v.get("move_overwrite").disable();
                    v.get("move_skip").disable()
                }
                v.get("text").setText(String.format("<b>" + _WFT("download", "download_to") + "&nbsp</b>", p));
                o = "download"
            } else {
                if (this.isSrcReadOnly(w, m)) {
                    v.get("move_overwrite").disable();
                    v.get("move_skip").disable()
                }
                v.get("text").setText(p);
                o = "copymove"
            }
        }
        t.action = o;
        SYNO.webfm.SmartDDMVCPMgr.onAction(t, c, s);
        return true
    },
    isSrcReadOnly: function(a, b) {
        return ((a.tree && b.attributes && (b.attributes.type === SYNO.webfm.utils.source.remotev || b.attributes.isMountPoint)) || (a.grid && SYNO.webfm.utils.doesIncludeMountPoint(a.grid.getSelectionModel().getSelections())) || (a.grid && a.grid.owner && SYNO.webfm.utils.source.remotev === a.grid.owner.getCurrentSource()) || (a.dataview && SYNO.webfm.utils.doesIncludeMountPoint(a.dataview.getSelectionModel().getSelections())) || (a.dataview && a.dataview.owner && SYNO.webfm.utils.source.remotev === a.dataview.owner.getCurrentSource()))
    }
});
SYNO.webfm.utils.TreeDropZone = Ext.extend(Ext.tree.TreeDropZone, {
    onResetDragText: function(a, f, c) {
        var d = a.getProxy().getGhost();
        if (a.tree) {
            d.update("");
            c.node.ui.appendDDGhost(d.dom)
        } else {
            if (a.grid) {
                var b = a.grid.getDragDropText();
                d.update(b)
            } else {
                if (a.dataview) {
                    d.update(a.dataview.getDragDropText())
                }
            }
        }
    },
    onContainerOver: function(a, c, b) {
        if (this.allowContainerDrop && this.isValidDropPoint({
                ddel: this.tree.getRootNode().ui.elNode,
                node: this.tree.getRootNode()
            }, "append", a, c, b)) {
            return this.dropAllowed
        }
        this.onResetDragText(a, c, b);
        return this.dropNotAllowed
    },
    onNodeOut: function(d, a, c, b) {
        this.onResetDragText(a, c, b);
        this.cancelExpand();
        this.removeDropIndicators(d)
    },
    getDropPoint: function(c, d, b) {
        var a = SYNO.webfm.utils.TreeDropZone.superclass.getDropPoint.apply(this, arguments);
        if (d && d.node && d.node.parentNode && d.node.parentNode.id === "fm_fav_root") {
            return a
        }
        if (a === "above" || a === "below") {
            return "append"
        }
        return a
    }
});
Date.parseDuration = function(b) {
    var a = {},
        e = Date.durations;
    var d;
    for (var c in e) {
        if (e.hasOwnProperty(c)) {
            d = Math.floor(b / e[c]);
            if (d) {
                a[c] = (Ext.isNumber(d) && d < Number.MAX_VALUE) ? d : Number.MAX_VALUE;
                if (0 >= (b -= d * e[c])) {
                    break
                }
            }
        }
    }
    return a
};
Date.fancyDuration = function(c) {
    var b = [],
        a = Date.parseDuration(c);
    for (var d in a) {
        if (a.hasOwnProperty(d)) {
            var e = (a[d] > 9999) ? 9999 : a[d];
            b.push(e + " " + Date.durationsAbbr[d])
        }
    }
    return b.join(", ")
};
Date.durations = {
    days: 86400,
    hours: 3600,
    minutes: 60,
    seconds: 1
};
Date.durationsAbbr = {
    days: _WFT("upload", "upload_time_day"),
    hours: _WFT("upload", "upload_time_hour"),
    minutes: _WFT("upload", "upload_time_min"),
    seconds: _WFT("upload", "upload_time_sec")
};
SYNO.webfm.utils.FieldFind = function(b, a) {
    var c = b.findField(a);
    if (!c) {
        c = Ext.getCmp(a)
    }
    return c
};
SYNO.webfm.utils.getRadioGroup = function(c, b) {
    var e = [];
    var d = c.el.query("input[name=" + b + "]");
    for (var a = 0; a < d.length; a++) {
        e.push(Ext.getCmp(d[a].id))
    }
    return e
};
SYNO.webfm.utils.EnableCheckGroup = Ext.extend(Object, {
    constructor: function(b, a, e, d) {
        var c = SYNO.webfm.utils.FieldFind(b, a);
        d = typeof(d) != "undefined" ? d : [];
        this.enable_fields = e;
        this.disable_fields = d;
        this.form = b;
        c.mon(c, "check", this.checkHandler, this);
        c.mon(c, "enable", this.enableHandler, this, {
            delay: 50
        });
        c.mon(c, "disable", this.enableHandler, this, {
            delay: 50
        });
        this.checkHandler(c, c.getValue())
    },
    setFieldStatus: function(d, g, c, a) {
        if (g.inputType == "radio") {
            var f = SYNO.webfm.utils.getRadioGroup(d, g.getName()),
                h;
            for (var b = 0; b < f.length; b++) {
                if (a) {
                    h = c ? f[b].disable() : f[b].enable()
                } else {
                    h = c ? f[b].enable() : f[b].disable()
                }
            }
        } else {
            var e;
            if (a) {
                e = c ? g.disable() : g.enable()
            } else {
                e = c ? g.enable() : g.disable()
            }
        }
    },
    checkHandler: function(c, b) {
        var a, d;
        for (a = 0; a < this.enable_fields.length; a++) {
            d = SYNO.webfm.utils.FieldFind(this.form, this.enable_fields[a]);
            this.setFieldStatus(this.form, d, b, false)
        }
        for (a = 0; a < this.disable_fields.length; a++) {
            d = SYNO.webfm.utils.FieldFind(this.form, this.disable_fields[a]);
            this.setFieldStatus(this.form, d, b, true)
        }
    },
    enableHandler: function(c) {
        var b, d;
        var a = (c.disabled === false && c.getValue() === true);
        for (b = 0; b < this.enable_fields.length; b++) {
            d = SYNO.webfm.utils.FieldFind(this.form, this.enable_fields[b]);
            this.setFieldStatus(this.form, d, a, false)
        }
        for (b = 0; b < this.disable_fields.length; b++) {
            d = SYNO.webfm.utils.FieldFind(this.form, this.disable_fields[b]);
            this.setFieldStatus(this.form, d, a, true)
        }
    }
});
SYNO.webfm.utils.getCmdCode = function() {
    var a = 224;
    if (Ext.isWebKit) {
        a = [91, 93]
    } else {
        if (Ext.isOpera) {
            a = 17
        }
    }
    return a
};
SYNO.webfm.utils.setSpaceTooltip = function(a) {
    if (!a || !a.additional) {
        return
    }
    var b = a.additional.volume_status;
    if (b && b.totalSpace && b.freeSpace) {
        a.qtip = String.format("{0}<br>{1}", a.qtip, String.format(_T("filetable", "space_size"), Ext.util.Format.fileSize(b.freeSpace), Ext.util.Format.fileSize(b.totalSpace)))
    }
};
SYNO.webfm.utils.NodeActionEnable = function() {
    var a = function(e) {
            return !(e.id == "fm_root" || e.id == "fm_local_root" || e.id === "fm_vd_root" || e.id === "fm_rf_root" || !e.parentNode || e.parentNode.id == "fm_root" || e.parentNode.id == "fm_local_root" || e.id === "fm_fav_root" || ((e.parentNode && e.parentNode.id === "fm_fav_root") && e.attributes.status === "broken"))
        },
        c = function(g) {
            if (!a(g)) {
                return false
            }
            var f = SYNO.webfm.utils.isLocalSource(g.attributes.type);
            var e = g.attributes.type === SYNO.webfm.utils.source.remotev || g.attributes.mountType === "iso" || g.attributes.is_snapshot;
            var i = e || (g.parentNode && g.parentNode.id === "fm_rf_root");
            var h = !f && g.parentNode && g.parentNode.id == "fm_fav_root";
            return !h && !i
        },
        d = function(f) {
            if (!a(f)) {
                return false
            }
            var e = f.attributes.type === SYNO.webfm.utils.source.remotev || f.attributes.mountType === "iso";
            var g = e || (f.parentNode && f.parentNode.id === "fm_rf_root");
            return !SYNO.FileStation.Clipboard.isEmpty() && !g
        },
        b = function(f) {
            if (!a(f)) {
                return false
            }
            var e = SYNO.webfm.utils.isLocalSource(f.attributes.type);
            var g = !e && f.parentNode && f.parentNode.id == "fm_fav_root";
            return !g
        };
    return {
        isEnableCut: c,
        isEnableDelete: c,
        isEnableRename: c,
        isEnableCopy: b,
        isEnablePaste: d
    }
}();
SYNO.webfm.utils.ShowHideMenu = function(b) {
    var c = false,
        e = null,
        d, a;
    b.each(function(g) {
        if (g instanceof Ext.menu.Separator) {
            g.show()
        }
    });
    for (d = 0, a = b.length; d >= 0 && d < a; d++) {
        var f = b.get(d);
        if (f instanceof Ext.menu.Separator && !f.hidden) {
            if (c || d === 0) {
                f.hide()
            } else {
                e = f
            }
            c = true
        } else {
            if (!f.hidden) {
                c = false;
                e = null
            }
        }
    }
    if (e) {
        e.hide()
    }
};
SYNO.webfm.utils.GetIconvCodepageList = function() {
    var a = [
        ["BIG5", _WFT("codepage", "chinese_traditional") + " (BIG5)"],
        ["BIG5-HKSCS", _WFT("codepage", "chinese_traditional") + " (BIG5-HKSCS)"],
        ["GBK", _WFT("codepage", "chinese_simplified") + " (GBK)"],
        ["GB18030", _WFT("codepage", "chinese_simplified") + " (GB18030)"],
        ["EUC-JP", _WFT("codepage", "japanese") + " (EUC-JP)"],
        ["SHIFT_JIS", _WFT("codepage", "japanese") + " (SHIFT_JIS)"],
        ["ISO-2022-JP", _WFT("codepage", "japanese") + " (ISO-2022-JP)"],
        ["EUC-KR", _WFT("codepage", "korean") + " (EUC-KR)"],
        ["CP949", _WFT("codepage", "korean") + " (CP949)"],
        ["CP1258", _WFT("codepage", "vietnamese") + " (CP1258)"],
        ["VISCII", _WFT("codepage", "vietnamese") + " (VISCII)"],
        ["TIS-620", _WFT("codepage", "thai") + " (TIS-620)"],
        ["ISO-8859-11", _WFT("codepage", "thai") + " (ISO-8859-11)"],
        ["ISO-8859-2", _WFT("codepage", "central_european") + " (ISO-8859-2)"],
        ["CP1250", _WFT("codepage", "central_european") + " (CP1250)"],
        ["ISO-8859-10", _WFT("codepage", "nordic") + " (ISO-8859-10)"],
        ["ISO-8859-1", _WFT("codepage", "western") + " (ISO-8859-1)"],
        ["ISO-8859-15", _WFT("codepage", "western") + " (ISO-8859-15)"],
        ["CP1252", _WFT("codepage", "western") + " (CP1252)"],
        ["Macintosh", _WFT("codepage", "western") + " (Macintosh)"],
        ["CP1254", _WFT("codepage", "turkish") + " (CP1254)"],
        ["CP1255", _WFT("codepage", "hebrew") + " (CP1255)"],
        ["ISO-8859-8", _WFT("codepage", "hebrew") + " (ISO-8859-8)"],
        ["ISO-8859-7", _WFT("codepage", "greek") + " (ISO-8859-7)"],
        ["CP1253", _WFT("codepage", "greek") + " (CP1253)"],
        ["CP1256", _WFT("codepage", "arabic") + " (CP1256)"],
        ["ISO-8859-6", _WFT("codepage", "arabic") + " (ISO-8859-6)"],
        ["ISO-8859-4", _WFT("codepage", "baltic") + " (ISO-8859-4)"],
        ["ISO-8859-13", _WFT("codepage", "baltic") + " (ISO-8859-13)"],
        ["CP1257", _WFT("codepage", "baltic") + " (CP1257)"],
        ["ISO-8859-3", _WFT("codepage", "south_european") + " (ISO-8859-3)"],
        ["ISO-8859-5", _WFT("codepage", "cyrillic") + " (ISO-8859-5)"],
        ["CP1251", _WFT("codepage", "cyrillic") + " (CP1251)"],
        ["KOI8-R", _WFT("codepage", "cyrillic") + " (KOI8-R)"],
        ["KOI8-U", _WFT("codepage", "cyrillic") + " (KOI8-U)"],
        ["ISO-8859-14", _WFT("codepage", "celtic") + " (ISO-8859-14)"],
        ["ISO-8859-16", _WFT("codepage", "romanian") + " (ISO-8859-16)"],
        ["ARMSCII-8", _WFT("codepage", "armenian") + " (ARMSCII-8)"],
        ["Georgian-Academy", _WFT("codepage", "georgian") + " (Georgian-Academy)"],
        ["KOI8-T", _WFT("codepage", "tajik") + " (KOI8-T)"],
        ["CP1133", _WFT("codepage", "laotian") + " (CP1133)"],
        ["PT154", _WFT("codepage", "kazakh") + " (PT154)"]
    ];
    a.sort(function(d, c) {
        return d[1].localeCompare(c[1])
    });
    a.unshift(["UTF-16", _WFT("codepage", "unicode") + " (UTF-16)"]);
    a.unshift(["UTF-8", _WFT("codepage", "unicode") + " (UTF-8)"]);
    return a
};
Ext.apply(SYNO.webfm.utils, {
    icon_type: ["acc", "ai", "avi", "bmp", "doc", "exe", "fla", "folder", "gif", "htm", "indd", "iso", "jpg", "js", "misc", "mp3", "pdf", "png", "ppt", "psd", "rar", "swf", "tar", "ttf", "txt", "wma", "xls", "ico", "tif", "tiff", "ufo", "raw", "arw", "srf", "sr2", "dcr", "k25", "kdc", "cr2", "crw", "nef", "mrw", "ptx", "pef", "raf", "3fr", "erf", "mef", "mos", "orf", "rw2", "dng", "x3f", "jpe", "jpeg", "html", "3gp", "3g2", "asf", "dat", "divx", "dvr-ms", "m2t", "m2ts", "m4v", "mkv", "mp4", "mts", "mov", "qt", "tp", "trp", "ts", "vob", "wmv", "xvid", "ac3", "amr", "rm", "rmvb", "ifo", "mpeg", "mpg", "mpe", "m1v", "m2v", "mpeg1", "mpeg2", "mpeg4", "ogv", "webm", "aac", "flac", "m4a", "m4b", "aif", "ogg", "pcm", "wav", "cda", "mid", "mp2", "mka", "mpc", "ape", "ra", "ac3", "dts", "bin", "img", "mds", "nrg", "daa", "docx", "wri", "rtf", "xla", "xlb", "xlc", "xld", "xlk", "xll", "xlm", "xlt", "xlv", "xlw", "xlsx", "xlsm", "xlsb", "xltm", "xlam", "pptx", "pps", "ppsx", "ade", "adp", "adn", "accdr", "accdb", "accdt", "mdb", "mda", "mdn", "mdt", "mdw", "mdf", "mde", "accde", "mam", "maq", "mar", "mat", "maf", "flv", "f4v", "7z", "bz2", "gz", "zip", "tgz", "tbz", "ttc", "otf", "css", "actproj", "ad", "akp", "applescript", "as", "asax", "asc", "ascx", "asm", "asmx", "asp", "aspx", "asr", "bkpi", "c", "cc", "php", "jsx", "xml", "xhtml", "mhtml", "cpp", "cs", "cxx"],
    archive_type: ["zip", "gz", "tar", "tgz", "tbz", "bz2", "rar", "7z", "iso"],
    image_type: ["iso"],
    DocumentFileTypes: "docx,wri,rtf,xla,xlb,xlc,xld,xlk,xll,xlm,xlt,xlv,xlw,xlsx,xlsm,xlsb,xltm,xlam,pptx,pps,ppsx,pdf,txt,doc,xls,ppt,odt,ods,odp,odg,odc,odf,odb,odi,odm,ott,ots,otp,otg,otc,otf,oti,oth,potx,pptm,ppsm,potm,dotx,dot,pot,ppa,xltx,docm,dotm,eml,msgc,c,cc,cpp,cs,cxx,ada,coffee,cs,css,js,json,lisp,markdown,ocaml,pl,py,rb,sass,scala,r,tex,conf,csv,sub,srt,md,log",
    ImageFileTypes: "ico,tif,tiff,ufo,raw,arw,srf,sr2,dcr,k25,kdc,cr2,crw,nef,mrw,ptx,pef,raf,3fr,erf,mef,mos,orf,rw2,dng,x3f,jpg,jpg,jpeg,png,gif,bmp,psd",
    VideoFileTypes: "3gp,3g2,asf,dat,divx,dvr-ms,m2t,m2ts,m4v,mkv,mp4,mts,mov,qt,tp,trp,ts,vob,wmv,xvid,ac3,amr,rm,rmvb,ifo,mpeg,mpg,mpe,m1v,m2v,mpeg1,mpeg2,mpeg4,ogv,webm,flv,avi,swf,f4v",
    AudioFileTypes: "aac,flac,m4a,m4b,aif,ogg,pcm,wav,cda,mid,mp2,mka,mpc,ape,ra,ac3,dts,wma,mp3,mp1,mp2,mpa,ram,m4p,aiff,dsf,dff",
    WebPageFileTypes: "html,htm,css,actproj,ad,akp,applescript,as,asax,asc,ascx,asm,asmx,asp,aspx,asr,jsx,xml,xhtml,mhtml,cs,js",
    DiscFileTypes: "bin,img,mds,nrg,daa,iso",
    ZippedFileTypes: "7z,bz2,gz,zip,tgz,tbz,rar,tar"
});
Ext.ns("SYNO.FileStation");
SYNO.FileStation.PathBar = Ext.extend(Ext.util.Observable, {
    constructor: function(a) {
        this.init(a.webfm);
        SYNO.FileStation.PathBar.superclass.constructor.apply(this, arguments);
        this.addEvents("updatepath")
    },
    init: function(a) {
        this.webfm = a;
        this.tbPanel = new SYNO.FileStation.PathButtonsPanel({
            cls: "ux-pathtoolbar",
            webfm: this.webfm
        });
        return this
    },
    addPathButton: function(f, e, b, c, d, a) {
        return this.tbPanel.addButton(f, e, b, c, d, a, this.webfm)
    },
    updatePathButton: function(e, d, b, c, a) {
        return this.tbPanel.updateButton(e, d, b, c, a)
    },
    addPathButtons: function(c) {
        var b = Math.max(this.tbPanel.items.length, c.length);
        var d = c.length - 1;
        for (var a = 0; a < b; a++) {
            if (a < this.tbPanel.items.length && a < c.length) {
                this.updatePathButton(a, c[a].text, c[a].tooltip, c[a].path, a === d)
            } else {
                if (a < c.length) {
                    this.addPathButton(this.tbPanel.items.length, c[a].text, c[a].tooltip, c[a].path, a === 0, a === d)
                } else {
                    this.removePathButtons(a, b);
                    break
                }
            }
        }
        this.tbPanel.setActiveButton(this.tbPanel.items[this.tbPanel.items.length - 1]);
        this.fireEvent("updatepath", this)
    },
    removePathButtons: function(b, a) {
        this.tbPanel.removeButtons(b, a)
    },
    setWidth: function(a) {
        this.tbPanel.setWidth(a)
    }
});
SYNO.FileStation.PathButtonsPanel = Ext.extend(Ext.BoxComponent, {
    activeButton: null,
    enableScroll: true,
    scrollRepeatInterval: 400,
    scrollDuration: 0.35,
    buttonWidthSet: false,
    allowDomMove: false,
    onRender: function() {
        SYNO.FileStation.PathButtonsPanel.superclass.onRender.call(this, arguments);
        this.mon(this, "resize", this.delegateUpdates);
        this.items = [];
        this.selMenu = new SYNO.ux.Menu({
            items: [],
            listeners: {
                click: {
                    fn: function(b, a) {
                        if (a.path) {
                            this.webfm.onGoToPathWithDir(a.path)
                        }
                    },
                    scope: this
                }
            }
        });
        this.stripWrap = Ext.get(this.el).createChild({
            cls: "ux-pathbuttons-strip-wrap",
            cn: {
                tag: "ul",
                cls: "ux-pathbuttons-strip"
            }
        });
        this.stripSpacer = Ext.get(this.el).createChild({
            cls: "ux-pathbuttons-strip-spacer"
        });
        this.strip = new Ext.Element(this.stripWrap.dom.firstChild);
        this.edge = this.strip.createChild({
            tag: "li",
            cls: "ux-pathbuttons-edge"
        });
        this.strip.createChild({
            cls: "x-clear"
        })
    },
    addButton: function(d, f, i, h, c, g, b) {
        var e = this.strip.createChild({
            tag: "li"
        }, this.edge);
        var a = new SYNO.FileStation.PathBar.PathButton(e, d, f, i, h, c, g, b);
        this.items.push(a);
        if (!this.buttonWidthSet) {
            this.lastButtonWidth = a.container.getWidth()
        }
        this.addManagedComponent(a);
        return a
    },
    updateButton: function(f, e, c, d, b) {
        var a = this.items[f];
        a.updateButton(e, c, d, b)
    },
    removeButtons: function(f, e) {
        var a;
        var c;
        for (var b = f; b < e; b++) {
            c = this.items[b];
            a = document.getElementById(c.container.id);
            this.removeManagedComponent(c);
            c.destroy();
            a.parentNode.removeChild(a)
        }
        var d = [];
        for (b = 0; b < f; b++) {
            d.push(this.items[b])
        }
        this.items = d;
        this.delegateUpdates()
    },
    setActiveButton: function(a) {
        this.activeButton = a;
        this.delegateUpdates()
    },
    delegateUpdates: function() {
        if (this.enableScroll && this.rendered) {
            this.autoScroll()
        }
    },
    autoScroll: function() {
        var f = this.items.length;
        var c = this.el.dom.clientWidth;
        var d = this.stripWrap;
        var b = d.dom.offsetWidth;
        var g = this.getScrollPos();
        var a = this.edge.getOffsetsTo(this.stripWrap)[0] + g;
        if (!this.enableScroll || f < 1 || b < 20) {
            return
        }
        d.setWidth(c);
        var e = (this.items.length == 1);
        if (a <= c || e) {
            d.dom.scrollLeft = 0;
            if (this.showSelBtn) {
                this.showSelBtn = false;
                this.el.removeClass("x-pathbuttons-selection-btn-displayed");
                this.menuBtn.hide()
            }
        } else {
            if (!this.showSelBtn) {
                this.el.addClass("x-pathbuttons-selection-btn-displayed")
            }
            c -= d.getMargins("lr");
            d.setWidth(c > 20 ? c : 20);
            if (!this.showSelBtn) {
                if (!this.menuBtn) {
                    this.createMenuBtn()
                } else {
                    this.menuBtn.show()
                }
            }
            this.showSelBtn = true;
            this.updateScrollandSelMenu()
        }
    },
    createMenuBtn: function() {
        var b = this.el.dom.offsetHeight;
        var a = this.el.insertFirst({
            cls: "ux-pathbuttons-selection-btn"
        });
        a.setHeight(b);
        a.addClassOnOver("ux-pathbuttons-selection-btn-over");
        a.addClassOnClick("ux-pathbuttons-selection-btn-click");
        this.leftRepeater = new Ext.util.ClickRepeater(a, {
            interval: this.scrollRepeatInterval,
            handler: this.onShowMenu,
            scope: this
        });
        this.menuBtn = a
    },
    onShowMenu: function() {
        var c = this.menuBtn.getXY();
        var a = -5,
            b = 28;
        if (this.selMenu.isVisible()) {
            this.selMenu.hide()
        } else {
            this.selMenu.showAt([c[0] + a, c[1] + b])
        }
    },
    getScrollPos: function() {
        return parseInt(this.stripWrap.dom.scrollLeft, 10) || 0
    },
    updateScrollandSelMenu: function() {
        var c = 6 + 8;
        var l = this.items.length;
        var a = l - 1;
        var d = 0;
        var m = this.stripWrap.getWidth();
        var b;
        for (var f = a; f >= 0; f--) {
            b = this.items[f].el.child(".ux-pathbutton-center");
            d += b.getWidth() + c;
            if (d > m) {
                break
            }
        }
        if (f == a) {
            f -= 1
        }
        this.selMenu.removeAll();
        for (var e = 0; e <= f; e++) {
            this.selMenu.addItem({
                path: this.items[e].path,
                text: this.items[e].text
            })
        }
        var k = this.items[f + 1];
        var g = this.stripWrap.dom.scrollLeft;
        var h = k.el.getOffsetsTo(this.stripWrap)[0] + g;
        this.stripWrap.scrollTo("left", h - c)
    }
});
SYNO.FileStation.PathBar.PathButton = function(a, e, f, j, i, d, g, c) {
    this.webfm = c;
    var b = d ? this.firstBtnCls : "";
    var h = g ? this.lastBtnCls : "";
    SYNO.FileStation.PathBar.PathButton.superclass.constructor.call(this, {
        text: f,
        itemId: e,
        renderTo: a,
        tooltip: j,
        clickEvent: "mousedown",
        tabIndex: -1,
        listeners: {
            click: {
                fn: function() {
                    var k = this.getPath();
                    if (k) {
                        this.webfm.onGoToPathWithDir(k)
                    }
                },
                scope: this
            }
        },
        template: new Ext.Template('<table cellspacing="0" class="x-btn ' + b + " " + h + ' {3}"><tbody><tr>', '<td class="ux-pathbutton-left"></td>', '<td class="ux-pathbutton-center"><em class="{5} unselectable="on">', '<button class="x-btn-text {2}" type="{1}" style="height:18px;">{0}</button>', "</em></td>", '<td class="ux-pathbutton-right"></td>', "</tr></tbody></table>")
    });
    this.setPath(i)
};
Ext.extend(SYNO.FileStation.PathBar.PathButton, Ext.Button, {
    firstBtnCls: "x-first-btn",
    lastBtnCls: "x-last-btn",
    setPath: function(a) {
        this.path = a
    },
    getPath: function() {
        return this.path
    },
    updateButton: function(d, b, c, a) {
        this.setPath(c);
        this.setText(d);
        this.setTooltip(b);
        if (a) {
            this.addClass(this.lastBtnCls)
        } else {
            this.removeClass(this.lastBtnCls)
        }
    }
});
Ext.ns("SYNO.FileStation");
SYNO.FileStation.FocusGridPlugin = Ext.extend(Ext.Component, {
    init: function(a) {
        a.mon(a, "click", function(b) {
            if (document.activeElement.id === this.getView().focusEl.id) {
                return
            }
            if (Ext.isGecko) {
                this.getView().focusEl.focus()
            } else {
                this.getView().focusEl.focus.defer(1, this.getView().focusEl)
            }
        }, a)
    }
});
SYNO.FileStation.FocusGridPluginInstance = new SYNO.FileStation.FocusGridPlugin();
Ext.preg("focusgridplugin", SYNO.FileStation.FocusGridPlugin);
Ext.ns("SYNO.FileStation");
SYNO.FileStation.GridPanelFlexcrollPlugin = Ext.extend(Ext.Component, {
    init: function(b) {
        var a = this;
        Ext.apply(b, {
            updateScrollbar: a.updateScrollbar
        });
        b.mon(b, "beforerender", function() {
            b.cls = b.cls ? b.cls + " syno-webfm-scroll" : "syno-webfm-scroll";
            b.overCls = b.overCls ? b.overCls + " syno-webfm-scroll-over" : "syno-webfm-scroll-over"
        }, this);
        b.mon(b, "afterrender", function(d) {
            var c = d.getView().scroller;
            d.updateScrollbar(c.dom);
            d.mon(d, "resize", function() {
                this.updateScrollbar(c.dom)
            }, d, {
                buffer: 500
            });
            d.mon(d.getView(), "refresh", function() {
                this.updateScrollbar(c.dom)
            }, d, {
                buffer: 500
            });
            d.mon(d.getStore(), "load", function() {
                this.updateScrollbar(c.dom, true);
                this.fireEvent("afterUpdateScrollbar", this)
            }, d, {
                buffer: 500
            });
            d.mon(d.getStore(), "clear", function() {
                this.updateScrollbar(c.dom, true)
            }, d, {
                buffer: 500
            });
            d.mon(d.getStore(), "datachanged", function() {
                this.updateScrollbar(c.dom)
            }, d, {
                buffer: 500
            });
            d.mon(d.getStore(), "update", function() {
                this.updateScrollbar(c.dom)
            }, d, {
                buffer: 500
            })
        }, this)
    },
    updateScrollbar: function(b, a) {
        if (b && b.fleXcroll) {
            if (a) {
                b.fleXcroll.setScrollPos(false, 0)
            }
            b.fleXcroll.updateScrollBars();
            if (!a) {
                b.fleXcroll.setScrollPos(0, 0, true)
            }
        } else {
            if (b) {
                fleXenv.fleXcrollMain(b);
                b.onfleXcroll = (function() {
                    if (this.isVisible() && this.getView().update) {
                        this.getView().update()
                    }
                }).createDelegate(this)
            }
        }
    }
});
SYNO.FileStation.GridPanelFlexcrollPluginInstance = new SYNO.FileStation.GridPanelFlexcrollPlugin();
Ext.preg("gridpanelflexcrollplugin", SYNO.FileStation.GridPanelFlexcrollPlugin);
SYNO.FileStation.BufferViewFlexcrollPlugin = Ext.extend(Ext.Component, {
    init: function(b) {
        var a = this;
        Ext.apply(b.getView(), {
            initTemplates: a.initTemplates,
            getVscrollerbarBase: a.getVscrollerbarBase,
            getContentwrapper: a.getContentwrapper,
            getVisibleRowCount: a.getVisibleRowCount,
            getVisibleRows: a.getVisibleRows
        })
    },
    initTemplates: function() {
        Ext.ux.grid.BufferView.prototype.initTemplates.apply(this, arguments);
        var a = this.templates;
        a.hcell = new Ext.Template('<td class="x-grid3-hd x-grid3-cell x-grid3-td-{id} {css}" style="{style}"><div class="x-grid3-hd-row-split"></div><div {tooltip} {attr} class="x-grid3-hd-inner webfm-x-grid3-hd x-grid3-hd-{id}" unselectable="on" style="{istyle}">', this.grid.enableHdMenu ? '<a class="x-grid3-hd-btn" href="#"></a>' : "", "{value}", '<img alt="" class="x-grid3-sort-icon" src="', Ext.BLANK_IMAGE_URL, '" />', "</div>", "</td>");
        a.hcell.disableFormats = true;
        a.hcell.compile()
    },
    getVscrollerbarBase: function() {
        if (this.scrollerbarbase) {
            return this.scrollerbarbase
        }
        return (this.scrollerbarbase = Ext.get(this.el.child("div.scrollerbarbase")))
    },
    getContentwrapper: function() {
        if (this.vscrollerbar) {
            return this.vscrollerbar
        }
        return (this.vscrollerbar = Ext.get(this.el.child("div.contentwrapper")))
    },
    getVisibleRowCount: function() {
        var b = this.getCalculatedRowHeight(),
            a = !Ext.isEmpty(this.getVscrollerbarBase()) ? this.getVscrollerbarBase().getHeight() : this.scroller.dom.clientHeight;
        return (a < 1) ? 0 : Math.ceil(a / b)
    },
    getVisibleRows: function() {
        var a = this.getVisibleRowCount(),
            b = !Ext.isEmpty(this.getContentwrapper()) ? (-1 * this.getContentwrapper().getTop(true) + 1) : this.scroller.dom.scrollTop,
            c = (b === 0 ? 0 : Math.floor(b / this.getCalculatedRowHeight()) - 1);
        return {
            first: Math.max(c, 0),
            last: Math.min(c + a + 3, this.ds.getCount() - 1)
        }
    }
});
SYNO.FileStation.BufferViewFlexcrollPluginInstance = new SYNO.FileStation.BufferViewFlexcrollPlugin();
Ext.preg("bufferviewflexcrollplugin", SYNO.FileStation.BufferViewFlexcrollPlugin);
Ext.ns("SYNO.FileStation");
SYNO.FileStation.SelectAllRowSelectionModel = Ext.extend(Ext.grid.RowSelectionModel, {
    constructor: function(a) {
        SYNO.FileStation.SelectAllRowSelectionModel.superclass.constructor.call(this, a);
        this.pageSelections = new Ext.util.MixedCollection(false, function(b) {
            return b.id
        })
    },
    onRefresh: function() {
        var f = this.grid.store,
            d = this.getSelections(),
            c = 0,
            a = d.length,
            b, e;
        this.silent = this.silentMode && true;
        this.clearSelections(true);
        for (; c < a; c++) {
            e = d[c];
            if ((b = f.indexOfId(e.id)) != -1) {
                this.selectRow(b, true)
            }
        }
        if (d.length != this.pageSelections.getCount()) {
            this.fireEvent("selectionchange", this)
        }
        this.silent = false
    },
    maskGrid: function(a) {
        if (a.loadMask) {
            a.loadMask.show()
        }
    },
    unmaskGrid: function(a) {
        if (a.loadMask) {
            a.loadMask.hide()
        }
    },
    selectAllRow: function(a) {
        if (this.isLocked()) {
            return
        }
        var c = this.grid,
            e = this.grid.store,
            d = this.grid.store.getCount();
        this.maskGrid(c);
        this.selections.clear();
        for (var b = 0; b < d; b++) {
            this.selectRow(b, true)
        }
        if (e.storetype === SYNO.webfm.utils.source.remotes) {
            this.unmaskGrid(c);
            if (e.getTotalCount() !== e.getCount()) {
                c.owner.findAppWindow().getToastBox.call(c, _WFT("search", "select_current_page_all"), false, false, {
                    delay: 2500,
                    offsetY: 32
                })
            }
            return
        }
        if (e.getTotalCount() === e.getCount()) {
            this.unmaskGrid(c);
            return
        }
        e.suspendEvents();
        e.load({
            params: {
                offset: 0,
                limit: e.getTotalCount()
            },
            callback: function() {
                this.pageSelections.clear();
                this.pageSelections.addAll(e.data.items);
                e.resumeEvents();
                this.unmaskGrid(c);
                if (a.callback) {
                    a.callback.call(a.scope || this)
                }
            },
            scope: this
        })
    },
    clearSelections: function(a) {
        if (this.isLocked()) {
            return
        }
        if (a !== true) {
            var c = this.grid.store,
                b = this.selections;
            b.each(function(d) {
                this.deselectRow(c.indexOfId(d.id))
            }, this);
            b.clear()
        } else {
            this.selections.clear()
        }
        this.last = false
    },
    clearAllSelections: function(a) {
        if (this.isLocked()) {
            return
        }
        if (a !== true) {
            var c = this.grid.store,
                b = this.pageSelections;
            b.each(function(d) {
                this.deselectRow(c.indexOfId(d.id))
            }, this);
            b.clear()
        } else {
            this.pageSelections.clear()
        }
    },
    selectRow: function(b, d, a) {
        if (this.isLocked() || (b < 0 || b >= this.grid.store.getCount()) || (d && this.isSelected(b))) {
            return
        }
        var c = this.grid.store.getAt(b);
        if (c && this.fireEvent("beforerowselect", this, b, d, c) !== false) {
            if (!d || this.singleSelect) {
                this.clearSelections();
                this.clearAllSelections()
            }
            this.selections.add(c);
            this.pageSelections.add(c);
            this.last = this.lastActive = b;
            if (!a) {
                this.grid.getView().onRowSelect(b)
            }
            if (!this.silent) {
                this.fireEvent("rowselect", this, b, c);
                this.fireEvent("selectionchange", this)
            }
        }
    },
    selectRows: function(c, d) {
        if (!d) {
            this.clearSelections();
            this.clearAllSelections()
        }
        for (var b = 0, a = c.length; b < a; b++) {
            this.selectRow(c[b], true)
        }
    },
    selectRange: function(b, a, d) {
        var c;
        if (this.isLocked()) {
            return
        }
        if (!d) {
            this.clearSelections();
            this.clearAllSelections()
        }
        if (b <= a) {
            for (c = b; c <= a; c++) {
                this.selectRow(c, true)
            }
        } else {
            for (c = b; c >= a; c--) {
                this.selectRow(c, true)
            }
        }
    },
    deselectRow: function(b, a) {
        if (this.isLocked()) {
            return
        }
        if (this.last == b) {
            this.last = false
        }
        if (this.lastActive == b) {
            this.lastActive = false
        }
        var c = this.grid.store.getAt(b);
        if (c) {
            this.selections.remove(c);
            this.pageSelections.remove(c);
            if (!a) {
                this.grid.getView().onRowDeselect(b)
            }
            this.fireEvent("rowdeselect", this, b, c);
            this.fireEvent("selectionchange", this)
        }
    },
    getSelections: function() {
        return [].concat(this.pageSelections.items)
    }
});
Ext.ns("SYNO.FileStation");
SYNO.FileStation.FocusComponentPlugin = Ext.extend(Ext.Component, {
    init: function(a) {
        a.mon(a, "afterrender", function() {
            this.onAfterRender(a)
        }, this)
    },
    onAfterRender: function(a) {
        a.getEl().on("click", function(b) {
            if (Ext.isGecko) {
                this.getEl().focus()
            } else {
                this.getEl().focus.defer(1, this.getEl())
            }
        }, a)
    }
});
SYNO.FileStation.FocusComponentPluginInstance = new SYNO.FileStation.FocusComponentPlugin();
Ext.preg("focuscomponentplugin", SYNO.FileStation.FocusComponentPlugin);
SYNO.FileStation.DataViewSelectionModel = function(d) {
    var e = d;
    var g = function() {
        return e.getSelectionCount() > 0
    };
    var f = function() {
        return e.getSelectedRecords()
    };
    var i = function() {
        return f()[0]
    };
    var a = function() {
        return e.getSelectionCount()
    };
    var j = function(l) {
        e.selectAllRow(l)
    };
    var k = function(l) {
        e.clearAllSelections(l)
    };
    var h = function(l) {
        e.clearSelections(l)
    };
    var c = function(l) {
        e.select(l)
    };
    var b = function(m, n) {
        var l = 0;
        if (Ext.isEmpty(m)) {
            return
        }
        if (!n) {
            this.clearSelections()
        }
        for (l = 0; l < m.length; l++) {
            this.selectRow(e.store.indexOf(m[l]))
        }
    };
    return {
        dataView: e,
        getSelected: i,
        getCount: a,
        hasSelection: g,
        getSelections: f,
        selectAllRow: j,
        clearAllSelections: k,
        clearSelections: h,
        selectRow: c,
        selectRecords: b
    }
};
SYNO.FileStation.SelectAllDataView = Ext.extend(SYNO.SDS.Utils.DataView.LazyDataView, {
    constructor: function(a) {
        SYNO.FileStation.SelectAllDataView.superclass.constructor.call(this, a);
        this.selectAll = new Ext.util.MixedCollection(false, function(b) {
            return b.id
        })
    },
    getSelectionModel: function() {
        return this.selectionModel || (this.selectionModel = new SYNO.FileStation.DataViewSelectionModel(this))
    },
    getSelectionCount: function() {
        return this.selectAll.items.length
    },
    getSelectedNodes: function() {
        return [].concat(this.selectAll.items)
    },
    getSelectedRecords: function() {
        return [].concat(this.selectAll.items)
    },
    clearAllSelections: function(a, b) {
        if ((this.multiSelect || this.singleSelect) && this.selectAll.getCount() > 0) {
            if (!b) {
                this.selected.removeClass(this.selectedClass)
            }
            this.selected.clear();
            this.selectAll.clear();
            this.last = false;
            if (!a) {
                this.fireEvent("selectionchange", this, this.selected.elements)
            }
        }
    },
    onContainerClick: function(a) {
        if (a.getTarget(".vscrollerbar") === null) {
            this.clearAllSelections()
        }
    },
    selectAllRow: function(a) {
        var d = this,
            e = d.getStore(),
            c = e.getCount();
        d.getEl().mask(d.loadingText || "", "x-mask-loading");
        d.clearAllSelections();
        for (var b = 0; b < c; b++) {
            d.select(b, true, true)
        }
        if (e.storetype === SYNO.webfm.utils.source.remotes) {
            d.getEl().unmask();
            if (e.getTotalCount() !== e.getCount()) {
                this.owner.findAppWindow().getToastBox.call(this, _WFT("search", "select_current_page_all"), false, false, {
                    delay: 2500,
                    offsetY: 32
                })
            }
            return
        }
        if (e.getTotalCount() === e.getCount()) {
            d.getEl().unmask();
            return
        }
        e.suspendEvents();
        e.load({
            params: {
                offset: 0,
                limit: e.getTotalCount()
            },
            callback: function() {
                if (d.isDestroy) {
                    return
                }
                this.selectAll.addAll(e.data.items);
                e.resumeEvents();
                d.getEl().unmask();
                if (a.callback) {
                    a.callback.call(a.scope || this)
                }
            },
            scope: this
        })
    },
    selectRange: function(c, a, b) {
        if (!b) {
            this.clearAllSelections(true)
        }
        this.select(this.getNodes(c, a), true)
    },
    isSelected: function(a) {
        return this.selectAll.contains(this.getRecord(this.getNode(a)))
    },
    deselect: function(a) {
        if (this.isSelected(a)) {
            a = this.getNode(a);
            this.selected.removeElement(a);
            this.selectAll.remove(this.getRecord(this.getNode(a)));
            if (this.last == a.viewIndex) {
                this.last = false
            }
            Ext.fly(a).removeClass(this.selectedClass);
            this.fireEvent("selectionchange", this, this.selected.elements)
        }
    },
    select: function(d, f, b) {
        if (Ext.isArray(d)) {
            if (!f) {
                this.clearAllSelections(true)
            }
            for (var c = 0, a = d.length; c < a; c++) {
                this.select(d[c], true, true)
            }
            if (!b) {
                this.fireEvent("selectionchange", this, this.selected.elements)
            }
        } else {
            var e = this.getNode(d);
            if (!f) {
                this.clearAllSelections(true)
            }
            if (e && !this.isSelected(e)) {
                if (this.fireEvent("beforeselect", this, e, this.selected.elements) !== false) {
                    Ext.fly(e).addClass(this.selectedClass);
                    this.selected.add(e);
                    this.selectAll.add(this.getRecord(this.getNode(e)));
                    this.last = e.viewIndex;
                    if (!b) {
                        this.fireEvent("selectionchange", this, this.selected.elements)
                    }
                }
            }
        }
    },
    refresh: function() {
        SYNO.FileStation.SelectAllDataView.superclass.refresh.call(this);
        var f = this,
            d = f.getSelectedRecords(),
            c = 0,
            g = f.getStore(),
            a = d.length,
            b;
        for (; c < a; c++) {
            var e = d[c];
            if ((b = g.indexOfId(e.id)) != -1) {
                this.select(b, true, true)
            }
        }
    }
});
SYNO.FileStation.ThumbnailSizeManager = Ext.extend(Object, {
    constructor: function(a) {
        var b = this;
        a = a || {};
        b.largeThumbCls = "syno-sds-fs-large-thumb";
        b.smallThumbCls = "syno-sds-fs-small-thumb";
        b.thumbSize = SYNO.webfm.utils.ThumbSize.MEDIUM;
        Ext.apply(b, a)
    },
    resizeThumb: function(b) {
        var c = b.getWidth(),
            a = b.getHeight();
        b.removeClass("syno-sds-fs-large-thumb-width");
        b.removeClass("syno-sds-fs-large-thumb-height");
        if (c >= a) {
            b.addClass("syno-sds-fs-large-thumb-width")
        } else {
            b.addClass("syno-sds-fs-large-thumb-height")
        }
    },
    getThumbSize: function() {
        return this.thumbSize
    },
    changeThumbSize: function(b, a) {
        var c = this;
        b.removeClass(c.largeThumbCls);
        b.removeClass(c.smallThumbCls);
        switch (a) {
            case SYNO.webfm.utils.ThumbSize.SMALL:
                b.addClass(c.smallThumbCls);
                c.thumbSize = SYNO.webfm.utils.ThumbSize.SMALL;
                break;
            case SYNO.webfm.utils.ThumbSize.MEDIUM:
                c.thumbSize = SYNO.webfm.utils.ThumbSize.MEDIUM;
                break;
            case SYNO.webfm.utils.ThumbSize.LARGE:
                b.addClass(c.largeThumbCls);
                c.thumbSize = SYNO.webfm.utils.ThumbSize.LARGE;
                break;
            default:
                c.thumbSize = SYNO.webfm.utils.ThumbSize.MEDIUM;
                break
        }
    }
});
Ext.define("SYNO.FileStation.ImageLoader", {
    extend: "Ext.Component",
    maxImageRequest: 24,
    constructor: function() {
        this.imageQueue = [];
        this.imageToDoQueue = [];
        this.callParent(arguments)
    },
    getTask: function() {
        this.actionTask = this.actionTask || this.addTask({
            id: "task_set_image",
            interval: 17,
            run: this.setImage,
            scope: this
        });
        return this.actionTask
    },
    addImage: function(a) {
        this.innerAddImage(a)
    },
    innerAddImage: function(d) {
        var c = this,
            a = c.imageToDoQueue,
            b = c.getTask();
        if ((a.indexOf(d) !== -1) || c.imageQueue.indexOf(d) !== -1) {
            return
        }
        a.push(d);
        if (b.running === false) {
            b.restart(true)
        }
    },
    removeImage: function(c) {
        var b = this,
            a = b.imageQueue;
        if ((a.length === 0) || (a.indexOf(c) === -1)) {
            return
        }
        a.remove(c);
        if (a.length === 0) {
            b.getTask().stop()
        }
    },
    removeAll: function() {
        var a = this;
        a.imageQueue = [];
        a.imageToDoQueue = [];
        a.getTask().stop()
    },
    setImage: function() {
        var d = this,
            b = 0,
            a = d.imageToDoQueue.concat(d.imageQueue),
            c = Math.min(d.maxImageRequest, a.length),
            f, e = [];
        d.imageToDoQueue = [];
        for (b = 0; b < c; b++) {
            f = a[b];
            if (d.fireEvent("setimage", f) === false) {
                e.push(f)
            }
        }
        a.splice(0, c);
        a = a.concat(e);
        d.imageQueue = a;
        if (a.length === 0) {
            d.getTask().stop()
        }
    },
    stop: function() {
        var b = this,
            a = b.getTask();
        a.stop()
    },
    destroy: function() {
        var a = this;
        a.imageQueue = null;
        a.imageToDoQueue = null;
        if (a.actionTask) {
            a.actionTask = null
        }
        a.callParent(arguments)
    }
});
Ext.define("SYNO.FileStation.ThumbnailsView", {
    extend: "SYNO.FileStation.SelectAllDataView",
    ieMaxURLLength: 2048,
    shadowCls: "syno-sds-fs-thumb-shadow",
    defaultSupportExt: ["jpg", "jpeg", "jpe", "bmp", "png", "tif", "tiff", "gif", "arw", "srf", "sr2", "dcr", "k25", "kdc", "cr2", "crw", "nef", "mrw", "ptx", "pef", "raf", "3fr", "erf", "mef", "mos", "orf", "rw2", "dng", "x3f", "raw", "psd"],
    defaultSupportVideoExt: ["3gp", "3g2", "asf", "dat", "divx", "dvr-ms", "m2t", "m2ts", "m4v", "mkv", "mp4", "mts", "mov", "qt", "tp", "trp", "ts", "vob", "wmv", "xvid", "ac3", "amr", "rm", "rmvb", "ifo", "mpeg", "mpg", "mpe", "m1v", "m2v", "mpeg1", "mpeg2", "mpeg4", "ogv", "webm", "flv", "f4v", "avi", "swf", "vdr", "iso"],
    constructor: function(a) {
        this.supportExt = Ext.isObject(SYNO.SDS.Config) ? SYNO.SDS.Config.FnMap["SYNO.SDS.PhotoViewer.Application"].config.fb_extern[0].file || this.defaultSupportExt : this.defaultSupportExt;
        a = a || {};
        a = Ext.apply({
            loadingText: _WFT("common", "loading"),
            cls: "syno-sds-fs-thumbnailsView",
            region: "center",
            multiSelect: true,
            autoScroll: true,
            itemMarginWidth: 12,
            itemSelector: "div.thumb-wrap",
            disableTextSelect: true,
            itemCls: ".syno-sds-fs-thumbnailsView .thumb-wrap",
            tpl: new Ext.XTemplate('<tpl for=".">', '<div class="thumb-wrap" id="{[this.htmlEncode(values.file_id)]}" role="option" aria-haspopup="true">', '<div ext:qtip="{[this.getTooltip(values)]}" class="thumb">', '<div class="thumb-hover thumb-loading" externalcss="{[this.getExternalCSS(values)]}">', '<img defaulticon="{icon}" draggable="false" class="{[this.hasThumbnail(values)]}" thumbnails="{[this.getThumbnailURL(values)]}" src="{[this.getDefaultSrc()]}" isvideo="{[this.getVideoType(values)]}">', "</div>", "<span>{[this.htmlEncode(values.filename)]}</span>", "</div>", "</div>", "</tpl>", '<div class="x-clear"></div>', {
                compiled: true,
                disableFormats: true,
                getThumbnailURL: this.getThumbnailURL.createDelegate(this),
                hasThumbnail: this.hasThumbnail.createDelegate(this),
                getVideoType: this.getVideoType.createDelegate(this),
                getDefaultSrc: this.getDefaultSrc.createDelegate(this),
                getExternalCSS: this.getExternalCSS.createDelegate(this),
                getTooltip: this.getTooltip.createDelegate(this),
                htmlEncode: Ext.util.Format.htmlEncode
            }),
            prepareData: (function(b) {
                if (Ext.isEmpty(b.icon)) {
                    b.icon = SYNO.webfm.utils.getThumbName(b)
                }
                return b
            }).createDelegate(this)
        }, a);
        this.thumbSizeManager = new SYNO.FileStation.ThumbnailSizeManager();
        this.imageLoader = new SYNO.FileStation.ImageLoader();
        this.callParent([a]);
        this.mon(this.imageLoader, "setimage", this.setImgURL, this)
    },
    onStoreLoad: function() {
        this.updateScrollbar(this.trackResetOnLoad);
        this.trackResetOnLoad = true;
        this.fireEvent("afterUpdateScrollbar", this)
    },
    convertFileName: function(d, c) {
        var a = d.is_snapshot && d.is_btrfs_subvol,
            b = Ext.util.Format.htmlEncode(d.filename);
        if (!a) {
            return b
        }
        b = b.replace(/-/g, " ");
        b = b.substr(0, 14).replace(/\./g, "-") + b.substr(14, b.length).replace(/\./g, ":");
        if (c && d.snapshot_desc !== "") {
            b += Ext.util.Format.htmlEncode(" - " + d.snapshot_desc)
        }
        return b
    },
    getThumbnailSize: function(b) {
        var a = "small";
        switch (b) {
            case SYNO.webfm.utils.ThumbSize.SMALL:
                break;
            case SYNO.webfm.utils.ThumbSize.MEDIUM:
                break;
            case SYNO.webfm.utils.ThumbSize.LARGE:
                a = "medium";
                break;
            default:
                a = "small";
                break
        }
        return a
    },
    getSizeNumber: function(b) {
        var a = 128;
        switch (b) {
            case SYNO.webfm.utils.ThumbSize.SMALL:
                a = 64;
                break;
            case SYNO.webfm.utils.ThumbSize.MEDIUM:
                a = 128;
                break;
            case SYNO.webfm.utils.ThumbSize.LARGE:
                a = 256;
                break;
            default:
                a = 128;
                break
        }
        return a
    },
    resizeThumb: function(a) {},
    changeThumbSize: function(a) {
        this.thumbSizeManager.changeThumbSize(this.getEl(), a);
        this.onResize()
    },
    getTooltip: function(c) {
        var b = "{0}<br>{1}<br>{2}",
            a = "{0}<br>{1}";
        b = c.isdir ? String.format(a, _WFT("common", "common_filename") + _T("common", "colon") + Ext.util.Format.htmlEncode(Ext.util.Format.htmlEncode(c.filename)), Ext.util.Format.htmlEncode(_WFT("filetable", "filetable_mtime") + _T("common", "colon") + (new Date(c.mt * 1000)).toLocaleString())) : String.format(b, _WFT("common", "common_filename") + _T("common", "colon") + Ext.util.Format.htmlEncode(Ext.util.Format.htmlEncode(c.filename)), Ext.util.Format.htmlEncode(_WFT("common", "common_filesize") + _T("common", "colon") + Ext.util.Format.fileSize(c.filesize)), Ext.util.Format.htmlEncode(_WFT("filetable", "filetable_mtime") + _T("common", "colon") + (new Date(c.mt * 1000)).toLocaleString()));
        return b
    },
    afterRender: function() {
        this.callParent(arguments);
        this.mun(this.getTemplateTarget(), "click", this.onClick, this);
        this.on("flexcrollInitDone", function() {
            this.mon(this.el.child(".mcontentwrapper"), "click", this.onClick, this)
        }, this, {
            single: true
        });
        if (this.keys) {
            this.keymap = new Ext.KeyMap(this.getEl(), this.keys)
        }
    },
    getDefaultSrc: function() {
        this.defaultSrc = this.RELURL + "../../../../scripts/ext-3/resources/images/default/s.gif";
        return this.defaultSrc
    },
    isSupportExt: function(b) {
        var a = false;
        Ext.each(this.supportExt, function(c) {
            if (b === c) {
                a = true
            }
        }, this);
        return a
    },
    isSupportVideoExt: function(b) {
        var a = false;
        Ext.each(this.defaultSupportVideoExt, function(c) {
            if (b === c) {
                a = true
            }
        }, this);
        return a
    },
    getExternalCSS: function(d) {
        var a, c = this.getStore().getById(d.file_id),
            b = this.thumbSizeManager.getThumbSize();
        if (SYNO.webfm.utils.isRemoteSource(this.owner.getCurrentSource()) && (a = this.owner.getExternIcon(c, this.getSizeNumber(b)))) {
            d.iconObj = a;
            return a.css ? a.css : ""
        }
        return ""
    },
    hasThumbnail: function(a) {
        if (a.mountType === "remotefail") {
            return ""
        }
        return this.isSupportExt(a.type.toLowerCase()) || this.isSupportVideoExt(a.type.toLowerCase()) || this.isSupportPluginExt(a) ? this.shadowCls : ""
    },
    getVideoType: function(a) {
        return this.isSupportVideoExt(a.type.toLowerCase())
    },
    isSupportPluginExt: function(b) {
        var a = false;
        Ext.each(this.owner.externThumbnailExts, function(c) {
            if (c.checkFn(b)) {
                a = true;
                return false
            }
        });
        return a
    },
    getExtThumbnailURL: function(a, c) {
        var b = false;
        Ext.each(this.owner.externThumbnailExts, function(d) {
            if (d.checkFn(a)) {
                b = d.getFn(c);
                return false
            }
        });
        return b
    },
    getDefaultIcon: function(b) {
        var c = this.RELURL.replace("webfm/", ""),
            a = SYNO.SDS.UIFeatures.IconSizeManager.getIconPath(c + "images/{1}/files_ext_256/" + b, "FileType", true);
        return a
    },
    getThumbnailURL: function(e) {
        var d = this.getDefaultIcon(e.icon),
            f = this.isSupportVideoExt(e.type.toLowerCase());
        if (e.mountType === "remotefail") {
            return this.getDefaultIcon("remotefailmountpoint.png")
        } else {
            if (SYNO.webfm.utils.isRemoteSource(this.owner.getCurrentSource()) && e.iconObj && e.iconObj.url) {
                return e.iconObj.url
            }
        }
        var b = d,
            c, a = {
                path: Ext.encode(e.path),
                mt: e.mt
            };
        if (this.isSupportExt(e.type.toLowerCase()) || f) {
            b = Ext.urlAppend(SYNO.API.currentManager.getBaseURL("SYNO.FileStation.Thumb", "get", 2), Ext.urlEncode(a))
        } else {
            if (false !== (c = this.getExtThumbnailURL(e, a))) {
                b = c
            }
        }
        if (SYNO.webfm.VFS.isVFSPath(this.owner.getCurrentDir()) || b.length > this.ieMaxURLLength) {
            return d
        }
        return b
    },
    removeListeners: function(a) {
        var b = Ext.get(a);
        b.removeAllListeners()
    },
    onImageLoad: function(c, a, b) {
        var d = Ext.get(a);
        d.parent().removeClass("thumb-loading");
        d.parent().addClass(Ext.fly(a).parent().getAttribute("externalcss"));
        this.resizeThumb(d);
        d.addClass("fadein")
    },
    onImageError: function(a) {
        var c = a.getAttribute("defaulticon"),
            b = this.getDefaultIcon(c),
            d = Ext.get(a);
        d.removeClass(this.shadowCls);
        d.on("error", this.setDefaultIcon, this);
        a.src = b;
        a.loaded = undefined
    },
    onImageLoadEvent: function(a) {
        Ext.get(a).on("load", this.onImageLoad, this)
    },
    setDefaultIcon: function(e, b, d) {
        var c = this.getDefaultIcon("misc.png"),
            a = Ext.get(b);
        a.removeClass(this.shadowCls);
        this.onImageLoadEvent(b);
        b.src = c;
        a.un("error", this.setDefaultIcon, this)
    },
    errorHandler: function(c, a, b) {
        this.onImageError(a)
    },
    setImgURL: function(d) {
        var a = this.thumbSizeManager.getThumbSize();
        var e, c, b;
        this.all.each(function(f) {
            if (f.id === d) {
                e = f;
                c = e.select("img");
                return false
            }
        }, this);
        if (c && c.elements.length > 0) {
            b = c.elements[0];
            this.onImageLoadEvent(b);
            Ext.fly(b).on("error", this.errorHandler, this);
            if (b.getAttribute("isvideo") == "true") {
                a = SYNO.webfm.utils.ThumbSize.LARGE
            }
            b.src = Ext.urlAppend(b.getAttribute("thumbnails"), "size=" + this.getThumbnailSize(a));
            b.loaded = a
        }
    },
    onLoadItem: function(d) {
        var c = d.select("img"),
            b, a = this.thumbSizeManager.getThumbSize();
        if (c.elements.length > 0) {
            b = c.elements[0];
            if (b.loaded !== a && b.loaded !== SYNO.webfm.utils.ThumbSize.LARGE) {
                this.imageLoader.addImage(d.id)
            } else {
                this.resizeThumb(Ext.fly(b))
            }
        }
    },
    onUnLoadItem: function(a) {
        this.imageLoader.removeImage(a.id)
    },
    removeEvents: function() {
        var c = this.getTemplateTarget();
        if (!c) {
            return
        }
        var a = Ext.query(".thumb-hover img", c.dom);
        for (var b = 0; b < a.length; b++) {
            this.removeListeners(a[b])
        }
    },
    refresh: function() {
        this.removeEvents();
        this.imageLoader.removeAll();
        this.callParent(arguments)
    },
    destroy: function() {
        this.removeEvents();
        this.imageLoader.destroy();
        this.callParent(arguments)
    }
});
Ext.define("SYNO.FileStation.FolderSharingThumbnailsView", {
    extend: "SYNO.FileStation.ThumbnailsView",
    getExternalCSS: function() {
        return ""
    },
    getThumbnailURL: function(c) {
        var b = this.getDefaultIcon(c.icon),
            d = this.isSupportVideoExt(c.type.toLowerCase());
        if (c.mountType === "remotefail") {
            return this.getDefaultIcon("remotefailmountpoint.png")
        } else {
            if (c.iconObj && c.iconObj.url) {
                return c.iconObj.url
            }
        }
        var a = this.isSupportExt(c.type.toLowerCase()) || d ? Ext.urlAppend(SYNO.API.currentManager.getBaseURL("SYNO.FolderSharing.Thumb", "get", 2), Ext.urlEncode({
            path: Ext.encode(c.path),
            mt: c.mt,
            _sharing_id: Ext.encode(this.folderSharingURL)
        })) : b;
        if (a.length > this.ieMaxURLLength) {
            return b
        }
        return a
    }
});