import {
  $,
  addEventListener,
  doc,
  setAttributes,
} from 'browser-extension-utils'

function setFavition(url: string, type?: string) {
  const element = $('link[rel="shortcut icon"]')
  if (element) {
    setAttributes(element, {
      href: url,
      type: type || 'image/png',
    })
  }
}

function replaceToGithub() {
  setFavition(
    'https://github.githubassets.com/favicons/favicon.svg',
    'image/svg+xml'
  )

  if (doc.title.includes('V2EX')) {
    doc.title =
      'Issues · ' +
      (doc.title.replace(/( - V2EX|V2EX › |V2EX)/, '') || 'github')
  }
}

function replaceToAvatar() {
  const main = $('#Main') || $('.content')
  if (!main) {
    return
  }

  const avatar = $(
    '.header img.avatar, td[width="73"] img.avatar',
    main
  ) as HTMLImageElement
  if (avatar) {
    setFavition(avatar.src)
    if (!avatar.setFaviconHandler) {
      avatar.setFaviconHandler = true
      addEventListener(avatar, 'load', () => {
        setFavition(avatar.src)
      })
    }
  } else {
    setFavition('https://www.v2ex.com/static/favicon.ico')
  }
}

function replaceToDefault() {
  const main = $('#Main') || $('.content')
  if (!main) {
    return
  }

  const avatar = $('td[width="73"] img.avatar', main) as HTMLImageElement
  if (avatar) {
    setFavition(avatar.src)
  } else {
    setFavition('https://www.v2ex.com/static/favicon.ico')
  }
}

export function replaceFavicon(type?: string) {
  if (type === 'github') {
    replaceToGithub()
  } else if (type === 'avatar') {
    replaceToAvatar()
  } else {
    replaceToDefault()
  }
}
