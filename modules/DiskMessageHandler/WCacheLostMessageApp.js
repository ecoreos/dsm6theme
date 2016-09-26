/* Copyright (c) 2016 Synology Inc. All rights reserved. */

Ext.namespace("SYNO.SDS.App.WCacheLostMessageApp");SYNO.SDS.App.WCacheLostMessageApp.Instance=Ext.extend(SYNO.SDS.AppInstance,{shouldNotifyMsg:function(a,b){this.win.show();return false},initInstance:function(a){if(!this.win){this.win=new SYNO.SDS.App.WCacheLostMessageApp.DataScrubbing({appInstance:this});this.addInstance(this.win);this.win.setTitle(_T("hddsleep","dcache_miss_notification"))}if(_S("shouldAskForWCacheLostDataScrubbing")===true){this.win.show()}},onOpen:function(a){this.initInstance(a)}});SYNO.SDS.App.WCacheLostMessageApp.DataScrubbing=Ext.extend(SYNO.SDS.AppWindow,{resetAskForDataScrubbing:function(){this.sendWebAPI({api:"SYNO.Storage.CGI.Check",method:"remove_ask_for_wcache_lost_data_scrubbing",version:1})},changeCheckBoxHandler:function(b,a){if(Ext.getCmp(this.dataScrubbingCheckboxID).getValue()===true){Ext.getCmp(this.confirmButtonID).enable();Ext.getCmp(this.ignoreButtonID).disable()}else{Ext.getCmp(this.confirmButtonID).disable();Ext.getCmp(this.ignoreButtonID).enable()}},sendHandler:function(a){this.setStatusBusy();this.sendWebAPI({api:"SYNO.Storage.CGI.Check",method:a,version:1,scope:this,callback:function(c,b){this.clearStatusBusy();if(!c){this.setStatusError()}}})},confirmHandler:function(){this.resetAskForDataScrubbing();this.sendHandler("do_data_scrubbing");this.hide()},ignoreHandler:function(){this.resetAskForDataScrubbing();this.sendHandler("ignore_data_scrubbing");this.hide()},constructor:function(b){this.owner=b.owner;this.module=b.module;this.panel=this.createPanel();this.form=this.panel.getForm();var a=Ext.apply({title:_T("volume","raid_force_notification"),width:560,height:400,minimizable:false,maximizable:false,showHelp:false,resizable:false,cls:"syno-diskremap",items:[this.panel],buttons:[{xtype:"syno_button",btnStyle:"blue",text:_T("common","ok"),id:this.confirmButtonID=Ext.id(),handler:this.confirmHandler,scope:this},{xtype:"syno_button",text:_T("common","alt_ignore"),id:this.ignoreButtonID=Ext.id(),handler:this.ignoreHandler,scope:this}]},b);SYNO.SDS.App.WCacheLostMessageApp.DataScrubbing.superclass.constructor.call(this,a);this.on("beforeclose",function(c){this.hide();return false});this.on("beforeshow",function(c){Ext.getCmp(this.dataScrubbingCheckboxID).setValue(false);Ext.getCmp(this.confirmButtonID).disable();Ext.getCmp(this.ignoreButtonID).enable();return true})},createPanel:function(){var a={border:false,items:[{xtype:"syno_displayfield",id:this.diskScanLabelID=Ext.id(),value:_T("hddsleep","dcache_data_scrubbing")},{xtype:"syno_displayfield",value:""},{xtype:"syno_displayfield",htmlEncode:false,value:_T("hddsleep","dcache_data_scrubbing_note")},{xtype:"syno_displayfield",value:""},{xtype:"syno_checkbox",id:this.dataScrubbingCheckboxID=Ext.id(),handler:this.changeCheckBoxHandler,boxLabel:_T("hddsleep","dcache_data_scrubbing_confirmed"),scope:this}]};return new Ext.form.FormPanel(a)}});