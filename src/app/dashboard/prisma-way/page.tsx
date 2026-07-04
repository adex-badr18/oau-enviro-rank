import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import PrismaWayClient from './PrismaWayClient'

export const dynamic = 'force-dynamic'

interface Profile {
  id: string
  email: string
  role: 'superadmin' | 'user'
  created_at: string
}

export default async function PrismaWayPage() {
  const supabase = await createClient()

  // 1. Get the current user session
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  if (!user) {
    return (
      <PrismaWayClient
        initialUser={null}
        initialProfile={null}
        initialProfiles={null}
      />
    )
  }

  let formattedProfile: Profile | null = null
  let formattedProfiles: Profile[] | null = null

  try {
    // 2. Fetch profile and profiles under RLS policies using Prisma
    const { profile, profiles } = await prisma.$transaction(async (tx) => {
      // CRITICAL: Inject Supabase JWT into the connection context
      await tx.$executeRawUnsafe(`SELECT set_config('request.jwt', $1, true)`, session.access_token)

      // Query the logged-in user's profile
      const profile = await tx.profile.findFirst({
        where: { id: user.id }
      })

      // Query all profiles. 
      // Because we injected the JWT, PostgreSQL RLS will automatically filter:
      // - Superadmin users will receive all profiles.
      // - Regular users will only receive their own profile.
      const profiles = await tx.profile.findMany({
        orderBy: { email: 'asc' }
      })

      return { profile, profiles }
    })

    formattedProfile = profile
      ? {
          id: profile.id,
          email: profile.email,
          role: profile.role === 'superadmin' ? ('superadmin' as const) : ('user' as const),
          created_at: profile.createdAt.toISOString()
        }
      : null

    formattedProfiles = profiles.map((p) => ({
      id: p.id,
      email: p.email,
      role: p.role === 'superadmin' ? ('superadmin' as const) : ('user' as const),
      created_at: p.createdAt.toISOString()
    }))
  } catch (err) {
    console.error('Error fetching data via Prisma with RLS:', err)
  }

  return (
    <PrismaWayClient
      initialUser={user}
      initialProfile={formattedProfile}
      initialProfiles={formattedProfiles}
    />
  )
}
