import type { AIProvider, ProviderConfig } from '@/types'

const SYSTEM_PROMPT = `你是一个专业的 AI 阅读助手，帮助用户理解和分析文档内容。

## 回答原则

1. **条理清晰**：每个回答要有明确的层级结构，先概述再展开，段落之间有逻辑递进。
2. **用语直白**：用通俗易懂的中文解释复杂概念。避免学术黑话和过度修饰。像一位耐心的老师在给学生讲解。
3. **逻辑通畅**：论证过程完整连贯，不跳跃。先说结论，再给论据，最后总结。
4. **基于文档**：回答必须源自用户提供的文档内容。如果文档没有相关信息，直接说"文档中未提及"。
5. **引用关键原文**：适当引用文档中的关键句子或段落来支撑观点，使用 > 引用格式。

## 格式规范

- 使用 ### 小标题划分段落
- 用无序列表和有序列表组织要点
- 重要术语和关键结论用 **粗体** 强调
- 引用原文时使用 > 引用块
- 数学公式使用 LaTeX 语法，行内公式用 $...$，块级公式用 $$...$$
- 对比信息使用表格展示
- 代码或技术术语用反引号包裹`

const NOTE_SYSTEM_PROMPT = `你是一个专业的知识整理助手。你的任务是将对话内容浓缩为高质量的学习笔记。

## 笔记要求

1. **书面化**：使用正式、精炼的书面语，去除口语化表达和客套话
2. **干货优先**：只保留核心观点、关键论据、重要数据和结论。删除铺垫、举例、废话
3. **结构完整**：用清晰的标题层级组织内容，确保逻辑链条完整
4. **全面覆盖**：概括对话中所有讨论到的要点，不遗漏关键信息
5. **独立可读**：笔记应该是自包含的，读者不需要看原始对话也能理解
6. **简洁有力**：控制篇幅，每句话都要有信息量

输出使用 Markdown 格式，必要时使用 LaTeX 公式、表格、列表等元素来增强可读性。`

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
    desc: '最新 V4 系列，百万上下文，旗舰推理',
    baseURL: 'https://api.deepseek.com/v1/chat/completions',
    models: [
      { id: 'deepseek-v4-pro', name: 'V4 Pro (旗舰)' },
      { id: 'deepseek-v4-flash', name: 'V4 Flash (快速)' },
      { id: 'deepseek-chat', name: 'deepseek-chat (旧, 7月停用)' },
      { id: 'deepseek-reasoner', name: 'deepseek-reasoner (旧, 7月停用)' },
    ],
    defaultModel: 'deepseek-v4-pro',
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

// Regenerate the entire note from full conversation history
export async function regenerateNote(
  documentTitle: string,
  conversation: { role: string; content: string }[]
): Promise<string> {
  const config = getCurrentConfig()
  if (!config.apiKey && config.provider !== 'ollama') {
    return ''
  }

  const convoText = conversation
    .map((m) => `**${m.role === 'user' ? '用户提问' : 'AI 回答'}**：\n${m.content}`)
    .join('\n\n---\n\n')

  const prompt = `请根据以下关于文档《${documentTitle}》的完整对话历史，重新整理一份高质量的学习笔记。

## 对话历史
${convoText}

## 要求
请完全重新整理，而不是在旧笔记上追加。输出格式：

# 文档《${documentTitle}》阅读笔记

（用一段话概括本文档的核心内容和本次阅读的重点收获）

## 关键要点
- （列出从对话中提炼出的所有重要知识点）
- ...

## 详细分析
（按主题分小节组织，每个小节深入展开一个知识点）

## 原文摘录
> （整理对话中引用过的关键原文段落）

## 总结
（一两句话总结整体收获和后续可以继续探讨的方向）

请确保：
- 覆盖对话中讨论过的所有话题
- 书面化、精炼、无废话
- 使用 LaTeX 语法写数学公式
- 适当使用表格对比信息`

  try {
    const body = config.provider === 'claude'
      ? JSON.stringify({
          model: config.model,
          max_tokens: 4096,
          system: NOTE_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: prompt }],
        })
      : JSON.stringify({
          model: config.model,
          max_tokens: 4096,
          messages: [
            { role: 'system', content: NOTE_SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
        })

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (config.provider === 'claude') {
      headers['x-api-key'] = config.apiKey
      headers['anthropic-version'] = '2023-06-01'
    } else {
      headers['Authorization'] = `Bearer ${config.apiKey}`
    }

    const endpoint = config.provider === 'claude'
      ? 'https://api.anthropic.com/v1/messages'
      : config.baseURL

    const res = await fetch(endpoint, { method: 'POST', headers, body })
    if (!res.ok) return ''

    const data = await res.json()
    if (config.provider === 'claude') {
      return data.content?.[0]?.text || ''
    }
    return data.choices?.[0]?.message?.content || ''
  } catch {
    return ''
  }
}
