import {
  $,
  $$,
  addEventListener,
  createElement,
  doc,
} from "browser-extension-utils"

// 从含有第一个评论的 box div 查询
export const getReplyElements = () => {
  const firstReply = $('.box .cell[id^="r_"]')
  if (firstReply?.parentElement) {
    const v2exPolishModel = $(".v2p-model-mask")
    return $$('.cell[id^="r_"]', firstReply.parentElement).filter((reply) => {
      // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
      if (v2exPolishModel && v2exPolishModel.contains(reply)) {
        return false
      }

      return true
    })
  }

  return []
}

let cachedReplyElements: HTMLElement[]
export const getCachedReplyElements = () => {
  if (!cachedReplyElements) {
    if (doc.readyState === "loading") {
      return getReplyElements()
    }

    cachedReplyElements = getReplyElements()
  }

  return cachedReplyElements
}

export const resetCachedReplyElements = () => {
  cachedReplyElements = undefined
}

export const getReplyId = (replyElement: HTMLElement | undefined) => {
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

export const getFloorNumberElement = (replyElement: HTMLElement | undefined) =>
  replyElement ? $(".no", replyElement) : undefined

export const getFloorNumber = (replyElement: HTMLElement | undefined) => {
  if (!replyElement) {
    return 0
  }

  let floorNumber = Number.parseInt(replyElement.dataset.floorNumber || "", 10)
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

export const cloneReplyElement = (
  replyElement: HTMLElement,
  wrappingTable = false
) => {
  const cloned = replyElement.cloneNode(true) as HTMLElement

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

  // Remove cited replies, child replies
  /* fix v2ex polish start */
  const cells = $$(".cell,.v2p-topic-reply-ref", cloned)
  for (const cell of cells) {
    cell.remove()
  }

  /* fix v2ex polish end */
  if (wrappingTable) {
    const table = cloned.firstElementChild as HTMLElement
    if (table && table.tagName === "TABLE") {
      const wrapper = createElement("div", {
        class: "wrapper",
      })

      table.after(wrapper)
      wrapper.append(table)
    }
  }

  return cloned
}

export const sortReplyElementsByFloorNumberCompareFn = (
  a: HTMLElement,
  b: HTMLElement
) => getFloorNumber(a) - getFloorNumber(b)

export const parseUrl = () => {
  const matched = /\/t\/(\d+)(?:.+\bp=(\d+))?/.exec(location.href) || []
  const topicId = matched[1]
  const page = Number.parseInt(matched[2], 10) || 1
  return { topicId, page }
}

export const isTouchScreen = "ontouchstart" in document.documentElement
