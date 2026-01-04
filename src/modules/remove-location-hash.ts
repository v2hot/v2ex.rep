import { getRepliesCount } from '../utils'

const replaceState = (newHref: string) => {
  history.replaceState(null, '', newHref)
}

const getVisitedUrl = (href: string, replyCount: number) =>
  href.replace(/[?#].*|$/, `#reply${replyCount}`)

const markAsVisited = (href: string, replyCount: number) => {
  // 当刷新页面后，如果有新回复，把新的 url 添加到历史记录，使列表页中当前主题显示为 visited
  // 新标签页打开主题页时，列表页可能很久没刷新，所以添加最近 10 个到历史记录
  for (let count = Math.max(replyCount - 10, 1); count <= replyCount; count++) {
    replaceState(getVisitedUrl(href, count))
  }
}

export const removeLocationHash = () => {
  const href = location.href
  const hash = location.hash
  const replyCount = getRepliesCount()
  if (hash?.startsWith('#reply')) {
    if (replyCount) {
      markAsVisited(href, replyCount)
    }

    replaceState(href.replace(/#.*/, ''))
  } else if (replyCount) {
    markAsVisited(href, replyCount)
    replaceState(href)
  }
}
