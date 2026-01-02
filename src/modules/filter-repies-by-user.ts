import {
  $,
  $$,
  actionHref,
  addClass,
  addElement,
  addEventListener,
  doc,
  getOffsetPosition,
  hasClass,
  isTouchScreen,
  removeEventListener,
  setStyle,
  win as window,
} from "browser-extension-utils"

import {
  cloneReplyElement,
  getCachedReplyElements,
  getFloorNumber,
  getReplyId,
  sortReplyElementsByFloorNumberCompareFn,
} from "../utils"

const isTouchScreen1 = isTouchScreen()
let timeoutId: number | undefined

const scrollPositionStack: number[] = []
const showModalReplies = (
  replies: HTMLElement[],
  referElement: HTMLElement,
  memberId: string,
  type?: string
) => {
  const main = $("#Main") || $(".content")
  if (!main) {
    return
  }

  if (doc.scrollingElement) {
    scrollPositionStack.push(doc.scrollingElement.scrollTop)
  }

  setStyle(main, "position: relative;")

  // 只匹配 main 区域，右侧栏除外
  const replyElement = $("#Main")
    ? (referElement.closest("#Main .cell") as HTMLElement | undefined)
    : (referElement.closest(".cell") as HTMLElement | undefined)
  const relatedBox = replyElement?.closest(".related_replies")
  if (replyElement && relatedBox) {
    const lastRelatedRepliesBox = $$(".related_replies_container").pop()
    if (lastRelatedRepliesBox?.contains(replyElement)) {
      // Do nothing
    } else {
      closeModal(true)
    }
  } else {
    closeModal()
  }

  const container = addElement(main, "div", {
    class: "related_replies_container",
  })

  const box = addElement(container, "div", {
    class: "box related_replies related_replies_before",
  })

  const box2 = addElement(container, "div", {
    class: "box related_replies related_replies_after",
  })

  box.innerHTML = "" // `<div class="cell"><div class="fr"></div><span class="fade">关联回复</span></div>`
  box2.innerHTML = ""

  const tabs = addElement(box, "div", {
    class: "box tabs inner",
  })

  addElement(tabs, "a", {
    class: !type || type === "all" ? "tab_current" : "tab",
    href: actionHref,
    textContent: "全部回复",
    onclick() {
      // closeModal(true)
      showRelatedReplies(referElement, memberId)
    },
  })
  addElement(tabs, "a", {
    class: type === "posted" ? "tab_current" : "tab",
    href: actionHref,
    textContent: `仅 ${memberId} 发表的回复`,
    onclick() {
      // closeModal(true)
      showRelatedReplies(referElement, memberId, "posted")
    },
  })

  const replyId = replyElement ? getReplyId(replyElement) : undefined
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
    addElement(box, "div", {
      class: "cell",

      innerHTML: `<span class="fade">本页面没有其他回复</span>`,
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
    addElement(box, "div", {
      class: "cell",

      innerHTML: `<span class="fade">这条回复后面还有 ${afterCount} 条回复</span>`,
    })
  }

  if (beforeCount > 0 && afterCount === 0) {
    addElement(box2, "div", {
      class: "cell",

      innerHTML: `<span class="fade">这条回复前面还有 ${beforeCount} 条回复</span>`,
    })
  }

  const width = main.offsetWidth + "px"
  if (replyElement) {
    const offsetTop = getOffsetPosition(replyElement, main).top
    const height = box.offsetHeight || box.clientHeight
    const height2 = replyElement.offsetHeight || replyElement.clientHeight
    // console.log(offsetTop, replyElement)
    setStyle(box, {
      top: offsetTop - height + "px",
      width,
    })
    setStyle(box2, {
      top: offsetTop + height2 + "px",
      width,
    })
  } else if (afterCount > 0) {
    box2.firstChild?.before(tabs)
    const headerElement = referElement?.closest(".header") as
      | HTMLElement
      | undefined
    if (headerElement) {
      // 主题内容部分用户链接
      const offsetTop = getOffsetPosition(headerElement, main).top
      const height2 = headerElement.offsetHeight || headerElement.clientHeight
      setStyle(box2, {
        top: offsetTop + height2 + "px",
        width,
      })
      box.remove()
    } else {
      // 右侧栏用户链接
      const firstReply = $('.box .cell[id^="r_"]')
      const offsetTop = firstReply
        ? Math.max(getOffsetPosition(firstReply, main).top, window.scrollY)
        : window.scrollY
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

export const filterRepliesPostedByMember = (memberIds: string[]) => {
  const replies: HTMLElement[] = []
  const replyElements = getCachedReplyElements()
  for (const replyElement of replyElements) {
    const memberLink = $(
      'a[href^="/member/"]',
      replyElement
    ) as HTMLAnchorElement
    if (!memberLink) {
      continue
    }

    const memberId = (/member\/(\w+)/.exec(memberLink.href) || [])[1]
    if (memberIds.includes(memberId)) {
      // console.log(replyElement)
      const cloned = cloneReplyElement(replyElement, true, true)
      cloned.id = "related_" + replyElement.id
      replies.push(cloned)
    }
  }

  return replies
}

const filterRepliesByPosterOrMentioned = (memberId: string) => {
  const replies: HTMLElement[] = []
  const replyElements = getCachedReplyElements()
  for (const replyElement of replyElements) {
    const memberLink = $(`a[href^="/member/${memberId}"]`, replyElement)
    if (!memberLink) {
      continue
    }

    // console.log(replyElement)
    let cloned = cloneReplyElement(replyElement, true)

    // fix v2ex polish start
    const memberLink2 = $(`a[href^="/member/${memberId}"]`, cloned)
    if (!memberLink2) {
      continue
    }
    // fix v2ex polish end

    cloned = cloneReplyElement(replyElement, true, true)

    cloned.id = "related_" + replyElement.id
    replies.push(cloned)
  }

  return replies
}

const showRelatedReplies = (
  memberLink: HTMLElement,
  memberId: string,
  type?: string
) => {
  const replies =
    type === "posted"
      ? filterRepliesPostedByMember([memberId])
      : filterRepliesByPosterOrMentioned(memberId)
  showModalReplies(replies, memberLink, memberId, type)
}

const onMouseOver = (event: Event) => {
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = undefined
  }

  const memberLink = event.target as HTMLAnchorElement
  timeoutId = setTimeout(() => {
    // console.log(memberLink)
    const memberId = (/member\/(\w+)/.exec(memberLink.href) || [])[1]
    if (memberId) {
      // console.log(memberId)
      showRelatedReplies(memberLink, memberId)
    }
  }, 700)
}

const onMouseOut = () => {
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = undefined
  }
}

const closeModal = (closeLast = false) => {
  for (const element of $$(".related_replies_container").reverse()) {
    element.remove()
    const scrollPosition = scrollPositionStack.pop()
    if (scrollPosition !== undefined && doc.scrollingElement) {
      doc.scrollingElement.scrollTop = scrollPosition
    }

    if (closeLast) {
      break
    }
  }
}

const onDocumentClick = (event: Event) => {
  const target = event.target as HTMLElement

  if (target.closest(".utags_ul")) {
    if (
      hasClass(target, "utags_captain_tag") ||
      hasClass(target, "utags_captain_tag2")
    ) {
      event.preventDefault()
    }

    return
  }

  if (isTouchScreen1) {
    const memberLink = target.closest('a[href^="/member/"]') as
      | HTMLElement
      | undefined
    if (memberLink && !$("img", memberLink)) {
      event.preventDefault()
      event.stopPropagation()
      return
    }
  }

  const floorNumberElement = target.closest(".related_replies a.no")
  if (floorNumberElement) {
    closeModal()
    return
  }

  const lastRelatedRepliesBox = $$(".related_replies_container").pop()
  const relatedReply = target.closest(".related_replies .cell")
  if (relatedReply && lastRelatedRepliesBox?.contains(relatedReply)) {
    return
  }

  const relatedRepliesBox = target.closest(".related_replies_container")
  if (relatedRepliesBox) {
    closeModal(true)
    return
  }

  closeModal()
}

const onDocumentKeyDown = (event) => {
  if (event.defaultPrevented) {
    return // 如果事件已经在进行中，则不做任何事。
  }

  if (event.key === "Escape") {
    closeModal(true)
  }
}

export const filterRepliesByUser = (toogle: boolean) => {
  if (toogle) {
    const memberLinks = $$('a[href^="/member/"]')
    for (const memberLink of memberLinks) {
      if (!memberLink.boundEvent) {
        addEventListener(memberLink, "mouseover", onMouseOver, true)
        addEventListener(memberLink, "mouseout", onMouseOut)
        if (isTouchScreen1) {
          addEventListener(memberLink, "touchstart", onMouseOver, true)
        }

        memberLink.boundEvent = true
      }
    }

    if (!doc.boundEvent) {
      addEventListener(doc, "click", onDocumentClick, true)
      addEventListener(doc, "keydown", onDocumentKeyDown)
      doc.boundEvent = true
    }
  } else if (doc.boundEvent) {
    // if toogle === false
    closeModal()
    removeEventListener(doc, "click", onDocumentClick, true)
    removeEventListener(doc, "keydown", onDocumentKeyDown)
    doc.boundEvent = false

    const memberLinks = $$('a[href^="/member/"]')
    for (const memberLink of memberLinks) {
      if (memberLink.boundEvent) {
        removeEventListener(memberLink, "mouseover", onMouseOver, true)
        removeEventListener(memberLink, "mouseout", onMouseOut)
        if (isTouchScreen1) {
          removeEventListener(memberLink, "touchstart", onMouseOver, true)
        }

        memberLink.boundEvent = false
      }
    }
  }
}
