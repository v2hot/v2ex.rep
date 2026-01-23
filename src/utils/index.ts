import {
  $,
  $$,
  addEventListener,
  createElement,
  doc,
  hasClass,
  parseInt10,
} from 'browser-extension-utils'

// 从含有第一个评论的 box div 查询
export const getReplyElements = (): HTMLElement[] => {
  const firstReply = $('.box .cell[id^="r_"]')
  if (firstReply?.parentElement) {
    const v2exPolishModel = $('.v2p-model-mask')
    return $$('.cell[id^="r_"]', firstReply.parentElement).filter((reply) => {
      if (v2exPolishModel && reply.closest('.v2p-model-mask')) {
        return false
      }

      return true
    })
  }

  return []
}

let cachedReplyElements: HTMLElement[] | undefined
export const getCachedReplyElements = (): HTMLElement[] => {
  if (!cachedReplyElements) {
    if (doc.readyState === 'loading') {
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
    return ''
  }

  let id = replyElement.dataset.id
  if (id) {
    return id
  }

  id = replyElement.id.replace(/((top|related|cited)_)?r_/, '')
  replyElement.dataset.id = id
  return id
}

export const getFloorNumberElement = (replyElement: HTMLElement | undefined) =>
  replyElement ? $('.no', replyElement) : undefined

export const getFloorNumber = (replyElement: HTMLElement | undefined) => {
  if (!replyElement) {
    return 0
  }

  let floorNumber = parseInt10(replyElement.dataset.floorNumber)
  if (floorNumber) {
    return floorNumber
  }

  const numberElement = getFloorNumberElement(replyElement)
  if (numberElement) {
    floorNumber = parseInt10(numberElement.textContent as string | undefined, 0)
    replyElement.dataset.floorNumber = String(floorNumber)
    return floorNumber
  }

  return 0
}

export const cloneReplyElement = (
  replyElement: HTMLElement,
  wrappingTable = false,
  keepCitedReplies = false
) => {
  const cloned = replyElement.cloneNode(true) as HTMLElement

  const floorNumber = $('.no', cloned)
  const toolbox = $('.fr', cloned)
  if (toolbox && floorNumber) {
    const floorNumber2 = createElement('a', {
      class: 'no',
      textContent: floorNumber.textContent,
    })
    addEventListener(floorNumber2, 'click', (event) => {
      replyElement.scrollIntoView({ block: 'start' })
      event.preventDefault()
      event.stopPropagation()
    })
    toolbox.innerHTML = ''
    toolbox.append(floorNumber2)
  }

  // Remove cited replies, child replies
  /* fix v2ex polish, v2ex plus start */
  const cells = $$('.cell,.v2p-topic-reply-ref,.nested', cloned)
  for (const cell of cells) {
    if (keepCitedReplies && hasClass(cell, 'cited_reply')) {
      continue
    }

    cell.remove()
  }

  /* fix v2ex polish, v2ex plus end */
  if (wrappingTable) {
    const table = cloned.firstElementChild as HTMLElement
    if (table && table.tagName === 'TABLE') {
      const wrapper = createElement('div', {
        class: 'vr_wrapper',
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
  const page = parseInt10(matched[2], 1)
  return { topicId, page }
}

export const getRepliesCount = () => {
  const elements = $$('.box .cell .gray')
  for (const element of elements) {
    const matched = /(\d+)\s条回复/.exec(element.textContent || '') || []
    if (matched[1]) {
      return parseInt10(matched[1], 0)
    }
  }

  return 0
}

export const getMemberIdFromMemberLink = (memberLink: HTMLAnchorElement) => {
  if (!memberLink) {
    return
  }

  return (/member\/(\w+)/.exec(memberLink.href) || [])[1]
}

export const getReplyAuthorMemberId = (replyElement: HTMLElement) => {
  if (!replyElement) {
    return
  }

  const memberLink = $('a[href^="/member/"]', replyElement) as HTMLAnchorElement
  return getMemberIdFromMemberLink(memberLink)
}

/**
 * type:
 *   - 0: 取与指定楼层号最近的回复 (默认)
 *   - 1: 取与指定楼层号相同或往前最近的回复
 *   - 2: 取与指定楼层号相同或往后最近的回复
 */
export const getReplyElementByMemberIdAndFloorNumber = (
  memberId: string | undefined,
  floorNumber: number | undefined,
  type = 0
) => {
  if (!memberId || !floorNumber) {
    return
  }

  const replyElements = getCachedReplyElements()
  const length = replyElements.length
  // 如果楼层数比较大，从后往前找
  const reverse = floorNumber > length / 2
  let nearestReply: HTMLElement | undefined
  let nearestReplyGap = 1000
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

    // 取最邻近的回复
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

export const getPagingPreviousButtons = () =>
  $$('.normal_page_right').map(
    (right) => right.previousElementSibling as HTMLElement
  )
export const getPagingNextButtons = () => $$('.normal_page_right')

export const getReplyInputElement = () =>
  $('#reply_content') as HTMLTextAreaElement | undefined

export const getReplyInputText = () => {
  const replyTextArea = getReplyInputElement()
  return replyTextArea ? replyTextArea.value : ''
}

/**
 * 插入文本至回复输入框中，聚焦输入框，并更新光标位置。
 */
export function insertTextToReplyInput(text: string) {
  const replyTextArea = getReplyInputElement()
  if (replyTextArea) {
    const startPos = replyTextArea.selectionStart
    const endPos = replyTextArea.selectionEnd

    const valueToStart = replyTextArea.value.slice(0, startPos)
    const valueFromEnd = replyTextArea.value.slice(endPos)
    replyTextArea.value = `${valueToStart}${text}${valueFromEnd}`

    replyTextArea.focus()

    const newPos = startPos + text.length
    replyTextArea.selectionStart = newPos
    replyTextArea.selectionEnd = newPos
  }
}

export const replaceReplyInputText = (
  find: string,
  replace: string,
  dispatchInputEvent = false
) => {
  const replyTextArea = getReplyInputElement()
  if (replyTextArea) {
    const value = replyTextArea.value

    if (typeof value === 'string') {
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
        replyTextArea.dispatchEvent(new Event('input'))
      }
    }
  }
}

export const getOnce = () => {
  const onceElement = $('#once') as HTMLInputElement
  if (onceElement?.value) {
    return onceElement.value
  }

  const html = doc.body.innerHTML
  const once = (/once=(\d+)/.exec(html) || [])[1]
  return once
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  let timer: number | undefined

  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay) as unknown as number
  } as T
}
