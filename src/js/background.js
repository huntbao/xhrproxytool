//author @huntbao
(function () {

  /* global chrome */

  'use strict'

  var background  = {
    init: function() {
      this.initConnect()
      this.initWebRequest()
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

    initWebRequest: function() {
      chrome.webRequest.onBeforeSendHeaders.addListener(
        function(details) {
          var extension_id = chrome.i18n.getMessage('@@extension_id')
          var filterSingleItem = function(arr, field, value) {
            return arr && arr.length > 0 ? arr.filter(function(item) {
              return item[field] === value
            })[0] : null
          }
          var origin = filterSingleItem(details.requestHeaders, 'name', 'Origin')
          // 判断是否是extension发出，initiator 在chrome 63版本中增加
          if ((details.initiator && details.initiator.substring(19) === extension_id)
            || (origin && origin.value && origin.value.substring(19) === extension_id)) {
              var setHeaders = JSON.parse(filterSingleItem(details.requestHeaders, 'name', 'X-Set-Headers').value)
              for (var h in setHeaders) {
                var item = filterSingleItem(details.requestHeaders, 'name', h)
                if (item) {
                  if (h === 'Cookie') {
                    item.value += ';' + setHeaders[h]
                  } else {
                    item.value = setHeaders[h]
                  }
                } else {
                  details.requestHeaders.push({ name: h, value: setHeaders[h] })
                }
              }
              details.requestHeaders.splice(details.requestHeaders.findIndex(function(item){
                return item.name === 'X-Set-Headers'
              }), 1)
              return {requestHeaders: details.requestHeaders}
          }
        },
        {urls: ["<all_urls>"]},
        ["blocking", "requestHeaders"]
      )
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
        if(/^(number|string|boolean)$/.test(typeof data.data)) {
          sendData = String(data.data);
        } else {
          for (var p in data.data) {
            sendData && (sendData += '&')
            sendData += p + '=' + data.data[p]
          }
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
          delete headers['Content-Type'];
        }
        xhr.open(method, url, true)
        var setHeaders = {}
        var limitHeaders = ['Referer', 'Accepet-Charset', 'Accept-Encoding', 'Cookie', 'Date', 'Origin', 'User-Agent']
        for (var h in headers) {
          if (limitHeaders.indexOf(h) !== -1) {
            setHeaders[h] = headers[h]
          } else {
            xhr.setRequestHeader(h, headers[h])
          }
        }
        xhr.setRequestHeader('X-Set-Headers', JSON.stringify(setHeaders))
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
            // 消除Chrome 60版本前后的大小写差异
            xhrObj.responseHeaders = xhrObj.responseHeaders.split(/\n/).map(function(item) {
              var index = item.indexOf(':')
              return index > 0 ? item.substring(0, index).split('-').map(function(word) {
                return word[0].toUpperCase() + word.substring(1)
              }).join('-') + ':' + item.substring(index + 1) : ''
            }).join('\n')
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