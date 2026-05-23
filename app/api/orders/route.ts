import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')

    const db = await getDb()

    // Build query
    const query: Record<string, unknown> = {}
    
    // If not admin, only show user's own orders
    if (!user || user.role !== 'admin') {
      if (!user) {
        return NextResponse.json({ orders: [], total: 0, page: 1, totalPages: 0 })
      }
      query.userId = user.id
    }
    
    if (status) query.status = status

    const orders = await db
      .collection('orders')
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray()

    const total = await db.collection('orders').countDocuments(query)

    return NextResponse.json({
      orders: orders.map(o => ({
        ...o,
        _id: o._id.toString(),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Get orders error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Please login to place an order' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { items, shippingAddress, total } = body

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      )
    }

    // Check if any physical products need shipping address
    const hasPhysical = items.some((item: { type: string }) => item.type === 'physical')
    if (hasPhysical && !shippingAddress) {
      return NextResponse.json(
        { error: 'Shipping address required for physical products' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const now = new Date()

    const result = await db.collection('orders').insertOne({
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      items,
      status: 'pending',
      total,
      shippingAddress: hasPhysical ? shippingAddress : undefined,
      paymentStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    })

    // Update product stock
    for (const item of items) {
      await db.collection('products').updateOne(
        { _id: new ObjectId(item.productId) },
        { $inc: { stock: -item.quantity } }
      )
    }

    return NextResponse.json({
      order: {
        _id: result.insertedId.toString(),
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        items,
        status: 'pending',
        total,
        shippingAddress: hasPhysical ? shippingAddress : undefined,
        paymentStatus: 'pending',
        createdAt: now,
        updatedAt: now,
      },
    })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { _id, status, paymentStatus } = body

    if (!_id) {
      return NextResponse.json(
        { error: 'Order ID required' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (status) updates.status = status
    if (paymentStatus) updates.paymentStatus = paymentStatus

    await db.collection('orders').updateOne(
      { _id: new ObjectId(_id) },
      { $set: updates }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update order error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
