import Link from 'next/link'
import { CalendarDays, Sparkles, BarChart3, Tv2 } from 'lucide-react'

const features = [
  { icon: Sparkles, label: 'AI Generate Jadwal', desc: 'Generate jadwal live host otomatis dengan AI, mempertimbangkan semua constraint.' },
  { icon: BarChart3, label: 'KPI Tracking Real-time', desc: 'Monitor pencapaian jam brand secara live, deteksi yang at risk sejak dini.' },
  { icon: Tv2, label: 'Studio Management', desc: 'Kelola 10 studio live — reserved, shared, dan status real-time.' },
  { icon: CalendarDays, label: 'Calendar View', desc: 'Lihat jadwal mingguan per divisi, brand, atau member dalam satu tampilan.' },
]

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex">
      {/* Left — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-indigo-600 text-white">
        <div>
          <div className="flex items-center gap-2 mb-12">
            <div className="rounded-xl bg-white/20 p-2">
              <CalendarDays className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Schejulo</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Jadwal live host,<br />lebih cerdas.
          </h1>
          <p className="text-indigo-200 text-lg leading-relaxed">
            Platform manajemen jadwal untuk live host e-commerce dengan AI, tracking KPI brand secara real-time.
          </p>
        </div>

        <div className="space-y-5">
          {features.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="rounded-lg bg-white/10 p-2 flex-shrink-0">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-indigo-200 text-xs leading-relaxed mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-indigo-300 text-xs">© 2026 Schejulo. All rights reserved.</p>
      </div>

      {/* Right — login form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="rounded-xl bg-indigo-100 p-2">
              <CalendarDays className="h-5 w-5 text-indigo-600" />
            </div>
            <span className="text-xl font-bold text-indigo-600">Schejulo</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Masuk</h2>
            <p className="text-gray-500 text-sm mt-1">Masukkan kredensial admin kamu</p>
          </div>

          <form className="space-y-4" action="/dashboard">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Email / Telegram ID</label>
              <input
                type="text"
                placeholder="admin@schejulo.com"
                className="h-10 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="h-10 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <Link
              href="/dashboard"
              className="flex w-full items-center justify-center rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors mt-2"
            >
              Masuk ke Dashboard
            </Link>
          </form>

          <div className="mt-8 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
            <p className="text-xs font-semibold text-indigo-700 mb-2">🚀 Demo Account</p>
            <div className="space-y-1 text-xs text-indigo-600">
              <p>Email: <span className="font-mono font-medium">admin@schejulo.com</span></p>
              <p>Password: <span className="font-mono font-medium">schejulo2026</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
