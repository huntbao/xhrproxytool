//XHR Proxy Tool
//author @huntbao
(function () {

    'use strict'

    window.APP = {

        init: function () {
            var self = this
            chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
                if (!sender || sender.id !== chrome.i18n.getMessage("@@extension_id")) return
                switch (request.name) {
                    case 'check-plugin-res':
                        self.checkPluginHandler(request)
                        break
                    case 'send-request-res':
                        self.sendRequeseHandler(request)
                        break
                    default:
                        break
                }
            })
            chrome.extension.connect({name: 'check-plugin'}).postMessage()
            self.addEvent()
        },

        addEvent: function () {
            document.addEventListener('send-toxhrpt-frompage', function (evt) {
                chrome.extension.connect({
                    name: 'send-request'
                }).postMessage(evt.detail)
            })
        },

        checkPluginHandler: function () {
            document.body.dataset.xhrproxytoolinstalled = true
        },

        sendRequeseHandler: function (result) {
            var data
            try {
                data = JSON.parse(result.data)
            } catch (e) {
                data = result.data
            }
            var event = new CustomEvent('on-xhrptresult-fromext', {detail: data})
            document.dispatchEvent(event)
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        window.APP.init()
    })

})
()