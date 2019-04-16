//author @huntbao
(function () {

  /* global chrome */

  'use strict'

  var page = {
    init: function () {
      var self = this
      chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (!sender || sender.id !== chrome.i18n.getMessage("@@extension_id")) return
        switch (request.name) {
          case 'send-request-res':
            self.sendRequestHandler(request)
            break
          default:
            break
        }
      })
      self.addEvent()
      self.detectGlobalVars()
    },

    addEvent: function () {
      document.addEventListener('check-xhrpt-ext', function (evt) {
        var event = new CustomEvent('check-xhrpt-ext-res', {
          detail: {
            resData: 'ok',
            reqData: evt.detail
          }
        })
        document.dispatchEvent(event)
      })
      document.addEventListener('sendto-xhrpt-ext', function (evt) {
        chrome.runtime.connect({
          name: 'send-request'
        }).postMessage(evt.detail)
      })
      // 监听页面js错误
      window.addEventListener('error', function (evt) {
        chrome.runtime.connect({
          name: 'page-script-error',
        }).postMessage({
          evt: evt,
          data: {
            message: evt.message,
            filename: evt.filename,
            lineno: evt.lineno
          },
          from: window.location.href
        })
      })

      // 执行脚本
      document.addEventListener('exec-scripts', function (evt) {
        chrome.runtime.connect({
          name: 'exec-scripts'
        }).postMessage({
          evt: evt,
          data: {
            targetFrameUrl: evt.detail.targetFrameUrl,
            scripts: evt.detail.scripts
          }
        })
      })
    },

    sendRequestHandler: function (result) {
      var event = new CustomEvent('sendto-xhrpt-ext-res', {
        detail: {
          xhr: result.xhr,
          resData: result.data,
          reqData: result.reqData
        }
      })
      document.dispatchEvent(event)
    },

    detectGlobalVars: function () {
      var script = document.createElement('script')
      script.innerHTML = '' +
        "(function(){" +
        "  var iframe = document.createElement('iframe');" +
        "  document.body.appendChild(iframe);" +
        "  try{" +
        "   var win = iframe.contentWindow.window;" +
        "   var vars = Object.keys(window).filter(function (key) {" +
        "     return !win.hasOwnProperty(key)" +
        "   });" +
        "   }catch(e){return;}" +
        "  console.log('页面 ' + window.location.href + ' 共有 ' + vars.length +  ' 个全局变量: ', vars);" +
        "  var div = document.createElement('div');" +
        "  div.id = 'xhrproxy-show-global-var-div';" +
        "  div.innerHTML = vars.length;" +
        "  document.body.appendChild(div);" +
        "  document.body.removeChild(iframe);" +
        "})();"
      document.head.appendChild(script)
      var gDiv = document.getElementById('xhrproxy-show-global-var-div')
      if (!gDiv) {
        return;
      }
      chrome.runtime.connect({
        name: 'show-global-vars',
      }).postMessage({
        data: {
          varNum: gDiv.innerHTML
        },
        from: window.location.href
      })
      document.body.removeChild(gDiv)
      // 刷新页面时重置
      window.onbeforeunload = function () {
        chrome.runtime.connect({
          name: 'show-global-vars',
        }).postMessage({
          reset: true
        })
      }
    }
  }

  var state = document.readyState
  if (state === 'interactive' || state === 'complete') {
    page.init()
  }
  else {
    document.addEventListener('DOMContentLoaded', function () {
      page.init()
    })
  }
})()