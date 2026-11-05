/**
 * Refer to https://github.com/coolpace/V2EX_Polish and https://github.com/sciooga/v2ex-plus
 */
// 注册应用获取 Client ID：https://api.imgur.com/oauth2/addclient

import {
  $,
  addEventListener,
  createElement,
  doc,
  hasClass,
  removeClass,
  runOnce,
  setAttribute,
  win as window,
} from 'browser-extension-utils'

import {
  getReplyInputElement,
  insertTextToReplyInput,
  replaceReplyInputText,
} from '../utils'

// 查看已注册的应用：https://imgur.com/account/settings/apps
const imgurClientIdPool = [
  // 以下 Client ID 来自「V2EX Polish」
  '3107b9ef8b316f3',

  // 以下 Client ID 来自「V2EX Plus」
  '442b04f26eefc8a',
  '59cfebe717c09e4',
  '60605aad4a62882',
  '6c65ab1d3f5452a',
  '83e123737849aa9',
  '9311f6be1c10160',
  'c4a4a563f698595',
  '81be04b9e4a08ce',
] as const satisfies readonly string[]

type ImgurResponse = {
  status: number
  success: boolean
  data: {
    /** 上传成功后生成的图片资源 hash */
    id: string
    /** 上传成功后生成的在线链接 */
    link: string
  }
}

type UploadingImageDetail = {
  file: File
  placeholder?: string
  imgLink?: string
}

async function uploadImageToImgur(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('image', file)

  // 随机获取一个 Imgur Client ID。
  // Shuffle Client-ID list to ensure a different ID on each retry
  const clientIds = [...imgurClientIdPool]
  for (let i = clientIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[clientIds[i], clientIds[j]] = [clientIds[j], clientIds[i]]
  }

  let lastError: Error | undefined

  for (const clientId of clientIds) {
    try {
      // 使用详情参考 Imgur API 文档：https://apidocs.imgur.com/
      // eslint-disable-next-line no-await-in-loop
      const response = await fetch('https://api.imgur.com/3/upload', {
        method: 'POST',
        headers: { Authorization: `Client-ID ${clientId}` },
        body: formData,
      })

      if (response.ok) {
        const responseData: ImgurResponse =
          // eslint-disable-next-line no-await-in-loop
          (await response.json()) as ImgurResponse

        if (responseData.success) {
          return responseData.data.link
        }
      }

      lastError = new Error('上传失败')
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
    }
  }

  throw lastError || new Error('上传失败')
}

const handleUploadImage = (file: File) => {
  const detail: UploadingImageDetail = { file }
  window.dispatchEvent(new CustomEvent('uploadImageStart', { detail }))
  uploadImageToImgur(file)
    // eslint-disable-next-line promise/prefer-await-to-then
    .then((imgLink) => {
      detail.imgLink = imgLink
      window.dispatchEvent(new CustomEvent('uploadImageSuccess', { detail }))
    })
    // eslint-disable-next-line promise/prefer-await-to-then
    .catch(() => {
      window.dispatchEvent(new CustomEvent('uploadImageFailed', { detail }))
    })
}

const handleClickUploadImage = () => {
  const imgInput = document.createElement('input')

  // 不能用 display: none，部分浏览器对 display: none 的 file input 调用 click() 不会弹出文件选择窗口。
  // 参考 Dropzone 的隐藏方式
  imgInput.style.visibility = 'hidden'
  imgInput.style.position = 'absolute'
  imgInput.style.top = '0'
  imgInput.style.left = '0'
  imgInput.style.width = '0'
  imgInput.style.height = '0'
  imgInput.type = 'file'
  imgInput.accept = 'image/*'
  imgInput.multiple = true

  addEventListener(imgInput, 'change', () => {
    const selectedFiles = imgInput.files

    if (selectedFiles) {
      for (const file of selectedFiles) {
        handleUploadImage(file)
      }
    }

    imgInput.remove()
  })

  // 必须先插入到文档中再触发 click()，否则部分浏览器（Firefox/Safari 等）不会弹出文件选择窗口
  doc.body.append(imgInput)
  imgInput.click()
}

const init = () => {
  const replyTextArea = getReplyInputElement()
  if (!replyTextArea) {
    return
  }

  const appendPosition = $('#reply-box > div > div')
  if (!appendPosition) {
    return
  }

  // 已存在上传图片按钮，无需重复添加。 uiu-insert-btn 是“通用图片上传助手”插件的按钮
  if ($('.vr_upload_image') || $('.uiu-insert-btn')) {
    return
  }

  setAttribute(
    replyTextArea,
    'placeholder',
    '您可以在回复框内直接粘贴图片或拖拽图片文件至回复框内上传'
  )

  const uploadTip = ' + 插入图片'
  const placeholder = '[上传图片中...]'

  const uploadButton = createElement('a', {
    class: 'vr_upload_image',
    textContent: uploadTip,
    style: 'padding-left: 10px;',
  })
  appendPosition.append(uploadButton)

  addEventListener(uploadButton, 'click', () => {
    if (!hasClass(uploadButton, 'vr_button_disabled')) {
      handleClickUploadImage()
    }
  })

  // 粘贴图片并上传的功能。
  addEventListener(
    doc,
    'paste',
    (event) => {
      if (!(event instanceof ClipboardEvent)) {
        return
      }

      const replyTextArea = getReplyInputElement()
      if (!replyTextArea?.matches(':focus')) {
        return
      }

      const items = event.clipboardData?.items

      if (!items) {
        return
      }

      // 查找属于图像类型的数据项。
      const imageItems = Array.from(items).filter((item) =>
        item.type.includes('image')
      )

      if (imageItems.length > 0) {
        event.preventDefault()
        event.stopPropagation()
        for (const item of imageItems) {
          const file = item.getAsFile()
          if (file) {
            handleUploadImage(file)
          }
        }
      }
    },
    true
  )

  // 拖拽图片上传文件
  addEventListener(
    replyTextArea,
    'drop',
    (event) => {
      if (!(event instanceof DragEvent)) {
        return
      }

      const files = event.dataTransfer?.files
      if (files?.length) {
        for (const file of files) {
          if (file.type.includes('image')) {
            event.preventDefault()
            event.stopImmediatePropagation()
            handleUploadImage(file)
          }
        }
      }
    },
    true
  )

  addEventListener(window, {
    uploadImageStart(event: CustomEvent) {
      if (!event.detail) {
        return
      }

      // addClass(uploadButton, "vr_button_disabled")
      // uploadButton.textContent = "正在上传图片..."
      const detail: UploadingImageDetail = event.detail as UploadingImageDetail
      const fileName = detail.file.name || 'noname'
      detail.placeholder = placeholder.replace(/]/, ` (${fileName})]`)

      const replyTextArea = getReplyInputElement()
      if (replyTextArea) {
        insertTextToReplyInput(
          replyTextArea.value.trim().length > 0 &&
            replyTextArea.selectionStart > 0
            ? `\n${detail.placeholder}\n`
            : `${detail.placeholder}\n`
        )
      }
    },
    uploadImageSuccess(event: CustomEvent) {
      if (!event.detail) {
        return
      }

      const detail: UploadingImageDetail = event.detail as UploadingImageDetail
      removeClass(uploadButton, 'vr_button_disabled')
      uploadButton.textContent = uploadTip
      replaceReplyInputText(
        detail.placeholder || placeholder,
        detail.imgLink! || '',
        true
      )
    },
    uploadImageFailed(event: CustomEvent) {
      if (!event.detail) {
        return
      }

      const detail: UploadingImageDetail = event.detail as UploadingImageDetail
      removeClass(uploadButton, 'vr_button_disabled')
      uploadButton.textContent = uploadTip
      replaceReplyInputText(detail.placeholder || placeholder, '')

      // eslint-disable-next-line no-alert
      alert('[V2EX.REP] ❌ 上传图片失败，请打开控制台查看原因')
    },
  })
}

export const uploadImage = () => {
  const replyTextArea = getReplyInputElement()
  if (!replyTextArea) {
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  runOnce('uploadImage:init', init)
}
