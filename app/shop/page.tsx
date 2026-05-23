import { Suspense } from 'react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { ProductFilters } from '@/components/product-filters'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import type { Product } from '@/types'

interface ShopPageProps {
  searchParams: Promise<{
    category?: string
    type?: string
    search?: string
    page?: string
  }>
}

async function getProducts(searchParams: {
  category?: string
  type?: string
  search?: string
  page?: string
}): Promise<{ products: Product[]; total: number; page: number; totalPages: number }> {
  try {
    const params = new URLSearchParams()
    if (searchParams.category) params.set('category', searchParams.category)
    if (searchParams.type) params.set('type', searchParams.type)
    if (searchParams.search) params.set('search', searchParams.search)
    if (searchParams.page) params.set('page', searchParams.page)

    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/products?${params.toString()}`, {
      cache: 'no-store',
    })
    return await res.json()
  } catch {
    return { products: [], total: 0, page: 1, totalPages: 0 }
  }
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="aspect-square w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  )
}

async function ProductGrid({ searchParams }: { searchParams: ShopPageProps['searchParams'] }) {
  const resolvedParams = await searchParams
  const { products, page, totalPages } = await getProducts(resolvedParams)
  const currentPage = page || 1

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No products found.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Try adjusting your filters or search query.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination>
            <PaginationContent>
              {currentPage > 1 && (
                <PaginationItem>
                  <PaginationPrevious
                    href={`/shop?${new URLSearchParams({
                      ...resolvedParams,
                      page: String(currentPage - 1),
                    }).toString()}`}
                  />
                </PaginationItem>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    href={`/shop?${new URLSearchParams({
                      ...resolvedParams,
                      page: String(pageNum),
                    }).toString()}`}
                    isActive={pageNum === currentPage}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              ))}
              {currentPage < totalPages && (
                <PaginationItem>
                  <PaginationNext
                    href={`/shop?${new URLSearchParams({
                      ...resolvedParams,
                      page: String(currentPage + 1),
                    }).toString()}`}
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </>
  )
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const resolvedParams = await searchParams

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Shop</h1>
            <p className="text-muted-foreground mt-1">
              {resolvedParams.search
                ? `Search results for "${resolvedParams.search}"`
                : 'Browse our collection of products'}
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters */}
            <Suspense fallback={<Skeleton className="h-[400px] w-64" />}>
              <ProductFilters />
            </Suspense>

            {/* Products Grid */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4 lg:hidden">
                <ProductFilters />
              </div>
              <Suspense fallback={<ProductGridSkeleton />}>
                <ProductGrid searchParams={searchParams} />
              </Suspense>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
