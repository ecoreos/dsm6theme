/* Copyright (c) INTEGRA EMPRESAS 2016. All rights reserved. */

Ext.define("SYNO.SDS.DSMNotify.ShowAllDialog",{extend:"SYNO.SDS.AppWindow",itemsPerPage:50,constructor:function(a){this.callParent([this.fillConfig(a)]);this.on("show",function(){this.grid.getStore().load({params:{start:0,limit:this.itemsPerPage}})},this);this.mon(SYNO.SDS.StatusNotifier,"notificationPanelClearAll",function(){this.paging.changePage(1)},this)},fillConfig:function(a){var b={width:600,height:300,showHelp:false,minimizable:false,toggleMinimizable:false,pinable:false,layout:"fit",items:[this.getGridPanel()]};Ext.apply(b,a);return b},onClose:function(){this.hide();return false},getGridPanel:function(){var a=new SYNO.API.JsonStore({api:"SYNO.Core.DSMNotify",method:"notify",version:1,baseParams:{action:"load",all:true},appWindow:this,root:"items",totalProperty:"total",fields:["title","msg","time","className","fn"],sortInfo:{field:"time",direction:"DESC"},listeners:{scope:this,load:function(){if(!_S("demo_mode")){Ext.getCmp(this.clearAllBtnId).setDisabled(0===this.grid.getStore().getCount())}}}});this.paging=new SYNO.ux.PagingToolbar({store:a,displayInfo:true,pageSize:this.itemsPerPage,refreshText:_T("log","log_reload")});this.grid=new SYNO.ux.GridPanel({title:_T("dsmnotify","title"),loadMask:true,stripeRows:true,store:a,colModel:new Ext.grid.ColumnModel({defaults:{width:50,sortable:true},columns:[{header:_T("backup","application"),dataIndex:"title",renderer:this.titleRenderer},{width:120,header:_T("notification","notification_content"),dataIndex:"msg",id:"msg",renderer:this.msgRenderer},{header:_T("log","log_time"),dataIndex:"time",renderer:this.timeRenderer}]}),autoExpandColumn:"msg",sm:new Ext.grid.RowSelectionModel({singleSelect:true}),bbar:this.paging,tbar:new Ext.Toolbar({defaultType:"syno_button",items:[{text:_T("log","log_reload"),scope:this,handler:function(){this.paging.doRefresh()}},{text:_T("dsmnotify","clearall"),scope:this,handler:this.clearAll,id:this.clearAllBtnId=Ext.id(),disabled:_S("demo_mode"),tooltip:_S("demo_mode")?_JSLIBSTR("uicommon","error_demo"):""}]})});return this.grid},clearAll:function(){this.grid.getStore().removeAll();SYNO.API.Request({api:"SYNO.Core.DSMNotify",method:"notify",version:1,params:{action:"apply",clean:"all"},scope:this,callback:function(d,c,b,a){if(!d){return}this.paging.changePage(1);SYNO.SDS.StatusNotifier.fireEvent("checknotify")}});Ext.getCmp(this.clearAllBtnId).setDisabled(true)},timeRenderer:function(a){var b=(new Date(a*1000)).format("Y-m-d H:i:s");return'<div ext:qtip="'+b+'">'+b+"</div>"},msgRenderer:function(e,b,a){var d=SYNO.SDS.DSMNotify.Utils.getMsg(e,true,a.data.className,a.data.fn);var c=Ext.util.Format.htmlEncode(d);return String.format('<div class="{0}" ext:qtip="{1}">{2}</div>',SYNO.SDS.Utils.SelectableCLS,c,d)},titleRenderer:function(e,b,a){var d=SYNO.SDS.DSMNotify.Utils.getTitle(e,true,a.data.className,a.data.fn);var c=Ext.util.Format.htmlEncode(d);return String.format('<div class="{0}" ext:qtip="{1}">{2}</div>',SYNO.SDS.Utils.SelectableCLS,c,d)}});Ext.define("SYNO.SDS.DSMNotify.CustomEnableColumn",{extend:"SYNO.ux.EnableColumn",constructor:function(a){var b={width:180};this.callParent([Ext.apply(b,a)])},renderer:function(c,b,a){if("disabled"===a.get(this.dataIndex)){c="disabled"}return this.renderCheckBox(c,b,a)},isIgnore:function(b,a){if("disabled"===a.get(this.dataIndex)){return true}return false},renderCheckBox:function(g,d,a){var f=("disabled"===g?"disabled":("on"===g)?"checked":"unchecked"),c=(f==="disabled")?false:(f==="checked"),h=(a)?a.id+"_"+this.dataIndex:Ext.id(),e=(f==="disabled")?_T("common","disabled"):_JSLIBSTR("uicommon","enable_column_"+f),b=(f==="disabled");d=d||{};d.cellAttr=String.format('aria-label="{0} {1}" aria-checked="{2}" aria-disabled="{3}" role="checkbox"',Ext.util.Format.stripTags(this.orgHeader),e,c,b);return String.format('<div class="syno-ux-grid-enable-column-{0}" id="{1}"></div>',f,h)},toggleRec:function(b){var a=b.get(this.dataIndex);if("on"===a){a="off"}else{if("off"===a){a="on"}}b.set(this.dataIndex,a)},onSelectAll:function(){var d,b,e,c,a;if(!this.box_el||!this.box_el.dom){return}d=this.getGrid().getStore();a=!!(this.box_el.hasClass("syno-ux-cb-checked"))?"on":"off";if(this.enableFastSelectAll){d.suspendEvents()}for(b=0,c=d.getCount();b<c;b++){e=d.getAt(b).get(this.dataIndex);if(("gray"!==e&&e===a)||this.isIgnore("all",d.getAt(b))){continue}this.toggleRec(d.getAt(b))}if(this.enableFastSelectAll){this.getGrid().getView().refresh();d.resumeEvents()}if(this.commitChanges){d.commitChanges()}this.checkSelectAll(d)},checkSelectAll:function(f){var c,g,e=f.getCount(),h;var d=(e>0);var b=true;var a=false;if(!this.box_el||!this.box_el.dom){return}for(c=0;c<e;c++){if(this.isIgnore("check",f.getAt(c))){continue}b=false;g=f.getAt(c).get(this.dataIndex);if("gray"===g||g==="off"){d=false}else{a=true}}h=this.box_el.up("td");if(d&&!b){this.box_el.removeClass("syno-ux-cb-grayed");this.box_el.addClass("syno-ux-cb-checked");h.setARIA({checked:true})}else{if(!d&&!b&&a){this.box_el.removeClass("syno-ux-cb-checked");this.box_el.addClass("syno-ux-cb-grayed");h.setARIA({checked:"mixed"})}else{this.box_el.removeClass("syno-ux-cb-checked");this.box_el.removeClass("syno-ux-cb-grayed");h.setARIA({checked:false})}}}});Ext.define("SYNO.SDS.DSMNotify.Setting.GridPanel",{extend:"SYNO.ux.DDGridPanel",constructor:function(a){this.callParent([this.fillConfig(a)]);this.addEvents("loadHaveNtAppList")},fillConfig:function(a){this.createActions();this.ctxMenu=new SYNO.ux.Menu({items:[this.getAction("up"),this.getAction("down")]});var b={viewConfig:{ddGroup:"NtSettingGridDD",forceFit:false},cm:this.getCM(),sm:this.getSM(),cls:"sds-notify-setting-grid without-dirty-red-grid",plugins:[this.notificationEnableCloumn,this.badgeEnableColumn],store:this.getDS(a),enableDragDrop:true,enableColumnMove:false,region:"center",autoFlexScroll:true,autoExpandColumn:this.titleID,listeners:{viewready:this.onGridViewReady,rowclick:this.onGridRowClick,rowcontextmenu:this.onRowCtxMenu,columnresize:this.onColumnResize,containercontextmenu:this.showCtxMenu}};return Ext.apply(b,a)},getDS:function(a){var c=a.owner.findAppWindow();var b=new SYNO.API.JsonStore({api:"SYNO.Core.DSMNotify",method:"notify",version:1,appWindow:c,baseParams:{action:"loadHaveNtAppList"},root:"items",totalProperty:"total",fields:["title","nt","badge","jsID"],pruneModifiedRecords:true,listeners:{scope:this,beforeload:function(){if(!this.owner.el.isMasked){this.owner.setStatusBusy(null,null,0)}},load:function(d,g,f){this.isPriorityDirty=false;this.fireEvent("loadHaveNtAppList",{data:d.reader.jsonData});this.owner.clearStatusBusy();d.suspendEvents();for(var e=0;e<g.length;e++){if(!SYNO.SDS.DSMNotify.Utils.isAppEnabled(g[e].get("jsID"))){d.remove(g[e])}}d.resumeEvents();this.view.refresh()},exception:function(){this.owner.clearStatusBusy();this.owner.getMsgBox().alert("","Fail to get the priority application list",this.owner.onHandleHide,this.owner)}}});return b},getCM:function(){this.notificationEnableCloumn=new SYNO.SDS.DSMNotify.CustomEnableColumn({header:_T("dsmnotify","title"),align:"center",dataIndex:"nt",menuDisabled:true,sortable:false});this.badgeEnableColumn=new SYNO.SDS.DSMNotify.CustomEnableColumn({header:_T("dsmnotify","badge"),dataIndex:"badge",hidden:true,menuDisabled:true,sortable:false});var a=new Ext.grid.ColumnModel([{header:_T("dsmnotify","service"),id:this.titleID=Ext.id(),dataIndex:"title",editable:false,sortable:false,menuDisabled:true,renderer:this.titleRenderer},this.notificationEnableCloumn,this.badgeEnableColumn]);return a},getSM:function(){return new Ext.grid.RowSelectionModel()},getTopTbar:function(){var a=new Ext.Toolbar({defaultType:"syno_button",items:[this.getAction("up"),this.getAction("down")]});return a},actions:null,createActions:function(){var a=function(f,e,d,c,b){return new Ext.Action(Ext.apply({text:f,itemId:e,handler:d,scope:c},b))};this.actions={up:a(_T("common","up"),"up",this.onClickUP,this),down:a(_T("common","down"),"down",this.onClickDown,this)}},getAction:function(a){var b=this.actions[a];return b},onGridRowClick:function(a,c,b){if(b&&c&&!b.hasModifier()){a.getSelectionModel().selectRow(c)}},onGridViewReady:function(){this.view.updateScroller()},onRowCtxMenu:function(b,c,a){a.preventDefault();var d=b.getSelectionModel();if(!d.isSelected(c)){d.selectRow(c)}this.showCtxMenu(b,a)},showCtxMenu:function(b,a){if(this.owner.isTime){return}this.ctxMenu.showAt(a.getXY())},sortSelectionComparator:function(d,c){var e=this.getStore();return e.indexOf(d)>e.indexOf(c)},moveSelectedRow:function(f){var c=this.getStore(),h=this.getSelectionModel(),e=h.getSelections(),a=c.getCount(),b=-1,d,g;if(Ext.isEmpty(e)){return}e.sort(function(j,i){return c.indexOf(j)>c.indexOf(i)});if(f){b=c.indexOf(e.first())-1;if(b<=0){b=0}}else{b=c.indexOf(e.last())+1;if(b>=(a-1)){b=a-1}}c.suspendEvents();for(d=0;d<e.length;d++){c.remove(e[d]);if(0===d){g=b}else{g=this.store.indexOf(e[d-1])+1}c.insert(g,e[d]);this.isPriorityDirty=true}c.resumeEvents();this.view.refresh();this.view.focusEl.focus()},onColumnResize:function(){this.getView().fitColumns()},onClickUP:function(){this.moveSelectedRow(true)},onClickDown:function(){this.moveSelectedRow(false)},titleRenderer:function(e,b,a){var d=SYNO.SDS.DSMNotify.Utils.getTitle(e,true,a.data.jsID,a.data.fn);var c=Ext.util.Format.htmlEncode(d);return String.format('<div ext:qtip="{0}">{1}</div>',c,d)},getApplyData:function(){var b=[];var a=this.getStore();a.each(function(c){var d=c.data;if(Ext.isString(d.jsID)){b.push(d)}},this);return b},isDataDirty:function(){var a=this.getStore().getModifiedRecords();return this.isPriorityDirty||(a.length!==0)}});Ext.define("SYNO.SDS.DSMNotify.Setting.Application",{extend:"SYNO.SDS.AppInstance",appWindowName:"SYNO.SDS.DSMNotify.Setting.Window",constructor:function(a){this.callParent(arguments)}});Ext.define("SYNO.SDS.DSMNotify.Setting.Window",{extend:"SYNO.SDS.AppWindow",NtSortByName:"sortBy",constructor:function(a){this.callParent([this.fillConfig(a)]);this.mon(this.grid,"loadHaveNtAppList",function(b){this.northPanel.getForm().setValues(b.data);this.onCheckTimeManual(b.data.sortBy==="time")},this);this.mon(this,"show",function(){this.grid.getStore().load()},this);this.mon(this,"beforeshow",function(){if(!this.el.isMasked()){this.setStatusBusy(null,null,0)}},this)},fillConfig:function(a){this.northPanel=new SYNO.ux.FormPanel({height:108,region:"north",margins:"0 20",trackResetOnLoad:true,items:[{xtype:"syno_displayfield",value:_T("dsmnotify","brief_desc"),height:63,hideLabel:true},{xtype:"syno_radiogroup",fieldLabel:_T("dsmnotify","sort_by"),hideLabel:false,columns:[150,150],items:[{name:this.NtSortByName,boxLabel:_T("dsmnotify","time"),inputValue:"time",checked:true,listeners:{check:function(c,d,f){this.onCheckTimeManual(d)},scope:this}},{xtype:"syno_radio",name:this.NtSortByName,boxLabel:_T("time","time_manual"),inputValue:"manual"}]}]});this.southPanel=new SYNO.ux.FormPanel({height:35,region:"south",margins:"0 20",hideMode:"visibility",items:[{xtype:"syno_displayfield",value:'<span class="syno-ux-note">'+_T("dsmnotify","hint")+_T("common","colon")+" </span>"+_T("dsmnotify","dd_desc"),htmlEncode:false,hideLabel:true}]});var b={width:625,height:580,minimizable:false,maximizable:false,toggleMinimizable:false,pinable:false,minWidth:595,cls:"sds-notify-setting-dialog",closeAction:"onHandleHide",fbar:this.getFbar(),layout:"border",items:[this.northPanel,this.getGridPanel({region:"center",flex:1,margins:"0 20",owner:this}),this.southPanel]};Ext.apply(b,a);return b},onCheckTimeManual:function(a){this.isTime=true;if(a){this.grid.disableDD();this.southPanel.hide()}else{this.grid.enableDD();this.southPanel.show();this.isTime=false;this.doLayout()}},getFbar:function(){var a=new Ext.ux.StatusBar({defaultType:"syno_button",cls:"x-statusbar",items:[{xtype:"syno_button",btnStyle:"blue",text:_T("common","ok"),handler:this.onClickOK,scope:this},{xtype:"syno_button",text:_T("common","cancel"),handler:this.onHandleHide,scope:this}]});return a},getGridPanel:function(a){this.grid=new SYNO.SDS.DSMNotify.Setting.GridPanel(a);return this.grid},onClickOK:function(){var b=this.grid.getApplyData();var c=this.northPanel.getForm().findField(this.NtSortByName).getGroupValue();var a={scope:this,callback:function(){this.clearStatusBusy();this.grid.getStore().commitChanges()}};if(this.isDataDirty()){this.setStatusBusy();this.appInstance.setUserSettings("haveNtAppList",b);this.appInstance.setUserSettings("haveNtAppSortBy",c);SYNO.SDS.UserSettings.syncSave(a);SYNO.SDS.StatusNotifier.fireEvent("modifyHaveNtAppList")}this.hide()},isDataDirty:function(){return this.grid.isDataDirty()||this.northPanel.getForm().isDirty()},onHandleHide:function(){if(this.isDataDirty()){this.getMsgBox().confirm(_T("tree","leaf_notification"),_T("common","confirm_lostchange"),function(a){if("yes"===a){this.hide()}},this)}else{this.hide()}}});Ext.define("SYNO.SDS.DSMNotify.Utils",{statics:{isAppEnabled:function(a){return Ext.isEmpty(a)||(SYNO.SDS.StatusNotifier.isAppEnabled(a)===true)},getTitle:function(d,a,c,b){if(this.isAppEnabled(c)!==true){return _T("dsmnotify","error_title")}return this.localizeMsgByFn(b,a,c)||this.localizeMsg(d,a,c)},getMsg:function(d,a,c,b){if(this.isAppEnabled(c)!==true){return _T("dsmnotify","error_msg")}return this.localizeMsgByFn(b,a,c)||this.localizeMsg(d,a,c)},localizeMsgByFn:function(g,b,d){var e=[],f,c;if(!Ext.isArray(g)){g=[g]}for(var a=1;a<g.length;a++){e.push(SYNO.SDS.Utils.GetLocalizedString(g[a]+"",d))}c=Ext.isString(g[0])?Ext.getClassByName(g[0]):"";if(!Ext.isEmpty(c)){f=c.apply(window,e)}if(b){return Ext.util.Format.stripTags(f)}else{return f}},localizeMsg:function(f,b,c){var d=[],e;if(!Ext.isArray(f)){f=[f]}for(var a=0;a<f.length;a++){d.push(SYNO.SDS.Utils.GetLocalizedString(f[a],c))}e=String.format.apply(String,d);if(b){return Ext.util.Format.stripTags(e)}else{return e}}}});Ext.define("SYNO.SDS.DSMNotify.Application",{extend:"SYNO.SDS.AppInstance",trayItem:[],initInstance:function(a){if(!this.trayItem[0]){this.trayItem[0]=new SYNO.SDS.DSMNotify.Tray({appInstance:this});this.addInstance(this.trayItem);this.trayItem[0].open(a)}this.createShowAllWindow();Ext.getCmp("sds-taskbar").doLayout()},createShowAllWindow:function(){if(!this.showAllWindow){this.showAllWindow=new SYNO.SDS.DSMNotify.ShowAllDialog({appInstance:this});this.addInstance(this.showAllWindow)}},onRequest:function(a){if("showPanel"==a.action){this.trayItem[0].onClick()}}});Ext.define("SYNO.SDS.DSMNotify.Tray",{extend:"SYNO.SDS.AppTrayItem",panel:null,taskbarBtnId:"sds-taskbar-notification-button",constructor:function(a){SYNO.SDS.DSMNotify.Tray.superclass.constructor.apply(this,arguments);this.panel=new SYNO.SDS.DSMNotify.Panel({module:this,baseURL:this.jsConfig.jsBaseURL});this.addManagedComponent(this.panel);this.mon(Ext.getDoc(),"mousedown",this.onMouseDown,this);this.mon(SYNO.SDS.StatusNotifier,"checknotify",this.panel.reload,this.panel);this.mon(SYNO.SDS.StatusNotifier,"systemTrayNotifyMsg",this.panel.hide.createDelegate(this.panel,[true],false),this.panel);Ext.EventManager.onWindowResize(this.adjustPos,this);SYNO.SDS.TaskBar.rightTaskBar.buttons.push(this.taskButton);this.taskButton.disable()},onMouseDown:function(a){if(a.within(this.taskButton.el)){return}if(this.panel.isVisible()&&!a.within(this.panel.el)){this.panel.hideBox()}},setTitle:function(a){this.taskButton.setTooltip(a);this.taskButton.btnEl.setARIA({label:a,role:"button",tabindex:-1})},onBeforeDestroy:function(){this.panel=null;SYNO.SDS.DSMNotify.Tray.superclass.onBeforeDestroy.apply(this,arguments)},adjustPos:function(){if(this.panel.isVisible()){this.panel.el.alignTo(Ext.getBody(),"tr-tr",[0,SYNO.SDS.TaskBar.getHeight()])}},onClick:function(){if(this.taskButton.disabled){return}if(this.panel.isVisible()){this.panel.hideBox();SYNO.SDS.TaskBar.rightTaskBar.toolbarEl.focus()}else{SYNO.SDS.StatusNotifier.fireEvent("taskBarPanelShow");this.panel.show();this.panel.el.alignTo(Ext.getBody(),"tr-tr",[0,SYNO.SDS.TaskBar.getHeight()]);this.panel.dataview.getAriaEl().focus(300)}},getTaskBarBtnId:function(){return this.taskbarBtnId}});Ext.define("SYNO.SDS.DSMNotify.Panel",{statics:{OneWeekSeconds:7*24*60*60},extend:"Ext.Panel",storeId:"NotificationCenterTray",maxUnreadNum:30,currentUnreadNum:0,lastSeen:0,lastRead:0,pollTask:null,pollTaskConfig:null,pollingInterval:30*1000,reloadTask:null,reloadDelay:1000,badgeNumberId:Ext.id(),currentData:null,isFirstDataGetted:false,badge:null,constructor:function(a){SYNO.SDS.DSMNotify.Panel.superclass.constructor.call(this,Ext.apply({hidden:true,floating:true,shadow:false,title:this.getTitleStr(),height:Ext.lib.Dom.getViewHeight()-SYNO.SDS.TaskBar.getHeight(),cls:"sds-notify-tray-panel",renderTo:"sds-desktop",layout:"fit",bbar:[{xtype:"syno_button",btnStyle:"blue",text:_T("common","show_all"),scope:this,handler:this.onClickShowAll,id:this.showAllBtnId=Ext.id()},{xtype:"tbfill"},{xtype:"syno_button",btnStyle:"grey",text:_T("dsmnotify","clearall"),scope:this,handler:this.onClickClear,disabled:_S("demo_mode"),tooltip:_S("demo_mode")?_JSLIBSTR("uicommon","error_demo"):""}],items:this.dataview=new SYNO.ux.FleXcroll.DataView({itemSelector:"div.item",setEmptyText:function(){var b=Ext.getCmp("sds-notify-tray-panel-dataview");var c=Ext.id();b.getAriaEl().setARIA({describedby:c});return String.format('<div class="sds-notify-empty-text" id="{2}" aria-label="{1}" style="line-height:{0}px">{1}</div>',Ext.lib.Dom.getViewHeight()-SYNO.SDS.TaskBar.getHeight()-36-48,_T("dsmnotify","empty_text"),c)},emptyText:this.setEmptyText,"aria-label":_T("dsmnotify","title"),itemId:"dataview",singleSelect:true,useARIA:true,useDefaultKeyNav:false,id:"sds-notify-tray-panel-dataview",cls:"sds-notify-tray-panel-dataview",refresh:function(){this.emptyText=this.setEmptyText();SYNO.ux.FleXcroll.DataView.superclass.refresh.call(this)},store:new Ext.data.JsonStore({autoDestroy:true,storeId:this.storeId,fields:["title","contents","read","className","fn","bindEvt"]}),tpl:new Ext.XTemplate('<div class="sds-notify-tray-panel-dataview-wrapper">','<tpl for=".">','<div class="item" aria-label="{[this.getAriaSummary(values)]}" id="{[Ext.id()]}">','<tpl if="read == false"> <div class="unreaditem"><span class="badge" style="{[this.showUnreadBadgeNumber(values.contents, values.read)]}"></span></tpl>','<tpl if="read == true"> <div class="readitem"> </tpl>','<div class="title blue-status" ext:qtip="{[this.localizeTitleNoTags(values.title, true, values.className)]}">','<tpl if="className">','<a tabindex="-1" data-syno-app="{values.className}" data-syno-bind="{values.bindEvt}" class="{[this.getClassName(values.bindEvt)]}">',"</tpl>","{[this.showUnreadTagLeft(values.read)]}{[this.getMsgTitle(values)]}{[this.showUnreadTagRight(values.read)]}","</a>","</div>",'<tpl for="contents">','<div class="msg {this.selectableCls}" ext:qtip="{[this.localizeNoTags(values.msg, true, values.className, values.fn)]}">{[this.getMsg(values)]}</div>','<div class="time" ext:qtip="{[this.getMsgDate(values, true)]}">{[this.getMsgDate(values, false)]}</div>','<div style="clear:both;"></div>',"</tpl>",'<div class="sds-notify-tray-panel-split"></div>',"</div>","</div>","</tpl>","</div>",{compiled:true,disableFormats:true,getClassName:function(b){if(false===b||!Ext.isBoolean(b)){return"cursor-no-pointer"}return""},getMsgTitle:function(b){return this.localizeTitleNoTags(b.title,true,b.className)},getMsg:function(b){if(true===b.isEncoded){return this.localizeNoTags(b.msg,false,b.className,b.fn)}return this.localize(b.msg,false,b.className,b.fn)},getMsgDate:function(c,h){var f=false,g=c.time,b,e;b=this.getCurrentTime()-g;e=b<0?true:false;f=b>SYNO.SDS.DSMNotify.Panel.OneWeekSeconds;if(f||h||e){var d=(new Date(c.time*1000)).format("Y-m-d H:i:s");return d}else{return Ext.util.Format.relativeTime(g*1000)}},getAriaSummary:function(b){b=b.contents[0];var f=this.getMsgTitle(b);var e=this.getMsg(b);var d=this.getMsgDate(b,false);var c=String.format("{0} {1} {2}",f,e,d);c=Ext.util.Format.stripTags(c);c=Ext.util.Format.htmlEncode(c);return c},localizeTitle:this.getTitle.createDelegate(this,[false],true),localizeTitleNoTags:this.encodedTitle.createDelegate(this,[true],true),localize:this.getMsg.createDelegate(this,[false],true),localizeNoTags:this.encodedMsg.createDelegate(this,[true],true),showUnreadTagLeft:this.showUnreadTag.createDelegate(this,[true],true),showUnreadTagRight:this.showUnreadTag.createDelegate(this,[false],true),showUnreadBadgeNumber:this.showUnreadBadgeNumber.createDelegate(this,[false],true),selectableCls:SYNO.SDS.Utils.SelectableCLS,getCurrentTime:this.getCurrentTime.createDelegate(this,[false],true)}),listeners:{click:function(c,b,d,f){SYNO.SDS.Utils.Notify.BindEvent(f)},scope:this}})},a));Ext.StoreMgr.get(this.storeId).removeAll();this.lastRead=SYNO.SDS.UserSettings.getProperty(this.module.jsConfig.jsID,"lastRead")||0;this.lastSeen=this.lastRead;this.pollTaskConfig={interval:this.pollingInterval,api:"SYNO.Core.DSMNotify",method:"notify",version:1,params:{action:"load",lastRead:this.lastRead,lastSeen:this.lastSeen},scope:this,callback:this.onFirstData};this.pollTask=this.addWebAPITask(this.pollTaskConfig).start(true);this.reloadTask=new Ext.util.DelayedTask(this.pollTask.restart,this.pollTask);this.mon(SYNO.SDS.StatusNotifier,"redirect",this.pollTask.stop,this.pollTask);this.mon(SYNO.SDS.StatusNotifier,"halt",this.pollTask.stop,this.pollTask);this.mon(Ext.get(this.settingId),"click",this.onClickSetting,this);this.mon(SYNO.SDS.StatusNotifier,"modifyHaveNtAppList",this.onModifyHaveNtAppList,this);this.keyNav=new Ext.KeyNav(this.el,{down:function(b){this.dataview.selectNextItem()},up:function(b){this.dataview.selectPreItem()},esc:function(){this.module.onClick()},scope:this})},onModifyHaveNtAppList:function(){this.pollTask.restart()},getTitleStr:function(){this.settingId=Ext.id();var a='<div class="sds-notify-setting-btn" id="{0}">&nbsp;</div><span class="x-panel-header-text" >{1}</span>';return String.format(a,this.settingId,_T("dsmnotify","title"))},reload:function(){this.reloadTask.delay(this.reloadDelay)},showUnreadTag:function(b,a){if(!b){if(a){return"<b>"}return"</b>"}return""},getTitle:function(d,a,c,b){return SYNO.SDS.DSMNotify.Utils.getTitle(d,a,c,b)},getMsg:function(d,a,c,b){return SYNO.SDS.DSMNotify.Utils.getMsg(d,a,c,b)},encodedMsg:function(d,a,c,b){return Ext.util.Format.htmlEncode(this.getMsg(d,a,c,b))},encodedTitle:function(d,a,c,b){return Ext.util.Format.htmlEncode(this.getTitle(d,a,c,b))},sortMsg:function(d,b){if(Ext.isObject(d)&&"time"===d.sortBy){return}var a=b||d.items,c=d.priorityMap;a.sort(function(h,g){var f=h.className,e=g.className;if(Ext.isEmpty(c[f])&&Ext.isEmpty(c[e])){return 0}else{if(Ext.isEmpty(c[f])){return 1}else{if(Ext.isEmpty(c[e])){return -1}else{return c[f]-c[e]}}}})},sendNotify:function(b){if(!Ext.isArray(b)){return}var a=b[0].time;Ext.each(b,function(c){var d=SYNO.SDS.AppMgr.getByAppName(c.className);if(c.time<=this.lastSeen||(d.length>0&&false===d[0].shouldNotifyMsg(c.tag,c))||c.time>a){return}a=c.time;SYNO.SDS.SystemTray.notifyMsg(c.className,this.getTitle(c.title,false,c.className),this.getMsg(c.msg,false,c.className,c.fn),null,c.isEncoded)},this)},bindClickEvent:function(a){this.mon(Ext.get(a),"click",function(){console.log(a)},this)},onClickSetting:function(){SYNO.SDS.AppLaunch("SYNO.SDS.DSMNotify.Setting.Application");this.hideBox()},onClickClear:function(){Ext.StoreMgr.get(this.storeId).removeAll();this.hideBox();SYNO.API.Request({api:"SYNO.Core.DSMNotify",method:"notify",version:1,params:{action:"apply",clean:"all"},scope:this,callback:function(d,c,b,a){if(!d){return}SYNO.SDS.UserSettings.setProperty(this.module.jsConfig.jsID,"lastRead",0);SYNO.SDS.StatusNotifier.fireEvent("notificationPanelClearAll")}});this.currentData=null},onClickShowAll:function(){this.module.appInstance.showAllWindow.open();this.hideBox()},getFormatData:function(){var b=[];var g={};var c=[];var f=0,h,j;var a=false;if(!this.currentData){return null}for(f=0;f<this.currentData.total;f++){h=this.currentData.items[f];if(h.time>this.lastRead&&false===a){if(!(g[h.title] instanceof Array)){g[h.title]=[]}g[h.title].push(h)}else{a=true;j={};j.read=true;j.contents=new Array(h);j.title=h.title;j.className=h.className;j.bindEvt=h.bindEvt;c.push(j)}}for(var d in g){if(g.hasOwnProperty(d)){j={};j.read=false;j.bindEvt=false;j.title=d;for(f=0;f<g[d].size();f++){var e=g[d][f];if(!(j.contents instanceof Array)){j.contents=[]}j.contents.push(e);j.className=e.className}b.push(j)}}if(Ext.isObject(this.currentData.priorityMap)){this.sortMsg(this.currentData,b)}b=b.concat(c);return b},onShow:function(){if(!this.isFirstDataGetted){return false}var b=this.getFormatData();this.lastRead=this.lastSeen;this.pollTaskConfig.params.lastRead=this.lastRead;SYNO.SDS.UserSettings.setProperty(this.module.jsConfig.jsID,"lastRead",this.lastRead);SYNO.SDS.DSMNotify.Panel.superclass.onShow.apply(this,arguments);this.pollTask.stop();var a=_T("common","show_all");if(this.currentUnreadNum>this.maxUnreadNum){a=_T("common","unread").replace("{@}",(this.currentUnreadNum-this.maxUnreadNum))}Ext.getCmp(this.showAllBtnId).setText(a);if(!Ext.isEmpty(this.currentData)){Ext.StoreMgr.get(this.storeId).loadData(b)}this.setHeight(Ext.lib.Dom.getViewHeight()-SYNO.SDS.TaskBar.getHeight());if(this.badge){this.badge.setNum(0)}},onFirstData:function(e,d,c,b){if(!e){return}var a={data:d};this.isFirstDataGetted=true;this.module.taskButton.enable();this.currentData=a.data;if(Ext.isArray(a.data.items)&&a.data.items.length){this.lastSeen=a.data.newestMsgTime;if(!_S("demo_mode")&&a.data.unread>0){Ext.defer(this.updateUnreadNumber,500,this,[a.data.unread])}}Ext.apply(this.pollTaskConfig,{interval:this.pollingInterval,params:{action:"load",lastRead:this.lastRead,lastSeen:this.lastSeen},callback:this.onPaddingData});this.pollTask.applyConfig(this.pollTaskConfig);this.updateGroupSettingsMTime(a.data)},onPaddingData:function(e,c,d,a){if(!e){return}var b=c;this.updateGroupSettingsMTime(b);if(!Ext.isArray(b.items)){return}if(0===b.items.length){Ext.StoreMgr.get(this.storeId).removeAll();this.hideBox(true);return}this.nowSec=(new Date()).getTime()/1000;this.sendNotify(b.items);this.lastSeen=b.newestMsgTime;this.pollTaskConfig.params.lastRead=this.lastRead;this.pollTaskConfig.params.lastSeen=this.lastSeen;this.pollTask.applyConfig(this.pollTaskConfig);this.currentData=b;if(this.isVisible()){Ext.StoreMgr.get(this.storeId).loadData(this.getFormatData())}if(!this.isVisible()){Ext.defer(this.updateUnreadNumber,500,this,[b.unread])}},getCurrentTime:function(){if(Ext.isNumber(this.nowSec)){return this.nowSec}else{return(new Date()).getTime()/1000}},updateGroupSettingsMTime:function(a){if(a&&a.admingrpsetmtime){SYNO.SDS.GroupSettings.reload(a.admingrpsetmtime)}},showUnreadBadgeNumber:function(d,b){if(true===b){return""}var c=d.size();if(c===0){return""}if(c>99){c=100}var a=(14*(c-1));return String.format("background-position: left -{0}px",a)},updateUnreadNumber:function(a){if(!this.badge){this.badge=new SYNO.SDS.Utils.Notify.Badge({badgeClassName:"sds-notify-badge-num badge-fix-position",renderTo:this.module.taskButton.btnEl,alignOffset:[0,-3]});this.module.taskButton.badge=this.badge}else{if(this.badge){this.badge.updateBadgePos()}}if(this.badge.badgeNum!=a){this.badge.setNum(a)}},hideBox:function(a){if(!a&&this.isFirstDataGetted){this.pollTask.start()}this.module.taskButton.toggle(false,true);this.hide()}});