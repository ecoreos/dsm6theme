/* Copyright (c) INTEGRA EMPRESAS 2016. All rights reserved. */

Ext.define("SYNO.SDS.HelpBrowser.DisplaySettingDlg", {
    extend: "SYNO.SDS.ModalWindow",
    constructor: function(a) {
        this.callParent([this.fillConfig(a)])
    },
    fillConfig: function(a) {
        var b = {
            width: 450,
            height: 230,
            title: _T("mainmenu", "apptitle"),
            closable: true,
            items: [{
                xtype: "syno_formpanel",
                itemId: "setting",
                items: [{
                    xtype: "syno_displayfield",
                    hideLabel: true,
                    value: _T("helpbrowser", "auto_launch_desc")
                }, {
                    name: "noAutoLaunch",
                    xtype: "syno_checkbox",
                    checked: SYNO.SDS.UserSettings.getProperty("SYNO.SDS.HelpBrowser.Application", "nolaunch") || false,
                    boxLabel: _T("helpbrowser", "no_auto_launch")
                }]
            }],
            fbar: {
                toolbarCls: "x-panel-fbar x-statusbar",
                items: [{
                    xtype: "syno_button",
                    text: _T("common", "ok"),
                    btnStyle: "blue",
                    handler: this.saveSettings,
                    scope: this
                }]
            }
        };
        Ext.apply(b, a);
        return b
    },
    getSettingForm: function() {
        return this.getComponent("setting")
    },
    getNoLaunchField: function() {
        return this.getSettingForm().getForm().findField("noAutoLaunch")
    },
    saveSettings: function() {
        var a = this.getNoLaunchField().getValue();
        SYNO.SDS.UserSettings.setProperty("SYNO.SDS.HelpBrowser.Application", "launchSetting", true);
        SYNO.SDS.UserSettings.setProperty("SYNO.SDS.HelpBrowser.Application", "nolaunch", a);
        this.close()
    }
});
Ext.namespace("SYNO.SDS.HelpBrowser");
SYNO.SDS.HelpBrowser.Application = Ext.extend(SYNO.SDS.AppInstance, {
    appWindowName: "SYNO.SDS.HelpBrowser.MainWindow",
    constructor: function() {
        SYNO.SDS.HelpBrowser.Application.superclass.constructor.apply(this, arguments)
    }
});
Ext.define("SYNO.SDS.HelpBrowser.SearchField", {
    extend: "SYNO.SDS.Utils.SearchField",
    listAlign: "tl-bl?",
    setContent: function(a) {
        this.view.getEl().update(a)
    },
    onStoreLoad: function(a) {
        if (!_S("rewriteApp") || (_S("demo_mode") && _S("rewriteApp") === "SYNO.SDS.HelpBrowser.Application")) {
            if (a.reader.jsonData.noindexdb) {
                var c = a.reader.jsonData.msg,
                    b = a.reader.jsonData.error;
                if (c) {
                    this.setContent(_T(c.section, c.key))
                } else {
                    if (b) {
                        this.setContent(_T(b.section, b.key))
                    } else {
                        this.setContent(_T("helptoc", "try_download_indexdb") || "Try to download indexdb")
                    }
                }
            } else {
                SYNO.SDS.HelpBrowser.SearchField.superclass.onStoreLoad.apply(this, arguments)
            }
        } else {
            a.filterBy(function(d) {
                if (d.get("type") === "help" && d.get("owner") === _S("rewriteApp")) {
                    return true
                }
                return false
            })
        }
    }
});
Ext.define("SYNO.SDS.HelpBrowser.OnlineSearchField", {
    extend: "SYNO.SDS.HelpBrowser.SearchField",
    bbarHeight: 54,
    constructor: function(a) {
        var b = new SYNO.API.Store({
            api: "SYNO.Core.Help",
            method: "get_search_result",
            version: 1,
            appWindow: a.owner,
            autoDestroy: true,
            reader: new Ext.data.JsonReader({
                root: "items",
                id: "_random"
            }, ["id", "title", {
                name: "desc",
                convert: function(d, c) {
                    return String.format(d, _D("product"))
                }
            }, "owner", "topic", "type", "link"]),
            baseParams: {
                dsm: _S("majorversion") + "." + _S("minorversion") + "-" + _S("version"),
                lang: _S("lang"),
                treeNode: Ext.util.JSON.encode(a.owner.treeNodeParam),
                type: "help",
                unique: _D("unique")
            }
        });
        this.callParent([a]);
        this.store = b
    },
    expand: function() {
        this.callParent(arguments);
        if (this.title || this.pageSize || this.list.bottomBar) {
            this.assetHeight = 0;
            if (this.title) {
                this.assetHeight += this.header.getHeight()
            }
            if (this.pageSize) {
                this.assetHeight += this.footer.getHeight()
            }
            if (this.list.bottomBar) {
                this.assetHeight += this.bbarHeight
            }
        }
    },
    initList: function() {
        this.callParent(arguments);
        if (!this.list.bottomBar) {
            this.list.bottomBar = this.list.createChild({
                cls: "x-combo-list-bbar",
                html: '<a target="blank" href="https://www.synology.com/knowledgebase">' + _T("helpbrowser", "tutorial_kb") + "</a>"
            });
            this.assetHeight += this.bbarHeight
        }
    },
    onStoreLoad: function() {
        this.tpl.kbSection = 0;
        this.tpl.helpSection = 0
    },
    setTreeNodeParam: function(a) {
        this.store.baseParams.treeNode = Ext.util.JSON.encode(a)
    }
});
Ext.define("SYNO.SDS.HelpBrowser.TutorialDataview", {
    extend: "SYNO.ux.ExpandableListView",
    tutorialURL: "./webman/modules/Tutorial/helptoc/SYNO.SDS.Tutorial.Application/helptoc.{0}",
    constructor: function(a) {
        var c = a.lang || "enu",
            b;
        this.tutorialURL = String.format(this.tutorialURL, c);
        b = {
            header: false,
            store: this.getTutorialStore(a),
            innerTpl: this.getInnerTpl(),
            cls: "syno-sds-hb-tutorial-expandable-view",
            itemSelector: "div.item-wrap",
            singleSelect: true,
            useARIA: true,
            listeners: {
                scope: this,
                click: this.itemClickHandler
            }
        };
        Ext.apply(b, a);
        this.callParent([b])
    },
    itemClickHandler: function(e, b, c, a) {
        var d = a.target;
        if (d.hasClassName("article-title")) {
            this.onTriggerClick(d)
        }
    },
    getTutorialStore: function(a) {
        var b = this;
        if (!b.tStore) {
            b.tStore = new SYNO.API.JsonStore({
                autoDestroy: true,
                appWindow: a.owner,
                preloadChildren: true,
                api: "SYNO.Core.Help",
                method: "get_tutorial_tree",
                version: 1,
                root: "tree[0].children",
                idProperty: "id",
                fields: ["id", "topic", "text", "desc", "children"],
                baseParams: {
                    lang: _S("lang"),
                    dsm: _S("majorversion") + "." + _S("minorversion") + "-" + _S("version"),
                    treeNode: Ext.util.JSON.encode({
                        DSM: _S("majorversion") + "." + _S("minorversion")
                    }),
                    offline: a.owner.offline,
                    unique: _D("unique")
                }
            });
            b.tStore.proxy.onRequestAPI = b.tStore.proxy.onRequestAPI.createSequence(function(c, d) {
                b.fireEvent("tutorialloaded", d)
            })
        }
        return b.tStore
    },
    onTriggerClick: function(b) {
        var a = b.getAttribute("id");
        if (a) {
            this.fireEvent("tutorialclick", a)
        }
    },
    onKeySpace: function(a) {
        var b = a.target;
        if (!b.hasClassName("article-title")) {
            this.callParent(arguments);
            return
        }
        this.onTriggerClick(b)
    },
    onKeyEnter: function(a) {
        var b = a.target;
        if (!b.hasClassName("article-title")) {
            this.callParent(arguments);
            return
        }
        this.onTriggerClick(b)
    },
    createTpl: function() {
        var a = new Ext.XTemplate('<tpl for=".">', '<div class="item-wrap syno-sds-hb-tutorial-wrap" role="option" aria-expanded="false" aria-label="{[Ext.util.Format.stripTags(values.text + \' \' + values.desc)]}" id="{[Ext.id()]}">', '<div class="item-summary">', '<div class="item-icon {[this.getIconCls(values.topic)]}"></div>', "<div>", '<div class="item-title">{text:htmlEncode}</div>', '<div class="item-desc">{desc}</div>', "</div>", (this.innerTpl) ? '<div class="item-toggle"><div class="item-toggle-img"></div></div>' : "", "</div>", '<div class="item-detail" style="display:none">', (this.innerTpl) ? this.innerTpl.html : "", "</div>", "</div>", "</tpl>", '<div class="x-clear"></div>', {
            getIconCls: function(b) {
                var d = /\/(\w+)\./,
                    c = d.exec(b);
                return (c) ? c[1] : null
            }
        });
        return a
    },
    getInnerTpl: function() {
        var a = new Ext.XTemplate('<tpl for="children">', '<div class="article-wrap">', '<div class="article-title" tabIndex="0" id="{values.id}" aria-label="{values.text}" role="button">{values.text}</div>', "</div>", "</tpl>", '<div style="clear: both;"></div>');
        return a
    }
});
SYNO.SDS.HelpBrowser.MainWindow = Ext.extend(SYNO.SDS.AppWindow, {
    dsmStyle: "v5",
    firstOpenTopic: "",
    useTopicID: true,
    defaultHomePage: "webman/help/" + _S("lang") + "/MainMenu/get_started.html",
    defaultTutorialHomePage: "webman/help/" + _S("lang") + "/Tutorial/home.html",
    blankPage: "help/blank.html",
    HomeId: "SYNO.SDS.Tutorial.Application",
    offline: true,
    noNetwork: true,
    isSendingRequest: false,
    curPlatform: null,
    curModel: null,
    hasTbar: true,
    treeCls: "",
    splitWindow: true,
    constructor: function(a) {
        this.extractDSUniuqe();
        this.treeNodeParam = {
            DSM: _S("majorversion") + "." + _S("minorversion")
        };
        SYNO.SDS.HelpBrowser.MainWindow.superclass.constructor.call(this, this.fillConfig(a));
        this.hookHelpFrameMessage();
        this.mon(Ext.get(this.helpFrameID), "load", this.onFrameLoad.createDelegate(this, [this.helpFrameID]));
        this.mon(SYNO.SDS.StatusNotifier, "jsconfigLoaded", this.getPkgVersionTask, this);
        this.mon(this.histBtnGroup.getHistory(), "change", this.changeURL, this);
        this.mon(this.tutorialView, "tutorialloaded", this.onTutorialStoreLoaded, this);
        this.mon(this.tutorialView, "tutorialclick", this.onOpenTutorial, this)
    },
    fillConfig: function(a) {
        this.helpFrameID = Ext.id();
        this.initTreePanel(Ext.apply(a.treeConfig, {
            itemId: "package_tree"
        }));
        this.onlineSearchField = new SYNO.SDS.HelpBrowser.OnlineSearchField(Ext.apply({
            itemId: "search",
            title: null,
            hidden: true
        }, this.getSearchFieldCfg(false)));
        this.offlineSearchField = new SYNO.SDS.HelpBrowser.SearchField(Ext.apply({
            itemId: "offline_search",
            hidden: true
        }, this.getSearchFieldCfg(true)));
        this.currentRatio = 100;
        this.xlfontMenuItem = new Ext.menu.CheckItem({
            text: _T("helpbrowser", "font_extra_large"),
            cls: "syno-sds-hb-option",
            group: "fontsize",
            checkHandler: function() {
                if (this.xlfontMenuItem.checked) {
                    this.changeFontSize(2)
                }
            },
            scope: this
        });
        this.lfontMenuItem = new Ext.menu.CheckItem({
            text: _T("helpbrowser", "font_large"),
            cls: "syno-sds-hb-option",
            group: "fontsize",
            checkHandler: function() {
                if (this.lfontMenuItem.checked) {
                    this.changeFontSize(1)
                }
            },
            scope: this
        });
        this.nfontMenuItem = new Ext.menu.CheckItem({
            text: _T("helpbrowser", "font_normal"),
            cls: "syno-sds-hb-option",
            group: "fontsize",
            checked: true,
            checkHandler: function() {
                if (this.nfontMenuItem.checked) {
                    this.changeFontSize(0)
                }
            },
            scope: this
        });
        this.fontsizeMenuItem = new Ext.menu.Item({
            text: _T("helpbrowser", "font_size"),
            tooltip: _T("helpbrowser", "font_size"),
            hideOnClick: false,
            menu: new SYNO.ux.Menu({
                items: [this.xlfontMenuItem, this.lfontMenuItem, this.nfontMenuItem]
            })
        });
        this.helpSynoMenuItem = new Ext.menu.CheckItem({
            text: _T("helpbrowser", "help_from_syno"),
            group: "helpsrc",
            checked: false,      
            cls: "syno-sds-hb-option",
            checkHandler: function() {
                if (this.helpSynoMenuItem.checked) {
                    this.changeOnOffLineStatus(false);
                    if (this.layout.activeItem !== this.getHomeCt()) {
                        this.onlineSearchField.show();
                        this.offlineSearchField.hide()
                    } else {
                        this.homeOnlineSearchField.show();
                        this.homeOfflineSearchField.hide()
                    }
                }
            },
            scope: this
        });        
        this.helpDSMenuItem = new Ext.menu.CheckItem({
            text: _T("helpbrowser", "help_from_ds"),
            cls: "syno-sds-hb-option",
            group: "helpsrc", 
            checked: true,                
            checkHandler: function() {
                if (this.helpDSMenuItem.checked) {
                    this.changeOnOffLineStatus(true);
                    if (this.layout.activeItem !== this.getHomeCt()) {
                        this.onlineSearchField.hide();
                        this.offlineSearchField.show()
                    } else {
                        this.homeOnlineSearchField.hide();
                        this.homeOfflineSearchField.show()
                    }
                }
            },
            scope: this
        });
       
        this.helpMenuItem = new Ext.menu.Item({
            text: _T("helpbrowser", "help_source"),
            tooltip: _T("helpbrowser", "help_source"),
            hideOnClick: false,
            menu: new SYNO.ux.Menu({
                items: [this.helpSynoMenuItem, this.helpDSMenuItem]
            })
        });
        this.helpSettingItem = new Ext.menu.Item({
            text: _T("helpbrowser", "help_option"),
            tooltip: _T("helpbrowser", "help_option"),
            handler: function() {
                var d = new SYNO.SDS.HelpBrowser.DisplaySettingDlg({
                    owner: this
                });
                d.show()
            },
            scope: this
        });
        var c = new SYNO.ux.Menu({
            items: [this.helpMenuItem, this.fontsizeMenuItem, this.helpSettingItem],
            onMouseOver: function(g) {
                var d = c.findTargetItem(g);
                if (d) {
                    var f = this.scope;
                    if (d == f.helpMenuItem) {
                        if (f.isSendingRequest === false && f.checkNetworkURL) {
                            f.createNetDetectionEl()
                        }
                    }
                    if (d.canActivate && !d.disabled) {
                        c.setActiveItem(d, true)
                    }
                }
                c.over = true;
                c.fireEvent("mouseover", c, g, d)
            },
            scope: this
        });
        this.optionBtn = new SYNO.ux.Button({
            text: _T("common", "webman_options"),
            tooltip: _T("common", "webman_options"),
            hideOnClick: false,
            menu: c
        });
        this.histBtnGroup = new SYNO.ux.BackNextBtnGroup({
            histCfg: {
                getFontStr: function(d) {
                    return "font=" + d
                },
                changefontSizeForAll: function(d, g) {
                    if (d == g) {
                        return
                    }
                    var f = this.getFontStr(d);
                    var h = this.getFontStr(g);
                    for (var e = 0; e < this.hist.length; e++) {
                        if (!this.hist[e].url) {
                            continue
                        }
                        this.hist[e].url = this.hist[e].url.replace(f, h)
                    }
                },
                changeFontSizeForCurrentObj: function(d, f) {
                    if (d == f) {
                        return
                    }
                    var e = this.getFontStr(d);
                    var g = this.getFontStr(f);
                    if (!this.getObject().url) {
                        return
                    }
                    this.getObject().url = this.getObject().url.replace(e, g);
                    this.fireEvent("change", this.getObject())
                }
            }
        });
        var b = {
            showHelp: false,
            cls: "syno-sds-hb-container",
            resizable: true,
            maximizable: true,
            y: 0,
            width: 995,
            height: 500,
            minHeight: 500,
            minWidth: 995,
            animCollapse: true,
            animate: true,
            tbar: {
                height: 36,
                cls: "syno-sds-hb-tbar",
                items: [this.histBtnGroup, {
                    xtype: "syno_button",
                    itemId: "dsmhelp",
                    hidden: !!_S("rewriteApp"),
                    tooltip: _T("common", "webman_home"),
                    iconCls: "syno-sds-hb-tbar-all",
                    scope: this,
                    width: 40,
                    handler: this.addHomeHistory
                }, this.optionBtn, {
                    xtype: "box",
                    itemId: "tbar-padding",
                    cls: "syno-sds-hb-tbar-padding",
                    width: 2
                }, this.onlineSearchField, this.offlineSearchField]
            },
            layout: "card",
            items: [this.initHomeCt(), this.initPackageCt(), this.initTutorialCt()],
            listeners: {
                afterrender: function() {
                    var e = document.createElement("div");
                    var d = {
                        position: "absolute",
                        top: 0,
                        width: "10px",
                        height: "100%",
                        zIndex: 20,
                        backgroundColor: "transparent"
                    };
                    e.setStyle(d);
                    this.getPackageCt().layout.center.el.appendChild(e)
                }
            }
        };
        Ext.apply(b, a);
        return b
    },
    addHomeHistory: function() {
        if (SYNO.SDS.isNVR) {
            this.histBtnGroup.getHistory().add(this.getComponent("package_ct").getHomePage())
        } else {
            this.histBtnGroup.getHistory().add({
                id: "home_ct"
            })
        }
    },
    extractDSUniuqe: function() {
        var a = /synology_([A-Za-z0-9]+)_([A-Za-z0-9\+]+)/.exec(_D("unique"));
        this.curPlatform = (a === null) ? null : a[1].toLowerCase();
        this.curModel = (a === null) ? null : a[2].replace(/\+/g, "p").toLowerCase()
    },
    initTreePanel: function(a) {
        this.treePanel = new SYNO.ux.TreePanel(Ext.apply(this.getDefaultTreeCfg(), a));
        this.treePanel.getLoader().on("load", this.onTreeLoaded, this);
        this.treePanel.getSelectionModel().on("selectionchange", this.onNodeChanged, this)
    },
    getDefaultTreeCfg: function() {
        var a = new SYNO.API.TreeLoader({
            api: "SYNO.Core.Help",
            method: "get_tree",
            version: 1,
            appWindow: this,
            preloadChildren: true,
            requestMethod: "POST",
            parentWin: this,
            baseAttrs: {
                tooltip: true
            },
            baseParams: {
                lang: _S("lang"),
                dsm: _S("majorversion") + "." + _S("minorversion") + "-" + _S("version"),
                unique: _D("unique")
            },
            listeners: {
                beforeload: {
                    fn: function(b, c, d) {
                        b.baseParams.offline = this.parentWin.offline;
                        if (!b.parentWin.pkgLoaded) {
                            b.parentWin.getPkgVersionTask();
                            return false
                        }
                        b.baseParams.treeNode = Ext.util.JSON.encode(this.parentWin.treeNodeParam);
                        return true
                    }
                }
            },
            processResponse: function(g, d, m, p) {
                var q = g.responseText;
                try {
                    var b = g.responseData || Ext.decode(q).data;
                    this.parentWin.offline = (b.online !== true);
                    var j = b.tree;
                    var l = _S("majorversion") + "." + _S("minorversion"),
                        f = {
                            id: "SYNO.SDS.App.AboutFakeApp",
                            link: "Home/legal_info.html",
                            section: "DSM",
                            text: _T("helptoc", "about"),
                            topic: "Home/legal_info.html",
                            version: l,
                            children: [{
                                id: "SYNO.SDS.App.AboutFakeApp:Home/about.html",
                                leaf: true,
                                link: "Home/about.html",
                                section: "DSM",
                                text: _T("helptoc", "synology_legal"),
                                version: l,
                                topic: "Home/about.html"
                            }, {
                                id: "SYNO.SDS.App.AboutFakeApp:Home/license.html",
                                leaf: true,
                                link: "Home/license.html",
                                section: "DSM",
                                text: _T("helptoc", "open_source_license"),
                                version: l,
                                topic: "Home/license.html"
                            }, {
                                id: "SYNO.SDS.App.AboutFakeApp:Home/codec_licenses.html",
                                leaf: true,
                                link: "Home/codec_licenses.html",
                                section: "DSM",
                                text: _T("helptoc", "codec_licenses"),
                                version: l,
                                topic: "Home/codec_licenses.html"
                            }]
                        };
                    d.beginUpdate();
                    if (j && j[0] && !!_S("rewriteApp")) {
                        j[0].children.push(f)
                    }
                    for (var h = 0; h < j.length; h++) {
                        var c = this.createNode(j[h]);
                        if (c) {
                            d.appendChild(c)
                        }
                    }
                    d.endUpdate();
                    this.parentWin.onlineBaseURL = b.onlineURL;
                    this.parentWin.onlineBaseURL = this.parentWin.changeProtocol(this.parentWin.onlineBaseURL);
                    this.parentWin.onlineURL = this.parentWin.onlineBaseURL + "cgi/knowledgebase/";
                    this.parentWin.checkNetworkURL = this.parentWin.onlineBaseURL + "js/knowledgebase/checkNetWorkConnection.js";
                    if (this.parentWin.offline === true) {
                        this.parentWin.helpDSMenuItem.setChecked(true)
                    }
                    this.runCallback(m, p || d, [d])
                } catch (k) {
                    this.handleFailure(g)
                }
            },
            scope: a
        });
        return {
            region: "west",
            collapsible: true,
            title: _T("helpbrowser", "hbtoc"),
            minWidth: 200,
            maxWidth: 360,
            width: 225,
            split: true,
            margins: "0 0 5 0",
            cls: "syno-sds-hb-tree ",
            autoFlexcroll: true,
            updateScrollBarEventNames: ["expandnode", "collapsenode", "resize"],
            loader: a,
            root: new Ext.tree.AsyncTreeNode({
                draggable: false,
                expanded: true,
                id: "source"
            }),
            floatable: false,
            animCollapse: true,
            useArrows: true,
            rootVisible: false,
            pathSeparator: "$"
        }
    },
    onTutorialStoreLoaded: function(d) {
        if (!this.tutorialTreeAdded) {
            this.add(this.initTutorialContentCt(d.tree[0]));
            this.tutorialTreeAdded = true
        } else {
            var c = "tutorial_content_ct",
                a = this.layout.activeItem.itemId === c,
                b;
            this.remove(this.getComponent(c));
            this.add(this.initTutorialContentCt(d.tree[0]));
            if (a) {
                this.layout.activeItem = null;
                this.layout.setActiveItem(c);
                b = this.getComponent(c).getHomePage();
                this.histBtnGroup.getHistory().pop();
                this.histBtnGroup.getHistory().add(b);
                this.setNavigationBarStatus()
            }
        }
    },
    onTreeLoaded: function(a, b) {
        var d = false;
        b.eachChild(function(g) {
            this.doPreload(g)
        }, a);
        b.eachChild(function(l) {
            l.expand();
            var m = l.ui.getIconEl();
            Ext.fly(m).setStyle("display", "none");
            if (_S("rewriteApp")) {
                return
            }
            l.sort(this.sortNodes);
            for (var h = 0; h < l.childNodes.length; h++) {
                var g, k = SYNO.SDS.Utils.GetAppIcon(l.childNodes[h].id, "TreeIcon");
                if (k) {
                    g = l.childNodes[h].ui.getIconEl();
                    var j = {
                        "background-image": "url(" + k + ")",
                        "background-size": String.format("{0}px", SYNO.SDS.UIFeatures.IconSizeManager.TreeIcon),
                        "background-position": "0 0"
                    };
                    Ext.fly(g).setStyle(j)
                }
            }
        }, this);
        if (this.rewriteAppToic) {
            d = this.loadTopic(this.rewriteAppToic)
        } else {
            if (this.firstOpenTopic) {
                d = this.loadTopic(this.firstOpenTopic)
            }
        }
        if (!d) {
            var f = this.layout.activeItem;
            if (!f) {
                this.addHomeHistory()
            } else {
                var c = f.getHomePage(),
                    e = this.histBtnGroup.getHistory().getObject() || {};
                if (Ext.isObject(c) && c.id !== e.id) {
                    this.histBtnGroup.getHistory().add(c)
                }
                this.setNavigationBarStatus()
            }
        } else {
            this.showContentSearchField()
        }
    },
    showContentSearchField: function() {
        this[((this.isStatusOffline()) ? "offline" : "online") + "SearchField"].show()
    },
    getSearchFieldCfg: function(a) {
        var c = (a) ? "topic" : "title";
        var b = {
            type: "help",
            owner: this,
            listAlign: ["tl-bl", [-4, 0]],
            listClass: "syno-sds-hb-searchfield sds-search-result",
            tpl: new Ext.XTemplate('<tpl for=".">', "<tpl if=\"type == 'kb'\">", '<tpl if="!(this.kbSection++)">', '<tpl if="!(this.helpSection)"><div class="x-combo-list-hd tutorial-title section">{[_T("helpbrowser", "tutorials_faq")]}</div></tpl>', '<tpl if="(this.helpSection)"><div class="x-combo-list-hd tutorial-title with-higher-top-padding section">{[_T("helpbrowser", "tutorials_faq")]}</div></tpl>', "</tpl>", '<div role="option" class="kb-result x-combo-list-item" id="{[Ext.id()]}">', '<div class="kb"><div class="goto"></div><a href="{link}" target="_blank" ext:qtip="{title}">{title}</a></div>', "</div>", "</tpl>", "<tpl if=\"type != 'kb'\">", '<tpl if="!(this.helpSection++)"><div class="x-combo-list-hd section">{[_T("common", "search_results")]}</div></tpl>', '<div role="option" aria-label="{', c, '}" class="x-combo-list-item" id={[Ext.id()]}>', '<img border=0 align="left" width="16px" height="16px" src="{[SYNO.SDS.Utils.GetAppIcon(values.owner, "TreeIcon") || String.format(this.config.jsBaseURL + "/" + this.config.icon, 16)]}" />', '<table border="0">', "<tr>", '<td class="topic" ext:qtip="{', c, '}"><div>{', c, "}</div></td>", '<td class="module"><div>{[SYNO.SDS.Utils.GetAppTitle(values.owner)]}</div></td>', "</tr>", "</table>", "</div>", "</tpl>", "</tpl>", {
                helpSection: 0,
                kbSection: 0,
                config: this.jsConfig
            }),
            listeners: {
                select: {
                    fn: function(d, f, e) {
                        this.loadTopic(f.get("id"), f)
                    },
                    scope: this
                }
            }
        };
        return b
    },
    onOpenTutorial: function(c) {
        this.layout.setActiveItem("tutorial_content_ct");
        var a = this.tutorTreePanel.getNodeById(c),
            b = a.getPath();
        this.tutorTreePanel.expandPath(b);
        this.tutorTreePanel.selectPath(b)
    },
    getHomeCt: function() {
        return this.getComponent("home_ct")
    },
    getPackageCt: function() {
        return this.getComponent("package_ct")
    },
    getTutorialCt: function() {
        return this.getComponent("tutorial_ct")
    },
    initHomeCt: function() {
        var b = ['<div class="syno-sds-hb-home-block" role="button" tabIndex="0" aria-label="{1}" aria-describedby="{3}">', '<div class="syno-sds-hb-home-block-icon {0}"></div>', '<div class="syno-sds-hb-home-block-content-ct">', '<div class="syno-sds-hb-home-block-content-title">{1}</div>', '<div class="syno-sds-hb-home-block-content-desc" id="{3}">{2}</div>', "</div>", "</div>"].join(""),
            a = ['<a href="{2}" target="_blank" aria-label="{1}">', '<div class="syno-sds-hb-home-bottom-btn-ct">', '<div class="syno-sds-hb-home-bottom-btn">', '<div class="syno-sds-hb-home-bottom-btn-icon {0}"></div>', '<div class="syno-sds-hb-home-bottom-btn-text">{1}</div>', "</div>", "</div>", "</a>"].join("");
        return {
            xtype: "container",
            layout: "border",
            itemId: "home_ct",
            hideMode: "offsets",
            getHomePage: function() {
                return {
                    id: "home_ct"
                }
            },
            items: [{
                region: "center",
                itemId: "home_searchfield_ct",
                xtype: "container",
                items: [{
                    xtype: "container",
                    cls: "syno-sds-hb-home-block-searchfield-ct",
                    width: 690,
                    height: 282,
                    items: [this.homeOnlineSearchField = new SYNO.SDS.HelpBrowser.OnlineSearchField(Ext.apply(this.getSearchFieldCfg(false), {
                        itemId: "search",
                        title: null,
                        defaultTriggerWidth: 24,
                        listWidth: 656,
                        width: 656,
                        listAlign: ["tl-bl", [0, 0]],
                        listClass: "syno-sds-hb-searchfield sds-search-result home-list"
                    })), this.homeOfflineSearchField = new SYNO.SDS.HelpBrowser.SearchField(Ext.apply(this.getSearchFieldCfg(true), {
                        itemId: "offline_search",
                        hidden: true,
                        defaultTriggerWidth: 24,
                        listWidth: 656,
                        width: 656,
                        listAlign: ["tl-bl", [0, 0]],
                        listClass: "syno-sds-hb-searchfield sds-search-result home-list"
                    })), this.tutorialBtn = new Ext.BoxComponent({
                        itemId: "tutorial_btn",
                        html: String.format(b, "syno-sds-hb-home-block-MortarBoard", _T("tutorial", "dsm_get_started"), _T("tutorial", "dsm_get_started_desc"), Ext.id()),
                        listeners: {
                            afterrender: {
                                fn: function() {
                                    var c = this,
                                        d = c.histBtnGroup.getHistory();
                                    c.tutorialBtn.el.on("click", d.add.createDelegate(d, [{
                                        id: "tutorial_ct"
                                    }]));
                                    c.tutorialBtn.el.addKeyListener(Ext.EventObject.ENTER, d.add.createDelegate(d, [{
                                        id: "tutorial_ct"
                                    }]));
                                    c.tutorialBtn.el.addKeyListener(Ext.EventObject.SPACE, d.add.createDelegate(d, [{
                                        id: "tutorial_ct"
                                    }]))
                                },
                                scope: this
                            }
                        }
                    }), {
                        xtype: "box",
                        html: '<div class="syno-sds-hb-block-sep"></div>'
                    }, this.packagesBtn = new Ext.BoxComponent({
                        itemId: "packages_btn",
                        html: String.format(b, "syno-sds-hb-home-block-Packages", _T("helpbrowser", "dsm_package"), _T("helpbrowser", "dsm_package_desc"), Ext.id()),
                        listeners: {
                            afterrender: {
                                fn: function() {
                                    var c = this;
                                    c.packagesBtn.el.on("click", this.switchToPackagePage, this);
                                    c.packagesBtn.el.addKeyListener(Ext.EventObject.ENTER, this.switchToPackagePage, this);
                                    c.packagesBtn.el.addKeyListener(Ext.EventObject.SPACE, this.switchToPackagePage, this)
                                },
                                scope: this
                            }
                        }
                    })]
                }]
            }, {
                region: "south",
                height: 68,
                xtype: "container",
                cls: "syno-sds-hb-home-bottom-ct",
                items: {
                    xtype: "container",
                    cls: "syno-sds-hb-home-bottom-buttongroup",
                    items: [{
                        xtype: "box",
                        html: String.format(a, "faq", _T("helpbrowser", "onlinesrc"), "https://www.synology.com/knowledgebase/tutorials")
                    }, {
                        xtype: "box",
                        html: String.format(a, "compatibility", _T("helpbrowser", "compatibility"), "https://www.synology.com/compatibility")
                    }, {
                        xtype: "box",
                        html: String.format(a, "video", _T("helpbrowser", "video_tutorial"), "https://www.synology.com/knowledgebase/DSM/video")
                    }]
                }
            }],
            listeners: {
                activate: {
                    fn: function() {
                        var c = this.topToolbar.getComponent("dsmhelp");
                        c.disable();
                        this.onlineSearchField.hide();
                        this.offlineSearchField.hide();
                        if (this.isStatusOffline()) {
                            this.homeOfflineSearchField.show();
                            this.homeOnlineSearchField.hide();
                            this.homeOfflineSearchField.focus()
                        } else {
                            this.homeOnlineSearchField.show();
                            this.homeOfflineSearchField.hide();
                            this.homeOnlineSearchField.focus()
                        }
                    },
                    scope: this
                },
                deactivate: {
                    fn: function() {
                        var c = this.topToolbar.getComponent("dsmhelp");
                        c.enable();
                        this.showContentSearchField()
                    },
                    scope: this
                }
            }
        }
    },
    initTutorialCt: function() {
        this.tutorialView = new SYNO.SDS.HelpBrowser.TutorialDataview({
            lang: _S("lang"),
            owner: this
        });
        return {
            xtype: "container",
            itemId: "tutorial_ct",
            layout: "fit",
            hideMode: "offsets",
            items: this.tutorialView,
            getHomePage: function() {
                return {
                    id: "tutorial_ct"
                }
            },
            listeners: {
                activate: function() {
                    this.tutorialView.getAriaEl().focus()
                },
                scope: this
            }
        }
    },
    getContentCfg: function(a, c, d, b) {
        return new Ext.Container({
            layout: "border",
            itemId: d,
            hideMode: "offsets",
            items: [a, c],
            getHomePage: b,
            listeners: {
                activate: function() {
                    a.getAriaEl().focus(300)
                }
            }
        })
    },
    onFrameLoad: function(e) {
        try {
            if (this.checkNetworkURL) {
                this.detectNetworkTask = new Ext.util.DelayedTask(this.createNetDetectionEl, this, [!this.isStatusOffline()]);
                this.detectNetworkTask.delay(1000)
            }
            var g = Ext.getDom(e),
                f = this.histBtnGroup.getHistory(),
                b = f.getObject();
            var d = (b) ? b.url : null;
            var a = (this.isStatusOffline()) ? g.contentWindow.location.href : g.src;
            if (a) {
                if (!this.useTopicID && a !== d) {
                    f.suspendChangeEvent();
                    f.add({
                        url: a
                    });
                    f.resumeChangeEvent();
                    this.setNavigationBarStatus();
                    this.setTitle(_T("helpbrowser", "apptitle"))
                }
            }
            if (this.isStatusOffline()) {
                this.adjustLayout()
            }
        } catch (c) {}
        this.useTopicID = false;
        return true
    },
    initTutorialContentCt: function(a) {
        this.tutorTreePanel = new SYNO.ux.TreePanel(Ext.apply(this.getDefaultTreeCfg(), {
            itemId: "tutorial_tree",
            loader: new Ext.tree.TreeLoader({
                preloadChildren: true
            }),
            rootVisible: false,
            root: new Ext.tree.AsyncTreeNode(Ext.apply(a, {
                expanded: true
            }))
        }));
        this.tutorHelpFrameID = Ext.id();
        this.tutorTreePanel.getSelectionModel().on("selectionchange", this.onNodeChanged, this);
        return this.getContentCfg(this.tutorTreePanel, {
            xtype: "panel",
            bodyStyle: "padding-bottom: 5px;",
            region: "center",
            itemId: "help-content-panel",
            html: String.format('<iframe id="{0}" scrolling="no" src="{1}" frameborder="0" style="border: 0px none; width:100%; height: 100%;"></iframe>', this.tutorHelpFrameID, Ext.isIE ? this.blankPage : Ext.SSL_SECURE_URL),
            listeners: {
                afterrender: {
                    fn: function() {
                        this.mon(Ext.get(this.tutorHelpFrameID), "load", this.onFrameLoad.createDelegate(this, [this.tutorHelpFrameID]))
                    },
                    scope: this
                }
            }
        }, "tutorial_content_ct", this.getTutorialHomePage.createDelegate(this))
    },
    initPackageCt: function() {
        return this.getContentCfg(this.treePanel, {
            xtype: "panel",
            bodyStyle: "padding-bottom: 5px;",
            region: "center",
            itemId: "help-content-panel",
            html: String.format('<iframe id="{0}" scrolling="no" src="{1}" frameborder="0" style="border: 0px none; width:100%; height: 100%;"></iframe>', this.helpFrameID, Ext.isIE ? this.blankPage : Ext.SSL_SECURE_URL)
        }, "package_ct", this.getHomePage.createDelegate(this))
    },
    getPkgVersionTask: function() {
        this.sendWebAPI({
            api: "SYNO.Package",
            method: "list",
            version: 1,
            params: {
                additional: ["dsm_apps", "status"]
            },
            callback: this.storePkgVersion,
            scope: this
        })
    },
    getTutorialHomePage: function() {
        return {
            tree: this.tutorTreePanel,
            id: "SYNO.SDS.Tutorial.Application",
            url: (this.isStatusOffline()) ? this.defaultTutorialHomePage : this.generateOnlineTutorialHomeURL()
        }
    },
    getHomePage: function() {
        return {
            tree: this.treePanel,
            id: "SYNO.SDS.App.PersonalSettings.Instance",
            url: (this.isStatusOffline()) ? this.defaultHomePage : this.generateOnlineHomeURL()
        }
    },
    switchToPackagePage: function() {
        var a = this.histBtnGroup.getHistory();
        a.add(this.getHomePage())
    },
    storePkgVersion: function(g, e, f, d) {
        if (g === true) {
            var b;
            this.treeNodeParam = {};
            this.pkgsInfo = [];
            for (b = 0; b < e.packages.length; b++) {
                if (e.packages[b].additional.status !== "running") {
                    continue
                }
                var c = /(\d+)\.(\d+)/,
                    a;
                a = c.exec(e.packages[b].version);
                if (Ext.isArray(a)) {
                    a = a[0]
                } else {
                    a = e.packages[b].version
                }
                e.packages[b].version = a;
                this.pkgsInfo.push(e.packages[b]);
                this.treeNodeParam[e.packages[b].id] = a
            }
            this.treeNodeParam.DSM = _S("majorversion") + "." + _S("minorversion");
            this.pkgLoaded = true;
            if (this.onlineSearchField) {
                this.onlineSearchField.setTreeNodeParam(this.treeNodeParam)
            }
            this.reloadTree()
        }
    },
    getVersionByID: function(f) {
        var c, b, e, d, a;
        a = f.indexOf(":");
        if (a <= 0) {
            a = f.length
        }
        d = f.substring(0, a);
        if (this.pkgsInfo) {
            for (c = 0; c < this.pkgsInfo.length; c++) {
                e = this.pkgsInfo[c].additional.dsm_apps.split(" ");
                for (b = 0; b < e.length; b++) {
                    if (d === e[b]) {
                        return this.pkgsInfo[c].version
                    }
                }
            }
        }
        return -1
    },
    isStatusOffline: function() {
        return this.offline
    },
    createNetDetectionEl: function(a) {
        this.isSendingRequest = true;
        a = a || false;
        if (this.detectEl) {
            Ext.removeNode(this.detectEl)
        }
        var d = document.createElement("script");
        d.type = "text/javascript";
        var c = function(e) {
            if (!e.parentElement) {
                return
            }
            var f = Ext.getCmp(e.parentElement.id);
            f.helpSynoMenuItem.setDisabled(true);
            if (!f.isStatusOffline()) {
                f.helpDSMenuItem.setChecked(true);
                if (a === true) {
                    f.getMsgBox().alert(_T("error", "error_error"), _T("helpbrowser", "help_no_internet"))
                }
            }
            f.noNetwork = true;
            f.isSendingRequest = false
        };
        var b = function(e) {
            if (!e.parentElement) {
                return
            }
            var f = Ext.getCmp(e.parentElement.id);
            f.helpSynoMenuItem.setDisabled(false);
            f.noNetwork = false;
            f.isSendingRequest = false;
            checkNetWorkConnectionPageLoaded = false
        };
        d.src = this.checkNetworkURL + "?rand=" + Math.floor((Math.random() * 1000) + 1);
        this.detectEl = d;
        this.getEl().appendChild(this.detectEl);
        this.detectEl.task = new Ext.util.DelayedTask(function() {
            if (typeof checkNetWorkConnectionPageLoaded == "undefined" || checkNetWorkConnectionPageLoaded === false) {
                c(d)
            } else {
                b(d)
            }
        });
        this.detectEl.task.delay(10 * 1000)
    },
    adjustLayout: function() {
        var a = function(b) {
            b.style.fontSize = this.currentRatio + "%";
            Ext.fly(b).addClass("model-" + this.curModel);
            Ext.fly(b).addClass("platform-" + this.curPlatform)
        };
        this.applyCallbackOnFrames(a)
    },
    changeOnOffLineStatus: function(a) {
        if (a === this.offline) {
            return
        }
        this.offline = a;
        this.histBtnGroup.getHistory().clear();
        this.setNavigationBarStatus();
        this.reloadTree()
    },
    getFrameDoc: function(c) {
        var b = Ext.getDom(c),
            a;
        if (b) {
            a = Ext.isIE ? b.contentWindow.document : b.contentDocument
        }
        return a
    },
    getTutorFrameDoc: function() {
        return this.getFrameDoc(this.tutorHelpFrameID)
    },
    getHelpFrameDoc: function() {
        return this.getFrameDoc(this.helpFrameID)
    },
    getBodyEl: function(c) {
        var b = this["get" + c + "FrameDoc"](),
            a;
        if (b) {
            a = b.getElementsByTagName("body")[0]
        }
        return a
    },
    getTutorDocBodyEl: function() {
        return this.getBodyEl("Tutor")
    },
    getHelpDocBodyEl: function() {
        return this.getBodyEl("Help")
    },
    changeOnlineFontSize: function(a) {
        this.histBtnGroup.getHistory().changeFontSizeForCurrentObj(this.currentRatio, a);
        this.histBtnGroup.getHistory().changefontSizeForAll(this.currentRatio, a);
        this.currentRatio = a
    },
    applyCallbackOnFrames: function(d) {
        var c = ["Help", "Tutor"],
            a, b;
        for (b = 0; b < c.length; b++) {
            a = this["get" + c[b] + "DocBodyEl"]();
            if (a) {
                d.call(this, a)
            }
        }
    },
    changeOfflineFontSize: function(b) {
        var a = function(c) {
            c.style.fontSize = b + "%";
            if (Ext.fly(c).dom.fleXcroll) {
                Ext.fly(c).dom.fleXcroll.updateScrollBars()
            }
        };
        this.applyCallbackOnFrames(a)
    },
    changeFontSize: function(b) {
        var a = 100 + b * 25;
        if (this.isStatusOffline()) {
            this.changeOfflineFontSize(a)
        } else {
            this.changeOnlineFontSize(a)
        }
        this.currentRatio = a
    },
    isDemoHelpMode: function() {
        return _S("demo_mode") && (_S("rewriteApp") === "SYNO.SDS.HelpBrowser.Application") ? true : false
    },
    sortNodes: function(e, d) {
        var g = 999,
            f = 999,
            h, c = ["SYNO.SDS.Tutorial.Application", "SYNO.SDS.App.PersonalSettings.Instance", "SYNO.SDS.AdminCenter.Application", "SYNO.SDS.PkgManApp.Instance", "SYNO.SDS.App.FileStation3.Instance", "SYNO.SDS.StorageManager.Instance", "SYNO.SDS.HA.Instance", "SYNO.SDS.AHA.Instance", "SYNO.SDS.DisasterRecovery.Application", "SYNO.SDS.Backup.Application", "SYNO.SDS.ResourceMonitor.Instance", "SYNO.SDS.StorageReport.Application", "SYNO.SDS.LogCenter.Instance", "SYNO.SDS.ACEEditor.Application", "SYNO.SDS.SecurityScan.Instance", "SYNO.SDS.SupportForm.Application", "SYNO.DSMMobile", "SYNO.SDS.HotkeyMgr.Instance", "SYNO.SDS.App.AboutFakeApp"];
        if (!e || !e.text || !d || !d.text) {
            return
        }
        g = c.indexOf(e.id);
        f = c.indexOf(d.id);
        h = parseInt(g - f, 10);
        return (h)
    },
    bringAppToFront: function() {
        SYNO.SDS.iFrameAppToFront("SYNO.SDS.HelpBrowser.Application")
    },
    hookHelpFrameMessage: function() {
        var b = this,
            a = function(d) {
                var c = b.histBtnGroup.getHistory().getObject();
                if (c) {
                    /^help_url:(.*)/.exec(d.data, function(f, e) {
                        if (e) {
                            c.url = e
                        }
                    })
                }
            };
        if (window.addEventListener) {
            window.addEventListener("message", a, false)
        } else {
            window.attachEvent("onmessage", a)
        }
        b.handelMsgPost = a
    },
    hookHelpDocMouseDown: function(a) {
        if (window.addEventListener) {
            a.body.addEventListener("mousedown", this.bringAppToFront, false)
        } else {
            a.body.attachEvent("onmousedown", this.bringAppToFront)
        }
    },
    findNodeWithTopic: function(b) {
        var a = b.findChildBy(function(c) {
            if (c.attributes.topic) {
                return true
            }
            return false
        }, this, true);
        return a
    },
    changeProtocol: function(a) {
        var b = a;
        b = a.replace("http:", "https:");
        return b
    },
    generateOfflineURL: function(b, a) {
        a = a.replace("%pseudonode", "");
        return this.getTopicUrlBase(b) + _S("lang") + "/" + a
    },
    generateOnlineTutorialHomeURL: function() {
        var b = {
            action: "findHelpFile",
            dsm: _S("majorversion") + "." + _S("minorversion") + "-" + _S("version"),
            version: _S("majorversion") + "." + _S("minorversion"),
            section: "dsm",
            lang: _S("lang"),
            unique: _D("unique"),
            link: "Tutorial/home.html",
            font: this.currentRatio
        };
        var a = this.onlineURL + "?" + Ext.urlEncode(b);
        return a
    },
    generateOnlineHomeURL: function() {
        var b = {
            action: "findHelpFile",
            dsm: _S("majorversion") + "." + _S("minorversion") + "-" + _S("version"),
            version: _S("majorversion") + "." + _S("minorversion"),
            section: "dsm",
            lang: _S("lang"),
            unique: _D("unique"),
            link: "MainMenu/get_started.html",
            font: this.currentRatio
        };
        var a = this.onlineURL + "?" + Ext.urlEncode(b);
        return a
    },
    generateOnlineURL: function(c, b) {
        var d = this.getTopicUrlBase(c),
            a;
        d = d.replace("help/", "");
        d = d.replace("3rdparty/", "");
        d = d.replace("webman/", "");
        d = d.replace("/", "");
        if (d.length === 0) {
            d = "dsm"
        }
        var e = {
            action: "findHelpFile",
            dsm: _S("majorversion") + "." + _S("minorversion") + "-" + _S("version"),
            section: d,
            lang: _S("lang"),
            link: b,
            font: this.currentRatio,
            unique: _D("unique"),
            version: (d === "dsm") ? _S("majorversion") + "." + _S("minorversion") : this.getVersionByID(c.id)
        };
        a = this.onlineURL + "?" + Ext.urlEncode(e);
        return a
    },
    getSubStringForPath: function(b) {
        var e = b.indexOf("link="),
            d = b.indexOf(".html") + 5,
            a = b.substring(e, d),
            c = a.indexOf("/../"),
            f;
        if (-1 !== c) {
            f = a.substring(5, c + 4);
            a = a.replace(f, "")
        }
        return a
    },
    setURLFromNode: function(d, a) {
        var f = this.histBtnGroup.getHistory(),
            e = f.getObject(),
            c = d.attributes.topic;
        if (c) {
            var b;
            if (this.isStatusOffline()) {
                b = this.generateOfflineURL(d, c)
            } else {
                b = this.generateOnlineURL(d, c)
            }
            if (!e || e.id !== d.id) {
                f.add({
                    id: d.id,
                    url: b,
                    tree: a.tree
                })
            }
        }
    },
    setURLHash: function(c) {
        var b = this,
            a = null;
        if (b.isDemoHelpMode()) {
            a = c.attributes.topic;
            if (a) {
                window.location.hash = "#" + SYNO.Util.Base64.encode(c.id)
            }
        }
    },
    onNodeChanged: function(a, b) {
        if (!b) {
            return
        }
        b.expand(false, null, function() {
            b.ensureVisible.defer(100, b)
        });
        this.setURLFromNode(b, a);
        this.setURLHash(b)
    },
    setURL: function(b, a) {
        if (a.itemId === "tutorial_tree") {
            Ext.getDom(this.tutorHelpFrameID).src = b
        } else {
            Ext.getDom(this.helpFrameID).src = b
        }
    },
    getCurrentURL: function() {
        var a = Ext.getDom(this.helpFrameID);
        if (a) {
            return a.src
        }
        return ""
    },
    changeURL: function(c) {
        if (c.id === "home_ct") {
            this.layout.setActiveItem("home_ct")
        } else {
            if (c.id === "tutorial_ct") {
                this.layout.setActiveItem("tutorial_ct")
            } else {
                var a = c.tree || this.treePanel;
                if (a && a.itemId === "tutorial_tree") {
                    this.layout.setActiveItem("tutorial_content_ct")
                } else {
                    this.layout.setActiveItem("package_ct")
                }
                if (c && c.url) {
                    this.useTopicID = true;
                    this.setURL(c.url, a);
                    var b = a.getNodeById(c.id);
                    if (b) {
                        a.selectPath(b.getPath());
                        this.setURLHash(b);
                        this.setTitle(_T("helpbrowser", "apptitle") + (b.text ? (" - " + b.text) : ""))
                    } else {}
                }
            }
        }
        this.setNavigationBarStatus()
    },
    setNavigationBarStatus: function() {
        this.histBtnGroup.updateBtnStatus()
    },
    findNodeURL: function(g, c) {
        var b = {};
        var f = c.getNodeById(g);
        if (f) {
            if (!f.attributes.topic) {
                f = this.findNodeWithTopic(f);
                if (!f) {
                    return b
                }
            }
            b.node = f;
            if (this.isStatusOffline()) {
                b.url = this.generateOfflineURL(f, f.attributes.topic)
            } else {
                b.url = this.generateOnlineURL(f, f.attributes.topic)
            }
        } else {
            var a = g.indexOf("#");
            if (a != -1) {
                var d = g.substr(0, a);
                var e = g.substr(a + 1);
                f = c.getNodeById(d);
                if (!f || !f.attributes.topic) {
                    return b
                }
                b.node = f;
                if (this.isStatusOffline()) {
                    b.url = this.generateOfflineURL(f, f.attributes.topic) + "#" + e
                } else {
                    b.url = this.generateOnlineURL(f, f.attributes.topic) + "#" + e
                }
            }
        }
        return b
    },
    getContentPanel: function() {
        return this.getComponent("help-content-panel")
    },
    isOfflineHome: function(a) {
        return (this.isStatusOffline() && (a === this.HomeId))
    },
    loadTopic: function(f, c) {
        var d = (c) ? c.get("type") : null,
            b = (f.indexOf("SYNO.SDS.Tutorial.Application") >= 0) ? this.tutorTreePanel : this.treePanel,
            a, e;
        if (c && d === "kb") {
            e = c.get("link");
            if (!e) {
                return false
            }
            window.open(e, "_blank");
            return
        }
        this.layout.setActiveItem(b.ownerCt.itemId);
        a = this.findNodeURL(f, b);
        if (!a || !a.node && this.offline !== true) {
            this.changeOnOffLineStatus(true);
            return false
        } else {
            if (!a || !a.node) {
                SYNO.Debug("Cannot find node. nodeID", f);
                return false
            }
        }
        e = a.node.getPath();
        b.expandPath(e);
        b.selectPath(e);
        this.firstOpenTopic = null;
        return true
    },
    getTopicUrlBase: function(b) {
        var c = b.attributes.base,
            d = b.attributes.id,
            a;
        if (Ext.isString(c)) {
            if (c.substr(0, 1) === "/") {
                d = d.split(":")[0];
                a = SYNO.SDS.Config.FnMap[d];
                if (Ext.isObject(a) && a.config && a.config.jsBaseURL) {
                    return a.config.jsBaseURL + "/help/"
                }
                c = c.split("/")[3];
                return "3rdparty/" + c + "/help/"
            } else {
                if (Ext.isString(d)) {
                    d = d.split(":")[0];
                    a = SYNO.SDS.Config.FnMap[d];
                    if (Ext.isObject(a) && a.config && a.config.jsBaseURL) {
                        return a.config.jsBaseURL + "/" + c + "/"
                    }
                }
            }
        }
        return "webman/help/"
    },
    reloadTree: function() {
        var a = this.treePanel.root;
        if (a) {
            a.reload()
        }
        if (!_S("rewriteApp")) {
            this.tutorialView.store.load({
                params: {
                    offline: this.isStatusOffline()
                }
            })
        }
    },
    onDestroy: function() {
        if (window.addEventListener) {
            window.removeEventListener("message", this.handelMsgPost, false)
        } else {
            window.detachEvent("onmessage", this.handelMsgPost)
        }
        if (this.detectEl) {
            this.detectEl.task.cancel()
        }
        if (this.detectNetworkTask) {
            this.detectNetworkTask.cancel()
        }
        SYNO.SDS.HelpBrowser.MainWindow.superclass.onDestroy.apply(this, arguments)
    },
    onShow: function() {
        SYNO.SDS.HelpBrowser.MainWindow.superclass.onShow.apply(this, arguments);
        if (!_S("standalone") && !_S("rewriteApp") && SYNO.SDS.UserSettings.getProperty("SYNO.SDS.HelpBrowser.Application", "launchSetting") !== true) {
            var a = new SYNO.SDS.HelpBrowser.DisplaySettingDlg({
                owner: this
            });
            a.show()
        }
    },
    onOpen: function(c) {
        if (!this.fromRestore) {
            this.center()
        }
        SYNO.SDS.HelpBrowser.MainWindow.superclass.onOpen.call(this, c);
        if (this.isDemoHelpMode()) {
            var a = "";
            try {
                a = SYNO.Util.Base64.decode(window.location.hash.substring(1))
            } catch (b) {
                a = ""
            }
            this.firstOpenTopic = a
        }
        if (c.topic) {
            this.firstOpenTopic = c.topic + (c.anchor ? ("#" + c.anchor) : "");
            if (_S("rewriteApp")) {
                this.rewriteAppToic = c.topic + (c.anchor ? ("#" + c.anchor) : "")
            }
        }
    },
    onRequest: function(a) {
        if (a.topic) {
            this.loadTopic(a.topic + (a.anchor ? ("#" + a.anchor) : ""))
        }
        SYNO.SDS.HelpBrowser.MainWindow.superclass.onRequest.call(this, a)
    },
    onActivate: function() {
        var a = Ext.get(Ext.getDom(this.helpFrameID).parentNode).query(".sds-shim-for-iframe");
        Ext.each(a, function(b) {
            Ext.removeNode(b)
        });
        SYNO.SDS.HelpBrowser.MainWindow.superclass.onActivate.apply(this, arguments)
    },
    onDeactivate: function() {
        var a = document.createElement("div");
        a.addClassName("sds-shim-for-iframe");
        Ext.get(Ext.getDom(this.helpFrameID).parentNode).appendChild(a);
        SYNO.SDS.HelpBrowser.MainWindow.superclass.onDeactivate.apply(this, arguments)
    }
});