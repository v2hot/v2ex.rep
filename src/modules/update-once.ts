import { $, $$, getAttribute, setAttribute } from "browser-extension-utils"

const fetchOnce = async () => {
  const url = `${location.protocol}//${location.host}/poll_once`
  const response = await fetch(url)

  try {
    if (response.status === 200) {
      return await response.text()
    }
  } catch (error) {
    console.error("[V2EX.REP] Unable to refresh once", error)
  }
}

export const updateOnce = async () => {
  const once = await fetchOnce()
  if (once) {
    globalThis.once = once
    if ($("#once")) {
      $("#once").value = once
    }

    const links = $$(`a[href*="once="]`)
    for (const link of links) {
      const href = getAttribute(link, "href")
      setAttribute(link, "href", href.replace(/once=\d+/, `once=${once}`))
    }
  }
}
