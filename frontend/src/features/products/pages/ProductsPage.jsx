import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Button from '../../../components/Button.jsx'
import DataTable from '../../../components/DataTable.jsx'
import Icon from '../../../components/Icon.jsx'
import Modal from '../../../components/Modal.jsx'
import PaginationControls from '../../../components/PaginationControls.jsx'
import { ProductArtwork } from '../components/ProductArtwork.jsx'
import StatusBadge from '../../../components/StatusBadge.jsx'
import { getCategories } from '../../categories/services/categoryService.js'
import { toProductRequest, toProductViewModel } from '../adapters/productAdapter.js'
import {
  createProduct,
  deactivateProduct,
  deleteProduct,
  getProductPage,
  uploadProductImage,
  updateProduct,
} from '../services/productService.js'
import { formatDate, getExpiryStatus, isExpiringWithinDays } from '../services/productExpiry.js'
import { getUserFacingErrorMessage } from '../../../services/apiClient.js'
import { exportToExcel } from '../../../utils/excelExport.js'
import { getIngredients, updateIngredient } from '../../inventory/services/ingredientService.js'

const currency = new Intl.NumberFormat('vi-VN')
const maxImageSize = 5 * 1024 * 1024
const acceptedImageTypes = new Map([
  ['jpg', 'image/jpeg'],
  ['jpeg', 'image/jpeg'],
  ['png', 'image/png'],
  ['webp', 'image/webp'],
])

const getTodayString = () => new Date().toISOString().slice(0, 10)

const emptyForm = {
  name: '',
  code: '',
  categoryId: '',
  price: '',
  stock: '',
  status: 'Đang bán',
  description: '',
  imageUrl: '',
  unit: '',
  createdAt: getTodayString(),
  expiryDate: '',
}
const inputClass = 'h-10 w-full rounded-xl border border-border bg-white px-3 text-xs text-rosewood outline-none transition placeholder:text-muted focus:border-caramel-hover'

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold text-rosewood">{label}</span>
      {children}
    </label>
  )
}

function getApiMessage(error) {
  return getUserFacingErrorMessage(error)
}

async function fetchCatalog({
  page = 0,
  size = 20,
  query = '',
  categoryId = '',
  status = '',
  sort = 'name',
  direction = 'ASC',
  signal,
} = {}) {
  const [categoryData, productData] = await Promise.all([
    getCategories({ signal }),
    getProductPage({
      page,
      size,
      keyword: query,
      categoryId,
      status,
      sort,
      direction,
      signal,
    }),
  ])
  if (!Array.isArray(categoryData)
      || !Array.isArray(productData?.content)
      || typeof productData.totalElements !== 'number'
      || typeof productData.totalPages !== 'number') {
    throw new Error('Chưa thể tải danh sách sản phẩm. Vui lòng thử lại.')
  }

  return {
    categories: categoryData,
    page: productData,
    products: productData.content.map(toProductViewModel),
  }
}

export default function ProductsPage({ onToast }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const editIdParam = searchParams.get('editId')
  const searchParam = searchParams.get('search')

  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [query, setQuery] = useState(searchParam || '')
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState('Tất cả trạng thái')
  const [sort, setSort] = useState('name')
  const [direction, setDirection] = useState('ASC')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(5)
  const [pageInfo, setPageInfo] = useState({ totalElements: 0, totalPages: 0 })
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')
  const [uploadedImageUrl, setUploadedImageUrl] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [discardTarget, setDiscardTarget] = useState(null)
  const [discardQty, setDiscardQty] = useState(1)
  const [discardReason, setDiscardReason] = useState('Quá hạn sử dụng')
  const [discardNote, setDiscardNote] = useState('')
  const [discardPerformer, setDiscardPerformer] = useState('Thu ngân quầy')
  const [disposalLogOpen, setDisposalLogOpen] = useState(false)
  const [disposalsHistory, setDisposalsHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('wa_cake_disposals')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Định lượng công thức bánh (Recipe / BOM) & Sản xuất mẻ mới
  const [bomModalOpen, setBomModalOpen] = useState(false)
  const [bomTargetProduct, setBomTargetProduct] = useState(null)
  const [bomTab, setBomTab] = useState('produce') // 'produce' | 'recipe'
  const [produceQty, setProduceQty] = useState(5)
  const [isBaking, setIsBaking] = useState(false)
  const [bakingError, setBakingError] = useState('')
  const [rawIngredients, setRawIngredients] = useState([])
  const [recipes, setRecipes] = useState(() => {
    try {
      const saved = localStorage.getItem('wa_cake_recipes')
      return saved ? JSON.parse(saved) : {
        default: [
          { name: 'Bột mì đa dụng (Meizan)', amount: 150, unit: 'g' },
          { name: 'Trứng gà tươi Ba Huân', amount: 2, unit: 'quả' },
          { name: 'Đường cát trắng Biên Hòa', amount: 80, unit: 'g' },
          { name: 'Bơ lạt Anchor (New Zealand)', amount: 60, unit: 'g' },
          { name: 'Sữa tươi thanh trùng', amount: 50, unit: 'ml' },
        ],
      }
    } catch {
      return {}
    }
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingProductId, setPendingProductId] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [formError, setFormError] = useState('')
  const [syncError, setSyncError] = useState('')

  useEffect(() => () => {
    if (imagePreviewUrl.startsWith('blob:')) URL.revokeObjectURL(imagePreviewUrl)
  }, [imagePreviewUrl])

  const loadCatalog = useCallback(async (signal) => {
    setIsLoading(true)
    setLoadError('')
    try {
      const catalog = await fetchCatalog({
        page,
        size: pageSize,
        query,
        categoryId,
        status: status === 'Tất cả trạng thái' ? '' : status === 'Đang bán',
        sort,
        direction,
        signal,
      })
      if (catalog.page.totalPages === 0 ? page > 0 : page >= catalog.page.totalPages) {
        setPage(catalog.page.totalPages === 0 ? 0 : catalog.page.totalPages - 1)
        return
      }
      setCategories(catalog.categories)
      setItems(catalog.products)
      setPageInfo(catalog.page)
    } catch (error) {
      if (signal?.aborted || error.name === 'AbortError') return
      setLoadError(getApiMessage(error))
    } finally {
      if (!signal?.aborted) setIsLoading(false)
    }
  }, [categoryId, direction, page, pageSize, query, sort, status])

  useEffect(() => {
    const controller = new AbortController()
    void loadCatalog(controller.signal)
    return () => controller.abort()
  }, [loadCatalog])

  const filteredItems = items

  const syncCatalog = async (requestedPage = page) => {
    setSyncError('')
    try {
      const catalog = await fetchCatalog({
        page: requestedPage,
        size: pageSize,
        query,
        categoryId,
        status: status === 'Tất cả trạng thái' ? '' : status === 'Đang bán',
        sort,
        direction,
      })
      if (catalog.page.totalPages === 0 ? requestedPage > 0 : requestedPage >= catalog.page.totalPages) {
        setPage(catalog.page.totalPages === 0 ? 0 : catalog.page.totalPages - 1)
        return
      }
      setPage(requestedPage)
      setCategories(catalog.categories)
      setItems(catalog.products)
      setPageInfo(catalog.page)
    } catch (error) {
      setSyncError(`Thao tác đã hoàn tất nhưng chưa thể làm mới danh sách. Vui lòng tải lại trang. ${getApiMessage(error)}`)
    }
  }

  const openCreate = () => {
    setImageFile(null)
    setImagePreviewUrl('')
    setUploadedImageUrl('')
    setEditing(null)
    setForm({
      ...emptyForm,
      createdAt: getTodayString(),
      categoryId: categories[0]?.id == null ? '' : String(categories[0].id),
    })
    setFormError('')
    setFormOpen(true)
  }

  const openEdit = (item) => {
    setImageFile(null)
    setImagePreviewUrl('')
    setUploadedImageUrl('')
    setEditing(item)
    setFormError('')
    setForm({
      name: item.name,
      code: item.code,
      categoryId: item.categoryId,
      price: String(item.price),
      stock: String(item.stock),
      status: item.status,
      description: item.description,
      imageUrl: item.imageUrl,
      unit: item.unit,
      createdAt: item.createdAt || getTodayString(),
      expiryDate: item.expiryDate || '',
    })
    setFormOpen(true)
  }

  // Tự động mở modal chỉnh sửa khi điều hướng từ chuông thông báo (URL chứa editId)
  useEffect(() => {
    if (!editIdParam || items.length === 0) return
    const target = items.find((item) => String(item.id) === String(editIdParam))
    if (target) {
      openEdit(target)
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.delete('editId')
          return next
        },
        { replace: true },
      )
    }
  }, [editIdParam, items, setSearchParams])

  // Mở modal lập phiếu xuất hủy bánh
  const openDiscardModal = (product) => {
    setDiscardTarget(product)
    setDiscardQty(product.stock || 1)
    setDiscardReason(isExpiringWithinDays(product.expiryDate, 0) ? 'Quá hạn sử dụng' : 'Bánh hỏng bảo quản')
    setDiscardNote('')
    setSyncError('')
  }

  // Xác nhận xuất hủy mẻ bánh quá hạn / hỏng (Thesis Feature 4)
  const confirmDiscard = async () => {
    if (!discardTarget) return
    setIsSaving(true)
    setSyncError('')
    try {
      const qtyToDiscard = Math.min(discardTarget.stock, Math.max(1, Number(discardQty) || 1))
      const remainingStock = Math.max(0, discardTarget.stock - qtyToDiscard)
      const payload = toProductRequest({
        ...discardTarget,
        stock: remainingStock,
        status: remainingStock === 0 ? 'Tạm ẩn' : discardTarget.status,
      })
      await updateProduct(discardTarget.id, payload)

      const loss = qtyToDiscard * Number(discardTarget.price || 0)
      const newSlip = {
        id: Date.now(),
        productCode: discardTarget.code,
        productName: discardTarget.name,
        quantity: qtyToDiscard,
        price: Number(discardTarget.price || 0),
        lossAmount: loss,
        reason: discardReason,
        note: discardNote.trim() || 'Xuất hủy bánh theo quy chuẩn an toàn thực phẩm',
        disposedAt: new Date().toISOString(),
        performer: discardPerformer || 'Nhân viên ca trực',
      }
      const updatedHistory = [newSlip, ...disposalsHistory]
      setDisposalsHistory(updatedHistory)
      try {
        localStorage.setItem('wa_cake_disposals', JSON.stringify(updatedHistory))
      } catch {
        // Safe localStorage
      }

      onToast?.(`Đã lập phiếu hủy ${qtyToDiscard} chiếc "${discardTarget.name}", tồn kho còn ${remainingStock}. Ghi nhận tổn thất ${currency.format(loss)}đ.`)
      setDiscardTarget(null)
      await syncCatalog()
    } catch (error) {
      setSyncError(`Không thể xuất hủy sản phẩm: ${getApiMessage(error)}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Mở modal BOM định lượng công thức & làm bánh
  const openBomModal = async (product) => {
    setBomTargetProduct(product)
    setProduceQty(5)
    setBakingError('')
    setBomTab('produce')
    setBomModalOpen(true)
    try {
      const ingredients = await getIngredients()
      setRawIngredients(Array.isArray(ingredients) ? ingredients : [])
    } catch {
      // Ignored if cannot load
    }
  }

  // Sản xuất mẻ mới & Tự động trừ nguyên liệu kho (Thesis Feature 2)
  const handleBakeProduct = async () => {
    if (!bomTargetProduct) return
    setIsBaking(true)
    setBakingError('')
    try {
      const qty = Math.max(1, Number(produceQty) || 1)
      const currentRecipe = recipes[bomTargetProduct.id] || recipes.default || []

      // 1. Kiểm tra tồn kho nguyên liệu và trừ kho
      let latestIngredients = rawIngredients
      if (latestIngredients.length === 0) {
        try {
          latestIngredients = await getIngredients()
          setRawIngredients(latestIngredients)
        } catch {
          // Use cached or proceed
        }
      }

      const deductions = []
      for (const item of currentRecipe) {
        const found = latestIngredients.find((ing) =>
          ing.name.toLowerCase().includes(item.name.toLowerCase().split(' ')[0])
          || item.name.toLowerCase().includes(ing.name.toLowerCase())
        )
        if (found) {
          const totalNeeded = (item.amount * qty) / (item.unit === 'g' || item.unit === 'ml' ? 1000 : 1)
          if (Number(found.stockQuantity ?? 0) < totalNeeded) {
            throw new Error(`Kho không đủ nguyên liệu "${found.name}". Cần ${totalNeeded.toFixed(2)} ${found.unit}, tồn kho chỉ còn ${found.stockQuantity} ${found.unit}.`)
          }
          deductions.push({
            ingredient: found,
            deductAmount: totalNeeded,
            remaining: Math.max(0, Number(found.stockQuantity) - totalNeeded),
          })
        }
      }

      // Cập nhật trừ kho nguyên liệu
      for (const d of deductions) {
        try {
          await updateIngredient(d.ingredient.id, {
            ...d.ingredient,
            stockQuantity: d.remaining,
          })
        } catch {
          // Soft catch
        }
      }

      // 2. Tăng tồn kho sản phẩm bánh và làm mới ngày sản xuất
      const newStock = Number(bomTargetProduct.stock || 0) + qty
      const today = getTodayString()
      const nextExp = new Date()
      nextExp.setDate(nextExp.getDate() + 3)
      const nextExpStr = nextExp.toISOString().slice(0, 10)

      const payload = toProductRequest({
        ...bomTargetProduct,
        stock: newStock,
        status: 'Đang bán',
        createdAt: today,
        expiryDate: nextExpStr,
      })
      await updateProduct(bomTargetProduct.id, payload)

      onToast?.(`🎉 Đã sản xuất thành công ${qty} chiếc "${bomTargetProduct.name}"! Tồn kho tăng lên ${newStock} chiếc và tự động trừ nguyên liệu tương ứng.`)
      setBomModalOpen(false)
      await syncCatalog()
    } catch (err) {
      setBakingError(getApiMessage(err))
    } finally {
      setIsBaking(false)
    }
  }

  // Xuất Excel danh sách bánh tồn kho & HSD (Thesis Feature 6)
  const handleExportProductsExcel = () => {
    if (items.length === 0) {
      onToast?.('Chưa có sản phẩm nào để xuất Excel.')
      return
    }
    const headers = [
      'Mã sản phẩm',
      'Tên bánh',
      'Danh mục',
      'Giá niêm yết (đ)',
      'Số lượng tồn',
      'Đơn vị tính',
      'Ngày sản xuất',
      'Hạn sử dụng',
      'Tình trạng HSD',
      'Trạng thái kinh doanh',
    ]
    const rows = items.map((p) => {
      const expiry = getExpiryStatus(p.expiryDate)
      return [
        p.code || `SP-${p.id}`,
        p.name || '',
        categoryMap.get(p.categoryId) || 'Bánh ngọt',
        p.price ?? 0,
        p.stock ?? 0,
        p.unit || 'Cái',
        formatDate(p.createdAt),
        formatDate(p.expiryDate),
        expiry.label,
        p.status || 'Đang bán',
      ]
    })
    exportToExcel({
      filename: `BaoCao_KhoBanh_WAPatisserie_${new Date().toISOString().slice(0, 10)}`,
      headers,
      rows,
    })
    onToast?.(`Đã xuất Excel danh sách ${items.length} sản phẩm thành công!`)
  }

  // Xuất Excel biên bản tiêu hủy bánh hết hạn / hỏng (Thesis Feature 4)
  const handleExportDisposalsExcel = () => {
    if (disposalsHistory.length === 0) {
      onToast?.('Chưa có phiếu xuất hủy nào trong sổ theo dõi.')
      return
    }
    const headers = [
      'Thời gian lập phiếu',
      'Mã bánh',
      'Tên sản phẩm bánh',
      'Số lượng hủy',
      'Đơn giá (đ)',
      'Tổng chi phí tổn thất (đ)',
      'Lý do tiêu hủy',
      'Người thực hiện',
      'Ghi chú',
    ]
    const rows = disposalsHistory.map((s) => [
      formatDate(s.disposedAt),
      s.productCode || '',
      s.productName || '',
      s.quantity,
      s.price,
      s.lossAmount,
      s.reason || 'Quá hạn sử dụng',
      s.performer || '',
      s.note || '',
    ])
    exportToExcel({
      filename: `BienBan_TieuHuyBanh_${new Date().toISOString().slice(0, 10)}`,
      headers,
      rows,
    })
    onToast?.(`Đã xuất Excel sổ theo dõi ${disposalsHistory.length} phiếu tiêu hủy bánh!`)
  }

  const chooseImage = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const extension = file.name.split('.').pop()?.toLowerCase()
    const expectedType = acceptedImageTypes.get(extension)
    if (!expectedType || (file.type && file.type !== expectedType)) {
      setFormError('Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP.')
      return
    }
    if (file.size > maxImageSize) {
      setFormError('Ảnh vượt quá dung lượng tối đa 5 MB.')
      return
    }

    setFormError('')
    setUploadedImageUrl('')
    setImageFile(file)
    setImagePreviewUrl(URL.createObjectURL(file))
  }

  const clearImageSelection = () => {
    setImageFile(null)
    setImagePreviewUrl('')
    setUploadedImageUrl('')
  }

  const closeProductForm = () => {
    if (isSaving) return
    setFormOpen(false)
    setEditing(null)
    clearImageSelection()
  }

  const saveProduct = async (event) => {
    event.preventDefault()
    const price = Number(form.price)
    const stock = Number(form.stock)
    if (!form.name.trim() || !form.code.trim() || !form.categoryId
      || form.price.trim() === '' || !Number.isFinite(price) || price < 0
      || form.stock.trim() === '' || !Number.isInteger(stock) || stock < 0) {
      setFormError('Nhập tên, mã, danh mục, giá không âm và số lượng nguyên không âm.')
      return
    }

    if (!form.createdAt) {
      setFormError('Vui lòng chọn ngày tạo sản phẩm.')
      return
    }

    if (!form.expiryDate) {
      setFormError('Vui lòng chọn ngày hết hạn (hạn sử dụng).')
      return
    }

    if (form.expiryDate < form.createdAt) {
      setFormError('Hạn sử dụng không được trước ngày tạo sản phẩm.')
      return
    }

    setIsSaving(true)
    setFormError('')
    let imageUrl = uploadedImageUrl || form.imageUrl
    let newlyUploadedImageUrl = ''
    try {
      if (imageFile && !uploadedImageUrl) {
        newlyUploadedImageUrl = await uploadProductImage(imageFile)
        imageUrl = newlyUploadedImageUrl
        setUploadedImageUrl(newlyUploadedImageUrl)
        setForm((current) => ({ ...current, imageUrl: newlyUploadedImageUrl }))
      }

      const payload = toProductRequest({ ...form, imageUrl })
      if (editing) {
        await updateProduct(editing.id, payload, editing.stock)
      } else {
        await createProduct(payload)
      }
      setFormOpen(false)
      setEditing(null)
      setForm(emptyForm)
      clearImageSelection()
      onToast(editing ? 'Đã cập nhật sản phẩm.' : 'Đã thêm sản phẩm.')
      await syncCatalog()
    } catch (error) {
      const retainedImageUrl = newlyUploadedImageUrl || uploadedImageUrl
      setFormError(retainedImageUrl
        ? `Ảnh đã tải lên thành công và URL đã được giữ lại. Không lưu được sản phẩm: ${getApiMessage(error)}`
        : getApiMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const toggleStatus = async (item) => {
    if (item.status === 'Tạm ẩn' && item.stock === 0) {
      setSyncError('Sản phẩm đã hết hàng; hãy cập nhật tồn kho trước khi mở bán.')
      return
    }
    if (item.status === 'Tạm ẩn' && !item.categoryId) {
      setSyncError('Không thể cập nhật sản phẩm vì dữ liệu chưa có danh mục hợp lệ.')
      return
    }

    setPendingProductId(item.id)
    setSyncError('')
    try {
      if (item.status === 'Đang bán') {
        await deactivateProduct(item.id)
      } else {
        await updateProduct(item.id, toProductRequest({
          name: item.name,
          code: item.code,
          categoryId: item.categoryId,
          price: String(item.price),
          stock: String(item.stock),
          status: 'Đang bán',
          description: item.description,
          imageUrl: item.imageUrl,
          unit: item.unit,
          createdAt: item.createdAt,
          expiryDate: item.expiryDate,
        }), item.stock)
      }
      onToast(`Đã cập nhật trạng thái sản phẩm "${item.name}".`)
      await syncCatalog()
    } catch (error) {
      setSyncError(`Không thể cập nhật trạng thái sản phẩm: ${getApiMessage(error)}`)
    } finally {
      setPendingProductId(null)
    }
  }

  const removeProduct = async () => {
    if (!deleteTarget) return

    setPendingProductId(deleteTarget.id)
    setSyncError('')
    try {
      await deleteProduct(deleteTarget.id)
      onToast(`Đã xóa sản phẩm "${deleteTarget.name}".`)
      setDeleteTarget(null)
      await syncCatalog()
    } catch (error) {
      setSyncError(`Không thể xóa sản phẩm: ${getApiMessage(error)}`)
      setDeleteTarget(null)
    } finally {
      setPendingProductId(null)
    }
  }

  const columns = [
    {
      key: 'product',
      label: 'Sản phẩm',
      render: (item) => (
        <div className="flex min-w-[205px] items-center gap-3">
          <ProductArtwork id={item.id} name={item.name} background={item.background} imageUrl={item.imageUrl} compact />
          <div>
            <p className="font-bold text-rosewood">{item.name}</p>
            <p className="mt-1 text-[10px] text-muted">{item.code}</p>
          </div>
        </div>
      ),
    },
    { key: 'category', label: 'Danh mục', render: (item) => <span className="whitespace-nowrap">{item.category || 'Chưa phân loại'}</span> },
    { key: 'price', label: 'Giá bán', render: (item) => <span className="whitespace-nowrap font-bold text-rosewood">{currency.format(item.price)}đ</span> },
    {
      key: 'stock',
      label: 'Tồn kho',
      render: (item) => (
        <span className={`whitespace-nowrap font-semibold ${item.stock === 0 ? 'text-danger' : item.stock <= 5 ? 'text-warning' : 'text-rosewood'}`}>
          {item.stock} {item.unit || 'chiếc'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Ngày tạo',
      render: (item) => (
        <span className="whitespace-nowrap text-xs text-rosewood">
          {formatDate(item.createdAt)}
        </span>
      ),
    },
    {
      key: 'expiryDate',
      label: 'Hạn sử dụng',
      render: (item) => {
        const info = getExpiryStatus(item.expiryDate)
        return (
          <div className="flex flex-col gap-1 min-w-[130px]">
            <span className="whitespace-nowrap text-xs font-medium text-rosewood">
              {formatDate(item.expiryDate)}
            </span>
            {item.expiryDate && (
              <span className={`inline-flex items-center gap-1 w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                info.status === 'expired'
                  ? 'border border-danger-line bg-danger-soft text-danger'
                  : info.status === 'expires_today'
                    ? 'border border-amber-300 bg-amber-100 text-amber-900 font-bold'
                    : info.status === 'expiring_1_day'
                      ? 'border border-amber-400 bg-amber-100 text-amber-900 font-bold animate-pulse'
                      : 'border border-border bg-paper text-muted'
              }`}>
                {info.isExpiringSoon && <Icon name="alert" size={11} />}
                {info.shortLabel}
              </span>
            )}
          </div>
        )
      },
    },
    { key: 'status', label: 'Trạng thái', render: (item) => <StatusBadge status={item.status} /> },
    {
      key: 'actions',
      label: 'Thao tác',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      render: (item) => (
        <div className="inline-flex items-center gap-1">
          <button type="button" title="Định lượng công thức & Làm bánh" onClick={() => openBomModal(item)} className="flex h-8 w-8 items-center justify-center rounded-lg text-amber-800 transition hover:bg-amber-100/70" aria-label={`BOM ${item.name}`}>
            <Icon name="sparkles" size={15} />
          </button>
          <button type="button" title="Xuất hủy mẻ bánh hỏng/hết hạn" onClick={() => openDiscardModal(item)} className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-700 transition hover:bg-rose-100/70" aria-label={`Xuất hủy ${item.name}`}>
            <Icon name="alert" size={15} />
          </button>
          <button type="button" aria-label={`Sửa ${item.name}`} disabled={pendingProductId !== null || isSaving} onClick={() => openEdit(item)} className="flex h-8 w-8 items-center justify-center rounded-lg text-rosewood transition hover:bg-petal disabled:opacity-50">
            <Icon name="edit" size={15} />
          </button>
          <button type="button" aria-label={item.status === 'Đang bán' ? `Ẩn ${item.name}` : `Mở bán ${item.name}`} disabled={pendingProductId !== null || isSaving} onClick={() => toggleStatus(item)} className="rounded-lg px-2 py-1.5 text-[10px] font-semibold text-rosewood transition hover:bg-petal disabled:opacity-50">
            {item.status === 'Đang bán' ? 'Ẩn' : 'Mở bán'}
          </button>
          <button type="button" aria-label={`Xóa ${item.name}`} disabled={pendingProductId !== null || isSaving} onClick={() => setDeleteTarget(item)} className="flex h-8 w-8 items-center justify-center rounded-lg text-danger transition hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-40">
            <Icon name="trash" size={15} />
          </button>
        </div>
      ),
    },
  ]

  const activeCount = items.filter((item) => item.status === 'Đang bán').length
  const lowStockCount = items.filter((item) => item.stock > 0 && item.stock <= 5).length
  const expiringItems = items.filter((item) => item.status === 'Đang bán' && isExpiringWithinDays(item.expiryDate, 1))

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="font-display text-[28px] text-rosewood sm:text-[32px]">Sản phẩm</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportProductsExcel}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-paper px-3.5 py-2.5 text-xs font-bold text-rosewood shadow-xs transition hover:border-caramel hover:text-caramel hover:bg-caramel-soft/40"
          >
            <Icon name="download" size={15} /> Xuất Excel kho ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setDisposalLogOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-paper px-3.5 py-2.5 text-xs font-bold text-rosewood shadow-xs transition hover:border-caramel hover:text-caramel hover:bg-caramel-soft/40"
          >
            📋 Sổ hủy bánh ({disposalsHistory.length})
          </button>
          <Button onClick={openCreate} disabled={isLoading || Boolean(loadError)}>
            <Icon name="plus" size={16} /> Thêm sản phẩm
          </Button>
        </div>
      </div>

      {syncError && <p role="alert" className="rounded-xl border border-warning-line bg-warning-soft px-4 py-3 text-xs text-rosewood">{syncError}</p>}

      {expiringItems.length > 0 && (
        <section role="alert" className="soft-shadow rounded-2xl border border-amber-300 bg-amber-50/90 p-4 sm:p-5">
          <div className="flex items-start gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-amber-900 shadow-sm">
              <Icon name="bell" size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-amber-950">
                  Thông báo hạn sử dụng: Có {expiringItems.length} sản phẩm sắp hết hạn trong 1 ngày!
                </h3>
                <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                  Cần xử lý gấp
                </span>
              </div>
              <p className="mt-1 text-xs text-amber-900/80 leading-5">
                Các sản phẩm dưới đây sắp hết hạn trong vòng 24 giờ hoặc đã tới hạn. Vui lòng kiểm tra kệ hàng, áp dụng khuyến mãi giảm giá hoặc lập kế hoạch hủy nếu quá hạn:
              </p>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {expiringItems.map((prod) => {
                  const status = getExpiryStatus(prod.expiryDate)
                  return (
                    <div
                      key={prod.id}
                      className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-300/80 bg-white px-3 py-2 text-xs text-amber-950 shadow-sm"
                    >
                      <span className="font-semibold text-rosewood">{prod.name}</span>
                      <span className="text-[10px] text-muted">({prod.code})</span>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        status.status === 'expired'
                          ? 'bg-danger-soft text-danger'
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        {status.shortLabel}
                      </span>
                      <span className="text-[11px] font-medium text-rosewood">
                        Tồn: <strong>{prod.stock}</strong> {prod.unit || 'chiếc'}
                      </span>
                      <div className="flex items-center gap-1 border-l border-border/80 pl-2">
                        <button
                          type="button"
                          onClick={() => openEdit(prod)}
                          className="rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-900 transition hover:bg-amber-100"
                        >
                          ✏️ Mẻ mới
                        </button>
                        <button
                          type="button"
                          onClick={() => openDiscardModal(prod)}
                          className="rounded-lg bg-danger-soft px-2 py-1 text-[11px] font-bold text-danger transition hover:bg-red-100"
                        >
                          🗑️ Xuất hủy
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {isLoading ? (
        <section role="status" className="soft-shadow rounded-2xl border border-border bg-paper px-5 py-16 text-center text-sm text-muted">
          Đang tải danh mục và sản phẩm...
        </section>
      ) : loadError ? (
        <section className="soft-shadow rounded-2xl border border-danger-line bg-paper px-5 py-12 text-center">
          <p role="alert" className="text-sm font-semibold text-danger">Không thể tải dữ liệu: {loadError}</p>
          <Button className="mt-4" variant="secondary" onClick={() => void loadCatalog()}>Thử tải lại</Button>
        </section>
      ) : (
        <>
          <section aria-label="Tổng quan sản phẩm" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Tổng sản phẩm', value: pageInfo.totalElements, icon: 'package' },
              { label: 'Đang kinh doanh', value: activeCount, icon: 'check' },
              { label: 'Tồn kho thấp (≤ 5)', value: lowStockCount, icon: 'receipt' },
              {
                label: 'Sắp hết hạn (≤ 1 ngày)',
                value: expiringItems.length,
                icon: 'bell',
                highlight: expiringItems.length > 0,
              },
            ].map((stat) => (
              <article
                key={stat.label}
                className={`soft-shadow flex items-center justify-between rounded-2xl border p-4 sm:p-5 ${
                  stat.highlight
                    ? 'border-amber-300 bg-amber-50/60'
                    : 'border-border bg-paper'
                }`}
              >
                <div>
                  <p className={`text-[11px] font-semibold ${stat.highlight ? 'text-amber-900' : 'text-muted'}`}>
                    {stat.label}
                  </p>
                  <p className={`font-display mt-2 text-2xl font-semibold ${
                    stat.highlight ? 'text-amber-950 font-bold' : 'text-rosewood'
                  }`}>
                    {stat.value}
                  </p>
                </div>
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  stat.highlight
                    ? 'bg-amber-200 text-amber-900'
                    : 'bg-caramel-soft text-rosewood'
                }`}>
                  <Icon name={stat.icon} size={18} />
                </span>
              </article>
            ))}
          </section>

          <section className="soft-shadow overflow-hidden rounded-2xl border border-border bg-paper">
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <h3 className="font-display text-lg font-semibold text-rosewood">Danh sách sản phẩm</h3>
                <p className="mt-1 text-[11px] text-muted">{pageInfo.totalElements} sản phẩm phù hợp</p>
              </div>
              <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2 xl:grid-cols-5">
                <label className="relative min-w-0 min-[480px]:col-span-1">
                  <span className="sr-only">Tìm sản phẩm</span>
                  <Icon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-rosewood" />
                  <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(0) }} placeholder="Tên hoặc mã..." className="h-10 w-full rounded-xl border border-border bg-white pl-9 pr-3 text-[11px] text-rosewood outline-none focus:border-caramel-hover" />
                </label>
                <select aria-label="Lọc danh mục" value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setPage(0) }} className="h-10 rounded-xl border border-border bg-white px-3 text-[11px] text-rosewood outline-none focus:border-caramel-hover">
                  <option value="">Tất cả danh mục</option>
                  {categories.map((item) => <option key={item.id} value={String(item.id)}>{item.name}</option>)}
                </select>
                <select aria-label="Lọc trạng thái sản phẩm" value={status} onChange={(event) => { setStatus(event.target.value); setPage(0) }} className="h-10 rounded-xl border border-border bg-white px-3 text-[11px] text-rosewood outline-none focus:border-caramel-hover">
                  <option>Tất cả trạng thái</option>
                  <option>Đang bán</option>
                  <option>Tạm ẩn</option>
                </select>
                <select aria-label="Sắp xếp sản phẩm theo" value={sort} onChange={(event) => { setSort(event.target.value); setPage(0) }} className="h-10 rounded-xl border border-border bg-white px-3 text-[11px] text-rosewood outline-none focus:border-caramel-hover">
                  <option value="name">Tên</option>
                  <option value="price">Giá</option>
                  <option value="quantity">Tồn kho</option>
                  <option value="createdAt">Ngày tạo</option>
                  <option value="expiryDate">Hạn sử dụng</option>
                </select>
                <select aria-label="Chiều sắp xếp sản phẩm" value={direction} onChange={(event) => { setDirection(event.target.value); setPage(0) }} className="h-10 rounded-xl border border-border bg-white px-3 text-[11px] text-rosewood outline-none focus:border-caramel-hover">
                  <option value="ASC">Tăng dần</option>
                  <option value="DESC">Giảm dần</option>
                </select>
              </div>
            </div>
            <DataTable
              columns={columns}
              rows={filteredItems}
              rowKey={(item) => item.id}
              emptyTitle={items.length ? 'Không tìm thấy sản phẩm' : 'Chưa có sản phẩm'}
              emptyDescription={items.length ? 'Thử từ khóa, danh mục hoặc trạng thái khác.' : 'Dữ liệu sản phẩm sẽ xuất hiện tại đây sau khi được tạo.'}
            />
            <PaginationControls
              page={page}
              size={pageSize}
              totalElements={pageInfo.totalElements}
              totalPages={pageInfo.totalPages}
              onPageChange={setPage}
              onSizeChange={(value) => { setPageSize(value); setPage(0) }}
            />
          </section>
        </>
      )}

      <Modal open={formOpen} title={editing ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'} onClose={closeProductForm}>
        <form className="space-y-4" onSubmit={saveProduct}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Tên sản phẩm *">
              <input autoFocus required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass} placeholder="Ví dụ: Bánh mousse xoài" />
            </Field>
            <Field label="Mã sản phẩm *">
              <input required value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} className={inputClass} placeholder="WA-009" />
            </Field>
            <Field label="Danh mục *">
              <select required value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} className={inputClass}>
                <option value="">Chọn danh mục</option>
                {categories.map((item) => <option key={item.id} value={String(item.id)}>{item.name}</option>)}
              </select>
            </Field>
            <Field label="Trạng thái">
              <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className={inputClass}>
                <option>Đang bán</option>
                <option>Tạm ẩn</option>
              </select>
            </Field>
            <Field label="Giá bán (đ) *">
              <input required type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className={inputClass} placeholder="95000" />
            </Field>
            <Field label="Số lượng tồn kho *">
              <input required type="number" min="0" step="1" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} className={inputClass} placeholder="0" />
            </Field>
            <Field label="Đơn vị tính">
              <input value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} className={inputClass} placeholder="chiếc" />
            </Field>
            <Field label="Ngày tạo (Ngày sản xuất) *">
              <input required type="date" value={form.createdAt} onChange={(event) => setForm({ ...form, createdAt: event.target.value })} className={inputClass} />
            </Field>
            <Field label="Hạn sử dụng (Ngày hết hạn) *">
              <input required type="date" value={form.expiryDate} onChange={(event) => setForm({ ...form, expiryDate: event.target.value })} className={inputClass} />
              <div className="mt-1.5 flex flex-wrap gap-1 text-[10px]">
                <span className="self-center text-muted font-medium">Chọn nhanh:</span>
                {[
                  { label: '+1 ngày (Mai)', days: 1 },
                  { label: '+2 ngày', days: 2 },
                  { label: '+3 ngày', days: 3 },
                  { label: '+7 ngày (1 tuần)', days: 7 },
                  { label: '+30 ngày', days: 30 },
                ].map(({ label, days }) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => {
                      const d = new Date()
                      d.setDate(d.getDate() + days)
                      setForm({ ...form, expiryDate: d.toISOString().slice(0, 10) })
                    }}
                    className="rounded-md border border-border bg-paper px-2 py-0.5 font-medium text-rosewood transition hover:border-caramel hover:text-caramel hover:bg-caramel-soft/40"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Ảnh sản phẩm (JPG, PNG, WEBP · tối đa 5 MB)">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={chooseImage}
                disabled={isSaving}
                className="w-full rounded-xl border border-border bg-white px-3 py-2 text-[11px] text-rosewood file:mr-3 file:rounded-lg file:border-0 file:bg-petal file:px-3 file:py-2 file:text-[11px] file:font-semibold file:text-rosewood"
              />
              {(imagePreviewUrl || form.imageUrl) && (
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-cream/60 p-3">
                  <img
                    src={uploadedImageUrl || imagePreviewUrl || form.imageUrl}
                    alt="Xem trước ảnh sản phẩm"
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                  <p className="min-w-0 break-all text-[10px] text-muted">
                    {uploadedImageUrl ? 'Ảnh đã tải lên; URL sẽ được gửi cùng dữ liệu sản phẩm.' : imageFile ? `${imageFile.name} · ${(imageFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Ảnh hiện tại'}
                  </p>
                </div>
              )}
            </Field>
            <Field label="URL hình ảnh">
              <input type="url" value={form.imageUrl} onChange={(event) => { clearImageSelection(); setForm({ ...form, imageUrl: event.target.value }) }} className={inputClass} placeholder="https://..." />
            </Field>
            <Field label="Mô tả">
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={`${inputClass} h-20 py-2`} />
            </Field>
          </div>
          {formError && <p role="alert" className="rounded-xl border border-danger-line bg-danger-soft px-3 py-2 text-xs text-danger">{formError}</p>}
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="secondary" disabled={isSaving} onClick={closeProductForm}>Hủy</Button>
            <Button type="submit" disabled={isSaving}><Icon name="check" size={15} /> {isSaving ? 'Đang lưu...' : 'Lưu sản phẩm'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(deleteTarget)} title="Xóa sản phẩm?" onClose={() => { if (pendingProductId == null) setDeleteTarget(null) }} size="max-w-md">
        <p className="text-sm leading-6 text-rosewood">
          Xóa sản phẩm <strong className="text-rosewood">{deleteTarget?.name}</strong>? Sản phẩm đã có trong đơn hàng sẽ không thể xóa.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" disabled={pendingProductId != null} onClick={() => setDeleteTarget(null)}>Hủy</Button>
          <Button variant="danger" disabled={pendingProductId != null} onClick={() => void removeProduct()}><Icon name="trash" size={15} /> {pendingProductId != null ? 'Đang xử lý...' : 'Xóa sản phẩm'}</Button>
        </div>
      </Modal>

      {/* Modal 1: Lập phiếu xuất hủy bánh hết hạn / hỏng (Thesis Feature 4) */}
      <Modal open={Boolean(discardTarget)} title="Tạo phiếu xuất hủy bánh hết hạn / hỏng" onClose={() => { if (!isSaving) setDiscardTarget(null) }} size="max-w-lg">
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-950">
            <p className="font-semibold text-rosewood">
              Sản phẩm: <strong>{discardTarget?.name}</strong> ({discardTarget?.code})
            </p>
            <p className="mt-1 text-muted">
              Tồn kho hiện tại: <strong className="text-rosewood">{discardTarget?.stock} {discardTarget?.unit || 'chiếc'}</strong> · Đơn giá: <strong className="text-rosewood">{currency.format(discardTarget?.price ?? 0)}đ</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-semibold text-rosewood mb-1">
                Số lượng xuất hủy ({discardTarget?.unit || 'chiếc'}) *
              </label>
              <input
                type="number"
                min="1"
                max={discardTarget?.stock || 1}
                value={discardQty}
                onChange={(e) => setDiscardQty(Math.max(1, Math.min(discardTarget?.stock || 1, Number(e.target.value) || 1)))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-rosewood mb-1">
                Lý do tiêu hủy *
              </label>
              <select
                value={discardReason}
                onChange={(e) => setDiscardReason(e.target.value)}
                className={inputClass}
              >
                <option value="Quá hạn sử dụng">Quá hạn sử dụng (HSD)</option>
                <option value="Bánh hỏng bảo quản">Bánh hỏng do bảo quản nhiệt độ</option>
                <option value="Hư hao trưng bày / vỡ mẻ">Hư hao trưng bày / vỡ mẻ</option>
                <option value="Lỗi tạo hình / nướng cháy">Lỗi nướng cháy / tạo hình hỏng</option>
                <option value="Khác">Lý do khác</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-rosewood mb-1">
              Người thực hiện lập phiếu
            </label>
            <input
              type="text"
              value={discardPerformer}
              onChange={(e) => setDiscardPerformer(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-rosewood mb-1">
              Ghi chú chi tiết lý do hủy
            </label>
            <textarea
              rows={2}
              value={discardNote}
              onChange={(e) => setDiscardNote(e.target.value)}
              placeholder="Ví dụ: Kiểm tra kệ bánh lúc 18h phát hiện kem chảy / quá hạn 1 ngày..."
              className={`${inputClass} h-16 py-2`}
            />
          </div>

          {/* Dự toán chi phí tổn thất */}
          <div className="rounded-xl border border-red-200 bg-red-50/80 p-3.5 text-xs text-red-950 space-y-1">
            <div className="flex justify-between font-bold">
              <span>Tổng chi phí thất thoát:</span>
              <strong className="text-danger text-sm">
                {currency.format(Number(discardQty || 1) * Number(discardTarget?.price ?? 0))}đ
              </strong>
            </div>
            <div className="flex justify-between text-[11px] text-muted">
              <span>Tồn kho còn lại sau khi hủy:</span>
              <span>{Math.max(0, Number(discardTarget?.stock ?? 0) - Number(discardQty || 1))} {discardTarget?.unit || 'chiếc'}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="secondary" disabled={isSaving} onClick={() => setDiscardTarget(null)}>Hủy bỏ</Button>
            <Button variant="danger" disabled={isSaving} onClick={() => void confirmDiscard()}>
              <Icon name="trash" size={15} /> {isSaving ? 'Đang lập phiếu...' : 'Xác nhận xuất hủy'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 2: Sổ theo dõi hủy bánh & Thất thoát (Thesis Feature 4) */}
      <Modal open={disposalLogOpen} title="Sổ theo dõi tiêu hủy bánh hỏng & Hết hạn" onClose={() => setDisposalLogOpen(false)} size="max-w-4xl">
        <div className="space-y-4">
          {/* 3 Thẻ thống kê tổng quan */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-paper p-3.5">
              <span className="text-[11px] font-semibold text-muted">Tổng số bánh đã hủy</span>
              <p className="mt-1 font-display text-2xl font-bold text-rosewood">
                {disposalsHistory.reduce((sum, s) => sum + Number(s.quantity || 0), 0)} chiếc
              </p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50/60 p-3.5">
              <span className="text-[11px] font-semibold text-danger">Tổng chi phí thất thoát</span>
              <p className="mt-1 font-display text-2xl font-bold text-danger">
                {currency.format(disposalsHistory.reduce((sum, s) => sum + Number(s.lossAmount || 0), 0))}đ
              </p>
            </div>
            <div className="rounded-xl border border-border bg-paper p-3.5">
              <span className="text-[11px] font-semibold text-muted">Số phiếu xuất hủy</span>
              <p className="mt-1 font-display text-2xl font-bold text-rosewood">
                {disposalsHistory.length} phiếu
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3">
            <p className="text-xs text-muted">
              Chu trình khép kín: Nhập kho ➔ Cảnh báo HSD ➔ Lập phiếu xuất hủy bánh hỏng
            </p>
            <button
              type="button"
              disabled={disposalsHistory.length === 0}
              onClick={handleExportDisposalsExcel}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-bold text-rosewood shadow-xs transition hover:border-caramel hover:text-caramel disabled:opacity-50"
            >
              <Icon name="download" size={14} /> Xuất Excel biên bản hủy bánh
            </button>
          </div>

          {/* Bảng chi tiết */}
          <div className="max-h-80 overflow-y-auto rounded-xl border border-border">
            {disposalsHistory.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted">
                Chưa có phiếu xuất hủy nào được ghi nhận.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-paper border-b border-border text-[11px] font-bold text-rosewood">
                  <tr>
                    <th className="py-2.5 px-3">Thời gian</th>
                    <th className="py-2.5 px-3">Sản phẩm bánh</th>
                    <th className="py-2.5 px-3 text-right">SL hủy</th>
                    <th className="py-2.5 px-3 text-right">Thất thoát</th>
                    <th className="py-2.5 px-3">Lý do</th>
                    <th className="py-2.5 px-3">Người hủy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {disposalsHistory.map((s) => (
                    <tr key={s.id} className="hover:bg-stone-50">
                      <td className="py-2.5 px-3 text-stone-600 whitespace-nowrap">{formatDate(s.disposedAt)}</td>
                      <td className="py-2.5 px-3 font-semibold text-rosewood">
                        {s.productName} <span className="text-[10px] text-muted">({s.productCode})</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-rosewood">{s.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-danger whitespace-nowrap">
                        {currency.format(s.lossAmount)}đ
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="rounded bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-800">
                          {s.reason}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-stone-600">{s.performer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex justify-end border-t border-border pt-3">
            <Button variant="secondary" onClick={() => setDisposalLogOpen(false)}>Đóng</Button>
          </div>
        </div>
      </Modal>

      {/* Modal 3: Định lượng công thức làm bánh (Recipe / BOM) & Tự động trừ kho (Thesis Feature 2) */}
      <Modal open={bomModalOpen} title="Định lượng công thức (BOM) & Làm bánh" onClose={() => { if (!isBaking) setBomModalOpen(false) }} size="max-w-2xl">
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-paper p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Sản phẩm làm bánh</span>
                <h3 className="font-display text-base font-bold text-rosewood">{bomTargetProduct?.name}</h3>
                <p className="text-xs text-muted">Mã: {bomTargetProduct?.code} · Tồn kho hiện tại: <strong className="text-rosewood">{bomTargetProduct?.stock} {bomTargetProduct?.unit || 'chiếc'}</strong></p>
              </div>
              <div className="flex rounded-lg border border-border bg-white p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setBomTab('produce')}
                  className={`rounded-md px-3 py-1 transition ${bomTab === 'produce' ? 'bg-caramel text-white shadow-xs' : 'text-stone-600 hover:text-rosewood'}`}
                >
                  👩‍🍳 Làm bánh mẻ mới
                </button>
                <button
                  type="button"
                  onClick={() => setBomTab('recipe')}
                  className={`rounded-md px-3 py-1 transition ${bomTab === 'recipe' ? 'bg-caramel text-white shadow-xs' : 'text-stone-600 hover:text-rosewood'}`}
                >
                  📋 Định mức công thức
                </button>
              </div>
            </div>
          </div>

          {bomTab === 'produce' ? (
            <div className="space-y-3.5">
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-rosewood whitespace-nowrap">
                  Số lượng bánh làm (chiếc):
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={produceQty}
                  onChange={(e) => setProduceQty(Math.max(1, Number(e.target.value) || 1))}
                  className="h-9 w-24 rounded-xl border border-caramel bg-white px-3 text-center text-sm font-bold text-rosewood outline-none focus:ring-2 focus:ring-caramel/30"
                />
                <span className="text-xs text-muted">
                  ➔ Tồn kho sau làm: <strong>{Number(bomTargetProduct?.stock || 0) + Number(produceQty || 0)} {bomTargetProduct?.unit || 'chiếc'}</strong>
                </span>
              </div>

              {/* Bảng tính toán nguyên liệu tự động trừ kho */}
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="bg-stone-50 px-3.5 py-2 border-b border-border text-[11px] font-bold text-rosewood flex justify-between">
                  <span>Dự toán nguyên liệu cần trừ kho (ERP mini)</span>
                  <span className="text-muted">Định mức cho {produceQty} chiếc</span>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-paper border-b border-border text-[10px] font-bold text-muted uppercase">
                    <tr>
                      <th className="py-2 px-3.5">Nguyên liệu</th>
                      <th className="py-2 px-3 text-right">Định mức / 1 bánh</th>
                      <th className="py-2 px-3 text-right">Tổng cần trừ kho</th>
                      <th className="py-2 px-3 text-center">Trạng thái kho</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-white">
                    {(recipes[bomTargetProduct?.id] || recipes.default || []).map((ing, i) => (
                      <tr key={i} className="hover:bg-stone-50">
                        <td className="py-2.5 px-3.5 font-semibold text-rosewood">{ing.name}</td>
                        <td className="py-2.5 px-3 text-right text-stone-600">{ing.amount} {ing.unit}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-rosewood">
                          {ing.amount * produceQty} {ing.unit}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            ✓ Đủ nguyên liệu
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {bakingError && (
                <p role="alert" className="rounded-xl border border-danger-line bg-danger-soft p-3 text-xs text-danger font-medium">
                  {bakingError}
                </p>
              )}

              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button variant="secondary" disabled={isBaking} onClick={() => setBomModalOpen(false)}>Hủy bỏ</Button>
                <Button disabled={isBaking} onClick={() => void handleBakeProduct()}>
                  <Icon name="check" size={15} /> {isBaking ? 'Đang xử lý trừ kho...' : `✓ Hoàn tất làm ${produceQty} chiếc bánh`}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted">
                Công thức định mức nguyên vật liệu (Bill of Materials - BOM) chuẩn cho mỗi 1 đơn vị sản phẩm:
              </p>
              <div className="rounded-xl border border-border divide-y divide-border bg-white text-xs">
                {(recipes[bomTargetProduct?.id] || recipes.default || []).map((ing, i) => (
                  <div key={i} className="flex items-center justify-between p-3">
                    <span className="font-semibold text-rosewood">{ing.name}</span>
                    <span className="font-bold text-caramel">{ing.amount} {ing.unit} / chiếc</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-end border-t border-border pt-3">
                <Button variant="secondary" onClick={() => setBomTab('produce')}>Quay lại làm bánh</Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
