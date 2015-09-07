XHR Proxy Tool
===========

# Introduction #

XHR proxy tool is a chrome extension, it can fetch data from cross domain. 

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

## Send request info to extension

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
    }
}
// send to extension
document.dispatchEvent(new CustomEvent('sendto-xhrpt-ext', {detail: data}))
```