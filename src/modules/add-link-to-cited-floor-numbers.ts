import {
  $,
  $$,
  addEventListener,
  createElement,
  doc,
  hasClass,
  parseInt10,
  runOnce,
} from 'browser-extension-utils'

import {
  getMemberIdFromMemberLink,
  getReplyElementByMemberIdAndFloorNumber,
} from '../utils'

export const addlinkToCitedFloorNumbers = (replyElement: HTMLElement) => {
  const content = $('.reply_content', replyElement)
  const memberLinks = $$('a[href^="/member/"]', content) as HTMLAnchorElement[]
  for (const memberLink of memberLinks) {
    const previousTextNode = memberLink.previousSibling
    const memberId = getMemberIdFromMemberLink(memberLink)
    if (
      previousTextNode &&
      previousTextNode.nodeType === 3 /* TEXT_NODE */ &&
      previousTextNode.textContent &&
      previousTextNode.textContent.endsWith('@') &&
      memberId
    ) {
      let nextTextNode = memberLink.nextSibling
      while (nextTextNode) {
        if (
          nextTextNode.tagName === 'BR' ||
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
        nextTextNode.nodeType !== 3 /* TEXT_NODE */ ||
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
        const element = createElement('a', {
          class: 'cited_floor_number',
          textContent: match[2],
          'data-member-id': memberId,
          'data-floor-number': match[3],
        })
        nextTextNode.before(element)
      }

      nextTextNode.textContent = match[4]
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  runOnce('addlinkToCitedFloorNumbers:document-onclick', () => {
    addEventListener(doc, 'click', (event) => {
      const target = event.target as HTMLElement
      if (hasClass(target, 'cited_floor_number')) {
        const memberId = target.dataset.memberId
        const floorNumber = parseInt10(target.dataset.floorNumber)
        const citedReplyElement = getReplyElementByMemberIdAndFloorNumber(
          memberId,
          floorNumber
        )
        if (citedReplyElement) {
          citedReplyElement.scrollIntoView({ block: 'start' })
          event.preventDefault()
          event.stopPropagation()
        }
      }
    })
  })
}
