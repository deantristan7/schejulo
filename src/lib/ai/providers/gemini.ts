import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AIProvider, AIGenerateOptions } from '../types'

export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey)
  }

  async chat({ messages, systemPrompt, temperature = 0.3, maxTokens = 8192 }: AIGenerateOptions): Promise<string> {
    const model = this.client.getGenerativeModel({
      model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash-preview-05-20',
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
        responseMimeType: 'application/json',
      },
    })

    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    const lastMessage = messages[messages.length - 1]

    const chat = model.startChat({ history })
    const result = await chat.sendMessage(lastMessage.content)
    return result.response.text()
  }
}
