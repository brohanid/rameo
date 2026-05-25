'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const ProfileSchema = z.object({
  role: z.enum(['umkm', 'publisher']),
  nama_bisnis: z.string().optional(),
  kategori: z.string().optional(),
  whatsapp: z.string().optional(),
  blog_url: z.string().optional(),
  instagram_url: z.string().optional(),
})

export async function submitProfile(formData: FormData) {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('Anda harus login untuk melengkapi profil.')
  }

  // Parse form data
  const parsed = ProfileSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    throw new Error('Data tidak valid. Mohon periksa kembali input Anda.')
  }

  const { role, nama_bisnis, kategori, whatsapp, blog_url, instagram_url } = parsed.data

  // 1. Update user role and status in users table
  // Assuming users table is automatically populated via trigger on auth.users,
  // we just need to update it.
  const { error: userUpdateError } = await supabase
    .from('users')
    .update({ role, status: 'active' })
    .eq('id', user.id)

  if (userUpdateError) {
    throw new Error('Gagal memperbarui profil utama: ' + userUpdateError.message)
  }

  // 2. Insert into specific profile table
  if (role === 'umkm') {
    const { error: umkmError } = await supabase
      .from('umkm_profiles')
      .insert({
        user_id: user.id,
        nama_bisnis: nama_bisnis || '',
        kategori: kategori || '',
        whatsapp: whatsapp || '',
      })
    
    if (umkmError) {
      throw new Error('Gagal menyimpan profil UMKM: ' + umkmError.message)
    }
  } else if (role === 'publisher') {
    const { error: publisherError } = await supabase
      .from('publisher_profiles')
      .insert({
        user_id: user.id,
        blog_url: blog_url || '',
        instagram_url: instagram_url || '',
      })

    if (publisherError) {
      throw new Error('Gagal menyimpan profil Publisher: ' + publisherError.message)
    }
  }

  // Success, redirect to dashboard
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
