import {
  $,
  actionHref,
  getAttribute,
  setAttribute,
} from 'browser-extension-utils'

export const quickHideReply = (replyElement: HTMLElement) => {
  const hideButton = $('a[onclick*="ignoreReply"]', replyElement)
  if (hideButton) {
    const onclick = getAttribute(hideButton, 'onclick')
    if (!onclick.includes('confirm')) {
      return
    }

    setAttribute(
      hideButton,
      'onclick',
      onclick.replace(/.*(ignoreReply\(.+\)).*/, '$1')
    )
    setAttribute(hideButton, 'href', actionHref)
    // eslint-disable-next-line no-self-assign
    hideButton.outerHTML = hideButton.outerHTML
  }
}
