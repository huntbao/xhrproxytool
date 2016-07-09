XHR Proxy Tool
===========

# Introduction #

XHR proxy tool is a chrome extension, it can fetch data from cross domain. 

# Online Install #
[Go chrome webstore](https://chrome.google.com/webstore/detail/xhr-proxy-tool/fbakmpanchidgmjopcmcddoihgjkfcjn)

# Usage #

## Check if extension is installed

```javascript
var sendId = Date.now()
document.addEventListener('check-xhrpt-ext-res', function (e) {
    if (!e.detail || !e.detail.reqData || e.detail.reqData.sendId !== sendId) return;
    console.log('XHR proxy tool is installed!')
}, false)
document.addEventListener('DOMContentLoaded', function () {
    var event = new CustomEvent('check-xhrpt-ext', {
        detail: {
            sendId: sendId
        }
    })
    document.dispatchEvent(event)
})
```

## Interact with extension

```javascript
var sendId = Date.now()
// add response listener
document.addEventListener('sendto-xhrpt-ext-res', function (e) {
    if (!e.detail || !e.detail.reqData || e.detail.reqData.sendId !== sendId) return;
    // e.detail.reqData is request data
    // e.detail.resData is response data
    console.log(e.detail)
}, false)

// request data
var data = {
    url: 'http://ip.taobao.com/service/getIpInfo.php',
    method: 'GET',
    data: {
        ip: "63.223.108.42"
    },
    headers: {
        'Content-Type': 'application/json'
    },
    sendId: sendId
}
// send to extension
document.dispatchEvent(new CustomEvent('sendto-xhrpt-ext', {detail: data}))
```