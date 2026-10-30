import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../../components/Button.jsx'
import Icon from '../../../components/Icon.jsx'
import LoadingState from '../../../components/LoadingState.jsx'
import Modal from '../../../components/Modal.jsx'
import ReceiptModal from '../../../components/ReceiptModal.jsx'
import StatusBadge from '../../../components/StatusBadge.jsx'
import { apiRequest, getUserFacingErrorMessage } from '../../../services/apiClient.js'
import {
  createShopCustomOrder,
  getMyCustomOrders,
  payCustomOrderDeposit,
} from '../services/shopCustomOrderService.js'

const moneyFormat = new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 0,
})

function formatMoney(amount) {
  const num = Number(amount)
  return Number.isFinite(num) ? `${moneyFormat.format(num)} ₫` : '0 ₫'
}

const cakeSizes = [
  { id: '16cm', name: 'Size 16cm', people: '2 – 4 người', basePrice: 250000, desc: 'Tiệc nhỏ, gia đình' },
  { id: '18cm', name: 'Size 18cm', people: '4 – 6 người', basePrice: 320000, desc: 'Phổ biến nhất' },
  { id: '20cm', name: 'Size 20cm', people: '6 – 8 người', basePrice: 420000, desc: 'Sinh nhật nhóm bạn' },
  { id: '22cm', name: 'Size 22cm', people: '8 – 12 người', basePrice: 520000, desc: 'Tiệc đông người' },
  { id: '2tiers', name: 'Bánh 2 tầng', people: 'Tiệc lớn / Sự kiện', basePrice: 850000, desc: 'Cưới hỏi, thôi nôi' },
]

const cakeFlavors = [
  { id: 'vani', label: 'Vani truyền thống', tag: 'Dễ ăn nhất' },
  { id: 'socola', label: 'Socola Bỉ đậm vị', tag: 'Đậm đà' },
  { id: 'matcha', label: 'Matcha Nhật Bản', tag: 'Thanh mát' },
  { id: 'redvelvet', label: 'Red Velvet nhung đỏ', tag: 'Sang trọng' },
  { id: 'bap', label: 'Bông lan bắp phô mai', tag: 'Mới lạ' },
]

const creamFillings = [
  { id: 'whipping', label: 'Whipping Cream Pháp', tag: 'Mịn béo thanh' },
  { id: 'cheese', label: 'Cream Cheese béo ngậy', tag: 'Chua béo nhẹ' },
  { id: 'butter', label: 'Kem bơ sữa tươi', tag: 'Đứng form tốt' },
  { id: 'strawberry', label: 'Mứt dâu tây tươi', tag: 'Chua ngọt' },
  { id: 'mango', label: 'Sốt xoài chanh leo', tag: 'Nhiệt đới' },
]

const statusLabels = {
  PENDING: 'Chờ xác nhận & cọc',
  CONFIRMED: 'Đã nhận đơn & cọc',
  IN_PROGRESS: 'Thợ đang làm bánh',
  COMPLETED: 'Bánh hoàn tất',
  CANCELLED: 'Đã hủy',
}

const inputClass =
  'h-11 w-full rounded-xl border border-[#DDCDB8] bg-white px-3.5 text-sm text-[#4A302B] outline-none transition placeholder:text-[#A89890] focus:border-[#76534D] focus:ring-1 focus:ring-[#76534D]'

export default function ShopCustomOrderPage() {
  const [activeTab, setActiveTab] = useState('create') // 'create' | 'history'
  const [currentStep, setCurrentStep] = useState(1) // 1 | 2 | 3
  const [customerProfile, setCustomerProfile] = useState(null)
  const [accountInfo, setAccountInfo] = useState(null)
  const [myOrders, setMyOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [historyError, setHistoryError] = useState('')

  // Step 1: Bánh & Hương vị
  const [cakeName, setCakeName] = useState('')
  const [selectedSize, setSelectedSize] = useState('18cm')
  const [selectedFlavor, setSelectedFlavor] = useState(cakeFlavors[0].label)
  const [selectedFilling, setSelectedFilling] = useState(creamFillings[0].label)

  // Step 2: Trang trí & Thông điệp
  const [cakeMessage, setCakeMessage] = useState('')
  const [referenceImageUrl, setReferenceImageUrl] = useState('')
  const [requestDescription, setRequestDescription] = useState('')

  // Step 3: Nhận bánh & Đặt cọc
  const [deliveryDate, setDeliveryDate] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState('pickup') // 'pickup' | 'delivery'
  const [depositPaymentMethod, setDepositPaymentMethod] = useState('VNPAY') // 'VNPAY' | 'CASH'

  // Modal VNPay Card Sandbox
  const [vnPayModalOpen, setVnPayModalOpen] = useState(false)
  const [vnPayProcessing, setVnPayProcessing] = useState(false)
  const [vnPayError, setVnPayError] = useState('')
  const [vnPayTargetOrder, setVnPayTargetOrder] = useState(null) // Order to pay deposit for
  const [vnPayCardNumber, setVnPayCardNumber] = useState('9704198526191432198')
  const [vnPayCardHolder, setVnPayCardHolder] = useState('NGUYEN VAN A')
  const [vnPayIssueDate, setVnPayIssueDate] = useState('07/15')
  const [vnPayOtp, setVnPayOtp] = useState('123456')

  // Hoàn tất đơn & In hóa đơn
  const [completedOrder, setCompletedOrder] = useState(null)
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [activeReceiptOrder, setActiveReceiptOrder] = useState(null)

  // Load customer profile or fallback to account info
  useEffect(() => {
    apiRequest('/customer/profile')
      .then((data) => {
        setCustomerProfile(data)
        if (data) {
          setRecipientName((prev) => prev || data.fullName || '')
          setRecipientPhone((prev) => prev || data.phone || '')
          setDeliveryAddress((prev) => prev || data.address || '')
        }
      })
      .catch(() => {
        // Fallback for staff or admin accounts
        apiRequest('/auth/me')
          .then((acc) => {
            setAccountInfo(acc)
            if (acc) {
              setRecipientName((prev) => prev || acc.username || '')
            }
          })
          .catch(() => {
            // Guest unauthenticated
          })
      })
  }, [])

  // Calculate price & deposit
  const selectedSizeObj = useMemo(() => {
    return cakeSizes.find((s) => s.id === selectedSize) || cakeSizes[1]
  }, [selectedSize])

  const estimatedPrice = selectedSizeObj.basePrice
  const depositAmount = Math.round(estimatedPrice * 0.5)

  // Min delivery date (from tomorrow)
  const minDeliveryDate = useMemo(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)
    return tomorrow.toISOString().slice(0, 16)
  }, [])

  // Load history orders
  const loadHistory = async () => {
    setLoadingOrders(true)
    setHistoryError('')
    try {
      const orders = await getMyCustomOrders()
      setMyOrders(Array.isArray(orders) ? orders : [])
    } catch (err) {
      if (err.status === 401) {
        setHistoryError('Vui lòng đăng nhập tài khoản khách hàng để xem danh sách đơn đặt bánh riêng của bạn.')
      } else {
        setHistoryError(getUserFacingErrorMessage(err, 'Chưa thể tải lịch sử đặt bánh riêng.'))
      }
    } finally {
      setLoadingOrders(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'history') {
      void loadHistory()
    }
  }, [activeTab])

  // Stepper Handlers
  const handleNextToStep2 = (e) => {
    e.preventDefault()
    setFormError('')
    if (!cakeName.trim()) {
      setFormError('Vui lòng nhập tên hoặc chủ đề chiếc bánh bạn muốn đặt.')
      return
    }
    setCurrentStep(2)
    window.scrollTo({ top: 150, behavior: 'smooth' })
  }

  const handleNextToStep3 = (e) => {
    e.preventDefault()
    setFormError('')
    setCurrentStep(3)
    window.scrollTo({ top: 150, behavior: 'smooth' })
  }

  // Build full description text
  const buildDescription = () => {
    const finalAddress =
      deliveryMethod === 'delivery'
        ? deliveryAddress.trim()
        : 'Nhận trực tiếp tại cửa hàng WA Patisserie (123 Đường Bánh Ngọt)'

    return [
      `Kích thước: ${selectedSizeObj.name} (${selectedSizeObj.people})`,
      `Cốt bánh: ${selectedFlavor}`,
      `Kem & Nhân: ${selectedFilling}`,
      cakeMessage.trim() ? `Chữ viết lên bánh: "${cakeMessage.trim()}"` : null,
      referenceImageUrl.trim() ? `Ảnh mẫu tham khảo: ${referenceImageUrl.trim()}` : null,
      requestDescription.trim() ? `Yêu cầu chi tiết: ${requestDescription.trim()}` : null,
      `--- THÔNG TIN NHẬN BÁNH ---`,
      `Người nhận: ${recipientName.trim()}`,
      `SĐT người nhận: ${recipientPhone.trim()}`,
      `Hình thức nhận: ${deliveryMethod === 'delivery' ? 'Giao tận nơi' : 'Nhận tại tiệm'}`,
      `Địa chỉ nhận: ${finalAddress}`,
      depositPaymentMethod === 'VNPAY'
        ? 'Phương thức cọc: Thẻ VNPay Sandbox (NCB)'
        : 'Phương thức cọc: Tiền mặt / Chuyển khoản sau',
    ]
      .filter(Boolean)
      .join('\n')
  }

  const validateStep3 = () => {
    if (!deliveryDate) {
      setFormError('Vui lòng chọn ngày và giờ hẹn nhận bánh.')
      return false
    }
    if (!recipientName.trim()) {
      setFormError('Vui lòng nhập họ và tên người nhận bánh.')
      return false
    }
    if (!recipientPhone.trim()) {
      setFormError('Vui lòng nhập số điện thoại người nhận để tiệm liên hệ.')
      return false
    }
    if (deliveryMethod === 'delivery' && !deliveryAddress.trim()) {
      setFormError('Vui lòng nhập địa chỉ cụ thể để tiệm giao bánh đến tận nơi.')
      return false
    }
    return true
  }

  // Handle Submit Order
  const handleInitiateSubmit = (e) => {
    e.preventDefault()
    setFormError('')

    if (!validateStep3()) return

    if (depositPaymentMethod === 'VNPAY') {
      // Mở modal xác nhận thanh toán thẻ VNPay
      setVnPayTargetOrder(null)
      setVnPayError('')
      setVnPayModalOpen(true)
    } else {
      // Đặt cọc sau (Cash / Chuyển khoản)
      void submitOrderDirect(false)
    }
  }

  // Direct Submission (Cash / Pay Later)
  const submitOrderDirect = async (isVnPay) => {
    setSubmitting(true)
    setFormError('')
    try {
      const payload = {
        customerId: customerProfile?.id || null,
        employeeId: null,
        cakeName: cakeName.trim(),
        requestDescription: buildDescription(),
        deliveryDate: new Date(deliveryDate).toISOString().slice(0, 19),
        estimatedPrice,
        deposit: depositAmount,
      }

      const created = await createShopCustomOrder(payload)
      setCompletedOrder({
        ...created,
        paymentMethodUsed: isVnPay ? 'VNPAY' : 'CASH',
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        deliveryAddress:
          deliveryMethod === 'delivery' ? deliveryAddress.trim() : 'Nhận trực tiếp tại cửa hàng',
      })
    } catch (err) {
      if (err.status === 401) {
        setFormError('Vui lòng đăng nhập tài khoản khách hàng để gửi đơn đặt bánh theo yêu cầu.')
      } else {
        setFormError(getUserFacingErrorMessage(err, 'Chưa thể gửi đơn đặt bánh. Vui lòng thử lại.'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  // VNPay Sandbox Card Payment Confirmation
  const handleConfirmVnPayPayment = async () => {
    setVnPayProcessing(true)
    setVnPayError('')

    if (!vnPayCardNumber.trim() || !vnPayCardHolder.trim()) {
      setVnPayError('Vui lòng nhập đầy đủ số thẻ và tên chủ thẻ.')
      setVnPayProcessing(false)
      return
    }

    try {
      let targetId = vnPayTargetOrder?.id

      // Nếu đang thanh toán đơn mới từ form tạo
      if (!targetId) {
        const payload = {
          customerId: customerProfile?.id || null,
          employeeId: null,
          cakeName: cakeName.trim(),
          requestDescription: buildDescription(),
          deliveryDate: new Date(deliveryDate).toISOString().slice(0, 19),
          estimatedPrice,
          deposit: depositAmount,
        }
        const created = await createShopCustomOrder(payload)
        targetId = created.id
      }

      // Xác nhận thanh toán cọc thành công qua VNPay
      const confirmed = await payCustomOrderDeposit(targetId, 'VNPAY')

      setVnPayModalOpen(false)
      setCompletedOrder({
        ...confirmed,
        paymentMethodUsed: 'VNPAY',
        recipientName: recipientName.trim() || customerProfile?.fullName || accountInfo?.username || 'Khách hàng',
        recipientPhone: recipientPhone.trim() || customerProfile?.phone || '',
        deliveryAddress:
          deliveryMethod === 'delivery'
            ? deliveryAddress.trim()
            : 'Nhận trực tiếp tại cửa hàng WA Patisserie (123 Đường Bánh Ngọt)',
      })

      // Nếu thanh toán cho đơn từ lịch sử, làm mới danh sách
      if (activeTab === 'history') {
        void loadHistory()
      }
    } catch (err) {
      if (err.status === 401) {
        setVnPayError('Vui lòng đăng nhập tài khoản khách hàng để thanh toán cọc đơn đặt bánh.')
      } else {
        setVnPayError(
          getUserFacingErrorMessage(err, 'Chưa thể hoàn tất thanh toán cọc VNPay. Vui lòng kiểm tra lại.')
        )
      }
    } finally {
      setVnPayProcessing(false)
    }
  }

  // Quick fill test card
  const handleQuickFillNcb = () => {
    setVnPayCardNumber('9704198526191432198')
    setVnPayCardHolder('NGUYEN VAN A')
    setVnPayIssueDate('07/15')
    setVnPayOtp('123456')
  }

  // Format printable receipt order structure
  const printableReceiptData = useMemo(() => {
    const o = activeReceiptOrder || completedOrder
    if (!o) return null

    return {
      orderCode: `CB-${o.id}`,
      orderDate: o.orderDate || new Date().toISOString(),
      customerName: o.recipientName || recipientName || customerProfile?.fullName || 'Khách đặt bánh riêng',
      customerPhone: o.recipientPhone || recipientPhone || customerProfile?.phone || '',
      deliveryAddress:
        o.deliveryAddress ||
        (deliveryMethod === 'delivery' ? deliveryAddress : 'Nhận trực tiếp tại tiệm'),
      employeeName: 'Xưởng bánh WA Patisserie',
      status: o.status || 'CONFIRMED',
      items: [
        {
          productName: `Bánh riêng: ${o.cakeName}`,
          quantity: 1,
          unitPrice: o.estimatedPrice,
          lineTotal: o.estimatedPrice,
        },
      ],
      totalAmount: o.estimatedPrice,
      discountAmount: 0,
      finalAmount: o.estimatedPrice,
      deposit: o.deposit,
    }
  }, [activeReceiptOrder, completedOrder, recipientName, recipientPhone, deliveryMethod, deliveryAddress, customerProfile])

  // Open receipt for a specific order
  const handleOpenReceipt = (order) => {
    setActiveReceiptOrder(order)
    setReceiptModalOpen(true)
  }

  // Reset form to start a new order
  const handleStartNewOrder = () => {
    setCompletedOrder(null)
    setCurrentStep(1)
    setCakeName('')
    setCakeMessage('')
    setRequestDescription('')
    setReferenceImageUrl('')
    setDeliveryDate('')
    setFormError('')
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      {/* Banner Đặt Bánh Thủ Công Chuyên Nghiệp (Phù hợp đồ án Tiệm Bánh Ngọt) */}
      <div className="relative mb-6 overflow-hidden rounded-3xl border border-[#EAE3DA] shadow-sm">
        {/* Background photo & Warm gradient overlay */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1400&q=85"
            alt="Bánh kem thủ công WA Patisserie"
            className="h-full w-full object-cover object-[right_center]"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
          {/* Lớp phủ chuyển sắc mềm mại: Bên trái nền sáng làm nổi bật chữ, bên phải để lộ ảnh bánh */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#FFF9F2] via-[#FFF9F2]/95 via-50% to-[#FFF9F2]/25" />
        </div>

        {/* Nội dung Banner */}
        <div className="relative z-10 flex flex-col justify-between gap-5 p-5 sm:flex-row sm:items-center sm:p-6 lg:p-7">
          <div className="max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8D9D5] bg-[#FAF0EE] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#76534D]">
                🎂 Tiệm Bánh WA Patisserie
              </span>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                ✓ Thiết kế theo mẫu yêu cầu
              </span>
            </div>

            <h1 className="font-display mt-2 text-2xl font-bold tracking-tight text-[#4A302B] sm:text-3xl">
              Đặt Bánh Riêng Cho Bạn
            </h1>


            {/* Feature tags */}
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[#675650]">
              <span className="inline-flex items-center gap-1 rounded-lg border border-[#EAE3DA] bg-white/85 px-2.5 py-1 font-medium shadow-2xs backdrop-blur-xs">
                🍰 5 vị bánh cốt mềm
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg border border-[#EAE3DA] bg-white/85 px-2.5 py-1 font-medium shadow-2xs backdrop-blur-xs">
                ✨ Vẽ chữ & kem theo mẫu
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg border border-[#EAE3DA] bg-white/85 px-2.5 py-1 font-medium shadow-2xs backdrop-blur-xs">
                💳 Cọc 50% qua thẻ VNPay
              </span>
            </div>
          </div>

          {/* Chuyển Tab */}
          <div className="flex shrink-0 self-start sm:self-center gap-1.5 rounded-2xl border border-[#EAE3DA] bg-white/90 p-1.5 shadow-xs backdrop-blur-sm">
            <button
              type="button"
              onClick={() => {
                setActiveTab('create')
                setFormError('')
                setHistoryError('')
              }}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${activeTab === 'create'
                  ? 'bg-[#76534D] text-white shadow-sm'
                  : 'text-[#76534D] hover:bg-[#FAF0EE]'
                }`}
            >
              ✏️ Tạo đơn đặt bánh
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('history')
                setFormError('')
                setHistoryError('')
              }}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${activeTab === 'history'
                  ? 'bg-[#76534D] text-white shadow-sm'
                  : 'text-[#76534D] hover:bg-[#FAF0EE]'
                }`}
            >
              📋 Đơn của tôi
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'create' ? (
        <div className="mt-6">
          {/* MÀN HÌNH HOÀN TẤT ĐƠN & THANH TOÁN CỌC THÀNH CÔNG */}
          {completedOrder ? (
            <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-md sm:p-8">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
                  <Icon name="check" size={32} />
                </div>
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
                  {completedOrder.paymentMethodUsed === 'VNPAY'
                    ? '✓ ĐÃ THANH TOÁN CỌC VNPAY THÀNH CÔNG'
                    : '✓ ĐÃ GỬI ĐƠN ĐẶT BÁNH THÀNH CÔNG'}
                </span>
                <h2 className="font-display mt-2 text-2xl font-bold text-[#4A302B]">
                  Cảm ơn bạn đã đặt bánh tại WA Patisserie!
                </h2>
                <p className="mt-1 text-xs text-[#806B65] max-w-md">
                  {completedOrder.paymentMethodUsed === 'VNPAY'
                    ? `Đơn đặt bánh #${completedOrder.id} đã được xác nhận cọc qua Cổng VNPay Sandbox và chuyển đến thợ làm bánh.`
                    : `Đơn đặt bánh #${completedOrder.id} đã được lưu. Tiệm sẽ gọi điện xác nhận và hướng dẫn thanh toán cọc trong ít phút.`}
                </p>
              </div>

              {/* Chi tiết đơn đã đặt */}
              <div className="mt-6 rounded-2xl border border-[#EAE3DA] bg-[#FCF9F3] p-5 text-xs text-[#675650] sm:p-6">
                <div className="flex items-center justify-between border-b border-[#EAE3DA] pb-3">
                  <div>
                    <span className="text-[11px] text-[#806B65]">Mã đơn bánh riêng:</span>
                    <strong className="block text-sm text-[#4A302B]">#{completedOrder.id}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-[#806B65]">Trạng thái:</span>
                    <div>
                      <StatusBadge
                        status={statusLabels[completedOrder.status] ?? completedOrder.status}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <span className="text-[#806B65]">Tên bánh:</span>
                    <p className="font-bold text-[#4A302B] text-sm">{completedOrder.cakeName}</p>
                  </div>
                  <div>
                    <span className="text-[#806B65]">Thời gian hẹn nhận:</span>
                    <p className="font-semibold text-[#4A302B]">
                      {completedOrder.deliveryDate
                        ? new Date(completedOrder.deliveryDate).toLocaleString('vi-VN')
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[#806B65]">Người nhận:</span>
                    <p className="font-medium text-[#4A302B]">
                      {completedOrder.recipientName} ({completedOrder.recipientPhone})
                    </p>
                  </div>
                  <div>
                    <span className="text-[#806B65]">Địa chỉ / Hình thức:</span>
                    <p className="font-medium text-[#4A302B]">{completedOrder.deliveryAddress}</p>
                  </div>
                </div>

                {/* Bảng chi tiết tiền */}
                <div className="mt-5 rounded-xl border border-[#E8D9D5] bg-white p-4">
                  <div className="flex justify-between py-1">
                    <span>Tổng giá trị bánh ước tính:</span>
                    <span className="font-bold text-[#4A302B]">
                      {formatMoney(completedOrder.estimatedPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 text-emerald-700">
                    <span>
                      Tiền cọc (50%){' '}
                      {completedOrder.paymentMethodUsed === 'VNPAY'
                        ? '– Đã thanh toán Thẻ VNPay:'
                        : '– Chưa thu (Tiền mặt/Chuyển khoản):'}
                    </span>
                    <span className="font-bold">
                      {completedOrder.paymentMethodUsed === 'VNPAY' ? '✓ ' : ''}
                      {formatMoney(completedOrder.deposit)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-[#EAE3DA] pt-2 mt-1 font-bold text-sm text-[#76534D]">
                    <span>Số tiền còn lại thu khi nhận bánh:</span>
                    <span>
                      {formatMoney(completedOrder.estimatedPrice - completedOrder.deposit)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Các nút hành động chính */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button
                  onClick={() => {
                    setActiveReceiptOrder(completedOrder)
                    setReceiptModalOpen(true)
                  }}
                  className="px-5 h-11"
                >
                  <Icon name="check" size={16} />
                  🖨️ In biên lai đặt cọc
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setActiveTab('history')
                    setCompletedOrder(null)
                  }}
                  className="px-5 h-11"
                >
                  📋 Xem danh sách đơn của bạn
                </Button>
                <button
                  type="button"
                  onClick={handleStartNewOrder}
                  className="rounded-xl border border-[#DDCDB8] bg-white px-4 py-2.5 text-xs font-semibold text-[#76534D] transition hover:bg-[#FAF0EE]"
                >
                  ➕ Đặt thêm bánh khác
                </button>
              </div>
            </div>
          ) : (
            /* ================= FORM 3 BƯỚC ĐẶT BÁNH ================= */
            <>
              {/* Thanh tiến trình 3 bước (Stepper) */}
              <div className="mb-8 grid grid-cols-3 gap-2 text-center">
                {[
                  { num: 1, label: 'Chọn bánh & vị' },
                  { num: 2, label: 'Yêu cầu trang trí' },
                  { num: 3, label: 'Thời gian, Nhận bánh & Cọc' },
                ].map((step) => {
                  const isActive = currentStep === step.num
                  const isDone = currentStep > step.num
                  return (
                    <div
                      key={step.num}
                      className={`rounded-xl border p-2.5 transition sm:p-3 ${isActive
                          ? 'border-[#76534D] bg-[#FAF0EE] text-[#4A302B]'
                          : isDone
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                            : 'border-[#EAE3DA] bg-white text-[#A89890]'
                        }`}
                    >
                      <div className="flex items-center justify-center gap-1.5 text-xs font-bold sm:text-sm">
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${isActive
                              ? 'bg-[#76534D] text-white'
                              : isDone
                                ? 'bg-emerald-600 text-white'
                                : 'bg-[#EAE3DA] text-[#675650]'
                            }`}
                        >
                          {isDone ? '✓' : step.num}
                        </span>
                        <span className="hidden sm:inline">{step.label}</span>
                      </div>
                      <span className="mt-1 block text-[10px] sm:hidden">{step.label}</span>
                    </div>
                  )
                })}
              </div>

              {formError && (
                <div
                  role="alert"
                  className="mb-6 rounded-xl border border-[#E2C5BF] bg-[#FAF0EE] p-3.5 text-xs text-[#914E46]"
                >
                  {formError}
                </div>
              )}

              {/* ==================== BƯỚC 1 ==================== */}
              {currentStep === 1 && (
                <form onSubmit={handleNextToStep2} className="space-y-6">
                  <div className="rounded-2xl border border-[#EAE3DA] bg-white p-5 shadow-sm sm:p-7">
                    <div className="mb-5">
                      <label className="block text-xs font-bold text-[#4A302B] uppercase tracking-wide">
                        Tên hoặc Chủ đề chiếc bánh <span className="text-[#914E46]">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={150}
                        value={cakeName}
                        onChange={(e) => setCakeName(e.target.value)}
                        placeholder="VD: Bánh sinh nhật dâu tây Hàn Quốc, Bánh kỷ niệm tông pastel..."
                        className={`${inputClass} mt-1.5`}
                        required
                      />
                    </div>

                    {/* Chọn Size dạng thẻ trực quan */}
                    <div className="mb-6">
                      <label className="block text-xs font-bold text-[#4A302B] uppercase tracking-wide mb-2.5">
                        Chọn kích thước bánh (Size)
                      </label>
                      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
                        {cakeSizes.map((size) => {
                          const isSelected = selectedSize === size.id
                          return (
                            <button
                              key={size.id}
                              type="button"
                              onClick={() => setSelectedSize(size.id)}
                              className={`flex flex-col justify-between rounded-xl border p-3 text-left transition ${isSelected
                                  ? 'border-[#76534D] bg-[#FAF0EE] shadow-sm ring-2 ring-[#76534D]'
                                  : 'border-[#EAE3DA] bg-white hover:border-[#DDCDB8]'
                                }`}
                            >
                              <div>
                                <span className="block text-xs font-bold text-[#4A302B]">{size.name}</span>
                                <span className="mt-0.5 block text-[10px] text-[#806B65]">{size.people}</span>
                              </div>
                              <span className="mt-3 block text-xs font-bold text-[#76534D]">
                                {formatMoney(size.basePrice)}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Chọn Vị cốt bánh */}
                    <div className="mb-6">
                      <label className="block text-xs font-bold text-[#4A302B] uppercase tracking-wide mb-2">
                        Chọn vị cốt bánh
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {cakeFlavors.map((flavor) => {
                          const isSelected = selectedFlavor === flavor.label
                          return (
                            <button
                              key={flavor.id}
                              type="button"
                              onClick={() => setSelectedFlavor(flavor.label)}
                              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${isSelected
                                  ? 'bg-[#76534D] text-white shadow-sm'
                                  : 'border border-[#DDCDB8] bg-white text-[#675650] hover:bg-[#FAF0EE]'
                                }`}
                            >
                              {flavor.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Chọn Kem phủ & Nhân */}
                    <div>
                      <label className="block text-xs font-bold text-[#4A302B] uppercase tracking-wide mb-2">
                        Chọn kem phủ & nhân bánh
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {creamFillings.map((cream) => {
                          const isSelected = selectedFilling === cream.label
                          return (
                            <button
                              key={cream.id}
                              type="button"
                              onClick={() => setSelectedFilling(cream.label)}
                              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${isSelected
                                  ? 'bg-[#76534D] text-white shadow-sm'
                                  : 'border border-[#DDCDB8] bg-white text-[#675650] hover:bg-[#FAF0EE]'
                                }`}
                            >
                              {cream.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Nút sang Bước 2 */}
                  <div className="flex items-center justify-between rounded-xl bg-white p-4 border border-[#EAE3DA]">
                    <div>
                      <span className="text-xs text-[#806B65]">Giá ước tính: </span>
                      <span className="font-bold text-[#76534D] text-base">{formatMoney(estimatedPrice)}</span>
                    </div>
                    <Button type="submit">Tiếp tục: Thêm trang trí →</Button>
                  </div>
                </form>
              )}

              {/* ==================== BƯỚC 2 ==================== */}
              {currentStep === 2 && (
                <form onSubmit={handleNextToStep3} className="space-y-6">
                  <div className="rounded-2xl border border-[#EAE3DA] bg-white p-5 shadow-sm sm:p-7 space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-[#4A302B] uppercase tracking-wide mb-1">
                        Chữ viết lên mặt bánh (Lời chúc)
                      </label>
                      <input
                        type="text"
                        maxLength={100}
                        value={cakeMessage}
                        onChange={(e) => setCakeMessage(e.target.value)}
                        placeholder="VD: Happy Birthday Mai Anh 20, Kỷ niệm 5 năm bên nhau..."
                        className={inputClass}
                      />
                      <p className="mt-1 text-[11px] text-[#806B65]">
                        Thợ bánh sẽ viết chữ bằng kem tươi hoặc socola sắc nét theo font chữ đẹp mắt.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#4A302B] uppercase tracking-wide mb-1">
                        Link ảnh mẫu bánh tham khảo (nếu có)
                      </label>
                      <input
                        type="url"
                        value={referenceImageUrl}
                        onChange={(e) => setReferenceImageUrl(e.target.value)}
                        placeholder="Dán link ảnh mẫu từ Pinterest, Google hoặc Facebook..."
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#4A302B] uppercase tracking-wide mb-1">
                        Mô tả chi tiết yêu cầu trang trí / Dị ứng thực phẩm
                      </label>
                      <textarea
                        rows={3}
                        value={requestDescription}
                        onChange={(e) => setRequestDescription(e.target.value)}
                        placeholder="VD: Tông màu chủ đạo là xanh pastel, nhiều quả dâu tây tươi xung quanh, vị ngọt dịu nhẹ, cho kèm nến số 20..."
                        className={`${inputClass} h-auto py-2.5`}
                      />
                    </div>
                  </div>

                  {/* Nút điều hướng */}
                  <div className="flex items-center justify-between rounded-xl bg-white p-4 border border-[#EAE3DA]">
                    <Button type="button" variant="secondary" onClick={() => setCurrentStep(1)}>
                      ← Quay lại bước 1
                    </Button>
                    <Button type="submit">Tiếp tục: Nhận bánh & Đặt cọc →</Button>
                  </div>
                </form>
              )}

              {/* ==================== BƯỚC 3 ==================== */}
              {currentStep === 3 && (
                <form onSubmit={handleInitiateSubmit} className="space-y-6">
                  {/* Box 1: Thời gian hẹn nhận bánh */}
                  <div className="rounded-2xl border border-[#EAE3DA] bg-white p-5 shadow-sm sm:p-7">
                    <h3 className="font-display text-base font-bold text-[#4A302B] mb-3">
                      1. Thời gian hẹn nhận bánh
                    </h3>
                    <div className="max-w-md">
                      <input
                        type="datetime-local"
                        min={minDeliveryDate}
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        className={inputClass}
                        required
                      />
                      <p className="mt-1.5 text-[11px] text-[#806B65]">
                        * Bánh riêng cần tối thiểu 24h để thợ bánh nướng cốt bánh và trang trí hoàn thiện.
                      </p>
                    </div>
                  </div>

                  {/* Box 2: Thông tin người nhận */}
                  <div className="rounded-2xl border border-[#EAE3DA] bg-white p-5 shadow-sm sm:p-7">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display text-base font-bold text-[#4A302B]">
                        2. Thông tin người nhận & Địa chỉ (Có thể chỉnh sửa)
                      </h3>
                      {customerProfile && (
                        <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-medium">
                          ✓ Đã điền sẵn từ tài khoản
                        </span>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold text-[#675650] mb-1">
                          Họ và tên người nhận <span className="text-[#914E46]">*</span>
                        </label>
                        <input
                          type="text"
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                          placeholder="Nhập tên người nhận bánh"
                          className={inputClass}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#675650] mb-1">
                          Số điện thoại nhận bánh <span className="text-[#914E46]">*</span>
                        </label>
                        <input
                          type="tel"
                          value={recipientPhone}
                          onChange={(e) => setRecipientPhone(e.target.value)}
                          placeholder="VD: 0912345678"
                          className={inputClass}
                          required
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-[#675650] mb-2">
                          Hình thức nhận bánh
                        </label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 text-xs text-[#4A302B] cursor-pointer">
                            <input
                              type="radio"
                              name="deliveryMethod"
                              value="pickup"
                              checked={deliveryMethod === 'pickup'}
                              onChange={() => setDeliveryMethod('pickup')}
                              className="accent-[#76534D]"
                            />
                            <span>Đến tiệm lấy bánh (123 Đường Bánh Ngọt)</span>
                          </label>
                          <label className="flex items-center gap-2 text-xs text-[#4A302B] cursor-pointer">
                            <input
                              type="radio"
                              name="deliveryMethod"
                              value="delivery"
                              checked={deliveryMethod === 'delivery'}
                              onChange={() => setDeliveryMethod('delivery')}
                              className="accent-[#76534D]"
                            />
                            <span>Giao bánh tận nơi</span>
                          </label>
                        </div>
                      </div>

                      {deliveryMethod === 'delivery' && (
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-[#675650] mb-1">
                            Địa chỉ giao bánh cụ thể <span className="text-[#914E46]">*</span>
                          </label>
                          <input
                            type="text"
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            placeholder="Số nhà, tên đường, phường, quận..."
                            className={inputClass}
                            required
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Box 3: Chọn phương thức đặt cọc */}
                  <div className="rounded-2xl border border-[#EAE3DA] bg-white p-5 shadow-sm sm:p-7">
                    <h3 className="font-display text-base font-bold text-[#4A302B] mb-3">
                      3. Phương thức thanh toán cọc tiền bánh (50%)
                    </h3>

                    <div className="space-y-3">
                      {/* Lựa chọn 1: VNPay (Khuyên dùng) */}
                      <label
                        className={`flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 transition ${depositPaymentMethod === 'VNPAY'
                            ? 'border-[#005BAA] bg-[#F0F7FF] ring-2 ring-[#005BAA]/30'
                            : 'border-[#EAE3DA] bg-white hover:border-[#DDCDB8]'
                          }`}
                      >
                        <input
                          type="radio"
                          name="depositPaymentMethod"
                          value="VNPAY"
                          checked={depositPaymentMethod === 'VNPAY'}
                          onChange={() => setDepositPaymentMethod('VNPAY')}
                          className="mt-1 accent-[#005BAA]"
                        />
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-bold text-sm text-[#005BAA]">
                              💳 Thẻ ATM / VNPay Sandbox (Cọc ngay {formatMoney(depositAmount)})
                            </span>
                            <span className="rounded-full bg-[#005BAA]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#005BAA]">
                              Khuyên dùng – Tự động xác nhận đơn
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-[#4A302B] leading-relaxed">
                            Mô phỏng thanh toán thẻ ATM nội địa (NCB) thử nghiệm trên cổng VNPay. Đơn bánh sẽ chuyển ngay sang trạng thái <strong>Đã nhận đơn & cọc</strong>.
                          </p>
                        </div>
                      </label>

                      {/* Lựa chọn 2: Tiền mặt / Chuyển khoản sau */}
                      <label
                        className={`flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 transition ${depositPaymentMethod === 'CASH'
                            ? 'border-[#76534D] bg-[#FAF0EE] ring-2 ring-[#76534D]/30'
                            : 'border-[#EAE3DA] bg-white hover:border-[#DDCDB8]'
                          }`}
                      >
                        <input
                          type="radio"
                          name="depositPaymentMethod"
                          value="CASH"
                          checked={depositPaymentMethod === 'CASH'}
                          onChange={() => setDepositPaymentMethod('CASH')}
                          className="mt-1 accent-[#76534D]"
                        />
                        <div className="flex-1">
                          <span className="font-bold text-sm text-[#4A302B]">
                            📞 Đặt cọc sau khi tiệm liên hệ (Tiền mặt / Chuyển khoản)
                          </span>
                          <p className="mt-1 text-xs text-[#806B65] leading-relaxed">
                            Nhân viên tiệm sẽ gọi điện chốt đơn và gửi thông tin STK để chuyển cọc trước khi làm bánh.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Box 4: Tóm tắt đơn bánh & Tiền cọc */}
                  <div className="rounded-2xl border border-[#DDCDB8] bg-[#FAF0EE]/60 p-5 sm:p-6 text-xs text-[#675650]">
                    <h4 className="font-bold text-[#4A302B] text-sm mb-3">Tóm tắt đơn đặt bánh:</h4>
                    <div className="space-y-1.5 border-b border-[#EAE3DA] pb-3">
                      <div className="flex justify-between">
                        <span>Mẫu bánh:</span>
                        <span className="font-semibold text-[#4A302B]">{cakeName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Kích thước:</span>
                        <span>
                          {selectedSizeObj.name} ({selectedSizeObj.people})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cốt bánh & Kem:</span>
                        <span>
                          {selectedFlavor} · {selectedFilling}
                        </span>
                      </div>
                      {cakeMessage && (
                        <div className="flex justify-between">
                          <span>Lời chúc:</span>
                          <span className="font-semibold text-[#76534D]">"{cakeMessage}"</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[#806B65]">Giá ước tính chiếc bánh:</span>
                        <span className="font-bold text-[#4A302B] text-sm">{formatMoney(estimatedPrice)}</span>
                      </div>
                      <div className="flex justify-between items-center text-emerald-800">
                        <span className="font-medium">Tiền đặt cọc cần thanh toán (50%):</span>
                        <span className="font-bold text-base">{formatMoney(depositAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[#806B65] text-[11px] pt-1 border-t border-dotted border-[#DDCDB8]">
                        <span>Số tiền còn lại thanh toán khi nhận bánh:</span>
                        <span className="font-semibold text-[#4A302B]">
                          {formatMoney(estimatedPrice - depositAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!customerProfile && !accountInfo && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
                      <span>💡 Bạn cần đăng nhập tài khoản khách hàng để gửi đơn đặt bánh và theo dõi tiến độ làm bánh.</span>
                      <Link
                        to="/shop/login"
                        state={{ from: { pathname: '/shop/custom-order' } }}
                        className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#76534D] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#4A302B]"
                      >
                        Đăng nhập ngay →
                      </Link>
                    </div>
                  )}

                  {/* Nút hành động */}
                  <div className="flex items-center justify-between rounded-xl bg-white p-4 border border-[#EAE3DA]">
                    <Button type="button" variant="secondary" onClick={() => setCurrentStep(2)}>
                      ← Quay lại bước 2
                    </Button>

                    <Button
                      type="submit"
                      disabled={submitting}
                      className={`px-6 h-11 text-sm ${depositPaymentMethod === 'VNPAY'
                          ? 'bg-[#005BAA] hover:bg-[#004785] text-white'
                          : ''
                        }`}
                    >
                      {submitting ? (
                        'Đang xử lý...'
                      ) : depositPaymentMethod === 'VNPAY' ? (
                        <>💳 Thanh toán cọc qua thẻ VNPay ({formatMoney(depositAmount)}) →</>
                      ) : (
                        '✓ Xác nhận & Gửi yêu cầu đặt bánh'
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      ) : (
        /* Tab Lịch sử đơn đặt bánh riêng */
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[#4A302B]">
              Lịch sử các đơn bánh đặt riêng của bạn
            </h2>
            <button
              type="button"
              onClick={loadHistory}
              disabled={loadingOrders}
              className="rounded-xl border border-[#DDCDB8] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#76534D] transition hover:bg-[#FAF0EE] disabled:opacity-50"
            >
              🔄 Làm mới
            </button>
          </div>

          {historyError && (
            <div
              role="alert"
              className="rounded-xl border border-[#E2C5BF] bg-[#FAF0EE] p-4 text-xs text-[#914E46] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <span>{historyError}</span>
              {historyError.includes('đăng nhập') && (
                <Link
                  to="/shop/login"
                  state={{ from: { pathname: '/shop/custom-order' } }}
                  className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#76534D] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#4A302B]"
                >
                  Đăng nhập ngay →
                </Link>
              )}
            </div>
          )}

          {loadingOrders ? (
            <LoadingState label="Đang tải danh sách đơn đặt bánh riêng..." className="py-12" />
          ) : myOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#DDCDB8] bg-white px-5 py-12 text-center">
              <p className="text-sm font-semibold text-[#4A302B]">Bạn chưa có đơn đặt bánh riêng nào.</p>
              <p className="mt-1 text-xs text-[#806B65]">Hãy gửi ý tưởng chiếc bánh của bạn ngay hôm nay!</p>
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className="mt-4 rounded-xl bg-[#76534D] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#4A302B]"
              >
                Tạo đơn đặt bánh mới
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myOrders.map((order) => (
                <article
                  key={order.id}
                  className="rounded-2xl border border-[#EAE3DA] bg-white p-5 shadow-sm transition hover:border-[#DDCDB8] sm:p-6"
                >
                  <div className="flex flex-col justify-between gap-3 border-b border-[#EAE3DA] pb-4 sm:flex-row sm:items-center">
                    <div>
                      <span className="text-xs text-[#806B65]">Mã đơn bánh riêng: #{order.id}</span>
                      <h3 className="font-display mt-0.5 text-base font-bold text-[#4A302B]">
                        {order.cakeName}
                      </h3>
                      <p className="text-[11px] text-[#806B65]">
                        Đặt lúc:{' '}
                        {order.orderDate
                          ? new Date(order.orderDate).toLocaleString('vi-VN')
                          : '—'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:text-right">
                      <span className="text-xs text-[#806B65]">Trạng thái:</span>
                      <StatusBadge status={statusLabels[order.status] ?? order.status} />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
                    <div>
                      <span className="text-[#806B65]">Ngày hẹn nhận bánh:</span>
                      <p className="font-semibold text-[#4A302B]">
                        {order.deliveryDate
                          ? new Date(order.deliveryDate).toLocaleString('vi-VN')
                          : 'Chưa xác định'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[#806B65]">Giá ước tính:</span>
                      <p className="font-semibold text-[#4A302B]">{formatMoney(order.estimatedPrice)}</p>
                    </div>
                    <div>
                      <span className="text-[#806B65]">Tiền cọc (50%):</span>
                      <p className="font-semibold text-emerald-700">{formatMoney(order.deposit)}</p>
                    </div>
                  </div>

                  {order.requestDescription && (
                    <div className="mt-4 rounded-xl bg-[#FCF9F3] p-3 text-xs leading-relaxed text-[#675650]">
                      <span className="font-semibold text-[#4A302B]">Chi tiết đơn: </span>
                      <p className="mt-1 whitespace-pre-wrap">{order.requestDescription}</p>
                    </div>
                  )}

                  {/* Nút hành động trong từng đơn */}
                  <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-[#EAE3DA] pt-3">
                    {order.status === 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => {
                          setVnPayTargetOrder(order)
                          setVnPayError('')
                          setVnPayModalOpen(true)
                        }}
                        className="rounded-xl bg-[#005BAA] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#004785]"
                      >
                        💳 Thanh toán cọc ngay (VNPay)
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenReceipt(order)}
                      className="rounded-xl border border-[#DDCDB8] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#76534D] transition hover:bg-[#FAF0EE]"
                    >
                      🖨️ In biên lai cọc
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL THANH TOÁN THẺ VNPAY SANDBOX */}
      <Modal
        open={vnPayModalOpen}
        onClose={() => !vnPayProcessing && setVnPayModalOpen(false)}
        title="Cổng Thanh Toán Thử Nghiệm VNPay (Sandbox)"
        size="max-w-md"
      >
        <div className="space-y-4 text-xs">
          {/* Header VNPay Mockup */}
          <div className="rounded-2xl border border-[#BCE1FD] bg-gradient-to-r from-[#F0F7FF] to-[#E6F2FE] p-4 text-[#005BAA]">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-base tracking-wider">VNPAY-QR / THẺ ATM</span>
              <span className="rounded-full bg-[#005BAA] px-2 py-0.5 text-[10px] font-bold text-white">
                SANDBOX DEMO
              </span>
            </div>
            <div className="mt-3 flex justify-between items-end">
              <div>
                <span className="block text-[11px] text-[#4A7BB0]">Số tiền cọc cần thanh toán:</span>
                <span className="text-xl font-extrabold text-[#D0021B]">
                  {formatMoney(vnPayTargetOrder ? vnPayTargetOrder.deposit : depositAmount)}
                </span>
              </div>
              <span className="text-[11px] text-[#4A7BB0] font-medium">Ngân hàng NCB</span>
            </div>
          </div>

          {vnPayError && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"
            >
              {vnPayError}
            </div>
          )}

          {/* Form Thẻ ATM Demo */}
          <div className="space-y-3 rounded-2xl border border-[#EAE3DA] bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#4A302B]">Thông tin thẻ thử nghiệm NCB</span>
              <button
                type="button"
                onClick={handleQuickFillNcb}
                className="text-[11px] font-semibold text-[#005BAA] hover:underline"
              >
                ⚡ Điền thẻ mặc định
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#675650] mb-1">
                Ngân hàng phát hành
              </label>
              <input
                type="text"
                readOnly
                value="NCB - Ngân hàng TMCP Quốc Dân (Demo Sandbox)"
                className="h-10 w-full rounded-xl border border-[#EAE3DA] bg-[#F7F4F0] px-3 text-xs text-[#675650] cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#675650] mb-1">
                Số thẻ ATM (19 số)
              </label>
              <input
                type="text"
                maxLength={24}
                value={vnPayCardNumber}
                onChange={(e) => setVnPayCardNumber(e.target.value)}
                placeholder="9704 1985 2619 1432 198"
                className="h-10 w-full rounded-xl border border-[#DDCDB8] px-3 font-mono text-xs text-[#4A302B] outline-none focus:border-[#005BAA]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#675650] mb-1">
                  Tên in trên thẻ
                </label>
                <input
                  type="text"
                  value={vnPayCardHolder}
                  onChange={(e) => setVnPayCardHolder(e.target.value.toUpperCase())}
                  placeholder="NGUYEN VAN A"
                  className="h-10 w-full rounded-xl border border-[#DDCDB8] px-3 text-xs uppercase text-[#4A302B] outline-none focus:border-[#005BAA]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#675650] mb-1">
                  Ngày phát hành (MM/YY)
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={vnPayIssueDate}
                  onChange={(e) => setVnPayIssueDate(e.target.value)}
                  placeholder="07/15"
                  className="h-10 w-full rounded-xl border border-[#DDCDB8] px-3 text-xs text-[#4A302B] outline-none focus:border-[#005BAA]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#675650] mb-1">
                Mã OTP xác thực (Sandbox)
              </label>
              <input
                type="text"
                maxLength={6}
                value={vnPayOtp}
                onChange={(e) => setVnPayOtp(e.target.value)}
                placeholder="123456"
                className="h-10 w-full rounded-xl border border-[#DDCDB8] px-3 font-mono text-xs tracking-widest text-[#4A302B] outline-none focus:border-[#005BAA]"
              />
            </div>
          </div>

          <p className="text-[11px] leading-relaxed text-[#806B65]">
            💡 Đây là môi trường thử nghiệm phục vụ đồ án tốt nghiệp theo tài liệu chính thức từ VNPay. Nhấn xác nhận để hoàn tất đặt cọc ngay lập tức mà không phát sinh chi phí thật.
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#EAE3DA]">
            <Button
              type="button"
              variant="secondary"
              disabled={vnPayProcessing}
              onClick={() => setVnPayModalOpen(false)}
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              disabled={vnPayProcessing}
              onClick={handleConfirmVnPayPayment}
              className="bg-[#005BAA] hover:bg-[#004785] text-white"
            >
              {vnPayProcessing ? (
                'Đang xác thực giao dịch...'
              ) : (
                <>Xác nhận thanh toán cọc {formatMoney(vnPayTargetOrder ? vnPayTargetOrder.deposit : depositAmount)}</>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL IN BIÊN LAI ĐẶT CỌC */}
      <ReceiptModal
        open={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        order={printableReceiptData}
        receiptTitle="BIÊN LAI ĐẶT CỌC BÁNH RIÊNG"
        customer={{
          fullName: printableReceiptData?.customerName,
          phone: printableReceiptData?.customerPhone,
        }}
        payment={{
          paymentMethod:
            completedOrder?.paymentMethodUsed === 'VNPAY' ||
              activeReceiptOrder?.requestDescription?.includes('VNPAY')
              ? 'VNPAY'
              : 'CASH',
          status: 'SUCCESS',
        }}
      />
    </section>
  )
}
