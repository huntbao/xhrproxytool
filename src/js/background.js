//author @huntbao
(function () {

  /* global chrome */

  'use strict'

  var background  = {
    init: function() {
      this.initConnect()
    },

    initConnect: function() {
      var self = this
      chrome.runtime.onConnect.addListener(function (port) {
        switch (port.name) {
          case 'send-request':
            self.sendRequestHandler(port)
            break
          case 'page-script-error':
            self.showPageScriptError(port)
            break
          case 'exec-scripts':
            self.execScriptsHandler(port)
            break
          default:
            break
        }
      })
      chrome.runtime.onMessageExternal.addListener(function (request, sender, sendResponse) {
        if (request.name === 'inject-content-script') {
          chrome.tabs.executeScript(sender.tab.id, {
            file: 'js/xhrproxy.page.js'
          })
        }
      })
    },

    sendRequestHandler: function(port) {
      port.onMessage.addListener(function (data) {
        var xhr = new XMLHttpRequest()
        var sendData = ''
        var method = data.method.toUpperCase()
        var url = data.url.trim()
        if (!/^https?\:/.test(url)) { // 请求url协议默认为http
          url = 'http://' + url;
        }
        var headers = data.headers || {}
        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8'
        }
        for (var p in data.data) {
          sendData && (sendData += '&')
          sendData += p + '=' + data.data[p]
        }
        var files = [];
        Object.keys(data.data).forEach(function(key) {
          var val = data.data[key];
          if(val.__isFile__) {
            files.push(new Promise(function(resolve, reject) {
              var fileRequest = new XMLHttpRequest();
              fileRequest.open('GET', val.blobUrl, true);
              fileRequest.responseType = 'blob';
              fileRequest.onload = function(e) {
                if (this.status == 200) {
                  var blob = this.response;
                  data.data[key] = new File([blob], val.filename, {
                    type: blob.type
                  });
                  resolve();
                }
              };
              fileRequest.send();
            }));
          }
        });
        if (method === 'GET') {
          if (sendData) {
            url += '?' + sendData
          }
        } else if (headers['Content-Type'] === 'application/json') {
          sendData = JSON.stringify(data.data)
        } else if (headers['Content-Type'] === 'multipart/form-data') {
          var fd = new FormData();
          if(files.length) {
            Promise.all(files).then(function(){
              Object.keys(data.data).forEach(function (key) {
                  fd.append(key, data.data[key]);
              });
              xhr.send(fd);
            });
          } else {
            Object.keys(data.data).forEach(function (key) {
              fd.append(key, data.data[key]);
            });
            sendData = fd;
          }
        }
        xhr.open(method, url, true)
        for (var h in headers) {
          xhr.setRequestHeader(h, headers[h])
        }
        xhr.onreadystatechange = function () {
          if (this.readyState === 4) {
            var xhrObj = {}
            var keys = [
              'readyState',
              'response',
              'responseText',
              'responseType',
              'responseURL',
              'responseXML',
              'status',
              'statusText',
              'timeout',
              'withCredentials'
            ]
            keys.forEach(function (key) {
              xhrObj[key] = xhr[key]
            })
            // 响应头
            xhrObj.responseHeaders = this.getAllResponseHeaders();
            chrome.tabs.sendMessage(port.sender.tab.id, {
              name: 'send-request-res',
              data: xhr.responseText,
              reqData: data,
              xhr: xhrObj
            })
          }
        }
        if(!files.length) {
          xhr.send(sendData)
        }
      })
    },

    showPageScriptError: function(port) {
      var notify = localStorage['xhr_proxy_tool_js_error_notify']
      if (notify !== 'true') {
        return
      }
      port.onMessage.addListener(function (data) {
        var notification = new Notification('脚本错误:', {
          icon: './js/image.png',
          body: data.data.message + '\n' + data.data.filename + '\n' + data.data.lineno
        })
        setTimeout(function () {
          notification.close()
        }, 3000)
      })
    },

    execScriptsHandler: function(port) {
      port.onMessage.addListener(function (result) {
        var tabId = port.sender.tab.id
        var data = result.data
        chrome.webNavigation.getAllFrames({
          tabId: tabId
        }, function (frames) {
          console.log(data)
          var frame = frames.find(function (frame) {
            return frame.url.startsWith(data.targetFrameUrl)
          })
          if (frame) {
            chrome.tabs.executeScript({
              code: data.scripts + ';jasmineRun();',
              frameId: frame.frameId
            })
          } else {
            console.log('没有找到目标 iframe 地址: ' + data.targetFrameUrl)
          }
        })
      })
    }
  }

  background.init()

})()