/* Copyright (c) INTEGRA EMPRESAS 2016. All rights reserved. */

Ext.define("SYNO.SDS.AviaryEditor.FBExt",{statics:{allowExt:["jpg","jpeg","jpe","png"],allowBigSize:5000000,checkFn:function(a,b){if(Ext.isIE8||1!==b.length||b[0].get("isdir")||SYNO.SDS.AviaryEditor.FBExt.allowExt.indexOf(b[0].get("type").toLowerCase())<0){return false}return true},getImgUrl:function(i,h,f){var b,e,j,g,d,a,c;if(h){b=h}else{b=window.location.protocol+"//"+i;e=window.location.port;c=window.location.pathname;if(!_S("rewrite_mode")){if(window.location.protocol==="https:"){e=(_S("external_port_dsm_https")&&_S("external_port_dsm_https")!=="")?_S("external_port_dsm_https"):window.location.port}else{e=(_S("external_port_dsm_http")&&_S("external_port_dsm_http")!=="")?_S("external_port_dsm_http"):window.location.port}}if(e){b+=":"+e}else{if(c){b+=c}}}j=f.get("path");g=j.substr(1+j.lastIndexOf("/"));d=Ext.util.Cookies.get("id");a=String.format("{0}/viewer/{1}/{2}/{3}/{4}",b,SYNO.SDS.Utils.bin2hex(j),encodeURIComponent(d),(_S("SynoToken")||"token"),encodeURIComponent(g));a=a.replace("//viewer","/viewer");return a},launchFn:function(b){var a=SYNO.SDS.Utils.Network.getExternalHostName(true),e=SYNO.SDS.Utils.Network.checkExternalIP(a),c=this.appWindow||this,d;if(b[0].get("filesize")>SYNO.SDS.AviaryEditor.FBExt.allowBigSize){c.getMsgBox().alert("aviary",_T("aviary","av_bigsize")||_T("filebrowser","oviewer_bigsize"));return}if(!e&&!c.curPortalUrl){d=_S("standalone")||!_S("is_admin")?_T("error","quickcnt_warning"):_T("error","quickcnt_alert");c.getMsgBox().alert(_T("filebrowser","oviewer"),d,_S("standalone")?(function(){}):(function(f){if("ok"==f){SYNO.SDS.AppLaunch("SYNO.SDS.AdminCenter.Application",{fn:"SYNO.SDS.AdminCenter.QuickConnect.Main"})}}),c);return}a=(e)?a:null;SYNO.SDS.WindowLaunch("SYNO.SDS.AviaryEditor.Application",{path:window.encodeURIComponent(b[0].get("path")),imgUrl:SYNO.SDS.AviaryEditor.FBExt.getImgUrl(a,c.curPortalUrl,b[0])})}}});