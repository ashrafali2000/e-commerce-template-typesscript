import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Download, Package as PackageIcon, Minus, Plus, ShoppingCart } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AddToCartButton } from './add-to-cart-button'
import type { Product } from '@/types'

interface ProductPageProps {
  params: Promise<{ id: string }>
}

async function getProduct(id: string): Promise<Product | null> {
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/products/${id}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.product
  } catch {
    return null
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    notFound()
  }

  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-8">
            <Button variant="ghost" asChild className="gap-2">
              <Link href="/shop">
                <ArrowLeft className="h-4 w-4" />
                Back to Shop
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Image */}
            <div className="space-y-4">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                <Image
                  src={product.images[0] || '/placeholder.svg'}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
                {discount > 0 && (
                  <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground text-lg px-3 py-1">
                    -{discount}%
                  </Badge>
                )}
              </div>
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {product.images.map((image, i) => (
                    <div
                      key={i}
                      className="relative aspect-square overflow-hidden rounded-lg bg-muted"
                    >
                      <Image
                        src={image}
                        alt={`${product.name} ${i + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {product.type === 'digital' ? (
                      <>
                        <Download className="h-3 w-3" />
                        Digital Product
                      </>
                    ) : (
                      <>
                        <PackageIcon className="h-3 w-3" />
                        Physical Product
                      </>
                    )}
                  </Badge>
                  <Badge variant="outline">{product.category}</Badge>
                </div>
                <h1 className="text-3xl font-bold">{product.name}</h1>
              </div>

              <div className="flex items-baseline gap-4">
                <span className="text-4xl font-bold">${product.price.toFixed(2)}</span>
                {product.comparePrice && (
                  <span className="text-xl text-muted-foreground line-through">
                    ${product.comparePrice.toFixed(2)}
                  </span>
                )}
              </div>

              <Separator />

              <div>
                <h2 className="font-semibold mb-2">Description</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>

              {product.type === 'physical' && (
                <div>
                  <h2 className="font-semibold mb-2">Availability</h2>
                  {product.stock > 0 ? (
                    <p className="text-green-600">
                      In Stock ({product.stock} available)
                    </p>
                  ) : (
                    <p className="text-destructive">Out of Stock</p>
                  )}
                </div>
              )}

              {product.type === 'digital' && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <h2 className="font-semibold mb-2 flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Instant Download
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    This is a digital product. You will receive instant access to download 
                    after your purchase is complete.
                  </p>
                </div>
              )}

              <Separator />

              <AddToCartButton product={product} />

              {/* Product Details */}
              <div className="bg-muted/30 rounded-lg p-6 space-y-4">
                <h2 className="font-semibold">Product Details</h2>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Category</dt>
                    <dd className="font-medium capitalize">{product.category}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Type</dt>
                    <dd className="font-medium capitalize">{product.type}</dd>
                  </div>
                  {product.type === 'physical' && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Stock</dt>
                      <dd className="font-medium">{product.stock} units</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
