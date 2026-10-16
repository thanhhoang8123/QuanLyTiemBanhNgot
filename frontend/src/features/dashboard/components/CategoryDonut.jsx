const categoryRows = [
  { label: 'Bánh kem', value: '34%', color: 'var(--wa-caramel)' },
  { label: 'Bánh lạnh', value: '25%', color: 'var(--wa-blush)' },
  { label: 'Bánh ngọt', value: '20%', color: 'var(--wa-rosewood)' },
  { label: 'Khác', value: '21%', color: 'var(--wa-sand)' },
]

export default function CategoryDonut() {
  return (
    <section className="soft-shadow rounded-2xl border border-border bg-paper p-5 sm:p-6">
      <div>
        <h2 className="font-display text-lg font-semibold text-rosewood">Danh mục bán chạy</h2>
        <p className="mt-1 text-[11px] text-muted">Tỷ trọng doanh thu</p>
      </div>
      <div className="my-5 flex justify-center">
        <div className="donut-chart relative flex h-36 w-36 items-center justify-center rounded-full shadow-inner">
          <div className="flex h-[94px] w-[94px] flex-col items-center justify-center rounded-full bg-paper">
            <span className="font-display text-xl text-rosewood">128</span>
            <span className="text-[9px] font-medium text-muted">đơn hàng</span>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {categoryRows.map((row) => (
          <div key={row.label} className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-2 font-medium text-rosewood">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: row.color }} />
              {row.label}
            </span>
            <span className="font-bold text-rosewood">{row.value}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
