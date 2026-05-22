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
    name: 'Claude',
    desc: 'Anthropic 出品，长上下文理解力强',
    baseURL: 'https://api.anthropic.com/v1/messages',
    models: [
      { id: 'claude-sonnet-4-6', name: 'Sonnet 4.6' },
      { id: 'claude-opus-4-7', name: 'Opus 4.7' },
      { id: 'claude-haiku-4-5-20251001', name: 'Haiku 4.5' },
      { id: 'claude-sonnet-4-5-20250915', name: 'Sonnet 4.5' },
      { id: 'claude-opus-4-5', name: 'Opus 4.5' },
    ],
    defaultModel: 'claude-sonnet-4-6',
    requiresAuth: true,
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    desc: '国产高性价比，推理能力强',
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
    desc: 'GPT 系列，综合能力强',
    baseURL: 'https://api.openai.com/v1/chat/completions',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4.1', name: 'GPT-4.1' },
      { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' },
      { id: 'o3', name: 'o3' },
      { id: 'o4-mini', name: 'o4 Mini' },
    ],
    defaultModel: 'gpt-4o',
    requiresAuth: true,
  },
  qwen: {
    id: 'qwen',
    name: '通义千问',
    desc: '阿里云出品，中文理解出色',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    models: [
      { id: 'qwen-turbo', name: 'Qwen Turbo' },
      { id: 'qwen-plus', name: 'Qwen Plus' },
      { id: 'qwen-max', name: 'Qwen Max' },
      { id: 'qwen3-235b-a22b', name: 'Qwen3 235B' },
    ],
    defaultModel: 'qwen-plus',
    requiresAuth: true,
  },
  kimi: {
    id: 'kimi',
    name: 'Kimi (月之暗面)',
    desc: '超长上下文，适合长文档阅读',
    baseURL: 'https://api.moonshot.cn/v1/chat/completions',
    models: [
      { id: 'moonshot-v1-8k', name: 'Moonshot 8K' },
      { id: 'moonshot-v1-32k', name: 'Moonshot 32K' },
      { id: 'moonshot-v1-128k', name: 'Moonshot 128K' },
      { id: 'kimi-latest', name: 'Kimi Latest' },
    ],
    defaultModel: 'moonshot-v1-32k',
    requiresAuth: true,
  },
  glm: {
    id: 'glm',
    name: '智谱 GLM',
    desc: '清华系，多模态能力强',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    models: [
      { id: 'glm-4-plus', name: 'GLM-4 Plus' },
      { id: 'glm-4', name: 'GLM-4' },
      { id: 'glm-4-flash', name: 'GLM-4 Flash' },
      { id: 'glm-4-air', name: 'GLM-4 Air' },
    ],
    defaultModel: 'glm-4-flash',
    requiresAuth: true,
  },
  siliconflow: {
    id: 'siliconflow',
    name: '硅基流动',
    desc: '模型聚合平台，选择丰富',
    baseURL: 'https://api.siliconflow.cn/v1/chat/completions',
    models: [
      { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3' },
      { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1' },
      { id: 'Qwen/Qwen3-235B-A22B', name: 'Qwen3 235B' },
      { id: 'Pro/Qwen/Qwen3-235B-A22B', name: 'Qwen3 235B (Pro)' },
      { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen2.5 72B' },
      { id: 'meta-llama/Meta-Llama-3.1-405B-Instruct', name: 'Llama 3.1 405B' },
      { id: 'Pro/meta-llama/Meta-Llama-4-Maverick-17B-128E-Instruct', name: 'Llama 4 Maverick' },
      { id: 'THUDM/GLM-4-9B-Chat', name: 'GLM-4 9B' },
      { id: 'internlm/internlm3-8b-instruct', name: 'InternLM3 8B' },
    ],
    defaultModel: 'deepseek-ai/DeepSeek-V3',
    requiresAuth: true,
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama (本地)',
    desc: '本地运行，隐私安全，免费',
    baseURL: 'http://localhost:11434/v1/chat/completions',
    models: [
      { id: 'llama3.2', name: 'Llama 3.2' },
      { id: 'qwen3', name: 'Qwen3' },
      { id: 'deepseek-r1:8b', name: 'DeepSeek R1 8B' },
      { id: 'mistral', name: 'Mistral' },
      { id: 'gemma3', name: 'Gemma 3' },
    ],
    defaultModel: 'qwen3',
    requiresAuth: false,
  },
  custom: {
    id: 'custom',
    name: '自定义',
    desc: '任意 OpenAI 兼容 API',
    baseURL: '',
    models: [],
    defaultModel: '',
    requiresAuth: true,
  },
}

// Provider display order
export const PROVIDER_ORDER: AIProvider[] = [
  'claude', 'deepseek', 'openai', 'qwen', 'kimi', 'glm', 'siliconflow', 'ollama', 'custom',
]

interface StreamCallbacks {
  onToken: (token: string) => void
  onDone: (fullText: string) => void
  onError: (error: Error) => void
}

const MAX_CONTEXT_LENGTH = 50000

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
  const cfg = PROVIDERS[provider]
  const model = localStorage.getItem('xingtu-model') || cfg.defaultModel
  const key = localStorage.getItem(`xingtu-key-${provider}`) || ''
  const baseURL = localStorage.getItem(`xingtu-url-${provider}`) || cfg.baseURL
  return { provider, model, apiKey: key, baseURL }
}

export async function streamChat(
  documentContent: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  userMessage: string,
  callbacks: StreamCallbacks
): Promise<void> {
  const config = getCurrentConfig()
  if (!config.apiKey && config.provider !== 'ollama') {
    callbacks.onError(new Error('请先配置 API Key'))
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
      throw new Error(`API 错误 (${res.status}): ${err.slice(0, 300)}`)
    }
    await readSSEStream(res, (data) => {
      if (data.type === 'content_block_delta' && data.delta?.text) return data.delta.text
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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`
    }

    const res = await fetch(config.baseURL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model,
        max_tokens: 4096,
        messages,
        stream: true,
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`API 错误 (${res.status}): ${err.slice(0, 300)}`)
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
      } catch { /* skip */ }
    }
  }
  callbacks.onDone(fullText)
}
