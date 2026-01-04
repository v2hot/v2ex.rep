import {
  $,
  $$,
  addEventListener,
  doc,
  hasClass,
  runOnce,
  win as window,
} from 'browser-extension-utils'

let state = 0
const scrollIntoView = (element: HTMLElement | undefined) => {
  if (element) {
    element.scrollIntoView({ block: 'start' })
  }
}

export const quickNavigation = () => {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  runOnce('quickNavigation', () => {
    const main = $('#Main') || $('.content')
    if (!main) {
      return
    }

    const isMobile = hasClass(main, 'content')

    addEventListener(doc, 'dblclick', (event) => {
      const target = event.target as HTMLElement
      if (
        target &&
        ['TEXTAREA', 'INPUT', 'IMG', 'A'].includes(target.tagName)
      ) {
        return
      }

      const selection = window.getSelection()
      if (
        target?.closest('.box,.cell,.inner') &&
        selection &&
        !selection.isCollapsed &&
        selection.toString().trim().length > 0
      ) {
        return
      }

      const boxes = $$('.box', main)
      switch (state++) {
        case 0: {
          scrollIntoView(isMobile ? boxes[2] : boxes[1])
          break
        }

        case 1: {
          scrollIntoView(isMobile ? boxes[3] : boxes[2])
          break
        }

        default: {
          scrollIntoView(boxes[0])
          state = 0
          break
        }
      }
    })
  })
}
