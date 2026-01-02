import {
  $,
  $$,
  addClass,
  createElement,
  hasClass,
  parseInt10,
  removeClass,
} from "browser-extension-utils"

import {
  cloneReplyElement,
  sortReplyElementsByFloorNumberCompareFn,
} from "../utils"

let done = false

const reset = () => {
  const element = $("#top_replies")
  if (element) {
    const sep20 = element.previousElementSibling
    if (hasClass(sep20, "sep20")) {
      sep20.remove()
    }

    element.remove()
  }
}

export const showTopReplies = (
  replyElements: HTMLElement[],
  toggle: boolean,
  forceUpdate = false
) => {
  if (!toggle) {
    reset()
    removeClass($("#Wrapper"), "sticky_rightbar")
    done = false
    return
  }

  if (done && !forceUpdate) {
    return
  }

  done = true

  reset()

  addClass($("#Wrapper"), "sticky_rightbar")

  const topReplies = replyElements
    .filter((reply) => {
      /* v2ex polish: .v2p-icon-heart */
      const heartElement = $('img[alt="❤️"],.v2p-icon-heart', reply)
      if (heartElement) {
        /* handle cited replies, v2ex polish child replies */
        const childReplies = $$(".reply_content,.cell", reply)
        for (const child of childReplies) {
          if (child.contains(heartElement)) {
            return false
          }
        }

        const thanked = parseInt10(
          heartElement.nextSibling?.textContent as string | undefined,
          0
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

  if (topReplies.length > 0) {
    const box = createElement("div", {
      class: "box",
      id: "top_replies",

      innerHTML: `<div class="cell"><div class="fr"></div><span class="fade">当前页热门回复</span></div>`,
    })

    for (const element of topReplies) {
      const cloned = cloneReplyElement(element, true)
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
