/* Copyright (c) INTEGRA EMPRESAS 2016. All rights reserved. */

var FBD={has_flash_blocker:false,callback_func:null,fake_embed_1:null,fake_embed_2:null,fake_embed_watcher:null,dom_node_inserted:function(a){var b=a.target;if(b.nodeType!=1){return}if(b.nodeName.toLowerCase()!="div"){return}if(b.className=="ujs_flashblock_placeholder"){FBD.has_flash_blocker=true;if(b.title===""){b.style.position="absolute";b.style.left="-5000px"}window.setTimeout(FBD.cleanup,0)}else{if(b.hasAttribute("bgactive")){FBD.has_flash_blocker=true;if(b.title==document.location.href){b.style.position="absolute";b.style.left="-5000px"}window.setTimeout(FBD.cleanup,0)}else{if(b.hasAttribute("style")&&b.getAttribute("style").indexOf("gofhjkjmkpinhpoiabjplobcaignabnl")!=-1){FBD.has_flash_blocker=true;b.style.position="absolute";b.style.left="-5000px";window.setTimeout(FBD.cleanup,0)}}}},check_embed_type:function(){if((FBD.fake_embed_1.type=="application/x-shockwave-flash")&&(FBD.fake_embed_2.type!="application/x-shockwave-flash")){FBD.has_flash_blocker=true;FBD.cleanup()}},cleanup:function(){try{document.body.removeEventListener("DOMNodeInserted",FBD.dom_node_inserted,false)}catch(c){}if(FBD.fake_embed_1){FBD.fake_embed_1.parentNode.removeChild(FBD.fake_embed_1)}FBD.fake_embed_1=null;if(FBD.fake_embed_2){FBD.fake_embed_2.parentNode.removeChild(FBD.fake_embed_2)}FBD.fake_embed_2=null;if(!Ext.isEmpty(FBD.fake_embed_watcher)){window.clearInterval(FBD.fake_embed_watcher);FBD.fake_embed_watcher=null}var b=document.getElementsByTagName("div");for(var a=0;a<b.length;a++){var d=b[a];if((d.hasAttribute("bgactive")&&d.title==document.location.href)||(d.className=="ujs_flashblock_placeholder"&&d.title==="")){d.parentNode.removeChild(d)}}FBD.callback_func(FBD.has_flash_blocker)},initialize:function(callback_function,MaxWaitFlashTime){if(
/*@cc_on!@*/
false){callback_function(false);return}if(window.opera){callback_function(false);return}FBD.callback_func=callback_function;document.body.addEventListener("DOMNodeInserted",FBD.dom_node_inserted,false);var e=document.createElement("embed");e.style.position="absolute";e.style.left="-5000px";e.width=10;e.height=10;e.src="";e.type="application/x-shockwave-flash";FBD.fake_embed_1=e;document.body.appendChild(e);var e2=document.createElement("embed");e2.style.position="absolute";e2.style.left="-5000px";e2.width=1;e2.height=1;e2.src="";e2.type="application/x-shockwave-flash";FBD.fake_embed_2=e2;document.body.appendChild(e2);FBD.fake_embed_watcher=window.setInterval(FBD.check_embed_type,100);MaxWaitFlashTime=MaxWaitFlashTime?MaxWaitFlashTime:5000;window.setTimeout(FBD.cleanup,MaxWaitFlashTime)}};FBD.initialize(function(a){if(a){FBD.blFlashBlock=true}else{FBD.blFlashBlock=false}},1000);Ext.namespace("SYNO.SDS.Utils.Flash");Ext.apply(SYNO.SDS.Utils.Flash,{isReservedPort:function(a){var b=[1,7,9,11,13,15,17,19,20,21,22,23,25,37,42,43,53,77,79,87,95,101,102,103,104,109,110,111,113,115,117,119,123,135,139,143,179,389,465,512,513,514,515,526,530,531,532,540,556,563,587,601,636,993,995,2049,4045,6000];if("string"===typeof(a)){a=parseInt(a,10)}return(-1!==b.indexOf(a))},isSupport:function(){if(false===SYNO.SDS.Utils.Flash.isBaseSupport("9.0.28")){return false}if((Ext.isSecure&&!Ext.isIE)||(Ext.isSafari&&Ext.isMac&&swfobject.hasFlashPlayerVersion("10.0.53"))){return false}if(!Ext.isDefined(FBD.blFlashBlock)){return undefined}return !FBD.blFlashBlock},isBaseSupport:function(a){if(SYNO.SDS.Utils.getPunyHostname()!=location.hostname||SYNO.SDS.Utils.Flash.isReservedPort(location.port)||!swfobject.hasFlashPlayerVersion(a)){return false}if(!Ext.isDefined(FBD.blFlashBlock)){return undefined}return !FBD.blFlashBlock}});