import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream p-6">
      <section className="w-full max-w-md rounded-3xl border border-border bg-paper p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-caramel-hover">WA Patisserie</p>
        <p className="font-display mt-5 text-5xl font-semibold text-rosewood">404</p>
        <h1 className="font-display mt-3 text-xl font-semibold text-rosewood">Không tìm thấy trang</h1>
        <p className="mt-2 text-sm leading-6 text-muted">Đường dẫn này không tồn tại hoặc đã được thay đổi.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/admin" className="rounded-xl bg-caramel px-4 py-2.5 text-sm font-semibold text-action-ink transition hover:bg-caramel-hover">
            Về Tổng quan
          </Link>
          <Link to="/pos" className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-rosewood transition hover:bg-petal">
            Mở POS
          </Link>
        </div>
      </section>
    </main>
  )
}
