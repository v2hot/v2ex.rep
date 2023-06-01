import {
  $,
  $$,
  addClass,
  createElement,
  hasClass,
  removeClass,
} from "browser-extension-utils"

import {
  cloneReplyElement,
  getReplyElements,
  sortReplyElementsByFloorNumberCompareFn,
} from "../utils"

export const showTopReplies = (toggle) => {
  const element = $("#top_replies")
  if (element) {
    const sep20 = element.previousElementSibling
    if (hasClass(sep20, "sep20")) {
      sep20.remove()
    }

    element.remove()
  }

  if (!toggle) {
    removeClass($("#Wrapper"), "sticky_rightbar")
    return
  }

  addClass($("#Wrapper"), "sticky_rightbar")

  const replyElements = getReplyElements()
    .filter((reply) => {
      /* v2ex polish: .v2p-icon-heart */
      const heartElement = $('img[alt="❤️"],.v2p-icon-heart', reply)
      if (heartElement) {
        /* handle v2ex polish nested replies */
        const childReplies = $$('.cell[id^="r_"]', reply)
        for (const child of childReplies) {
          if (child.contains(heartElement)) {
            return false
          }
        }

        const thanked = Number.parseInt(
          heartElement.nextSibling?.textContent || "0",
          10
        )
        if (thanked > 0) {
          reply.thanked = thanked
          return true
        }
      }

      return false
    })
    .sort((a, b) =>
      b.thanked === a.thanked
        ? sortReplyElementsByFloorNumberCompareFn(a, b)
        : b.thanked - a.thanked
    )
  // .slice(0, 10)

  if (replyElements.length > 0) {
    const box = createElement("div", {
      class: "box",
      id: "top_replies",
      // eslint-disable-next-line @typescript-eslint/naming-convention
      innerHTML: `<div class="cell"><div class="fr"></div><span class="fade">当前页热门回复</span></div>`,
    })

    for (const element of replyElements) {
      const cloned = cloneReplyElement(element)
      cloned.id = "top_" + element.id

      const ago = $(".ago", cloned)
      if (ago) {
        ago.before(createElement("br"))
      }

      box.append(cloned)
    }

    const appendPosition = $("#Rightbar .box")
    const sep20 = createElement("div", {
      class: "sep20",
    })
    if (appendPosition) {
      appendPosition.after(box)
      appendPosition.after(sep20)
    }
  }
}
