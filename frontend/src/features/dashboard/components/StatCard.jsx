import Icon from '../../../components/Icon.jsx'

const tones = {
  caramel: 'bg-caramel-soft text-caramel',
  rose: 'bg-rose-50 text-rose-600',
  sage: 'bg-emerald-50 text-emerald-700',
  lavender: 'bg-sky-50 text-sky-700',
}

export default function StatCard({ stat }) {
  return (
    <article className="soft-shadow card-hover relative overflow-hidden rounded-2xl border border-border bg-paper p-4 sm:p-5">
      <span className="absolute inset-y-4 left-0 w-[3px] rounded-r-full bg-caramel" />
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-bold text-muted sm:text-[13px]">{stat.label}</p>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold shadow-2xs ${tones[stat.tone] ?? 'bg-caramel-soft text-caramel'}`}>
          <Icon name={stat.icon} size={18} />
        </span>
      </div>
      <p className={`mt-3 truncate text-2xl sm:text-3xl font-extrabold text-rosewood tracking-tight ${stat.label === 'Bán chạy nhất' ? 'text-xl sm:text-2xl' : ''}`}>
        {stat.value}
      </p>
      <p className="mt-2 text-xs font-medium text-muted">{stat.note}</p>
    </article>
  )
}
