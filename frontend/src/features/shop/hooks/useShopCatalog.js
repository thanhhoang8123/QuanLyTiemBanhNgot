import { useCallback, useEffect, useState } from 'react'
import { getCategories } from '../../categories/services/categoryService.js'
import { toProductViewModel } from '../../products/adapters/productAdapter.js'
import { getProducts } from '../../products/services/productService.js'
import { getUserFacingErrorMessage } from '../../../services/apiClient.js'

function getErrorMessage(error) {
  return getUserFacingErrorMessage(error, 'Chưa thể tải danh sách sản phẩm. Vui lòng thử lại.')
}

export default function useShopCatalog() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadVersion, setReloadVersion] = useState(0)

  const retry = useCallback(() => setReloadVersion((version) => version + 1), [])

  useEffect(() => {
    const controller = new AbortController()

    async function loadCatalog() {
      setIsLoading(true)
      setError('')

      try {
        const [categoryData, productData] = await Promise.all([
          getCategories({ signal: controller.signal }),
          getProducts({ signal: controller.signal }),
        ])

        if (!Array.isArray(categoryData) || !Array.isArray(productData)) {
          throw new Error('Chưa thể tải danh sách sản phẩm. Vui lòng thử lại.')
        }

        setCategories(categoryData)
setProducts(productData.map(toProductViewModel))
console.log('Dữ liệu sản phẩm API:', productData)
      } catch (loadError) {
        if (loadError.name !== 'AbortError') setError(getErrorMessage(loadError))
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void loadCatalog()
    return () => controller.abort()
  }, [reloadVersion])

  return { categories, products, isLoading, error, retry }
}
