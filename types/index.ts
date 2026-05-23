export interface Product {
  _id: string
  name: string
  description: string
  price: number
  comparePrice?: number
  images: string[]
  category: string
  type: 'physical' | 'digital'
  stock: number
  downloadUrl?: string
  featured: boolean
  createdAt: string
  updatedAt: string
}

export interface Order {
  _id: string
  userId: string
  userEmail: string
  userName: string
  items: OrderItem[]
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total: number
  shippingAddress?: ShippingAddress
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
  image: string
  type: 'physical' | 'digital'
}

export interface ShippingAddress {
  fullName: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  phone: string
}

export interface Category {
  _id: string
  name: string
  slug: string
  description?: string
}
