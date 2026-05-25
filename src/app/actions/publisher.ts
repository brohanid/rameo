'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export async function takeJob(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const campaignId = formData.get('campaign_id') as string

  // Check role
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (userData?.role !== 'publisher') throw new Error('Hanya Publisher yang dapat mengambil tugas')

  // 1. Check if campaign exists, is active, and has quota
  const { data: campaign, error: campError } = await supabase
    .from('campaigns')
    .select('id, max_kuota, kuota_terpakai, status')
    .eq('id', campaignId)
    .single()

  if (campError || !campaign) throw new Error('Kampanye tidak ditemukan')
  if (campaign.status !== 'active') throw new Error('Kampanye sudah tidak aktif')
  if (campaign.kuota_terpakai >= campaign.max_kuota) throw new Error('Kuota kampanye sudah penuh')

  // 2. Check for double take
  const { data: existingTask } = await supabase
    .from('tasks')
    .select('id')
    .eq('campaign_id', campaignId)
    .eq('publisher_id', user.id)
    .single()

  if (existingTask) {
    throw new Error('Anda sudah mengambil tugas ini sebelumnya')
  }

  // 3. Take Job: Insert Task and Update Campaign Quota
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .insert({
      campaign_id: campaignId,
      publisher_id: user.id,
      status: 'in_progress',
    })
    .select()
    .single()

  if (taskError) throw new Error('Gagal mengambil tugas: ' + taskError.message)

  const { error: updateCampError } = await supabase
    .from('campaigns')
    .update({ kuota_terpakai: campaign.kuota_terpakai + 1 })
    .eq('id', campaignId)

  if (updateCampError) {
    // Ideally rollback task insert here
    console.error('Gagal update kuota kampanye', updateCampError)
  }

  revalidatePath('/dashboard/jobs')
  redirect('/dashboard/my-tasks')
}

export async function submitProof(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const taskId = formData.get('task_id') as string
  const proofUrl = formData.get('url_bukti') as string

  if (!proofUrl || !proofUrl.startsWith('http')) {
    throw new Error('URL Bukti tidak valid')
  }

  // Ensure task belongs to user
  const { data: task, error: checkError } = await supabase
    .from('tasks')
    .select('id, status')
    .eq('id', taskId)
    .eq('publisher_id', user.id)
    .single()

  if (checkError || !task) throw new Error('Tugas tidak ditemukan')
  if (task.status !== 'in_progress' && task.status !== 'rejected') {
    throw new Error('Tugas tidak dalam status yang dapat di-submit')
  }

  const { error: updateError } = await supabase
    .from('tasks')
    .update({
      url_bukti: proofUrl,
      status: 'submitted',
      submitted_at: new Date().toISOString()
    })
    .eq('id', taskId)

  if (updateError) throw new Error('Gagal mengirim bukti: ' + updateError.message)

  revalidatePath('/dashboard/my-tasks')
}
