import { $, addClass, hasClass, removeClass } from 'browser-extension-utils'

export const stickyTopicButtons = (toggle = false) => {
  const main = $('#Main') || $('.content')
  if (!main) {
    return
  }

  // Mobile version
  if (hasClass(main, 'content')) {
    const buttons = $('.inner', main)
    if (buttons) {
      addClass(buttons, 'topic_buttons_mobile')
    }
  }

  const added = hasClass(main, 'sticky_topic_buttons')
  if (toggle && !added) {
    addClass(main, 'sticky_topic_buttons')
  } else if (!toggle && added) {
    removeClass(main, 'sticky_topic_buttons')
  }
}
