import { getSettingsValue } from 'browser-extension-settings'
import {
  $,
  $$,
  addClass,
  addEventListener,
  createElement,
  getAttribute,
  hasClass,
  parseInt10,
  removeClass,
  runOnce,
  sleep,
  win as window,
} from 'browser-extension-utils'

import {
  getCachedReplyElements,
  getPagingNextButtons,
  getPagingPreviousButtons,
  getRepliesCount,
  parseUrl,
} from '../utils'
import { lazyLoadAvatars } from './lazy-load-avatars'

let retryCount = 0
const getTopicPage = async (topicId: string, page = 1) => {
  const url = `${location.protocol}//${location.host}/t/${topicId}?p=${page}`

  try {
    const response = await fetch(url)

    if (response.status === 200) {
      return await response.text()
    }
  } catch (error) {
    console.error(error, `page ${page}`)
    retryCount++
    if (retryCount < 10) {
      await sleep(1000)
      return getTopicPage(topicId, page) as Promise<string>
    }
  }
}

const getReplyElements = (html: string) => {
  const htmlNode = createElement('html')
  htmlNode.innerHTML = html
  return $$('.cell[id^="r_"]', htmlNode)
}

const insertReplyElementsToPage = (
  replyElements: HTMLElement[],
  page: number,
  inertPoint: HTMLElement
) => {
  if (!replyElements || replyElements.length === 0 || !inertPoint) {
    return
  }

  for (const replyElement of replyElements) {
    replyElement.dataset.page = String(page)
    if (getSettingsValue('lazyLoadAvatars')) {
      lazyLoadAvatars(replyElement)
    }

    inertPoint.before(replyElement)
  }
}

const gotoPage = (page: string | number | undefined, event: Event) => {
  if (!page) {
    return
  }

  history.pushState(null, '', `?p=${page}`)

  const main = $('#Main') || $('.content')
  const firstReply = $(`.cell[data-page="${page}"]`, main)
  if (firstReply) {
    firstReply.scrollIntoView({ block: 'start' })
    event.preventDefault()
    event.stopImmediatePropagation()
  } else {
    // Not loaded yet
    location.reload()
  }

  for (const pagingElement of $$('.page_current,.page_normal')) {
    if (pagingElement.textContent === String(page)) {
      removeClass(pagingElement, 'page_normal')
      addClass(pagingElement, 'page_current')
    } else {
      removeClass(pagingElement, 'page_current')
      addClass(pagingElement, 'page_normal')
    }
  }

  for (const pageInput of $$('.page_input')) {
    ;(pageInput as HTMLInputElement).value = String(page)
  }

  const repliesCount = getRepliesCount()
  const totalPage = Math.ceil(repliesCount / 100)

  for (const button of getPagingPreviousButtons()) {
    if (String(page) === '1') {
      addClass(button, 'disable_now')
    } else {
      removeClass(button, 'disable_now')
    }
  }

  for (const button of getPagingNextButtons()) {
    if (String(page) === String(totalPage)) {
      addClass(button, 'disable_now')
    } else {
      removeClass(button, 'disable_now')
    }
  }
}

const updatePagingElements = () => {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  runOnce('loadMultiPages:updatePagingElements', () => {
    for (const pagingElement of $$('.page_current,.page_normal')) {
      let element = pagingElement
      // Convert SPAN tag to A tag
      if (pagingElement.tagName === 'SPAN') {
        const page = pagingElement.textContent
        if (page) {
          const urlObj = new URL(location.href)
          urlObj.searchParams.set('p', page)
          const href = urlObj.toString()
          const aElement = createElement('a', {
            href,
            class: getAttribute(pagingElement, 'class'),
          })
          aElement.textContent = page
          pagingElement.replaceWith(aElement)
          element = aElement
        }
      }

      addEventListener(element, 'click', (event) => {
        const page = element.textContent
        gotoPage(page, event)
      })
    }

    for (const pageInput of $$('.page_input')) {
      pageInput.removeAttribute('onkeydown')
      addEventListener(
        pageInput,
        'keydown',
        (event: KeyboardEvent) => {
          if (event.key === 'Enter') {
            gotoPage((event.target as HTMLInputElement)?.value, event)
            return false
          }
        },
        true
      )
    }

    const buttons = [...getPagingPreviousButtons(), ...getPagingNextButtons()]
    for (const button of buttons) {
      button.removeAttribute('onclick')
      button.removeAttribute('onmouseover')
      button.removeAttribute('onmousedown')
      button.removeAttribute('onmouseleave')
      addEventListener(
        button,
        'mouseover',
        (event) => {
          if (!hasClass(button, 'disable_now')) {
            addClass(button, 'hover_now')
          }

          event.preventDefault()
          event.stopImmediatePropagation()
        },
        true
      )
      addEventListener(
        button,
        'mousedown',
        (event) => {
          if (!hasClass(button, 'disable_now')) {
            addClass(button, 'active_now')
          }

          event.preventDefault()
          event.stopImmediatePropagation()
        },
        true
      )
      addEventListener(
        button,
        'mouseleave',
        (event) => {
          removeClass(button, 'hover_now')
          removeClass(button, 'active_now')
          event.preventDefault()
          event.stopImmediatePropagation()
        },
        true
      )

      addEventListener(
        button,
        'click',
        (event) => {
          if (!hasClass(button, 'disable_now')) {
            const page = parseInt10(
              ($('.page_input') as HTMLInputElement)?.value
            )
            if (page) {
              if (hasClass(button, 'normal_page_right')) {
                gotoPage(page + 1, event)
              } else {
                gotoPage(page - 1, event)
              }
            }
          }

          setTimeout(() => {
            removeClass(button, 'hover_now')
            removeClass(button, 'active_now')
          }, 100)
          event.preventDefault()
          event.stopImmediatePropagation()
        },
        true
      )
    }
  })
}

export const loadMultiPages = async () => {
  const repliesCount = getRepliesCount()
  console.info('[V2EX.REP] 总回复数', repliesCount)
  if (repliesCount > 100) {
    const result = parseUrl()
    const topicId = result.topicId
    const currentPage = result.page
    const totalPage = Math.ceil(repliesCount / 100)
    const orgReplyElements = getCachedReplyElements()
    if (orgReplyElements.length === 0) {
      return
    }

    const firstReply = orgReplyElements[0]
    const pageElement = orgReplyElements.at(-1)!
      .nextElementSibling as HTMLElement

    addClass(pageElement, 'sticky_paging')
    updatePagingElements()

    for (const replyElement of orgReplyElements) {
      replyElement.dataset.page = String(currentPage)
    }

    const maxPreloadPageCount = parseInt10(
      getSettingsValue('maxPreloadPageCount')
    )

    let pagesToLoad: number[] = []

    if (maxPreloadPageCount === 0) {
      for (let i = 1; i <= totalPage; i++) {
        if (i !== currentPage) {
          pagesToLoad.push(i)
        }
      }
    } else {
      const nextPages: number[] = []
      for (let i = currentPage + 1; i <= totalPage; i++) {
        nextPages.push(i)
      }

      const prevPages: number[] = []
      for (let i = currentPage - 1; i >= 1; i--) {
        prevPages.push(i)
      }

      pagesToLoad = [...nextPages, ...prevPages].slice(0, maxPreloadPageCount)
      pagesToLoad.sort((a, b) => a - b)
    }

    for (const i of pagesToLoad) {
      console.info('[V2EX.REP] Fetching page', i)
      // eslint-disable-next-line no-await-in-loop
      const html = (await getTopicPage(topicId, i)) as string
      if (html) {
        const replyElements = getReplyElements(html)
        insertReplyElementsToPage(
          replyElements,
          i,
          i < currentPage ? firstReply : pageElement
        )
        // 触发更新事件
        window.dispatchEvent(new Event('replyElementsLengthUpdated'))
      }

      // eslint-disable-next-line no-await-in-loop
      await sleep(1000)
    }
  }
}
