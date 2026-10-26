import { useEffect, useMemo, useState } from 'react'
import Button from '../../../components/Button.jsx'
import ConfirmDialog from '../../../components/ConfirmDialog.jsx'
import DataTable from '../../../components/DataTable.jsx'
import EmptyState from '../../../components/EmptyState.jsx'
import ErrorState from '../../../components/ErrorState.jsx'
import LoadingState from '../../../components/LoadingState.jsx'
import Modal from '../../../components/Modal.jsx'
import PageHeader from '../../../components/PageHeader.jsx'
import SearchFilter from '../../../components/SearchFilter.jsx'
import { getProducts } from '../../products/services/productService.js'
import { getPromotions } from '../../promotions/services/promotionService.js'
import {
  createPromotionProduct,
  deletePromotionProduct,
  getPromotionProducts,
} from '../services/promotionProductService.js'
import { getUserFacingErrorMessage } from '../../../services/apiClient.js'

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

function getErrorMessage(error) {
  return getUserFacingErrorMessage(error)
}

function promotionName(promotion) {
  return promotion
    ? `${promotion.name} (${promotion.promotionCode})`
    : 'Không tìm thấy thông tin khuyến mãi'
}

function productName(product) {
  return product
    ? `${product.name} (${product.productCode})`
    : 'Không tìm thấy thông tin sản phẩm'
}

export default function PromotionProductsPage({ onToast }) {
  const [links, setLinks] = useState([])
  const [promotions, setPromotions] = useState([])
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadVersion, setReloadVersion] = useState(0)
  const [query, setQuery] = useState('')
  const [promotionFilter, setPromotionFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [selectedPromotionId, setSelectedPromotionId] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [linkToDelete, setLinkToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [listError, setListError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadData() {
      setIsLoading(true)
      setLoadError('')
      try {
        const [loadedLinks, loadedPromotions, loadedProducts] = await Promise.all([
          getPromotionProducts({ signal: controller.signal }),
          getPromotions({ signal: controller.signal }),
          getProducts({ signal: controller.signal }),
        ])

        if (!Array.isArray(loadedLinks)
          || !Array.isArray(loadedPromotions)
          || !Array.isArray(loadedProducts)) {
          throw new Error('Chưa thể tải danh sách sản phẩm khuyến mãi. Vui lòng thử lại.')
        }

        setLinks(loadedLinks)
        setPromotions(loadedPromotions)
        setProducts(loadedProducts)
        setSelectedPromotionId((current) => current || String(loadedPromotions[0]?.id ?? ''))
      } catch (error) {
        if (error.name !== 'AbortError') setLoadError(getErrorMessage(error))
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    loadData()
    return () => controller.abort()
  }, [reloadVersion])

  const promotionById = useMemo(
    () => new Map(promotions.map((promotion) => [Number(promotion.id), promotion])),
    [promotions],
  )
  const productById = useMemo(
    () => new Map(products.map((product) => [Number(product.id), product])),
    [products],
  )
  const linkedProductIds = useMemo(
    () => new Set(links
      .filter((link) => Number(link.promotionId) === Number(selectedPromotionId))
      .map((link) => Number(link.productId))),
    [links, selectedPromotionId],
  )
  const availableProducts = useMemo(
    () => products.filter((product) => !linkedProductIds.has(Number(product.id))),
    [products, linkedProductIds],
  )
  const filteredLinks = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('vi')

    return links.filter((link) => {
      const promotion = promotionById.get(Number(link.promotionId))
      const product = productById.get(Number(link.productId))
      const matchesPromotion = promotionFilter === 'all'
        || Number(link.promotionId) === Number(promotionFilter)
      const searchText = [
        promotion?.name,
        promotion?.promotionCode,
        product?.name,
        product?.productCode,
      ].filter(Boolean).join(' ').toLocaleLowerCase('vi')

      return matchesPromotion && (!normalizedQuery || searchText.includes(normalizedQuery))
    })
  }, [links, promotionById, productById, promotionFilter, query])

  const openCreateForm = () => {
    setSelectedPromotionId(
      promotionFilter === 'all'
        ? String(promotions[0]?.id ?? '')
        : promotionFilter,
    )
    setSelectedProductId('')
    setFormError('')
    setFormOpen(true)
  }

  const closeCreateForm = () => {
    if (isSaving) return
    setFormOpen(false)
    setFormError('')
  }

  const saveLink = async (event) => {
    event.preventDefault()
    if (!selectedPromotionId || !selectedProductId) {
      setFormError('Vui lòng chọn khuyến mãi và sản phẩm.')
      return
    }

    setIsSaving(true)
    setFormError('')
    try {
      await createPromotionProduct({
        promotionId: Number(selectedPromotionId),
        productId: Number(selectedProductId),
      })
      setFormOpen(false)
      onToast('Đã liên kết sản phẩm với khuyến mãi.')
      setReloadVersion((version) => version + 1)
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const removeLink = async () => {
    if (!linkToDelete) return

    setIsDeleting(true)
    setListError('')
    try {
      await deletePromotionProduct(linkToDelete.promotionId, linkToDelete.productId)
      onToast('Đã gỡ liên kết sản phẩm khỏi khuyến mãi.')
      setLinkToDelete(null)
      setReloadVersion((version) => version + 1)
    } catch (error) {
      setListError(getErrorMessage(error))
    } finally {
      setIsDeleting(false)
    }
  }

  const columns = [
    {
      key: 'promotion',
      label: 'Khuyến mãi',
      render: (link) => {
        const promotion = promotionById.get(Number(link.promotionId))
        return (
          <div className="min-w-[180px]">
            <p className="font-bold text-rosewood">
              {promotion?.name ?? `Khuyến mãi #${link.promotionId}`}
            </p>
            <p className="mt-1 text-[10px] text-muted">
              {promotion?.promotionCode ?? `ID ${link.promotionId}`}
            </p>
          </div>
        )
      },
    },
    {
      key: 'product',
      label: 'Sản phẩm',
      render: (link) => {
        const product = productById.get(Number(link.productId))
        return (
          <div className="min-w-[180px]">
            <p className="font-bold text-rosewood">
              {product?.name ?? `Sản phẩm #${link.productId}`}
            </p>
            <p className="mt-1 text-[10px] text-muted">
              {product?.productCode ?? `ID ${link.productId}`}
            </p>
          </div>
        )
      },
    },
    {
      key: 'productStatus',
      label: 'Tình trạng sản phẩm',
      render: (link) => {
        const product = productById.get(Number(link.productId))
        if (!product) return 'Không tải được dữ liệu'
        if (product.status === true) return 'Đang bán'
        if (product.status === false) return 'Tạm ẩn'
        return 'Chưa xác định'
      },
    },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (link) => (
        <Button
          variant="subtle"
          size="sm"
          aria-label={`Gỡ ${productName(productById.get(Number(link.productId)))} khỏi ${promotionName(promotionById.get(Number(link.promotionId)))}`}
          onClick={() => setLinkToDelete(link)}
        >
          Gỡ liên kết
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sản phẩm áp dụng khuyến mãi"
        description="Quản lý các sản phẩm đang áp dụng trong từng chương trình khuyến mãi."
        actions={(
          <Button
            onClick={openCreateForm}
            disabled={isLoading || promotions.length === 0 || products.length === 0}
          >
            Thêm liên kết
          </Button>
        )}
      />

      {isLoading ? (
        <LoadingState label="Đang tải khuyến mãi, sản phẩm và liên kết..." />
      ) : loadError ? (
        <ErrorState description={loadError} onRetry={() => setReloadVersion((version) => version + 1)} />
      ) : (
        <section className="overflow-hidden rounded-2xl border border-border bg-paper shadow-sm">
          <div className="space-y-4 border-b border-border p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-lg font-semibold text-rosewood">Danh sách liên kết</h3>
                <p className="mt-1 text-xs text-muted">
                  {filteredLinks.length} / {links.length} liên kết
                </p>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted">
                <span>Khuyến mãi</span>
                <select
                  aria-label="Lọc theo khuyến mãi"
                  value={promotionFilter}
                  onChange={(event) => setPromotionFilter(event.target.value)}
                  className="h-10 max-w-[230px] rounded-xl border border-border bg-paper px-3 text-xs text-rosewood focus:border-caramel focus:outline-none"
                >
                  <option value="all">Tất cả khuyến mãi</option>
                  {promotions.map((promotion) => (
                    <option key={promotion.id} value={promotion.id}>
                      {promotion.promotionCode} — {promotion.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <SearchFilter
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              label="Tìm khuyến mãi hoặc sản phẩm"
              placeholder="Nhập mã hoặc tên khuyến mãi/sản phẩm..."
            />
          </div>

          {promotions.length === 0 || products.length === 0 ? (
            <p role="status" className="rounded-xl border border-border bg-cream px-4 py-3 text-xs text-muted">
              Không thể tạo liên kết vì API hiện chưa có khuyến mãi hoặc sản phẩm để chọn.
            </p>
          ) : null}

          {listError && (
            <div role="alert" className="mx-4 mt-4 rounded-xl border border-danger-line bg-danger-soft/50 px-4 py-3 text-sm text-danger sm:mx-5">
              {listError}
            </div>
          )}

          {links.length === 0 ? (
            <EmptyState
              title="Chưa có liên kết khuyến mãi - sản phẩm"
              description="Tạo liên kết đầu tiên để xác định sản phẩm nào được áp dụng chương trình khuyến mãi."
              action={(
                <Button onClick={openCreateForm} disabled={promotions.length === 0 || products.length === 0}>
                  Thêm liên kết
                </Button>
              )}
            />
          ) : (
            <DataTable
              columns={columns}
              rows={filteredLinks}
              rowKey={(link) => `${link.promotionId}-${link.productId}`}
              ariaLabel="Các liên kết khuyến mãi và sản phẩm"
              emptyTitle="Không tìm thấy liên kết"
              emptyDescription="Thử thay đổi từ khóa hoặc bộ lọc khuyến mãi."
            />
          )}
        </section>
      )}

      <Modal
        open={formOpen}
        title="Liên kết sản phẩm với khuyến mãi"
        onClose={closeCreateForm}
        closeDisabled={isSaving}
      >
        <form className="space-y-4" onSubmit={saveLink}>
          <label className="block space-y-1.5 text-xs font-semibold text-rosewood">
            Khuyến mãi
            <select
              required
              value={selectedPromotionId}
              onChange={(event) => {
                setSelectedPromotionId(event.target.value)
                setSelectedProductId('')
                setFormError('')
              }}
              className="h-11 w-full rounded-xl border border-border bg-paper px-3 text-sm font-normal focus:border-caramel focus:outline-none"
            >
              <option value="" disabled>Chọn khuyến mãi</option>
              {promotions.map((promotion) => (
                <option key={promotion.id} value={promotion.id}>
                  {promotion.promotionCode} — {promotion.name}
                  {promotion.status === false ? ' (Tạm dừng)' : ''}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5 text-xs font-semibold text-rosewood">
            Sản phẩm chưa được liên kết
            <select
              required
              value={selectedProductId}
              onChange={(event) => setSelectedProductId(event.target.value)}
              disabled={availableProducts.length === 0}
              className="h-11 w-full rounded-xl border border-border bg-paper px-3 text-sm font-normal focus:border-caramel focus:outline-none disabled:bg-cream"
            >
              <option value="" disabled>
                {availableProducts.length ? 'Chọn sản phẩm' : 'Tất cả sản phẩm đã được liên kết'}
              </option>
              {availableProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.productCode} — {product.name}
                  {product.status === false ? ' (Tạm ẩn)' : ''}
                </option>
              ))}
            </select>
          </label>

          {selectedProductId && productById.get(Number(selectedProductId))?.price != null && (
            <p className="text-xs text-muted">
              Giá niêm yết: {currencyFormatter.format(
                Number(productById.get(Number(selectedProductId)).price),
              )}
              . Liên kết này chỉ xác định sản phẩm áp dụng; không thay đổi giá sản phẩm.
            </p>
          )}

          {formError && (
            <p role="alert" className="rounded-xl border border-danger-line bg-danger-soft/50 px-3 py-2 text-sm text-danger">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={closeCreateForm} disabled={isSaving}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSaving || !selectedPromotionId || !selectedProductId}
            >
              {isSaving ? 'Đang lưu...' : 'Tạo liên kết'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(linkToDelete)}
        title="Gỡ liên kết sản phẩm?"
        description={linkToDelete
          ? `Bạn có chắc muốn gỡ ${productName(productById.get(Number(linkToDelete.productId)))} khỏi ${promotionName(promotionById.get(Number(linkToDelete.promotionId)))}? Thao tác này không xóa sản phẩm hoặc khuyến mãi.`
          : ''}
        confirmLabel="Gỡ liên kết"
        onConfirm={removeLink}
        onClose={() => {
          if (!isDeleting) setLinkToDelete(null)
        }}
        busy={isDeleting}
      />
    </div>
  )
}
