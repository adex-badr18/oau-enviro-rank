'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfileRole(profileId: string, newRole: 'superadmin' | 'user') {
  try {
    const supabase = await createClient()
    
    // Perform update on the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', profileId)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/supabase-way')
    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function handleSignOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/dashboard/supabase-way')
}
