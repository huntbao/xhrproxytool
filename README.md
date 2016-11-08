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

## 本地安装
谷歌在线应用商城需要翻墙，可以按照下述步骤安装：

* 下载本仓库代码，并解压
* 打开谷歌浏览器，选择右上角的设置图标（纵向排列的三个点）-> 更多工具 -> 扩展程序，进到 chrome://extensions/ 页面
* 勾选右上角的 “开发者模式”，选择“加载已解压的扩展程序”，会打开文件选择框，选择刚才下载并解压的目录下面的 `dist` 目录

此时插件就安装好了，之前打开的页面需要刷新才能使用