import { GeminiProvider } from './providers/gemini'
import type { AIProvider } from './types'

// ─────────────────────────────────────────
// Swap provider di sini — ganti GeminiProvider
// dengan AnthropicProvider / GroqProvider saat dibutuhkan
// ─────────────────────────────────────────

function createAIProvider(): AIProvider {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY tidak ditemukan di environment variables')
  }
  return new GeminiProvider(apiKey)
}

export const aiProvider = createAIProvider
