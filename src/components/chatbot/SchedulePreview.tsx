import { Badge } from '@/components/ui/badge'
import type { GenerateScheduleOutput } from '@/lib/ai/types'

const DAY_LABELS: Record<string, string> = {
  '0': 'Minggu', '1': 'Senin', '2': 'Selasa', '3': 'Rabu',
  '4': 'Kamis', '5': 'Jumat', '6': 'Sabtu',
}

function getDayLabel(dateStr: string) {
  const d = new Date(dateStr)
  return DAY_LABELS[String(d.getDay())]
}

interface Props {
  result: GenerateScheduleOutput
  onApprove: () => void
  onReject: () => void
  saving: boolean
  saved: boolean
}

export function SchedulePreview({ result, onApprove, onReject, saving, saved }: Props) {
  const byDate = result.sessions.reduce<Record<string, typeof result.sessions>>((acc, s) => {
    if (!acc[s.workDate]) acc[s.workDate] = []
    acc[s.workDate].push(s)
    return acc
  }, {})

  const dates = Object.keys(byDate).sort()

  return (
    <div className="mt-3 space-y-4">
      {/* Summary */}
      {result.summary && (
        <p className="text-sm text-gray-600 italic">{result.summary}</p>
      )}

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 space-y-1">
          <p className="text-xs font-semibold text-yellow-700">⚠️ Perhatian</p>
          {result.warnings.map((w, i) => (
            <p key={i} className="text-xs text-yellow-600">• {w}</p>
          ))}
        </div>
      )}

      {/* Schedule table per day */}
      <div className="space-y-3">
        {dates.map((date) => (
          <div key={date} className="rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
              <span className="text-xs font-semibold text-gray-600">
                {getDayLabel(date)}, {date}
              </span>
              <span className="ml-2 text-xs text-gray-400">{byDate[date].length} sesi</span>
            </div>
            <table className="w-full text-xs">
              <tbody className="divide-y divide-gray-100">
                {byDate[date]
                  .sort((a, b) => a.sessionStart.localeCompare(b.sessionStart))
                  .map((s, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-800">{s.memberName}</td>
                      <td className="px-3 py-2 text-gray-500">{s.brandName}</td>
                      <td className="px-3 py-2 text-gray-500">{s.studioName}</td>
                      <td className="px-3 py-2 text-gray-600">
                        {s.sessionStart}–{s.sessionEnd}
                        <span className="ml-1 text-gray-400">({s.sessionHours}h)</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          s.sessionNumber === 1 ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>
                          Sesi {s.sessionNumber}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* KPI Impact */}
      {result.kpiImpact.length > 0 && (
        <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3">
          <p className="text-xs font-semibold text-indigo-700 mb-2">📊 Proyeksi KPI setelah jadwal ini</p>
          <div className="grid grid-cols-2 gap-1.5">
            {result.kpiImpact.map((k, i) => (
              <div key={i} className="text-xs text-indigo-600">
                <span className="font-medium">{k.brandName}</span>
                {' '}+{k.hoursAdded}h → {k.newPct.toFixed(1)}%
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {!saved && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={onApprove}
            disabled={saving}
            className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : `✅ Simpan ${result.sessions.length} sesi sebagai Draft`}
          </button>
          <button
            onClick={onReject}
            disabled={saving}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Tolak
          </button>
        </div>
      )}
      {saved && (
        <p className="text-center text-sm font-medium text-green-600">
          ✅ {result.sessions.length} sesi tersimpan sebagai Draft
        </p>
      )}
    </div>
  )
}
