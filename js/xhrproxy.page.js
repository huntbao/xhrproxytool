//API Proxy Tool
//author @huntbao
(function () {

    'use strict'

    var $ = function (selector) {
        if (typeof selector === 'object') return selector
        return document.querySelector(selector)
    }

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
            var self = this
            document.addEventListener('click', function (evt) {
                var target = evt.target;
                if (target.name === 'xhrpt-send-button') {
                    var box = document.querySelector('.xhr-proxy-toolbox')
                    var urlInput = box.querySelector('[name="xhrpt-send-url"]')
                    var methodInput = box.querySelector('[name="xhrpt-send-method"]')
                    var dataInput = box.querySelector('[name="xhrpt-send-data"]')
                    if (urlInput) {
                        chrome.extension.connect({
                            name: 'send-request'
                        }).postMessage({
                            url: urlInput.value,
                            method: methodInput ? methodInput.value : 'get',
                            data: dataInput ? self.getValidJSON(dataInput.value) : ''
                        })
                    }
                }
            })
        },

        checkPluginHandler: function (result) {
            document.body.dataset.apiproxytoolinstalled = true
        },

        sendRequeseHandler: function (result) {
            var data
            try {
                data = JSON.parse(result.data)
            } catch (e) {
                data = result.data
            }
            var event = new CustomEvent('onxhrptresult', {detail: data})
            document.dispatchEvent(event)
        },

        getValidJSON: function (value) {
            var json
            try {
                json = JSON.parse(value)
            } catch (e) {
                try {
                    json = eval('(' + value + ')')
                } catch (er) {
                }
            }
            return json
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        window.APP.init()
    })

})()