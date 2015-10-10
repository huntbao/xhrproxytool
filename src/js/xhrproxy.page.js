//XHR Proxy Tool
//author @huntbao
(function () {

    'use strict'

    window.XHRPT = {

        init: function () {
            var self = this
            chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
                if (!sender || sender.id !== chrome.i18n.getMessage("@@extension_id")) return
                switch (request.name) {
                    case 'send-request-res':
                        self.sendRequeseHandler(request)
                        break
                    default:
                        break
                }
            })
            self.addEvent()
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
                chrome.extension.connect({
                    name: 'send-request'
                }).postMessage(evt.detail)
            })
        },

        sendRequeseHandler: function (result) {
            var event = new CustomEvent('sendto-xhrpt-ext-res', {
                detail: {
                    resData: result.data,
                    reqData: result.reqData
                }
            })
            document.dispatchEvent(event)
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        window.XHRPT.init()
    })

})()