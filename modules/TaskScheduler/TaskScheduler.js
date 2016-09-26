/* Copyright (c) 2016 Synology Inc. All rights reserved. */

Ext.define("SYNO.SDS.TaskScheduler.TaskSchedulerWidget",{extend:"SYNO.SDS._Widget.GridPanel",autoExpandColumn:"name",usewebapi:true,constructor:function(a){this.callParent(arguments);this.appWin=Ext.getCmp(Ext.getBody().child(".syno-sds-widget").id)},getColumnModel:function(){if(this.cmTaskScheduler){return this.cmTaskScheduler}var a=new Ext.grid.ColumnModel({columns:[{width:38,id:"enable",dataIndex:"enable",renderer:this.iconRenderer.createDelegate(this)},{id:"name",dataIndex:"name",renderer:this.nameRenderer.createDelegate(this)},{id:"next_trigger_time",dataIndex:"next_trigger_time",width:150,renderer:this.timeRenderer.createDelegate(this)}]});this.cmTaskScheduler=a;return a},iconRenderer:function(c,a,b){return(c===true)?'<div class = "syno-taskscheduler-enable-taskicon"></div>':'<div class = "syno-taskscheduler-disable-taskicon"></div>'},nameRenderer:function(d,b,c){var a=Ext.util.Format.htmlEncode(d);b.attr+='ext:qtip="'+Ext.util.Format.htmlEncode(a)+'"';return a},timeRenderer:function(c,b){var a=Ext.util.Format.htmlEncode(c);b.attr+='ext:qtip="'+Ext.util.Format.htmlEncode(a)+'"';return a},getStore:function(){if(this.dsTaskScheduler){return this.dsTaskScheduler}var a=new SYNO.API.JsonStore({appWindow:this.appWin,api:"SYNO.Core.TaskScheduler",method:"list",version:1,root:"tasks",totalProperty:"total",fields:["enable","id","can_run","name","action","next_trigger_time","type"],remoteSort:true,sortInfo:{field:"next_trigger_time",direction:"ASC"},defaultParamNames:{sort:"sort_by",dir:"sort_direction"},baseParams:{start:0,limit:this.TotalRecords},autoDestroy:false,autoLoad:false,listeners:{scope:this,load:this.onStoreLoad}});this.dsTaskScheduler=a;this.addManagedComponent(a);return a},onStoreLoad:function(b,a){if(b.getCount()===0){this.getEl().mask(_T("widget","widget_schedule_no_task"))}else{this.getEl().unmask()}}});