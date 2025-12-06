<script setup lang="ts">
import { ref } from 'vue'

// Props
defineProps<{
  open: boolean
}>()

// Emits
const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

// 通用格式弹窗状态
const showFormatModal = ref(false)

// 复制格式示例
const formatExample = `{
  "chatlab": {
    "version": "1.0.0",
    "exportedAt": 1732924800,
    "generator": "Your Tool Name"
  },
  "meta": {
    "name": "群聊名称",
    "platform": "qq",
    "type": "group"
  },
  "members": [
    {
      "platformId": "123456789",
      "accountName": "用户昵称",
      "groupNickname": "群昵称（可选）"
    }
  ],
  "messages": [
    {
      "sender": "123456789",
      "accountName": "发送时昵称",
      "timestamp": 1732924800,
      "type": 0,
      "content": "消息内容"
    }
  ]
}`

function copyFormatExample() {
  navigator.clipboard.writeText(formatExample)
}

function closeModal() {
  emit('update:open', false)
}

function openExternalLink(url: string) {
  window.open(url, '_blank')
}
</script>

<template>
  <!-- 导入教程弹窗 -->
  <UModal :open="open" @update:open="emit('update:open', $event)" :ui="{ content: 'md:w-full max-w-2xl' }">
    <template #content>
      <div class="p-6">
        <!-- Header -->
        <div class="mb-6 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30"
            >
              <UIcon name="i-heroicons-book-open" class="h-5 w-5 text-pink-600 dark:text-pink-400" />
            </div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">聊天记录导入教程</h2>
          </div>
          <UButton icon="i-heroicons-x-mark" variant="ghost" size="sm" @click="closeModal" />
        </div>

        <!-- 教程内容 -->
        <div class="space-y-6">
          <!-- QQ 教程 -->
          <div class="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <div class="mb-3 flex items-center gap-2">
              <UIcon name="i-heroicons-chat-bubble-left-right" class="h-5 w-5 text-pink-500" />
              <h3 class="font-semibold text-gray-900 dark:text-white">QQ</h3>
            </div>
            <ol class="space-y-2">
              <li class="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                <span
                  class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pink-100 text-xs font-medium text-pink-600 dark:bg-pink-900/30 dark:text-pink-400"
                >
                  1
                </span>
                <span>
                  使用
                  <a
                    class="cursor-pointer text-pink-600 underline underline-offset-2 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
                    @click="openExternalLink('https://github.com/shuakami/qq-chat-exporter')"
                  >
                    qq-chat-exporter
                    <UIcon name="i-heroicons-arrow-top-right-on-square" class="inline h-3 w-3" />
                  </a>
                  导出聊天记录（目前仅支持Windows/Linux）
                </span>
              </li>
              <li class="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                <span
                  class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pink-100 text-xs font-medium text-pink-600 dark:bg-pink-900/30 dark:text-pink-400"
                >
                  2
                </span>
                <span>导出完成后会得到 .json 文件</span>
              </li>
              <li class="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                <span
                  class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pink-100 text-xs font-medium text-pink-600 dark:bg-pink-900/30 dark:text-pink-400"
                >
                  3
                </span>
                <span>将 .json 文件拖拽到上方导入区域</span>
              </li>
            </ol>
          </div>

          <!-- 微信教程 -->
          <div class="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <div class="mb-3 flex items-center gap-2">
              <UIcon name="i-heroicons-device-phone-mobile" class="h-5 w-5 text-blue-500" />
              <h3 class="font-semibold text-gray-900 dark:text-white">微信或其他聊天应用</h3>
            </div>
            <ol class="mb-4 space-y-2">
              <li class="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                <span
                  class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                >
                  1
                </span>
                <span>Github上有很多开源的导出工具，请自行找工具导出微信等软件的聊天记录</span>
              </li>
              <li class="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                <span
                  class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                >
                  2
                </span>
                <span>使用脚本，将导出文件转换为 ChatLab 通用格式</span>
              </li>
              <li class="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                <span
                  class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                >
                  3
                </span>
                <span>将转换后的 .json 文件拖拽到上方导入区域</span>
              </li>
            </ol>
            <UButton
              variant="soft"
              size="sm"
              :trailing-icon="'i-heroicons-document-text'"
              @click="showFormatModal = true"
            >
              查看通用格式说明
            </UButton>
          </div>
        </div>

        <!-- 底部提示 -->
        <div class="mt-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            💡 提示：ChatLab 支持多种聊天记录格式，包括 QQ、微信、Discord
            等平台。将导出的文件直接拖拽到导入区域即可开始分析。
          </p>
        </div>
      </div>
    </template>
  </UModal>

  <!-- 通用格式说明弹窗（层级高于教程弹窗） -->
  <UModal v-model:open="showFormatModal" :ui="{ content: 'md:w-full max-w-3xl z-[60]', overlay: 'z-[60]' }">
    <template #content>
      <div class="p-6">
        <!-- Header -->
        <div class="mb-6 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30"
            >
              <UIcon name="i-heroicons-document-text" class="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">ChatLab 通用格式说明</h2>
          </div>
          <UButton icon="i-heroicons-x-mark" variant="ghost" size="sm" @click="showFormatModal = false" />
        </div>

        <!-- 格式说明 -->
        <div class="space-y-4">
          <p class="text-sm text-gray-600 dark:text-gray-300">
            ChatLab 定义了一套聊天记录分析用标准 JSON 格式。只需在 JSON 文件中包含
            <code class="rounded bg-gray-100 px-1.5 py-0.5 text-pink-600 dark:bg-gray-800 dark:text-pink-400">
              chatlab
            </code>
            对象即可被识别。
          </p>

          <!-- JSON 示例 -->
          <div class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <div class="mb-2 flex items-center justify-between">
              <span class="text-xs font-medium text-gray-500 dark:text-gray-400">示例格式</span>
              <UButton variant="ghost" size="xs" icon="i-heroicons-clipboard-document" @click="copyFormatExample">
                复制
              </UButton>
            </div>
            <pre class="overflow-x-auto text-xs leading-relaxed text-gray-700 dark:text-gray-300"><code>{
  "chatlab": {
    "version": "1.0.0",
    "exportedAt": 1732924800,
    "generator": "Your Tool Name"
  },
  "meta": {
    "name": "群聊名称",
    "platform": "qq",  // qq | wechat | telegram | discord 等
    "type": "group"    // group | private （群聊|私聊）
  },
  "members": [
    {
      "platformId": "123456789",
      "accountName": "用户昵称",
      "groupNickname": "群昵称（可选）"
    }
  ],
  "messages": [
    {
      "sender": "123456789",
      "accountName": "发送时昵称",
      "timestamp": 1732924800,  // 秒级时间戳
      "type": 0,  // 0=文本 1=图片 2=语音 3=视频
      "content": "消息内容"
    }
  ]
}</code></pre>
          </div>

          <!-- 字段说明 -->
          <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">消息类型说明</h3>
            <div class="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              <div class="rounded-lg bg-gray-50 p-2 dark:bg-gray-700">
                <span class="font-mono text-pink-600 dark:text-pink-400">0</span>
                <span class="ml-2 text-gray-600 dark:text-gray-300">文本</span>
              </div>
              <div class="rounded-lg bg-gray-50 p-2 dark:bg-gray-700">
                <span class="font-mono text-pink-600 dark:text-pink-400">1</span>
                <span class="ml-2 text-gray-600 dark:text-gray-300">图片</span>
              </div>
              <div class="rounded-lg bg-gray-50 p-2 dark:bg-gray-700">
                <span class="font-mono text-pink-600 dark:text-pink-400">2</span>
                <span class="ml-2 text-gray-600 dark:text-gray-300">语音</span>
              </div>
              <div class="rounded-lg bg-gray-50 p-2 dark:bg-gray-700">
                <span class="font-mono text-pink-600 dark:text-pink-400">3</span>
                <span class="ml-2 text-gray-600 dark:text-gray-300">视频</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部提示 -->
        <div class="mt-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
          <p class="text-sm text-blue-600 dark:text-blue-400">
            💡 文件名只需以
            <code class="rounded bg-blue-100 px-1 dark:bg-blue-800">.json</code>
            结尾，JSON 中包含
            <code class="rounded bg-blue-100 px-1 dark:bg-blue-800">chatlab</code>
            对象即可被识别。
          </p>
        </div>
      </div>
    </template>
  </UModal>
</template>
