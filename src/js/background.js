//author @huntbao
(function () {

  /* global chrome */

  'use strict'

  var background  = {
    init: function() {
      this.globalVarsNum = 0
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
          case 'show-global-vars':
            self.showGlobalVars(port)
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
                  if (h === 'cookie') {
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
        {urls: ['<all_urls>']},
        ['blocking', 'requestHeaders', 'extraHeaders']
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
        var headers = {}
        Object.keys(data.headers || {}).forEach(function(key) {
          headers[key.toLowerCase()] = data.headers[key];
        })
        if (!headers['content-type']) {
          headers['content-type'] = 'application/x-www-form-urlencoded; charset=UTF-8'
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
                if (this.status === 200) {
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
        var isObjectOrArray = function(o) {
          var toString = Object.prototype.toString;
          var field = ['Object', 'Array'];
          return field.map(function(item){
            return '[object ' + item + ']';
          }).indexOf(toString.call(o)) !== -1;
        }
        if(/^(number|string|boolean)$/.test(typeof data.data)) {
          sendData = encodeURIComponent(String(data.data));
        } else {
          for (var p in data.data) {
            // 有文件直接忽略不发
            if (!data.data[p].__isFile__) {
              sendData && (sendData += '&')
              // 其他做序列化
              sendData += encodeURIComponent(p) + '=' + encodeURIComponent(isObjectOrArray(data.data[p]) ? JSON.stringify(data.data[p]) : data.data[p])
            }
          }
        }
        var fd = new FormData();
        var setFormData = function(fd, data, withURIEncode) {
          var transform = withURIEncode ? encodeURIComponent : function(item) { return item };
          Object.keys(data).forEach(function(key) {
            var k = transform(key),
                v = isObjectOrArray(data[key]) ? transform(JSON.stringify(data[key])) : transform(data[key]);
                fd.append(k, v);
          });
        } 
        if (method === 'GET') {
          if (sendData) {
            url += '?' + sendData
          }
          if (files.length) {
            // 清空，否则GET请求发不出去
            files.length = 0;
          }
        } else if (files.length) {
          Promise.all(files).then(function(){
            setFormData(fd, data.data);
            xhr.send(fd);
          });
          delete headers['content-type'];
        } else if (headers['content-type'] === 'application/json') {
          sendData = JSON.stringify(data.data)
        } else if (headers['content-type'] === 'multipart/form-data') {
          setFormData(fd, data.data);
          sendData = fd;
        } else if (!~headers['content-type'].indexOf('application/x-www-form-urlencoded')) {
          // 对于其他类型，先发plain text
          sendData = JSON.stringify(data.data)
        }
        xhr.open(method, url, true);
        var setHeaders = {}
        var limitHeaders = ['referer', 'accept-charset', 'accept-encoding', 'cookie', 'date', 'origin', 'user-agent']
        for (var h in headers) {
          if (limitHeaders.indexOf(h.toLowerCase()) !== -1) {
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