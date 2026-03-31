export const dynamic = 'force-dynamic'

'use client'

import { useState, useRef, useEffect } from 'react'
import { format, addDays } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { Send, Sparkles, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SchedulePreview } from '@/components/chatbot/SchedulePreview'
import type { GenerateScheduleOutput } from '@/lib/ai/types'
import { usePostHog } from 'posthog-js/react'

type MessageRole = 'user' | 'assistant' | 'system'

interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  scheduleResult?: GenerateScheduleOutput
  weekDate?: string
  saved?: boolean
}

const QUICK_ACTIONS = [
  { label: 'Generate minggu ini', weekOffset: 0, prioritizeKpi: true, overrideDayOff: false },
  { label: 'Generate minggu depan', weekOffset: 7, prioritizeKpi: true, overrideDayOff: false },
  { label: 'Minggu ini (busy week)', weekOffset: 0, prioritizeKpi: true, overrideDayOff: true },
]

export default function GeneratePage() {
  const posthog = usePostHog()
  const [adminId, setAdminId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'system',
      content: `Halo! Saya **Schejulo AI** 🤖\n\nSaya bisa generate jadwal live host secara otomatis berdasarkan kontrak member, KPI brand, dan ketersediaan studio.\n\nPilih aksi cepat di bawah, atau ketik perintah kamu.`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Fetch admin pertama dari DB sebagai assignedBy
  useEffect(() => {
    fetch('/api/admins')
      .then(r => r.json())
      .then(json => {
        if (json.data?.length > 0) setAdminId(json.data[0].id)
      })
  }, [])

  async function runGenerate(weekDate: Date, prioritizeKpi: boolean, overrideDayOff: boolean, userText: string) {
    const userMsgId = Date.now().toString()
    const assistantMsgId = (Date.now() + 1).toString()
    const weekDateStr = format(weekDate, 'yyyy-MM-dd')

    posthog?.capture('generate_schedule_started', { weekDate: weekDateStr, prioritizeKpi, overrideDayOff })
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: userText },
      { id: assistantMsgId, role: 'assistant', content: '⏳ Sedang generate jadwal...' },
    ])
    setLoading(true)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekDate: weekDateStr,
          prioritizeKpi,
          overrideDayOff,
          adminId: adminId ?? '',
          save: false,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: `❌ Error: ${json.error}` }
              : m
          )
        )
        return
      }

      const result: GenerateScheduleOutput = json.data
      const ctx = json.context
      posthog?.capture('generate_schedule_success', { sessionCount: result.sessions.length, warningCount: result.warnings.length, weekDate: weekDateStr })

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: `Berhasil generate **${result.sessions.length} sesi** untuk minggu ${ctx.weekStart} s/d ${ctx.weekEnd} (${ctx.weekType}).\n${result.warnings.length > 0 ? `⚠️ ${result.warnings.length} peringatan.` : '✅ Tidak ada peringatan.'}`,
                scheduleResult: result,
                weekDate: weekDateStr,
              }
            : m
        )
      )
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: '❌ Gagal menghubungi server. Coba lagi.' }
            : m
        )
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(msgId: string, result: GenerateScheduleOutput) {
    if (!adminId) return alert('Admin belum dimuat, coba refresh halaman.')
    posthog?.capture('schedule_approved', { sessionCount: result.sessions.length })
    setSavingId(msgId)
    try {
      const res = await fetch('/api/schedules/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessions: result.sessions, adminId }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? 'Gagal menyimpan')
      }
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, saved: true } : m))
      )
    } catch (err) {
      alert(`Gagal menyimpan jadwal: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setSavingId(null)
    }
  }

  function handleReject(msgId: string) {
    posthog?.capture('schedule_rejected')
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? { ...m, content: m.content + '\n\n~~Draft ditolak.~~', scheduleResult: undefined }
          : m
      )
    )
  }

  async function handleSend() {
    if (!input.trim() || loading) return
    const text = input.trim()
    setInput('')

    const lower = text.toLowerCase()
    const weekOffset =
      lower.includes('depan') ? 7 : lower.includes('lusa') ? 2 : 0
    const targetDate = addDays(new Date(), weekOffset)
    const overrideDayOff = lower.includes('busy')
    const prioritizeKpi = !lower.includes('merata')

    await runGenerate(targetDate, prioritizeKpi, overrideDayOff, text)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
        <Sparkles className="h-5 w-5 text-indigo-600" />
        <div>
          <h2 className="text-base font-semibold text-gray-900">Generate Jadwal</h2>
          <p className="text-xs text-gray-400">Powered by Gemini Flash</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-2xl rounded-2xl px-4 py-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-sm'
                  : msg.role === 'system'
                  ? 'bg-gray-100 text-gray-700 rounded-bl-sm'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
              }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: msg.content
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/~~(.*?)~~/g, '<del>$1</del>')
                    .replace(/\n/g, '<br/>'),
                }}
              />
              {msg.scheduleResult && (
                <SchedulePreview
                  result={msg.scheduleResult}
                  onApprove={() => handleApprove(msg.id, msg.scheduleResult!)}
                  onReject={() => handleReject(msg.id)}
                  saving={savingId === msg.id}
                  saved={msg.saved ?? false}
                />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick actions */}
      {messages.length <= 2 && !loading && (
        <div className="flex flex-wrap gap-2 pb-3">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() =>
                runGenerate(
                  addDays(new Date(), action.weekOffset),
                  action.prioritizeKpi,
                  action.overrideDayOff,
                  action.label
                )
              }
              className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 pt-3 border-t border-gray-200">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder='Ketik perintah, contoh: "generate jadwal minggu depan"'
          disabled={loading}
          className="flex-1 h-10 rounded-xl border border-gray-300 bg-white px-4 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
        />
        <Button onClick={handleSend} disabled={!input.trim() || loading} size="md">
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
