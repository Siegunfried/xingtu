import type { AIProvider, ProviderConfig } from '@/types'

const SYSTEM_PROMPT = `你是一个专业的 AI 阅读助手。你的职责是：

1. **阅读分析**：仔细阅读用户提供的文档内容，深入理解其中的信息。
2. **专业回答**：基于文档内容，用专业、清晰的中文回答用户的问题。回答要有条理，使用 Markdown 格式。
3. **引用原文**：在回答中适当引用文档原文来支撑你的观点。
4. **诚实回答**：如果文档中没有相关信息，请明确告知用户，不要编造内容。
5. **深度思考**：不满足于表面信息，要能挖掘文档中的深层含义、逻辑关系。

回答格式要求：
- 使用清晰的标题层级
- 使用列表组织要点
- 引用原文时使用 > 引用格式
- 重要概念使用 **粗体** 标记`

export const PROVIDERS: Record<AIProvider, ProviderConfig> = {
  claude: {
    id: 'claude',
    name: 'Claude (Anthropic)',
    baseURL: 'https://api.anthropic.com/v1/messages',
    models: [
      { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6' },
      { id: 'claude-opus-4-7', name: 'Claude Opus 4.7' },
      { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5' },
    ],
    defaultModel: 'claude-sonnet-4-6',
    requiresAuth: true,
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    baseURL: 'https://api.deepseek.com/v1/chat/completions',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek V3' },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1' },
    ],
    defaultModel: 'deepseek-chat',
    requiresAuth: true,
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1/chat/completions',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    ],
    defaultModel: 'gpt-4o',
    requiresAuth: true,
  },
  custom: {
    id: 'custom',
    name: '自定义 (OpenAI 兼容)',
    baseURL: '',
    models: [],
    defaultModel: '',
    requiresAuth: true,
  },
}

interface StreamCallbacks {
  onToken: (token: string) => void
  onDone: (fullText: string) => void
  onError: (error: Error) => void
}

const MAX_CONTEXT_LENGTH = 30000

function truncateDocument(content: string): string {
  if (content.length <= MAX_CONTEXT_LENGTH) return content
  return content.slice(0, MAX_CONTEXT_LENGTH) + '\n\n...(文档过长，已截断)'
}

export function hasApiKey(): boolean {
  const config = getCurrentConfig()
  return !!config.apiKey
}

export function getCurrentConfig(): {
  provider: AIProvider
  model: string
  apiKey: string
  baseURL: string
} {
  const provider = (localStorage.getItem('xingtu-provider') || 'claude') as AIProvider
  const model = localStorage.getItem('xingtu-model') || PROVIDERS[provider].defaultModel
  const key = localStorage.getItem(`xingtu-key-${provider}`) || ''
  const baseURL = localStorage.getItem(`xingtu-url-${provider}`) || PROVIDERS[provider].baseURL
  return { provider, model, apiKey: key, baseURL }
}

export async function streamChat(
  documentContent: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  userMessage: string,
  callbacks: StreamCallbacks
): Promise<void> {
  const config = getCurrentConfig()
  if (!config.apiKey) {
    callbacks.onError(new Error('请先在设置中配置 API Key'))
    return
  }

  const truncatedContent = truncateDocument(documentContent)
  const recentHistory = history.slice(-20)

  if (config.provider === 'claude') {
    await streamClaude(config, truncatedContent, recentHistory, userMessage, callbacks)
  } else {
    await streamOpenAICompatible(config, truncatedContent, recentHistory, userMessage, callbacks)
  }
}

async function streamClaude(
  config: { apiKey: string; model: string },
  documentContent: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  userMessage: string,
  callbacks: StreamCallbacks
): Promise<void> {
  const messages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: `以下是我正在阅读的文档内容：\n\n---\n${documentContent}\n---\n\n我的问题是：${userMessage}` },
  ]

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages,
        stream: true,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Claude API 错误 (${res.status}): ${err}`)
    }

    await readSSEStream(res, (data) => {
      if (data.type === 'content_block_delta' && data.delta?.text) {
        return data.delta.text
      }
      return null
    }, callbacks)
  } catch (error) {
    callbacks.onError(error instanceof Error ? error : new Error(String(error)))
  }
}

async function streamOpenAICompatible(
  config: { apiKey: string; model: string; baseURL: string },
  documentContent: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  userMessage: string,
  callbacks: StreamCallbacks
): Promise<void> {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: `以下是我正在阅读的文档内容：\n\n---\n${documentContent}\n---\n\n我的问题是：${userMessage}` },
  ]

  try {
    const res = await fetch(config.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 4096,
        messages,
        stream: true,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`API 错误 (${res.status}): ${err}`)
    }

    await readSSEStream(res, (data) => {
      return data.choices?.[0]?.delta?.content || null
    }, callbacks)
  } catch (error) {
    callbacks.onError(error instanceof Error ? error : new Error(String(error)))
  }
}

async function readSSEStream(
  res: Response,
  extract: (data: any) => string | null,
  callbacks: StreamCallbacks
): Promise<void> {
  const reader = res.body?.getReader()
  if (!reader) throw new Error('无法读取流式响应')

  const decoder = new TextDecoder()
  let fullText = ''
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data: ')) continue
      const data = trimmed.slice(6)
      if (data === '[DONE]') continue

      try {
        const json = JSON.parse(data)
        const text = extract(json)
        if (text) {
          fullText += text
          callbacks.onToken(text)
        }
      } catch {
        // skip unparseable
      }
    }
  }

  callbacks.onDone(fullText)
}
