/* Copyright (c) INTEGRA EMPRESAS 2016. All rights reserved. */

Ext.ns("SYNO.SDS.FileTaskMonitor.MailTaskTray");SYNO.SDS.FileTaskMonitor.MailTaskTray.TrayItem=Ext.extend(SYNO.SDS.FileTaskMonitor.BasicTrayItem,{animIcon:"sds-tray-item-ani-bgtask",staticIcon:"sds-tray-item-static-bgtask",initPanel:function(){var a=new SYNO.SDS.FileTaskMonitor.MailTaskTray.Panel({module:this,baseURL:this.jsConfig.jsBaseURL});return a},onClick:function(){if(0<this.panel.getStore().getCount()){SYNO.SDS.FileTaskMonitor.MailTaskTray.TrayItem.superclass.onClick.apply(this,arguments)}else{if(0<this.appInstance.getLocalGrid().getStore().getCount()){var a=SYNO.SDS.AppMgr.getByAppName("SYNO.SDS.App.FileTaskMonitor.Instance")[0].window;a.onOpen({});a.activeTabPanel("local")}}},showTray:function(){this.setAnimIcon();this.taskButton.show()},hideTray:function(){var a=this.panel.getStore(),b=this.appInstance.getLocalGrid().getStore();if(0>=a.getCount()&&0>=b.getCount()){this.taskButton.hide();this.panel.hide()}else{if(this.isTaskAllStop(a)&&this.isTaskAllStop(b)){this.setStaticIcon()}}},isTaskAllStop:function(a){var b=true;a.each(function(c){if(c.get("status")==="NOT_STARTED"||c.get("status")==="PROCESSING"){b=false;return false}},this);return b}});SYNO.SDS.FileTaskMonitor.MailTaskTray.Panel=Ext.extend(SYNO.SDS.FileTaskMonitor.MailMonitorGrid,{constructor:function(a){this.fileds=["id","title","progress","processed_num","processed_size","total","processing_path"];SYNO.SDS.FileTaskMonitor.MailMonitorGrid.superclass.constructor.call(this,Ext.apply({title:_T("mail","application_title"),hidden:true,header:true,hideHeaders:true,floating:true,width:320,height:300,cls:"sds-tray-panel sds-filemonitor-tray-panel",renderTo:document.body,shadow:false,autoHeight:true,autoExpandColumn:null,plugins:[new SYNO.CellActions({actionWidth:24,tpl:'<div class="ux-cell-value"><div class="ux-cell-actions"><tpl for="actions"><div class="ux-cell-action {cls}" qtip="{qtip}" style="{style}">&#160;</div></tpl></div></div>',listeners:{action:{scope:this,fn:this.onClickCancel}}})],store:new Ext.data.JsonStore({autoDestroy:true,idProperty:"id",fields:this.fileds}),colModel:this.initColumnModel(a.baseURL),sm:new Ext.grid.RowSelectionModel({singleSelect:true}),bbar:[{xtype:"syno_button",btnStyle:"blue",text:_T("background_task","background_task_all"),scope:this,handler:function(){var b=SYNO.SDS.AppMgr.getByAppName("SYNO.SDS.App.FileTaskMonitor.Instance")[0].window;b.onOpen({});b.activeTabPanel("mail");this.hide()}}],view:this.getView()},a))},getView:function(){if(!this.view){this.view=new Ext.grid.GridView(Ext.apply(this.viewConfig||{},{forceFit:false,borderWidth:0,initTemplates:function(){Ext.grid.GridView.prototype.initTemplates.apply(this,arguments);var a=['<tr class="x-grid3-row-body-tr" style="{bodyStyle}">','<td colspan="{cols}" class="x-grid3-body-cell" tabIndex="0" hidefocus="on">','<div class="x-grid3-row-body">{body}</div>',"</td>","</tr>"].join(""),b=['<table class="x-grid3-row-table" border="0" cellspacing="0" cellpadding="0" style="{tstyle}">',"<tbody>","<tr>{cells}</tr>",this.enableRowBody?a:"","</tbody>","</table>"].join("");this.templates.row=new Ext.Template('<div class="x-grid3-row {alt}" style="{tstyle}">'+b+"</div>");this.templates.row.disableFormats=true;this.templates.row.compile()},onLayout:function(){this.scrollOffset=0}}))}return this.view},initColumnModel:function(b){var c=new Ext.XTemplate('<div class="sds-filemonitor-tray-text"><span class="sds-filemonitor-tray-action-text">{actionname}:</span><span class="sds-filemonitor-tray-file-text">&nbsp;{name}</span></div>','<div class="sds-filemonitor-tray-row-text">{progressBar}</div>');var a=new Ext.grid.ColumnModel({defaults:{menuDisabled:true},columns:[{id:"status",align:"left",width:249,renderer:function(j,e,d,k,h,f){var g=Ext.util.Format.htmlEncode(d.data.title);e.attr='ext:qtip="'+Ext.util.Format.htmlEncode(g)+'"';var i=d.data.title;return c.apply({actionname:_T("mail","mail_subject"),name:i,progressBar:_T("background_task","task_processing")})}},{dataIndex:"id",align:"left",css:"vertical-align: bottom;",width:35,cellActions:[{iconCls:"sds-progress-cancel",qtip:_T("common","cancel")}]}]});return a},onAdd:function(a){SYNO.SDS.FileTaskMonitor.MailTaskTray.Panel.superclass.onAdd.apply(this,arguments);this.doFilterRecordCount();this.module.showTray()},onRemove:function(a){SYNO.SDS.FileTaskMonitor.MailTaskTray.Panel.superclass.onRemove.apply(this,arguments);this.doFilterRecordCount();this.module.hideTray()},doFilterRecordCount:function(){var c=0,a=this.getStore();function b(){return c--<=5}a.clearFilter();c=a.getCount();a.filterBy(b)}});