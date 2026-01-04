import { $, createElement, getAttribute } from 'browser-extension-utils'

export const addLinkToAvatars = (replyElement: HTMLElement) => {
  const memberLink = $('a[href^="/member/"]', replyElement)
  if (memberLink && memberLink.firstChild?.tagName === 'IMG') {
    return
  }

  const avatar = $('img.avatar', replyElement)
  if (memberLink && avatar) {
    if (avatar.parentElement?.tagName === 'A') {
      return
    }

    const memberLink2 = createElement('a', {
      href: getAttribute(memberLink, 'href'),
    })
    avatar.after(memberLink2)
    memberLink2.append(avatar)
  }
}
