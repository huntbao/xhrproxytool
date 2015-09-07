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
                        self.sendRequeseHandler(port)
                        break
                    default:
                        break
                }
            })
        },

        sendRequeseHandler: function (port) {
            var self = this
            port.onMessage.addListener(function (data) {
                var xhr = new XMLHttpRequest()
                var sendData = ''
                var method = data.method.toLowerCase()
                var url = data.url
                var headers = data.headers || {}
                if (method === 'get') {
                    for (var p in data.data) {
                        sendData += p + '=' + data.data[p]
                    }
                    if (sendData) {
                        url += '?' + sendData
                    }
                } else {
                    sendData = JSON.stringify(data.data)
                }
                xhr.open(method, url, true)
                for (var h in headers) {
                    xhr.setRequestHeader(h, headers[h])
                }
                xhr.onload = function () {
                    chrome.tabs.sendRequest(port.sender.tab.id, {
                        name: 'send-request-res',
                        data: xhr.responseText
                    })
                }
                xhr.send(sendData)
            })
        }
    }

    window.XHRPT.init()

})()