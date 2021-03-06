/* Copyright (c) INTEGRA EMPRESAS 2016. All rights reserved. */

Ext.namespace("SYNO.SDS.App.WelcomeApp");
Ext.define("SYNO.SDS.App.WelcomeApp.WelcomePanel", {
    extend: "Ext.Container",
    constructor: function(a) {
        var b = this.fillConfig(a);
        SYNO.SDS.App.WelcomeApp.WelcomePanel.superclass.constructor.call(this, b);
        this.mon(this, "afterrender", function() {
            this.startBtn = new SYNO.ux.Button({
                text: _T("common", "next"),
                btnStyle: "blue",
                renderTo: this.startBtnId,
                cls: "welcome-next-btn",
                handler: this.startWelcome,
                scope: this
            })
        }, this)
    },
    fillConfig: function(a) {
        this.startBtnId = Ext.id();
        var b = {
            cls: "welcome-welcome-ct",
            tpl: ['<div class="welcome-title">{title}</div>', '<div class="welcome-welcome-desc">{desc}</div>', '<div class="welcome-paging" id="{btn_id}"> </div>'],
            data: {
                title: _T("common", "congratulations"),
                desc: String.format(_T("welcome", "welcome_page_desc"), "INTEGRA " + _D("upnpmodelname")),
                btn_id: this.startBtnId
            }
        };
        Ext.apply(b, a);
        return b
    },
    startWelcome: function() {
        this.appWin.gotoNextStep()
    },
    onDestroy: function() {
        Ext.destroy(this.startBtn)
    }
});
Ext.define("SYNO.SDS.App.WelcomeApp.DataCollectFormPanel", {
    extend: "SYNO.SDS.Utils.FormPanel",
    termsInfoUrl: "http://www.synology.com/company/privacy",
    constructor: function(b) {
        this.dataCheckBoxID = Ext.id();
        var a = String.format('<a href="{0}" target="_blank" class="pathlink">{1}</a>', this.termsInfoUrl, _T("welcome", "welcome_terms_of_service"));
        var c = Ext.apply({
            cls: "welcome-data-collect-form",
            border: false,
            autoFlexcroll: false,
            useGradient: false,
            checkFormDirty: false,
            items: [{
                width: "auto",
                xtype: "syno_checkbox",
                id: this.dataCheckBoxID,
                checked: true,
                boxLabel: _T("welcome", "welcome_send_data")
            }, {
                width: "auto",
                xtype: "syno_displayfield",
                hideLabel: true,
                htmlEncode: false,
                value: a
            }],
            webapi: {
                api: "SYNO.Core.DataCollect",
                version: 1,
                methods: {
                    get: "get",
                    set: "set"
                },
                params: {
                    get: {},
                    set: {
                        enable: true
                    }
                }
            }
        }, b);
        this.callParent([c])
    },
    processParams: function(c, b) {
        var a = Ext.getCmp(this.dataCheckBoxID);
        a.disable();
        this.owner.endBtn.disable();
        b[0].params = {};
        b[0].params.enable = a.getValue();
        return b
    },
    reportFormSubmitFail: function(a, b) {
        this.processReturnData(b)
    },
    processReturnData: function(d, c, b) {
        this.appWin.appInstance.setUserSettings("welcome_dsm50_hide", true);
        SYNO.SDS.UserSettings.syncSave();
        var a = this.getDefaultSettingWebAPI();
        a = a.concat(this.getCheckPermissionWebAPI());
        a = a.concat(this.getHideWelcomeWebAPI());
        SYNO.API.Request({
            compound: {
                params: a,
                stopwhenerror: false
            },
            callback: function() {
                var e = _S("theme_cls") === "business",
                    f = SYNO.SDS.isBusinessModel;
                if (f !== e) {
                    window.location.reload(true);
                    return
                }
                this.appWin.close()
            },
            scope: this
        })
    },
    getDefaultSettingWebAPI: function() {
        return [{
            api: "SYNO.Core.Security.AutoBlock",
            version: 1,
            method: "set",
            params: {
                enable: true,
                attempts: 10,
                within_mins: 5,
                enable_expire: false
            },
            callback: Ext.emptyFn,
            scope: this
        }, {
            api: "SYNO.Core.Theme.Desktop",
            version: 1,
            method: "set",
            params: {
                theme: SYNO.SDS.isBusinessModel ? "business" : "default"
            },
            callback: Ext.emptyFn,
            scope: this
        }]
    },
    getHideWelcomeWebAPI: function() {
        return [{
            api: "SYNO.Core.QuickStart.Info",
            method: "hide_welcome",
            version: 1,
            callback: Ext.emptyFn
        }]
    },
    getCheckPermissionWebAPI: function() {
        return [{
            api: "SYNO.Core.QuickStart.Info",
            method: "check_permission",
            version: 1,
            callback: Ext.emptyFn
        }]
    }
});
Ext.define("SYNO.SDS.App.WelcomeApp.EndPanel", {
    extend: "Ext.Container",
    constructor: function(a) {
        var b = this.fillConfig(a);
        SYNO.SDS.App.WelcomeApp.WelcomePanel.superclass.constructor.call(this, b);
        this.mon(this, "afterrender", function() {
            this.dataCollectForm = new SYNO.SDS.App.WelcomeApp.DataCollectFormPanel({
                renderTo: this.dataCollectFormId,
                ownerPanel: this,
                owner: this,
                appWin: a.appWin
            });
            this.endBtn = new SYNO.ux.Button({
                btnStyle: "blue",
                cls: "welcome-next-btn",
                text: _T("welcome", "welcome_go"),
                renderTo: this.endBtnId,
                handler: this.endWelcome,
                scope: this
            })
        }, this)
    },
    fillConfig: function(a) {
        this.endBtnId = Ext.id();
        this.dataCollectFormId = Ext.id();
        var b = {
            cls: "welcome-welcome-ct welcome-end-panel",
            tpl: ['<div class="welcome-title">{title}</div>', '<div class="welcome-welcome-desc">{desc}</div>', '<div id="{data_collect_id}"> </div>', '<div class="welcome-paging" id="{btn_id}"> </div>'],
            data: {
                title: _T("welcome", "welcome_end_title"),
                desc: String.format(_T("welcome", "welcome_end_desc"), "INTEGRA " + _D("upnpmodelname")),
                btn_id: this.endBtnId,
                data_collect_id: this.dataCollectFormId
            }
        };
        Ext.apply(b, a);
        return b
    },
    endWelcome: function() {
        this.dataCollectForm.applyForm()
    },
    onDestroy: function() {
        Ext.destroy(this.endBtn)
    }
});
Ext.define("SYNO.SDS.App.WelcomeApp.RegiterAccountPanel", {
    extend: "Ext.Container",
    constructor: function(a) {
        var b = this.fillConfig(a);
        this.callParent([b])
    },
    fillConfig: function(a) {
        this.initRegisteryForm(a);
        this.nextBtn = new SYNO.ux.Button({
            xtype: "syno_button",
            btnStyle: "blue",
            text: _T("common", "next"),
            itemId: "next",
            cls: "welcome-next-btn",
            disabled: false,
            scope: this,
            handler: function(d, c) {
                var f = function(g) {
                    if (g.appWin.haveToCheckShr()) {
                        g.maskRegistryPage(true);
                        g.waitForShrCreation()
                    } else {
                        g.onGotoNextPage()
                    }
                };
                var e = this.registerForm.accountField;
                if (this.registerForm.fieldsValid() === false) {
                    return
                }
                d.disable();
                if (e.getValue() === "admin") {
                    f(this);
                    return
                }
                this.sendWebAPI({
                    api: "SYNO.Core.User",
                    method: "get",
                    version: 1,
                    params: {
                        name: e.getValue()
                    },
                    scope: this,
                    callback: function(i, h, g) {
                        if (i) {
                            d.enable();
                            e.markInvalid(_T("user", "error_nameused"))
                        } else {
                            f(this)
                        }
                    }
                })
            }
        });
        var b = {
            header: false,
            border: false,
            cls: "welcome-step-ct",
            items: [{
                xtype: "box",
                cls: "welcome-step-title",
                html: String.format(_T("welcome", "welcome_admin_account_title"))
            }, {
                xtype: "box",
                cls: "welcome-step-desc",
                html: String.format(_T("welcome", "welcome_admin_account_desc"), "INTEGRA " + _D("upnpmodelname"))
            }, this.registerForm, {
                xtype: "container",
                cls: "welcome-paging",
                items: this.nextBtn
            }, {
                xtype: "box",
                cls: "welcome-register-agree-eula",
                html: _T("welcome", "welcome_admin_agree_eula")
            }],
            listeners: {
                beforeshow: {
                    fn: this.loadPasswordRules,
                    scope: this
                }
            }
        };
        Ext.apply(b, a);
        return b
    },
    initRegisteryForm: function(a) {
        this.registerFormID = Ext.id();
        this.registerForm = new SYNO.SDS.App.WelcomeApp.RegisterFormPanel({
            id: this.registerFormID,
            appWin: a.appWin
        })
    },
    getProgressBox: function() {
        if (!this.progressBox || this.progressBox.isDestroyed) {
            this.progressBox = new SYNO.SDS.MessageBoxV5({
                modal: true,
                draggable: false,
                cls: "welcome-progress-box progress",
                renderTo: document.body
            });
            this.mon(this.progressBox, "beforeshow", function() {
                this.progressBox.maskEl.addClass("welcome-progress-mask")
            }, this)
        }
        return this.progressBox.getWrapper()
    },
    maskRegistryPage: function(a) {
        if (a) {
            this.getProgressBox().progress();
            this.getProgressBox().updateProgress(0, "0%", _T("welcome", "welcome_creating_shr"))
        } else {
            this.getProgressBox().hide()
        }
    },
    loadPasswordRules: function() {
        this.rules = {
            exclude_username: true,
            min_length: 6,
            min_length_enable: true
        };
        this.appWin.setStatusBusy();
        this.appWin.sendWebAPI({
            api: "SYNO.Core.User.PasswordPolicy",
            version: 1,
            method: "get",
            callback: function(g, e, d, c) {
                this.appWin.clearStatusBusy();
                if (g && e && e.strong_password) {
                    var f = [];
                    if (e.strong_password) {
                        Ext.applyIf(this.rules, e.strong_password);
                        if (e.strong_password.min_length_enable && e.strong_password.min_length > this.rules.min_length) {
                            this.rules.min_length = e.strong_password.min_length
                        }
                    }
                    for (var b in this.rules) {
                        if (this.rules.hasOwnProperty(b)) {
                            if (this.rules[b] === true) {
                                f.push((b === "min_length_enable") ? _T("passwd", b) + " " + this.rules.min_length : _T("passwd", b))
                            }
                        }
                    }
                    if (f.length > 0) {
                        var a = this.registerForm.passField;
                        a.setHint(a.strengthField.el, f)
                    }
                }
            },
            scope: this
        })
    },
    onGotoNextPage: function() {
        var b = this.registerForm.getForm().getValues();
        var a = [{
            api: "SYNO.Core.Security.AutoBlock",
            version: 1,
            method: "set",
            params: {
                enable: true,
                attempts: 10,
                within_mins: 5,
                enable_expire: false
            },
            callback: Ext.emptyFn,
            scope: this
        }, {
            api: "SYNO.Core.Theme.Desktop",
            version: 1,
            method: "set",
            params: {
                theme: SYNO.SDS.isBusinessModel ? "business" : "default"
            },
            callback: Ext.emptyFn,
            scope: this
        }, {
            api: "SYNO.Core.Network",
            version: 1,
            method: "set",
            params: {
                server_name: b.myds_server_name
            }
        }, {
            api: "SYNO.Core.Service",
            version: 1,
            method: "control",
            params: {
                service: [{
                    service_id: "synoagentregisterd",
                    action: (b.registBox ? "start" : "stop")
                }]
            }
        }];
        if ("yes" != _D("dockerdsm")) {
            a.push({
                api: "SYNO.Core.Network",
                version: 1,
                method: "set",
                params: {
                    server_name: b.myds_server_name
                }
            })
        }
        if (b.myds_account.toLowerCase() === "admin") {
            a.push({
                api: "SYNO.Core.User",
                version: 1,
                method: "set",
                params: {
                    name: "admin",
                    password: b.myds_password
                }
            })
        } else {
            a = a.concat([{
                api: "SYNO.Core.User",
                version: 1,
                method: "set",
                params: {
                    name: "admin",
                    password: b.myds_password
                }
            }, {
                api: "SYNO.Core.User",
                version: 1,
                method: "create",
                params: {
                    name: b.myds_account,
                    password: b.myds_password
                }
            }, {
                api: "SYNO.Core.Group.Member",
                version: 1,
                method: "add",
                params: {
                    group: "administrators",
                    name: [b.myds_account]
                }
            }, {
                api: "SYNO.Core.User",
                version: 1,
                method: "set",
                params: {
                    name: "admin",
                    expired: "now"
                }
            }])
        }
        this.getNewAdminInfo = function() {
            return {
                username: b.myds_account,
                password: b.myds_password
            }
        };
        SYNO.SDS.StatusNotifier.fireEvent("halt");
        this.sendWebAPI({
            compound: {
                stopwhenerror: false,
                params: a
            },
            scope: this,
            callback: function(h, c, g, d) {
                if ("yes" != _D("dockerdsm")) {
                    SYNO.SDS.Session.hostname = SYNO.API.Util.GetReqByAPI(d, "SYNO.Core.Network", "set", "server_name")
                }
                var f = _S("custom_login_title") || (_D("manager") + " - " + _S("hostname"));
                document.title = Ext.util.Format.htmlEncode(f);
                if (h && !c.has_fail) {
                    this.doAuth();
                    return
                }
                var e = new SYNO.SDS.MessageBoxV5({
                    owner: this.appWin,
                    renderTo: Ext.getBody()
                });
                e.getWrapper().alert(_T("error", "error_error"), _T("welcome", "create_admin_fail"), function() {
                    this.appWin.close()
                }, this)
            }
        })
    },
    doAuth: function() {
        this.appWin.isDoingAuth = true;
        if (!window.location.origin) {
            window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ":" + window.location.port : "")
        }
        var b = this.getNewAdminInfo();
        var a = new Date().getTime();
        var c = Ext.apply(document.createElement("iframe"), {
            className: "x-hidden",
            src: window.location.origin + "/webapi/auth.cgi?" + Ext.urlEncode({
                api: "SYNO.API.Auth",
                method: "login",
                account: b.username,
                passwd: b.password,
                session: "id",
                version: 2,
                format: "sid"
            })
        });
        if (Ext.isIE6 || Ext.isIE7 || Ext.isIE8) {
            c.onreadystatechange = function() {
                if (this.readyState !== "complete" && this.readyState !== "loaded") {
                    return
                }
                window.location.href = "/?dc=" + a
            }
        } else {
            c.onload = function() {
                window.location.href = "/?dc=" + a
            }
        }
        document.body.appendChild(c)
    },
    waitForShrCreation: function() {
        this.shrTask = this.addWebAPITask({
            webapi: {
                api: "SYNO.Storage.CGI.Storage",
                method: "load_info",
                version: 1
            },
            immediate: true,
            interval: 3000,
            scope: this,
            callback: function(g, f, e, b) {
                if (!g || !Ext.isArray(f.volumes) || f.volumes.length === 0) {
                    this.shrTask.stop();
                    this.onGotoNextPage();
                    return
                }
                var d = ["crashed", "deleting"];
                var a = f.volumes[0];
                if (a.status === "creating") {
                    var c = String.format("{0}%", (a.progress.percent < 0) ? 0 : Math.round(a.progress.percent));
                    this.getProgressBox().updateProgress(a.progress.percent / 100, c, _T("welcome", "welcome_creating_shr"));
                    return
                }
                if (d.indexOf(a.status) === -1) {
                    this.appWin.curVol = {
                        path: a.vol_path
                    }
                }
                this.shrTask.stop();
                this.onGotoNextPage()
            }
        });
        this.shrTask.start()
    },
    gotoNextPage: function() {
        var c = this.appWin,
            b, a = (SYNO.SDS.isNVR) ? "Sur" : "Pkg";
        this.maskRegistryPage(false);
        if (c["haveToInstall" + a]() && !c.getStep("install")) {
            b = (c.getStep("updateSetting")) ? "updateSetting" : "register";
            c.installPanel = new SYNO.SDS.App.WelcomeApp[(a === "Sur") ? "InstallSurPanel" : "InstallPanel"]({
                owner: this.appWin,
                appWin: this.appWin,
                itemId: "install"
            });
            c.insertStepAfter(c.installPanel, b);
            c.bindInstallPanelEvents()
        }
        c.gotoNextStep()
    },
    getNewAdminInfo: Ext.emptyFn
});
Ext.define("SYNO.SDS.App.WelcomeApp.RegisterFormPanel", {
    extend: "SYNO.SDS.Utils.FormPanel",
    constructor: function(a) {
        var b = Ext.apply({
            cls: "welcome-form welcome-register-form",
            border: false,
            autoFlexcroll: false,
            labelWidth: 300,
            height: 250,
            useGradient: false,
            items: this.initLayout(),
            encryption: ["password", "myds_password"],
            listeners: {
                afterlayout: {
                    fn: function() {
                        if ("yes" != _D("dockerdsm")) {
                            this.addTip(this.servNameField.getEl(), String.format(_T("welcome", "welcome_server_name_tip"), _D("upnpmodelname")))
                        }
                        this.addTip(this.accountField.getEl(), String.format(_T("welcome", "welcome_account_info_tip"), _D("upnpmodelname")))
                    },
                    single: true,
                    scope: this
                }
            }
        }, a);
        this.setAliasAgain = false;
        this.callParent([b])
    },
    initLayout: function() {
        this.pswID = Ext.id();
        this.cfmPswID = Ext.id();
        this.servNameField = new SYNO.ux.TextField({
            name: "myds_server_name",
            fieldLabel: _T("welcome", "welcome_admin_server_name"),
            labelSeparator: "",
            maxLength: 15,
            allowBlank: false,
            width: 300,
            vtype: "netbiosName",
            hidden: ("yes" === _D("dockerdsm")),
            disabled: ("yes" === _D("dockerdsm")),
            scope: this
        });
        this.accountField = new SYNO.ux.TextField({
            name: "myds_account",
            fieldLabel: _T("welcome", "welcome_admin_account_id"),
            labelSeparator: "",
            maxLength: 64,
            allowBlank: false,
            blankText: _T("user", "error_noname"),
            vtype: "username",
            width: 300,
            scope: this
        });
        this.passStrField = new SYNO.ux.DisplayField({
            fieldLabel: _T("welcome", "passwd_strength"),
            labelSeparator: "",
            htmlEncode: false,
            value: '<div class="strength-block password-strength-weak"></div><div class="strength-block"></div><div class="strength-block"></div><div class="strength-text password-strength-weak">' + _T("welcome", "passwd_weak") + "</div>"
        });
        this.passField = new SYNO.SDS.App.WelcomeApp.RegisterFormPanel.PasswordField({
            id: this.pswID,
            fieldLabel: _T("user", "user_passwd"),
            labelSeparator: "",
            name: "myds_password",
            inputType: "password",
            maxLength: 127,
            allowBlank: true,
            width: 300,
            accountField: this.accountField,
            validationEvent: "keyup",
            strengthField: this.passStrField,
            owner: this,
            scope: this
        });
        this.confirmPassField = new SYNO.ux.TextField({
            id: this.cfmPswID,
            fieldLabel: _T("user", "user_repswd"),
            labelSeparator: "",
            textType: "password",
            maxLength: 127,
            allowBlank: true,
            width: 300,
            initialPin: this.pswID,
            invalidText: _T("error", "error_repswd"),
            validator: function(c) {
                if (this.initialPin) {
                    var b = Ext.getCmp(this.initialPin).getValue();
                    return (c == b)
                }
                return true
            },
            scope: this
        });
        this.registerAgent = new SYNO.ux.Checkbox({
            width: "auto",
            xtype: "syno_checkbox",
            name: "registBox",
            checked: true,
            htmlEncode: false,
            boxLabel: String.format(_T("welcome", "welcome_enable_register_ip"), "http://find.synology.com", "find.synology.com"),
            scope: this
        });
        var a = [this.servNameField, this.accountField, this.passField, this.confirmPassField, this.passStrField, this.registerAgent];
        return a
    },
    fieldsValid: function() {
        var b = this.servNameField.isValid();
        var a = this.accountField.isValid();
        var d = this.passField.isValid();
        var c = this.confirmPassField.isValid();
        return (b && a && d && c)
    },
    addTip: function(d, a) {
        var c = document.createElement("div");
        c.className = "information-tip-icon";
        c.setAttribute("ext:qtip", a);
        var b = Ext.getCmp(d.id);
        Ext.getDom(b.label).appendChild(c)
    }
});
Ext.define("SYNO.SDS.App.WelcomeApp.RegisterFormPanel.PasswordField", {
    extend: "SYNO.ux.TextField",
    exPwdStrength: 0,
    pwdStrengthText: [_T("welcome", "passwd_weak"), _T("welcome", "passwd_medium"), _T("welcome", "passwd_strong")],
    pwdStrengthCls: ["password-strength-weak", "password-strength-medium", "password-strength-strong"],
    hinStr: _T("welcome", "passwd_hint_rule") + " ",
    constructor: function(a) {
        this.callParent([this.fillConfig(a)])
    },
    fillConfig: function(a) {
        var b = {
            validator: this.onCheckValidate
        };
        Ext.apply(b, a);
        return b
    },
    onCheckValidate: function(b) {
        var a = this.checkStrength(b);
        return (a.length === 0) ? true : this.hinStr + a.join(", ")
    },
    setHint: function(b, a) {
        if (a.length === 0) {
            this.setTipMsg("", b);
            return
        }
        this.setTipMsg(this.hinStr + a.join(", "), b)
    },
    setTipMsg: function(b, a) {
        a.dom.setAttribute("ext:qtip", b)
    },
    checkStrength: function(k) {
        var e, f = /[a-z]/,
            l = /[A-Z]/,
            j = /[0-9]/,
            d = /[~`!@#$%^&*()\-_+={[}]|\\:;"'<,>\.\? ]/,
            h, b, a = [],
            m = this.ownerCt.ownerCt.rules,
            g = this.accountField.getValue().toLowerCase();
        for (e in m) {
            if (m[e] === true) {
                h = false;
                switch (e) {
                    case "exclude_username":
                        h = (g.length === 0 || k.toLowerCase().indexOf(g) < 0);
                        break;
                    case "included_numeric_char":
                        h = j.test(k);
                        break;
                    case "included_special_char":
                        h = d.test(k);
                        break;
                    case "min_length_enable":
                        h = (k.length >= m.min_length);
                        break;
                    case "mixed_case":
                        h = (f.test(k) && l.test(k));
                        break;
                    default:
                        break
                }
                if (!h) {
                    a.push((e === "min_length_enable") ? _T("passwd", e) + " " + m.min_length : _T("passwd", e))
                }
            }
        }
        b = Math.max(3 - a.length, 1);
        if (k === "") {
            b = 1
        }
        var c = this.strengthField.el.query(".strength-block"),
            n = this.strengthField.el.child(".strength-text");
        if (this.exPwdStrength !== b) {
            for (e = 0; e < 3; e++) {
                c[e].removeClassName(this.pwdStrengthCls[this.exPwdStrength - 1]);
                if (e <= (b - 1)) {
                    c[e].addClassName(this.pwdStrengthCls[b - 1])
                }
            }
            n.removeClass(this.pwdStrengthCls[this.exPwdStrength - 1]);
            n.addClass(this.pwdStrengthCls[b - 1]);
            n.update(this.pwdStrengthText[b - 1]);
            this.exPwdStrength = b
        }
        return a
    }
});
Ext.define("SYNO.SDS.App.WelcomeApp.UpdateSettingPanel", {
    extend: "Ext.Container",
    region: "Dublin",
    constructor: function(a) {
        var b = this.fillConfig(a);
        this.callParent([b])
    },
    fillConfig: function(a) {
        this.nextBtn = new SYNO.ux.Button({
            xtype: "syno_button",
            btnStyle: "blue",
            text: (a.gotoFinish ? _T("common", "finish") : _T("common", "next")),
            itemId: "next",
            cls: "welcome-next-btn",
            disabled: false,
            scope: this,
            handler: function() {
                this.onGotoNextPage()
            }
        });
        this.settingForm = new SYNO.SDS.App.WelcomeApp.UpdateSettingFormPanel({
            owner: a.owner,
            appWin: a.appWin
        });
        this.sendWebAPI({
            api: "SYNO.Core.Region.NTP",
            version: 1,
            method: "listzone",
            callback: function(g, f, e, d) {
                var c = SYNO.API.Util.GetValByAPI(f, "SYNO.Core.Region.NTP", "listzone", "zonedata");
                this.region = this.getTimeZone(c)
            },
            scope: this
        });
        var b = {
            header: false,
            border: false,
            cls: "welcome-step-ct",
            items: [{
                xtype: "box",
                cls: "welcome-step-title",
                html: String.format(_T("welcome", "update_setting_title"))
            }, {
                xtype: "box",
                cls: "welcome-step-desc",
                itemId: "subtitle",
                html: String.format(_T("welcome", "update_setting_subtitle")),
                listeners: {
                    afterrender: {
                        fn: this.addDescTip,
                        single: true,
                        scope: this
                    }
                }
            }, this.settingForm, {
                xtype: "container",
                cls: "welcome-paging-update-setting",
                items: this.nextBtn
            }]
        };
        Ext.apply(b, a);
        return b
    },
    getTimeZone: function(b) {
        var c, a, f, d, e = "Dublin";
        c = (new Date()).getFullYear();
        if (Ext.isNumber(c)) {
            a = new Date(c, 0, 1).getTimezoneOffset();
            f = new Date(c, 6, 1).getTimezoneOffset()
        }
        if (Ext.isNumber(a) && Ext.isNumber(f)) {
            d = (-1) * Math.max(a, f) * 60
        }
        Ext.each(b, function(h, g, i) {
            if (h.offset === d) {
                e = h.value;
                return false
            }
        }, this);
        return e
    },
    addDescTip: function() {
        var c = document.createElement("div");
        var b = this.getComponent("subtitle");
        c.className = "update-setting-desc-tip-icon";
        c.setAttribute("ext:qtip", String.format(_T("welcome", "update_setting_subtitle_tip")));
        var a = Ext.getCmp(b.id);
        Ext.getDom(a.el).appendChild(c)
    },
    setLanguageSetting: function() {
        if (SYNO.SDS.UserSettings.getProperty("SYNO.SDS.App.WelcomeApp.Instance", "welcome_dsm50_hide")) {
            return
        }
        var d = _S("lang"),
            b = "enu",
            e = "enu",
            a = SYNO.SDS.Utils.getSupportedLanguage(0),
            c = SYNO.SDS.Utils.getSupportedLanguageCodepage(0);
        Ext.each(a, function(f) {
            if (f[0] === d) {
                b = f[0];
                return false
            }
        }, this);
        Ext.each(c, function(f) {
            if (f[0] === d) {
                e = f[0];
                return false
            }
        }, this);
        this.sendWebAPI({
            api: "SYNO.Core.Region.Language",
            version: 1,
            method: "set",
            params: {
                language: "def",
                maillang: b,
                codepage: e
            }
        })
    },
    onGotoNextPage: function() {
        var a = this;
        this.setLanguageSetting();
        this.sendWebAPI({
            api: "SYNO.Core.Upgrade.Setting",
            version: 2,
            method: "set",
            params: a.settingForm.getSettings().update,
            callback: function(g, c, f, d) {
                if (!g) {
                    var e = new SYNO.SDS.MessageBoxV5({
                        owner: this.appWin,
                        renderTo: Ext.getBody()
                    });
                    e.getWrapper().alert(_T("error", "error_error"), _T("welcome", "update_setting_set_fail"), function() {
                        a.gotoNextPage();
                        return
                    })
                } else {
                    a.gotoNextPage()
                }
            }
        });
        this.sendWebAPI({
            api: "SYNO.Core.Region.NTP",
            version: 1,
            method: "setzone",
            params: {
                timezone: this.region
            }
        });
        if (!a.settingForm.getSettings().smart) {
            return
        }
        var b = function(c) {
            var d = new Date();
            if ("extend" === c) {
                d.setDate(d.getDate() + 15)
            }
            this.api = "SYNO.Storage.CGI.Smart.Scheduler";
            this.version = 1;
            this.method = "set";
            this.params = {
                app: {
                    task_name: "Auto S.M.A.R.T. Test",
                    id: "-1",
                    enabled: "true",
                    test_style: c,
                    test_range: "all",
                    selected_disks: ""
                },
                basic: {
                    task_name: "Auto S.M.A.R.T. Test",
                    id: "-1",
                    enabled: "true",
                    test_style: c,
                    test_range: "all",
                    selected_disks: ""
                },
                schedule: {
                    date: String.format("{0}/{1}/{2}", d.getFullYear(), d.getMonth() + 1, d.getDate()),
                    repeat: ("quick" === c) ? 1 : 3,
                    date_type: 1,
                    hour: 0,
                    min: 0,
                    repeat_hour: 0,
                    repeat_min: 0,
                    last_work_hour: 0,
                    repeat_min_store_config: [],
                    repeat_hour_store_config: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]
                }
            }
        };
        this.sendWebAPI({
            compound: {
                stopwhenerror: false,
                params: [new b("quick"), new b("extend")]
            }
        })
    },
    gotoNextPage: function() {
        this.appWin.gotoNextStep()
    }
});
Ext.define("SYNO.SDS.App.WelcomeApp.UpdateSettingScheduleField", {
    extend: "SYNO.ux.CompositeField",
    constructor: function(a) {
        var c = Math.floor(Math.random() * 7);
        var b = Ext.apply({
            hideLabel: true,
            indent: 1,
            border: false,
            layout: "hbox",
            height: 31,
            ctCls: "schedule-setting-composite",
            cls: "schedule-setting-class",
            items: [{
                xtype: "syno_displayfield",
                value: a.scheduleType,
                cls: "schedule-setting-label"
            }, {
                xtype: "box",
                width: 20
            }, {
                xtype: "syno_schedulefield",
                name: a.itemId + "_week_day",
                allowBlank: false,
                editable: false,
                width: 163,
                value: String.format("{0},{1}", c.toString(), ((c + 3) % 7).toString())
            }, {
                xtype: "box",
                width: 26
            }, {
                xtype: "syno_combobox",
                name: a.itemId + "_hour",
                width: 56,
                listWidth: 56,
                displayField: "display",
                valueField: "value",
                store: SYNO.SDS.Utils.createTimeItemStore("hour"),
                value: Math.floor(Math.random() * 7)
            }, {
                xtype: "syno_displayfield",
                value: ":",
                width: 12,
                cls: "schedule-setting-colon"
            }, {
                xtype: "syno_combobox",
                name: a.itemId + "_minute",
                width: 56,
                listWidth: 56,
                displayField: "display",
                valueField: "value",
                store: SYNO.SDS.Utils.createTimeItemStore("min"),
                value: (Math.floor(Math.random() * 12) * 5)
            }]
        }, a);
        this.callParent([b])
    },
    slideOut: function() {
        this.itemCt.slideOut("t", {
            easing: "easeOut",
            duration: 0.3,
            useDisplay: true
        })
    },
    slideIn: function() {
        this.itemCt.slideIn("t", {
            easing: "easeOut",
            duration: 0.3,
            useDisplay: true
        })
    }
});
Ext.define("SYNO.SDS.App.WelcomeApp.UpdateSettingFormPanel", {
    extend: "SYNO.SDS.Utils.FormPanel",
    constructor: function(b) {
        var a = ("hotfix" === _S("update_setting_update_type") || "yes" === _D("dockerdsm"));
        this.scheduleFields = [];
        var c = [];
        if (!a) {
            var f = new SYNO.SDS.App.WelcomeApp.UpdateSettingScheduleField({
                scheduleType: _T("update", "autoupdate_time_desc"),
                itemId: "all_update_schedule"
            });
            this.scheduleFields.push(f);
            c = c.concat([{
                xtype: "syno_radio",
                name: "autoupdate_type",
                itemId: "autoupdate_all",
                checked: true,
                value: "all",
                boxLabel: _T("welcome", "update_setting_type_all"),
                scope: this,
                listeners: {
                    check: this.showAllUpdateSchedule,
                    scope: this
                }
            }, f, {
                xtype: "box",
                height: 8
            }])
        }
        var g = new SYNO.SDS.App.WelcomeApp.UpdateSettingScheduleField({
            hidden: !a,
            scheduleType: _T("update", "autoupdate_time_desc"),
            itemId: "hotfix_only_schedule"
        });
        var e = new SYNO.SDS.App.WelcomeApp.UpdateSettingScheduleField({
            hidden: true,
            scheduleType: _T("service", "service_dl_start_desc"),
            itemId: "download_schedule"
        });
        this.scheduleFields = this.scheduleFields.concat([g, e]);
        c = c.concat([{
            xtype: "syno_radio",
            name: "autoupdate_type",
            itemId: "autoupdate_hotfix",
            checked: a,
            value: "hotfix",
            boxLabel: _T("welcome", "update_setting_type_hotfix"),
            listeners: {
                check: this.showHotfixOnlySchedule,
                afterrender: {
                    fn: function() {
                        var i = document.createElement("div");
                        var h = this.getComponent("autoupdate_hotfix");
                        i.className = "update-setting-label-tip-icon";
                        i.setAttribute("ext:qtip", String.format(_T("welcome", "update_setting_type_hotfix_tip")));
                        Ext.getDom(h.getEl()).parentNode.appendChild(i)
                    },
                    single: true,
                    scope: this
                },
                scope: this
            }
        }, g, {
            xtype: "box",
            height: 8
        }, {
            xtype: "syno_radio",
            name: "autoupdate_type",
            itemId: "autoupdate_download",
            value: "download",
            boxLabel: _T("welcome", "update_setting_type_download"),
            listeners: {
                check: this.showDownloadSchedule,
                scope: this
            }
        }, e]);
        if (!SYNO.SDS.Utils.isInVirtualDSM() && "yes" !== _D("dockerdsm")) {
            c = c.concat([{
                xtype: "box",
                width: 735,
                cls: "bottom-line"
            }, {
                xtype: "syno_checkbox",
                ctCls: "welcome-smart-checkbox",
                itemId: "smart_test_checkbox",
                name: "enable_smart_test",
                boxLabel: _T("welcome", "welcome_smart_test"),
                checked: "yes" === _D("support_autocreate_shr"),
                listeners: {
                    afterrender: {
                        fn: function() {
                            var i = document.createElement("div");
                            var h = this.getComponent("smart_test_checkbox");
                            i.className = "update-setting-label-tip-icon";
                            i.setAttribute("ext:qtip", String.format(_T("welcome", "welcome_smart_test_tip")));
                            h.boxlabelEl.appendChild(i)
                        },
                        single: true,
                        scope: this
                    }
                }
            }])
        }
        var d = Ext.apply({
            cls: "welcome-update-setting-form",
            border: false,
            header: false,
            height: 300,
            autoFlexcroll: false,
            useGradient: false,
            items: c
        }, b);
        this.callParent([d])
    },
    showAllUpdateSchedule: function(b, a) {
        if (a && this.getComponent("all_update_schedule")) {
            this.hideFields();
            this.getComponent("all_update_schedule").slideIn()
        }
    },
    showHotfixOnlySchedule: function(b, a) {
        if (a) {
            this.hideFields();
            this.getComponent("hotfix_only_schedule").slideIn()
        }
    },
    showDownloadSchedule: function(b, a) {
        if (a) {
            this.hideFields();
            this.getComponent("download_schedule").slideIn()
        }
    },
    hideFields: function() {
        Ext.each(this.scheduleFields, function(b, a) {
            b.slideOut();
            if (b.hidden) {
                b.show()
            }
        })
    },
    getSettings: function() {
        var c = this.getForm().getValues();
        var b = {};
        if ("all" === c.autoupdate_type && this.getComponent("all_update_schedule")) {
            b.week_day = c.all_update_schedule_week_day;
            b.hour = c.all_update_schedule_hour;
            b.minute = c.all_update_schedule_minute
        } else {
            if ("hotfix" === c.autoupdate_type) {
                b.week_day = c.hotfix_only_schedule_week_day;
                b.hour = c.hotfix_only_schedule_hour;
                b.minute = c.hotfix_only_schedule_minute
            } else {
                b.week_day = c.download_schedule_week_day;
                b.hour = c.download_schedule_hour;
                b.minute = c.download_schedule_minute
            }
        }
        var a = {};
        a.update = {
            autoupdate_enable: true,
            autoupdate_type: c.autoupdate_type,
            schedule: b
        };
        if ("yes" !== _D("dockerdsm")) {
            a.smart = c.enable_smart_test
        } else {
            a.smart = false
        }
        return a
    }
});
Ext.define("SYNO.SDS.App.WelcomApp.InstallDlg", {
    extend: "SYNO.SDS.ModalWindow",
    termOfUseURL: "http://www.synology.com/company/term_packagecenter.php",
    constructor: function(a) {
        Ext.apply(this, a);
        var b = Ext.apply({
            owner: a.owner,
            resizable: false,
            minimizable: false,
            maximizable: false,
            closable: false,
            stateful: false,
            footer: true,
            title: _T("welcome", "welcome_app_title"),
            cls: "x-window-dlg",
            renderTo: document.body,
            items: [{
                xtype: "syno_formpanel",
                items: [{
                    xtype: "syno_displayfield",
                    htmlEncode: false,
                    value: String.format(_T("welcome", "termsofservice_desc"), String.format('<a href="{0}" target="_blank" class="pathlink">{1}</a>', this.termOfUseURL, _T("pkgmgr", "termsofservice")))
                }, {
                    ctCls: "syno-pkg-termdlg-check",
                    xtype: "syno_checkbox",
                    itemId: "option",
                    boxLabel: _T("welcome", "termsofservice_accept"),
                    listeners: {
                        check: {
                            fn: function(d, c) {
                                this.btnOK.setDisabled(!c)
                            },
                            scope: this
                        }
                    }
                }]
            }],
            fbar: new Ext.Toolbar({
                items: [this.btnOK = new SYNO.ux.Button({
                    btnStyle: "blue",
                    id: this.btnOKId = Ext.id(),
                    text: _T("common", "ok"),
                    scope: this,
                    disabled: true,
                    handler: this.onClickOK
                }), {
                    xtype: "syno_button",
                    text: _T("common", "cancel"),
                    scope: this,
                    handler: this.onClickClose
                }],
                enableOverflow: false
            }),
            keys: [{
                key: 27,
                fn: this.onClickClose,
                scope: this
            }]
        }, a);
        this.callParent([b])
    },
    onClickOK: function() {
        SYNO.SDS.UserSettings.setProperty("SYNO.SDS.PkgManApp.Instance", "termofservice", true);
        SYNO.SDS.UserSettings.setProperty("SYNO.SDS.PkgManApp.Instance", "termofservice_4_2", true);
        this.owner.installPanel.installBtn.setDisabled(true);
        this.owner.installPanel.skipBtn.setDisabled(true);
        this.owner.installPanel.enableUserHome();
        this.owner.installPanel.installApp();
        this.close()
    },
    onClickClose: function() {
        this.close()
    }
});
Ext.define("SYNO.SDS.App.WelcomeApp.InstallPanel", {
    extend: "Ext.Container",
    installAppsTitle: [_T("welcome", "welcome_package_photo"), _T("backup", "app_name"), _T("welcome", "welcome_package_video"), _T("welcome", "welcome_package_cloud"), _T("welcome", "welcome_package_mediaserver"), _T("welcome", "welcome_package_download"), _T("welcome", "welcome_package_audio")],
    installAppsName: ["PhotoStation", "HyperBackup", "VideoStation", "CloudStation", "MediaServer", "DownloadStation", "AudioStation"],
    constructor: function(a) {
        var b, c;
        this.idPrefix = "welcome-install-";
        this.appIds = [];
        for (c = 0; c < this.installAppsName.length; c++) {
            this.appIds.push(this.idPrefix + this.installAppsName[c].replace(/\s/, ""))
        }
        b = this.initLayout(a);
        SYNO.SDS.App.WelcomeApp.InstallPanel.superclass.constructor.call(this, b)
    },
    createAppBoxes: function() {
        var d = [],
            c, b;
        var k = (this.installAppsTitle.length) / 2,
            e = 2;
        for (c = 0; c < k; c++) {
            var a = [],
                f = c + 1;
            var h = {
                xtype: "container",
                layout: "hbox",
                cls: "welcome-install-apps-hbox" + f,
                bottom: 68,
                items: []
            };
            for (b = 0; b < e; b++) {
                var g = e * c + b;
                if (g >= this.installAppsTitle.length) {
                    break
                }
                a.push({
                    xtype: "box",
                    html: String.format('<div id="{0}" class="{1}"><div class="welcome-install-app-icon"></div><div class="welcome-install-app-finish-icon"></div><p class="welcome-install-apps-title">{2}</p><p id="{3}" class="welcome-install-apps-subtitle"></p></div>', this.appIds[g], String.format("{0}", this.appIds[g]).toLowerCase(), this.installAppsTitle[g], String.format("{0}-subtitle", this.appIds[g].toLowerCase()))
                })
            }
            h.items = a;
            d.push(h)
        }
        return d
    },
    initLayout: function(a) {
        this.skipBtn = new SYNO.ux.Button({
            cls: "welcome-skip-step-btn",
            text: _T("welcome", "welcome_skip_alias"),
            handler: this.onSkipClick,
            scope: this
        });
        this.installBtn = new SYNO.ux.Button({
            xtype: "syno_button",
            btnStyle: "blue",
            text: _T("welcome", "welcome_pkg_install"),
            itemId: "install",
            cls: "welcome-next-btn",
            disabled: false,
            handler: this.onInstallClick,
            scope: this
        });
        var b = {
            header: false,
            border: false,
            cls: "welcome-step-ct",
            items: [{
                xtype: "box",
                cls: "welcome-step-title",
                html: String.format(_T("welcome", "welcome_install_title"))
            }, {
                xtype: "box",
                cls: "welcome-step-desc fixed-install-height-desc",
                html: _T("welcome", "welcome_install_desc")
            }]
        };
        b.items = b.items.concat(this.createAppBoxes());
        b.items.push({
            xtype: "container",
            cls: "welcome-paging",
            items: this.installBtn
        });
        b.items.push(this.skipBtn);
        Ext.apply(b, a);
        return b
    },
    onInstallClick: function() {
        var a = new SYNO.SDS.App.WelcomApp.InstallDlg({
            owner: this.appWin,
            width: 500,
            height: 205
        });
        a.show()
    },
    onSkipClick: function() {
        this.appWin.gotoNextStep()
    },
    enableUserHome: function() {
        this.sendWebAPI({
            api: "SYNO.Core.User.Home",
            version: 1,
            method: "set",
            params: {
                location: this.appWin.curVol.path,
                enable: true
            }
        })
    },
    installApp: function() {
        var b;
        var a;
        for (a = 0; a < this.appIds.length; a++) {
            b = String.format("{0}-subtitle", this.appIds[a].toLowerCase());
            Ext.get(b).update(_T("welcome", "welcome_status_waiting"))
        }
        this.sendWebAPI({
            api: "SYNO.Core.QuickStart.Install",
            version: 1,
            method: "install_pkgs",
            params: {
                path: this.appWin.curVol.path
            }
        });
        this.checkTaskId = this.pollReg({
            webapi: {
                api: "SYNO.Core.QuickStart.Install",
                method: "check_progress",
                version: 1
            },
            immediate: true,
            interval: 10,
            scope: this,
            status_callback: this.onCheck
        })
    },
    extractInstallMsg: function(b, e) {
        if (!b || !e) {
            return _T("common", "commfail")
        }
        if (!e.error) {
            return _T("welcome", "welcome_install_pkg_success")
        }
        if (!Ext.isArray(e.error)) {
            return _T("common", "commfail")
        }
        var d = [],
            c;
        for (c = 0; c < e.error.length; c++) {
            if (e.error[c].name === "all") {
                d = this.installAppsTitle;
                break
            } else {
                var a = this.installAppsName.indexOf(e.error[c].name);
                if (a >= 0) {
                    d.push(this.installAppsTitle[a])
                }
            }
        }
        return String.format(_T("welcome", "welcome_install_pkg_fail"), d.join(", "))
    },
    stopCheckTask: function() {
        if (this.checkTaskId) {
            this.pollUnreg(this.checkTaskId);
            this.checkTaskId = null
        }
    },
    onInstall: function(a, e) {
        var c = this.appWin,
            b = new SYNO.SDS.MessageBoxV5({
                owner: this.appWin,
                renderTo: Ext.getBody()
            }),
            d;
        this.stopCheckTask();
        d = this.extractInstallMsg(a, e);
        b.getWrapper().alert("", d, function() {
            c.gotoNextStep()
        })
    },
    onCheck: function(a, b) {
        if (!b) {
            return
        }
        if (b.done === true) {
            this.onInstall(a, b);
            SYNO.SDS.StatusNotifier.fireEvent("thirdpartychanged")
        }
        if (!Ext.isEmpty(b.success_pkg)) {
            this.updateProgress(b.success_pkg)
        }
    },
    updateProgress: function(d) {
        var a;
        for (a = 0; a < d.length; a++) {
            var b = this.idPrefix + d[a];
            Ext.get(b).addClass("welcome-install-finished");
            var c = String.format("{0}-subtitle", (this.idPrefix + d[a]).toLowerCase());
            Ext.get(c).update(_T("welcome", "welcome_status_install"))
        }
    }
});
Ext.define("SYNO.SDS.App.WelcomeApp.InstallSurPanel", {
    extend: "Ext.Container",
    termOfUseURL: "http://www.synology.com/company/term_packagecenter.php",
    constructor: function(a) {
        var b = this.fillConfig(a);
        this.callParent([b])
    },
    fillConfig: function(a) {
        this.installBtn = new SYNO.ux.Button({
            xtype: "syno_button",
            btnStyle: "blue",
            text: _T("welcome", "welcome_pkg_install"),
            itemId: "install",
            cls: "welcome-next-btn",
            disabled: false,
            handler: this.onInstallClick,
            scope: this
        });
        var b = {
            header: false,
            border: false,
            cls: "welcome-step-ct",
            items: [{
                xtype: "box",
                cls: "welcome-step-title",
                html: _T("welcome", "welcome_install_surv_title")
            }, {
                xtype: "box",
                cls: "welcome-step-desc fixed-install-height-desc",
                html: _T("welcome", "welcome_install_surv_desc")
            }, {
                xtype: "box",
                cls: "welcome-step-surveillance-install-icon"
            }, {
                xtype: "box",
                cls: "welcome-step-surveillance-install-status",
                itemId: "installStatus",
                statusInnerText: '<span class="status-text">{0}</span><div class="dynamic-dot"></div>',
                html: ""
            }, {
                xtype: "container",
                cls: "welcome-paging",
                items: this.installBtn
            }, {
                xtype: "box",
                cls: "welcome-register-agree-eula",
                html: String.format(_T("welcome", "click_termsofservice_accept"), this.termOfUseURL)
            }]
        };
        return Ext.apply(b, a)
    },
    onInstallClick: function() {
        this.updateProgress(false);
        SYNO.SDS.UserSettings.setProperty("SYNO.SDS.PkgManApp.Instance", "termofservice", true);
        SYNO.SDS.UserSettings.setProperty("SYNO.SDS.PkgManApp.Instance", "termofservice_4_2", true);
        this.sendWebAPI({
            api: "SYNO.Core.QuickStart.Install",
            version: 1,
            method: "install_sur",
            params: {
                path: this.appWin.curVol.path
            }
        });
        this.checkTaskId = this.pollReg({
            webapi: {
                api: "SYNO.Core.QuickStart.Install",
                method: "check_progress",
                version: 1
            },
            immediate: true,
            interval: 10,
            scope: this,
            status_callback: this.onCheck
        })
    },
    onCheck: function(a, b) {
        if (!b) {
            return
        }
        if (b.done === true) {
            this.onInstall(a, b)
        }
    },
    stopCheckTask: function() {
        if (this.checkTaskId) {
            this.pollUnreg(this.checkTaskId);
            this.checkTaskId = null
        }
    },
    onInstall: function(a, e) {
        var c = this.appWin,
            b = new SYNO.SDS.MessageBoxV5({
                owner: this.appWin,
                renderTo: Ext.getBody()
            }),
            d;
        this.stopCheckTask();
        if (!a || (e && e.error)) {
            this.fireEvent("installfailed");
            d = _T("welcome", "welcome_install_surv_fail")
        } else {
            SYNO.SDS.StatusNotifier.fireEvent("thirdpartychanged");
            this.fireEvent("installSuccessed");
            d = _T("welcome", "welcome_install_pkg_success")
        }
        b.getWrapper().alert("", d, function() {
            c.gotoNextStep()
        })
    },
    updateProgress: function(b) {
        var a = this.getComponent("installStatus");
        if (!b) {
            this.installBtn.disable();
            a.el.update(String.format(a.statusInnerText, _T("pkgmgr", "installing").replace("...", "")))
        } else {
            this.installBtn.enable();
            a.el.update("")
        }
    }
});
Ext.define("SYNO.SDS.App.WelcomeApp.QuickConnectDescPanel", {
    extend: "Ext.Container",
    constructor: function(a) {
        var b = this.fillConfig(a);
        this.callParent([b])
    },
    fillConfig: function(a) {
        var b = {
            cls: "welcome-quickconnect-desc-panel",
            items: [{
                xtype: "box",
                cls: "welcome-quickconnect-desc-bg"
            }, {
                xtype: "box",
                cls: "welcome-quickconnect-desc-panel-title",
                html: a.title || ""
            }, {
                xtype: "box",
                cls: "welcome-quickconnect-desc-panel-desc",
                html: a.desc || ""
            }, {
                xtype: "box",
                cls: "welcome-quickconnect-desc-panel-img " + (a.imgCls || "")
            }, {
                xtype: "box",
                itemId: "tool-wrap",
                cls: "welcome-quickconnect-desc-panel-tool",
                html: '<div class="close-tool"></div>',
                listeners: {
                    afterrender: {
                        fn: this.onToolRender,
                        scope: this
                    }
                }
            }],
            listeners: {
                afterrender: {
                    fn: function() {
                        Ext.getBody().on("keydown", this.onKeyDown, this);
                        this.mon(this.appWin.el, "click", this.onAppWinClick, this)
                    },
                    scope: this,
                    buffer: 100
                },
                beforedestroy: {
                    fn: function() {
                        Ext.getBody().un("keydown", this.onKeyDown, this)
                    },
                    scope: this
                }
            }
        };
        Ext.apply(b, a);
        return b
    },
    onKeyDown: function(a, b) {
        if (a.keyCode === 27) {
            this.destroy()
        }
    },
    onAppWinClick: function(a) {
        if (a.within(this.el)) {
            return
        }
        this.destroy()
    },
    onToolRender: function() {
        var b = this.getComponent("tool-wrap"),
            a = b.el.child(".close-tool");
        a.on("click", this.destroy, this)
    }
});
Ext.define("SYNO.SDS.App.WelcomeApp.QuickConnectLinkStep", {
    extend: "Ext.Container",
    constructor: function(a) {
        var b = this.fillConfig(a);
        this.callParent([b])
    },
    fillConfig: function(a) {
        this.nextBtn = new SYNO.ux.Button({
            xtype: "syno_button",
            btnStyle: "blue",
            text: _T("common", "next"),
            itemId: "next",
            cls: "welcome-next-btn",
            disabled: false,
            scope: this,
            handler: function() {
                this.appWin.gotoNextStep()
            }
        });
        this.bookmarkWrapID = Ext.id();
        var b = {
            cls: "welcome-step-ct",
            items: [{
                xtype: "box",
                cls: "welcome-step-title",
                html: _T("welcome", "welcome_quickcnt_service_title")
            }, {
                xtype: "box",
                cls: "welcome-step-desc",
                html: String.format(_T("welcome", "welcome_quickcnt_service_desc"), "INTEGRA " + _D("upnpmodelname"))
            }, {
                xtype: "container",
                cls: "welcome-quickconnect-link-container",
                tpl: ['<div class="welcome-service-step-img-left">', '<div class="welcome-service-step-img-top-tag">', '<div class="welcome-service-step-img-top-tab-icon"></div>', '<p class="welcome-service-step-img-top-text">{addr_desc}</p>', "</div>", '<div class="welcome-service-step-textbox">', '<p class="welcome-service-step-textbox-text allowDefCtxMenu selectabletext">{url_text}</p>', "</div>", "</div>", '<div class="welcome-service-step-img-right"></div>', '<div class="welcome-dragurl-container">', '<a href="{url_text}" class="welcomedragable-url" target="_blank">', '<p style="visibility: hidden; position: absolute;"> {hostname} </p>', '<div class="welcome-drag-bookmark-foreground"> </div>', "</a>", "</div>", '<div class="welcome-service-drag-btn-wrap">', '<div class="welcome-service-drag-btn"> {drag_text}</div>', '<div class="welcome-service-drag-btn-left-arrow">', '<div class="welcome-service-drag-btn-arrow-transform"></div>', "</div>", "<div>"],
                data: {
                    addr_desc: _T("welcome", "welcome_nas_address"),
                    drag_text: _T("welcome", "welcome_drag_to_desktop"),
                    url_text: a.quickconnect_url,
                    hostname: Ext.isEmpty(_S("hostname"), true) ? "INTEGRA OS" : _S("hostname")
                },
                listeners: {
                    afterlayout: function() {
                        var f = this.el,
                            d = f.child(".welcome-service-step-img-right"),
                            h = f.child(".welcome-service-step-img-left"),
                            e = f.child(".welcomedragable-url"),
                            c = f.child(".welcome-service-drag-btn-left-arrow"),
                            g = f.child(".welcome-service-drag-btn");
                        d.anchorTo(h, "l-r");
                        c.anchorTo(e, "l-r", [8, 0]);
                        g.anchorTo(c, "l-r")
                    }
                }
            }, {
                xtype: "container",
                cls: "welcome-paging",
                items: this.nextBtn
            }]
        };
        return Ext.apply(b, a)
    }
});
Ext.define("SYNO.SDS.App.WelcomeApp.RegisterQuickConnectStep", {
    extend: "Ext.Container",
    myDSInfoUrl: "https://myds.synology.com/",
    infoLoaded: false,
    constructor: function(a) {
        var b = this.fillConfig(a);
        this.callParent([b])
    },
    fillConfig: function(a) {
        var c = this;
        c.registerForm = new SYNO.SDS.App.WelcomeApp.RegisteQuickConnectForm({
            owner: this,
            type: (a && a.type) ? a.type : null
        });
        c.skipBox = new SYNO.ux.Button({
            cls: "welcome-skip-step-btn",
            text: _T("welcome", "welcome_skip_alias"),
            handler: function() {
                var d = new SYNO.SDS.MessageBoxV5({
                    owner: c.appWin,
                    renderTo: Ext.getBody()
                });
                d.getWrapper().confirm(_T("error", "error_error"), _T("welcome", "skip_warning"), function(e) {
                    if (e === "yes") {
                        this.appWin.gotoNextStep()
                    }
                }, c)
            }
        });
        this.nextBtn = new SYNO.ux.Button({
            xtype: "syno_button",
            btnStyle: "blue",
            text: _T("common", "next"),
            itemId: "next",
            cls: "welcome-next-btn",
            disabled: false,
            scope: this,
            handler: function() {
                if (this.registerForm.fieldsValid() === false) {
                    return
                }
                this.onGotoNextPage()
            }
        });
        var b = {
            header: false,
            border: false,
            cls: "welcome-step-ct",
            height: 800,
            items: [{
                xtype: "box",
                cls: "welcome-step-title",
                html: _T("welcome", "welcome_setup_quickcnt_title")
            }, {
                xtype: "box",
                cls: "welcome-step-desc",
                html: String.format(_T("welcome", "welcome_setup_quickcnt_desc"), "INTEGRA " + _D("upnpmodelname"))
            }, this.registerForm, {
                xtype: "container",
                cls: "welcome-paging",
                items: this.nextBtn
            }, this.skipBox],
            listeners: {
                beforeshow: this.loadMyDSInfo,
                scope: this
            }
        };
        Ext.apply(b, a);
        return b
    },
    hideItems: function() {
        this.items.each(function(a) {
            a.hide()
        })
    },
    showItems: function() {
        this.items.each(function(a) {
            a.show()
        })
    },
    loadMyDSInfo: function() {
        if (this.infoLoaded === true) {
            return true
        }
        this.appWin.setStatusBusy();
        this.sendWebAPI({
            compound: {
                stopwhenerror: true,
                params: [{
                    api: "SYNO.Core.QuickConnect",
                    method: "get",
                    version: 2
                }, {
                    api: "SYNO.Core.MyDSCenter",
                    method: "query",
                    version: 2
                }]
            },
            callback: this.onLoadMyDSInfo,
            scope: this
        });
        return false
    },
    onLoadMyDSInfo: function(k, f, e, b) {
        var c = this.registerForm;
        this.appWin.clearStatusBusy();
        if (k && f.has_fail !== true) {
            var l = f.result[0].data,
                d = f.result[1].data,
                i = l.enabled,
                h = d.is_logged_in,
                a = (h === true) ? d.account : "",
                j = (i === true) ? l.server_alias : "";
            c.updateFormValue({
                myds_account: a,
                server_alias: j
            });
            if (h && i) {
                this.appWin.gotoNextStep();
                return
            }
            if (h) {
                c.adjustForLoginAccount()
            } else {
                for (var g in _S("found_myds_account")) {
                    if (_S("found_myds_account").hasOwnProperty(g)) {
                        c.updateFormValue({
                            myds_account: g
                        });
                        c.showUseExistMyDSFields();
                        break
                    }
                }
            }
            c.getForm().clearInvalid()
        }
        this.infoLoaded = true;
        this.show()
    },
    onGotoNextPage: function() {
        this.appWin.setStatusBusy();
        var a = this.registerForm.getWebAPIParams();
        this.sendWebAPI(Ext.apply(a, {
            callback: this.processApiReturnData.createDelegate(this)
        }))
    },
    getErrorMsg: function(b) {
        var a = SYNO.API.getErrorString(b);
        switch (b) {
            case 2902:
                a = _T("relayservice", "relayservice_err_resolv");
                break;
            case 2904:
                a = String.format(a, this.registerForm.quickCon_field.getValue());
                break;
            case 3005:
                a = String.format(a, this.registerForm.email_field.getValue());
                break;
            case 3010:
                a = String.format(a, this.registerForm.email_field.getValue());
                break
        }
        return a
    },
    processApiReturnData: function(l, h, f, a) {
        var e = this.registerForm,
            n, c;
        this.appWin.clearStatusBusy();
        if (l && h.has_fail === false) {
            var m = new SYNO.SDS.QuickConnect.Main(),
                b = m.aliasToPortalUrl(e.quickCon_field.getValue(), "NORMAL"),
                j = new SYNO.SDS.App.WelcomeApp.QuickConnectLinkStep({
                    quickconnect_url: b,
                    appWin: this.appWin
                });
            this.appWin.insertStepAfter(j, this.itemId);
            this.appWin.gotoNextStep()
        } else {
            if (!l) {
                n = _T("common", "commfail");
                c = new SYNO.SDS.MessageBoxV5({
                    owner: this.orgWindow,
                    renderTo: Ext.getBody()
                });
                c.getWrapper().alert(_T("error", "error_error"), n, function() {
                    this.appWin.gotoNextStep()
                }, this)
            } else {
                var k = h.result[0];
                if (this.registerForm.type !== "is_login_ok" && k && k.success && k.api === "SYNO.Core.MyDSCenter" && (k.method === "register" || k.method === "login")) {
                    this.registerForm.adjustForLoginAccount()
                }
                for (var g = 0; g < h.result.length; g++) {
                    if (h.result[g].error) {
                        var d = h.result[g].error.code;
                        if (d == 2906) {
                            n = _T("relayservice", "alias_change_machine_message");
                            c = new SYNO.SDS.MessageBoxV5({
                                owner: this.orgWindow,
                                renderTo: Ext.getBody()
                            });
                            c.getWrapper().confirm(_T("error", "error_error"), n, function(i) {
                                if (i === "yes") {
                                    e.setAliasAgain = true;
                                    this.onGotoNextPage()
                                }
                                return
                            }, this)
                        } else {
                            if (d == 3010) {
                                e.type = "is_login_ok";
                                this.onGotoNextPage()
                            } else {
                                if (d == 3012) {
                                    n = _T("welcome", "error_exist_myds_account");
                                    c = new SYNO.SDS.MessageBoxV5({
                                        owner: this.orgWindow,
                                        renderTo: Ext.getBody()
                                    });
                                    c.getWrapper().alert(_T("error", "error_error"), n)
                                } else {
                                    if (d < 105 || d > 108) {
                                        n = this.getErrorMsg(d);
                                        c = new SYNO.SDS.MessageBoxV5({
                                            owner: this.orgWindow,
                                            renderTo: Ext.getBody()
                                        });
                                        c.getWrapper().alert(_T("error", "error_error"), n)
                                    } else {
                                        SYNO.API.CheckResponse(h.result[g].success, h.result[g].error)
                                    }
                                }
                            }
                        }
                        return
                    }
                }
            }
        }
    }
});
Ext.define("SYNO.SDS.App.WelcomeApp.RegisteQuickConnectForm", {
    extend: "SYNO.ux.FormPanel",
    constructor: function(a) {
        var b = Ext.apply({
            cls: "welcome-form quickconnect-form",
            border: false,
            autoFlexcroll: false,
            labelWidth: 300,
            height: 280,
            useGradient: false,
            labelSeparator: "",
            hasExistAlias: false,
            items: this.initLayout(a)
        }, a);
        this.setAliasAgain = false;
        this.callParent([b])
    },
    showCreateMyDSFields: function() {
        this.hideFields();
        Ext.defer(function() {
            this.forgetPW_field.hide();
            this.use_exist_radio.hide();
            this.showRegisterFields();
            this.fake_exist_radio.show()
        }, 300, this)
    },
    showUseExistMyDSFields: function() {
        this.hideFields();
        Ext.defer(function() {
            this.fake_exist_radio.hide();
            this.use_exist_radio.show();
            this.forgetPW_field.show();
            this.use_exist_radio.setValue(true);
            this.showUseExistAccFields()
        }, 300, this)
    },
    adjustForLoginAccount: function() {
        this.type = "is_login_ok";
        this.hideFields(true);
        this.register_radio.hide();
        this.use_exist_radio.hide();
        this.forgetPW_field.hide();
        this.fake_exist_radio.hide();
        this.loginAccount_field.setValue(this.email_field.getValue());
        this.loginAccount_field.show();
        this.quickCon_field.show()
    },
    initLayout: function(a) {
        var c = a && a.type === "is_login_ok";
        this.pswID = Ext.id();
        this.cfmPswID = Ext.id();
        this.register_radio = new SYNO.ux.Radio({
            cls: "welcome-register-radio",
            name: "register",
            boxLabel: _T("welcome", "welcome_register_account"),
            inputValue: "register",
            checked: true,
            hidden: c,
            handler: function() {
                if (this.register_radio.checked === true) {
                    this.showCreateMyDSFields()
                }
            },
            scope: this
        });
        this.use_exist_radio = new SYNO.ux.Radio({
            cls: "welcome-register-radio",
            name: "register",
            boxLabel: _T("welcome", "welcome_use_exist_account"),
            inputValue: "exist",
            hidden: true,
            scope: this
        });
        this.fake_exist_radio = new SYNO.ux.Radio({
            cls: "welcome-register-radio",
            name: "register",
            boxLabel: _T("welcome", "welcome_use_exist_account"),
            inputValue: "exist",
            hidden: c,
            ctCls: "welcome-top-padding-field",
            handler: function() {
                if (this.fake_exist_radio.checked === true) {
                    this.showUseExistMyDSFields()
                }
            },
            scope: this
        });
        this.email_field = new SYNO.ux.TextField({
            name: "myds_account",
            cls: "welcome-register-textfield",
            fieldLabel: _T("welcome", "welcome_email_addr"),
            minLength: 3,
            maxLength: 256,
            vtype: "email",
            allowBlank: false,
            itemCls: "x-form-item item-with-larger-indent",
            hidden: c,
            vtypeText: _JSLIBSTR("vtype", "bad_email"),
            width: 300,
            indent: 2,
            scope: this
        });
        this.loginAccount_field = new SYNO.ux.DisplayField({
            fieldLabel: _T("welcome", "welcome_email_addr"),
            value: "",
            indent: 2,
            hidden: !c,
            itemCls: "x-form-item item-with-larger-indent",
            name: "login_account"
        });
        this.psw_field = new SYNO.ux.TextField({
            id: this.pswID,
            cls: "welcome-register-textfield",
            fieldLabel: _T("common", "password"),
            name: "myds_password",
            textType: "password",
            vtype: "confirmPassword",
            itemCls: "x-form-item item-with-larger-indent",
            hidden: c,
            minLength: 6,
            maxLength: 128,
            allowBlank: false,
            width: 300,
            indent: 2,
            scope: this
        });
        this.cfmPsw_field = new SYNO.ux.TextField({
            id: this.cfmPswID,
            cls: "welcome-register-textfield",
            fieldLabel: _T("user", "user_repswd"),
            textType: "password",
            hidden: c,
            confirmFor: "password",
            allowBlank: false,
            itemCls: "x-form-item item-with-larger-indent",
            vtype: "confirmPassword",
            initialPin: this.pswID,
            width: 300,
            indent: 2,
            scope: this
        });
        this.forgetPW_field = new SYNO.ux.DisplayField({
            fieldLabel: " ",
            hidden: true,
            htmlEncode: false,
            value: _T("welcome", "forget_myds_passwd"),
            itemCls: "x-form-item item-with-larger-indent"
        });
        this.quickCon_field = new SYNO.ux.TextField({
            cls: "welcome-register-textfield",
            name: "server_alias",
            fieldLabel: _T("welcome", "welcome_quickcnt_id"),
            width: 300,
            indent: 2,
            itemCls: "x-form-item item-with-larger-indent",
            allowBlank: false,
            maxLength: 63,
            regex: /^[a-zA-Z][a-zA-Z\-0-9]*$/,
            regexText: _JSLIBSTR("vtype", "bad_relay_alias_name"),
            scope: this
        });
        Ext.apply(Ext.form.VTypes, {
            confirmPassword: function(f, e) {
                if (e.initialPin) {
                    var d = Ext.getCmp(e.initialPin).getValue();
                    return (f == d)
                }
                return true
            },
            confirmPasswordText: _T("error", "error_repswd")
        });
        var b = [this.register_radio, this.use_exist_radio, {
            indent: 1,
            xtype: "syno_displayfield",
            itemId: "myds-setup",
            hideLabel: true,
            infoTitle: _T("welcome", "welcome_myds"),
            infoDesc: _T("welcome", "welcome_myds_desc"),
            infoImgCls: "myds-center",
            htmlEncode: false,
            value: _T("welcome", "myds_register") + ' (<span class="desc-link">' + _T("welcome", "welcome_myds") + "</span>)",
            listeners: {
                afterrender: this.bindDescClickEvt,
                scope: this
            }
        }, this.email_field, this.loginAccount_field, this.psw_field, this.cfmPsw_field, this.forgetPW_field, {
            ctCls: "welcome-top-padding-field",
            indent: 1,
            xtype: "syno_displayfield",
            itemId: "quickconnect-setup",
            hideLabel: true,
            infoTitle: _T("welcome", "welcome_quickcnt"),
            infoDesc: _T("welcome", "welcome_quickcnt_desc"),
            infoImgCls: "quick-connect",
            htmlEncode: false,
            value: _T("welcome", "quickconnect_setup") + ' (<span class="desc-link">' + _T("welcome", "welcome_quickcnt") + "</span>)",
            listeners: {
                afterrender: this.bindDescClickEvt,
                scope: this
            }
        }, this.quickCon_field, this.fake_exist_radio];
        return b
    },
    bindDescClickEvt: function(a) {
        a.el.child(".desc-link").on("click", function() {
            this.owner.hideItems();
            var b = new SYNO.SDS.App.WelcomeApp.QuickConnectDescPanel({
                title: a.infoTitle,
                desc: a.infoDesc,
                imgCls: a.infoImgCls,
                renderTo: this.container.id,
                appWin: this.owner.appWin
            });
            b.show();
            this.owner.mon(b, "destroy", this.owner.showItems, this.owner)
        }, this)
    },
    getWebAPIParams: function(d) {
        var a = {
                encryption: ["password", "myds_password"],
                compound: {
                    stopwhenerror: true
                }
            },
            b = [],
            c = this.getForm().getValues().register;
        if (this.type === "is_login_ok") {} else {
            if (c == "register") {
                b.push(this.createRegisterApi());
                b.push(this.createLoginApi())
            } else {
                if (c == "exist") {
                    b.push(this.createLoginApi())
                }
            }
        }
        b.push(this.createSetServerAliasApi());
        b.push(this.createSetApi());
        Ext.apply(a.compound, {
            params: b
        });
        return a
    },
    fieldsValid: function() {
        var c = this.email_field.isValid();
        var b = this.psw_field.isValid();
        var a = this.quickCon_field.isValid();
        var e = this.getForm().getValues().register;
        if (this.type === "is_login_ok") {
            return a
        } else {
            if (e == "register") {
                var d = this.cfmPsw_field.isValid();
                return (c && b && a && d)
            } else {
                if (e == "exist") {
                    return (c && a)
                } else {
                    return true
                }
            }
        }
    },
    createLoginApi: function() {
        var b = {
                account: this.email_field.getValue(),
                password: this.psw_field.getValue()
            },
            a = this.createApi("SYNO.Core.MyDSCenter", "login", 2, b);
        return a
    },
    createRegisterApi: function() {
        var a = _S("hostname");
        if (!a) {
            a = "INTEGRA User"
        }
        var c = {
            account: this.email_field.getValue(),
            password: this.psw_field.getValue(),
            fullname: a,
            critical_release: false
        };
        var b = this.createApi("SYNO.Core.MyDSCenter", "register", 2, c);
        return b
    },
    createSetServerAliasApi: function(a) {
        var c = {
            myds_account: this.email_field.getValue(),
            server_alias: this.quickCon_field.getValue(),
            enabled: true,
            force: this.setAliasAgain
        };
        var b = this.createApi("SYNO.Core.QuickConnect", "set_server_alias", 2, c);
        return b
    },
    createSetApi: function() {
        var b = {
            enabled: true
        };
        var a = this.createApi("SYNO.Core.QuickConnect", "set", 2, b);
        return a
    },
    createApi: function(d, e, a, c) {
        var b = {};
        b.api = d;
        b.method = e;
        b.version = a;
        b.params = {};
        Ext.apply(b.params, c);
        return b
    },
    slideOutCmp: function(a) {
        a.itemCt.slideOut("t", {
            easing: "easeOut",
            duration: 0.3,
            useDisplay: true
        })
    },
    slideInCmp: function(a) {
        a.itemCt.slideIn("t", {
            easing: "easeOut",
            duration: 0.3,
            useDisplay: true
        })
    },
    showRegisterFields: function() {
        this.slideInCmp(this.email_field);
        this.slideInCmp(this.psw_field);
        this.slideInCmp(this.cfmPsw_field);
        this.slideInCmp(this.quickCon_field);
        this.slideInCmp(this.getComponent("quickconnect-setup"));
        this.slideInCmp(this.getComponent("myds-setup"))
    },
    showUseExistAccFields: function() {
        this.slideInCmp(this.email_field);
        this.slideInCmp(this.psw_field);
        this.slideInCmp(this.quickCon_field);
        this.slideInCmp(this.forgetPW_field);
        this.slideInCmp(this.getComponent("quickconnect-setup"));
        this.slideInCmp(this.getComponent("myds-setup"))
    },
    hideFields: function(a) {
        if (a) {
            this.email_field.hide();
            this.psw_field.hide();
            this.cfmPsw_field.hide();
            this.quickCon_field.hide();
            return
        }
        this.slideOutCmp(this.email_field);
        this.slideOutCmp(this.psw_field);
        this.slideOutCmp(this.cfmPsw_field);
        this.slideOutCmp(this.quickCon_field);
        this.slideOutCmp(this.forgetPW_field);
        this.slideOutCmp(this.getComponent("quickconnect-setup"));
        this.slideOutCmp(this.getComponent("myds-setup"))
    },
    updateFormValue: function(a) {
        if (!Ext.isEmpty(a)) {
            this.getForm().setValues(a)
        }
    }
});
Ext.namespace("SYNO.SDS.App.WelcomeApp");
Ext.define("SYNO.SDS.App.WelcomeApp.Instance", {
    extend: "SYNO.SDS.AppInstance",
    appWindowName: "SYNO.SDS.App.WelcomeApp.Main",
    fullsize: true,
    isAccountShow: function() {
        return SYNO.SDS.Session.admin_configured === false
    },
    isWelcomeHidden: function() {
        var a = (SYNO.SDS.isNVR) ? "nvr" : "support_tutorial";
        if (this.welcome_hide === undefined) {
            this.welcome_hide = _S("welcome_hide") || !(_S("is_admin") && (SYNO.SDS.Session.vol_path && _D(a) === "yes")) || (_S("demo_mode") === true)
        }
        return this.welcome_hide
    },
    isUpdateSettingNeeded: function() {
        if (this.update_setting_needed === undefined) {
            this.update_setting_needed = _S("is_admin") && !_S("update_setting_configured")
        }
        return this.update_setting_needed
    },
    isMigrationWizardHidden: function() {
        var b = 0;
        if (_S("myds_unified")) {
            return true
        }
        for (var a in _S("found_myds_account")) {
            if (true === _S("found_myds_account").hasOwnProperty(a)) {
                b++
            }
        }
        return 1 >= b
    },
    shouldLaunch: function() {
        var b = this.isAccountShow();
        var a = this.isWelcomeHidden();
        var c = this.isUpdateSettingNeeded();
        var d = this.isMigrationWizardHidden();
        return b || !a || c || !d
    },
    onDestroy: function() {
        SYNO.SDS.App.WelcomeApp.Instance.superclass.onDestroy.apply(this, arguments)
    }
});
Ext.define("SYNO.SDS.App.WelcomeApp.Main", {
    extend: "SYNO.SDS.AppWindow",
    dsmStyle: "v5",
    adminConfigured: true,
    curVol: null,
    constructor: function(a) {
        this.stepIdArr = [];
        this.steps = [];
        var b = this.fillConfig(a);
        SYNO.SDS.App.WelcomeApp.Main.superclass.constructor.call(this, b);
        this.center();
        this.bindInstallPanelEvents()
    },
    getStepIdx: function(a) {
        return this.stepIdArr.indexOf(a)
    },
    getStep: function(a) {
        return this.getComponent(a)
    },
    insertSingleStep: function(a, b) {
        var c = b.getItemId() || b.getId();
        this.stepIdArr.splice(a, 0, c);
        this.steps.splice(a, 0, b);
        this.insert(a, b)
    },
    addSteps: function(c) {
        var a = (this.getStepIdx("end") !== -1),
            b = (a) ? this.stepIdArr.length - 1 : this.stepIdArr.length;
        if (Ext.isArray(c)) {
            c.each(function(d) {
                this.insertSingleStep(b, d);
                b++
            }, this)
        } else {
            if (Ext.isObject(c)) {
                this.insertSingleStep(b, c)
            }
        }
    },
    insertStepAfter: function(b, c) {
        var d = this.stepIdArr.indexOf(c),
            a;
        if (d === -1) {
            return
        }
        a = Math.min(d + 1, this.stepIdArr.length);
        this.insertSteps(a, b)
    },
    insertStepBefore: function(b, c) {
        var d = this.stepIdArr.indexOf(c),
            a;
        if (d === -1) {
            return
        }
        a = Math.max(0, d - 1);
        this.insertSteps(a, b)
    },
    insertSteps: function(a, b) {
        if (Ext.isArray(b)) {
            b.each(function(c) {
                this.insertSingleStep(a, c);
                a++
            }, this)
        } else {
            if (Ext.isObject(b)) {
                this.insertSingleStep(a, b)
            }
        }
    },
    removeSteps: function(b) {
        var a = this,
            c = function(e) {
                var g = e.getItemId() || e.getId(),
                    d = a.stepIdArr.indexOf(g),
                    f = a.getComponent(g);
                if (d !== -1) {
                    a.stepIdArr.splice(d, 1);
                    a.steps.splice(d, 1)
                }
                if (f) {
                    a.remove(f, true)
                }
            };
        if (Ext.isArray(b)) {
            b.each(function(d) {
                c(d)
            })
        } else {
            if (Ext.isObject(b)) {
                c(b)
            }
        }
    },
    canReload: function() {
        return this.isDoingAuth || _S("admin_configured")
    },
    addStepsBeforeRender: function(a) {
        if (Ext.isObject(a)) {
            var b = a.getItemId() || a.getId();
            this.stepIdArr.push(b);
            this.steps.push(a)
        } else {
            if (Ext.isArray(a)) {
                a.each(function(c) {
                    this.addStepsBeforeRender(c)
                }, this)
            }
        }
    },
    configureSteps: function(b) {
        var c = [],
            e = b.appInstance.isAccountShow(),
            d = b.appInstance.isWelcomeHidden(),
            a = b.appInstance.isUpdateSettingNeeded(),
            f = b.appInstance.isMigrationWizardHidden();
        if (e) {
            this.adminConfigured = _S("admin_configured");
            this.registerPanel = new SYNO.SDS.App.WelcomeApp.RegiterAccountPanel({
                owner: this,
                appWin: this,
                itemId: "register"
            });
            c.push(this.registerPanel)
        } else {
            if (!_S("welcome_hide")) {
                this.welcomePanel = new SYNO.SDS.App.WelcomeApp.WelcomePanel({
                    owner: this,
                    appWin: this,
                    itemId: "welcome"
                });
                c.push(this.welcomePanel)
            }
            if (a) {
                this.updateSettingPanel = new SYNO.SDS.App.WelcomeApp.UpdateSettingPanel({
                    owner: this,
                    appWin: this,
                    gotoFinish: false,
                    itemId: "updateSetting"
                });
                c.push(this.updateSettingPanel)
            }
            if (!d) {
                if (f && this.haveToRegisterQuickConnect()) {
                    this.registerQCTPanel = new SYNO.SDS.App.WelcomeApp.RegisterQuickConnectStep({
                        appWin: this,
                        owner: this,
                        itemId: "register-quickconnect"
                    });
                    c.push(this.registerQCTPanel)
                }
                if (Ext.isDefined(_S("vol_path"))) {
                    this.curVol = {
                        path: _S("vol_path")
                    };
                    if (this.haveToInstallPkg()) {
                        this.installPanel = new SYNO.SDS.App.WelcomeApp.InstallPanel({
                            owner: this,
                            appWin: this,
                            itemId: "install"
                        });
                        c.push(this.installPanel)
                    }
                    if (this.haveToInstallSur()) {
                        this.installPanel = new SYNO.SDS.App.WelcomeApp.InstallSurPanel({
                            owner: this,
                            appWin: this,
                            itemId: "install"
                        });
                        c.push(this.installPanel)
                    } else {
                        if (SYNO.SDS.isNVR) {
                            this.setInstallSurFailed(true)
                        }
                    }
                }
            }
            if (!d || a) {
                this.endPanel = new SYNO.SDS.App.WelcomeApp.EndPanel({
                    owner: this,
                    appWin: this,
                    itemId: "end"
                });
                c.push(this.endPanel)
            }
        }
        this.addStepsBeforeRender(c)
    },
    fillConfig: function(a) {
        this.configureSteps(a);
        var b = {
            title: _T("welcome", "welcome_app_title"),
            cls: "syno-sds-welcome welcome-default-bg",
            border: false,
            toggleMinimizable: false,
            maximized: true,
            resizable: false,
            header: false,
            showHelp: false,
            layout: "card",
            activeItem: this.stepIdArr[0],
            renderTo: document.body,
            items: this.steps
        };
        Ext.apply(b, a);
        return b
    },
    haveToCheckShr: function() {
        return (!Ext.isObject(this.curVol) && _D("support_autocreate_shr") === "yes")
    },
    haveToInstallPkg: function() {
        return (Ext.isObject(this.curVol) && _D("support_tutorial") === "yes" && !SYNO.SDS.isNVR)
    },
    haveToInstallSur: function() {
        return (Ext.isObject(this.curVol) && SYNO.SDS.isNVR)
    },
    haveToRegisterQuickConnect: function() {
        var c = SYNO.SDS.isNVR,
            b = (Ext.isFunction(SYNO.SDS.Utils.isInVirtualDSM)) ? SYNO.SDS.Utils.isInVirtualDSM() : false,
            a = _D("dockerdsm") === "yes";
        return !c && !b && !a
    },
    haveToSetUpdateSetting: function() {
        return (true !== SYNO.SDS.Session.update_setting_configured)
    },
    showHtml: function(a) {
        this.htmlPanel.loadHelp(a)
    },
    bindInstallPanelEvents: function() {
        if (this.haveToInstallSur() && this.installPanel) {
            this.mon(this, "beforeclose", this.checkClosable, this);
            this.mon(this.installPanel, "installfailed", this.setInstallSurFailed.createDelegate(this, [true]));
            this.mon(this.installPanel, "installSuccessed", this.setInstallSurFailed.createDelegate(this, [false]))
        }
    },
    getCurrentStepIdx: function() {
        var c = this.getLayout().activeItem,
            a = c.getItemId() || c.getId(),
            b = this.getStepIdx(a);
        return b
    },
    getNextStep: function() {
        if (this.getCurrentStepIdx() < this.stepIdArr.length - 1) {
            var a = this.stepIdArr[this.getCurrentStepIdx() + 1];
            return this.getComponent(a)
        }
        return null
    },
    gotoPreviousStep: function() {
        var a = this.getCurrentStepIdx();
        if (0 < this.getCurrentStepIdx()) {
            this.setActiveItem(this.stepIdArr[a - 1])
        }
    },
    gotoNextStep: function() {
        var a = this.getCurrentStepIdx();
        if (a < this.stepIdArr.length - 1) {
            this.setActiveItem(this.stepIdArr[a + 1])
        } else {
            this.close()
        }
    },
    setInstallSurFailed: function(a) {
        this.installSurFailed = a;
        if (a === false) {
            this.addSurveillacneIcon()
        }
    },
    addSurveillacneIcon: function() {
        var a = SYNO.SDS.Desktop.iconItems,
            c = "SYNO.SDS.SurveillanceStation",
            b, d = false;
        if (a) {
            for (b = 0; b < a.length && d !== true; b++) {
                if (a[b].className === c) {
                    d = true
                }
            }
        }
        if (!d) {
            if (SYNO.SDS.AppUtil.isApp(c) && SYNO.SDS.StatusNotifier.isAppEnabled(c)) {
                SYNO.SDS.Desktop.addLaunchItem({
                    className: c
                }, -1);
                this.canClose = true;
                if (this.needClose === true) {
                    this.close()
                }
                return
            }
            this.mon(SYNO.SDS.StatusNotifier, "jsconfigLoaded", this.addSurveillacneIcon, this);
            this.canClose = false
        }
    },
    setActiveItem: function(a) {
        this.getLayout().setActiveItem(a)
    },
    onOpen: function() {
        SYNO.SDS.App.WelcomeApp.Main.superclass.onOpen.apply(this, arguments)
    },
    checkClosable: function() {
        if (this.canClose === false) {
            this.needClose = true;
            return false
        }
        return true
    },
    onClose: function() {
        this.sendNotify();
        this.callParent(arguments)
    },
    sendNotify: function() {
        if (this.installSurFailed === true) {
            SYNO.API.Request({
                api: "SYNO.Core.QuickStart.Install",
                method: "notify_sur_failed",
                version: 1,
                callback: Ext.emptyFn
            })
        }
    }
});