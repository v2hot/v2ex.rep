import { getSettingsValue } from 'browser-extension-settings'
import {
  addValueChangeListener,
  getValue,
  setValue,
} from 'browser-extension-storage'

import { debounce } from '../utils/index'

const CHECK_INTERVAL = 60 * 1000
const LOCK_TIMEOUT = 20 * 1000
const KEY_LOCK = 'check_lock'
const KEY_LAST_CHECK = 'last_check'
const KEY_UNREAD_COUNT = 'unread_count'

let initialized = false
let currentUnreadCount = 0
let originalFavicon: string | undefined
let utagsHostObserver: MutationObserver | undefined
let utagsShadowObserver: MutationObserver | undefined

function startUtagsObserver(): void {
  // Observer for Shadow Root changes
  const onShadowMutation: MutationCallback = (mutations) => {
    let shouldUpdate = false
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        shouldUpdate = true
        break
      }
    }

    if (shouldUpdate) {
      updateUtagsShortcuts(currentUnreadCount)
    }
  }

  // Observer for Document changes (to detect Host element)
  const onDocumentMutation: MutationCallback = (mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (
          node instanceof HTMLElement &&
          node.dataset.ushortcutsHost === 'utags-shortcuts'
        ) {
          observeShadowRoot(node)
          updateUtagsShortcuts(currentUnreadCount)
        }
      }
    }
  }

  // Function to attach observer to Shadow Root
  function observeShadowRoot(host: HTMLElement): void {
    if (utagsShadowObserver) utagsShadowObserver.disconnect()
    if (!host.shadowRoot) return

    utagsShadowObserver = new MutationObserver(onShadowMutation)
    utagsShadowObserver.observe(host.shadowRoot, {
      childList: true,
      subtree: true,
    })
  }

  // Check if host already exists
  const host = document.querySelector<HTMLElement>(
    '[data-ushortcuts-host="utags-shortcuts"]'
  )
  if (host) {
    observeShadowRoot(host)
  }

  // Start observing document for new host elements
  utagsHostObserver = new MutationObserver(onDocumentMutation)
  utagsHostObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
  })
}

async function fetchUnreadCount(): Promise<number | undefined> {
  try {
    const urls = [
      // +1~3
      // '/t',
      // +1 or +2
      '/t/mentions',
      // +1~3
      // '/t/home',
      // /go/xx + 3 point
      // '/go/status',
      // '/go/guide',
      // '/go/v2ex',
      // '/go/random',
      // '/go/ideas',
      // +2 point
      '/about',
      // +2
      '/pro/about',
      // +1 point
      '/solana',
    ]
    const url = urls[Math.floor(Math.random() * urls.length)]
    const res = await fetch(url)
    const text = await res.text()
    const doc = new DOMParser().parseFromString(text, 'text/html')
    const link = doc.querySelector('#Rightbar a[href="/notifications"]')
    if (link && link.textContent) {
      const match = /(\d+)\s+未读提醒/.exec(link.textContent)
      if (match) {
        return Number.parseInt(match[1], 10)
      }
    }
  } catch (error) {
    console.error('[v2ex.rep] Failed to fetch unread count', error)
  }

  return undefined
}

function updateFavicon(count: number): void {
  const links = document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')
  let link = links[0]

  // Remove other icon links to prevent conflicts
  if (links.length > 1) {
    for (let i = 1; i < links.length; i++) {
      links[i].remove()
    }
  }

  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.append(link)
  }

  if (link.dataset.count === count.toString()) {
    return
  }

  link.type = 'image/png'
  link.dataset.count = count.toString()

  if (originalFavicon === undefined) {
    originalFavicon = '/favicon.ico'
  }

  if (count === 0) {
    link.href = originalFavicon
    // Force update favicon
    document.head.append(link)
    return
  }

  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 32
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.addEventListener('load', () => {
    ctx.clearRect(0, 0, 32, 32)
    ctx.drawImage(img, 0, 0, 32, 32)

    // Draw red circle
    ctx.beginPath()
    ctx.arc(22, 22, 10, 0, 2 * Math.PI)
    ctx.fillStyle = '#ff0000'
    ctx.fill()

    // Draw text
    const text = count > 99 ? '99+' : count.toString()
    ctx.font = count > 99 ? 'bold 12px sans-serif' : 'bold 16px sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 22, 23)

    if (link) {
      link.href = canvas.toDataURL('image/png')
      // Force update favicon
      document.head.append(link)
    }
  })

  img.src = originalFavicon
}

const updateUtagsShortcuts = debounce((count: number): void => {
  const checkUnreadNotificationsUtags = getSettingsValue<boolean>(
    'checkUnreadNotificationsUtags'
  )
  const displayCount = checkUnreadNotificationsUtags ? count : 0

  const host = document.querySelector(
    '[data-ushortcuts-host="utags-shortcuts"]'
  )
  if (!host || !host.shadowRoot) return

  const links = host.shadowRoot.querySelectorAll('a')
  for (const link of links) {
    try {
      updateUtagsShortcutsLink(link, displayCount)
    } catch {}
  }
}, 200)

function updateUtagsShortcutsLink(
  link: HTMLAnchorElement,
  count: number
): void {
  const url = new URL(link.href)
  if (url.origin !== location.origin || url.pathname !== '/notifications')
    return

  const textSpan = link.querySelector<HTMLElement>('.title-text')
  if (!textSpan) return

  if (count > 0) {
    if (!textSpan.dataset.originalText) {
      textSpan.dataset.originalText = textSpan.textContent || '通知'
    }

    const newText = `${textSpan.dataset.originalText} (${count} 条未读)`
    if (textSpan.textContent !== newText) {
      textSpan.textContent = newText
    }

    if (textSpan.style.fontWeight !== 'bold') {
      textSpan.style.fontWeight = 'bold'
    }

    if (textSpan.style.color !== 'red') {
      textSpan.style.color = 'red'
    }
  } else if (textSpan.dataset.originalText) {
    if (textSpan.textContent !== textSpan.dataset.originalText) {
      textSpan.textContent = textSpan.dataset.originalText
    }

    delete textSpan.dataset.originalText
    if (textSpan.style.fontWeight !== '') {
      textSpan.style.fontWeight = ''
    }

    if (textSpan.style.color !== '') {
      textSpan.style.color = ''
    }
  }
}

function updateUI(count: number): void {
  currentUnreadCount = count

  const element = document.querySelector('#Rightbar a[href="/notifications"]')
  if (element) {
    const text = `${count} 未读提醒`
    const parent = element.parentElement
    const isNotificationStyle =
      parent?.tagName === 'STRONG' &&
      parent.parentElement?.querySelector('.orange-dot')

    if (count > 0) {
      if (isNotificationStyle) {
        if (element.textContent !== text) {
          element.textContent = text
        }
      } else {
        // Change to notification structure
        const wrapper = document.createElement('div')
        wrapper.innerHTML = `<div class="orange-dot"></div><strong></strong>`
        const strong = wrapper.querySelector('strong')!

        element.textContent = text
        element.className = ''

        if (parent) {
          element.before(wrapper)
          strong.append(element)
        }
      }
    } else if (isNotificationStyle) {
      // Revert to simple style
      const wrapper = element.parentElement?.parentElement
      if (wrapper) {
        element.textContent = text
        element.className = 'fade'
        wrapper.replaceWith(element)
      }
    } else if (element.textContent !== text) {
      element.textContent = text
      element.className = 'fade'
    }
  }

  if (getSettingsValue('checkUnreadNotificationsFavicon')) {
    updateFavicon(count)
  } else if (originalFavicon) {
    // Restore original favicon if setting is disabled
    updateFavicon(0)
  }

  updateUtagsShortcuts(count)

  const title = document.title
  const prefixRegex = /^\(\d+\) /
  let newTitle = title
  if (getSettingsValue('checkUnreadNotificationsTitle') && count > 0) {
    const newPrefix = `(${count}) `
    newTitle = prefixRegex.test(title)
      ? title.replace(prefixRegex, newPrefix)
      : newPrefix + title
  } else {
    newTitle = title.replace(prefixRegex, '')
  }

  if (newTitle !== title) {
    document.title = newTitle
  }
}

export async function check(force = false): Promise<void> {
  if (!getSettingsValue('checkUnreadNotifications')) return

  const now = Date.now()
  if (!force) {
    const lastCheck = (await getValue<number>(KEY_LAST_CHECK, 0))!
    if (now - lastCheck < CHECK_INTERVAL) return
  }

  const lockTime = (await getValue<number>(KEY_LOCK, 0))!
  if (now - lockTime < LOCK_TIMEOUT) return

  // Try acquire lock
  await setValue(KEY_LOCK, now)
  const currentLock = (await getValue<number>(KEY_LOCK, 0))!
  if (currentLock !== now) return

  try {
    const count = await fetchUnreadCount()
    if (count !== undefined) {
      await setValue(KEY_UNREAD_COUNT, count)
      await setValue(KEY_LAST_CHECK, Date.now())
    }
  } finally {
    await setValue(KEY_LOCK, 0)
  }
}

export function initCheckNotifications(): void {
  if (initialized) return
  initialized = true

  if (location.pathname === '/notifications') {
    void setValue(KEY_UNREAD_COUNT, 0)
  }

  startUtagsObserver()

  // Listen for changes
  void addValueChangeListener(KEY_UNREAD_COUNT, (_key, _old, newValue) => {
    if (typeof newValue === 'number') {
      updateUI(newValue)
    }
  })

  // Initial check of stored value to update UI immediately
  void (async () => {
    const value = await getValue<number>(KEY_UNREAD_COUNT)
    if (typeof value === 'number') {
      updateUI(value)
    }
  })()

  // Loop
  setInterval(() => {
    void check()
  }, 10 * 1000)

  // Run once immediately
  void check()
}

export function runCheckNotifications(): void {
  void check()
  void (async () => {
    const value = await getValue<number>(KEY_UNREAD_COUNT)
    if (typeof value === 'number') {
      updateUI(value)
    }
  })()
}
