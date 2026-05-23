import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { getDb } from './mongodb'
import { ObjectId } from 'mongodb'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export interface User {
  _id: ObjectId
  email: string
  name: string
  password: string
  role: 'user' | 'admin'
  createdAt: Date
  updatedAt: Date
}

export interface SafeUser {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(user: SafeUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyToken(token: string): { id: string; email: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string }
  } catch {
    return null
  }
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) return null

  const decoded = verifyToken(token)
  if (!decoded) return null

  const db = await getDb()
  const user = await db.collection<User>('users').findOne({ _id: new ObjectId(decoded.id) })

  if (!user) return null

  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
  }
}

export async function createUser(email: string, password: string, name: string): Promise<SafeUser> {
  const db = await getDb()
  
  const existingUser = await db.collection<User>('users').findOne({ email })
  if (existingUser) {
    throw new Error('User already exists')
  }

  const hashedPassword = await hashPassword(password)
  const now = new Date()

  const result = await db.collection<Omit<User, '_id'>>('users').insertOne({
    email,
    password: hashedPassword,
    name,
    role: 'user',
    createdAt: now,
    updatedAt: now,
  })

  return {
    id: result.insertedId.toString(),
    email,
    name,
    role: 'user',
  }
}

export async function loginUser(email: string, password: string): Promise<{ user: SafeUser; token: string }> {
  const db = await getDb()
  const user = await db.collection<User>('users').findOne({ email })

  if (!user) {
    throw new Error('Invalid credentials')
  }

  const isValid = await verifyPassword(password, user.password)
  if (!isValid) {
    throw new Error('Invalid credentials')
  }

  const safeUser: SafeUser = {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
  }

  const token = generateToken(safeUser)

  return { user: safeUser, token }
}
