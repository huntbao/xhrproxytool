!function(){"use strict";var e={init:function(){var e=this;chrome.runtime.onMessage.addListener(function(t,n,r){if(n&&n.id===chrome.i18n.getMessage("@@extension_id"))switch(t.name){case"send-request-res":e.sendRequestHandler(t)}}),e.addEvent(),e.detectGlobalVars()},addEvent:function(){document.addEventListener("check-xhrpt-ext",function(e){var t=new CustomEvent("check-xhrpt-ext-res",{detail:{resData:"ok",reqData:e.detail}});document.dispatchEvent(t)}),document.addEventListener("sendto-xhrpt-ext",function(e){chrome.runtime.connect({name:"send-request"}).postMessage(e.detail)}),window.addEventListener("error",function(e){chrome.runtime.connect({name:"page-script-error"}).postMessage({evt:e,data:{message:e.message,filename:e.filename,lineno:e.lineno},from:window.location.href})}),document.addEventListener("exec-scripts",function(e){chrome.runtime.connect({name:"exec-scripts"}).postMessage({evt:e,data:{targetFrameUrl:e.detail.targetFrameUrl,scripts:e.detail.scripts}})})},sendRequestHandler:function(e){var t=new CustomEvent("sendto-xhrpt-ext-res",{detail:{xhr:e.xhr,resData:e.data,reqData:e.reqData}});document.dispatchEvent(t)},detectGlobalVars:function(){var e=document.createElement("script");e.innerHTML="(function(){  var iframe = document.createElement('iframe');  document.body.appendChild(iframe);  try{   var win = iframe.contentWindow.window;   var vars = Object.keys(window).filter(function (key) {     return !win.hasOwnProperty(key)   });   }catch(e){return;}  console.log('页面 ' + window.location.href + ' 共有 ' + vars.length +  ' 个全局变量: ', vars);  var div = document.createElement('div');  div.id = 'xhrproxy-show-global-var-div';  div.innerHTML = vars.length;  document.body.appendChild(div);  document.body.removeChild(iframe);})();",document.head.appendChild(e);var t=document.getElementById("xhrproxy-show-global-var-div");t&&(chrome.runtime.connect({name:"show-global-vars"}).postMessage({data:{varNum:t.innerHTML},from:window.location.href}),document.body.removeChild(t),window.onbeforeunload=function(){chrome.runtime.connect({name:"show-global-vars"}).postMessage({reset:!0})})}},t=document.readyState;"interactive"===t||"complete"===t?e.init():document.addEventListener("DOMContentLoaded",function(){e.init()})}();