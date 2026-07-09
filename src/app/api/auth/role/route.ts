import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ role: null })
    }

    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { role: true }
    })

    return NextResponse.json({ role: profile?.role || null })
  } catch (error: any) {
    console.error('Error fetching user role:', error)
    return NextResponse.json({ role: null }, { status: 500 })
  }
}
