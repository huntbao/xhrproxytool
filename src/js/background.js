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
                }
                xhr.open(method, url, true)
                for (var h in headers) {
                    xhr.setRequestHeader(h, headers[h])
                }
                xhr.onreadystatechange = function () {
                    if (this.readyState === 4) {
                        if (this.status === 200) {
                            chrome.tabs.sendRequest(port.sender.tab.id, {
                                name: 'send-request-res',
                                data: xhr.responseText,
                                reqData: data
                            })
                        } else {
                            chrome.tabs.sendRequest(port.sender.tab.id, {
                                name: 'send-request-res',
                                reqData: data
                            })
                        }
                    }
                };
                xhr.send(sendData)
            })
        }
    }

    window.XHRPT.init()

})()