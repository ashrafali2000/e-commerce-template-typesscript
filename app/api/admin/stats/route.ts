import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const db = await getDb()

    // Get counts
    const totalProducts = await db.collection('products').countDocuments()
    const totalOrders = await db.collection('orders').countDocuments()
    const totalUsers = await db.collection('users').countDocuments()
    
    // Get revenue
    const orders = await db.collection('orders').find({ paymentStatus: 'paid' }).toArray()
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0)
    
    // Get pending orders
    const pendingOrders = await db.collection('orders').countDocuments({ status: 'pending' })
    
    // Get recent orders
    const recentOrders = await db
      .collection('orders')
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray()

    // Get low stock products
    const lowStock = await db
      .collection('products')
      .find({ type: 'physical', stock: { $lt: 10 } })
      .toArray()

    return NextResponse.json({
      stats: {
        totalProducts,
        totalOrders,
        totalUsers,
        totalRevenue,
        pendingOrders,
      },
      recentOrders: recentOrders.map(o => ({
        ...o,
        _id: o._id.toString(),
      })),
      lowStock: lowStock.map(p => ({
        ...p,
        _id: p._id.toString(),
      })),
    })
  } catch (error) {
    console.error('Get admin stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
