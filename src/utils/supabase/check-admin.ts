import { createClient } from './server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function checkSuperadmin() {
  if (process.env.BYPASS_AUTH_FOR_TEST === 'true') {
    return { authorized: true, user: null }
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { 
        authorized: false, 
        response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) 
      }
    }

    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { role: true },
    })

    if (!profile || profile.role !== 'superadmin') {
      return { 
        authorized: false, 
        response: NextResponse.json({ error: 'Forbidden: Superadmin access required' }, { status: 403 }) 
      }
    }

    return { authorized: true, user }
  } catch (error: any) {
    console.error('Error checking superadmin role:', error)
    return { 
      authorized: false, 
      response: NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 }) 
    }
  }
}
