/* Copyright (c) INTEGRA EMPRESAS 2016. All rights reserved. */

Ext.ns("SYNO.SDS.Utils.FileSharing");Ext.define("SYNO.SDS.Utils.FileSharing",{statics:{showSharingManageWindow:function(){SYNO.SDS.AppLaunch("SYNO.SDS.App.FileStation3.Instance");SYNO.SDS.Utils.FileSharing.deferShowDialog()},deferShowDialog:function(a){Ext.defer(function(){var b=SYNO.SDS.AppMgr.getByAppName("SYNO.SDS.App.FileStation3.Instance");if(!b[b.size()-1]||!b[b.size()-1].window){SYNO.SDS.Utils.FileSharing.deferShowDialog();return}var d=b[b.size()-1].window;var c=new SYNO.FileStation.SharingManager.Manger({owner:d,webfm:d.panelObj,activeTab:1,RELURL:"webman/modules/FileBrowser/webfm/"});c.show()},500,this)}}});