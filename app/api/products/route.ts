import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'
import { ObjectId } from 'mongodb'

// Demo products for initial setup
const demoProducts = [
  {
    name: 'Premium Wireless Headphones',
    description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life. Perfect for music lovers and professionals.',
    price: 199.99,
    comparePrice: 249.99,
    images: ['/products/headphones.jpg'],
    category: 'electronics',
    type: 'physical' as const,
    stock: 50,
    featured: true,
  },
  {
    name: 'UI Design Masterclass',
    description: 'Complete course on modern UI design principles. Learn Figma, design systems, and user experience best practices.',
    price: 79.99,
    comparePrice: 129.99,
    images: ['/products/course.jpg'],
    category: 'courses',
    type: 'digital' as const,
    stock: 999,
    downloadUrl: '/downloads/ui-masterclass.zip',
    featured: true,
  },
  {
    name: 'Minimalist Watch',
    description: 'Elegant minimalist watch with sapphire crystal and genuine leather strap. Water resistant up to 50m.',
    price: 149.99,
    images: ['/products/watch.jpg'],
    category: 'accessories',
    type: 'physical' as const,
    stock: 25,
    featured: true,
  },
  {
    name: 'E-Book: Modern JavaScript',
    description: 'Comprehensive guide to modern JavaScript including ES6+, async/await, and best practices for 2024.',
    price: 29.99,
    images: ['/products/ebook.jpg'],
    category: 'ebooks',
    type: 'digital' as const,
    stock: 999,
    downloadUrl: '/downloads/modern-js.pdf',
    featured: false,
  },
  {
    name: 'Smart Fitness Tracker',
    description: 'Track your steps, heart rate, sleep, and workouts. 7-day battery life and water resistant.',
    price: 89.99,
    comparePrice: 119.99,
    images: ['/products/tracker.jpg'],
    category: 'electronics',
    type: 'physical' as const,
    stock: 100,
    featured: true,
  },
  {
    name: 'Icon Pack - 1000+ Icons',
    description: 'Premium icon pack with 1000+ customizable icons in multiple formats (SVG, PNG, Figma).',
    price: 19.99,
    images: ['/products/icons.jpg'],
    category: 'digital-assets',
    type: 'digital' as const,
    stock: 999,
    downloadUrl: '/downloads/icon-pack.zip',
    featured: false,
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const type = searchParams.get('type')
    const featured = searchParams.get('featured')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')

    const db = await getDb()
    
    // Check if products exist, if not seed with demo data
    const count = await db.collection('products').countDocuments()
    if (count === 0) {
      const now = new Date()
      await db.collection('products').insertMany(
        demoProducts.map(p => ({
          ...p,
          createdAt: now,
          updatedAt: now,
        }))
      )
    }

    // Build query
    const query: Record<string, unknown> = {}
    if (category) query.category = category
    if (type) query.type = type
    if (featured === 'true') query.featured = true
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }

    const products = await db
      .collection('products')
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray()

    const total = await db.collection('products').countDocuments(query)

    return NextResponse.json({
      products: products.map(p => ({
        ...p,
        _id: p._id.toString(),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Get products error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, price, comparePrice, images, category, type, stock, downloadUrl, featured } = body

    if (!name || !description || !price || !category || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const now = new Date()

    const result = await db.collection('products').insertOne({
      name,
      description,
      price,
      comparePrice,
      images: images || [],
      category,
      type,
      stock: stock || 0,
      downloadUrl,
      featured: featured || false,
      createdAt: now,
      updatedAt: now,
    })

    return NextResponse.json({
      product: {
        _id: result.insertedId.toString(),
        name,
        description,
        price,
        comparePrice,
        images: images || [],
        category,
        type,
        stock: stock || 0,
        downloadUrl,
        featured: featured || false,
        createdAt: now,
        updatedAt: now,
      },
    })
  } catch (error) {
    console.error('Create product error:', error)
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
    const { _id, ...updates } = body

    if (!_id) {
      return NextResponse.json(
        { error: 'Product ID required' },
        { status: 400 }
      )
    }

    const db = await getDb()
    
    await db.collection('products').updateOne(
      { _id: new ObjectId(_id) },
      { $set: { ...updates, updatedAt: new Date() } }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update product error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID required' },
        { status: 400 }
      )
    }

    const db = await getDb()
    await db.collection('products').deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
