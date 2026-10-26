import { useCallback, useEffect, useState } from 'react'
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
  getProductPage,
  uploadProductImage,
  updateProduct,
} from '../services/productService.js'

const currency = new Intl.NumberFormat('vi-VN')
const maxImageSize = 5 * 1024 * 1024
const acceptedImageTypes = new Map([
  ['jpg', 'image/jpeg'],
  ['jpeg', 'image/jpeg'],
  ['png', 'image/png'],
  ['webp', 'image/webp'],
])
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
  return error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.'
}

async function fetchCatalog({ page, size, query, categoryId, status, signal }) {
  const [categoryData, productData] = await Promise.all([
    getCategories({ signal }),
    getProductPage({
      page,
      size,
      keyword: query,
      categoryId,
      status,
      signal,
    }),
  ])
  if (!Array.isArray(categoryData)
    || !Array.isArray(productData?.content)
    || !Number.isInteger(productData.page)
    || !Number.isInteger(productData.size)
    || !Number.isInteger(productData.totalPages)
    || !Number.isInteger(productData.totalElements)) {
    throw new Error('API trả về danh sách danh mục hoặc sản phẩm không hợp lệ.')
  }

  return {
    categories: categoryData,
    page: productData,
    products: productData.content.map(toProductViewModel),
  }
}

export default function ProductsPage({ onToast }) {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState('Tất cả trạng thái')
  const [sort, setSort] = useState('name')
  const [direction, setDirection] = useState('ASC')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [pageInfo, setPageInfo] = useState({ totalElements: 0, totalPages: 0 })
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')
  const [uploadedImageUrl, setUploadedImageUrl] = useState('')
  const [deactivateTarget, setDeactivateTarget] = useState(null)
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
      setSyncError(`Thao tác đã thành công trên máy chủ nhưng danh sách chưa đồng bộ được: ${getApiMessage(error)}`)
    }
  }

  const openCreate = () => {
    setImageFile(null)
    setImagePreviewUrl('')
    setUploadedImageUrl('')
    setEditing(null)
    setForm({
      ...emptyForm,
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
      expiryDate: item.expiryDate,
    })
    setFormOpen(true)
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
        await updateProduct(editing.id, payload)
      } else {
        await createProduct(payload)
      }
      setFormOpen(false)
      setEditing(null)
      setForm(emptyForm)
      clearImageSelection()
      onToast(editing ? 'Đã cập nhật sản phẩm trên máy chủ.' : 'Đã tạo sản phẩm trên máy chủ.')
      if (!editing) setPage(0)
      await syncCatalog(editing ? page : 0)
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
    if (!item.categoryId) {
      setSyncError('Không thể cập nhật sản phẩm vì dữ liệu chưa có danh mục hợp lệ.')
      return
    }

    setPendingProductId(item.id)
    setSyncError('')
    try {
      await updateProduct(item.id, toProductRequest({
        name: item.name,
        code: item.code,
        categoryId: item.categoryId,
        price: String(item.price),
        stock: String(item.stock),
        status: item.status === 'Đang bán' ? 'Tạm ẩn' : 'Đang bán',
        description: item.description,
        imageUrl: item.imageUrl,
        unit: item.unit,
        expiryDate: item.expiryDate,
      }))
      onToast(`Đã cập nhật trạng thái "${item.name}" trên máy chủ.`)
      await syncCatalog()
    } catch (error) {
      setSyncError(`Không thể cập nhật trạng thái sản phẩm: ${getApiMessage(error)}`)
    } finally {
      setPendingProductId(null)
    }
  }

  const deactivate = async () => {
    if (!deactivateTarget) return

    setPendingProductId(deactivateTarget.id)
    setSyncError('')
    try {
      await deactivateProduct(deactivateTarget.id)
      onToast(`Đã ngừng kinh doanh "${deactivateTarget.name}" trên máy chủ.`)
      setDeactivateTarget(null)
      await syncCatalog()
    } catch (error) {
      setSyncError(`Không thể ngừng kinh doanh sản phẩm: ${getApiMessage(error)}`)
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
    { key: 'status', label: 'Trạng thái', render: (item) => <StatusBadge status={item.status} /> },
    {
      key: 'actions',
      label: 'Thao tác',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      render: (item) => (
        <div className="inline-flex items-center gap-1">
          <button type="button" aria-label={`Sửa ${item.name}`} disabled={pendingProductId === item.id} onClick={() => openEdit(item)} className="flex h-8 w-8 items-center justify-center rounded-lg text-rosewood transition hover:bg-petal disabled:opacity-50">
            <Icon name="edit" size={15} />
          </button>
          <button type="button" aria-label={item.status === 'Đang bán' ? `Ẩn ${item.name}` : `Mở bán ${item.name}`} disabled={pendingProductId === item.id} onClick={() => toggleStatus(item)} className="rounded-lg px-2 py-1.5 text-[10px] font-semibold text-rosewood transition hover:bg-petal disabled:opacity-50">
            {item.status === 'Đang bán' ? 'Ẩn' : 'Mở bán'}
          </button>
          <button type="button" aria-label={`Ngừng kinh doanh ${item.name}`} disabled={item.status !== 'Đang bán' || pendingProductId === item.id} onClick={() => setDeactivateTarget(item)} className="flex h-8 w-8 items-center justify-center rounded-lg text-danger transition hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-40">
            <Icon name="trash" size={15} />
          </button>
        </div>
      ),
    },
  ]

  const activeCount = items.filter((item) => item.status === 'Đang bán').length
  const lowStockCount = items.filter((item) => item.stock > 0 && item.stock <= 5).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-muted">Danh mục sản phẩm</p>
          <h2 className="font-display mt-1 text-[28px] text-rosewood sm:text-[32px]">Sản phẩm</h2>
          <p className="mt-1 text-xs text-muted">Quản lý bánh, giá bán và trạng thái kinh doanh.</p>
        </div>
        <Button onClick={openCreate} disabled={isLoading || Boolean(loadError)}><Icon name="plus" size={16} /> Thêm sản phẩm</Button>
      </div>

      {syncError && <p role="alert" className="rounded-xl border border-warning-line bg-warning-soft px-4 py-3 text-xs text-rosewood">{syncError}</p>}

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
          <section aria-label="Tổng quan sản phẩm" className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-3">
            {[
              { label: 'Tổng sản phẩm phù hợp', value: pageInfo.totalElements, icon: 'package' },
              { label: 'Đang kinh doanh trên trang', value: activeCount, icon: 'check' },
              { label: 'Tồn kho thấp trên trang', value: lowStockCount, icon: 'receipt' },
            ].map((stat) => (
              <article key={stat.label} className="soft-shadow flex items-center justify-between rounded-2xl border border-border bg-paper p-4 sm:p-5">
                <div>
                  <p className="text-[11px] font-semibold text-muted">{stat.label}</p>
                  <p className="font-display mt-2 text-2xl font-semibold text-rosewood">{stat.value}</p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-caramel-soft text-rosewood"><Icon name={stat.icon} size={18} /></span>
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
            <Field label="Tên sản phẩm">
              <input autoFocus required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass} placeholder="Ví dụ: Bánh mousse xoài" />
            </Field>
            <Field label="Mã sản phẩm">
              <input required value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} className={inputClass} placeholder="WA-009" />
            </Field>
            <Field label="Danh mục">
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
            <Field label="Giá bán (đ)">
              <input required type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className={inputClass} placeholder="95000" />
            </Field>
            <Field label="Số lượng">
              <input required type="number" min="0" step="1" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} className={inputClass} placeholder="0" />
            </Field>
            <Field label="Đơn vị">
              <input value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} className={inputClass} placeholder="chiếc" />
            </Field>
            <Field label="Hạn sử dụng">
              <input type="date" value={form.expiryDate} onChange={(event) => setForm({ ...form, expiryDate: event.target.value })} className={inputClass} />
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

      <Modal open={Boolean(deactivateTarget)} title="Ngừng kinh doanh sản phẩm?" onClose={() => { if (pendingProductId == null) setDeactivateTarget(null) }} size="max-w-md">
        <p className="text-sm leading-6 text-rosewood">
          Sản phẩm <strong className="text-rosewood">{deactivateTarget?.name}</strong> sẽ được chuyển sang trạng thái tạm ẩn. Dữ liệu sản phẩm không bị xóa.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" disabled={pendingProductId != null} onClick={() => setDeactivateTarget(null)}>Hủy</Button>
          <Button variant="danger" disabled={pendingProductId != null} onClick={() => void deactivate()}><Icon name="trash" size={15} /> {pendingProductId != null ? 'Đang xử lý...' : 'Ngừng kinh doanh'}</Button>
        </div>
      </Modal>
    </div>
  )
}
