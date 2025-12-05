<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useChatStore } from '@/stores/chat'
import { storeToRefs } from 'pinia'
import ConversationList from './ConversationList.vue'
import DataSourcePanel from './DataSourcePanel.vue'
import ChatMessage from './ChatMessage.vue'
import ChatInput from './ChatInput.vue'
import { useAIChat } from '@/composables/useAIChat'

// Props
const props = defineProps<{
  sessionId: string
  sessionName: string
  timeFilter?: { startTs: number; endTs: number }
  chatType?: 'group' | 'private'
}>()

// 使用 AI 对话 Composable
const {
  messages,
  sourceMessages,
  currentKeywords,
  isLoadingSource,
  isAIThinking,
  currentConversationId,
  currentToolStatus,
  toolsUsedInCurrentRound,
  sendMessage,
  loadConversation,
  startNewConversation,
  loadMoreSourceMessages,
  updateMaxMessages,
  stopGeneration,
} = useAIChat(props.sessionId, props.timeFilter, props.chatType ?? 'group')

// Store
const chatStore = useChatStore()
const { groupPresets, privatePresets, aiPromptSettings } = storeToRefs(chatStore)

// 当前聊天类型
const currentChatType = computed(() => props.chatType ?? 'group')

// 当前类型对应的预设列表
const currentPresets = computed(() => (currentChatType.value === 'group' ? groupPresets.value : privatePresets.value))

// 当前激活的预设 ID
const currentActivePresetId = computed(() =>
  currentChatType.value === 'group'
    ? aiPromptSettings.value.activeGroupPresetId
    : aiPromptSettings.value.activePrivatePresetId
)

// 当前激活的预设
const currentActivePreset = computed(
  () => currentPresets.value.find((p) => p.id === currentActivePresetId.value) || currentPresets.value[0]
)

// 预设下拉菜单状态
const isPresetPopoverOpen = ref(false)

// 设置激活预设
function setActivePreset(presetId: string) {
  if (currentChatType.value === 'group') {
    chatStore.setActiveGroupPreset(presetId)
  } else {
    chatStore.setActivePrivatePreset(presetId)
  }
  // 关闭下拉菜单
  isPresetPopoverOpen.value = false
}

// UI 状态
const isSourcePanelCollapsed = ref(false)
const hasLLMConfig = ref(false)
const isCheckingConfig = ref(true)
const messagesContainer = ref<HTMLElement | null>(null)
const conversationListRef = ref<InstanceType<typeof ConversationList> | null>(null)

// 检查 LLM 配置
async function checkLLMConfig() {
  isCheckingConfig.value = true
  try {
    hasLLMConfig.value = await window.llmApi.hasConfig()
  } catch (error) {
    console.error('检查 LLM 配置失败：', error)
    hasLLMConfig.value = false
  } finally {
    isCheckingConfig.value = false
  }
}

// 刷新配置状态（供外部调用）
async function refreshConfig() {
  await checkLLMConfig()
  if (hasLLMConfig.value) {
    await updateMaxMessages()
  }
  // 更新欢迎消息
  const welcomeMsg = messages.value.find((m) => m.id.startsWith('welcome'))
  if (welcomeMsg) {
    welcomeMsg.content = generateWelcomeMessage()
  }
}

// 暴露方法供父组件调用
defineExpose({
  refreshConfig,
})

// 生成欢迎消息
function generateWelcomeMessage() {
  const configHint = hasLLMConfig.value
    ? '✅ AI 服务已配置，可以开始对话了！'
    : '**注意**：使用前请先在侧边栏底部的「设置」中配置 AI 服务 ⚙️'

  return `👋 你好！我是 AI 助手，可以帮你探索「${props.sessionName}」的聊天记录。

你可以这样问我：
- 大家最近聊了什么有趣的话题
- 谁是群里最活跃的人
- 帮我找一下群里讨论买房的记录

${configHint}`
}

// 发送消息
async function handleSend(content: string) {
  await sendMessage(content)
  // 滚动到底部
  scrollToBottom()
  // 刷新对话列表
  conversationListRef.value?.refresh()
}

// 滚动到底部
function scrollToBottom() {
  setTimeout(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  }, 100)
}

// 切换数据源面板
function toggleSourcePanel() {
  isSourcePanelCollapsed.value = !isSourcePanelCollapsed.value
}

// 加载更多数据源
async function handleLoadMore() {
  await loadMoreSourceMessages()
}

// 选择对话
async function handleSelectConversation(convId: string) {
  await loadConversation(convId)
  scrollToBottom()
}

// 创建新对话
function handleCreateConversation() {
  startNewConversation(generateWelcomeMessage())
}

// 删除对话
function handleDeleteConversation(convId: string) {
  // 如果删除的是当前对话，创建新对话
  if (currentConversationId.value === convId) {
    startNewConversation(generateWelcomeMessage())
  }
}

// 格式化时间戳
function formatTimestamp(ts: number): string {
  const date = new Date(ts * 1000)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

// 初始化
onMounted(async () => {
  await checkLLMConfig()
  await updateMaxMessages()

  // 初始化欢迎消息
  startNewConversation(generateWelcomeMessage())
})

// 组件卸载时停止生成
onBeforeUnmount(() => {
  stopGeneration()
})

// 处理停止按钮
function handleStop() {
  stopGeneration()
}

// 监听消息变化，自动滚动
watch(
  () => messages.value.length,
  () => {
    scrollToBottom()
  }
)

// 监听 AI 响应流式更新
watch(
  () => messages.value[messages.value.length - 1]?.content,
  () => {
    scrollToBottom()
  }
)

// 监听全局 AI 配置变化（从设置弹窗保存时触发）
watch(
  () => (chatStore as unknown as { aiConfigVersion: number }).aiConfigVersion,
  async () => {
    await refreshConfig()
  }
)
</script>

<template>
  <div class="flex h-full overflow-hidden">
    <!-- 左侧：对话记录列表 -->
    <div class="w-64 shrink-0 border-r border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/50">
      <ConversationList
        ref="conversationListRef"
        :session-id="sessionId"
        :active-id="currentConversationId"
        @select="handleSelectConversation"
        @create="handleCreateConversation"
        @delete="handleDeleteConversation"
        class="h-full"
      />
    </div>

    <!-- 中间：对话区域 -->
    <div class="flex h-full flex-1">
      <div class="flex min-w-[480px] flex-1 flex-col overflow-hidden">
        <!-- 消息列表 -->
        <div ref="messagesContainer" class="min-h-0 flex-1 overflow-y-auto p-4">
          <div class="mx-auto max-w-3xl space-y-4">
            <template v-for="msg in messages" :key="msg.id">
              <!-- 聊天消息（支持 contentBlocks 混合渲染） -->
              <ChatMessage
                v-if="msg.role === 'user' || msg.content || (msg.contentBlocks && msg.contentBlocks.length > 0)"
                :role="msg.role"
                :content="msg.content"
                :timestamp="msg.timestamp"
                :is-streaming="msg.isStreaming"
                :content-blocks="msg.contentBlocks"
              />
            </template>

            <!-- AI 思考中指示器 -->
            <div v-if="isAIThinking && !messages[messages.length - 1]?.content" class="flex items-start gap-3">
              <div
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-pink-500 to-pink-600"
              >
                <UIcon name="i-heroicons-sparkles" class="h-4 w-4 text-white" />
              </div>
              <div class="rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3 dark:bg-gray-800">
                <!-- 工具执行状态 -->
                <div v-if="currentToolStatus" class="space-y-2">
                  <div class="flex items-center gap-2">
                    <span
                      class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                      :class="[
                        currentToolStatus.status === 'running'
                          ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300'
                          : currentToolStatus.status === 'done'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
                      ]"
                    >
                      <UIcon
                        :name="
                          currentToolStatus.status === 'running'
                            ? 'i-heroicons-cog-6-tooth'
                            : currentToolStatus.status === 'done'
                              ? 'i-heroicons-check-circle'
                              : 'i-heroicons-x-circle'
                        "
                        class="h-3 w-3"
                        :class="{ 'animate-spin': currentToolStatus.status === 'running' }"
                      />
                      {{ currentToolStatus.displayName }}
                    </span>
                    <span v-if="currentToolStatus.status === 'running'" class="flex gap-1">
                      <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-pink-500 [animation-delay:0ms]" />
                      <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-pink-500 [animation-delay:150ms]" />
                      <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-pink-500 [animation-delay:300ms]" />
                    </span>
                    <span
                      v-else-if="currentToolStatus.status === 'done'"
                      class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"
                    >
                      <span>处理结果中</span>
                      <span class="flex gap-1">
                        <span class="h-1 w-1 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
                        <span class="h-1 w-1 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                        <span class="h-1 w-1 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
                      </span>
                    </span>
                  </div>
                  <!-- 已使用的工具列表 -->
                  <div v-if="toolsUsedInCurrentRound.length > 1" class="flex flex-wrap gap-1">
                    <span class="text-xs text-gray-400">已调用:</span>
                    <span
                      v-for="tool in toolsUsedInCurrentRound.slice(0, -1)"
                      :key="tool"
                      class="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                    >
                      <UIcon name="i-heroicons-check" class="h-3 w-3 text-green-500" />
                      {{ tool }}
                    </span>
                  </div>
                </div>
                <!-- 默认状态 -->
                <div v-else class="flex items-center gap-2">
                  <span class="text-sm text-gray-600 dark:text-gray-400">正在分析问题...</span>
                  <span class="flex gap-1">
                    <span class="h-2 w-2 animate-bounce rounded-full bg-pink-500 [animation-delay:0ms]" />
                    <span class="h-2 w-2 animate-bounce rounded-full bg-pink-500 [animation-delay:150ms]" />
                    <span class="h-2 w-2 animate-bounce rounded-full bg-pink-500 [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入框区域 -->
        <div class="p-4 pt-0">
          <div class="mx-auto max-w-3xl">
            <ChatInput
              :disabled="isAIThinking"
              :status="isAIThinking ? 'streaming' : 'ready'"
              @send="handleSend"
              @stop="handleStop"
            />

            <!-- 底部状态栏 -->
            <div class="mt-2 flex items-center justify-between px-1">
              <!-- 左侧：预设选择器 -->
              <UPopover v-model:open="isPresetPopoverOpen" :ui="{ content: 'p-0' }">
                <button
                  class="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                >
                  <UIcon name="i-heroicons-chat-bubble-bottom-center-text" class="h-3.5 w-3.5" />
                  <span class="max-w-[120px] truncate">{{ currentActivePreset?.name || '默认预设' }}</span>
                  <UIcon name="i-heroicons-chevron-down" class="h-3 w-3" />
                </button>
                <template #content>
                  <div class="w-48 py-1">
                    <div class="px-3 py-1.5 text-xs font-medium text-gray-400 dark:text-gray-500">
                      {{ currentChatType === 'group' ? '群聊' : '私聊' }}提示词预设
                    </div>
                    <button
                      v-for="preset in currentPresets"
                      :key="preset.id"
                      class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                      :class="[
                        preset.id === currentActivePresetId
                          ? 'text-pink-600 dark:text-pink-400'
                          : 'text-gray-700 dark:text-gray-300',
                      ]"
                      @click="setActivePreset(preset.id)"
                    >
                      <UIcon
                        :name="
                          preset.id === currentActivePresetId
                            ? 'i-heroicons-check-circle-solid'
                            : 'i-heroicons-document-text'
                        "
                        class="h-4 w-4 shrink-0"
                        :class="[preset.id === currentActivePresetId ? 'text-pink-500' : 'text-gray-400']"
                      />
                      <span class="truncate">{{ preset.name }}</span>
                    </button>
                  </div>
                </template>
              </UPopover>

              <!-- 右侧：配置状态指示 -->
              <div class="flex items-center gap-3">
                <div
                  v-if="!isCheckingConfig"
                  class="flex items-center gap-1.5 text-xs transition-colors"
                  :class="[hasLLMConfig ? 'text-gray-400' : 'text-amber-500 font-medium']"
                >
                  <span class="h-1.5 w-1.5 rounded-full" :class="[hasLLMConfig ? 'bg-green-500' : 'bg-amber-500']" />
                  {{ hasLLMConfig ? '服务已连接' : '请在全局设置中配置 AI 服务' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧：数据源面板 -->
    <Transition name="slide-fade">
      <div
        v-if="sourceMessages.length > 0 && !isSourcePanelCollapsed"
        class="w-80 shrink-0 border-l border-gray-200 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-900/50"
      >
        <DataSourcePanel
          :messages="sourceMessages"
          :keywords="currentKeywords"
          :is-loading="isLoadingSource"
          :is-collapsed="isSourcePanelCollapsed"
          class="h-full"
          @toggle="toggleSourcePanel"
          @load-more="handleLoadMore"
        />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Transition styles for slide-fade */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease-out;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}

/* Transition styles for slide-up (status bar) */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease-out;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(10px);
  opacity: 0;
}
</style>
