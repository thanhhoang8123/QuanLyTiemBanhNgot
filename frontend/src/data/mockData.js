export const dashboardStats = [
  {
    label: 'Doanh thu',
    value: '24.850.000đ',
    change: '+12,8%',
    note: 'so với tuần trước',
    icon: 'trending-up',
    tone: 'caramel',
  },
  {
    label: 'Đơn hàng',
    value: '128',
    change: '+8,2%',
    note: 'so với tuần trước',
    icon: 'receipt',
    tone: 'rose',
  },
  {
    label: 'Giá trị đơn TB',
    value: '194.140đ',
    change: '+4,6%',
    note: 'so với tuần trước',
    icon: 'credit-card',
    tone: 'sage',
  },
  {
    label: 'Bán chạy nhất',
    value: 'Tiramisu',
    change: '86 chiếc',
    note: 'trong tuần này',
    icon: 'sparkles',
    tone: 'lavender',
  },
]

export const salesTrend = [
  { day: 'T2', value: 38 },
  { day: 'T3', value: 53 },
  { day: 'T4', value: 44 },
  { day: 'T5', value: 69 },
  { day: 'T6', value: 58 },
  { day: 'T7', value: 86 },
  { day: 'CN', value: 73 },
]

export const recentOrders = [
  { id: '#WA-1028', customer: 'Nguyễn Minh Anh', time: '09:42', total: '520.000đ', status: 'Đang chuẩn bị' },
  { id: '#WA-1027', customer: 'Trần Hoài Thu', time: '09:18', total: '285.000đ', status: 'Hoàn tất' },
  { id: '#WA-1026', customer: 'Lê Khánh Linh', time: '08:56', total: '740.000đ', status: 'Chờ xác nhận' },
  { id: '#WA-1025', customer: 'Phạm Gia Hân', time: '08:31', total: '165.000đ', status: 'Hoàn tất' },
]

export const lowStockItems = [
  { name: 'Kem whipping', amount: '1,2 lít', threshold: 'Tối thiểu 3 lít' },
  { name: 'Dâu tây Đà Lạt', amount: '0,8 kg', threshold: 'Tối thiểu 2 kg' },
  { name: 'Bột hạnh nhân', amount: '1,5 kg', threshold: 'Tối thiểu 2 kg' },
]

export const categories = ['Tất cả', 'Bánh kem', 'Bánh lạnh', 'Bánh ngọt', 'Bánh mì', 'Đồ uống']

export const managedProducts = [
  { id: 'tiramisu', code: 'WA-001', name: 'Tiramisu cổ điển', category: 'Bánh lạnh', price: 95000, stock: 18, status: 'Đang bán', background: 'from-[#e7d1bb] to-[#b9855f]' },
  { id: 'strawberry', code: 'WA-002', name: 'Bánh kem dâu tây', category: 'Bánh kem', price: 420000, stock: 6, status: 'Đang bán', background: 'from-[#ead7ce] to-[#c88d7d]' },
  { id: 'macaron', code: 'WA-003', name: 'Macaron hoa hồng', category: 'Bánh ngọt', price: 35000, stock: 24, status: 'Đang bán', background: 'from-[#e8d9cd] to-[#b98b7a]' },
  { id: 'croissant', code: 'WA-004', name: 'Croissant bơ Pháp', category: 'Bánh mì', price: 42000, stock: 2, status: 'Đang bán', background: 'from-[#eee0c7] to-[#c49a59]' },
  { id: 'cheesecake', code: 'WA-005', name: 'Cheesecake chanh vàng', category: 'Bánh lạnh', price: 75000, stock: 5, status: 'Đang bán', background: 'from-[#e7e1c9] to-[#afa16a]' },
  { id: 'choux', code: 'WA-006', name: 'Su kem vanilla', category: 'Bánh ngọt', price: 28000, stock: 15, status: 'Đang bán', background: 'from-[#eee1cf] to-[#c19463]' },
  { id: 'cookie', code: 'WA-007', name: 'Cookie chocolate', category: 'Bánh mì', price: 32000, stock: 32, status: 'Đang bán', background: 'from-[#dac8b8] to-[#90644d]' },
  { id: 'latte', code: 'WA-008', name: 'Latte caramel', category: 'Đồ uống', price: 55000, stock: 20, status: 'Đang bán', background: 'from-[#e3d4c4] to-[#967158]' },
]

export const ingredients = [
  { id: 'cream', name: 'Kem whipping', category: 'Sữa & kem', quantity: 1.2, unit: 'lít', minimum: 3, unitCost: 95000, updatedAt: 'Hôm nay, 09:20' },
  { id: 'strawberry', name: 'Dâu tây Đà Lạt', category: 'Trái cây', quantity: 0.8, unit: 'kg', minimum: 2, unitCost: 120000, updatedAt: 'Hôm nay, 08:45' },
  { id: 'almond', name: 'Bột hạnh nhân', category: 'Nguyên liệu khô', quantity: 1.5, unit: 'kg', minimum: 2, unitCost: 180000, updatedAt: 'Hôm qua, 16:10' },
  { id: 'flour', name: 'Bột mì số 11', category: 'Nguyên liệu khô', quantity: 12, unit: 'kg', minimum: 5, unitCost: 32000, updatedAt: 'Hôm qua, 15:30' },
  { id: 'butter', name: 'Bơ lạt', category: 'Sữa & kem', quantity: 4.5, unit: 'kg', minimum: 2, unitCost: 210000, updatedAt: 'Hôm qua, 14:05' },
  { id: 'chocolate', name: 'Chocolate đen 70%', category: 'Chocolate', quantity: 0, unit: 'kg', minimum: 1, unitCost: 265000, updatedAt: '14/10/2026, 11:30' },
  { id: 'sugar', name: 'Đường cát trắng', category: 'Nguyên liệu khô', quantity: 8, unit: 'kg', minimum: 3, unitCost: 24000, updatedAt: '13/10/2026, 17:15' },
]

export const sampleOrders = [
  {
    id: '#WA-1028', customer: 'Nguyễn Minh Anh', phone: '0901 234 567', date: '15/10/2026', time: '09:42',
    total: 490000, paymentMethod: 'Chuyển khoản', paymentStatus: 'Đã thanh toán', status: 'Đang chuẩn bị',
    note: 'Viết lời chúc mừng sinh nhật', items: [{ name: 'Bánh kem dâu tây', quantity: 1, price: 420000 }, { name: 'Macaron hoa hồng', quantity: 2, price: 35000 }],
  },
  {
    id: '#WA-1027', customer: 'Trần Hoài Thu', phone: '0902 345 678', date: '15/10/2026', time: '09:18',
    total: 285000, paymentMethod: 'Tiền mặt', paymentStatus: 'Đã thanh toán', status: 'Hoàn tất',
    note: '', items: [{ name: 'Tiramisu cổ điển', quantity: 3, price: 95000 }],
  },
  {
    id: '#WA-1026', customer: 'Lê Khánh Linh', phone: '0903 456 789', date: '15/10/2026', time: '08:56',
    total: 630000, paymentMethod: 'Chuyển khoản', paymentStatus: 'Chưa thanh toán', status: 'Chờ xác nhận',
    note: 'Khách nhận bánh lúc 13:00', items: [{ name: 'Bánh kem dâu tây', quantity: 1, price: 420000 }, { name: 'Croissant bơ Pháp', quantity: 5, price: 42000 }],
  },
  {
    id: '#WA-1025', customer: 'Phạm Gia Hân', phone: '0904 567 890', date: '15/10/2026', time: '08:31',
    total: 162000, paymentMethod: 'Tiền mặt', paymentStatus: 'Đã thanh toán', status: 'Hoàn tất',
    note: '', items: [{ name: 'Cheesecake chanh vàng', quantity: 1, price: 75000 }, { name: 'Latte caramel', quantity: 1, price: 55000 }, { name: 'Cookie chocolate', quantity: 1, price: 32000 }],
  },
  {
    id: '#WA-1024', customer: 'Đỗ Ngọc Mai', phone: '0905 678 901', date: '14/10/2026', time: '17:20',
    total: 420000, paymentMethod: 'Chuyển khoản', paymentStatus: 'Đã thanh toán', status: 'Sẵn sàng',
    note: 'Đóng hộp quà', items: [{ name: 'Bánh kem dâu tây', quantity: 1, price: 420000 }],
  },
  {
    id: '#WA-1023', customer: 'Võ Thanh Tâm', phone: '0906 789 012', date: '14/10/2026', time: '16:42',
    total: 130000, paymentMethod: 'Tiền mặt', paymentStatus: 'Đã thanh toán', status: 'Đã hủy',
    note: '', items: [{ name: 'Su kem vanilla', quantity: 2, price: 28000 }, { name: 'Croissant bơ Pháp', quantity: 1, price: 42000 }, { name: 'Cookie chocolate', quantity: 1, price: 32000 }],
  },
]
