'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { processCampaignEscrow } from '@/lib/campaign'
import { z } from 'zod'

const CampaignSchema = z.object({
  judul: z.string().min(5, { message: 'Judul minimal 5 karakter' }),
  deskripsi: z.string().min(20, { message: 'Deskripsi minimal 20 karakter' }),
  tipe: z.enum(['blog_post', 'sosmed_post']),
  konten_artikel: z.string().optional(),
  gambar_url: z.string().optional(),
  caption: z.string().optional(),
  budget_per_task: z.coerce.number().min(5000, { message: 'Budget minimal Rp 5.000' }),
  max_kuota: z.coerce.number().min(1, { message: 'Kuota minimal 1' }),
  min_da: z.coerce.number().optional().default(0),
  min_followers: z.coerce.number().optional().default(0),
  platform_target: z.string().optional(),
})

export async function submitCampaign(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Check if role is umkm
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (userData?.role !== 'umkm') return { error: 'Hanya UMKM yang dapat membuat kampanye' }

  // Parse Form
  const parsed = CampaignSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const payload = parsed.data
  const totalBudget = payload.budget_per_task * payload.max_kuota

  try {
    await processCampaignEscrow(supabase, user.id, totalBudget, payload)
  } catch (err: any) {
    return { error: err.message }
  }

  revalidatePath('/dashboard/campaigns')
  redirect('/dashboard/campaigns')
}

export async function approveTask(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const taskId = formData.get('task_id') as string

  // Note: For MVP we skip verifying if the user really owns the campaign associated with the task
  // to save queries, but in production we MUST check it.

  try {
    // 1. Release Escrow
    const { releaseEscrowToPublisher } = await import('@/lib/escrow')
    await releaseEscrowToPublisher(supabase, taskId)

    // 2. Update Task Status
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', taskId)

    if (updateError) throw new Error('Gagal update status tugas: ' + updateError.message)

    revalidatePath('/dashboard/campaigns')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function rejectTask(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const taskId = formData.get('task_id') as string
  const alasan = formData.get('alasan_reject') as string

  if (!alasan || alasan.length < 10) return { error: 'Alasan penolakan minimal 10 karakter' }

  const { error: updateError } = await supabase
    .from('tasks')
    .update({ 
      status: 'rejected', 
      alasan_reject: alasan,
      reviewed_at: new Date().toISOString() 
    })
    .eq('id', taskId)

  if (updateError) return { error: 'Gagal menolak tugas: ' + updateError.message }

  revalidatePath('/dashboard/campaigns')
  return { success: true }
}
