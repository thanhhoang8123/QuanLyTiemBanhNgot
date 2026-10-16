import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../../components/Icon.jsx'
import StatCard from '../components/StatCard.jsx'
import SalesTrendChart from '../components/SalesTrendChart.jsx'
import CategoryDonut from '../components/CategoryDonut.jsx'
import OrdersTable from '../components/OrdersTable.jsx'
import LowStockPanel from '../components/LowStockPanel.jsx'
import { dashboardStats } from '../../../data/mockData.js'

export default function DashboardPage({ onToast }) {
  const [period, setPeriod] = useState('Hôm nay')

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-muted">Thứ Ba, 15 tháng 10, 2026</p>
          <h2 className="font-display mt-1 text-[28px] leading-tight text-rosewood sm:text-[34px]">Chào buổi sáng, Minh Anh <span aria-hidden="true">☀️</span></h2>
          <p className="mt-2 text-xs text-muted">Đây là tình hình ngọt ngào của cửa hàng hôm nay.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="dashboard-period">Khoảng thời gian</label>
          <select
            id="dashboard-period"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className="h-10 rounded-xl border border-border bg-paper px-3 text-xs font-medium text-rosewood outline-none transition hover:border-caramel-hover focus:border-caramel-hover"
          >
            <option>Hôm nay</option>
            <option>7 ngày qua</option>
            <option>Tháng này</option>
          </select>
          <Link to="/pos" className="flex h-10 items-center gap-2 rounded-xl bg-caramel px-4 text-xs font-semibold text-action-ink shadow-sm transition hover:bg-caramel-hover">
            <Icon name="plus" size={15} /> Tạo đơn hàng
          </Link>
        </div>
      </div>

      <section aria-label="Chỉ số kinh doanh" className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => <StatCard key={stat.label} stat={stat} />)}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.8fr)]">
        <SalesTrendChart />
        <CategoryDonut />
      </section>

      <section className="grid grid-cols-1 items-start gap-5 2xl:grid-cols-[minmax(0,1.7fr)_minmax(285px,0.8fr)]">
        <OrdersTable />
        <LowStockPanel onRestock={() => onToast('Đây là dữ liệu minh họa; quản lý kho chưa nằm trong prototype.')} />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-petal px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-paper text-rosewood"><Icon name="sparkles" size={18} /></span>
          <div>
            <p className="font-display text-[15px] text-rosewood">Cùng tạo nên một ngày thật ngọt ngào</p>
            <p className="mt-1 text-[10px] text-muted">Bắt đầu đơn bán hàng mới ngay tại quầy.</p>
          </div>
        </div>
        <Link to="/pos" className="flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold text-rosewood transition hover:bg-paper">
          Mở bán hàng <Icon name="arrowUpRight" size={15} />
        </Link>
      </div>
    </div>
  )
}
