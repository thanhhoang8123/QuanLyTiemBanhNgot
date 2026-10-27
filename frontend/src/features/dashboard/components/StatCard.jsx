import Icon from '../../../components/Icon.jsx'

const tones = {
  caramel: 'bg-caramel-soft text-rosewood',
  rose: 'bg-blush-soft text-rosewood',
  sage: 'bg-success-soft text-success',
  lavender: 'bg-neutral-soft text-neutral-ink',
}

export default function StatCard({ stat }) {
  return (
    <article className="soft-shadow relative overflow-hidden rounded-2xl border border-border bg-paper p-4 sm:p-5">
      <span className="absolute inset-y-4 left-0 w-[3px] rounded-r-full bg-caramel" />
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold text-muted sm:text-[13px]">{stat.label}</p>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tones[stat.tone]}`}>
          <Icon name={stat.icon} size={17} />
        </span>
      </div>
      <p className={`font-display mt-3 truncate text-[24px] text-rosewood sm:text-[27px] ${stat.label === 'Bán chạy nhất' ? 'text-[21px] sm:text-[23px]' : ''}`}>
        {stat.value}
      </p>
      <p className="mt-3 text-[10px] text-muted sm:text-[11px]">{stat.note}</p>
    </article>
  )
}
