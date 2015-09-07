XHR Proxy Tool
===========

# Introduction #

XHR proxy tool is a chrome extension, it can fetch data from cross domain. 

# Online Install #
[Go chrome webstore](https://chrome.google.com/webstore/detail/xhr-proxy-tool/fbakmpanchidgmjopcmcddoihgjkfcjn)

# Usage #

## Check if extension is installed

```javascript
document.addEventListener('check-xhrpt-ext-res', function (e) {
    console.log('XHR proxy tool is installed!')
}, false)
document.addEventListener('DOMContentLoaded', function () {
    document.dispatchEvent(new CustomEvent('check-xhrpt-ext'))
})
```

## Interact with extension

```javascript
// add response listener
document.addEventListener('sendto-xhrpt-ext-res', function (e) {
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
    }
}
// send to extension
document.dispatchEvent(new CustomEvent('sendto-xhrpt-ext', {detail: data}))
```