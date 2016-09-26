/* Copyright (c) INTEGRA EMPRESAS 2016. All rights reserved. */

Ext.namespace("SYNO.FileStation.CloudDownloader");Ext.define("SYNO.FileStation.CloudDownloader.Application",{extend:"SYNO.SDS.AppInstance"});SYNO.FileStation.CloudDownloader.Utils={};Ext.apply(SYNO.FileStation.CloudDownloader.Utils,{checkFn:function(b,c){var d=c[0];if(!d||1!==c.length){return}if(!SYNO.webfm.VFS.isGDrivePath(d.id)||SYNO.webfm.VFS.isGDriveRootPath(d.id)){return}var a=SYNO.FileStation.CloudDownloader.Utils.getFileMime(d);if(!SYNO.FileStation.CloudDownloader.Utils.supportDownloadAs(a)){return}return true},launchFn:function(a){},supportDownloadAsType:function(b,d,c){var a=SYNO.FileStation.CloudDownloader.Utils.getFileMime(d[0]);return -1!==SYNO.FileStation.CloudDownloader.Utils.getDownloadAsTypeToMimeMap()[c].indexOf(a)},startDownload:function(b,a){this.FileAction.DirectDownload(b[0],null,a)},supportDownloadAs:function(a){return Ext.isDefined(SYNO.FileStation.CloudDownloader.Utils.mimeToDownloadAsTypesMap[a])},getFileMime:function(a){if(!a.data||!a.data.description){return""}return a.data.description.mimeType},getDownloadAsTypeToMimeMap:function(){if(!Ext.isDefined(SYNO.FileStation.CloudDownloader.Utils.mimeToDownloadAsTypesMapRev)){var b={},c=SYNO.FileStation.CloudDownloader.Utils.mimeToDownloadAsTypesMap;for(var d in c){if(true===c.hasOwnProperty(d)){for(var a=0;a<c[d].length;a++){if(!Ext.isArray(b[c[d][a]])){b[c[d][a]]=[d]}else{b[c[d][a]].push(d)}}}}SYNO.FileStation.CloudDownloader.Utils.mimeToDownloadAsTypesMapRev=b}return SYNO.FileStation.CloudDownloader.Utils.mimeToDownloadAsTypesMapRev},mimeToDownloadAsTypesMap:{"application/vnd.google-apps.document":["html","txt","rtf","odt","pdf","docx"],"application/vnd.google-apps.spreadsheet":["xlsx","ods","pdf"],"application/vnd.google-apps.drawing":["jpeg","png","svg","pdf"],"application/vnd.google-apps.presentation":["pptx","pdf"]}});