import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth-session'

export async function checkSuperadmin() {
  if (process.env.BYPASS_AUTH_FOR_TEST === 'true') {
    return { authorized: true, user: null }
  }

  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('oau_session')?.value

    if (!token) {
      return { 
        authorized: false, 
        response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) 
      }
    }

    const payload = verifyToken(token)

    if (!payload || payload.role !== 'superadmin') {
      return { 
        authorized: false, 
        response: NextResponse.json({ error: 'Forbidden: Superadmin access required' }, { status: 403 }) 
      }
    }

    return { authorized: true, user: payload }
  } catch (error: any) {
    if (error && typeof error.message === 'string' && !error.message.includes('outside a request scope')) {
      console.error('Error checking superadmin role:', error)
    }
    return { 
      authorized: false, 
      response: NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 }) 
    }
  }
}
