'use server'

import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function updateProfileRolePrisma(profileId: string, newRole: 'superadmin' | 'admin') {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    const accessToken = session?.access_token
    if (!accessToken) {
      return { success: false, error: 'Unauthorized: No active session' }
    }

    // Run within a Prisma transaction to lock the config parameter to this session connection
    const updatedProfile = await prisma.$transaction(async (tx) => {
      // Pass the Supabase JWT token to the Postgres transaction environment
      await tx.$executeRawUnsafe(`SELECT set_config('request.jwt', $1, true)`, accessToken)

      // Run the update under RLS constraints
      const updated = await tx.profile.update({
        where: { id: profileId },
        data: {
          role: newRole === 'superadmin' ? 'superadmin' : 'admin',
        },
      })

      return updated
    })

    revalidatePath('/dashboard/prisma-way')
    return { success: true, data: updatedProfile }
  } catch (err) {
    console.error('Prisma mutation RLS error:', err)
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }
}

export async function handleSignOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/dashboard/prisma-way')
}
