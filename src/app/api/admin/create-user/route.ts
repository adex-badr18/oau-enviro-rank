import { createClient as createServerClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['superadmin', 'user']).default('user'),
})

export async function POST(request: NextRequest) {
  try {
    // 1. Authorize the requester - must be a superadmin
    const supabase = await createServerClient()
    const {
      data: { user: requester },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !requester) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch requester's profile to verify if they are a superadmin using Prisma
    const profile = await prisma.profile.findUnique({
      where: { id: requester.id },
      select: { role: true },
    })

    if (!profile || profile.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Forbidden: Superadmin access required' },
        { status: 403 }
      )
    }

    // 2. Parse and validate the body
    const body = await request.json()
    const parsed = createUserSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation Error', details: parsed.error.format() },
        { status: 400 }
      )
    }

    const { email, password, role } = parsed.data

    // 3. Programmatically create the user in auth.users using the Admin Client
    const adminClient = createAdminClient()
    const { data: newAuthUser, error: createUserError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: { role },
    })

    if (createUserError || !newAuthUser.user) {
      return NextResponse.json(
        { error: 'Failed to create auth user', details: createUserError?.message },
        { status: 500 }
      )
    }

    // 4. Insert their profile into public.profiles using Prisma
    let newProfile
    try {
      newProfile = await prisma.profile.create({
        data: {
          id: newAuthUser.user.id,
          email: newAuthUser.user.email!,
          role,
        },
      })
    } catch (createProfileError: any) {
      // Clean up the auth user to keep auth in sync
      await adminClient.auth.admin.deleteUser(newAuthUser.user.id)
      return NextResponse.json(
        { error: 'Failed to create user profile', details: createProfileError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'User and profile created successfully',
        user: {
          id: newAuthUser.user.id,
          email: newAuthUser.user.email,
          role: newProfile.role,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    )
  }
}
