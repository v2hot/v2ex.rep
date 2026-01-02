import {
  getSettingsValue,
  initSettings,
  showSettings,
} from "browser-extension-settings"
import {
  $,
  addEventListener,
  addStyle,
  doc,
  runOnce,
  runWhenBodyExists,
  throttle,
  win as window,
} from "browser-extension-utils"
import styleText from "data-text:./content.scss"
import type { PlasmoCSConfig } from "plasmo"

import { addLinkToAvatars } from "./modules/add-link-to-avatars"
import { addlinkToCitedFloorNumbers } from "./modules/add-link-to-cited-floor-numbers"
import { alwaysShowHideButton } from "./modules/always-show-hide-button"
import { alwaysShowThankButton } from "./modules/always-show-thank-button"
import { dailyCheckIn } from "./modules/daily-check-in"
import { filterRepliesByUser } from "./modules/filter-repies-by-user"
import { fixReplyFloorNumbers } from "./modules/fix-reply-floor-numbers"
import { lazyLoadAvatars } from "./modules/lazy-load-avatars"
import { loadMultiPages } from "./modules/load-multi-pages"
import { quickHideReply } from "./modules/quick-hide-reply"
import { quickNavigation } from "./modules/quick-navigation"
import { quickSendThank } from "./modules/quick-send-thank"
import { removeLocationHash } from "./modules/remove-location-hash"
import { replaceFavicon } from "./modules/replace-favicon"
import { replyWithFloorNumber } from "./modules/reply-with-floor-number"
import { showCitedReplies } from "./modules/show-cited-replies"
import { showTopReplies } from "./modules/show-top-replies"
import { stickyTopicButtons } from "./modules/sticky-topic-buttons"
import { uploadImage } from "./modules/upload-image"
import {
  getCachedReplyElements,
  getReplyElements,
  resetCachedReplyElements,
} from "./utils"

if (
  // eslint-disable-next-line n/prefer-global/process
  process.env.PLASMO_TARGET === "chrome-mv3" ||
  // eslint-disable-next-line n/prefer-global/process
  process.env.PLASMO_TARGET === "firefox-mv3"
) {
  // Receive popup trigger to show settings in the content context
  const runtime =
    (globalThis as any).chrome?.runtime ?? (globalThis as any).browser?.runtime
  runtime?.onMessage?.addListener((message: any) => {
    if (message?.type === "links-helper:show-settings") {
      void showSettings()
    }
  })
}

export const config: PlasmoCSConfig = {
  matches: ["https://*.v2ex.com/*", "https://*.v2ex.co/*"],
  run_at: "document_start",
}

const settingsTable = {
  fixReplyFloorNumbers: {
    title: "修复楼层号",
    defaultValue: true,
  },
  replyWithFloorNumber: {
    title: "回复时带上楼层号",
    defaultValue: true,
  },
  showTopReplies: {
    title: "显示热门回复",
    defaultValue: true,
  },
  showCitedReplies: {
    title: "显示被引用的回复",
    defaultValue: true,
  },
  opaticyOfCitedReplies: {
    title: "被引用的回复上面遮罩的不透明度",
    type: "select",
    // 默认值：中
    defaultValue: "2",
    options: {
      无遮罩: "0",
      低: "1",
      中: "2",
      高: "3",
    },
  },
  showPreviousCitedReplies: {
    title: "被引用的回复是前一个楼层时",
    type: "select",
    defaultValue: "0",
    options: {
      不显示: "0",
      始终显示: "1",
    },
  },
  filterRepliesByUser: {
    title: "查看用户在当前主题下的所有回复与被提及的回复",
    description:
      "鼠标移至用户名，会显示该用户在当前主题下的所有回复与被提及的回复",
    defaultValue: true,
  },
  loadMultiPages: {
    title: "预加载所有分页",
    defaultValue: true,
  },
  uploadImage: {
    title: "回复时上传图片",
    defaultValue: true,
  },
  dailyCheckIn: {
    title: "每日自动签到",
    defaultValue: true,
  },
  lazyLoadAvatars: {
    title: "懒加载用户头像图片",
    defaultValue: false,
  },
  quickSendThank: {
    title: "快速发送感谢",
    defaultValue: false,
  },
  alwaysShowThankButton: {
    title: "一直显示感谢按钮",
    defaultValue: false,
  },
  quickHideReply: {
    title: "快速隐藏回复",
    defaultValue: false,
  },
  alwaysShowHideButton: {
    title: "一直显示隐藏回复按钮",
    defaultValue: false,
  },
  removeLocationHash: {
    title: "去掉 URL 中的 #replyXX",
    defaultValue: true,
  },
  stickyTopicButtons: {
    title: "主题内容底部固定显示按钮栏",
    defaultValue: true,
  },
  quickNavigation: {
    title: "双击空白处快速导航",
    defaultValue: false,
  },
  replaceFavicon: {
    title: "更换 favicon 图标",
    type: "select",
    defaultValue: "default",
    options: {
      默认: "default",

      GitHub: "github",
      用户头像: "avatar",
    },
  },
}

let fixedReplyFloorNumbers = false

async function applyAll() {
  const opaticyOfCitedReplies = getSettingsValue<string>(
    "opaticyOfCitedReplies"
  )
  if (doc.documentElement) {
    doc.documentElement.dataset.vrOpaticyOfCitedReplies = opaticyOfCitedReplies
  }

  const domReady =
    doc.readyState === "interactive" || doc.readyState === "complete"

  if (doc.readyState === "complete" && getSettingsValue("dailyCheckIn")) {
    // Run on every page
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    runOnce("dailyCheckIn", () => {
      setTimeout(dailyCheckIn, 1000)
    })
  }

  replaceFavicon(getSettingsValue("replaceFavicon"))

  if (/\/t\/\d+/.test(location.href)) {
    const replyElements = getReplyElements()
    for (const replyElement of replyElements) {
      if (!$(".reply_content", replyElement)) {
        // 页面加载中，次回复标签还没有加在完整
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
        showCitedReplies(
          replyElement,
          getSettingsValue("showPreviousCitedReplies")
        )
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
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      runOnce("main:removeLocationHash", removeLocationHash)
    }

    if (domReady && getSettingsValue("quickNavigation")) {
      quickNavigation()
    }

    if (doc.readyState === "complete" && getSettingsValue("loadMultiPages")) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      runOnce("main:loadMultiPages", () => {
        setTimeout(loadMultiPages, 1000)
      })
    }
  }
}

async function main() {
  await initSettings(() => ({
    id: "v2ex.rep",
    title: "V2EX.REP",
    footer: `
    <p>更改设置后，需要重新加载页面</p>
    <p>
    <a href="https://github.com/v2hot/v2ex.rep/issues" target="_blank">
    问题反馈
    </a></p>
    <p>Made with ❤️ by
    <a href="https://www.pipecraft.net/" target="_blank">
      Pipecraft
    </a></p>`,
    settingsTable,
    async onValueChange() {
      await applyAll()
    },
  }))

  addStyle(styleText)

  const resetCachedReplyElementsThenApplyAll = async () => {
    resetCachedReplyElements()
    await applyAll()
  }

  addEventListener(window, {
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
            showCitedReplies(
              replyElement,
              getSettingsValue("showPreviousCitedReplies"),
              true
            )
          }
        }
      }
    },
    async replyElementsLengthUpdated() {
      await resetCachedReplyElementsThenApplyAll()
      const replyElements = getCachedReplyElements()
      for (const replyElement of replyElements) {
        if (getSettingsValue("showCitedReplies")) {
          showCitedReplies(
            replyElement,
            getSettingsValue("showPreviousCitedReplies"),
            true
          )
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
    resetCachedReplyElementsThenApplyAll
  )

  await applyAll()

  const scanNodes = throttle(async () => {
    await applyAll()
  }, 500)

  addEventListener(doc, "visibilitychange", async () => {
    if (!doc.hidden) {
      await applyAll()
    }
  })

  const observer = new MutationObserver((mutationsList) => {
    // console.error("mutation", Date.now(), mutationsList)
    scanNodes()
  })

  observer.observe($("#Main") || doc, {
    childList: true,
    subtree: true,
  })
}

runWhenBodyExists(async () => {
  if (doc.documentElement.dataset.v2exRep === undefined) {
    doc.documentElement.dataset.v2exRep = ""
    await main()
  }
})
