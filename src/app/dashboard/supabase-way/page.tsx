import { createClient } from '@/utils/supabase/server'
import SupabaseWayClient from './SupabaseWayClient'

export const dynamic = 'force-dynamic'

interface Profile {
  id: string
  email: string
  role: 'superadmin' | 'user'
  created_at: string
}

export default async function SupabaseWayPage() {
  const supabase = await createClient()

  // 1. Get the current user session
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <SupabaseWayClient
        initialUser={null}
        initialProfile={null}
        initialProfiles={null}
      />
    )
  }

  // 2. Fetch the user's profile from the public.profiles table
  const { data: profile } = (await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()) as unknown as { data: Profile | null; error: unknown }

  // 3. Fetch all profiles if they are superadmin, otherwise only fetch their own profile
  let profiles: Profile[] | null = null
  if (profile && profile.role === 'superadmin') {
    const { data: allProfiles } = (await supabase
      .from('profiles')
      .select('*')
      .order('email', { ascending: true })) as unknown as { data: Profile[] | null; error: unknown }
    profiles = allProfiles
  } else if (profile) {
    // Standard user can only access their own profile
    const { data: userProfile } = (await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)) as unknown as { data: Profile[] | null; error: unknown }
    profiles = userProfile
  }

  return (
    <SupabaseWayClient
      initialUser={user}
      initialProfile={profile}
      initialProfiles={profiles}
    />
  )
}
