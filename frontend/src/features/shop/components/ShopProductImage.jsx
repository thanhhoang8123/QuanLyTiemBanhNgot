import { useState } from 'react'

const bakeryPhotos = {
  cake: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=85',
  strawberry: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=900&q=85',
  chocolate: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=85',
  bread: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=85',
  croissant: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=85',
  cookie: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=900&q=85',
  default: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=85',
}

function getFallbackPhoto(product) {
  const text = `${product.name || ''} ${product.category || ''}`.toLocaleLowerCase('vi')
  if (text.includes('dâu') || text.includes('strawberry')) return bakeryPhotos.strawberry
  if (text.includes('chocolate') || text.includes('socola') || text.includes('sô cô la')) return bakeryPhotos.chocolate
  if (text.includes('croissant') || text.includes('sừng bò')) return bakeryPhotos.croissant
  if (text.includes('quy') || text.includes('cookie')) return bakeryPhotos.cookie
  if (text.includes('bánh mì') || text.includes('bread') || text.includes('bơ tỏi') || text.includes('xúc xích')) return bakeryPhotos.bread
  if (text.includes('bánh kem') || text.includes('mousse') || text.includes('cake')) return bakeryPhotos.cake
  return bakeryPhotos.default
}

export default function ShopProductImage({ product, className = '' }) {
  const fallback = getFallbackPhoto(product)
  const [source, setSource] = useState(product.imageUrl || fallback)
  const [failed, setFailed] = useState(false)

  if (failed) {
    return <div role="img" aria-label={`Ảnh ${product.name} không khả dụng`} className={`bg-[#F3E3D3] ${className}`} />
  }

  return (
    <img
      src={source}
      alt={product.name}
      loading="lazy"
      className={className}
      onError={() => {
        if (source !== fallback) setSource(fallback)
        else setFailed(true)
      }}
    />
  )
}
