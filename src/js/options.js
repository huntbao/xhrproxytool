/**
 * Created by huntbao on 2017/1/24.
 */

function init() {
  var label = document.querySelector('#check-label')
  var checkbox = document.querySelectorAll('input')[0]
  label.addEventListener('click', function (e) {
    localStorage['xhr_proxy_tool_js_error_notify'] = checkbox.checked
  }, false)
  checkbox.checked = localStorage['xhr_proxy_tool_js_error_notify'] === 'true'
}
document.addEventListener('DOMContentLoaded', function () {
  init()
})
