// ==UserScript==
// @name                 V2EX.REP - 专注提升 V2EX 主题回复浏览体验
// @name:zh-CN           V2EX.REP - 专注提升 V2EX 主题回复浏览体验
// @namespace            https://github.com/v2hot/v2ex.rep
// @homepageURL          https://github.com/v2hot/v2ex.rep#readme
// @supportURL           https://github.com/v2hot/v2ex.rep/issues
// @version              1.4.4
// @description          专注提升 V2EX 主题回复浏览体验的浏览器扩展/用户脚本。主要功能有 ✅ 修复有被 block 的用户时错位的楼层号；✅ 回复时自动带上楼层号；✅ 显示热门回复；✅ 显示被引用的回复；✅ 查看用户在当前主题下的所有回复与被提及的回复；✅ 自动预加载所有分页，支持解析显示跨页面引用；✅ 回复时上传图片；✅ 无感自动签到；✅ 懒加载用户头像图片；✅ 一直显示感谢按钮 🙏；✅ 一直显示隐藏回复按钮 🙈；✅ 快速发送感谢/快速隐藏回复（no confirm）等。
// @description:zh-CN    专注提升 V2EX 主题回复浏览体验的浏览器扩展/用户脚本。主要功能有 ✅ 修复有被 block 的用户时错位的楼层号；✅ 回复时自动带上楼层号；✅ 显示热门回复；✅ 显示被引用的回复；✅ 查看用户在当前主题下的所有回复与被提及的回复；✅ 自动预加载所有分页，支持解析显示跨页面引用；✅ 回复时上传图片；✅ 无感自动签到；✅ 懒加载用户头像图片；✅ 一直显示感谢按钮 🙏；✅ 一直显示隐藏回复按钮 🙈；✅ 快速发送感谢/快速隐藏回复（no confirm）等。
// @icon                 https://www.v2ex.com/favicon.ico
// @author               Pipecraft
// @license              MIT
// @match                https://*.v2ex.com/*
// @run-at               document-start
// @grant                GM.getValue
// @grant                GM.setValue
// @grant                GM_addValueChangeListener
// @grant                GM_removeValueChangeListener
// @grant                GM_addElement
// @grant                GM_addStyle
// @grant                GM.registerMenuCommand
// ==/UserScript==
//
;(() => {
  "use strict"
  var listeners = {}
  var getValue = async (key) => {
    const value = await GM.getValue(key)
    return value && value !== "undefined" ? JSON.parse(value) : void 0
  }
  var setValue = async (key, value) => {
    if (value !== void 0) {
      const newValue = JSON.stringify(value)
      if (listeners[key]) {
        const oldValue = await GM.getValue(key)
        await GM.setValue(key, newValue)
        if (newValue !== oldValue) {
          for (const func of listeners[key]) {
            func(key, oldValue, newValue)
          }
        }
      } else {
        await GM.setValue(key, newValue)
      }
    }
  }
  var _addValueChangeListener = (key, func) => {
    listeners[key] = listeners[key] || []
    listeners[key].push(func)
    return () => {
      if (listeners[key] && listeners[key].length > 0) {
        for (let i = listeners[key].length - 1; i >= 0; i--) {
          if (listeners[key][i] === func) {
            listeners[key].splice(i, 1)
          }
        }
      }
    }
  }
  var addValueChangeListener = (key, func) => {
    if (typeof GM_addValueChangeListener !== "function") {
      console.warn("Do not support GM_addValueChangeListener!")
      return _addValueChangeListener(key, func)
    }
    const listenerId = GM_addValueChangeListener(key, func)
    return () => {
      GM_removeValueChangeListener(listenerId)
    }
  }
  var doc = document
  var win = window
  var $ = (selectors, element) => (element || doc).querySelector(selectors)
  var $$ = (selectors, element) => [
    ...(element || doc).querySelectorAll(selectors),
  ]
  var createElement = (tagName, attributes) =>
    setAttributes(doc.createElement(tagName), attributes)
  var addElement = (parentNode, tagName, attributes) => {
    if (!parentNode) {
      return
    }
    if (typeof parentNode === "string") {
      attributes = tagName
      tagName = parentNode
      parentNode = doc.head
    }
    if (typeof tagName === "string") {
      const element = createElement(tagName, attributes)
      parentNode.append(element)
      return element
    }
    setAttributes(tagName, attributes)
    parentNode.append(tagName)
    return tagName
  }
  var addStyle = (styleText) => {
    const element = createElement("style", { textContent: styleText })
    doc.head.append(element)
    return element
  }
  var addEventListener = (element, type, listener, options) => {
    if (!element) {
      return
    }
    if (typeof type === "object") {
      for (const type1 in type) {
        if (Object.hasOwn(type, type1)) {
          element.addEventListener(type1, type[type1])
        }
      }
    } else if (typeof type === "string" && typeof listener === "function") {
      element.addEventListener(type, listener, options)
    }
  }
  var removeEventListener = (element, type, listener, options) => {
    if (!element) {
      return
    }
    if (typeof type === "object") {
      for (const type1 in type) {
        if (Object.hasOwn(type, type1)) {
          element.removeEventListener(type1, type[type1])
        }
      }
    } else if (typeof type === "string" && typeof listener === "function") {
      element.removeEventListener(type, listener, options)
    }
  }
  var getAttribute = (element, name) =>
    element ? element.getAttribute(name) : null
  var setAttribute = (element, name, value) =>
    element ? element.setAttribute(name, value) : void 0
  var setAttributes = (element, attributes) => {
    if (element && attributes) {
      for (const name in attributes) {
        if (Object.hasOwn(attributes, name)) {
          const value = attributes[name]
          if (value === void 0) {
            continue
          }
          if (/^(value|textContent|innerText|innerHTML)$/.test(name)) {
            element[name] = value
          } else if (name === "style") {
            setStyle(element, value, true)
          } else if (/on\w+/.test(name)) {
            const type = name.slice(2)
            addEventListener(element, type, value)
          } else {
            setAttribute(element, name, value)
          }
        }
      }
    }
    return element
  }
  var addAttribute = (element, name, value) => {
    const orgValue = getAttribute(element, name)
    if (!orgValue) {
      setAttribute(element, name, value)
    } else if (!orgValue.includes(value)) {
      setAttribute(element, name, orgValue + " " + value)
    }
  }
  var addClass = (element, className) => {
    if (!element || !element.classList) {
      return
    }
    element.classList.add(className)
  }
  var removeClass = (element, className) => {
    if (!element || !element.classList) {
      return
    }
    element.classList.remove(className)
  }
  var hasClass = (element, className) => {
    if (!element || !element.classList) {
      return false
    }
    return element.classList.contains(className)
  }
  var setStyle = (element, values, overwrite) => {
    if (!element) {
      return
    }
    const style = element.style
    if (typeof values === "string") {
      style.cssText = overwrite ? values : style.cssText + ";" + values
      return
    }
    if (overwrite) {
      style.cssText = ""
    }
    for (const key in values) {
      if (Object.hasOwn(values, key)) {
        style[key] = values[key].replace("!important", "")
      }
    }
  }
  var throttle = (func, interval) => {
    let timeoutId2 = null
    let next = false
    const handler = (...args) => {
      if (timeoutId2) {
        next = true
      } else {
        func.apply(void 0, args)
        timeoutId2 = setTimeout(() => {
          timeoutId2 = null
          if (next) {
            next = false
            handler()
          }
        }, interval)
      }
    }
    return handler
  }
  if (typeof Object.hasOwn !== "function") {
    Object.hasOwn = (instance, prop) =>
      Object.prototype.hasOwnProperty.call(instance, prop)
  }
  var actionHref = "javascript:;"
  var getOffsetPosition = (element, referElement) => {
    const position = { top: 0, left: 0 }
    referElement = referElement || doc.body
    while (element && element !== referElement) {
      position.top += element.offsetTop
      position.left += element.offsetLeft
      element = element.offsetParent
    }
    return position
  }
  var runOnceCache = {}
  var runOnce = (key, func) => {
    if (!key) {
      return func()
    }
    if (Object.hasOwn(runOnceCache, key)) {
      return runOnceCache[key]
    }
    const result = func()
    runOnceCache[key] = result
    return result
  }
  var addElement2 =
    typeof GM_addElement === "function"
      ? (parentNode, tagName, attributes) => {
          if (!parentNode) {
            return
          }
          if (typeof parentNode === "string") {
            attributes = tagName
            tagName = parentNode
            parentNode = doc.head
          }
          if (typeof tagName === "string") {
            const element = GM_addElement(tagName)
            setAttributes(element, attributes)
            parentNode.append(element)
            return element
          }
          setAttributes(tagName, attributes)
          parentNode.append(tagName)
          return tagName
        }
      : addElement
  var addStyle2 =
    typeof GM_addStyle === "function"
      ? (styleText) => GM_addStyle(styleText)
      : addStyle
  var registerMenuCommand = (name, callback, accessKey) => {
    if (window !== top) {
      return
    }
    if (typeof GM.registerMenuCommand !== "function") {
      console.warn("Do not support GM.registerMenuCommand!")
      return
    }
    GM.registerMenuCommand(name, callback, accessKey)
  }
  var style_default = `#browser_extension_settings_container{--browser-extension-settings-background-color: #f2f2f7;--browser-extension-settings-text-color: #444444;--browser-extension-settings-link-color: #217dfc;--sb-track-color: #00000000;--sb-thumb-color: #33334480;--sb-size: 2px;position:fixed;top:10px;right:30px;max-height:90%;height:600px;overflow:hidden;display:none;z-index:100000;border-radius:5px;-webkit-box-shadow:0px 10px 39px 10px rgba(62,66,66,.22);-moz-box-shadow:0px 10px 39px 10px rgba(62,66,66,.22);box-shadow:0px 10px 39px 10px rgba(62,66,66,.22) !important}#browser_extension_settings_container .browser_extension_settings_wrapper{display:flex;height:100%;overflow:hidden;background-color:var(--browser-extension-settings-background-color)}#browser_extension_settings_container .browser_extension_settings_wrapper h1{font-size:26px;font-weight:800;border:none}#browser_extension_settings_container .browser_extension_settings_wrapper h2{font-size:18px;font-weight:600;border:none}#browser_extension_settings_container .browser_extension_settings_wrapper .extension_list_container{overflow-x:auto;box-sizing:border-box;padding:10px 15px;background-color:var(--browser-extension-settings-background-color);color:var(--browser-extension-settings-text-color)}#browser_extension_settings_container .browser_extension_settings_wrapper .extension_list_container .installed_extension_list div,#browser_extension_settings_container .browser_extension_settings_wrapper .extension_list_container .related_extension_list div{background-color:#fff;font-size:14px;border-top:1px solid #ccc;padding:6px 15px 6px 15px}#browser_extension_settings_container .browser_extension_settings_wrapper .extension_list_container .installed_extension_list div a,#browser_extension_settings_container .browser_extension_settings_wrapper .extension_list_container .installed_extension_list div a:visited,#browser_extension_settings_container .browser_extension_settings_wrapper .extension_list_container .related_extension_list div a,#browser_extension_settings_container .browser_extension_settings_wrapper .extension_list_container .related_extension_list div a:visited{display:flex;justify-content:space-between;align-items:center;cursor:pointer;text-decoration:none;color:var(--browser-extension-settings-text-color)}#browser_extension_settings_container .browser_extension_settings_wrapper .extension_list_container .installed_extension_list div a:hover,#browser_extension_settings_container .browser_extension_settings_wrapper .extension_list_container .installed_extension_list div a:visited:hover,#browser_extension_settings_container .browser_extension_settings_wrapper .extension_list_container .related_extension_list div a:hover,#browser_extension_settings_container .browser_extension_settings_wrapper .extension_list_container .related_extension_list div a:visited:hover{text-decoration:none;color:var(--browser-extension-settings-text-color)}#browser_extension_settings_container .browser_extension_settings_wrapper .extension_list_container .installed_extension_list div a span,#browser_extension_settings_container .browser_extension_settings_wrapper .extension_list_container .installed_extension_list div a:visited span,#browser_extension_settings_container .browser_extension_settings_wrapper .extension_list_container .related_extension_list div a span,#browser_extension_settings_container .browser_extension_settings_wrapper .extension_list_container .related_extension_list div a:visited span{margin-right:10px;line-height:24px}#browser_extension_settings_container .browser_extension_settings_wrapper .extension_list_container .installed_extension_list div.active,#browser_extension_settings_container .browser_extension_settings_wrapper .extension_list_container .installed_extension_list div:hover,#browser_extension_settings_container .browser_extension_settings_wrapper .extension_list_container .related_extension_list div.active,#browser_extension_settings_container .browser_extension_settings_wrapper .extension_list_container .related_extension_list div:hover{background-color:#e4e4e6}#browser_extension_settings_container .browser_extension_settings_wrapper .extension_list_container .installed_extension_list div.active a,#browser_extension_settings_container .browser_extension_settings_wrapper .extension_list_container .related_extension_list div.active a{cursor:default}#browser_extension_settings_container .browser_extension_settings_wrapper .extension_list_container .installed_extension_list div:first-of-type,#browser_extension_settings_container .browser_extension_settings_wrapper .extension_list_container .related_extension_list div:first-of-type{border-top:none;border-top-right-radius:10px;border-top-left-radius:10px}#browser_extension_settings_container .browser_extension_settings_wrapper .extension_list_container .installed_extension_list div:last-of-type,#browser_extension_settings_container .browser_extension_settings_wrapper .extension_list_container .related_extension_list div:last-of-type{border-bottom-right-radius:10px;border-bottom-left-radius:10px}#browser_extension_settings_container .thin_scrollbar{scrollbar-color:var(--sb-thumb-color) var(--sb-track-color);scrollbar-width:thin}#browser_extension_settings_container .thin_scrollbar::-webkit-scrollbar{width:var(--sb-size)}#browser_extension_settings_container .thin_scrollbar::-webkit-scrollbar-track{background:var(--sb-track-color);border-radius:10px}#browser_extension_settings_container .thin_scrollbar::-webkit-scrollbar-thumb{background:var(--sb-thumb-color);border-radius:10px}#browser_extension_settings_main{min-width:250px;overflow-y:auto;overflow-x:hidden;box-sizing:border-box;padding:10px 15px;background-color:var(--browser-extension-settings-background-color);color:var(--browser-extension-settings-text-color)}#browser_extension_settings_main h2{text-align:center;margin:5px 0 0;font-size:18px;font-weight:600;border:none}#browser_extension_settings_main footer{display:flex;justify-content:center;flex-direction:column;font-size:11px;margin:10px auto 0px;background-color:var(--browser-extension-settings-background-color);color:var(--browser-extension-settings-text-color)}#browser_extension_settings_main footer a{color:var(--browser-extension-settings-link-color) !important;text-decoration:none;padding:0}#browser_extension_settings_main footer p{text-align:center;padding:0;margin:2px;line-height:13px}#browser_extension_settings_main a.navigation_go_previous{color:var(--browser-extension-settings-link-color);cursor:pointer;display:none}#browser_extension_settings_main a.navigation_go_previous::before{content:"< "}#browser_extension_settings_main .option_groups{background-color:#fff;padding:6px 15px 6px 15px;border-radius:10px;display:flex;flex-direction:column;margin:10px 0 0}#browser_extension_settings_main .option_groups .action{font-size:14px;border-top:1px solid #ccc;padding:6px 0 6px 0;color:var(--browser-extension-settings-link-color);cursor:pointer}#browser_extension_settings_main .option_groups textarea{font-size:12px;margin:10px 0 10px 0;height:100px;width:100%;border:1px solid #a9a9a9;border-radius:4px;box-sizing:border-box}#browser_extension_settings_main .switch_option{display:flex;justify-content:space-between;align-items:center;border-top:1px solid #ccc;padding:6px 0 6px 0;font-size:14px}#browser_extension_settings_main .switch_option:first-of-type,#browser_extension_settings_main .option_groups .action:first-of-type{border-top:none}#browser_extension_settings_main .switch_option>span{margin-right:10px}#browser_extension_settings_main .option_groups .tip{position:relative;margin:0;padding:0 15px 0 0;border:none;max-width:none;font-size:14px}#browser_extension_settings_main .option_groups .tip .tip_anchor{cursor:help;text-decoration:underline}#browser_extension_settings_main .option_groups .tip .tip_content{position:absolute;bottom:15px;left:0;background-color:#fff;color:var(--browser-extension-settings-text-color);text-align:left;padding:10px;display:none;border-radius:5px;-webkit-box-shadow:0px 10px 39px 10px rgba(62,66,66,.22);-moz-box-shadow:0px 10px 39px 10px rgba(62,66,66,.22);box-shadow:0px 10px 39px 10px rgba(62,66,66,.22) !important}#browser_extension_settings_main .option_groups .tip .tip_anchor:hover+.tip_content,#browser_extension_settings_main .option_groups .tip .tip_content:hover{display:block}#browser_extension_settings_main .option_groups .tip p,#browser_extension_settings_main .option_groups .tip pre{margin:revert;padding:revert}#browser_extension_settings_main .option_groups .tip pre{font-family:Consolas,panic sans,bitstream vera sans mono,Menlo,microsoft yahei,monospace;font-size:13px;letter-spacing:.015em;line-height:120%;white-space:pre;overflow:auto;background-color:#f5f5f5;word-break:normal;overflow-wrap:normal;padding:.5em;border:none}#browser_extension_settings_main .container{--button-width: 51px;--button-height: 24px;--toggle-diameter: 20px;--color-off: #e9e9eb;--color-on: #34c759;width:var(--button-width);height:var(--button-height);position:relative;padding:0;margin:0;flex:none}#browser_extension_settings_main input[type=checkbox]{opacity:0;width:0;height:0;position:absolute}#browser_extension_settings_main .switch{width:100%;height:100%;display:block;background-color:var(--color-off);border-radius:calc(var(--button-height)/2);border:none;cursor:pointer;transition:all .2s ease-out}#browser_extension_settings_main .switch::before{display:none}#browser_extension_settings_main .slider{width:var(--toggle-diameter);height:var(--toggle-diameter);position:absolute;left:2px;top:calc(50% - var(--toggle-diameter)/2);border-radius:50%;background:#fff;box-shadow:0px 3px 8px rgba(0,0,0,.15),0px 3px 1px rgba(0,0,0,.06);transition:all .2s ease-out;cursor:pointer}#browser_extension_settings_main input[type=checkbox]:checked+.switch{background-color:var(--color-on)}#browser_extension_settings_main input[type=checkbox]:checked+.switch .slider{left:calc(var(--button-width) - var(--toggle-diameter) - 2px)}#browser_extension_side_menu{min-height:200px;width:40px;opacity:0;position:fixed;top:80px;right:0;padding-top:20px;z-index:10000}#browser_extension_side_menu:hover{opacity:1}#browser_extension_side_menu button{cursor:pointer;width:24px;height:24px;border:none;background-color:rgba(0,0,0,0);background-image:url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M12.0002 16C14.2094 16 16.0002 14.2091 16.0002 12C16.0002 9.79086 14.2094 8 12.0002 8C9.79109 8 8.00023 9.79086 8.00023 12C8.00023 14.2091 9.79109 16 12.0002 16ZM12.0002 14C13.1048 14 14.0002 13.1046 14.0002 12C14.0002 10.8954 13.1048 10 12.0002 10C10.8957 10 10.0002 10.8954 10.0002 12C10.0002 13.1046 10.8957 14 12.0002 14Z' fill='black'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M15.1182 1.86489L15.5203 4.81406C15.8475 4.97464 16.1621 5.1569 16.4623 5.35898L19.2185 4.23223C19.6814 4.043 20.2129 4.2248 20.463 4.65787L22.5901 8.34213C22.8401 8.77521 22.7318 9.3264 22.3365 9.63266L19.9821 11.4566C19.9941 11.6362 20.0002 11.8174 20.0002 12C20.0002 12.1826 19.9941 12.3638 19.9821 12.5434L22.3365 14.3673C22.7318 14.6736 22.8401 15.2248 22.5901 15.6579L20.463 19.3421C20.2129 19.7752 19.6814 19.957 19.2185 19.7678L16.4623 18.641C16.1621 18.8431 15.8475 19.0254 15.5203 19.1859L15.1182 22.1351C15.0506 22.6306 14.6274 23 14.1273 23H9.87313C9.37306 23 8.94987 22.6306 8.8823 22.1351L8.48014 19.1859C8.15296 19.0254 7.83835 18.8431 7.53818 18.641L4.78195 19.7678C4.31907 19.957 3.78756 19.7752 3.53752 19.3421L1.41042 15.6579C1.16038 15.2248 1.26869 14.6736 1.66401 14.3673L4.01841 12.5434C4.00636 12.3638 4.00025 12.1826 4.00025 12C4.00025 11.8174 4.00636 11.6362 4.01841 11.4566L1.66401 9.63266C1.26869 9.3264 1.16038 8.77521 1.41041 8.34213L3.53752 4.65787C3.78755 4.2248 4.31906 4.043 4.78195 4.23223L7.53818 5.35898C7.83835 5.1569 8.15296 4.97464 8.48014 4.81406L8.8823 1.86489C8.94987 1.3694 9.37306 1 9.87313 1H14.1273C14.6274 1 15.0506 1.3694 15.1182 1.86489ZM13.6826 6.14004L14.6392 6.60948C14.8842 6.72975 15.1201 6.86639 15.3454 7.01805L16.231 7.61423L19.1674 6.41382L20.4216 8.58619L17.9153 10.5278L17.9866 11.5905C17.9956 11.7255 18.0002 11.8621 18.0002 12C18.0002 12.1379 17.9956 12.2745 17.9866 12.4095L17.9153 13.4722L20.4216 15.4138L19.1674 17.5862L16.231 16.3858L15.3454 16.982C15.1201 17.1336 14.8842 17.2702 14.6392 17.3905L13.6826 17.86L13.2545 21H10.746L10.3178 17.86L9.36131 17.3905C9.11626 17.2702 8.88037 17.1336 8.6551 16.982L7.76954 16.3858L4.83313 17.5862L3.57891 15.4138L6.0852 13.4722L6.01392 12.4095C6.00487 12.2745 6.00024 12.1379 6.00024 12C6.00024 11.8621 6.00487 11.7255 6.01392 11.5905L6.0852 10.5278L3.57891 8.58619L4.83312 6.41382L7.76953 7.61423L8.6551 7.01805C8.88037 6.86639 9.11625 6.72976 9.36131 6.60949L10.3178 6.14004L10.746 3H13.2545L13.6826 6.14004Z' fill='black'/%3E%3C/svg%3E")}#browser_extension_side_menu button:hover{opacity:70%}#browser_extension_side_menu button:active{opacity:100%}@media(max-width: 500px){#browser_extension_settings_container{right:10px}#browser_extension_settings_container .extension_list_container{display:none}#browser_extension_settings_container .extension_list_container.bes_active{display:block}#browser_extension_settings_container .extension_list_container.bes_active+div{display:none}#browser_extension_settings_main a.navigation_go_previous{display:block}}`
  function createSwitch(options = {}) {
    const container = createElement("label", { class: "container" })
    const checkbox = createElement(
      "input",
      options.checked ? { type: "checkbox", checked: "" } : { type: "checkbox" }
    )
    addElement2(container, checkbox)
    const switchElm = createElement("span", { class: "switch" })
    addElement2(switchElm, "span", { class: "slider" })
    addElement2(container, switchElm)
    if (options.onchange) {
      addEventListener(checkbox, "change", options.onchange)
    }
    return container
  }
  function createSwitchOption(text, options) {
    const div = createElement("div", { class: "switch_option" })
    addElement2(div, "span", { textContent: text })
    div.append(createSwitch(options))
    return div
  }
  var besVersion = 13
  var openButton = `<svg viewBox="0 0 60.2601318359375 84.8134765625" version="1.1" xmlns="http://www.w3.org/2000/svg" class=" glyph-box" style="height: 9.62969px; width: 6.84191px;"><g transform="matrix(1 0 0 1 -6.194965820312518 77.63671875)"><path d="M66.4551-35.2539C66.4551-36.4746 65.9668-37.5977 65.0391-38.4766L26.3672-76.3672C25.4883-77.1973 24.4141-77.6367 23.1445-77.6367C20.6543-77.6367 18.7012-75.7324 18.7012-73.1934C18.7012-71.9727 19.1895-70.8496 19.9707-70.0195L55.5176-35.2539L19.9707-0.488281C19.1895 0.341797 18.7012 1.41602 18.7012 2.68555C18.7012 5.22461 20.6543 7.12891 23.1445 7.12891C24.4141 7.12891 25.4883 6.68945 26.3672 5.81055L65.0391-32.0312C65.9668-32.959 66.4551-34.0332 66.4551-35.2539Z"></path></g></svg>`
  var openInNewTabButton = `<svg viewBox="0 0 72.127685546875 72.2177734375" version="1.1" xmlns="http://www.w3.org/2000/svg" class=" glyph-box" style="height: 8.19958px; width: 8.18935px;"><g transform="matrix(1 0 0 1 -12.451127929687573 71.3388671875)"><path d="M84.5703-17.334L84.5215-66.4551C84.5215-69.2383 82.7148-71.1914 79.7852-71.1914L30.6641-71.1914C27.9297-71.1914 26.0742-69.0918 26.0742-66.748C26.0742-64.4043 28.1738-62.4023 30.4688-62.4023L47.4609-62.4023L71.2891-63.1836L62.207-55.2246L13.8184-6.73828C12.9395-5.85938 12.4512-4.73633 12.4512-3.66211C12.4512-1.31836 14.5508 0.878906 16.9922 0.878906C18.1152 0.878906 19.1895 0.488281 20.0684-0.439453L68.5547-48.877L76.6113-58.0078L75.7324-35.2051L75.7324-17.1387C75.7324-14.8438 77.7344-12.6953 80.127-12.6953C82.4707-12.6953 84.5703-14.6973 84.5703-17.334Z"></path></g></svg>`
  var relatedExtensions = [
    {
      id: "utags",
      title: "\u{1F3F7}\uFE0F UTags - Add usertags to links",
      url: "https://greasyfork.org/scripts/460718",
    },
    {
      id: "links-helper",
      title: "\u{1F517} \u94FE\u63A5\u52A9\u624B",
      description:
        "\u5728\u65B0\u6807\u7B7E\u9875\u4E2D\u6253\u5F00\u7B2C\u4E09\u65B9\u7F51\u7AD9\u94FE\u63A5\uFF0C\u56FE\u7247\u94FE\u63A5\u8F6C\u56FE\u7247\u6807\u7B7E\u7B49",
      url: "https://greasyfork.org/scripts/464541",
    },
    {
      id: "v2ex.rep",
      title:
        "V2EX.REP - \u4E13\u6CE8\u63D0\u5347 V2EX \u4E3B\u9898\u56DE\u590D\u6D4F\u89C8\u4F53\u9A8C",
      url: "https://greasyfork.org/scripts/466589",
    },
    {
      id: "v2ex.min",
      title: "v2ex.min - V2EX \u6781\u7B80\u98CE\u683C",
      url: "https://greasyfork.org/scripts/463552",
    },
  ]
  var getInstalledExtesionList = () => {
    return $(".extension_list_container .installed_extension_list")
  }
  var getRelatedExtesionList = () => {
    return $(".extension_list_container .related_extension_list")
  }
  var isInstalledExtension = (id) => {
    const list = getInstalledExtesionList()
    if (!list) {
      return false
    }
    const installed = $(`[data-extension-id="${id}"]`, list)
    return Boolean(installed)
  }
  var addCurrentExtension = (extension) => {
    const list = getInstalledExtesionList()
    if (!list) {
      return
    }
    if (isInstalledExtension(extension.id)) {
      return
    }
    const element = createInstalledExtension(extension)
    list.append(element)
    const list2 = getRelatedExtesionList()
    if (list2) {
      updateRelatedExtensions(list2)
    }
  }
  var activeExtension = (id) => {
    const list = getInstalledExtesionList()
    if (!list) {
      return false
    }
    for (const element of $$(".active", list)) {
      removeClass(element, "active")
    }
    const installed = $(`[data-extension-id="${id}"]`, list)
    if (installed) {
      addClass(installed, "active")
    }
  }
  var activeExtensionList = () => {
    const extensionListContainer = $(".extension_list_container")
    if (extensionListContainer) {
      addClass(extensionListContainer, "bes_active")
    }
  }
  var deactiveExtensionList = () => {
    const extensionListContainer = $(".extension_list_container")
    if (extensionListContainer) {
      removeClass(extensionListContainer, "bes_active")
    }
  }
  var createInstalledExtension = (installedExtension) => {
    const div = createElement("div", {
      class: "installed_extension",
      "data-extension-id": installedExtension.id,
    })
    const a = addElement2(div, "a", {
      onclick: installedExtension.onclick,
    })
    addElement2(a, "span", {
      textContent: installedExtension.title,
    })
    const svg = addElement2(a, "svg")
    svg.outerHTML = openButton
    return div
  }
  var updateRelatedExtensions = (container) => {
    container.innerHTML = ""
    for (const relatedExtension of relatedExtensions) {
      if (isInstalledExtension(relatedExtension.id)) {
        continue
      }
      const div4 = addElement2(container, "div", {
        class: "related_extension",
      })
      const a = addElement2(div4, "a", {
        href: relatedExtension.url,
        target: "_blank",
      })
      addElement2(a, "span", {
        textContent: relatedExtension.title,
      })
      const svg = addElement2(a, "svg")
      svg.outerHTML = openInNewTabButton
    }
  }
  function createExtensionList(installedExtensions) {
    const div = createElement("div", {
      class: "extension_list_container thin_scrollbar",
    })
    addElement2(div, "h1", { textContent: "Settings" })
    const div2 = addElement2(div, "div", {
      class: "installed_extension_list",
    })
    for (const installedExtension of installedExtensions) {
      if (isInstalledExtension(installedExtension.id)) {
        continue
      }
      const element = createInstalledExtension(installedExtension)
      div2.append(element)
    }
    addElement2(div, "h2", { textContent: "Other Extensions" })
    const div3 = addElement2(div, "div", {
      class: "related_extension_list",
    })
    updateRelatedExtensions(div3)
    return div
  }
  var prefix = "browser_extension_settings_"
  var randomId = String(Math.round(Math.random() * 1e4))
  var settingsContainerId = prefix + "container_" + randomId
  var settingsElementId = prefix + "main_" + randomId
  var getSettingsElement = () => $("#" + settingsElementId)
  var getSettingsStyle = () =>
    style_default
      .replace(/browser_extension_settings_container/gm, settingsContainerId)
      .replace(/browser_extension_settings_main/gm, settingsElementId)
  var storageKey = "settings"
  var settingsOptions
  var settingsTable = {}
  var settings = {}
  async function getSettings() {
    var _a
    return (_a = await getValue(storageKey)) != null ? _a : {}
  }
  async function saveSattingsValue(key, value) {
    const settings2 = await getSettings()
    settings2[key] =
      settingsTable[key] && settingsTable[key].defaultValue === value
        ? void 0
        : value
    await setValue(storageKey, settings2)
  }
  function getSettingsValue(key) {
    var _a
    return Object.hasOwn(settings, key)
      ? settings[key]
      : (_a = settingsTable[key]) == null
      ? void 0
      : _a.defaultValue
  }
  var closeModal = () => {
    const settingsContainer = getSettingsContainer()
    if (settingsContainer) {
      settingsContainer.style.display = "none"
    }
    removeEventListener(document, "click", onDocumentClick, true)
    removeEventListener(document, "keydown", onDocumentKeyDown, true)
  }
  var onDocumentClick = (event) => {
    const target = event.target
    if (target == null ? void 0 : target.closest(`.${prefix}container`)) {
      return
    }
    closeModal()
  }
  var onDocumentKeyDown = (event) => {
    if (event.defaultPrevented) {
      return
    }
    if (event.key === "Escape") {
      closeModal()
      event.preventDefault()
    }
  }
  async function updateOptions() {
    if (!getSettingsElement()) {
      return
    }
    for (const key in settingsTable) {
      if (Object.hasOwn(settingsTable, key)) {
        const checkbox = $(
          `#${settingsElementId} .option_groups .switch_option[data-key="${key}"] input`
        )
        if (checkbox) {
          checkbox.checked = getSettingsValue(key)
        }
      }
    }
    const host = location.host
    const group2 = $(`#${settingsElementId} .option_groups:nth-of-type(2)`)
    if (group2) {
      group2.style.display = getSettingsValue(
        `enableCustomRulesForCurrentSite_${host}`
      )
        ? "block"
        : "none"
    }
    const customStyleValue = $(`#${settingsElementId} .option_groups textarea`)
    if (customStyleValue) {
      customStyleValue.value =
        settings[`customRulesForCurrentSite_${host}`] || ""
    }
  }
  function getSettingsContainer() {
    const container = $(`.${prefix}container`)
    if (container) {
      const theVersion = Number.parseInt(
        container.dataset.besVersion || "0",
        10
      )
      if (theVersion < besVersion) {
        container.id = settingsContainerId
        container.dataset.besVersion = String(besVersion)
      }
      return container
    }
    return addElement2(doc.body, "div", {
      id: settingsContainerId,
      class: `${prefix}container`,
      "data-bes-version": besVersion,
      style: "display: none;",
    })
  }
  function getSettingsWrapper() {
    const container = getSettingsContainer()
    return (
      $(`.${prefix}wrapper`, container) ||
      addElement2(container, "div", {
        class: `${prefix}wrapper`,
      })
    )
  }
  function initExtensionList() {
    if (!doc.body) {
      setTimeout(initExtensionList, 100)
      return
    }
    const wrapper = getSettingsWrapper()
    if (!$(".extension_list_container", wrapper)) {
      const list = createExtensionList([])
      wrapper.append(list)
    }
    addCurrentExtension({
      id: settingsOptions.id,
      title: settingsOptions.title,
      onclick: showSettings,
    })
  }
  function createSettingsElement() {
    let settingsMain = getSettingsElement()
    if (!settingsMain) {
      const wrapper = getSettingsWrapper()
      for (const element of $$(`.${prefix}main`)) {
        element.remove()
      }
      settingsMain = addElement2(wrapper, "div", {
        id: settingsElementId,
        class: `${prefix}main thin_scrollbar`,
      })
      addElement2(settingsMain, "a", {
        textContent: "Settings",
        class: "navigation_go_previous",
        onclick() {
          activeExtensionList()
        },
      })
      if (settingsOptions.title) {
        addElement2(settingsMain, "h2", { textContent: settingsOptions.title })
      }
      const options = addElement2(settingsMain, "div", {
        class: "option_groups",
      })
      for (const key in settingsTable) {
        if (Object.hasOwn(settingsTable, key)) {
          const item = settingsTable[key]
          if (!item.type || item.type === "switch") {
            const switchOption = createSwitchOption(item.title, {
              async onchange(event) {
                if (event.target) {
                  await saveSattingsValue(key, event.target.checked)
                }
              },
            })
            switchOption.dataset.key = key
            addElement2(options, switchOption)
          }
        }
      }
      const options2 = addElement2(settingsMain, "div", {
        class: "option_groups",
      })
      let timeoutId2
      addElement2(options2, "textarea", {
        placeholder: `/* Custom rules for internal URLs, matching URLs will be opened in new tabs */`,
        onkeyup(event) {
          const textArea = event.target
          if (timeoutId2) {
            clearTimeout(timeoutId2)
            timeoutId2 = void 0
          }
          timeoutId2 = setTimeout(async () => {
            const host = location.host
            if (textArea) {
              await saveSattingsValue(
                `customRulesForCurrentSite_${host}`,
                textArea.value.trim()
              )
            }
          }, 100)
        },
      })
      const tip = addElement2(options2, "div", {
        class: "tip",
      })
      addElement2(tip, "a", {
        class: "tip_anchor",
        textContent: "Examples",
      })
      const tipContent = addElement2(tip, "div", {
        class: "tip_content",
        innerHTML: `<p>Custom rules for internal URLs, matching URLs will be opened in new tabs</p>
      <p>
      - One line per url pattern<br>
      - All URLs contains '/posts' or '/users/'<br>
      <pre>/posts/
/users/</pre>
      - Regex is supported<br>
      <pre>^/(posts|members)/d+</pre>
      - '*' for all URLs
      </p>`,
      })
      if (settingsOptions.footer) {
        const footer = addElement2(settingsMain, "footer")
        footer.innerHTML =
          typeof settingsOptions.footer === "string"
            ? settingsOptions.footer
            : `<p>Made with \u2764\uFE0F by
      <a href="https://www.pipecraft.net/" target="_blank">
        Pipecraft
      </a></p>`
      }
    }
    return settingsMain
  }
  function addSideMenu() {
    if (!doc.body) {
      setTimeout(addSideMenu, 100)
      return
    }
    const menu =
      $("#browser_extension_side_menu") ||
      addElement2(doc.body, "div", {
        id: "browser_extension_side_menu",
        "data-bes-version": besVersion,
      })
    const button = $("button[data-bes-version]", menu)
    if (button) {
      const theVersion = Number.parseInt(button.dataset.besVersion || "0", 10)
      if (theVersion >= besVersion) {
        return
      }
      button.remove()
    }
    addElement2(menu, "button", {
      type: "button",
      "data-bes-version": besVersion,
      title: "\u8BBE\u7F6E",
      onclick() {
        setTimeout(showSettings, 1)
      },
    })
  }
  async function showSettings() {
    const settingsContainer = getSettingsContainer()
    const settingsMain = createSettingsElement()
    await updateOptions()
    settingsContainer.style.display = "block"
    addEventListener(document, "click", onDocumentClick, true)
    addEventListener(document, "keydown", onDocumentKeyDown, true)
    activeExtension(settingsOptions.id)
    deactiveExtensionList()
  }
  var initSettings = async (options) => {
    settingsOptions = options
    settingsTable = options.settingsTable || {}
    addValueChangeListener(storageKey, async () => {
      settings = await getSettings()
      await updateOptions()
      if (typeof options.onValueChange === "function") {
        options.onValueChange()
      }
    })
    settings = await getSettings()
    addStyle2(getSettingsStyle())
    initExtensionList()
    addSideMenu()
  }
  var content_default =
    'a.icon_button{opacity:1 !important;visibility:visible;margin-right:14px}a.icon_button:last-child{margin-right:0}a.icon_button svg{vertical-align:text-top}body .v2p-controls{opacity:1}body .v2p-controls>a.icon_button{margin-right:0}body .v2p-controls div a{margin-right:15px}body .v2p-controls div a:last-child{margin-right:0}body .v2p-controls a[onclick^=replyOne]{opacity:1 !important}.sticky_rightbar #Rightbar{position:sticky;top:0;max-height:100vh;overflow-y:auto;overflow-x:hidden;--sb-track-color: #00000000;--sb-thumb-color: #33334480;--sb-size: 2px;scrollbar-color:rgba(0,0,0,0) rgba(0,0,0,0);scrollbar-width:thin}.sticky_rightbar #Rightbar:hover{scrollbar-color:var(--sb-thumb-color) var(--sb-track-color)}.sticky_rightbar #Rightbar::-webkit-scrollbar{width:var(--sb-size)}.sticky_rightbar #Rightbar::-webkit-scrollbar-track{background:rgba(0,0,0,0);border-radius:10px}.sticky_rightbar #Rightbar:hover::-webkit-scrollbar-track{background:var(--sb-track-color)}.sticky_rightbar #Rightbar::-webkit-scrollbar-thumb{background:rgba(0,0,0,0);border-radius:10px}.sticky_rightbar #Rightbar:hover::-webkit-scrollbar-thumb{background:var(--sb-thumb-color)}.sticky_rightbar #Rightbar .v2p-tool-box{position:unset}.related_replies_container .related_replies{position:absolute;z-index:10000;width:100%;-webkit-box-shadow:0px 10px 39px 10px rgba(62,66,66,.22);-moz-box-shadow:0px 10px 39px 10px rgba(62,66,66,.22);box-shadow:0px 10px 39px 10px rgba(62,66,66,.22) !important}.related_replies_container .related_replies_before::before{content:"";display:block;width:100%;height:10000px;position:absolute;margin-top:-10000px;background-color:#334;opacity:50%}.related_replies_container .related_replies_after::after{content:"";display:block;width:100%;height:10000px;position:absolute;background-color:#334;opacity:50%}.related_replies_container.no_replies .related_replies_before::before,.related_replies_container.no_replies .related_replies_after::after{display:none}.related_replies_container .tabs{position:sticky;top:0;display:flex;justify-content:center;z-index:10001}.related_replies_container .tabs a{cursor:pointer}a.no{background-color:rgba(0,0,0,0) !important;color:#1484cd !important;border:1px solid #1484cd;border-radius:3px !important;opacity:1 !important}.cited_floor_number{color:#1484cd !important;cursor:pointer}.reply_content .cell.cited_reply{scale:.85;opacity:.85;background-color:#f5f5f5;border:1px solid var(--box-border-color);white-space:initial}.reply_content .cell.cited_reply:hover{opacity:1}.reply_content .cell.cited_reply .vr_wrapper{max-height:150px;overflow:auto;--sb-track-color: #00000000;--sb-thumb-color: #33334480;--sb-size: 2px;scrollbar-color:var(--sb-thumb-color) var(--sb-track-color);scrollbar-width:thin}.reply_content .cell.cited_reply .vr_wrapper::-webkit-scrollbar{width:var(--sb-size)}.reply_content .cell.cited_reply .vr_wrapper::-webkit-scrollbar-track{background:var(--sb-track-color);border-radius:10px}.reply_content .cell.cited_reply .vr_wrapper::-webkit-scrollbar-thumb{background:var(--sb-thumb-color);border-radius:10px}.v2p-indent .cell.cited_reply,.v2p-indent .reply_content+.reply_content,.v2p-indent .reply_content+.reply_content+.v2p-expand-btn,.v2p-indent .v2p-collapsed:has(.reply_content+.reply_content)::before,.comment .comment .cell.cited_reply{display:none}#top_replies .cell .vr_wrapper{position:relative;max-height:150px;overflow:hidden}#top_replies .cell .vr_wrapper::after{content:"";display:block;position:absolute;bottom:0;width:100%;height:5px;opacity:.8;background-color:var(--box-background-color)}.sticky_paging{position:sticky;bottom:0;background-color:var(--box-background-color);border-top:1px solid var(--box-border-color)}.Night .reply_content .cell.cited_reply{background-color:#1d1f21}.vr_upload_image{cursor:pointer}.vr_upload_image.vr_button_disabled,.vr_upload_image.vr_button_disabled:hover{cursor:default;text-decoration:none;color:var(--color-fade)}.sticky_topic_buttons .topic_buttons,.sticky_topic_buttons .topic_buttons_mobile{position:sticky;bottom:0;background-color:var(--box-background-color);border-top:1px solid var(--box-border-color)}.sticky_topic_buttons .header+.cell{border-bottom:none}'
  var addLinkToAvatars = (replyElement) => {
    var _a
    const memberLink = $('a[href^="/member/"]', replyElement)
    if (
      memberLink &&
      ((_a = memberLink.firstChild) == null ? void 0 : _a.tagName) === "IMG"
    ) {
      return
    }
    const avatar = $("img.avatar", replyElement)
    if (memberLink && avatar) {
      const memberLink2 = createElement("a", {
        href: getAttribute(memberLink, "href"),
      })
      avatar.after(memberLink2)
      memberLink2.append(avatar)
    }
  }
  var getReplyElements = () => {
    const firstReply = $('.box .cell[id^="r_"]')
    if (firstReply == null ? void 0 : firstReply.parentElement) {
      const v2exPolishModel = $(".v2p-model-mask")
      return $$('.cell[id^="r_"]', firstReply.parentElement).filter((reply) => {
        if (v2exPolishModel && reply.closest(".v2p-model-mask")) {
          return false
        }
        return true
      })
    }
    return []
  }
  var cachedReplyElements
  var getCachedReplyElements = () => {
    if (!cachedReplyElements) {
      if (doc.readyState === "loading") {
        return getReplyElements()
      }
      cachedReplyElements = getReplyElements()
    }
    return cachedReplyElements
  }
  var resetCachedReplyElements = () => {
    cachedReplyElements = void 0
  }
  var getReplyId = (replyElement) => {
    if (!replyElement) {
      return ""
    }
    let id = replyElement.dataset.id
    if (id) {
      return id
    }
    id = replyElement.id.replace(/((top|related|cited)_)?r_/, "")
    replyElement.dataset.id = id
    return id
  }
  var getFloorNumberElement = (replyElement) =>
    replyElement ? $(".no", replyElement) : void 0
  var getFloorNumber = (replyElement) => {
    if (!replyElement) {
      return 0
    }
    let floorNumber = Number.parseInt(
      replyElement.dataset.floorNumber || "",
      10
    )
    if (floorNumber) {
      return floorNumber
    }
    const numberElement = getFloorNumberElement(replyElement)
    if (numberElement) {
      floorNumber = Number.parseInt(numberElement.textContent || "", 10) || 0
      replyElement.dataset.floorNumber = String(floorNumber)
      return floorNumber
    }
    return 0
  }
  var cloneReplyElement = (
    replyElement,
    wrappingTable = false,
    keepCitedReplies = false
  ) => {
    const cloned = replyElement.cloneNode(true)
    const floorNumber = $(".no", cloned)
    const toolbox = $(".fr", cloned)
    if (toolbox && floorNumber) {
      const floorNumber2 = createElement("a", {
        class: "no",
        textContent: floorNumber.textContent,
      })
      addEventListener(floorNumber2, "click", (event) => {
        replyElement.scrollIntoView({ block: "start" })
        event.preventDefault()
        event.stopPropagation()
      })
      toolbox.innerHTML = ""
      toolbox.append(floorNumber2)
    }
    const cells = $$(".cell,.v2p-topic-reply-ref,.nested", cloned)
    for (const cell of cells) {
      if (keepCitedReplies && hasClass(cell, "cited_reply")) {
        continue
      }
      cell.remove()
    }
    if (wrappingTable) {
      const table = cloned.firstElementChild
      if (table && table.tagName === "TABLE") {
        const wrapper = createElement("div", {
          class: "vr_wrapper",
        })
        table.after(wrapper)
        wrapper.append(table)
      }
    }
    return cloned
  }
  var sortReplyElementsByFloorNumberCompareFn = (a, b) =>
    getFloorNumber(a) - getFloorNumber(b)
  var parseUrl = () => {
    const matched = /\/t\/(\d+)(?:.+\bp=(\d+))?/.exec(location.href) || []
    const topicId = matched[1]
    const page = Number.parseInt(matched[2], 10) || 1
    return { topicId, page }
  }
  var getRepliesCount = () => {
    var _a
    return (
      Number.parseInt(
        (/(\d+)\s条回复/.exec(
          ((_a = $(".box .cell .gray")) == null ? void 0 : _a.textContent) || ""
        ) || [])[1],
        10
      ) || 0
    )
  }
  var isTouchScreen = "ontouchstart" in document.documentElement
  var getMemberIdFromMemberLink = (memberLink) => {
    if (!memberLink) {
      return
    }
    return (/member\/(\w+)/.exec(memberLink.href) || [])[1]
  }
  var getReplyAuthorMemberId = (replyElement) => {
    if (!replyElement) {
      return
    }
    const memberLink = $('a[href^="/member/"]', replyElement)
    return getMemberIdFromMemberLink(memberLink)
  }
  var getReplyElementByMemberIdAndFloorNumber = (
    memberId,
    floorNumber,
    type = 0
  ) => {
    if (!memberId || !floorNumber) {
      return
    }
    const replyElements = getCachedReplyElements()
    const length = replyElements.length
    const reverse = floorNumber > length / 2
    let nearestReply
    let nearestReplyGap = 1e3
    for (let i = 0; i < length; i++) {
      const replyElement = replyElements[reverse ? length - i - 1 : i]
      const memberId2 = getReplyAuthorMemberId(replyElement)
      if (memberId2 !== memberId) {
        continue
      }
      const floorNumber2 = getFloorNumber(replyElement)
      if (floorNumber2 === floorNumber) {
        return replyElement
      }
      if (type === 1 && floorNumber2 > floorNumber) {
        continue
      }
      if (type === 2 && floorNumber2 < floorNumber) {
        continue
      }
      if (
        !nearestReply ||
        Math.abs(floorNumber - floorNumber2) < nearestReplyGap
      ) {
        nearestReply = replyElement
        nearestReplyGap = Math.abs(floorNumber - floorNumber2)
      }
    }
    return nearestReply
  }
  var getPagingPreviousButtons = () =>
    $$(".normal_page_right").map((right) => right.previousElementSibling)
  var getPagingNextButtons = () => $$(".normal_page_right")
  var cacheStore = {}
  var makeKey = (key) => (Array.isArray(key) ? key.join(":") : key)
  var Cache = {
    get: (key) => cacheStore[makeKey(key)],
    add(key, value) {
      cacheStore[makeKey(key)] = value
    },
  }
  var sleep = async (time) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(1)
      }, time)
    })
  }
  var getReplyInputElement = () => {
    return $("#reply_content")
  }
  function insertTextToReplyInput(text) {
    const replyTextArea = getReplyInputElement()
    if (replyTextArea) {
      const startPos = replyTextArea.selectionStart
      const endPos = replyTextArea.selectionEnd
      const valueToStart = replyTextArea.value.slice(0, startPos)
      const valueFromEnd = replyTextArea.value.slice(
        endPos,
        replyTextArea.value.length
      )
      replyTextArea.value = `${valueToStart}${text}${valueFromEnd}`
      replyTextArea.focus()
      const newPos = startPos + text.length
      replyTextArea.selectionStart = newPos
      replyTextArea.selectionEnd = newPos
    }
  }
  var replaceReplyInputText = (find, replace, dispatchInputEvent = false) => {
    const replyTextArea = getReplyInputElement()
    if (replyTextArea) {
      const value = replyTextArea.value
      if (typeof value === "string") {
        const index = value.indexOf(find)
        if (index === -1) {
          return
        }
        const endPos = replyTextArea.selectionEnd
        const newValue = value.replace(find, replace)
        replyTextArea.value = newValue
        replyTextArea.focus()
        const newPos =
          index > endPos ? endPos : endPos + newValue.length - value.length
        replyTextArea.selectionStart = newPos
        replyTextArea.selectionEnd = newPos
        if (dispatchInputEvent) {
          replyTextArea.dispatchEvent(new Event("input"))
        }
      }
    }
  }
  var getOnce = () => {
    const onceElement = $("#once")
    if (onceElement == null ? void 0 : onceElement.value) {
      return onceElement.value
    }
    const html = doc.body.innerHTML
    const once = (/once=(\d+)/.exec(html) || [])[1]
    return once
  }
  var addlinkToCitedFloorNumbers = (replyElement) => {
    const content = $(".reply_content", replyElement)
    const memberLinks = $$('a[href^="/member/"]', content)
    for (const memberLink of memberLinks) {
      const previousTextNode = memberLink.previousSibling
      const memberId = getMemberIdFromMemberLink(memberLink)
      if (
        previousTextNode &&
        previousTextNode.nodeType === 3 &&
        previousTextNode.textContent &&
        previousTextNode.textContent.endsWith("@") &&
        memberId
      ) {
        let nextTextNode = memberLink.nextSibling
        while (nextTextNode) {
          if (
            nextTextNode.tagName === "BR" ||
            !nextTextNode.textContent ||
            nextTextNode.textContent.trim().length === 0
          ) {
            nextTextNode = nextTextNode.nextSibling
          } else {
            break
          }
        }
        if (
          !nextTextNode ||
          nextTextNode.nodeType !== 3 ||
          !nextTextNode.textContent ||
          !/^\s*#\d+/.test(nextTextNode.textContent)
        ) {
          continue
        }
        const match = /^(\s*)(#(\d+))(.*)/.exec(nextTextNode.textContent)
        if (!match) {
          continue
        }
        if (match[1]) {
          nextTextNode.before(doc.createTextNode(match[1]))
        }
        if (match[2]) {
          const element = createElement("a", {
            class: "cited_floor_number",
            textContent: match[2],
            "data-member-id": memberId,
            "data-floor-number": match[3],
          })
          nextTextNode.before(element)
        }
        nextTextNode.textContent = match[4]
      }
    }
    runOnce("addlinkToCitedFloorNumbers:document-onclick", () => {
      addEventListener(doc, "click", (event) => {
        const target = event.target
        if (hasClass(target, "cited_floor_number")) {
          const memberId = target.dataset.memberId
          const floorNumber = Number.parseInt(
            target.dataset.floorNumber || "",
            10
          )
          const citedReplyElement = getReplyElementByMemberIdAndFloorNumber(
            memberId,
            floorNumber
          )
          if (citedReplyElement) {
            citedReplyElement.scrollIntoView({ block: "start" })
            event.preventDefault()
            event.stopPropagation()
          }
        }
      })
    })
  }
  var alwaysShowHideButton = (replyElement) => {
    const hideButton = $('a[onclick*="ignoreReply"]', replyElement)
    if (hideButton && !hasClass(hideButton, "icon_button")) {
      addAttribute(hideButton, "class", "icon_button")
      if (!$(".v2p-controls", replyElement)) {
        hideButton.innerHTML = `<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.3536 2.35355C13.5488 2.15829 13.5488 1.84171 13.3536 1.64645C13.1583 1.45118 12.8417 1.45118 12.6464 1.64645L10.6828 3.61012C9.70652 3.21671 8.63759 3 7.5 3C4.30786 3 1.65639 4.70638 0.0760002 7.23501C-0.0253338 7.39715 -0.0253334 7.60288 0.0760014 7.76501C0.902945 9.08812 2.02314 10.1861 3.36061 10.9323L1.64645 12.6464C1.45118 12.8417 1.45118 13.1583 1.64645 13.3536C1.84171 13.5488 2.15829 13.5488 2.35355 13.3536L4.31723 11.3899C5.29348 11.7833 6.36241 12 7.5 12C10.6921 12 13.3436 10.2936 14.924 7.76501C15.0253 7.60288 15.0253 7.39715 14.924 7.23501C14.0971 5.9119 12.9769 4.81391 11.6394 4.06771L13.3536 2.35355ZM9.90428 4.38861C9.15332 4.1361 8.34759 4 7.5 4C4.80285 4 2.52952 5.37816 1.09622 7.50001C1.87284 8.6497 2.89609 9.58106 4.09974 10.1931L9.90428 4.38861ZM5.09572 10.6114L10.9003 4.80685C12.1039 5.41894 13.1272 6.35031 13.9038 7.50001C12.4705 9.62183 10.1971 11 7.5 11C6.65241 11 5.84668 10.8639 5.09572 10.6114Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>`
      }
      const nextSibling = hideButton.nextSibling
      if (nextSibling && nextSibling.nodeType === 3) {
        nextSibling.textContent = ""
      }
    }
  }
  var alwaysShowThankButton = (replyElement) => {
    const thankButton = $('a[onclick*="thankReply"]', replyElement)
    if (thankButton && !hasClass(thankButton, "icon_button")) {
      addAttribute(thankButton, "class", "icon_button")
      if (!$(".v2p-controls", replyElement)) {
        thankButton.innerHTML = `<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.89346 2.35248C3.49195 2.35248 2.35248 3.49359 2.35248 4.90532C2.35248 6.38164 3.20954 7.9168 4.37255 9.33522C5.39396 10.581 6.59464 11.6702 7.50002 12.4778C8.4054 11.6702 9.60608 10.581 10.6275 9.33522C11.7905 7.9168 12.6476 6.38164 12.6476 4.90532C12.6476 3.49359 11.5081 2.35248 10.1066 2.35248C9.27059 2.35248 8.81894 2.64323 8.5397 2.95843C8.27877 3.25295 8.14623 3.58566 8.02501 3.88993C8.00391 3.9429 7.98315 3.99501 7.96211 4.04591C7.88482 4.23294 7.7024 4.35494 7.50002 4.35494C7.29765 4.35494 7.11523 4.23295 7.03793 4.04592C7.01689 3.99501 6.99612 3.94289 6.97502 3.8899C6.8538 3.58564 6.72126 3.25294 6.46034 2.95843C6.18109 2.64323 5.72945 2.35248 4.89346 2.35248ZM1.35248 4.90532C1.35248 2.94498 2.936 1.35248 4.89346 1.35248C6.0084 1.35248 6.73504 1.76049 7.20884 2.2953C7.32062 2.42147 7.41686 2.55382 7.50002 2.68545C7.58318 2.55382 7.67941 2.42147 7.79119 2.2953C8.265 1.76049 8.99164 1.35248 10.1066 1.35248C12.064 1.35248 13.6476 2.94498 13.6476 4.90532C13.6476 6.74041 12.6013 8.50508 11.4008 9.96927C10.2636 11.3562 8.92194 12.5508 8.00601 13.3664C7.94645 13.4194 7.88869 13.4709 7.83291 13.5206C7.64324 13.6899 7.3568 13.6899 7.16713 13.5206C7.11135 13.4709 7.05359 13.4194 6.99403 13.3664C6.0781 12.5508 4.73641 11.3562 3.59926 9.96927C2.39872 8.50508 1.35248 6.74041 1.35248 4.90532Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>`
      }
    }
  }
  var fetchOnce = async () => {
    const url = `${location.protocol}//${location.host}/poll_once`
    const response = await fetch(url)
    try {
      if (response.status === 200) {
        return await response.text()
      }
    } catch (error) {
      console.error("[V2EX.REP] Unable to refresh once", error)
    }
  }
  var updateOnce = async () => {
    const once = await fetchOnce()
    if (once) {
      window.once = once
      if ($("#once")) {
        $("#once").value = once
      }
      const links = $$(`a[href*="once="]`)
      for (const link of links) {
        const href = getAttribute(link, "href")
        setAttribute(link, "href", href.replace(/once=\d+/, `once=${once}`))
      }
    }
  }
  var storageKey2 = "dailyCheckIn"
  var retryCount = 0
  var fetchCheckInApi = async (once) => {
    const url = `${location.protocol}//${location.host}/mission/daily/redeem?once=${once}`
    try {
      const response = await fetch(url)
      if (response.status === 200) {
        return await response.text()
      }
    } catch (error) {
      console.error(error)
      retryCount++
      if (retryCount < 3) {
        await sleep(1e3)
        return fetchCheckInApi(once)
      }
    }
  }
  var dailyCheckIn = async () => {
    var _a
    const once = getOnce()
    if (!once) {
      return
    }
    const lastCheckInDate = await getValue(storageKey2)
    if (lastCheckInDate) {
      const now = Date.now()
      if (
        now - lastCheckInDate < 864e5 &&
        new Date(now).getUTCDate() === new Date(lastCheckInDate).getUTCDate()
      ) {
        return
      }
    }
    const result = await fetchCheckInApi(once)
    if (
      result.includes("\u6BCF\u65E5\u767B\u5F55\u5956\u52B1\u5DF2\u9886\u53D6")
    ) {
      console.info("[V2EX.REP] \u7B7E\u5230\u6210\u529F")
      await setValue(storageKey2, Date.now())
      const checkInLink = $(`a[href^="/mission/daily"]`)
      if (checkInLink) {
        const box = checkInLink.closest(".box")
        if (box) {
          ;(_a = box.nextElementSibling) == null ? void 0 : _a.remove()
          box.remove()
        }
      }
    } else {
      console.error("[V2EX.REP] \u7B7E\u5230\u5931\u8D25")
    }
    await updateOnce()
  }
  var timeoutId
  var scrollPositionStack = []
  var showModalReplies = (replies, referElement, memberId, type) => {
    var _a
    const main2 = $("#Main") || $(".content")
    if (!main2) {
      return
    }
    if (doc.scrollingElement) {
      scrollPositionStack.push(doc.scrollingElement.scrollTop)
    }
    setStyle(main2, "position: relative;")
    const replyElement = $("#Main")
      ? referElement.closest("#Main .cell")
      : referElement.closest(".cell")
    const relatedBox =
      replyElement == null ? void 0 : replyElement.closest(".related_replies")
    if (replyElement && relatedBox) {
      const lastRelatedRepliesBox = $$(".related_replies_container").pop()
      if (
        lastRelatedRepliesBox == null
          ? void 0
          : lastRelatedRepliesBox.contains(replyElement)
      ) {
      } else {
        closeModal2(true)
      }
    } else {
      closeModal2()
    }
    const container = addElement2(main2, "div", {
      class: "related_replies_container",
    })
    const box = addElement2(container, "div", {
      class: "box related_replies related_replies_before",
    })
    const box2 = addElement2(container, "div", {
      class: "box related_replies related_replies_after",
    })
    box.innerHTML = ""
    box2.innerHTML = ""
    const tabs = addElement2(box, "div", {
      class: "box tabs inner",
    })
    addElement2(tabs, "a", {
      class: !type || type === "all" ? "tab_current" : "tab",
      href: actionHref,
      textContent: "\u5168\u90E8\u56DE\u590D",
      onclick() {
        showRelatedReplies(referElement, memberId)
      },
    })
    addElement2(tabs, "a", {
      class: type === "posted" ? "tab_current" : "tab",
      href: actionHref,
      textContent: `\u4EC5 ${memberId} \u53D1\u8868\u7684\u56DE\u590D`,
      onclick() {
        showRelatedReplies(referElement, memberId, "posted")
      },
    })
    const replyId = replyElement ? getReplyId(replyElement) : void 0
    const floorNumber = replyElement ? getFloorNumber(replyElement) : 0
    let beforeCount = 0
    let afterCount = 0
    replies.sort(sortReplyElementsByFloorNumberCompareFn)
    for (const reply of replies) {
      const replyId2 = getReplyId(reply)
      const floorNumber2 = getFloorNumber(reply)
      if (replyId === replyId2) {
        continue
      }
      if (floorNumber > floorNumber2) {
        box.append(reply)
        beforeCount++
      } else {
        box2.append(reply)
        afterCount++
      }
    }
    if (beforeCount === 0 && afterCount === 0) {
      addElement2(box, "div", {
        class: "cell",
        innerHTML: `<span class="fade">\u672C\u9875\u9762\u6CA1\u6709\u5176\u4ED6\u56DE\u590D</span>`,
      })
      if (!type || type === "all") {
        tabs.remove()
        addClass(container, "no_replies")
        addEventListener(
          referElement,
          "mouseout",
          () => {
            container.remove()
            scrollPositionStack.pop()
          },
          { once: true }
        )
      }
    }
    if (beforeCount === 0 && afterCount > 0) {
      addElement2(box, "div", {
        class: "cell",
        innerHTML: `<span class="fade">\u8FD9\u6761\u56DE\u590D\u540E\u9762\u8FD8\u6709 ${afterCount} \u6761\u56DE\u590D</span>`,
      })
    }
    if (beforeCount > 0 && afterCount === 0) {
      addElement2(box2, "div", {
        class: "cell",
        innerHTML: `<span class="fade">\u8FD9\u6761\u56DE\u590D\u524D\u9762\u8FD8\u6709 ${beforeCount} \u6761\u56DE\u590D</span>`,
      })
    }
    const width = main2.offsetWidth + "px"
    if (replyElement) {
      const offsetTop = getOffsetPosition(replyElement, main2).top
      const height = box.offsetHeight || box.clientHeight
      const height2 = replyElement.offsetHeight || replyElement.clientHeight
      setStyle(box, {
        top: offsetTop - height + "px",
        width,
      })
      setStyle(box2, {
        top: offsetTop + height2 + "px",
        width,
      })
    } else if (afterCount > 0) {
      ;(_a = box2.firstChild) == null ? void 0 : _a.before(tabs)
      const headerElement =
        referElement == null ? void 0 : referElement.closest(".header")
      if (headerElement) {
        const offsetTop = getOffsetPosition(headerElement, main2).top
        const height2 = headerElement.offsetHeight || headerElement.clientHeight
        setStyle(box2, {
          top: offsetTop + height2 + "px",
          width,
        })
        box.remove()
      } else {
        const firstReply = $('.box .cell[id^="r_"]')
        const offsetTop = firstReply
          ? Math.max(getOffsetPosition(firstReply, main2).top, win.scrollY)
          : win.scrollY
        setStyle(box, {
          top: offsetTop + "px",
          width,
        })
        setStyle(box2, {
          top: offsetTop + "px",
          width,
        })
        box2.scrollIntoView({ block: "start" })
      }
    } else {
      box.remove()
      box2.remove()
    }
  }
  var filterRepliesPostedByMember = (memberIds) => {
    const replies = []
    const replyElements = getCachedReplyElements()
    for (const replyElement of replyElements) {
      const memberLink = $('a[href^="/member/"]', replyElement)
      if (!memberLink) {
        continue
      }
      const memberId = (/member\/(\w+)/.exec(memberLink.href) || [])[1]
      if (memberIds.includes(memberId)) {
        const cloned = cloneReplyElement(replyElement, true, true)
        cloned.id = "related_" + replyElement.id
        replies.push(cloned)
      }
    }
    return replies
  }
  var filterRepliesByPosterOrMentioned = (memberId) => {
    const replies = []
    const replyElements = getCachedReplyElements()
    for (const replyElement of replyElements) {
      const memberLink = $(`a[href^="/member/${memberId}"]`, replyElement)
      if (!memberLink) {
        continue
      }
      let cloned = cloneReplyElement(replyElement, true)
      const memberLink2 = $(`a[href^="/member/${memberId}"]`, cloned)
      if (!memberLink2) {
        continue
      }
      cloned = cloneReplyElement(replyElement, true, true)
      cloned.id = "related_" + replyElement.id
      replies.push(cloned)
    }
    return replies
  }
  var showRelatedReplies = (memberLink, memberId, type) => {
    const replies =
      type === "posted"
        ? filterRepliesPostedByMember([memberId])
        : filterRepliesByPosterOrMentioned(memberId)
    showModalReplies(replies, memberLink, memberId, type)
  }
  var onMouseOver = (event) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = void 0
    }
    const memberLink = event.target
    timeoutId = setTimeout(() => {
      const memberId = (/member\/(\w+)/.exec(memberLink.href) || [])[1]
      if (memberId) {
        showRelatedReplies(memberLink, memberId)
      }
    }, 500)
  }
  var onMouseOut = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = void 0
    }
  }
  var closeModal2 = (closeLast = false) => {
    for (const element of $$(".related_replies_container").reverse()) {
      element.remove()
      const scrollPosition = scrollPositionStack.pop()
      if (scrollPosition !== void 0 && doc.scrollingElement) {
        doc.scrollingElement.scrollTop = scrollPosition
      }
      if (closeLast) {
        break
      }
    }
  }
  var onDocumentClick2 = (event) => {
    const target = event.target
    if (isTouchScreen) {
      const memberLink = target.closest('a[href^="/member/"]')
      if (memberLink && !$("img", memberLink)) {
        event.preventDefault()
        event.stopPropagation()
        return
      }
    }
    const floorNumberElement = target.closest(".related_replies a.no")
    if (floorNumberElement) {
      closeModal2()
      return
    }
    const lastRelatedRepliesBox = $$(".related_replies_container").pop()
    const relatedReply = target.closest(".related_replies .cell")
    if (
      relatedReply &&
      (lastRelatedRepliesBox == null
        ? void 0
        : lastRelatedRepliesBox.contains(relatedReply))
    ) {
      return
    }
    const relatedRepliesBox = target.closest(".related_replies_container")
    if (relatedRepliesBox) {
      closeModal2(true)
      return
    }
    closeModal2()
  }
  var onDocumentKeyDown2 = (event) => {
    if (event.defaultPrevented) {
      return
    }
    if (event.key === "Escape") {
      closeModal2(true)
    }
  }
  var filterRepliesByUser = (toogle) => {
    if (toogle) {
      const memberLinks = $$('a[href^="/member/"]')
      for (const memberLink of memberLinks) {
        if (!memberLink.boundEvent) {
          addEventListener(memberLink, "mouseover", onMouseOver, true)
          addEventListener(memberLink, "mouseout", onMouseOut)
          if (isTouchScreen) {
            addEventListener(memberLink, "touchstart", onMouseOver, true)
          }
          memberLink.boundEvent = true
        }
      }
      if (!doc.boundEvent) {
        addEventListener(doc, "click", onDocumentClick2, true)
        addEventListener(doc, "keydown", onDocumentKeyDown2)
        doc.boundEvent = true
      }
    } else if (doc.boundEvent) {
      closeModal2()
      removeEventListener(doc, "click", onDocumentClick2, true)
      removeEventListener(doc, "keydown", onDocumentKeyDown2)
      doc.boundEvent = false
      const memberLinks = $$('a[href^="/member/"]')
      for (const memberLink of memberLinks) {
        if (memberLink.boundEvent) {
          removeEventListener(memberLink, "mouseover", onMouseOver, true)
          removeEventListener(memberLink, "mouseout", onMouseOut)
          if (isTouchScreen) {
            removeEventListener(memberLink, "touchstart", onMouseOver, true)
          }
          memberLink.boundEvent = false
        }
      }
    }
  }
  var retryCount2 = 0
  var getTopicReplies = async (topicId, replyCount) => {
    const cached = Cache.get(["getTopicReplies", topicId, replyCount])
    if (cached) {
      return cached
    }
    const url = `${location.protocol}//${
      location.host
    }/api/replies/show.json?topic_id=${topicId}${
      replyCount ? "&replyCount=" + String(replyCount) : ""
    }`
    try {
      const response = await fetch(url)
      if (response.status === 200) {
        const result = await response.json()
        Cache.add(["getTopicReplies", topicId, replyCount], result)
        return result
      }
    } catch (error) {
      console.error(error)
      retryCount2++
      if (retryCount2 < 3) {
        await sleep(1e3)
        return getTopicReplies(topicId, replyCount)
      }
    }
  }
  var updateFloorNumber = (replyElement, newFloorNumber) => {
    const numberElement = getFloorNumberElement(replyElement)
    if (numberElement) {
      if (!numberElement.dataset.orgNumber) {
        const orgNumber = Number.parseInt(numberElement.textContent || "", 10)
        if (orgNumber) {
          numberElement.dataset.orgNumber = String(orgNumber)
        }
      }
      numberElement.textContent = String(newFloorNumber)
      replyElement.dataset.floorNumber = String(newFloorNumber)
    }
  }
  var updateAllFloorNumberById = (id, newFloorNumber) => {
    for (const replyElement of $$(
      `#r_${id},
     #top_r_${id},
     #related_r_${id},
     #cited_r_${id}`
    )) {
      updateFloorNumber(replyElement, newFloorNumber)
    }
  }
  var updateReplyElements = (replies, replyElements, page = 1) => {
    var _a
    let floorNumberOffset = 0
    let hideCount = 0
    const dataOffSet = (page - 1) * 100
    const length = Math.min(replies.length - (page - 1) * 100, 100)
    for (let i = 0; i < length; i++) {
      const realFloorNumber = i + dataOffSet + 1
      const reply = replies[i + dataOffSet]
      const id = reply.id
      const element = $("#r_" + id)
      if (!element) {
        console.info(
          `[V2EX.REP] \u5C4F\u853D\u6216\u9690\u85CF\u7684\u56DE\u590D: #${realFloorNumber}, \u7528\u6237 ID: ${
            (_a = reply.member) == null ? void 0 : _a.username
          }, \u56DE\u590D ID: ${reply.id}, \u56DE\u590D\u5185\u5BB9: ${
            reply.content
          }`
        )
        hideCount++
        continue
      }
      element.found = true
      if (hideCount > 0) {
        const numberElement = getFloorNumberElement(element)
        if (numberElement) {
          const orgNumber = Number.parseInt(
            numberElement.dataset.orgNumber || numberElement.textContent || "",
            10
          )
          if (orgNumber) {
            numberElement.dataset.orgNumber = String(orgNumber)
            floorNumberOffset = realFloorNumber - orgNumber
          }
          numberElement.textContent = String(realFloorNumber)
        }
        updateAllFloorNumberById(id, realFloorNumber)
      }
    }
    console.info(
      `[V2EX.REP] page: ${page}, floorNumberOffset: ${floorNumberOffset}, hideCount: ${hideCount}`
    )
    if (floorNumberOffset > 0) {
      for (const element of replyElements) {
        if (element.found) {
          continue
        }
        const id = getReplyId(element)
        const numberElement = getFloorNumberElement(element)
        if (numberElement) {
          const orgNumber = Number.parseInt(
            numberElement.dataset.orgNumber || numberElement.textContent || "",
            10
          )
          if (orgNumber) {
            numberElement.dataset.orgNumber = String(orgNumber)
            numberElement.textContent = String(orgNumber + floorNumberOffset)
            updateAllFloorNumberById(id, orgNumber + floorNumberOffset)
          }
        }
      }
    }
    win.dispatchEvent(new Event("floorNumberUpdated"))
  }
  var isRunning = false
  var splitArrayPerPages = (replyElements) => {
    if (!replyElements[0].dataset.page) {
      return
    }
    const replyElementsPerPages = []
    let lastPage
    let replyElementsPerPage = []
    for (const reply of replyElements) {
      if (reply.dataset.page !== lastPage) {
        lastPage = reply.dataset.page
        const page = Number.parseInt(reply.dataset.page || "", 10)
        replyElementsPerPage = replyElementsPerPages[page - 1] || []
        replyElementsPerPages[page - 1] = replyElementsPerPage
      }
      replyElementsPerPage.push(reply)
    }
    return replyElementsPerPages
  }
  var process2 = async (
    topicId,
    page,
    displayNumber,
    replyElements,
    forceUpdate = false
  ) => {
    if (isRunning) {
      return
    }
    isRunning = true
    const replies = await getTopicReplies(
      topicId,
      forceUpdate ? displayNumber : void 0
    )
    if (replies) {
      const replyElementsPerPages = splitArrayPerPages(replyElements)
      if (replyElementsPerPages) {
        for (let i = 0; i < replyElementsPerPages.length; i++) {
          const replyElementsPerPage = replyElementsPerPages[i]
          if (
            !replyElementsPerPage ||
            displayNumber === replyElementsPerPage.length ||
            displayNumber % 100 === replyElementsPerPage.length % 100 ||
            replyElementsPerPage.length % 100 === 0
          ) {
            continue
          }
          updateReplyElements(replies, replyElementsPerPage, i + 1)
        }
      } else {
        updateReplyElements(replies, replyElements, page)
      }
      if (replies.length < displayNumber) {
        console.info("[V2EX.REP] API data outdated, re-fetch it")
        setTimeout(async () => {
          await process2(topicId, page, displayNumber, replyElements, true)
        }, 100)
      }
    }
    isRunning = false
  }
  var fixReplyFloorNumbers = async (replyElements) => {
    if (isRunning) {
      return
    }
    const result = parseUrl()
    const topicId = result.topicId
    const page = result.page
    if (!topicId) {
      return
    }
    const displayNumber = getRepliesCount()
    if (
      displayNumber === replyElements.length ||
      displayNumber % 100 === replyElements.length % 100 ||
      replyElements.length % 100 === 0
    ) {
      return
    }
    await process2(topicId, page, displayNumber, replyElements)
  }
  var restoreImgSrc = throttle(() => {
    for (const img of $$("img[data-src]")) {
      setAttribute(img, "src", getAttribute(img, "data-src"))
      delete img.dataset.src
    }
  }, 500)
  var lazyLoadAvatars = (replyElement) => {
    const avatar = $("img.avatar", replyElement)
    if (avatar) {
      if (getAttribute(avatar, "loading") === "lazy" || avatar.complete) {
        return
      }
      const src = getAttribute(avatar, "src")
      setAttribute(avatar, "loading", "lazy")
      setAttribute(avatar, "data-src", src)
      setAttribute(
        avatar,
        "src",
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
      )
      if (doc.readyState === "complete") {
        setTimeout(restoreImgSrc)
      } else {
        addEventListener(win, "load", restoreImgSrc)
      }
    }
  }
  var retryCount3 = 0
  var getTopicPage = async (topicId, page = 1) => {
    const url = `${location.protocol}//${location.host}/t/${topicId}?p=${page}`
    try {
      const response = await fetch(url)
      if (response.status === 200) {
        return await response.text()
      }
    } catch (error) {
      console.error(error, `page ${page}`)
      retryCount3++
      if (retryCount3 < 10) {
        await sleep(1e3)
        return getTopicPage(topicId, page)
      }
    }
  }
  var getReplyElements2 = (html) => {
    const htmlNode = createElement("html")
    htmlNode.innerHTML = html
    return $$('.cell[id^="r_"]', htmlNode)
  }
  var insertReplyElementsToPage = (replyElements, page, inertPoint) => {
    if (!replyElements || replyElements.length === 0 || !inertPoint) {
      return
    }
    for (const replyElement of replyElements) {
      replyElement.dataset.page = String(page)
      if (getSettingsValue("lazyLoadAvatars")) {
        lazyLoadAvatars(replyElement)
      }
      inertPoint.before(replyElement)
    }
  }
  var gotoPage = (page, event) => {
    if (!page) {
      return
    }
    history.pushState(null, null, `?p=${page}`)
    const main2 = $("#Main") || $(".content")
    const firstReply = $(`.cell[data-page="${page}"]`, main2)
    if (firstReply) {
      firstReply.scrollIntoView({ block: "start" })
      event.preventDefault()
      event.stopImmediatePropagation()
    }
    for (const pagingElement of $$(".page_current,.page_normal")) {
      if (pagingElement.textContent === String(page)) {
        removeClass(pagingElement, "page_normal")
        addClass(pagingElement, "page_current")
      } else {
        removeClass(pagingElement, "page_current")
        addClass(pagingElement, "page_normal")
      }
    }
    for (const pageInput of $$(".page_input")) {
      pageInput.value = page
    }
    const repliesCount = getRepliesCount()
    const totalPage = Math.ceil(repliesCount / 100)
    for (const button of getPagingPreviousButtons()) {
      if (String(page) === "1") {
        addClass(button, "disable_now")
      } else {
        removeClass(button, "disable_now")
      }
    }
    for (const button of getPagingNextButtons()) {
      if (String(page) === String(totalPage)) {
        addClass(button, "disable_now")
      } else {
        removeClass(button, "disable_now")
      }
    }
  }
  var updatePagingElements = () => {
    runOnce("loadMultiPages:updatePagingElements", () => {
      for (const pagingElement of $$(".page_current,.page_normal")) {
        addEventListener(pagingElement, "click", (event) => {
          const page = pagingElement.textContent
          gotoPage(page, event)
        })
      }
      for (const pageInput of $$(".page_input")) {
        pageInput.removeAttribute("onkeydown")
        addEventListener(
          pageInput,
          "keydown",
          (event) => {
            var _a
            if (event.keyCode === 13) {
              gotoPage((_a = event.target) == null ? void 0 : _a.value, event)
              return false
            }
          },
          true
        )
      }
      const buttons = [...getPagingPreviousButtons(), ...getPagingNextButtons()]
      for (const button of buttons) {
        button.removeAttribute("onclick")
        button.removeAttribute("onmouseover")
        button.removeAttribute("onmousedown")
        button.removeAttribute("onmouseleave")
        addEventListener(
          button,
          "mouseover",
          (event) => {
            if (!hasClass(button, "disable_now")) {
              addClass(button, "hover_now")
            }
            event.preventDefault()
            event.stopImmediatePropagation()
          },
          true
        )
        addEventListener(
          button,
          "mousedown",
          (event) => {
            if (!hasClass(button, "disable_now")) {
              addClass(button, "active_now")
            }
            event.preventDefault()
            event.stopImmediatePropagation()
          },
          true
        )
        addEventListener(
          button,
          "mouseleave",
          (event) => {
            removeClass(button, "hover_now")
            removeClass(button, "active_now")
            event.preventDefault()
            event.stopImmediatePropagation()
          },
          true
        )
        addEventListener(
          button,
          "click",
          (event) => {
            var _a
            if (!hasClass(button, "disable_now")) {
              const page = Number.parseInt(
                ((_a = $(".page_input")) == null ? void 0 : _a.value) || "",
                10
              )
              if (page) {
                if (hasClass(button, "normal_page_right")) {
                  gotoPage(page + 1, event)
                } else {
                  gotoPage(page - 1, event)
                }
              }
            }
            setTimeout(() => {
              removeClass(button, "hover_now")
              removeClass(button, "active_now")
            }, 100)
            event.preventDefault()
            event.stopImmediatePropagation()
          },
          true
        )
      }
    })
  }
  var loadMultiPages = async () => {
    const repliesCount = getRepliesCount()
    if (repliesCount > 100) {
      const result = parseUrl()
      const topicId = result.topicId
      const currentPage = result.page
      const totalPage = Math.ceil(repliesCount / 100)
      const orgReplyElements = getCachedReplyElements()
      const firstReply = orgReplyElements[0]
      const pageElement =
        orgReplyElements[orgReplyElements.length - 1].nextElementSibling
      addClass(pageElement, "sticky_paging")
      updatePagingElements()
      for (const replyElement of orgReplyElements) {
        replyElement.dataset.page = String(currentPage)
      }
      for (let i = 1; i <= totalPage; i++) {
        if (i === currentPage) {
          continue
        }
        console.info("[V2EX.REP] Fetching page", i)
        const html = await getTopicPage(topicId, i)
        if (html) {
          const replyElements = getReplyElements2(html)
          insertReplyElementsToPage(
            replyElements,
            i,
            i < currentPage ? firstReply : pageElement
          )
          win.dispatchEvent(new Event("replyElementsLengthUpdated"))
        }
        await sleep(1e3)
      }
    }
  }
  var quickHideReply = (replyElement) => {
    const hideButton = $('a[onclick*="ignoreReply"]', replyElement)
    if (hideButton) {
      const onclick = getAttribute(hideButton, "onclick")
      if (!onclick.includes("confirm")) {
        return
      }
      setAttribute(
        hideButton,
        "onclick",
        onclick.replace(/.*(ignoreReply\(.+\)).*/, "$1")
      )
      setAttribute(hideButton, "href", actionHref)
      hideButton.outerHTML = hideButton.outerHTML
    }
  }
  var state = 0
  var scrollIntoView = (element) => {
    if (element) {
      element.scrollIntoView({ block: "start" })
    }
  }
  var quickNavigation = () => {
    runOnce("quickNavigation", () => {
      const main2 = $("#Main") || $(".content")
      if (!main2) {
        return
      }
      const isMobile = hasClass(main2, "content")
      addEventListener(doc, "dblclick", (event) => {
        const target = event.target
        if (
          target &&
          ["TEXTAREA", "INPUT", "IMG", "A"].includes(target.tagName)
        ) {
          return
        }
        const selection = win.getSelection()
        if (
          (target == null ? void 0 : target.closest(".box,.cell,.inner")) &&
          selection &&
          !selection.isCollapsed &&
          selection.toString().trim().length > 0
        ) {
          return
        }
        const boxes = $$(".box", main2)
        switch (state++) {
          case 0: {
            scrollIntoView(isMobile ? boxes[2] : boxes[1])
            break
          }
          case 1: {
            scrollIntoView(isMobile ? boxes[3] : boxes[2])
            break
          }
          default: {
            scrollIntoView(boxes[0])
            state = 0
            break
          }
        }
      })
    })
  }
  var quickSendThank = (replyElement) => {
    const thankButton = $('a[onclick*="thankReply"]', replyElement)
    if (thankButton) {
      const replyId = replyElement.id.replace("r_", "")
      const onclick = getAttribute(thankButton, "onclick")
      if (!onclick.includes("confirm")) {
        return
      }
      setAttribute(
        thankButton,
        "onclick",
        onclick.replace(/.*(thankReply\(.+\)).*/, "$1")
      )
      setAttribute(thankButton, "href", actionHref)
      if (hasClass(thankButton.parentElement, "v2p-controls")) {
        const div = createElement("div", {
          id: "thank_area_" + replyId,
        })
        thankButton.after(div)
        const hideButton = $('a[onclick*="ignoreReply"]', replyElement)
        if (hideButton) {
          div.append(hideButton)
        }
        div.append(thankButton)
      }
      thankButton.outerHTML = thankButton.outerHTML
    }
  }
  var replaceState = (newHref) => {
    history.replaceState(null, "", newHref)
  }
  var getVisitedUrl = (href, replyCount) =>
    href.replace(/[?#].*|$/, `#reply${replyCount}`)
  var markAsVisited = (href, replyCount) => {
    for (
      let count = Math.max(replyCount - 10, 1);
      count <= replyCount;
      count++
    ) {
      replaceState(getVisitedUrl(href, count))
    }
  }
  var removeLocationHash = () => {
    const href = location.href
    const hash = location.hash
    const replyCount = getRepliesCount()
    if (hash == null ? void 0 : hash.startsWith("#reply")) {
      if (replyCount) {
        markAsVisited(href, replyCount)
      }
      replaceState(href.replace(/#.*/, ""))
    } else if (replyCount) {
      markAsVisited(href, replyCount)
      replaceState(href)
    }
  }
  var replyWithFloorNumber = (replyElement, forceUpdate = false) => {
    const replyButton = $('a[onclick^="replyOne"]', replyElement)
    if (replyButton) {
      setAttribute(replyButton, "href", actionHref)
      const onclick = getAttribute(replyButton, "onclick") || ""
      if (onclick.includes("#") && !forceUpdate) {
        return
      }
      const number = getFloorNumber(replyElement)
      if (number) {
        setAttribute(
          replyButton,
          "onclick",
          onclick.replace(
            /replyOne\('(\w+)(?: .*)?'\)/,
            `replyOne('$1 #${number}')`
          )
        )
        replyButton.outerHTML = replyButton.outerHTML
      }
    }
  }
  var showCitedReplies = (replyElement, forceUpdate = false) => {
    if (
      !forceUpdate &&
      (replyElement.dataset.showCitedReplies || $(".v2p-color-mode-toggle"))
    ) {
      return
    }
    const floorNumber = getFloorNumber(replyElement)
    if (!floorNumber) {
      return
    }
    replyElement.dataset.showCitedReplies = "done"
    for (const element of $$(".cited_reply", replyElement)) {
      element.remove()
    }
    const content = $(".reply_content", replyElement)
    const memberLinks = $$('a[href^="/member/"]', content)
    let hasCitedReplies = false
    for (const memberLink of memberLinks) {
      const textNode = memberLink.previousSibling
      let nextElement = memberLink.nextSibling
      let target = memberLink
      let citedFloorNumber
      if (
        textNode &&
        textNode.nodeType === 3 &&
        textNode.textContent &&
        textNode.textContent.endsWith("@")
      ) {
        const memberId = getMemberIdFromMemberLink(memberLink)
        if (!memberId) {
          continue
        }
        while (
          nextElement &&
          (nextElement.tagName === "BR" ||
            !nextElement.textContent ||
            nextElement.textContent.trim().length === 0 ||
            hasClass(nextElement, "utags_ul"))
        ) {
          target = nextElement
          nextElement = nextElement.nextSibling
        }
        if (nextElement && hasClass(nextElement, "cited_floor_number")) {
          target = nextElement
          citedFloorNumber = Number.parseInt(
            nextElement.dataset.floorNumber || "",
            10
          )
        }
        let citedReplyElement
        if (citedFloorNumber) {
          citedReplyElement = getReplyElementByMemberIdAndFloorNumber(
            memberId,
            citedFloorNumber
          )
        }
        if (!citedReplyElement) {
          citedReplyElement = getReplyElementByMemberIdAndFloorNumber(
            memberId,
            floorNumber - 1,
            1
          )
        }
        if (citedReplyElement) {
          if (
            citedReplyElement.nextElementSibling === replyElement &&
            !hasCitedReplies
          ) {
            continue
          }
          const cloned = cloneReplyElement(citedReplyElement, true)
          cloned.removeAttribute("id")
          addClass(cloned, "cited_reply")
          target.after(cloned)
          hasCitedReplies = true
        }
      }
    }
  }
  var done = false
  var reset = () => {
    const element = $("#top_replies")
    if (element) {
      const sep20 = element.previousElementSibling
      if (hasClass(sep20, "sep20")) {
        sep20.remove()
      }
      element.remove()
    }
  }
  var showTopReplies = (replyElements, toggle, forceUpdate = false) => {
    if (!toggle) {
      reset()
      removeClass($("#Wrapper"), "sticky_rightbar")
      done = false
      return
    }
    if (done && !forceUpdate) {
      return
    }
    done = true
    reset()
    addClass($("#Wrapper"), "sticky_rightbar")
    const topReplies = replyElements
      .filter((reply) => {
        var _a
        const heartElement = $('img[alt="\u2764\uFE0F"],.v2p-icon-heart', reply)
        if (heartElement) {
          const childReplies = $$(".reply_content,.cell", reply)
          for (const child of childReplies) {
            if (child.contains(heartElement)) {
              return false
            }
          }
          const thanked = Number.parseInt(
            ((_a = heartElement.nextSibling) == null
              ? void 0
              : _a.textContent) || "0",
            10
          )
          if (thanked > 0) {
            reply.thanked = thanked
            return true
          }
        }
        return false
      })
      .sort((a, b) =>
        b.thanked === a.thanked
          ? sortReplyElementsByFloorNumberCompareFn(a, b)
          : b.thanked - a.thanked
      )
    if (topReplies.length > 0) {
      const box = createElement("div", {
        class: "box",
        id: "top_replies",
        innerHTML: `<div class="cell"><div class="fr"></div><span class="fade">\u5F53\u524D\u9875\u70ED\u95E8\u56DE\u590D</span></div>`,
      })
      for (const element of topReplies) {
        const cloned = cloneReplyElement(element, true)
        cloned.id = "top_" + element.id
        const ago = $(".ago", cloned)
        if (ago) {
          ago.before(createElement("br"))
        }
        box.append(cloned)
      }
      const appendPosition = $("#Rightbar .box")
      const sep20 = createElement("div", {
        class: "sep20",
      })
      if (appendPosition) {
        appendPosition.after(box)
        appendPosition.after(sep20)
      }
    }
  }
  var stickyTopicButtons = (toggle = false) => {
    const main2 = $("#Main") || $(".content")
    if (!main2) {
      return
    }
    if (hasClass(main2, "content")) {
      const buttons = $(".inner", main2)
      if (buttons) {
        addClass(buttons, "topic_buttons_mobile")
      }
    }
    const added = hasClass(main2, "sticky_topic_buttons")
    if (toggle && !added) {
      addClass(main2, "sticky_topic_buttons")
    } else if (!toggle && added) {
      removeClass(main2, "sticky_topic_buttons")
    }
  }
  var imgurClientIdPool = [
    "3107b9ef8b316f3",
    "442b04f26eefc8a",
    "59cfebe717c09e4",
    "60605aad4a62882",
    "6c65ab1d3f5452a",
    "83e123737849aa9",
    "9311f6be1c10160",
    "c4a4a563f698595",
    "81be04b9e4a08ce",
  ]
  async function uploadImageToImgur(file) {
    const formData = new FormData()
    formData.append("image", file)
    const randomIndex = Math.floor(Math.random() * imgurClientIdPool.length)
    const clidenId = imgurClientIdPool[randomIndex]
    const response = await fetch("https://api.imgur.com/3/upload", {
      method: "POST",
      headers: { Authorization: `Client-ID ${clidenId}` },
      body: formData,
    })
    if (response.ok) {
      const responseData = await response.json()
      if (responseData.success) {
        return responseData.data.link
      }
    }
    throw new Error("\u4E0A\u4F20\u5931\u8D25")
  }
  var handleUploadImage = (file) => {
    const detail = { file }
    win.dispatchEvent(new CustomEvent("uploadImageStart", { detail }))
    uploadImageToImgur(file)
      .then((imgLink) => {
        detail.imgLink = imgLink
        win.dispatchEvent(new CustomEvent("uploadImageSuccess", { detail }))
      })
      .catch(() => {
        win.dispatchEvent(new CustomEvent("uploadImageFailed", { detail }))
      })
  }
  var handleClickUploadImage = () => {
    const imgInput = document.createElement("input")
    imgInput.style.display = "none"
    imgInput.type = "file"
    imgInput.accept = "image/*"
    addEventListener(imgInput, "change", () => {
      var _a
      const selectedFile = (_a = imgInput.files) == null ? void 0 : _a[0]
      if (selectedFile) {
        handleUploadImage(selectedFile)
      }
    })
    imgInput.click()
  }
  var init = () => {
    const replyTextArea = getReplyInputElement()
    if (!replyTextArea) {
      return
    }
    const appendPosition = $("#reply-box > div > div")
    if (!appendPosition) {
      return
    }
    setAttribute(
      replyTextArea,
      "placeholder",
      "\u60A8\u53EF\u4EE5\u5728\u56DE\u590D\u6846\u5185\u76F4\u63A5\u7C98\u8D34\u56FE\u7247\u6216\u62D6\u62FD\u56FE\u7247\u6587\u4EF6\u81F3\u56DE\u590D\u6846\u5185\u4E0A\u4F20"
    )
    const uploadTip = "+ \u63D2\u5165\u56FE\u7247"
    const placeholder = "[\u4E0A\u4F20\u56FE\u7247\u4E2D...]"
    addElement2(appendPosition, "span", {
      class: "snow",
      textContent: " \xB7 ",
    })
    const uploadButton = createElement("a", {
      class: "vr_upload_image",
      textContent: uploadTip,
    })
    appendPosition.append(uploadButton)
    addEventListener(uploadButton, "click", () => {
      if (!hasClass(uploadButton, "vr_button_disabled")) {
        handleClickUploadImage()
      }
    })
    addEventListener(
      doc,
      "paste",
      (event) => {
        var _a
        if (!(event instanceof ClipboardEvent)) {
          return
        }
        const replyTextArea2 = getReplyInputElement()
        if (
          !(replyTextArea2 == null ? void 0 : replyTextArea2.matches(":focus"))
        ) {
          return
        }
        const items = (_a = event.clipboardData) == null ? void 0 : _a.items
        if (!items) {
          return
        }
        const imageItem = Array.from(items).find((item) =>
          item.type.includes("image")
        )
        if (imageItem) {
          const file = imageItem.getAsFile()
          if (file) {
            handleUploadImage(file)
          }
        }
      },
      true
    )
    addEventListener(
      replyTextArea,
      "drop",
      (event) => {
        var _a
        if (!(event instanceof DragEvent)) {
          return
        }
        const files = (_a = event.dataTransfer) == null ? void 0 : _a.files
        if (files == null ? void 0 : files.length) {
          for (const file of files) {
            if (file.type.includes("image")) {
              event.preventDefault()
              event.stopImmediatePropagation()
              handleUploadImage(file)
            }
          }
        }
      },
      true
    )
    addEventListener(win, {
      uploadImageStart(event) {
        if (!event.detail) {
          return
        }
        const detail = event.detail
        const fileName = detail.file.name || "noname"
        detail.placeholder = placeholder.replace(/]/, ` (${fileName})]`)
        const replyTextArea2 = getReplyInputElement()
        if (replyTextArea2) {
          insertTextToReplyInput(
            replyTextArea2.value.trim().length > 0 &&
              replyTextArea2.selectionStart > 0
              ? `
${detail.placeholder}
`
              : `${detail.placeholder}
`
          )
        }
      },
      uploadImageSuccess(event) {
        if (!event.detail) {
          return
        }
        const detail = event.detail
        removeClass(uploadButton, "vr_button_disabled")
        uploadButton.textContent = uploadTip
        replaceReplyInputText(
          detail.placeholder || placeholder,
          detail.imgLink || "",
          true
        )
      },
      uploadImageFailed(event) {
        if (!event.detail) {
          return
        }
        const detail = event.detail
        removeClass(uploadButton, "vr_button_disabled")
        uploadButton.textContent = uploadTip
        replaceReplyInputText(detail.placeholder || placeholder, "")
        alert(
          "[V2EX.REP] \u274C \u4E0A\u4F20\u56FE\u7247\u5931\u8D25\uFF0C\u8BF7\u6253\u5F00\u63A7\u5236\u53F0\u67E5\u770B\u539F\u56E0"
        )
      },
    })
  }
  var uploadImage = () => {
    runOnce("uploadImage:init", init)
  }
  var config = {
    matches: ["https://*.v2ex.com/*"],
    run_at: "document_start",
  }
  var settingsTable2 = {
    fixReplyFloorNumbers: {
      title: "\u4FEE\u590D\u697C\u5C42\u53F7",
      defaultValue: true,
    },
    replyWithFloorNumber: {
      title: "\u56DE\u590D\u65F6\u5E26\u4E0A\u697C\u5C42\u53F7",
      defaultValue: true,
    },
    showTopReplies: {
      title: "\u663E\u793A\u70ED\u95E8\u56DE\u590D",
      defaultValue: true,
    },
    showCitedReplies: {
      title: "\u663E\u793A\u88AB\u5F15\u7528\u7684\u56DE\u590D",
      defaultValue: true,
    },
    filterRepliesByUser: {
      title:
        "\u67E5\u770B\u7528\u6237\u5728\u5F53\u524D\u4E3B\u9898\u4E0B\u7684\u6240\u6709\u56DE\u590D\u4E0E\u88AB\u63D0\u53CA\u7684\u56DE\u590D",
      description:
        "\u9F20\u6807\u79FB\u81F3\u7528\u6237\u540D\uFF0C\u4F1A\u663E\u793A\u8BE5\u7528\u6237\u5728\u5F53\u524D\u4E3B\u9898\u4E0B\u7684\u6240\u6709\u56DE\u590D\u4E0E\u88AB\u63D0\u53CA\u7684\u56DE\u590D",
      defaultValue: true,
    },
    loadMultiPages: {
      title: "\u9884\u52A0\u8F7D\u6240\u6709\u5206\u9875",
      defaultValue: true,
    },
    uploadImage: {
      title: "\u56DE\u590D\u65F6\u4E0A\u4F20\u56FE\u7247",
      defaultValue: true,
    },
    dailyCheckIn: {
      title: "\u6BCF\u65E5\u81EA\u52A8\u7B7E\u5230",
      defaultValue: true,
    },
    lazyLoadAvatars: {
      title: "\u61D2\u52A0\u8F7D\u7528\u6237\u5934\u50CF\u56FE\u7247",
      defaultValue: false,
    },
    quickSendThank: {
      title: "\u5FEB\u901F\u53D1\u9001\u611F\u8C22",
      defaultValue: false,
    },
    alwaysShowThankButton: {
      title: "\u4E00\u76F4\u663E\u793A\u611F\u8C22\u6309\u94AE",
      defaultValue: false,
    },
    quickHideReply: {
      title: "\u5FEB\u901F\u9690\u85CF\u56DE\u590D",
      defaultValue: false,
    },
    alwaysShowHideButton: {
      title: "\u4E00\u76F4\u663E\u793A\u9690\u85CF\u56DE\u590D\u6309\u94AE",
      defaultValue: false,
    },
    removeLocationHash: {
      title: "\u53BB\u6389 URL \u4E2D\u7684 #replyXX",
      defaultValue: true,
    },
    stickyTopicButtons: {
      title:
        "\u4E3B\u9898\u5185\u5BB9\u5E95\u90E8\u56FA\u5B9A\u663E\u793A\u6309\u94AE\u680F",
      defaultValue: true,
    },
    quickNavigation: {
      title: "\u53CC\u51FB\u7A7A\u767D\u5904\u5FEB\u901F\u5BFC\u822A",
      defaultValue: true,
    },
  }
  function registerMenuCommands() {
    registerMenuCommand("\u2699\uFE0F \u8BBE\u7F6E", showSettings, "o")
  }
  var fixedReplyFloorNumbers = false
  async function process3() {
    const domReady =
      doc.readyState === "interactive" || doc.readyState === "complete"
    if (doc.readyState === "complete" && getSettingsValue("dailyCheckIn")) {
      runOnce("dailyCheckIn", () => {
        setTimeout(dailyCheckIn, 1e3)
      })
    }
    if (/\/t\/\d+/.test(location.href)) {
      const replyElements = getReplyElements()
      for (const replyElement of replyElements) {
        if (!$(".reply_content", replyElement)) {
          continue
        }
        if (getSettingsValue("lazyLoadAvatars")) {
          lazyLoadAvatars(replyElement)
        }
        addLinkToAvatars(replyElement)
        if (getSettingsValue("replyWithFloorNumber")) {
          replyWithFloorNumber(replyElement)
        }
        if (getSettingsValue("alwaysShowThankButton")) {
          alwaysShowThankButton(replyElement)
        }
        if (getSettingsValue("alwaysShowHideButton")) {
          alwaysShowHideButton(replyElement)
        }
        if (getSettingsValue("quickSendThank")) {
          quickSendThank(replyElement)
        }
        if (getSettingsValue("quickHideReply")) {
          quickHideReply(replyElement)
        }
        addlinkToCitedFloorNumbers(replyElement)
        if (getSettingsValue("showCitedReplies")) {
          showCitedReplies(replyElement)
        }
      }
      if (domReady) {
        showTopReplies(replyElements, getSettingsValue("showTopReplies"))
      }
      stickyTopicButtons(getSettingsValue("stickyTopicButtons"))
      filterRepliesByUser(getSettingsValue("filterRepliesByUser"))
      if (
        domReady &&
        getSettingsValue("fixReplyFloorNumbers") &&
        !fixedReplyFloorNumbers
      ) {
        await fixReplyFloorNumbers(replyElements)
      }
      if (domReady && getSettingsValue("uploadImage")) {
        uploadImage()
      }
      if (domReady && getSettingsValue("removeLocationHash")) {
        runOnce("main:removeLocationHash", removeLocationHash)
      }
      if (domReady && getSettingsValue("quickNavigation")) {
        quickNavigation()
      }
      if (doc.readyState === "complete" && getSettingsValue("loadMultiPages")) {
        runOnce("main:loadMultiPages", () => {
          setTimeout(loadMultiPages, 1e3)
        })
      }
    }
  }
  async function main() {
    if (!document.body) {
      setTimeout(main, 100)
      return
    }
    await initSettings({
      id: "v2ex.rep",
      title: "V2EX.REP",
      footer: `
    <p>\u66F4\u6539\u8BBE\u7F6E\u540E\uFF0C\u9700\u8981\u91CD\u65B0\u52A0\u8F7D\u9875\u9762</p>
    <p>
    <a href="https://github.com/v2hot/v2ex.rep/issues" target="_blank">
    \u95EE\u9898\u53CD\u9988
    </a></p>
    <p>Made with \u2764\uFE0F by
    <a href="https://www.pipecraft.net/" target="_blank">
      Pipecraft
    </a></p>`,
      settingsTable: settingsTable2,
      async onValueChange() {
        await process3()
      },
    })
    registerMenuCommands()
    addStyle2(content_default)
    const resetCachedReplyElementsThenProcess = async () => {
      resetCachedReplyElements()
      await process3()
    }
    addEventListener(win, {
      floorNumberUpdated() {
        fixedReplyFloorNumbers = true
        if (
          getSettingsValue("replyWithFloorNumber") ||
          getSettingsValue("showCitedReplies")
        ) {
          const replyElements = getReplyElements()
          for (const replyElement of replyElements) {
            if (getSettingsValue("replyWithFloorNumber")) {
              replyWithFloorNumber(replyElement, true)
            }
            if (getSettingsValue("showCitedReplies")) {
              showCitedReplies(replyElement, true)
            }
          }
        }
      },
      async replyElementsLengthUpdated() {
        await resetCachedReplyElementsThenProcess()
        const replyElements = getCachedReplyElements()
        for (const replyElement of replyElements) {
          if (getSettingsValue("showCitedReplies")) {
            showCitedReplies(replyElement, true)
          }
        }
        showTopReplies(replyElements, getSettingsValue("showTopReplies"), true)
        if (getSettingsValue("fixReplyFloorNumbers")) {
          await fixReplyFloorNumbers(replyElements)
        }
      },
    })
    addEventListener(
      doc,
      "readystatechange",
      resetCachedReplyElementsThenProcess
    )
    await process3()
    const scanNodes = throttle(async () => {
      await process3()
    }, 500)
    const observer = new MutationObserver((mutationsList) => {
      scanNodes()
    })
    observer.observe($("#Main") || doc, {
      childList: true,
      subtree: true,
    })
  }
  main()
})()
