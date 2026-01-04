import { $, $$, addClass, hasClass, parseInt10 } from 'browser-extension-utils'

import {
  cloneReplyElement,
  getFloorNumber,
  getMemberIdFromMemberLink,
  getReplyElementByMemberIdAndFloorNumber,
} from '../utils'

export const showCitedReplies = (
  replyElement: HTMLElement,
  showPreviousCitedReplies: string,
  forceUpdate = false
) => {
  // Don't show cited replies if v2ex plish extension is enabled
  if (
    !forceUpdate &&
    (replyElement.dataset.showCitedReplies || $('.v2p-color-mode-toggle'))
  ) {
    return
  }

  const floorNumber = getFloorNumber(replyElement)
  if (!floorNumber) {
    return
  }

  replyElement.dataset.showCitedReplies = 'done'

  for (const element of $$('.cited_reply', replyElement)) {
    element.remove()
  }

  const content = $('.reply_content', replyElement)
  const memberLinks = $$('a[href^="/member/"]', content) as HTMLAnchorElement[]
  let hasCitedReplies = false
  for (const memberLink of memberLinks) {
    const textNode = memberLink.previousSibling
    let nextElement = memberLink.nextSibling as HTMLElement | undefined
    let target = memberLink as HTMLElement
    let citedFloorNumber: number | undefined
    if (
      textNode &&
      textNode.nodeType === 3 /* TEXT_NODE */ &&
      textNode.textContent &&
      textNode.textContent.endsWith('@')
    ) {
      // console.log(memberLink)
      const memberId = getMemberIdFromMemberLink(memberLink)
      if (!memberId) {
        continue
      }

      while (
        nextElement &&
        (nextElement.tagName === 'BR' ||
          !nextElement.textContent ||
          nextElement.textContent.trim().length === 0 ||
          hasClass(nextElement, 'utags_ul'))
      ) {
        target = nextElement
        nextElement = nextElement.nextSibling as HTMLElement | undefined
      }

      if (nextElement && hasClass(nextElement, 'cited_floor_number')) {
        target = nextElement
        citedFloorNumber = parseInt10(nextElement.dataset.floorNumber)
      }

      let citedReplyElement: HTMLElement | undefined
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
        // const floorNumber2 = getFloorNumber(citedReplyElement)
        // if (floorNumber - floorNumber2 <= 1 && !hasCitedReplies) {
        if (
          citedReplyElement.nextElementSibling === replyElement &&
          !hasCitedReplies &&
          showPreviousCitedReplies !== '1'
        ) {
          // 如果引用的是前一个回复，并且没有其他引用的回复，则不显示
          continue
        }

        const cloned = cloneReplyElement(citedReplyElement, true)
        cloned.removeAttribute('id')
        addClass(cloned, 'cited_reply')
        // textNode.before(cloned)
        target.after(cloned)
        hasCitedReplies = true
      }
    }
  }
}
