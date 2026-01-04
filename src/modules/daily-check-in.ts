import { getValue, setValue } from 'browser-extension-storage'
import { $, sleep } from 'browser-extension-utils'

import { getOnce } from '../utils'
import { updateOnce } from './update-once'

const storageKey = 'dailyCheckIn'
let retryCount = 0

const fetchCheckInApi = async (once: string) => {
  const url = `${location.protocol}//${location.host}/mission/daily/redeem?once=${once}`

  try {
    const response = await fetch(url)

    if (response.status === 200) {
      return await response.text()
    }
  } catch (error) {
    console.error(error)
    retryCount++
    if (retryCount < 3) {
      await sleep(1000)
      return fetchCheckInApi(once) as Promise<string>
    }
  }
}

export const dailyCheckIn = async () => {
  // 未登录
  if ($('a[href*="/signin"]')) {
    return
  }

  const once = getOnce()
  if (!once) {
    return
  }

  const lastCheckInDate = await getValue<number>(storageKey)
  if (lastCheckInDate) {
    const now = Date.now()
    if (
      now - lastCheckInDate < 86_400_000 &&
      new Date(now).getUTCDate() === new Date(lastCheckInDate).getUTCDate()
    ) {
      // 已签到
      return
    }
  }

  const result = (await fetchCheckInApi(once)) as string
  if (result.includes('每日登录奖励已领取')) {
    console.info('[V2EX.REP] 签到成功')
    await setValue(storageKey, Date.now())
    const checkInLink = $(`a[href^="/mission/daily"]`)
    if (checkInLink) {
      const box = checkInLink.closest('.box')
      if (box) {
        box.nextElementSibling?.remove()
        box.remove()
      }
    }
  } else {
    console.error('[V2EX.REP] 签到失败')
  }

  await updateOnce()
}
