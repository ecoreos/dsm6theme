/* Copyright (c) 2016 Synology Inc. All rights reserved. */

Ext.namespace("SYNO.SDS.ControlPanel.Share");Ext.apply(SYNO.SDS.ControlPanel.Share,{MAX_ITEMS_PER_PAGE:50,URL_SHAREMAN_HANDLE:"modules/shareman.cgi",SHARE_INFO:1,SHARE_PERMISSION:2,NFS_PRIVILEGE:3,isHomes:function(b){var a=b.toLowerCase();if("homes"===a){return true}return false},isGlusterVol:function(a){if(a[0]==="G"){return true}return false},passLenValidator:function(a){if(this.getItemCt&&this.getItemCt()&&!this.getItemCt().isDisplayed()){return true}if(-1!==a.indexOf("=")||-1!==a.indexOf(",")||-1!==a.indexOf(":")){return _T("error","error_bad_field")}if(a.length<8){return String.format(_T("error","error_passlen"),"8")}if(a.length>64){return String.format(_T("error","error_passlen_too_long"),"64")}return true},passDecryptValidator:function(a){if(this.getItemCt&&this.getItemCt()&&!this.getItemCt().isDisplayed()){return true}if(-1!==a.indexOf("=")||-1!==a.indexOf(",")){return _T("error","error_bad_field")}if(a.length<8){return String.format(_T("error","error_passlen"),"8")}if(a.length>64){return String.format(_T("error","error_passlen_too_long"),"64")}return true},getShareRecordInstance:function(b){var c=Ext.data.Record.create([{name:"name",mapping:"name"},{name:"name_org",mapping:"name"},{name:"description",mapping:"description"},{name:"is_hidden",mapping:"is_hidden"},{name:"is_disable_list",mapping:"is_disable_list"},{name:"is_disable_modify",mapping:"is_disable_modify"},{name:"is_disable_download",mapping:"is_disable_download"},{name:"encryption",mapping:"encryption"},{name:"enc_passwd",mapping:"enc_passwd"},{name:"enc_auto_mount",mapping:"enc_auto_mount"},{name:"vol_id",mapping:"vol_id"}]);var a=new c(b);return a},getNFSRuleRecordInstance:function(b){var c=Ext.data.Record.create([{name:"host_position"},{name:"access_right"},{name:"root_mapping"},{name:"async"}]);var a=new c(b);return a},ExportKeyIframe:function(d,b){var a=b.getAbsoluteURL(SYNO.SDS.ControlPanel.Share.URL_SHAREMAN_HANDLE)+"?action=exportkey&sharename="+d;var c=document.getElementById("syno-frame-exportkey");a=Ext.urlAppend(a);if(!c){c=Ext.DomHelper.append(document.body,{tag:"iframe",id:"syno-frame-exportkey",frameBorder:0,width:0,height:0,css:"display: none; visibility: hidden; height: 1px;",src:a})}else{c.src=a}},VolumeRender:function(a){if("usb"===a){return _T("status","status_usb")}else{if("sata"===a){return _T("status","status_sata")}else{if("G"===a[0]){return _T("status","status_gluster")}}}return SYNO.SDS.ControlPanel.Share.VolIDRender(a)},VolIDRender:function(c){var b=SYNO.SDS.ControlPanel.Share.ParseID(c);var a="";if("ebox"==b.location){a=String.format("{0} {1} ({2})",_T("volume","volume"),b.id,_T("volume","volume_disk_source_ebox"))}else{a=String.format("{0} {1}",_T("volume","volume"),b.id)}return a},ParseID:function(b){var a={id:0,location:""};if(!isNaN(b)){a.id=b;a.location="internal"}else{if("X"==b.charAt(0)){a.id=b.substring(1);a.location="ebox"}else{a.id=b;a.location="internal"}}return a},isCustomizable:function(a){return(a.is_aclmode===true&&a.encryption!==1)}});Ext.define("SYNO.SDS.Share.FilterButton",{extend:"SYNO.ux.Button",constructor:function(c){var d="filter_";var e="permission_type";var a=[{checked:true,group:e,itemId:d+"all",text:_T("common","show_all")},{group:e,itemId:d+"any",text:_T("share","share_permission_any")},{group:e,itemId:d+"deny",text:_T("share","share_permission_none")},{group:e,itemId:d+"writable",text:_T("share","share_permission_writable")},{group:e,itemId:d+"readonly",text:_T("share","share_permission_readonly")}];if(!c.hideCustom){a.push({group:e,itemId:d+"custom",text:_T("share","share_permission_acl")})}var b=Ext.apply({currentFilter:"all",itemIdPrefix:d,tooltip:_T("common","filter_label_text"),cls:"syno-share-filter-btn",menu:{cls:"syno-ux-searchfield-menu",items:a,defaults:{checked:false},listeners:{itemclick:this.onItemClick,scope:this}}},c);this.callParent([b])},onItemClick:function(b,a){this.currentFilter=b.itemId.substr(this.itemIdPrefix.length);this.fireEvent("filterChanged",this.currentFilter)},getMenuClass:function(){return""},getFilterType:function(){return this.currentFilter},removeItemFromMenu:function(a){this.menu.remove(this.itemIdPrefix+a)}});Ext.namespace("SYNO.SDS.Share");SYNO.SDS.Share.renderCheckBox=function(g,d,a){var f=("disabled"===g?"disabled":g?"checked":"unchecked"),c=(f==="disabled")?false:(f==="checked"),h=(a)?a.id+"_"+this.dataIndex:Ext.id(),e=(f==="disabled")?_T("common","disabled"):_JSLIBSTR("uicommon","enable_column_"+f),b=(f==="disabled");d=d||{};d.cellAttr=String.format('aria-label="{0} {1}" aria-checked="{2}" aria-disabled="{3}" role="checkbox"',Ext.util.Format.stripTags(this.orgHeader),e,c,b);return String.format('<div class="syno-ux-grid-enable-column-{0}" id="{1}"></div>',f,h)};Ext.define("SYNO.SDS.Share.InfoColumn",{extend:"Ext.grid.Column",constructor:function(b){var a=Ext.apply({header:" ",width:30,align:"center",renderer:function(c){return(c)?String.format('<div class="syno-admincenter-share-info" ext:qtip="{0}"></div>',_T("share","share_permission_complicated")):""}},b);this.callParent([a])}});Ext.define("SYNO.SDS.Share.CustomColumn",{extend:"SYNO.ux.EnableColumn",constructor:function(b){var a=Ext.apply({header:_T("share","share_permission_acl"),shareRecord:undefined,ownerGrid:undefined,userId:undefined,applyCallback:undefined,applyTarget:this,width:120,align:"center",disableSelectAll:true,renderer:function(g,d,c){var f=(this.shareRecord)?this.shareRecord.data:c.data;var e=false;if(Ext.isFunction(this.ownerGrid.isAdminGroupMember)){e=this.ownerGrid.isAdminGroupMember()}else{if(Ext.isDefined(this.ownerGrid.owner.isAdminGroup)){e=this.ownerGrid.owner.isAdminGroup}else{e=c.get("is_admin")}}if(!SYNO.SDS.ControlPanel.Share.isCustomizable(f)||e){g="disabled"}return SYNO.SDS.Share.renderCheckBox.call(this,g,d,c)}},b);this.callParent([a])},onCellClick:function(c,d,a){var b=false;if(Ext.isFunction(c.isAdminGroupMember)){b=c.isAdminGroupMember()}else{if(Ext.isDefined(c.owner.isAdminGroup)){b=c.owner.isAdminGroup}else{b=c.getSelectionModel().getSelected().get("is_admin")}}if(b){return}if(!Ext.isFunction(this.ownerGrid.isChanged)||!Ext.isFunction(this.ownerGrid.getWebAPI)||!Ext.isFunction(this.ownerGrid.getShareInfoForS2S)){console.log('One of "isChanged" and "getWebAPI" and "getShareInfoForS2S" is missing!')}if(!Ext.isFunction(this.ownerGrid.isChanged)||!Ext.isFunction(this.ownerGrid.getWebAPI)||!this.ownerGrid.isChanged()){this.initEditorDialog(c,d);return}this.ownerGrid.owner.getMsgBox().confirm(this.ownerGrid.title,_T("share","share_save_chg_before_reload"),function(e){if(e!=="yes"){return}var f=this.ownerGrid.getWebAPI();if(f.length===0){console.log("Permission is changed but getWebAPI returns nothing!");this.initEditorDialog(c,d);return}var g=Ext.apply(f[0],{scope:this,callback:function(k,j,i,h){this.owner.clearStatusBusy();if(k){this.ownerGrid.getStore().commitChanges();this.initEditorDialog(c,d)}else{this.owner.getMsgBox().alert(this.ownerGrid.title,SYNO.API.Erros.core[j.code]||_T("common","commfail"))}}});SYNO.SDS.Utils.S2S.confirmIfSyncShareAffected(false,this.ownerGrid.getShareInfoForS2S(),{dialogTitle:this.ownerGrid.title,dialogMsg:_T("s2s","s2s_warn_share_change_priv"),dialogOwner:this.owner,continueHandler:function(){this.owner.setStatusBusy({text:_T("common","saving")});this.owner.sendWebAPI(g)},abortHandler:Ext.EmptyFn,scope:this})},this)},initEditorDialog:function(a,c){var b=(this.shareRecord)?this.shareRecord:a.getSelectionModel().getSelected();if(!Ext.isObject(b)||!b.data||!SYNO.SDS.ControlPanel.Share.isCustomizable(b.data)){return}b=b.data;if(this.userId){this.launchEditorDialog(b);return}this.owner.sendWebAPI({api:"SYNO.Core.User",version:1,method:"get",params:{name:this.owner._S("user")},scope:this,callback:function(g,f,e,d){if(g){this.userId=f.users[0].uid;this.launchEditorDialog(b)}else{this.owner.getMsgBox().alert(_T("tree","leaf_user"),_T("user","failed_load_user"))}}})},launchEditorDialog:function(c){var b=c.vol_path||c.share_path.replace("/"+c.name,"");var a=new SYNO.FileStation.PropertyDialog({title:String.format(_T("share","share_edit_title"),c.name),module:this.module,owner:this.owner,hideAdvPermPanel:true,hideInfoPanel:true,privilegeType:"aclPrivilege",userId:this.userId,openConfig:this.ownerGrid.getOpenConfig(),source:"remote",rec:[new Ext.data.Record({name:c.name,is_aclmode:c.is_aclmode,isshare:true,is_sync_share:c.is_sync_share,isdir:true,vol_path:b,real_path:c.share_path,filename:c.name,file_id:"/"+c.name})]});a.mon(a,"callback",this.onSaveProperty,this,{single:true});a.load()},onSaveProperty:function(d,e,b){function c(h,f){var g=_WFT("property","error_save_property");if(!h){if(Ext.isDefined(f.code)){g=SYNO.API.getErrorString(f.code)}this.owner.getMsgBox().alert(_WFT("filetable","filetable_properties"),g);return true}return false}if(c.call(this,e,b)){return}if(Ext.isDefined(b.task_id)){this.owner.setStatusBusy({text:_T("common","saving")});var a=this.owner.pollReg({webapi:{api:"SYNO.Core.ACL",method:"status",version:1,params:{task_id:b.task_id}},interval:3,immediate:true,status_callback:function(h,f,g){if(!h||(h&&f.finished===true)){this.owner.pollUnreg(a);this.owner.clearStatusBusy();if(Ext.isFunction(this.applyCallback)&&Ext.isObject(this.applyTarget)){this.applyCallback.call(this.applyTarget)}c.call(this,h,f)}},scope:this})}}});Ext.define("SYNO.SDS.Share.ShareGrid",{extend:"SYNO.ux.GridPanel",DEFAULT_ROLES:[["system",_T("share","share_system_user")],["local_user",_T("share","share_local_user")]],GROUP_ROLES:[["local_group",_T("share","share_local_group")]],DOMAIN_ROLES:[["domain_user",_T("share","share_domain_user")],["domain_group",_T("share","share_domain_group")]],LDAP_ROLES:[["ldap_user",_T("share","ldap_user")],["ldap_group",_T("share","ldap_group")]],constructor:function(e){this.pollingId=undefined;this.pageSize=50;this.store=this.createStore(e);this.showHomesWarning=true;var d={header:_T("share","share_permission_readonly"),dataIndex:"is_readonly",id:"is_readonly",disableSelectAll:true,width:120};if(!e.isAdvancedMode){d=Ext.apply(d,{isIgnore:function(g,f){return(f.get("is_admin")&&this.isAclMode)},renderer:function(i,h,f){var g=this.scope;if(f.get("is_admin")&&g.isAclMode){i="disabled"}return SYNO.SDS.Share.renderCheckBox.call(this,i,h,f)}})}this.colRo=new SYNO.ux.EnableColumn(d);this.colRw=new SYNO.ux.EnableColumn({header:_T("share","share_permission_writable"),dataIndex:"is_writable",id:"is_writable",disableSelectAll:true,width:120});this.colNa=new SYNO.ux.EnableColumn({header:_T("share","share_permission_none"),dataIndex:"is_deny",id:"is_deny",disableSelectAll:true,width:120});var c=[{id:"name",header:_T("share","share_name"),dataIndex:"name",width:100,align:"left",renderer:function(g,f){if(g.toLowerCase()==="ftp"){return"Anonymous FTP/WebDAV"}return g}},this.colNa,this.colRw,this.colRo];var a=[this.colRo,this.colRw,this.colNa];if(e.colCu){this.colCu=e.colCu;c.push(this.colCu);a.push(this.colCu)}var b=Ext.apply({title:_T("share","share_rights"),layout:"fit",cls:"without-dirty-red-grid",store:this.store,width:700,autoExpandMax:160,autoExpandMin:160,autoExpandColumn:"name",enableColumnMove:false,enableHdMenu:false,hideMode:"offsets",colModel:new Ext.grid.ColumnModel({defaults:{align:"center"},columns:c}),selModel:new Ext.grid.RowSelectionModel({singleSelect:true}),plugins:a,tbar:this.createTopToolbar(e),bbar:new SYNO.ux.PagingToolbar({store:e.store||this.store,pageSize:this.pageSize,displayInfo:true})},e);this.callParent([b]);this.mon(this,"cellclick",this.onGridCellClick,this);this.mon(this,"afterlayout",function(f,g){this.mon(this.getSelectionModel(),"spacepressed",this.onGridCellSpacePressed,this)},this,{single:true});this.mon(this,"afterlayout",function(f,g){f.getView().updateScroller()},this);this.mon(this.typeFilter,"filterChanged",this.onTypeFilterChange,this);this.mon(this.colNa,"click",function(f,g,j,h){var i=g.getStore().getAt(j);if(this.showHomesWarning&&"homes"===this.shareRecord.get("name").toLowerCase()&&true===this.shareRecord.get("is_aclmode")&&true===i.get("is_deny")){this.owner.getMsgBox().alert(this.title,_T("share","warn_deny_rule_homes"));this.showHomesWarning=false}},this)},createStore:function(a){return new SYNO.API.JsonStore({autoDestroy:true,remoteSort:true,appWindow:a.owner,api:"SYNO.Core.Share.Permission",method:"list",version:1,baseParams:{offset:0,limit:this.pageSize,is_unite_permission:a.isAdvancedMode||false},listeners:{exception:{scope:this,fn:this.onStoreException},beforeload:{scope:this,fn:this.onBeforeLoad},load:{scope:this,fn:this.onLoad}},root:"items",idProperty:"name",totalProperty:"total",fields:["name","is_writable","is_readonly","is_deny","is_custom","is_admin"]})},createTopToolbar:function(a){var b=new SYNO.ux.Toolbar({items:[{xtype:"syno_combobox",itemId:"roleFilter",valueField:"role",displayField:"display",store:{xtype:"arraystore",autoDestroy:true,fields:["role","display"]},mode:"local",triggerAction:"all",editable:false,forceSelection:true,width:260,listeners:{beforeselect:{scope:this,fn:this.onRoleFilterSelect}}},"->",{xtype:"syno_displayfield",value:_T("helptoc","directory_service_domain")+": ",hidden:true,itemId:"domainListLabel"},{xtype:"syno_combobox",itemId:"domainFilter",valueField:"value",displayField:"domain",store:{xtype:"arraystore",autoDestroy:true,fields:["domain","value","comment"]},hidden:true,resizable:true,mode:"local",triggerAction:"all",editable:false,value:"",forceSelection:true,tpl:'<tpl for="."><div ext:qtip="{comment}" class="x-combo-list-item">{domain}</div></tpl>',listeners:{beforeselect:{scope:this,fn:this.onDomainFilterSelect}}},this.nameFilter=new SYNO.ux.TextFilter({iconStyle:"search",itemId:"search",emptyText:_T("share","share_filter_text"),store:this.store,queryParam:"substr",pageSize:this.pageSize}),this.typeFilter=new SYNO.SDS.Share.FilterButton({style:"margin-left: 6px",hideCustom:a.hideCustomColumn})]});this.roleFilter=b.getComponent("roleFilter");this.domainFilter=b.getComponent("domainFilter");this.domainListLabel=b.getComponent("domainListLabel");return b},onGridCellSpacePressed:function(f,a){var c=f.grid;var b=c.getStore();var e=b.indexOf(f.getSelected());var d=f.getColIdx();if(0<=d){this.onGridCellClick(c,e,d,a)}},onGridCellClick:function(a,f,e,i){var c=a.getStore().getAt(f);var h=a.getColumnModel().getDataIndex(e);var b=function(j){return(j==="is_readonly"||j==="is_writable"||j==="is_deny")};var d=function(l,j,k){if("is_readonly"!==l){j.set("is_readonly",false);k.colRo.checkSelectAll(k.getStore())}if("is_writable"!==l){j.set("is_writable",false);k.colRw.checkSelectAll(k.getStore())}if("is_deny"!==l){j.set("is_deny",false);k.colNa.checkSelectAll(k.getStore())}if("is_custom"!==l){j.set("is_custom",false)}};if(b(h)){if(c.get(h)===true){d(h,c,a)}else{var g=c.getChanges();if(g.hasOwnProperty("is_custom")){c.set("is_custom",!g.is_custom)}}}},isChanged:function(){return(this.store.getModifiedRecords().length!==0)},getShareInfoForS2S:function(){return{name:this.shareRecord.get("name"),is_sync_share:this.shareRecord.get("is_sync_share"),permissions:this.getModifiedPermissions(),no_check_permission:false}},getModifiedPermissions:function(){var b=this.getWebAPI();var a=[];if(b.length===1){Ext.each(b[0].params.permissions,function(c){a.push({is_readonly:c.is_readonly,is_deny:c.is_deny,is_writable:c.is_writable,is_custom:c.is_custom?true:false})})}return a},onStoreException:function(d,e,f,c,b,a){this.owner.clearStatusBusy();if(b.isTimeout){this.owner.getMsgBox().alert(this.title,_T("error","error_timeout"))}else{SYNO.Debug("Store exception: options:",d,e,f,c,b,a);this.owner.getMsgBox().alert(this.title,SYNO.API.Erros.core[b.code]||_T("common","commfail"))}},onBeforeLoad:function(a,b){this.owner.setStatusBusy({text:_T("common","loading")});if(!this.isChanged()){return true}this.owner.clearStatusBusy();this.owner.getMsgBox().confirm(this.title,_T("share","share_save_chg_before_reload"),function(c){if(c==="yes"){SYNO.SDS.Utils.S2S.confirmIfSyncShareAffected(false,this.getShareInfoForS2S(),{dialogTitle:this.title,dialogMsg:_T("s2s","s2s_warn_share_change_priv"),dialogOwner:this.owner,continueHandler:function(){var d=this.getWebAPI();this.sendApplyRequest(d,b)},abortHandler:function(){this.store.rejectChanges();this.store.load(b)},scope:this})}else{this.store.rejectChanges();this.store.load(b)}},this);return false},onLoad:function(){this.prevRole=undefined;this.owner.clearStatusBusy();this.getSelectionModel().selectFirstRow()},onException:function(d,e,f,c,b,a){this.owner.clearStatusBusy();if(b.code===3203){this.getView().el.mask(_T("directory_service","warr_db_not_ready"));this.restartPolling();return}this.owner.getMsgBox().alert(this.title,SYNO.API.Erros.core[b.code]||_T("common","commfail"))},onRoleFilterSelect:function(b,a){var c=a.data.role;this.prevRole=b.getValue();this.store.baseParams.user_group_type=c;if(c==="domain_user"||c==="domain_group"){this.showDomainFilter(true)}else{this.showDomainFilter(false)}this.stopPolling();this.store.load({params:{offset:0}})},onDomainFilterSelect:function(b,a){this.store.baseParams.domain=a.data.value;this.store.load({params:{offset:0}})},onTypeFilterChange:function(a){this.store.baseParams.permission_type=a;this.store.load({params:{offset:0}});this.typeFilter.focus()},showDomainFilter:function(a){this.domainListLabel.setVisible(a);this.domainFilter.setVisible(a)},loadPermissions:function(i,f){this.shareRecord=i;this.colRo.isAclMode=i.get("is_aclmode");if(this.colCu){this.colCu.shareRecord=i}var g=SYNO.API.Util.GetValByAPI(f,"SYNO.Core.Directory.LDAP","get","enable_client");var b=(2702===SYNO.API.Util.GetValByAPI(f,"SYNO.Core.Directory.LDAP","get","error"));var h=SYNO.API.Util.GetValByAPI(f,"SYNO.Core.Directory.Domain","get","enable_domain");var d=SYNO.API.Util.GetValByAPI(f,"SYNO.Core.Directory.Domain","test_dc","test_join_success");var c=this._D("supportdomain")==="yes"?SYNO.API.Util.GetValByAPI(f,"SYNO.Core.Directory.Domain","get_domain_list","domain_list"):false;var a=this.roleFilter.getStore();var l=this.domainFilter.getStore();var j=[];a.loadData(this.DEFAULT_ROLES);a.loadData(this.GROUP_ROLES,true);if(g&&b){a.loadData(this.LDAP_ROLES,true)}if(h&&d){a.loadData(this.DOMAIN_ROLES,true);Ext.each(c,function(m){if(typeof m==="object"){j.push(m)}else{j.push([m,m,m])}},this);l.loadData(j);if(!this.domainFilter.getValue()){this.domainFilter.setValue(j[0][1]||"")}this.store.baseParams.domain=this.domainFilter.getValue();if(1===SYNO.API.Util.GetValByAPI(f,"SYNO.Core.Directory.Domain","get","manage_mode")){this.domainListLabel.setValue(_T("directory_service","organizational_unit")+": ")}else{this.domainListLabel.setValue(_T("helptoc","directory_service_domain")+": ")}}this.showDomainFilter(false);this.roleFilter.setValue("local_user");this.nameFilter.reset();if(Ext.isDefined(this.colCu)&&i.get("is_aclmode")!==true){var k=this.getColumnModel().getIndexById("is_custom");if(k>=0){this.getColumnModel().setHidden(k,true)}this.typeFilter.removeItemFromMenu("custom")}var e=this.getColumnModel().getIndexById("is_writable");if(i.get("readonly")){this.getColumnModel().setHidden(e,true)}this.store.baseParams.name=i.get("name");this.store.baseParams.user_group_type=this.roleFilter.getValue();this.store.load()},getOpenConfig:function(){var a=this.getSelectionModel().getSelected().get("name");var c="user";var b=this.roleFilter.getValue();if(b==="local_group"||b==="domain_group"||b==="ldap_group"){c="group"}else{if(a==="http"){c="group"}}return{userName:a,userType:c}},getWebAPI:function(){var a=[];Ext.each(this.store.getModifiedRecords(),function(c){a.push({name:c.data.name,is_readonly:c.data.is_readonly,is_writable:c.data.is_writable,is_deny:c.data.is_deny,is_custom:c.data.is_custom})},this);var b={name:this.shareRecord.get("name"),user_group_type:this.prevRole||this.roleFilter.getValue(),permissions:a};if(this.isAdvancedMode){b.is_share_permission=true}return(a.length===0)?[]:[{api:"SYNO.Core.Share.Permission",method:"set",version:1,params:b}]},sendApplyRequest:function(a,b){this.owner.setStatusBusy({text:_T("common","saving")});this.owner.sendWebAPI(Ext.apply(a[0],{scope:this,callback:function(d,c){this.owner.clearStatusBusy();if(d){this.store.commitChanges();this.store.load(b);if(c){if(c.is_ftp_anonymous_chroot_conflict){this.confirmToShowFTPAdvancedSetting()}}return}this.owner.getMsgBox().alert(this.title,SYNO.API.Erros.core[c.code]||_T("common","commfail"))}}))},confirmToShowFTPAdvancedSetting:function(a){this.owner.setStatusBusy({text:_T("common","loading")});this.sendWebAPI({api:"SYNO.Core.FileServ.FTP.Security",method:"set",params:{anonymous_chroot:false,anonymous_chroot_share:""},version:1,scope:this,callback:function(d,c,b){this.owner.clearStatusBusy();this.owner.getMsgBox().confirm(this.title,_T("ftp","ftp_cfrm_reset_anonymous_chroot"),function(e){if(Ext.isObject(a)&&a.closeDialog===true){this.owner.close()}if(e==="yes"){this.owner.close();this.findAppWindow().startModule("SYNO.SDS.AdminCenter.FileService.Main",{tab:"ftp",launchAdvanceDialog:true})}},this)}})},restartPolling:function(){if(this.pollingId){return}var a=this;var b=function(c,d){if(d>=c.length){a.stopPolling();return}a.sendWebAPI({api:"SYNO.Core.Directory.Domain",method:"update_status",version:1,params:{task_id:c[d]},scope:a,callback:function(h,g,f,e){if(h&&g.status==="updating"){a.startPolling(f.task_id);return}b(c,d+1)}})};this.pollList({task_id_prefix:"DomainUpdate",extra_group_tasks:["admin"],scope:this,callback:function(f,e,d,c){if(f&&Ext.isArray(e.admin)){b(e.admin,0)}}})},startPolling:function(a){this.pollingId=this.pollReg({webapi:{api:"SYNO.Core.Directory.Domain",method:"update_status",version:1,params:{task_id:a}},interval:5,immediate:true,scope:this,status_callback:function(e,d,c,b){if(e&&d.status==="finish"){this.stopPolling();this.store.load()}}})},stopPolling:function(){if(this.pollingId){this.pollUnreg(this.pollingId);this.pollingId=undefined;this.getView().el.unmask()}}});Ext.define("SYNO.SDS.Share.AdvanceForm",{extend:"SYNO.ux.FormPanel",constructor:function(b){var a=Ext.apply({title:_T("share","share_advance_permissions"),trackResetOnLoad:true,items:[{xtype:"syno_fieldset",title:_T("share","share_advanced_settings"),id:this.advSettingsSet=Ext.id(),collapsible:true,items:[{xtype:"syno_displayfield",value:_T("share","share_advance_privileges_desc")},{xtype:"syno_checkbox",name:"disable_list",boxLabel:_T("share","share_disable_list")},{xtype:"syno_checkbox",itemId:"disable_modify",name:"disable_modify",boxLabel:_T("share","share_disable_modify")},{xtype:"syno_checkbox",name:"disable_download",boxLabel:_T("share","share_disable_download")}]},{xtype:"syno_fieldset",title:_T("share","share_reset_privileges"),collapsible:true,itemId:"advFieldSet",items:[{xtype:"syno_displayfield",value:_T("share","share_reset_privileges_desc")},{xtype:"syno_checkbox",name:"unite_permission",boxLabel:_T("share","share_reset_description")},{xtype:"syno_button",id:this.btnAdvance=Ext.id(),indent:1,text:_T("share","share_permission_button"),scope:this,handler:function(){var c=new SYNO.SDS.Share.PermissionDialog({owner:this.owner,module:this.module,hideCustomColumn:true,isAdvancedMode:true});c.loadPermissionData(this.shareRecord)}}]}]},b);this.callParent([a]);this.mon(this,"afterlayout",function(){var c;c=new SYNO.SDS.Utils.EnableCheckGroup(this.getForm(),"unite_permission",[this.btnAdvance])},this,{single:true})},loadPermissions:function(a,c){var b=SYNO.SDS.ControlPanel.Share;if(b.isHomes(a.get("name"))){Ext.getCmp(this.advSettingsSet).hide()}this.shareRecord=a;this.getForm().setValues(SYNO.API.Util.GetValByAPI(c,"SYNO.Core.Share","get"));if(a.get("readonly")){this.getForm().findField("disable_modify").disable()}if(!a.get("is_aclmode")){this.getComponent("advFieldSet").hide()}},isAdvPermissionDisabled:function(){var a=this.getForm().findField("unite_permission");return(a.isDirty()&&a.getValue()===false)},getWebAPI:function(){var a=this.shareRecord.get("name");var b=this.getForm();var c={};Ext.each(["disable_list","disable_modify","disable_download"],function(d){c[d]=b.findField(d).getValue()},this);return(!this.getForm().isDirty())?[]:[{api:"SYNO.Core.Share",method:"set",version:1,params:{name:a,shareinfo:{name:a,vol_path:this.shareRecord.get("vol_path"),unite_permission:b.findField("unite_permission").getValue(),advanceperm:c}}}]}});Ext.define("SYNO.SDS.Share.PermissionDialog",{extend:"SYNO.SDS.ModalWindow",constructor:function(b){this.gridPanel=new SYNO.SDS.Share.ShareGrid({module:b.module,owner:this,itemId:"sharegrid",hideCustomColumn:b.hideCustomColumn||false,isAdvancedMode:b.isAdvancedMode||false});this.formPanel=new SYNO.SDS.Share.AdvanceForm({module:b.module,owner:this,itemId:"advperm"});var a=Ext.apply({width:800,height:470,minWidth:550,minHeight:370,layout:"fit",items:[{xtype:"syno_tabpanel",plain:true,itemId:"tab",activeTab:0,items:[this.gridPanel]}],buttons:[{text:_T("common","apply"),scope:this,btnStyle:"blue",handler:this.savePermissionWithConfirm},{text:_T("common","cancel"),scope:this,handler:this.onCancel}]},b);this.callParent([a]);this.mon(this,"close",function(){this.gridPanel.stopPolling()},this)},isChanged:function(){return(this.gridPanel.isChanged()||this.formPanel.getForm().isDirty())},isShareGridHidden:function(){return(this.getComponent("tab").getTabEl("sharegrid").style.display==="none")},remoteSavePermission:function(){if(!this.isChanged()){this.close();return}var b=(this.isShareGridHidden())?[]:this.gridPanel.getWebAPI();var c=this.formPanel.getWebAPI();var a=(this.isAdvancedMode)?b:b.concat(c);if(a.length>0){this.sendApplyRequest(a)}},savePermissionWithConfirm:function(){if(!this.isChanged()){this.close();return}var a={name:this.shareRecord.get("name"),is_sync_share:this.shareRecord.get("is_sync_share"),permissions:[],no_check_permission:false};if(!this.gridPanel.disabled){a.permissions=this.gridPanel.getModifiedPermissions()}if(!this.formPanel.disabled&&this.formPanel.isAdvPermissionDisabled()){a.no_check_permission=true}SYNO.SDS.Utils.S2S.confirmIfSyncShareAffected(false,a,{dialogTitle:this.title,dialogMsg:_T("s2s","s2s_warn_share_change_priv"),dialogOwner:this,continueHandler:function(){this.remoteSavePermission()},abortHandler:Ext.EmptyFn,scope:this})},sendApplyRequest:function(a){var b=false;a.each(function(c){if(c.api==="SYNO.Core.Share.Permission"&&c.method==="set"){b=true}});this.setStatusBusy({text:_T("common","saving")});this.sendWebAPI({params:{},compound:{stopwhenerror:false,params:a},scope:this,callback:function(e,d){this.clearStatusBusy();var c=SYNO.API.Util.GetValByAPI(d,"SYNO.Core.Share.Permission","set");if(e&&!d.has_fail){SYNO.SDS.StatusNotifier.fireEvent("sharefolderchanged","permission");if(c){if(c.is_ftp_anonymous_chroot_conflict){this.gridPanel.confirmToShowFTPAdvancedSetting();return}}if(Ext.isFunction(this.successHandler)){this.successHandler()}else{this.close()}return}this.getMsgBox().alert(this.title,(Ext.isObject(c))?SYNO.API.Erros.core[c.code]:_T("common","commfail"))}})},onCancel:function(){if(this.isChanged()){this.getMsgBox().confirm(this.title,_T("common","confirm_lostchange"),function(a){if("yes"===a){this.close()}},this)}else{this.close()}},loadPermissionData:function(c){var e=c.get("vol_path")||c.get("real_path");e=e.toLowerCase();var b=(0===e.indexOf("/volumeusb")||0===e.indexOf("/volumesd")||0===e.indexOf("/volumesata"));var f=c.get("vol_path");if(!f){if(b){f=c.get("real_path");if(this._D("usbstation","no")==="yes"){f=f.replace(/\/@sharebin\/.*/,"")}}else{f=c.get("real_path").replace(c.get("path"),"")}c.set("vol_path",f)}var a=[{api:"SYNO.Core.Directory.LDAP",method:"get",version:1},{api:"SYNO.Core.Directory.Domain",method:"get",version:1},{api:"SYNO.Core.Directory.Domain",method:"test_dc",version:1},{api:"SYNO.Core.Share",method:"get",version:1,params:{name:c.get("name"),additional:["disable_list","disable_modify","disable_download","unite_permission","is_aclmode"]}},{api:"SYNO.Core.Storage.Volume",method:"get",version:1,params:{volume_path:f}}];if(this._D("supportdomain")==="yes"){var d={api:"SYNO.Core.Directory.Domain",method:"get_domain_list",version:1};if(this._S("version")>4946){d.version=2}a.push(d)}this.setStatusBusy({text:_T("common","loading")});this.sendWebAPI({params:{},compound:{stopwhenerror:false,params:a},scope:this,callback:function(l,g,j){this.clearStatusBusy();if(!l||g.has_fail){var i=SYNO.API.Util.GetFirstError(g);this.getMsgBox().alert("share",SYNO.API.Erros.core[i.code]||_T("common","commfail"));return}var k=SYNO.API.Util.GetValByAPI(g,"SYNO.Core.Storage.Volume","get").volume;var h="";if(this.isAdvancedMode){h=_T("share","share_adv_edit_title")}else{h=_T("share","share_edit_title")}if(k.readonly){this.setTitle(String.format(h,String.format('{0}<span class="red-status">({1})</span>',c.get("name"),_T("common","readonly"))))}else{this.setTitle(String.format(h,c.get("name")))}c.set("share_path",k.volume_path+"/"+c.get("name"));c.set("readonly",k.readonly);c.set("is_aclmode",SYNO.API.Util.GetValByAPI(g,"SYNO.Core.Share","get","is_aclmode"));c.set("is_sync_share",SYNO.API.Util.GetValByAPI(g,"SYNO.Core.Share","get","is_sync_share"));this.shareRecord=c;if(!this.gridPanel.disabled&&!SYNO.SDS.Share.PermissionDialog.prototype.isShareGridHidden.call(this)){if("photo"===c.get("name").toLowerCase()&&true===SYNO.API.Util.GetValByAPI(g,"SYNO.Core.Share","get","mask_permission_tab")){this.gridPanel.addListener("activate",function(){this.gridPanel.mask(_T("share","photo_permission_control_notify"))},this);this.gridPanel.addListener("deactivate",function(){this.gridPanel.unmask()},this)}this.gridPanel.loadPermissions(c,g)}if(!this.formPanel.disabled){this.formPanel.loadPermissions(c,g)}}});this.show()}});Ext.namespace("SYNO.SDS.CPUtils");SYNO.SDS.CPUtils.getTimeZoneStore=function(){return SYNO.SDS.Utils.getTimeZoneStore()};SYNO.SDS.CPUtils.createTimeItemStore=function(e){var a=[];var c={hour:24,min:60,sec:60};if(e in c){for(var d=0;d<c[e];d++){a.push([d,String.leftPad(String(d),2,"0")])}var b=new Ext.data.SimpleStore({id:0,fields:["value","display"],data:a});return b}return null};SYNO.SDS.CPUtils.clearInvalidOnDisabled=function(a){a.items.each(function(d,b,c){if(d.isFormField&&d.clearInvalid){d.mon(d,"disable",d.clearInvalid,d)}})};SYNO.SDS.CPUtils.formErrinfoString=function(c,a){var d=Ext.isString(a)?a:"";if(c&&c.success!==true&&c.errinfo){var b=c.errinfo;d=_T(b.sec,b.key);if(""===d){d=String.format("{0}:{1}",b.sec,b.key)}if(Ext.isString(b.desc)){d=String.format("{0} ({1})",d,b.desc)}if(Ext.isNumber(b.line)){d=String.format("{0} ({1})",d,b.line)}}return d};SYNO.SDS.CPUtils.reportAjaxResponse=function(g,b,a,d){var f="";var e=null;if(!g){f=_T("common","commfail")}else{if(Ext.isString(b.responseText)){try{e=Ext.decode(b.responseText)}catch(c){SYNO.Debug("exception: responseText:",b.responseText);f="Unknown exception"}}f=SYNO.SDS.CPUtils.formErrinfoString(e,f)}if(f&&a){d=d||this;a.call(d,f)}return e};SYNO.SDS.CPUtils.reportFormFail=function(c,d,a,b){var f;if(d.failureType===Ext.form.Action.CLIENT_INVALID){f=_T("common","forminvalid")}else{if(d.failureType===Ext.form.Action.CONNECT_FAILURE){f=_T("common","commfail")}else{if(Ext.isObject(d.result.errinfo)){var e=d.result.errinfo;f=_T(e.sec,e.key);if(""===f){f=String.format("{0}{1}",e.sec,e.key)}if(Ext.isNumber(e.line)){f=String.format("{0} ({1})",f,e.line)}}else{if(d.failureType===Ext.form.Action.SERVER_INVALID){f=_T("error","error_bad_field")}else{f=_T("common","error_system")}}}}if(f&&a){b=b||this;a.call(b,f)}};