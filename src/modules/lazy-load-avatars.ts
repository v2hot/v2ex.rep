import {
  $,
  $$,
  addEventListener,
  doc,
  getAttribute,
  setAttribute,
  throttle,
  win as window,
} from 'browser-extension-utils'

const restoreImgSrc = throttle(() => {
  for (const img of $$('img[data-src]')) {
    setAttribute(img, 'src', getAttribute(img, 'data-src'))
    delete img.dataset.src
  }
}, 500)

export const lazyLoadAvatars = (replyElement: HTMLElement) => {
  const avatar = $('img.avatar', replyElement)
  if (avatar) {
    if (getAttribute(avatar, 'loading') === 'lazy' || avatar.complete) {
      return
    }

    const src = getAttribute(avatar, 'src')
    setAttribute(avatar, 'loading', 'lazy')
    setAttribute(avatar, 'data-src', src)
    setAttribute(
      avatar,
      'src',
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    )
    if (doc.readyState === 'complete') {
      setTimeout(restoreImgSrc)
    } else {
      addEventListener(window, 'load', restoreImgSrc)
    }
  }
}
