import {
  $,
  actionHref,
  getAttribute,
  setAttribute,
} from 'browser-extension-utils'

import { getFloorNumber } from '../utils'

export const replyWithFloorNumber = (
  replyElement: HTMLElement,
  forceUpdate = false
) => {
  const replyButton = $('a[onclick^="replyOne"]', replyElement)
  if (replyButton) {
    setAttribute(replyButton, 'href', actionHref)

    const onclick = getAttribute(replyButton, 'onclick') || ''
    if (onclick.includes('#') && !forceUpdate) {
      return
    }

    const number = getFloorNumber(replyElement)
    if (number) {
      setAttribute(
        replyButton,
        'onclick',
        onclick.replace(
          /replyOne\('(\w+)(?: .*)?'\)/,
          `replyOne('$1 #${number}')`
        )
      )
      // To re-bind click event
      // eslint-disable-next-line no-self-assign
      replyButton.outerHTML = replyButton.outerHTML
    }
  }
}
