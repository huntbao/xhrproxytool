//XHR Proxy Tool
//author @huntbao
(function () {

  'use strict'

  window.XHRPT = {

    init: function () {
      var self = this
      self.initConnect()
    },

    initConnect: function () {
      var self = this
      chrome.extension.onConnect.addListener(function (port) {
        switch (port.name) {
          case 'send-request':
            self.sendRequestHandler(port)
            break
          default:
            break
        }
      })
    },

    sendRequestHandler: function (port) {
      var self = this
      port.onMessage.addListener(function (data) {
        var xhr = new XMLHttpRequest()
        var sendData = ''
        var method = data.method.toLowerCase()
        var url = data.url
        var headers = data.headers || {}
        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8'
        }
        for (var p in data.data) {
          sendData && (sendData += '&')
          sendData += p + '=' + data.data[p]
        }
        if (method === 'get') {
          if (sendData) {
            url += '?' + sendData
          }
        } else if (headers['Content-Type'] === 'application/json') {
          sendData = JSON.stringify(data.data)
        } else if (headers['Content-Type'] === 'multipart/form-data') {
          var fd = new FormData()
          Object.keys(data.data).forEach(function (key) {
            fd.append(key, data.data[key])
          })
          sendData = fd
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
            chrome.tabs.sendRequest(port.sender.tab.id, {
              name: 'send-request-res',
              data: xhr.responseText,
              reqData: data,
              xhr: xhrObj
            })
          }
        }
        xhr.send(sendData)
      })
    }
  }

  window.XHRPT.init()

})()