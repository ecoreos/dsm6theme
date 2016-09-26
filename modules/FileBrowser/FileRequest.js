/* Copyright (c) INTEGRA EMPRESAS 2016. All rights reserved. */

Ext.define("SYNO.FileStation.SharingUploadQueue.GridPanel",{extend:"SYNO.FileStation.MonitorGrid",updateInterval:30*1000,constructor:function(a,c){this.updateDelay=3000;this.updateTask=null;this.updateTaskArr=[];this.tabId="upload";this.actionText=_WFT("filetable","filetable_upload");this.actingText=_WFT("filetable","filetable_uploading");this.action_failed=_T("filebrowser","filebrowser_upload_failed");this.add_filefoler_action_queue=_T("filebrowser","add_filefoler_upload_queue");this.add_file_action_queue=_T("filebrowser","add_file_upload_queue");this.add_action_queue=_T("filebrowser","add_upload_queue");this.action_filefoler_completed=_T("filebrowser","upload_filefoler_completed");this.action_file_completed=_T("filebrowser","upload_file_completed");this.action_completed=_T("filebrowser","filebrowser_upload_completed");this.webfm=c;var b={itemId:this.tabId,title:this.actionText,autoExpandColumn:"name",autoExpandMin:160};Ext.apply(b,a||{});SYNO.FileStation.SharingUploadQueue.GridPanel.superclass.constructor.call(this,b);this.updateTask=new Ext.util.DelayedTask(this.updateTaskFn,this);this.defineBehaviors()},defineBehaviors:function(){},getQueueSize:function(){return this.getStore().data.items.length},getAvailableTaskNumber:function(d){var c=this.getNBSuccessTasks();var b=this.getQueueSize();var a;if(this.maxTasks<(d+b)){if(0<(a=(b-c+d-this.maxTasks))){d-=a}this.cleanPrecedingSuccessTasks((d<c)?d:c)}return d},updateMenuStatus:function(a){},initColumnModel:function(){var a=new Ext.grid.ColumnModel([{id:"name",header:_WFT("filetable","filetable_file"),width:262,dataIndex:"name",renderer:this.nameRenderer},{header:_WFT("upload","files_progress"),width:100,dataIndex:"id",align:"left",renderer:this.progressRenderer.createDelegate(this)},{header:_WFT("upload","upload_list_status"),dataIndex:"id",align:"center",width:40,renderer:this.statusRenderer},{header:"",dataIndex:"id",align:"left",width:40,renderer:this.removeRenderer,listeners:{click:function(c,d,b){var e=d.getStore().getAt(b);this.removeOneTask(e)},scope:this}}]);return a},initCtxMenu:function(){var a=new SYNO.ux.Menu({items:[{itemId:"gc_remove",iconCls:"webfm-sharing-upload-icon webfm-delete-icon",text:_WFT("upload","upload_itm_remove"),handler:this.removeTasks,scope:this},"-",{itemId:"gc_clean",iconCls:"webfm-sharing-upload-icon webfm-clear-icon",text:_WFT("upload","upload_itm_clean"),handler:this.cleanAllSuccessTasks,scope:this}]});this.addManagedComponent(a);return a},onAllSelect:function(b,a){if(SYNO.FileStation.HTMLUploaderTaskMgr.blUploading){return}SYNO.FileStation.SharingUploadQueue.GridPanel.superclass.onAllSelect.call(this,b,a);this.removePreviousTask();this.startAvoidTimeout();this.fireEvent("onAllSelect")},removePreviousTask:function(){this.getStore().each(function(a){if("NOT_STARTED"!=a.get("status")){this.removeOneTask(a)}},this)},onProgress:function(b){if(!this.progressInfoArray[b.id]){return}var c=b.progress?b.progress:((b.bytesTotal===0)?100:b.bytesLoaded*100/b.bytesTotal);var d=String.format("{0}/s",b.rate?Ext.util.Format.fileSize(b.rate):"- B");var a="";if(b.timeLeft>-1){a=String.format("{0}",(b.timeLeft>1)?Date.fancyDuration(b.timeLeft):Date.fancyDuration(1))}var e=this.getProgressStatusText(b.curname,b.name);var f=this.getStore().getById(b.id);this.progressInfoArray[b.id].update(f,null,null,b.name||null,a,d,c,b.status||"PROCESSING",e.text,e.qtipText)},onProgressWithTime:function(a){if(!this.progressInfoArray[a.id]){return}var c=this.getProgressStatusText(a.curname,a.name);var b=a.progress;var d=this.getStore().getById(a.id);this.progressInfoArray[a.id].updateWithRate(d,null,null,a.name||null,null,a.byteswrite,b,a.status||"PROCESSING",c.text,c.qtipText,a.taskInfo)},getProgressStatusText:function(c,b){var a=(c)?c:b;var d=a;if(15<a.length){d=a.substring(0,6)+"..."+a.substring(a.length-10,a.length)}var e=this.actingText+": ";return{text:e+d,qtipText:e+a}},progressRenderer:function(b,g,c,i,a,h){var d=c.data;if(d.progress===false){return"..."}var j=Math.floor(d.progress);var e=new SYNO.SDS.Utils.ProgressBar({barWidth:90,barHeight:8,showValueText:false});var f=new Ext.XTemplate("{progressBar}",'<span id="progressbartext" class="progress-text" style="display: inline;"></span>');return f.apply({progressBar:e.fill(j)})},nameRenderer:function(d,f,e,l,c,j){var i=Ext.util.Format.htmlEncode(e.data.name);var a="/webman/modules/FileBrowser/",k=SYNO.SDS.UIFeatures.test("isRetina"),h=(k)?"2x":"1x";e.data.type=e.data.name.substring(e.data.name.lastIndexOf(".")+1);e.data.icon=SYNO.webfm.utils.getThumbName(e.data);f.attr='ext:qtip="'+Ext.util.Format.htmlEncode(i)+'"';var g=e.get("icon");var b='<div class="{0} webfm-sharing-upload-file-icon" style="background:url({1}) no-repeat; background-size: 16px 16px;"/>&nbsp;{2}</div>';return String.format(b,"",SYNO.SDS.UIFeatures.IconSizeManager.getIconPath(a+"images/"+h+"/files_ext/"+g,"Desktop",true),i)},statusRenderer:function(h,d,g,b,e,a){var f=Ext.util.Format.htmlEncode(Ext.util.Format.htmlEncode(g.data.statusQtip));var c="";if(0<=g.data.status.indexOf("FAIL")){c="webfm-sharing-upload-failed"}else{if(0<=g.data.status.indexOf("SUCCESS")){c="webfm-sharing-upload-success"}else{return}}return String.format('<div class="{0}" ext:qtip="{1}"></div>',c,f)},removeRenderer:function(g,c,f,b,d,a){var e=Ext.util.Format.htmlEncode(_WFT("upload","upload_itm_remove"));return String.format('<div class="webfm-sharing-upload-remove-icon" ext:qtip="{0}"></div>',e)},onCompleteRootFolder:function(a){this.startUpdateTask(a)},onComplete:function(a){SYNO.FileStation.SharingUploadQueue.GridPanel.superclass.onComplete.call(this,a);this.startUpdateTask(a);this.fireEvent("onComplete")},onAllComplete:function(){SYNO.FileStation.SharingUploadQueue.GridPanel.superclass.onAllComplete.apply(this,arguments);this.stopAvoidTimeout();this.getStore().sort("status","ASC");this.fireEvent("onAllComplete")},onError:function(d){if(!this.progressInfoArray[d.id]){return}var c=" ";if(d.response&&d.response.error&&d.response.error.code){c+=SYNO.webfm.utils.getWebAPIErr(false,d.response.error)}else{if(d.response&&d.response.errno&&d.response.errno.section&&d.response.errno.key){var g=d.response.errno.section,f=d.response.errno.key;c+=_WFT(g,f)||_T(g,f)}else{if(Ext.isString(d.response)){c+=d.response}else{c+=_WFT("common","commfail")}}}var b="",e="",a="";if(d.name||d.curname){e=(!d.curname)?d.name:d.curname;a=e;if(15<e.length){e=e.substring(0,6)+"..."+e.substring(e.length-10,e.length)}}b=(d.isSubFile||d.isSubFolder)?d.rootObj.name:d.name||d.curname||null;var h=this.getStore().getById(d.id);this.progressInfoArray[d.id].update(h,"failed.png",null,b,"","",(d.bytesLoaded===0)?0:null,d.status||"FAIL",e+c,a+c);if(d.isSubFile){d.rootObj.uploadByte+=d.byteswrite;h.data.lastwrite=0}},getUpdateTask:function(){this.updateIntervalTask=this.updateIntervalTask||this.addTask({id:"file_upload_update_grid_task",interval:this.updateInterval,run:this.updateTaskFn,scope:this});return this.updateIntervalTask},startUpdateTask:function(a){var b=this.getStore().data.last();if(a.id==b.data.id){this.stopUpdateTask();this.getUpdateTask().stop();this.updateTaskFn()}else{this.updateTask.delay(this.updateDelay);if(!this.getUpdateTask().running){this.getUpdateTask().start()}}},stopUpdateTask:function(){if(this.updateTask){this.updateTask.cancel()}},updateTaskFn:Ext.emptyFn});Ext.define("SYNO.FileStation.SharingUploadGrid.GridPanel",{extend:"SYNO.FileStation.SharingUploadQueue.GridPanel",constructor:function(a){Ext.apply(this,a||{});this.callParent(arguments)},defineBehaviors:Ext.emptyFn,onOpen:function(a){if(!this.progressInfoArray[a.id]){return}var c=new Date().getTime()/1000;this.oldProgress=0;var b=this.actingText;var d=this.getStore().getById(a.id);this.progressInfoArray[a.id].update(d,"uploading.png",null,d.get("name"),"","",0,a.status||"PROCESSING",b,b,c)},setFormUploader:function(){this.unHTML5Listener();this.onFormListener()},setHTML5Uploader:function(){this.unFormListener();this.onHTML5Listener()},onHTML5Listener:function(){if(SYNO.FileStation.HTMLUploaderTaskMgr){this.mon(this,"cancel",SYNO.FileStation.HTMLUploaderTaskMgr.removeOneTask,SYNO.FileStation.HTMLUploaderTaskMgr)}},unHTML5Listener:function(){if(SYNO.FileStation.HTMLUploaderTaskMgr){this.mun(this,"cancel",SYNO.FileStation.HTMLUploaderTaskMgr.removeOneTask,SYNO.FileStation.HTMLUploaderTaskMgr)}},onFormListener:function(){if(SYNO.FileStation.FormUploader){this.mon(this,"cancel",SYNO.FileStation.FormUploader.cancelEvent)}},unFormListener:function(){if(SYNO.FileStation.FormUploader){this.mun(this,"cancel",SYNO.FileStation.FormUploader.cancelEvent)}}});Ext.ns("SYNO.FileStation.SharingUpload");Ext.define("SYNO.SDS.App.SharingUpload.Application",{extend:"SYNO.SDS.AppInstance",appWindowName:"SYNO.SDS.App.SharingUpload.MainWindow",constructor:function(){this.callParent(arguments)}});Ext.define("SYNO.SDS.App.SharingUpload.MainWindow",{extend:"SYNO.SDS.AppWindow",html5UploadMgr:null,maxUploadTask:100,RELURL:"/webman/modules/FileBrowser/webfm/",blUseHTML5:SYNO.SDS.App.Uploader.Utils.isSupportHTML5Upload(),blAndroid:(/Android/i.test(navigator.userAgent)),blIOS:(/iPhone|iPad|iPod/i.test(navigator.userAgent)),constructor:function(a){this.AddMobileMeta();var b=this.fillConfig(a);this.callParent([b]);this.addEvents("onAfterCreateInputEl");this.bindEvents()},AddMobileMeta:function(){if(this.blAndroid){var a=document.createElement("meta");a.name="viewport";a.content="width=device-width, initial-scale=0.5, maximum-scale=0.5, user-scalable=no";document.getElementsByTagName("head")[0].appendChild(a)}},onOpen:function(a){this.completedTasks=0;this.request_name=a.request_name;this.request_info=a.request_info;this.limit_size=a.limit_size;this.onUpdateForm();this.callParent(arguments)},fillConfig:function(a){Ext.apply(this,a||{});var f=Ext.getBody().getViewSize().height;var d=(f-650)/3;var c=(0<d)?d:0;var e=(0<d)?(2*d):0;var b={width:"100%",height:"100%",collapsible:false,resizable:true,showHelp:false,cls:"webfm-sharing-upload-win",title:_T("tree","leaf_filebrowser"),items:[this.createSpacePanel(c),this.createMainPanel(),this.createCenterPanel(),this.createSouthPanel(),this.createSpacePanel(e)],plugins:this.initPlugins(200)};Ext.apply(b,a||{});return b},bindEvents:function(){this.mon(this,"afterlayout",this.initData,this,{single:true});this.mon(this,"onAfterCreateInputEl",this.onAfterCreateInputEl,this)},createSpacePanel:function(a){var b=new SYNO.ux.FormPanel({height:a});return b},createMainPanel:function(){this.mainPanel=new SYNO.ux.FormPanel({width:560,autoHeight:true,labelAlign:"top",useGradient:false,cls:"webfm-sharing-upload-main",items:[{xtype:"syno_displayfield",itemId:"request_name",htmlEncode:false,value:""},{xtype:"syno_displayfield",itemId:"request_info",htmlEncode:false,cls:"webfm-sharing-upload-info",value:""},{xtype:"syno_displayfield",itemId:"your_name",width:180,cls:"webfm-sharing-upload-uploader-name",value:_WFT("sharing","uploader_name")||"Your name"},{xtype:"syno_textfield",itemId:"uploader_name",width:180,hideLabel:true,allowBlank:false,maxLength:128,validator:function(a){if(a.include("/")||a.include(":")||a.startsWith("._")||a==="."||a===".."){return _WFT("error","error_reserved_name")}return true}}]});return this.mainPanel},createSouthPanel:function(){this.uploadOvwrBtn=new SYNO.ux.Button({btnStyle:"blue",itemId:"upload_ovwr_button",cls:"webfm-sharing-upload-btn",margins:"0 10 10 0",text:_T("filebrowser","filetable_upload"),handler:this.onStartUpload,hidden:!this.blUseHTML5,scope:this,disabled:true});this.southPanel=new SYNO.ux.FormPanel({cls:"webfm-sharing-upload-south",width:500,height:200,items:[{xtype:"container",layout:{type:"hbox",pack:"center",align:"middle"},items:[this.uploadOvwrBtn]},{xtype:"syno_displayfield",itemId:"msg_field",htmlEncode:false,width:500,value:"",hidden:true}]});return this.southPanel},createCenterPanel:function(){this.centerPanel=new Ext.Panel({width:500,height:341,layout:"card",activeItem:0,cls:"webfm-sharing-upload-center",items:[this.createUploadPanel(),this.createUploadGridPanel()]});return this.centerPanel},createUploadPanel:function(){this.uploadSelectBtn=new SYNO.ux.Button({btnStyle:"blue",itemId:"upload_select_button",text:_WFT("sharing","add_files"),cls:"webfm-sharing-upload-btn",scope:this});this.addFilePanel=new SYNO.ux.FormPanel({height:400,cls:"webfm-sharing-upload-addpanel",layout:{type:"vbox",pack:"center",align:"center"},items:[{xtype:"container",layout:{type:"hbox",pack:"center",align:"middle"},items:[{xtype:"box",autoEl:{tag:"img",src:Ext.BLANK_IMAGE_URL,height:80,width:96,cls:"webfm-sharing-upload-upload-icon"}}]},{xtype:"syno_displayfield",cls:"webfm-sharing-upload-drop-text",value:_WFT("sharing","drop_here")||"Drop file here"},{xtype:"syno_displayfield",cls:"webfm-sharing-upload-or-text",value:_WFT("sharing","upload_or")||"or"},this.uploadSelectBtn]});return this.addFilePanel},createUploadGridPanel:function(){this.addMoreFileBtn=new SYNO.ux.Button({itemId:"add_more_button",text:_WFT("upload","upload_open_file"),cls:"webfm-sharing-upload-add-more-btn",margins:"0 10 10 0",scope:this});this.uploadStatusField=new SYNO.ux.DisplayField({itemId:"upload-status",cls:"webfm-sharing-upload-status",value:"0/0 files uploaded"});this.uploadPanel=new SYNO.FileStation.SharingUploadGrid.GridPanel({height:400,cls:"webfm-sharing-upload-grid",RELURL:this.RELURL+"../",useGradient:false,bbar:[this.addMoreFileBtn,"->",this.uploadStatusField]});return this.uploadPanel},createFooter:function(){var b=document.createElement("footer");var a=(new Date()).getFullYear();b.addClassName("webfm-sharing-upload-footer");b.innerHTML='<div style="padding-right:10px;">Copyright @ '+a+" Synology Inc.</div>";document.body.appendChild(b)},onUpdateForm:function(){var c=this.mainPanel.getComponent("request_name");var a=this.mainPanel.getComponent("request_info");if(c){var b=Ext.util.Format.htmlEncode(this.request_name+" ");var d=String.format('<div class="webfm-sharing-upload-name">{0}</div><div class="webfm-sharing-upload-text">{1}</div>',b,_WFT("sharing","file_request_desc")||"send a file request");c.setValue(d)}if(a){var e=Ext.util.Format.htmlEncode(this.request_info);a.setValue(e);a.getEl().dom.setAttribute("ext:qtip",e)}},initPlugins:function(){this.plugins=[];if(this.blUseHTML5){this.html5UploadMgr=new SYNO.FileStation.Action.Uploader.HTML5UploaderMgr({owner:this,url:"../"+SYNO.API.currentManager.getBaseURL("SYNO.FileStation.Upload","upload",2),instantStart:false,btncfg:{ovwrbtncfg:this.uploadSelectBtn,skipbtncfg:this.addMoreFileBtn}});this.plugins.push(this.html5UploadMgr)}return this.plugins},initData:function(){this.createFooter();this.initUploader();this.mon(this.uploadPanel,"onAllSelect",this.onAllSelect,this);this.mon(this.uploadPanel,"onAllComplete",this.onAllComplete,this);this.mon(this.uploadPanel,"onComplete",this.onComplete,this);this.mon(this.uploadPanel,"cancel",this.onCancel,this);if(this.blUseHTML5){this.mon(SYNO.FileStation.HTMLUploaderTaskMgr.uploader,"onDragEnter",this.onDragEnter,this);this.mon(SYNO.FileStation.HTMLUploaderTaskMgr.uploader,"onDragEnd",this.onDragEnd,this);this.mon(SYNO.FileStation.HTMLUploaderTaskMgr.uploader,"onNameDuplicate",this.onNameDuplicate,this)}this.onHideShowSouthPanelItems(true)},initUploader:function(){if(this.blUseHTML5){this.uploadPanel.setHTML5Uploader();this.uploadPanel.setMaxTaskNumber(this.maxUploadTask);this.html5UploadMgr.onAddBtnClick(this)}else{if(!SYNO.FileStation.FormUploader){SYNO.FileStation.FormUploader=new SYNO.FileStation.Action.FormUpload({params:{url:"../"+SYNO.API.currentManager.getBaseURL("SYNO.FileStation.FormUpload","start",2),monitorGrid:this.uploadPanel}})}if(!SYNO.SDS.UploadTaskMgr){SYNO.SDS.UploadTaskMgr=new SYNO.SDS._UploadBackgroundTaskMgr();SYNO.SDS.UploadTaskMgr.loadUserSettings=Ext.emptyFn}this.uploadPanel.setFormUploader();this.uploadPanel.setMaxTaskNumber(20);this.mon(this.uploadSelectBtn,"click",this.onFormUpload,this);this.mon(this.addMoreFileBtn,"click",this.onFormUpload,this)}SYNO.SDS.UserSettings.getProperty=Ext.emptyFn;SYNO.SDS.UserSettings.setProperty=Ext.emptyFn},onFormUpload:function(){if(!this.mainPanel.form.isValid()){this.setMsgField(_WFT("common","forminvalid"),true);return}else{this.setMsgField("")}var a=new SYNO.FileStation.UploadDialog({webfm:this,owner:this,UploadCGI:"../"+SYNO.API.currentManager.getBaseURL("SYNO.FileStation.FormUpload","start",2)});var b=this.mainPanel.form.findField("uploader_name").getValue();a.setParameters(this.getUploadPath(),b);a.load(true)},prepareUploadParam:function(){var c=0;var b=SYNO.FileStation.HTMLUploaderTaskMgr.getTaskSize();var e=this.mainPanel.form.findField("uploader_name").getValue();var d=SYNO.FileStation.HTMLUploaderTaskMgr.getUploadingTaskIndex();for(c=d;c<b;c++){var a=SYNO.FileStation.HTMLUploaderTaskMgr.taskList.get(c);a.params.sharing_id=_S("sharing_id");a.params.uploader_name=e;a.params.overwrite=true}},onStartUpload:function(){if(!this.mainPanel.form.isValid()){this.setMsgField(_WFT("common","forminvalid"),true);return}else{this.setMsgField("")}this.prepareUploadParam();this.setFormDisabled([true,true,true]);this.blUploading=true;SYNO.FileStation.HTMLUploaderTaskMgr.uploader.uploadNext()},onAfterCreateInputEl:function(a){a.setAttribute("accept","*/*")},onNameDuplicate:function(){return false},onDragEnter:function(){this.addFilePanel.addClass("webfm-sharing-upload-addpanel-dragover");return false},onDragEnd:function(){this.addFilePanel.removeClass("webfm-sharing-upload-addpanel-dragover")},onAllSelect:function(){var a=this.uploadPanel.getStore().getCount();this.centerPanel.getLayout().setActiveItem(1);this.setFormDisabled([false,false,false]);this.onHideShowSouthPanelItems(false);this.completedTasks=0;this.updateUploadStatus(0,a);this.updateGridLine()},onComplete:function(){var a=this.uploadPanel.getStore().getCount();this.updateUploadStatus(++this.completedTasks,a)},onCancel:function(c,a){var b=this.uploadPanel.getStore().getCount();if(a==="SUCCESS"&&0<this.completedTasks){this.completedTasks-=1}this.updateUploadStatus(this.completedTasks,b-1);this.updateGridLine()},onAllComplete:function(){this.setFormDisabled([false,true,false]);this.blUploading=false},onUploadFolderError:function(){this.getMsgBox().alert("",_WFT("upload","no_folder_upload_action"));this.addFilePanel.removeClass("webfm-sharing-upload-addpanel-dragover")},getUploadInstance:function(){return this.uploadPanel},getUploadPath:function(){return""},getCurrentDir:function(){return this.getUploadPath()},onCheckVFSAction:function(){return true},onCheckPrivilege:function(){return true},updateUploadStatus:function(a,b){var c=String.format("{0}/{1}",a,b);c=String.format(_WFT("sharing","sharing_upload_status")||"{0} files uploaded",c);this.uploadStatusField.setValue(c)},updateGridLine:function(){var b=this.uploadPanel.getView();var c=b.getFleXcrollInfo(b.scroller.dom);var a=Ext.query(".x-grid3-scroller")[0];if(Ext.isEmpty(c)||!c.hasVerticalScroll){a.addClassName("webfm-sharing-upload-line")}else{a.removeClassName("webfm-sharing-upload-line")}},setFormDisabled:function(a){this.uploadSelectBtn.setDisabled(a[0]);this.addMoreFileBtn.setDisabled(a[0]);this.uploadOvwrBtn.setDisabled(a[1]);var b=this.mainPanel.form.findField("uploader_name");b.setDisabled(a[2])},onHideShowSouthPanelItems:function(a){if(a){this.uploadOvwrBtn.hide()}else{this.uploadOvwrBtn.show()}},setMsgField:function(e,b){var a=this.southPanel.form.findField("msg_field");if(!Ext.isEmpty(e)){var c=(b)?"webfm-sharing-upload-text-error":"webfm-sharing-upload-text-success";var d=String.format('<div class="{0}">{1}</div>',c,e);a.setValue(d);a.show();Ext.defer(function(){a.hide()},3000)}else{a.hide()}}});