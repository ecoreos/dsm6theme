/* Copyright (c) INTEGRA EMPRESAS 2016. All rights reserved. */

Ext.ns("SYNO.FileStation");SYNO.FileStation.FileTask=Ext.extend(Ext.util.Observable,{constructor:function(a){this.reqConfig=this.applyRequestConfig(a);SYNO.FileStation.FileTask.constructor.call(this)},applyRequestConfig:function(a){this.cbHandler=Ext.copyTo({},a,["scope","callback"]);var b=Ext.apply(a,{method:"POST",callback:this.onSendDone,scope:this});return b},send:function(){Ext.Ajax.request(this.reqConfig)},onSendDone:function(c,e,a){var b=this.cbHandler.scope;var f=this.cbHandler.callback;if(!e||!a.responseText){f.call(b,c,false,{section:"common",key:"commfail"});return}var d=Ext.util.JSON.decode(a.responseText);if(!d){f.call(b,c,false,{section:"common",key:"commfail"});return}if(!d.success){if(d.errno&&d.errno.section&&d.errno.key){f.call(b,c,false,d.errno)}}else{f.call(b,c,true,d)}}});