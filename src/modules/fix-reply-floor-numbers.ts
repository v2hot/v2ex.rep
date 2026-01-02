import {
  $,
  $$,
  cache,
  isVisible,
  parseInt10,
  sleep,
  win as window,
} from "browser-extension-utils"

import {
  getFloorNumberElement,
  getRepliesCount,
  getReplyId,
  parseUrl,
} from "../utils"

let retryCount = 0
const getTopicReplies = async (topicId: string, replyCount?: number) => {
  const cached = cache.get(["getTopicReplies", topicId, replyCount]) as
    | Record<string, unknown>
    | undefined
  if (cached) {
    return cached
  }

  const url = `${location.protocol}//${
    location.host
  }/api/replies/show.json?topic_id=${topicId}${
    replyCount ? "&replyCount=" + String(replyCount) : ""
  }`

  try {
    const response = await fetch(url)

    if (response.status === 200) {
      const result = (await response.json()) as Record<string, unknown>
      cache.add(["getTopicReplies", topicId, replyCount], result)
      return result
    }
  } catch (error) {
    console.error(error)
    retryCount++
    if (retryCount < 3) {
      await sleep(1000)
      return getTopicReplies(topicId, replyCount) as Promise<
        Record<string, unknown>
      >
    }
  }
}

const updateFloorNumber = (
  replyElement: HTMLElement,
  newFloorNumber: number
) => {
  const numberElement = getFloorNumberElement(replyElement)
  if (numberElement) {
    if (!numberElement.dataset.orgNumber) {
      const orgNumber = parseInt10(
        numberElement.textContent as string | undefined
      )
      if (orgNumber) {
        numberElement.dataset.orgNumber = String(orgNumber)
      }
    }

    numberElement.textContent = String(newFloorNumber)
    replyElement.dataset.floorNumber = String(newFloorNumber)
  }
}

const updateAllFloorNumberById = (id: string, newFloorNumber: number) => {
  // 替换所有其他回复 ID 相同的回复，包括热门回复、关联回复、引用回复等
  for (const replyElement of $$(
    `#r_${id},
     #top_r_${id},
     #related_r_${id},
     #cited_r_${id}`
  )) {
    updateFloorNumber(replyElement, newFloorNumber)
  }
}

const printHiddenReplies = (hiddenReplies: Array<Record<string, any>>) => {
  for (const reply of hiddenReplies) {
    console.group(
      `[V2EX.REP] 屏蔽或隐藏的回复: #${reply.floorNumber as string}, 用户 ID: ${
        reply.userId as string
      }, 回复 ID: ${reply.replyId as string}, 回复内容: `
    )
    console.info(reply.replyContent)
    console.groupEnd()
  }
}

const updateReplyElements = (
  replies: Array<Record<string, unknown>>,
  replyElements: HTMLElement[],
  page = 1
) => {
  let floorNumberOffset = 0
  let hiddenCount = 0
  let hiddenCount2 = 0
  const dataOffSet = (page - 1) * 100
  const length = Math.min(replies.length - (page - 1) * 100, 100)
  const hiddenReplies: Array<Record<string, any>> = []

  for (let i = 0; i < length; i++) {
    const realFloorNumber = i + dataOffSet + 1
    const reply = replies[i + dataOffSet]
    const id = reply.id as string
    const element = $("#r_" + id)
    const member = (reply.member as Record<string, any>) || {}
    if (!element) {
      hiddenReplies.push({
        floorNumber: realFloorNumber,
        userId: member.username as string,
        replyId: reply.id,
        replyContent: reply.content,
      })
      hiddenCount++
      continue
    }

    if (!isVisible(element)) {
      hiddenReplies.push({
        floorNumber: realFloorNumber,
        userId: member.username as string,
        replyId: reply.id,
        replyContent: reply.content,
      })
      hiddenCount2++
    }

    element.found = true

    if (hiddenCount > 0) {
      const numberElement = getFloorNumberElement(element)
      if (numberElement) {
        const orgNumber = parseInt10(
          (numberElement.dataset.orgNumber || numberElement.textContent) as
            | string
            | undefined
        )
        if (orgNumber) {
          numberElement.dataset.orgNumber = String(orgNumber)
          floorNumberOffset = realFloorNumber - orgNumber
        }

        numberElement.textContent = String(realFloorNumber)
      }

      updateAllFloorNumberById(id, realFloorNumber)
    }
  }

  console.info(
    `[V2EX.REP] page: ${page}, floorNumberOffset: ${floorNumberOffset}, hiddenCount: ${
      hiddenCount + hiddenCount2
    }`
  )

  if (floorNumberOffset > 0) {
    // 如果 API 返回的数据不是最新，实际页面的回复数会比 API 里的多。更新多的部分
    for (const element of replyElements) {
      if (element.found) {
        continue
      }

      const id = getReplyId(element)
      const numberElement = getFloorNumberElement(element)
      if (numberElement) {
        const orgNumber = parseInt10(
          (numberElement.dataset.orgNumber || numberElement.textContent) as
            | string
            | undefined
        )
        if (orgNumber) {
          numberElement.dataset.orgNumber = String(orgNumber)
          numberElement.textContent = String(orgNumber + floorNumberOffset)

          updateAllFloorNumberById(id, orgNumber + floorNumberOffset)
        }
      }
    }
  }

  printHiddenReplies(hiddenReplies)
  // 触发更新事件
  window.dispatchEvent(new Event("floorNumberUpdated"))
}

let isRunning = false

const splitArrayPerPages = (replyElements: HTMLElement[]) => {
  if (
    !replyElements ||
    replyElements.length === 0 ||
    !replyElements[0].dataset.page
  ) {
    return
  }

  const replyElementsPerPages = [] as HTMLElement[][]
  let lastPage: string | undefined
  let replyElementsPerPage = [] as HTMLElement[]
  for (const reply of replyElements) {
    if (reply.dataset.page !== lastPage) {
      lastPage = reply.dataset.page
      const page = parseInt10(reply.dataset.page)
      replyElementsPerPage = replyElementsPerPages[page - 1] || []
      replyElementsPerPages[page - 1] = replyElementsPerPage
    }

    replyElementsPerPage.push(reply)
  }

  return replyElementsPerPages
}

const startFix = async (
  topicId: string,
  page: number,
  displayNumber: number,
  replyElements: HTMLElement[],
  forceUpdate = false
  // eslint-disable-next-line max-params
) => {
  if (isRunning) {
    return
  }

  isRunning = true

  const replies = (await getTopicReplies(
    topicId,
    forceUpdate ? displayNumber : undefined
  )) as Array<Record<string, unknown>> | undefined

  if (replies) {
    const replyElementsPerPages = splitArrayPerPages(replyElements)
    if (replyElementsPerPages) {
      // eslint-disable-next-line unicorn/no-for-loop
      for (let i = 0; i < replyElementsPerPages.length; i++) {
        const replyElementsPerPage = replyElementsPerPages[i]

        if (
          !replyElementsPerPage ||
          (replyElementsPerPage.length > 0 &&
            (displayNumber === replyElementsPerPage.length ||
              displayNumber % 100 === replyElementsPerPage.length % 100 ||
              replyElementsPerPage.length % 100 === 0))
        ) {
          continue
        }

        updateReplyElements(replies, replyElementsPerPage, i + 1)
      }
    } else {
      updateReplyElements(replies, replyElements, page)
    }

    if (replies.length < displayNumber) {
      console.info("[V2EX.REP] API data outdated, re-fetch it")
      setTimeout(async () => {
        await startFix(topicId, page, displayNumber, replyElements, true)
      }, 100)
    }
  }

  isRunning = false
}

export const fixReplyFloorNumbers = async (replyElements: HTMLElement[]) => {
  if (isRunning) {
    return
  }

  const result = parseUrl()
  const topicId = result.topicId
  const page = result.page

  if (!topicId) {
    return
  }

  const displayNumber = getRepliesCount()

  if (
    replyElements.length > 0 &&
    (displayNumber === replyElements.length /* 只有一页时 */ ||
      displayNumber % 100 === replyElements.length % 100 /* 多页的最后一页 */ ||
      replyElements.length % 100 === 0) /* 多页的非最后一页 */
  ) {
    return
  }

  await startFix(topicId, page, displayNumber, replyElements)
}
