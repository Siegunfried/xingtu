import type { AIProvider } from '@/types'

export function saveApiKey(provider: AIProvider, key: string): void {
  localStorage.setItem(`xingtu-key-${provider}`, key)
}

export function getApiKey(provider: AIProvider): string {
  return localStorage.getItem(`xingtu-key-${provider}`) || ''
}

export function saveProviderConfig(provider: AIProvider, baseURL?: string): void {
  localStorage.setItem('xingtu-provider', provider)
  if (baseURL) {
    localStorage.setItem(`xingtu-url-${provider}`, baseURL)
  }
}

export function saveModel(model: string): void {
  localStorage.setItem('xingtu-model', model)
}

export function getProvider(): AIProvider {
  return (localStorage.getItem('xingtu-provider') || 'claude') as AIProvider
}

export function getModel(): string {
  return localStorage.getItem('xingtu-model') || ''
}

export { hasApiKey } from './aiService'
