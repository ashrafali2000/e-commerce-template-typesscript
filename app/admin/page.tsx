'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { format } from 'date-fns'
import { 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign, 
  Clock,
  AlertTriangle,
  ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

const fetcher = (url: string) => fetch(url).then(res => res.json())

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-3 w-32 mt-2" />
      </CardContent>
    </Card>
  )
}

export default function AdminDashboard() {
  const { data, isLoading } = useSWR('/api/admin/stats', fetcher)

  const stats = [
    {
      title: 'Total Products',
      value: data?.stats?.totalProducts || 0,
      icon: Package,
      description: 'Products in catalog',
      href: '/admin/products',
    },
    {
      title: 'Total Orders',
      value: data?.stats?.totalOrders || 0,
      icon: ShoppingCart,
      description: `${data?.stats?.pendingOrders || 0} pending`,
      href: '/admin/orders',
    },
    {
      title: 'Total Users',
      value: data?.stats?.totalUsers || 0,
      icon: Users,
      description: 'Registered users',
      href: '/admin/users',
    },
    {
      title: 'Revenue',
      value: `$${(data?.stats?.totalRevenue || 0).toFixed(2)}`,
      icon: DollarSign,
      description: 'Total earnings',
      href: '/admin/orders',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your store performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : stats.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                  <Button variant="link" size="sm" className="px-0 mt-2" asChild>
                    <Link href={stat.href}>
                      View all
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/orders">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
            ) : data?.recentOrders?.length > 0 ? (
              <div className="space-y-4">
                {data.recentOrders.map((order: {
                  _id: string
                  userName: string
                  total: number
                  status: string
                  createdAt: string
                }) => (
                  <div key={order._id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">#{order._id.slice(-8).toUpperCase()}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.userName} - ${order.total.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge
                      className={
                        order.status === 'delivered'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }
                    >
                      {order.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No orders yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Low Stock Alert
            </CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/products">Manage</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
            ) : data?.lowStock?.length > 0 ? (
              <div className="space-y-4">
                {data.lowStock.map((product: {
                  _id: string
                  name: string
                  stock: number
                }) => (
                  <div key={product._id} className="flex items-center justify-between">
                    <p className="font-medium line-clamp-1">{product.name}</p>
                    <Badge
                      className={
                        product.stock === 0
                          ? 'bg-red-100 text-red-800'
                          : 'bg-orange-100 text-orange-800'
                      }
                    >
                      {product.stock === 0 ? 'Out of Stock' : `${product.stock} left`}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">All products are well stocked</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
