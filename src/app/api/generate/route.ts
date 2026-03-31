import { NextRequest, NextResponse } from 'next/server'
import { format } from 'date-fns'
import { z } from 'zod'
import { buildGenerateContext, generateSchedule, saveDraftSchedules } from '@/lib/ai/generate'

const requestSchema = z.object({
  weekDate: z.string(),       // ISO date string, any date in the target week
  prioritizeKpi: z.boolean().default(true),
  overrideDayOff: z.boolean().default(false),
  adminId: z.string(),
  save: z.boolean().default(false),   // true = simpan ke DB sebagai DRAFT
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).default([]),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { weekDate, prioritizeKpi, overrideDayOff, adminId, save, history } = parsed.data
    const periodLabel = format(new Date(weekDate), 'yyyy-MM')

    // Build context dari DB
    const context = await buildGenerateContext(new Date(weekDate), periodLabel)
    context.prioritizeKpi = prioritizeKpi
    context.overrideDayOff = overrideDayOff

    if (context.members.length === 0) {
      return NextResponse.json({ error: 'Tidak ada member aktif dengan kontrak bulan ini' }, { status: 400 })
    }
    if (context.brands.length === 0) {
      return NextResponse.json({ error: 'Tidak ada brand aktif dengan kontrak bulan ini' }, { status: 400 })
    }

    // Generate dengan AI
    const result = await generateSchedule(context, history)

    // Simpan ke DB jika diminta
    let savedCount = 0
    if (save && result.sessions.length > 0) {
      const saved = await saveDraftSchedules(result.sessions, adminId)
      savedCount = saved.length
    }

    return NextResponse.json({
      data: result,
      context: {
        weekStart: context.weekStart,
        weekEnd: context.weekEnd,
        weekType: context.weekType,
        memberCount: context.members.length,
        brandCount: context.brands.length,
      },
      savedCount,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error('[POST /api/generate]', error)

    if (message.includes('GEMINI_API_KEY')) {
      return NextResponse.json({ error: 'GEMINI_API_KEY belum diset di .env' }, { status: 503 })
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
