/* Copyright (c) INTEGRA EMPRESAS 2016. All rights reserved. */

Ext.ns("SYNO.SDS.UploadTray");SYNO.SDS.UploadTray.GridPanel=Ext.extend(SYNO.FileStation.UploadGrid.GridPanel,{hidden:true,hideHeaders:true,header:true,floating:true,border:false,cls:"sds-tray-panel sds-filemonitor-tray-panel",renderTo:document.body,shadow:false,maxRecs:5,taskStack:[],constructor:function(a){this.tabId="upload";this.actionText=_WFT("filetable","filetable_upload");this.actingText=_WFT("filetable","filetable_uploading");this.trayitem=a.trayitem;var b={autoExpandColumn:null,autoHeight:true,plugins:[new SYNO.CellActions({actionWidth:24,tpl:'<div class="ux-cell-value"><div class="ux-cell-actions"><tpl for="actions"><div class="ux-cell-action {cls}" ext:qtip="{qtip}" style="{style}">&nbsp;</div></tpl></div></div>',listeners:{action:{fn:function(c,g,f,e){var h=c.getSelectionModel();var d=c.store;h.selectRow(d.indexOf(g),true);this.removeTasks()},scope:this}},align:"center"})],sm:new Ext.grid.RowSelectionModel({singleSelect:true}),bbar:[{xtype:"syno_button",btnStyle:"blue",text:_T("background_task","background_task_all"),scope:this,handler:function(){this.showUploadMonitor();this.hide()}}]};Ext.apply(b,a||{});SYNO.SDS.UploadTray.GridPanel.superclass.constructor.call(this,b)},getView:function(){if(!this.view){this.view=new SYNO.ux.FleXcroll.grid.GridView(Ext.apply(this.viewConfig||{},{forceFit:false,borderWidth:0,autoFlexcroll:false,initTemplates:function(){Ext.grid.GridView.prototype.initTemplates.apply(this,arguments);var a=['<tr class="x-grid3-row-body-tr" style="{bodyStyle}">','<td colspan="{cols}" class="x-grid3-body-cell" tabIndex="0" hidefocus="on">','<div class="x-grid3-row-body">{body}</div>',"</td>","</tr>"].join(""),b=['<table class="x-grid3-row-table" border="0" cellspacing="0" cellpadding="0" style="{tstyle}">',"<tbody>","<tr>{cells}</tr>",this.enableRowBody?a:"","</tbody>","</table>"].join("");this.templates.row=new Ext.Template('<div class="x-grid3-row {alt}" style="{tstyle}">'+b+"</div>");this.templates.row.disableFormats=true;this.templates.row.compile()},refreshRow:function(a){SYNO.ux.FleXcroll.grid.GridView.superclass.refreshRow.call(this,a);this.processRows(0,true)},onLayout:function(){this.scrollOffset=0}}))}return this.view},defineBehaviors:Ext.emptyFn,showUploadMonitor:function(){var a=SYNO.SDS.AppMgr.getByAppName("SYNO.SDS.App.FileTaskMonitor.Instance")[0].window;a.onOpen({});a.activeTabPanel("upload")},onTrayClick:function(){if(this.getStore().getCount()>0){SYNO.SDS.FileTaskMonitor.UploadTray.TrayItem.superclass.onClick.call(this.trayitem)}else{if(this.trayitem.getUploadGrid().getStore().getCount()>0){this.showUploadMonitor()}}},rowContextMenuHandle:function(){},updateUI:function(){},initColumnModel:function(){var a=new Ext.grid.ColumnModel({defaults:{menuDisabled:true,sortable:false},columns:[{id:"name",dataIndex:"id",align:"left",width:249,renderer:this.nameRenderer.createDelegate(this),scope:this},{dataIndex:"id",align:"left",css:"vertical-align: bottom;",width:35,cellActions:[{iconCls:"sds-progress-cancel",qtip:_T("common","cancel")}]}]});return a},nameRenderer:function(d,h,e,j,a,i){var b=Math.floor(e.data.progress);var f=new SYNO.SDS.Utils.ProgressBar({barWidth:185,barHeight:16,showValueText:true});var g=new Ext.XTemplate('<div class="sds-filemonitor-tray-text"><span class="sds-filemonitor-tray-action-text">{statusText}:</span><span class="sds-filemonitor-tray-file-text">&nbsp;{name}</span></div>',"<table><tbody><tr><td>{progressBar}</td>","</tr></tbody></table>");var c=e.data.statusText.split(":",2);return g.apply({name:Ext.util.Format.htmlEncode(e.data.name),lefttime:e.data.lefttime,statusText:c[0],progressBar:f.fill(b),invvalue:100-b})},removeOneTask:function(a){var c=a.data.id;this.removeOneTaskNoEvent(c);var b=this.trayitem.getUploadGrid();b.removeOneTask(b.getStore().getById(c))},removeOneTaskNoEvent:function(b){var a=this.getStore().getById(b);if(!a){Ext.each(this.taskStack,function(d,c){if(d&&d.data.id===b){this.taskStack.splice(c,1);return true}},this);return}this.getStore().remove(a);delete this.progressInfoArray[a.data.id];this.onAddStore(this.taskStack.shift())},isLessMaxRecs:function(){return(this.getStore().getCount()<this.maxRecs)},isProgressDataNotReady:function(a){return !this.getStore().getById(a)||!Ext.isDefined(this.progressInfoArray[a])},onAddStore:function(a){if(a){this.getStore().add(a)}},onSelect:function(a,b){var c=new this.taskRec({id:a.id,icon:"file.png",event:"",name:a.name,rate:"",starttime:a.starttime||null,lefttime:"",progress:(a.progress===false)?false:0,status:a.status||"NOT_STARTED",statusText:_WFT("upload","upload_task_waiting"),statusQtip:_WFT("upload","upload_task_waiting"),cancelEvent:b||null},a.id);if(this.isLessMaxRecs()){this.onAddStore(c)}else{this.taskStack.push(c)}},onOpen:function(a){if(!this.getStore().getById(a.id)){this.onOpen.createDelegate(this,[a]).defer(100);return}SYNO.SDS.UploadTray.GridPanel.superclass.onOpen.call(this,a)},onProgress:function(a){if(this.isProgressDataNotReady(a.id)){return}SYNO.SDS.UploadTray.GridPanel.superclass.onProgress.call(this,a)},onProgressWithTime:function(a){if(this.isProgressDataNotReady(a.id)){return}SYNO.SDS.UploadTray.GridPanel.superclass.onProgressWithTime.call(this,a)},onError:function(a){if(a.isSubFile||a.isSubFolder){return}this.onComplete(a)},onComplete:function(a){if(this.isProgressDataNotReady(a.id)){this.onComplete.createDelegate(this,[a]).defer(100);return}this.removeOneTaskNoEvent(a.id)},onAllComplete:function(){SYNO.SDS.UploadTray.GridPanel.superclass.onAllComplete.call(this);this.trayitem.setStaticIcon();delete this.taskStack;this.taskStack=[];this.getStore().removeAll(true)}});Ext.ns("SYNO.SDS.FileTaskMonitor.UploadTray");SYNO.SDS.FileTaskMonitor.UploadTray.TrayItem=Ext.extend(SYNO.SDS.FileTaskMonitor.BasicTrayItem,{animIcon:"sds-tray-item-ani-upload",staticIcon:"sds-tray-item-static-upload",initPanel:function(){var a=new SYNO.SDS.UploadTray.GridPanel({trayitem:this,RELURL:this.jsConfig.jsBaseURL+"/"});return a},onClick:function(){this.panel.onTrayClick()}});Ext.ns("SYNO.SDS.FileTaskMonitor");SYNO.SDS.FileTaskMonitor.UploadGrid=Ext.extend(SYNO.FileStation.UploadGrid.GridPanel,{nbNotifyFile:1,updateFileArr:[],skipFileArr:[],errFolder:[],errorMsgWin:{},constructor:function(a){this.tabId="upload";this.actionText=_WFT("filetable","filetable_upload");this.actingText=_WFT("filetable","filetable_uploading");this.action_failed=_T("filebrowser","filebrowser_upload_failed");this.add_filefoler_action_queue=_T("filebrowser","add_filefoler_upload_queue");this.add_file_action_queue=_T("filebrowser","add_file_upload_queue");this.add_action_queue=_T("filebrowser","add_upload_queue");this.action_filefoler_completed=_T("filebrowser","upload_filefoler_completed");this.action_filefoler_completed_with_skip=_T("filebrowser","upload_filefoler_completed_with_skip");this.action_file_completed=_T("filebrowser","upload_file_completed");this.action_file_completed_with_skip=_T("filebrowser","upload_file_completed_with_skip");this.action_completed=_T("filebrowser","filebrowser_upload_completed");this.action_skipped=_T("filebrowser","filebrowser_upload_skipped");var b=this.fillCfg(a);SYNO.SDS.FileTaskMonitor.UploadGrid.superclass.constructor.call(this,b)},fillCfg:function(a){if(!_S("standalone")){this.toolbar=this.initToolbar()}var b={title:null,autoExpandColumn:"name",sm:new Ext.grid.RowSelectionModel({listeners:{selectionchange:{fn:this.onUpdateBtnStatus,scope:this,buffer:500}}}),view:new SYNO.ux.FleXcroll.grid.BufferView({rowHeight:26,borderHeight:1,cacheSize:30,forceFit:true,listeners:{rowsinserted:{scope:this,fn:function(c,f){var e=this.getStore().getAt(f);var d=c.getRow(f);this.progressInfoArray[e.data.id]=new this.progressInfo(d)}}}}),tbar:this.toolbar};Ext.apply(b,a||{});return b},defineBehaviors:function(){this.mon(this,"show",function(){var a=this.getSelectionModel();a.clearSelections();a.selectFirstRow();this.onUpdateBtnStatus()},this)},initToolbar:function(){var a=new Ext.Toolbar({items:[{xtype:"syno_button",itemId:"gc_clean",text:_WFT("upload","upload_itm_clean"),handler:this.cleanAllSuccessTasks,scope:this},{xtype:"syno_button",itemId:"gc_remove",text:_WFT("upload","upload_itm_remove"),handler:this.removeTasks,scope:this,disabled:true},{xtype:"syno_button",itemId:"gc_restart",text:_WFT("common","restart"),handler:this.restartTasks,scope:this,disabled:true,hidden:this.blRestart===false},{xtype:"syno_button",itemId:"gc_pause_resume",text:_WFT("common","pause")||"Pause",handler:this.pauseResumeTask,scope:this,disabled:false,hidden:!this.blPauseResume}]});return a},initCtxMenu:function(){var a=new SYNO.ux.Menu({cls:"syno-webfm",items:[{itemId:"gc_remove",iconCls:"webfm-delete-icon",text:_WFT("upload","upload_itm_remove"),handler:this.removeTasks,scope:this},{itemId:"gc_restart",iconCls:"webfm-restart-icon",text:_WFT("common","restart"),handler:this.restartTasks,scope:this,hidden:this.blRestart===false},"-",{itemId:"gc_clean",iconCls:"webfm-clear-icon",text:_WFT("upload","upload_itm_clean"),handler:this.cleanAllSuccessTasks,scope:this}]});this.addManagedComponent(a);return a},createBadge:function(){var a=this.getTray().taskButton.getEl().child("button");this.badge=new SYNO.SDS.Utils.Notify.Badge({renderTo:a,badgeClassName:"sds-notify-badge-num",alignOffset:[3,-3]})},updateBadge:function(a){a=a||0;if(!this.badge){return}this.badge.setNum(a)},onUpdateBtnStatus:function(){if(_S("standalone")){return}var b=this.toolbar.get("gc_remove"),c=this.toolbar.get("gc_restart"),f=this.getSelectionModel(),e=f.getSelections(),a=false,d;if(e.length>0){b.enable();for(d=0;d<e.length;d++){if(e[d].get("status")==="FAIL"){a=true;break}}if(a){c.enable()}else{c.disable()}}else{b.disable();c.disable()}},addFileStr:[],onSelect:function(a,b){if(false!==SYNO.SDS.FileTaskMonitor.UploadGrid.superclass.onSelect.call(this,a,b)){this.addFileStr.push(a.name);if(!_S("standalone")){this.getTray().panel.onSelect(a)}}},onAllSelect:function(b,a){SYNO.SDS.FileTaskMonitor.UploadGrid.superclass.onAllSelect.call(this,b,a);this.onAfterAllSelect()},onAfterAllSelect:function(){var a=this.addFileStr.length;if(a<=0){return}var b;if(a>this.nbNotifyFile){if(AppletProgram.blJavaPermission==1){b=String.format(this.add_filefoler_action_queue,a)}else{b=String.format(this.add_file_action_queue,a)}}else{Ext.each(this.addFileStr,function(e,d,c){c[d]=Ext.util.Format.htmlEncode(e)});b=String.format(this.add_action_queue,this.addFileStr.join(", "))}SYNO.SDS.SystemTray.notifyMsg("SYNO.SDS.App.FileStation3.Instance",this.actionText,b,5000,false);this.addFileStr=[];if(!_S("standalone")){this.getTray().setAnimIcon();this.getTray().taskButton.show()}},onOpen:function(a){SYNO.SDS.FileTaskMonitor.UploadGrid.superclass.onOpen.call(this,a);if(!_S("standalone")){this.getTray().panel.onOpen(a)}},onProgress:function(a){SYNO.SDS.FileTaskMonitor.UploadGrid.superclass.onProgress.call(this,a);if(!_S("standalone")){this.getTray().panel.onProgress(a)}},onProgressWithTime:function(a){SYNO.SDS.FileTaskMonitor.UploadGrid.superclass.onProgressWithTime.call(this,a);if(!_S("standalone")){this.getTray().panel.onProgressWithTime(a)}},onError:function(c){if(!this.progressInfoArray[c.id]){return}var f=" ";if(c.response&&c.response.error&&c.response.error.code){f+=SYNO.webfm.utils.getWebAPIErr(false,c.response.error)}else{if(c.response&&c.response.errno&&c.response.errno.section&&c.response.errno.key){var i=c.response.errno.section,j=c.response.errno.key;f+=_WFT(i,j)||_T(i,j)}else{if(Ext.isString(c.response)){f+=c.response}else{f+=_WFT("common","commfail")}}}var b="",a="",d="";if(c.name||c.curname){a=(!c.curname)?c.name:c.curname;d=a;if(15<a.length){a=a.substring(0,6)+"..."+a.substring(a.length-10,a.length)}}b=(c.isSubFile||c.isSubFolder)?c.rootObj.name:c.name||c.curname||null;var e=this.getStore().getById(c.id);this.progressInfoArray[c.id].update(e,"failed.png",null,b,"","",(c.bytesLoaded===0)?0:null,c.status||"FAIL",a+f,d+f);var h=String.format(this.action_failed,Ext.util.Format.htmlEncode(b));h+="<br>";if(f){h+=f}var g=false;if(!Ext.isEmpty(this.errorMsgWin)&&!this.errorMsgWin[c.id]){g=true;this.errorMsgWin[c.id]=SYNO.SDS.SystemTray.notifyMsg("SYNO.SDS.App.FileStation3.Instance",this.actionText,h,(c.isSubFile||c.isSubFolder)?0:null,false)}if(!_S("standalone")){this.getTray().panel.onError(c);if(g===true){if(!this.badge){this.createBadge();this.updateBadge(1)}else{Ext.defer(function(){this.updateBadge(this.badge.badgeNum+1)},1000,this)}}}if(c.isSubFile){if(c.byteswrite){c.rootObj.uploadByte+=c.byteswrite}e.data.lastwrite=0}},onCompleteFolderFile:function(a){if(!a.size){return}a.rootObj.uploadByte+=a.size},onComplete:function(c){SYNO.SDS.FileTaskMonitor.UploadGrid.superclass.onComplete.call(this,c);if(!_S("standalone")){this.getTray().panel.onComplete(c)}var d=(c.isSubFile||c.isSubFolder),b=(d&&c.rootObj)?c.rootObj.name:c.name,a=d?!c.rootObj.errors:true;if(!a){this.errFolder.push({id:c.id,name:b})}else{if(c.isSkip){this.skipFileArr.push(b)}this.updateFileArr.push(b)}},onAllComplete:function(){SYNO.SDS.FileTaskMonitor.UploadGrid.superclass.onAllComplete.call(this);if(!_S("standalone")){this.getTray().panel.onAllComplete()}this.showNotify()},removeOneTask:function(b){var a=SYNO.SDS.FileTaskMonitor.UploadGrid.superclass.removeOneTask.apply(this,arguments);if(!_S("standalone")){this.hideTrayItem()}return a},removeTasks:function(){var d=this.getSelectionModel().getSelections(),c;if(d.length<1){return}if(!_S("standalone")){c=this.getTray().panel}var a=0;for(var b=0;b<d.length;b++){if(!_S("standalone")){if(this.badge&&this.errorMsgWin[d[b].id]){a++}c.removeOneTaskNoEvent(d[b].data.id)}if(!this.removeOneTask(d[b])){break}}if(!_S("standalone")){if(this.badge){this.updateBadge(this.badge.badgeNum-a)}this.hideTrayItem()}},cleanAllSuccessTasks:function(){SYNO.SDS.FileTaskMonitor.UploadGrid.superclass.cleanAllSuccessTasks.call(this);if(!_S("standalone")){this.hideTrayItem()}},hideTrayItem:function(){if(_S("standalone")){return}if(!this.getStore().getCount()){this.getTray().taskButton.hide()}},sendNotify:function(c,d,b){var a=String.format(c,d,b);SYNO.SDS.SystemTray.notifyMsg("SYNO.SDS.App.FileStation3.Instance",this.actionText,a,5000,false)},showNotify:function(){var b=this.updateFileArr.length,c=this.skipFileArr.length,a=this.errFolder.length;if(b===0&&a===0){return}if(b>this.nbNotifyFile){if(AppletProgram.blJavaPermission==1){this.sendNotify(0===c?this.action_filefoler_completed:this.action_filefoler_completed_with_skip,b,c)}else{this.sendNotify(0===c?this.action_file_completed:this.action_file_completed_with_skip,b,c)}}else{if(b==this.nbNotifyFile){Ext.each(this.updateFileArr,function(f,e,d){d[e]=Ext.util.Format.htmlEncode(f)});this.sendNotify(b!==c?this.action_completed:this.action_skipped,this.updateFileArr.join(", "))}}if(a>0){Ext.each(this.errFolder,function(f,e,d){if(!this.errorMsgWin[d[e].id]){var g=String.format(this.action_failed,Ext.util.Format.htmlEncode(d[e].name));this.errorMsgWin[d[e].id]=SYNO.SDS.SystemTray.notifyMsg("SYNO.SDS.App.FileStation3.Instance",this.actionText,g,0,false)}},this)}this.updateFileArr=[];this.skipFileArr=[];this.errFolder=[]},getInterval:function(a){if(!Ext.isNumber(a)){return 5*1000}return Math.ceil(a/5000)*5*1000},updateTaskFn:function(){var a=SYNO.SDS.AppMgr.getByAppName("SYNO.SDS.App.FileStation3.Instance");Ext.each(this.updateTaskArr,function(b){Ext.each(a,function(d){var c=d.window.getPanelInstance();var e=this.refreshUI(c,b);if(e){this.getUpdateTask().applyInterval(this.getInterval(e))}},this)},this);this.updateTaskArr=[]},refreshUI:function(b,a){return SYNO.FileStation.WindowPanel.superclass.refreshTreeNode.call(b,[a.remotedir],true)}});Ext.ns("SYNO.SDS.FileTaskMonitor");SYNO.SDS.FileTaskMonitor.LocalFileMonitorGrid=Ext.extend(SYNO.FileStation.MonitorGrid,{constructor:function(a){if(!_S("standalone")){this.toptoolbar=this.initToolbar()}var b={itemId:"local",autoExpandColumn:"name",autoExpandMin:160,sm:new Ext.grid.RowSelectionModel({listeners:{selectionchange:{fn:this.onUpdateBtnStatus,scope:this,buffer:500}}}),viewConfig:{forceFit:true,listeners:{rowsinserted:{scope:this,fn:function(c,f){var e=this.getStore().getAt(f);var d=c.getRow(f);this.progressInfoArray[e.data.id]=new this.progressInfo(d)}}}},tbar:this.toptoolbar};Ext.apply(b,a||{});SYNO.SDS.FileTaskMonitor.LocalFileMonitorGrid.superclass.constructor.call(this,b);this.mon(this,"show",function(){var c=this.getSelectionModel();c.clearSelections();c.selectFirstRow();this.onUpdateBtnStatus()},this);this.mon(this,"cancel",function(c){AppletProgram.action({action:"canceltask",id:c})},this)},defineBehaviors:Ext.emptyFn,initToolbar:function(){var a=new Ext.Toolbar({items:[{xtype:"syno_button",itemId:"gc_remove",text:_WFT("upload","upload_itm_remove"),handler:this.removeTasks,scope:this,disabled:true}]});return a},initCtxMenu:function(){var a=new SYNO.ux.Menu({cls:"syno-webfm",items:[{itemId:"gc_remove",iconCls:"webfm-delete-icon",text:_WFT("upload","upload_itm_remove"),handler:this.removeTasks,scope:this}]});this.addManagedComponent(a);return a},initColumnModel:function(){var a=new Ext.grid.ColumnModel([{dataIndex:"id",width:25,align:"center",renderer:this.iconRenderer,scope:this},{id:"name",header:_WFT("filetable","filetable_file"),dataIndex:"name",renderer:this.nameRenderer},{header:_WFT("upload","upload_time_left"),dataIndex:"id",align:"left",width:100,renderer:this.timeRenderer},{header:_WFT("upload","files_progress"),width:310,dataIndex:"id",align:"left",renderer:this.progressRenderer,scope:this},{header:_WFT("upload","upload_list_status"),dataIndex:"id",align:"left",width:210,renderer:this.statusRenderer}]);return a},onUpdateBtnStatus:function(){if(_S("standalone")){return}var a=this.toptoolbar.get("gc_remove");a.setDisabled(this.getSelectionModel().getSelections().length<=0)},onSelect:function(a,b){SYNO.SDS.FileTaskMonitor.LocalFileMonitorGrid.superclass.onSelect.call(this,a,b);this.onAllSelect(0,1)},onAllSelect:function(b,a){SYNO.SDS.FileTaskMonitor.LocalFileMonitorGrid.superclass.onAllSelect.call(this,b,a);if(!_S("standalone")){this.getTrayItem().showTray()}this.startAvoidTimeout()},onOpen:function(a){if(!this.progressInfoArray[a.id]){return}var d=this.getStore().getById(a.id);var c=this.getEventStr(a.event);var b=c.actionStr+": "+a.name;this.progressInfoArray[a.id].update(d,"uploading.png",c.actionStr||null,b,"","",0,a.status||"PROCESSING",c.actingStr,c.actingStr)},getProgressStatusText:function(d,c,b){var a=(c)?b:c;var e=a;if(15<a.length){e=a.substring(0,6)+"..."+a.substring(a.length-10,a.length)}var f=d.actingStr+": ";return{text:f+e,qtipText:f+a}},onProgress:function(b){if(!this.progressInfoArray[b.id]){return}var d=b.progress?b.progress:((b.bytesTotal===0)?100:b.bytesLoaded*100/b.bytesTotal);var a="";if(b.timeLeft>-1){a=String.format("{0}",(b.timeLeft>1)?Date.fancyDuration(b.timeLeft):Date.fancyDuration(1))}var e=this.getEventStr(b.event);var f=this.getProgressStatusText(e,b.curname,b.name);var g=this.getStore().getById(b.id);var c=e.actionStr+": "+b.name;Ext.apply(g.data,("delete"==b.event)?{processed_num:b.bytesLoaded,total:b.bytesTotal}:{processed_size:b.bytesLoaded,total:b.bytesTotal});this.progressInfoArray[b.id].update(g,null,null,c,a,null,d,b.status||"PROCESSING",f.text,f.qtipText,null)},onError:function(b){if(!this.progressInfoArray[b.id]){return}var i="",f="";var a="",c="";if(b.name||b.curname){a=(!b.curname)?b.name:b.curname;c=a;if(15<a.length){a=a.substring(0,6)+"..."+a.substring(a.length-10,a.length)}}var e="";if(b.response&&b.response.errno&&b.response.errno.section&&b.response.errno.key){var g=b.response.errno.section;var h=b.response.errno.key;if(b.response.errno.section==="filebrowser"){i=String.format(_T(g,h),a,"");f=String.format(_T(g,h),c,"")}else{e=_WFT(b.response.errno.section,b.response.errno.key);i=e+" ("+a+")";f=e+"<br>("+c+")"}}else{switch(b.event){case"move":i=String.format(_T("filebrowser","filebrowser_move_failed"),a,"");f=String.format(_T("filebrowser","filebrowser_move_failed"),c,"");break;case"copy":i=String.format(_T("filebrowser","filebrowser_copy_failed"),a,"");f=String.format(_T("filebrowser","filebrowser_copy_failed"),c,"");break;case"delete":i=String.format(_T("filebrowser","filebrowser_delete_failed"),a,"");f=String.format(_T("filebrowser","filebrowser_delete_failed"),c,"");break;default:e=_WFT("common","commfail");i=e+" ("+a+")";f=e+"<br>("+c+")";break}}var d=this.getStore().getById(b.id);this.progressInfoArray[b.id].update(d,"failed.png",null,b.name||b.curname||null,"","",(b.bytesLoaded===0)?0:null,b.status||"FAIL",i,f)},onComplete:function(a){SYNO.SDS.FileTaskMonitor.LocalFileMonitorGrid.superclass.onComplete.apply(this,arguments)},onAllComplete:function(){SYNO.SDS.FileTaskMonitor.LocalFileMonitorGrid.superclass.onAllComplete.call(this);this.hideTrayItem();this.stopAvoidTimeout()},removeOneTask:function(){var a=SYNO.SDS.FileTaskMonitor.LocalFileMonitorGrid.superclass.removeOneTask.apply(this,arguments);this.hideTrayItem();return a},removeTasks:function(){var b=this.getSelectionModel().getSelections();if(b.length<1){return}for(var a=0;a<b.length;a++){if(!this.removeOneTask(b[a])){break}}this.hideTrayItem()},hideTrayItem:function(){if(_S("standalone")){return}this.getTrayItem().hideTray()},onUpdateAll:function(tasks){Ext.each(tasks,function(task){try{eval("this."+task.action+"(task);")}catch(err){SYNO.Debug("exception: "+err)}},this)},getTrayItem:function(){if(!this.tray){this.tray=SYNO.SDS.AppMgr.getByAppName("SYNO.SDS.App.FileTaskMonitor.Instance")[0].getBKTray()}return this.tray},getEventStr:function(c){var a,b;switch(c){case"copy":a=_WFT("filetable","filetable_copy");b=_WFT("filetable","filetable_copying");break;case"move":a=_WFT("filetable","filetable_move");b=_WFT("filetable","filetable_moving");break;case"delete":a=_WFT("filetable","filetable_delete");b=_WFT("filetable","filetable_deleting");break;default:break}return{actionStr:a,actingStr:b}}});Ext.ns("SYNO.SDS.FileTaskMonitor");SYNO.SDS.FileTaskMonitor.DownloadGrid=Ext.extend(SYNO.FileStation.MonitorQueue.GridPanel,{nbNotifyFile:1,updateFileArr:[],constructor:function(a){this.tabId="download";this.actionText=_WFT("filetable","filetable_download");this.actingText=_T("download","download_task_downloading");this.action_failed=_T("download","download_file_failed");this.add_filefoler_action_queue=_T("download","add_filefoler_download_queue");this.add_file_action_queue=_T("download","add_file_download_queue");this.add_action_queue=_T("download","add_download_queue");this.action_filefoler_completed=_T("download","download_filefoler_completed");this.action_file_completed=_T("download","download_file_completed");this.action_completed=_T("download","download_completed");this.blRestart=false;this.blPauseResume=(0===AppletProgram.blJavaPermission);var b=this.fillCfg(a);SYNO.SDS.FileTaskMonitor.DownloadGrid.superclass.constructor.call(this,b);this.mon(this,"show",function(){var c=this.getSelectionModel();c.clearSelections();c.selectFirstRow();this.onUpdateBtnStatus()},this)},fillCfg:function(){return SYNO.SDS.FileTaskMonitor.UploadGrid.prototype.fillCfg.apply(this,arguments)},defineBehaviors:function(){SYNO.SDS.FileTaskMonitor.UploadGrid.prototype.defineBehaviors.apply(this,arguments)},initToolbar:function(){return SYNO.SDS.FileTaskMonitor.UploadGrid.prototype.initToolbar.apply(this,arguments)},initCtxMenu:function(){return SYNO.SDS.FileTaskMonitor.UploadGrid.prototype.initCtxMenu.apply(this,arguments)},onUpdateBtnStatus:function(){SYNO.SDS.FileTaskMonitor.UploadGrid.prototype.onUpdateBtnStatus.apply(this,arguments)},addFileStr:[],onSelect:function(a,b){if(false!==SYNO.SDS.FileTaskMonitor.DownloadGrid.superclass.onSelect.call(this,a,b)){this.addFileStr.push(a.name);if(!_S("standalone")){this.getTray().panel.onSelect(a)}this.onAllSelect(0,1)}},onAllSelect:function(b,a){SYNO.SDS.FileTaskMonitor.DownloadGrid.superclass.onAllSelect.call(this,b,a);this.updatePauseResumeBtn(false);this.onAfterAllSelect()},onAfterAllSelect:function(){SYNO.SDS.FileTaskMonitor.UploadGrid.prototype.onAfterAllSelect.apply(this,arguments)},onOpen:function(a){SYNO.SDS.FileTaskMonitor.DownloadGrid.superclass.onOpen.call(this,a);if(!_S("standalone")){this.getTray().panel.onOpen(a)}},onProgress:function(a){SYNO.SDS.FileTaskMonitor.DownloadGrid.superclass.onProgress.call(this,a);if(!_S("standalone")){this.getTray().panel.onProgress(a)}},onProgressWithTime:function(a){SYNO.SDS.FileTaskMonitor.DownloadGrid.superclass.onProgressWithTime.call(this,a);if(!_S("standalone")){this.getTray().panel.onProgressWithTime(a)}},onError:function(a){SYNO.SDS.FileTaskMonitor.UploadGrid.prototype.onError.apply(this,arguments)},onComplete:function(a){SYNO.SDS.FileTaskMonitor.DownloadGrid.superclass.onComplete.call(this,a);if(!_S("standalone")){this.getTray().panel.onComplete(a)}this.updateFileArr.push(a.name)},onAllComplete:function(){SYNO.SDS.FileTaskMonitor.DownloadGrid.superclass.onAllComplete.call(this);this.updatePauseResumeBtn(true);if(!_S("standalone")){this.getTray().panel.onAllComplete()}},onPause:function(a){SYNO.SDS.FileTaskMonitor.DownloadGrid.superclass.onPause.call(this,a);if(!_S("standalone")){this.getTray().panel.onPause(a)}},onResume:function(a){SYNO.SDS.FileTaskMonitor.DownloadGrid.superclass.onResume.call(this,a);if(!_S("standalone")){this.getTray().panel.onResume(a)}},updatePauseResumeBtn:function(a){var b=this.toolbar.get("gc_pause_resume");b.setDisabled(a)},pauseDownloadTask:function(){if(SYNO.FileStation.MultiDownloadMgr){var a=this.toolbar.get("gc_pause_resume");a.setText(_WFT("common","resume"));SYNO.FileStation.MultiDownloadMgr.pauseDownloadTask(true)}},pauseResumeTask:function(a,b){if(a.text===_WFT("common","pause")){if(SYNO.FileStation.MultiDownloadMgr){SYNO.FileStation.MultiDownloadMgr.pauseDownloadTask(false)}a.setText(_WFT("common","resume"))}else{if(a.text===_WFT("common","resume")){if(SYNO.FileStation.MultiDownloadMgr){SYNO.FileStation.MultiDownloadMgr.resumeDownloadTask()}a.setText(_WFT("common","pause"))}}},removeOneTask:function(){var a=SYNO.SDS.FileTaskMonitor.DownloadGrid.superclass.removeOneTask.apply(this,arguments);if(!_S("standalone")){this.hideTrayItem()}return a},removeTasks:function(){SYNO.SDS.FileTaskMonitor.UploadGrid.prototype.removeTasks.apply(this,arguments)},cleanAllSuccessTasks:function(){SYNO.SDS.FileTaskMonitor.DownloadGrid.superclass.cleanAllSuccessTasks.call(this);if(!_S("standalone")){this.hideTrayItem()}},hideTrayItem:function(){SYNO.SDS.FileTaskMonitor.UploadGrid.prototype.hideTrayItem.apply(this,arguments)},updateTaskFn:function(){SYNO.SDS.FileTaskMonitor.UploadGrid.prototype.updateTaskFn.apply(this,arguments)},refreshUI:function(c,a){var b=[];if("move"===a.event){b=SYNO.webfm.utils.getParentDirArr(a.files)}SYNO.FileStation.WindowPanel.superclass.refreshTreeNode.call(c,b,true,SYNO.webfm.utils.source.remote);SYNO.FileStation.WindowPanel.superclass.refreshTreeNode.call(c,[a.remotedir],a.isdir,SYNO.webfm.utils.source.local)}});Ext.ns("SYNO.SDS.DownloadTray");SYNO.SDS.DownloadTray.GridPanel=Ext.extend(SYNO.FileStation.UploadGrid.GridPanel,{hidden:true,hideHeaders:true,header:true,floating:true,border:false,cls:"sds-tray-panel sds-filemonitor-tray-panel",renderTo:document.body,shadow:false,maxRecs:5,taskStack:[],constructor:function(a){this.tabId="download";this.actionText=_WFT("filetable","filetable_download");this.actingText=_T("download","download_task_downloading");this.trayitem=a.trayitem;var b={autoExpandColumn:null,autoHeight:true,plugins:[new SYNO.CellActions({actionWidth:24,tpl:'<div class="ux-cell-value"><div class="ux-cell-actions"><tpl for="actions"><div class="ux-cell-action {cls}" ext:qtip="{qtip}" style="{style}">&nbsp;</div></tpl></div></div>',listeners:{action:{fn:function(c,g,f,e){var h=c.getSelectionModel();var d=c.store;h.selectRow(d.indexOf(g),true);this.removeTasks()},scope:this}},align:"center"})],sm:new Ext.grid.RowSelectionModel({singleSelect:true}),bbar:[{xtype:"syno_button",btnStyle:"blue",text:_T("background_task","background_task_all"),scope:this,handler:function(){this.showMonitor();this.hide()}}]};Ext.apply(b,a||{});SYNO.SDS.DownloadTray.GridPanel.superclass.constructor.call(this,b)},getView:function(){if(!this.view){this.view=new SYNO.ux.FleXcroll.grid.GridView(Ext.apply(this.viewConfig||{},{forceFit:false,borderWidth:0,autoFlexcroll:false,initTemplates:function(){Ext.grid.GridView.prototype.initTemplates.apply(this,arguments);var a=['<tr class="x-grid3-row-body-tr" style="{bodyStyle}">','<td colspan="{cols}" class="x-grid3-body-cell" tabIndex="0" hidefocus="on">','<div class="x-grid3-row-body">{body}</div>',"</td>","</tr>"].join(""),b=['<table class="x-grid3-row-table" border="0" cellspacing="0" cellpadding="0" style="{tstyle}">',"<tbody>","<tr>{cells}</tr>",this.enableRowBody?a:"","</tbody>","</table>"].join("");this.templates.row=new Ext.Template('<div class="x-grid3-row {alt}" style="{tstyle}">'+b+"</div>");this.templates.row.disableFormats=true;this.templates.row.compile()},refreshRow:function(a){SYNO.ux.FleXcroll.grid.GridView.superclass.refreshRow.call(this,a);this.processRows(0,true)},onLayout:function(){this.scrollOffset=0}}))}return this.view},defineBehaviors:Ext.emptyFn,showMonitor:function(){var a=SYNO.SDS.AppMgr.getByAppName("SYNO.SDS.App.FileTaskMonitor.Instance")[0].window;a.onOpen({});a.activeTabPanel("download")},onTrayClick:function(){if(this.getStore().getCount()>0){SYNO.SDS.FileTaskMonitor.DownloadTray.TrayItem.superclass.onClick.call(this.trayitem)}else{if(this.trayitem.getDownloadGrid().getStore().getCount()>0){this.showMonitor()}}},rowContextMenuHandle:function(){},updateUI:function(){},initColumnModel:function(){var a=new Ext.grid.ColumnModel({defaults:{menuDisabled:true,sortable:false},columns:[{id:"name",dataIndex:"id",align:"left",width:249,renderer:this.nameRenderer.createDelegate(this),scope:this},{dataIndex:"id",align:"left",css:"vertical-align: bottom;",width:35,cellActions:[{iconCls:"sds-progress-cancel",qtip:_T("common","cancel")}]}]});return a},nameRenderer:function(d,h,e,j,a,i){var b=Math.floor(e.data.progress);var f=new SYNO.SDS.Utils.ProgressBar({barWidth:185,barHeight:16,showValueText:true});var g=new Ext.XTemplate('<div class="sds-filemonitor-tray-text"><span class="sds-filemonitor-tray-action-text">{statusText}:</span><span class="sds-filemonitor-tray-file-text">&nbsp;{name}</span></div>',"<table><tbody><tr><td>{progressBar}</td>","</tr></tbody></table>");var c=e.data.statusText.split(":",2);return g.apply({name:Ext.util.Format.htmlEncode(e.data.name),lefttime:e.data.lefttime,statusText:c[0],progressBar:f.fill(b)})},removeOneTask:function(a){var c=a.data.id;this.removeOneTaskNoEvent(c);var b=this.trayitem.getDownloadGrid();b.removeOneTask(b.getStore().getById(c))},removeOneTaskNoEvent:function(b){var a=this.getStore().getById(b);if(!a){Ext.each(this.taskStack,function(d,c){if(d&&d.data.id===b){this.taskStack.splice(c,1);return true}},this);return}this.getStore().remove(a);delete this.progressInfoArray[a.data.id];this.onAddStore(this.taskStack.shift())},isLessMaxRecs:function(){return(this.getStore().getCount()<this.maxRecs)},isProgressDataNotReady:function(a){return !this.getStore().getById(a)||!Ext.isDefined(this.progressInfoArray[a])},onAddStore:function(a){if(a){this.getStore().add(a)}},onSelect:function(a,b){var c=new this.taskRec({id:a.id,icon:"file.png",event:"",name:a.name,rate:"",starttime:a.starttime||null,lefttime:"",progress:(a.progress===false)?false:0,status:a.status||"NOT_STARTED",statusText:_WFT("upload","upload_task_waiting"),statusQtip:_WFT("upload","upload_task_waiting"),cancelEvent:b||null},a.id);if(this.isLessMaxRecs()){this.onAddStore(c)}else{this.taskStack.push(c)}},onOpen:function(a){if(!this.getStore().getById(a.id)){this.onOpen.createDelegate(this,[a]).defer(100);return}SYNO.SDS.DownloadTray.GridPanel.superclass.onOpen.call(this,a)},onProgress:function(a){if(this.isProgressDataNotReady(a.id)){return}SYNO.SDS.DownloadTray.GridPanel.superclass.onProgress.call(this,a)},onProgressWithTime:function(a){if(this.isProgressDataNotReady(a.id)){return}SYNO.SDS.DownloadTray.GridPanel.superclass.onProgressWithTime.call(this,a)},onError:function(a){this.onComplete(a)},onPause:function(a){this.trayitem.setStaticIcon();SYNO.SDS.DownloadTray.GridPanel.superclass.onPause.call(this,a)},onResume:function(a){this.trayitem.setAnimIcon();SYNO.SDS.DownloadTray.GridPanel.superclass.onResume.call(this,a)},onComplete:function(a){if(this.isProgressDataNotReady(a.id)){this.onComplete.createDelegate(this,[a]).defer(100);return}this.removeOneTaskNoEvent(a.id)},onAllComplete:function(){SYNO.SDS.DownloadTray.GridPanel.superclass.onAllComplete.call(this);this.trayitem.setStaticIcon();delete this.taskStack;this.taskStack=[];this.getStore().removeAll(true)}});Ext.ns("SYNO.SDS.FileTaskMonitor.DownloadTray");SYNO.SDS.FileTaskMonitor.DownloadTray.TrayItem=Ext.extend(SYNO.SDS.FileTaskMonitor.BasicTrayItem,{animIcon:"sds-tray-item-ani-download",staticIcon:"sds-tray-item-static-download",initPanel:function(){var a=new SYNO.SDS.DownloadTray.GridPanel({trayitem:this,RELURL:this.jsConfig.jsBaseURL+"/"});return a},onClick:function(){this.panel.onTrayClick()}});Ext.ns("SYNO.SDS.App");SYNO.SDS.App.FileTaskMonitorTabPanel=Ext.extend(SYNO.ux.TabPanel,{constructor:function(b){this.appInstance=b.appInstance;this.uploadGrid=new SYNO.SDS.FileTaskMonitor.UploadGrid({RELURL:b.jsConfig.jsBaseURL+"/"});this.bkGrid=new SYNO.SDS.FileTaskMonitor.BKMonitorGrid({baseURL:b.jsConfig.jsBaseURL});this.mailGrid=new SYNO.SDS.FileTaskMonitor.MailMonitorGrid({baseURL:b.jsConfig.jsBaseURL});this.localGrid=new SYNO.SDS.FileTaskMonitor.LocalFileMonitorGrid({RELURL:b.jsConfig.jsBaseURL+"/"});this.downloadGrid=new SYNO.SDS.FileTaskMonitor.DownloadGrid({RELURL:b.jsConfig.jsBaseURL+"/"});var a={deferredRender:false,activeTab:0,plain:true,cls:"sds-filemonitor-gridpanel",items:[{itemId:"upload",title:_T("filebrowser","upload_queue"),layout:"fit",items:[this.uploadGrid]},{itemId:"download",title:_T("filebrowser","download_queue"),layout:"fit",items:[this.downloadGrid]},{itemId:"background",title:_T("background_task","background_task"),layout:"fit",items:[this.bkGrid]},{itemId:"mail",title:_T("mail","application_title"),layout:"fit",items:[this.mailGrid]},{itemId:"local",title:_WFT("filetable","filetable_local_file_operations"),layout:"fit",hidden:true,items:[this.localGrid]}]};if(_S("standalone")){Ext.apply(a,{border:false,region:"south",split:true,height:150,minHeight:50,collapsed:this.appInstance.getUserSettings("monitor_panel")===false?false:true,collapsible:true,animCollapse:false,titleCollapse:true,floatable:false,defaluts:{border:false},listeners:{scope:this,expand:this.setPanelState,collapse:this.setPanelState,afterrender:function(){this.mun(this.header,"click",this.toggleCollapse,this);this.header.setStyle("cursor","default")}}})}SYNO.SDS.App.FileTaskMonitorTabPanel.superclass.constructor.call(this,Ext.apply(a,b));this.mon(this,"expand",function(){this.doLayout()},undefined,{single:true});this.mon(this,"afterlayout",function(){var c=(SYNO.SDS.UserSettings.getProperty("SYNO.SDS.App.PersonalSettings.Instance","enablejava")===true)?true:((SYNO.SDS.UserSettings.getProperty("SYNO.SDS.App.PersonalSettings.Instance","enablejava")!==false)&&(_S("gpo_enable_java")==="yes"))?true:false;if(Ext.isChrome||Ext.isOpera||(Ext.isSafari&&Ext.isWindows)||!c){this.hideTabStripItem("local");if(!Ext.isChrome||_S("standalone")){this.hideTabStripItem("download")}}},undefined,{single:true})},getUploadGrid:function(){return this.uploadGrid},getDownloadGrid:function(){return this.downloadGrid},getBKGrid:function(){return this.bkGrid},getMailGrid:function(){return this.mailGrid},getLocalGrid:function(){return this.localGrid},setPanelState:function(){this.appInstance.setUserSettings("monitor_panel",this.collapsed)},activeTabPanel:function(a){this.expand(false);this.setActiveTab(a)}});SYNO.SDS.App.FileTaskMonitor=Ext.extend(SYNO.SDS.AppWindow,{pinable:false,constructor:function(a){this.monitorTabPanel=new SYNO.SDS.App.FileTaskMonitorTabPanel({jsConfig:this.jsConfig,appInstance:this.appInstance});this.uploadGrid=this.monitorTabPanel.getUploadGrid();this.downloadGrid=this.monitorTabPanel.getDownloadGrid();this.bkGrid=this.monitorTabPanel.getBKGrid();this.mailGrid=this.monitorTabPanel.getMailGrid();this.localGrid=this.monitorTabPanel.getLocalGrid();SYNO.SDS.App.FileTaskMonitor.superclass.constructor.call(this,Ext.apply(a,{dsmStyle:"v5",width:800,height:500,minWidth:300,minHeight:300,closable:true,maximizable:true,minimizable:false,toggleMinimizable:false,autoScroll:false,layout:"fit",plain:true,border:false,items:this.monitorTabPanel,showHelp:false}));this.mon(SYNO.SDS.StatusNotifier,"beforeunload",this.onBeforeUnload,this);this.on("activate",function(){this.uploadGrid.view.updateScroller();this.downloadGrid.view.updateScroller();this.bkGrid.view.updateScroller();this.mailGrid.view.updateScroller();this.localGrid.view.updateScroller()},this)},onOpen:function(a){SYNO.SDS.App.FileTaskMonitor.superclass.onOpen.apply(this,arguments)},onClose:function(){this.hide();return false},activeTabPanel:function(a){this.monitorTabPanel.setActiveTab(a)},getMonitorPanel:function(){return this.monitorTabPanel},onBeforeUnload:function(){if(SYNO.FileStation.MultiDownloadMgr){this.downloadGrid.pauseDownloadTask()}}});SYNO.SDS.App.FileTaskMonitor.Instance=Ext.extend(SYNO.SDS.AppInstance,{trayItem:[],constructor:function(){SYNO.SDS.App.FileTaskMonitor.Instance.superclass.constructor.apply(this,arguments)},initInstance:function(a){if(!this.trayItem[0]){this.trayItem[0]=new SYNO.SDS.FileTaskMonitor.BackgroundTaskTray.TrayItem({appInstance:this});this.addInstance(this.trayItem);this.trayItem[0].open(a)}if(!this.trayItem[1]){this.trayItem[1]=new SYNO.SDS.FileTaskMonitor.UploadTray.TrayItem({});this.trayItem[1].getUploadGrid=this.getUploadGrid.createDelegate(this);this.addInstance(this.trayItem[1]);this.trayItem[1].open(a)}if(!this.trayItem[2]){this.trayItem[2]=new SYNO.SDS.FileTaskMonitor.DownloadTray.TrayItem({});this.trayItem[2].getDownloadGrid=this.getDownloadGrid.createDelegate(this);this.addInstance(this.trayItem[2]);this.trayItem[2].open(a)}if(!this.trayItem[3]){this.trayItem[3]=new SYNO.SDS.FileTaskMonitor.MailTaskTray.TrayItem({appInstance:this});this.addInstance(this.trayItem);this.trayItem[3].open(a)}if(!this.window){this.window=new SYNO.SDS.App.FileTaskMonitor({appInstance:this});this.window.uploadGrid.getTray=this.getUploadTray.createDelegate(this);this.window.downloadGrid.getTray=this.getDownloadTray.createDelegate(this);this.addInstance(this.window)}},onOpen:function(a){this.initInstance(a);this.checkAlive()},onRequest:function(a){if(this.window){this.window.open(a)}if(this.trayItem[0]){this.trayItem[0].open(a)}if(this.trayItem[1]){this.trayItem[1].open(a)}if(this.trayItem[2]){this.trayItem[2].open(a)}if(this.trayItem[3]){this.trayItem[3].open(a)}},getLocalGrid:function(){return this.window.localGrid},getUploadGrid:function(){return this.window.uploadGrid},getUploadTray:function(){return this.trayItem[1]},getBKTray:function(){return this.trayItem[0]},getMailTray:function(){return this.trayItem[3]},getDownloadGrid:function(){return this.window.downloadGrid},getDownloadTray:function(){return this.trayItem[2]}});