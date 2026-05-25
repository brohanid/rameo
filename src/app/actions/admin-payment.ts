'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { encrypt, decrypt } from '@/lib/encryption'

export async function savePaymentConfig(formData: FormData) {
  const supabase = await createClient()

  // Verify Admin role again for security
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') return { error: 'Unauthorized: Admin only' }

  const gatewayName = formData.get('gateway_name') as string
  const isActive = formData.get('is_active') === 'true'
  const isSandbox = formData.get('is_sandbox') === 'true'
  const apiKey = formData.get('api_key') as string
  const apiSecret = formData.get('api_secret') as string

  // We only encrypt and save the key if the user provided one.
  // If it's a series of asterisks (meaning it was masked and not changed), we skip updating the key.
  const updatePayload: any = {
    is_active: isActive,
    is_sandbox: isSandbox,
    updated_by: user.id,
    updated_at: new Date().toISOString()
  }

  if (apiKey && !apiKey.startsWith('****')) {
    updatePayload.api_key_encrypted = encrypt(apiKey)
  }

  if (apiSecret && !apiSecret.startsWith('****')) {
    updatePayload.api_secret_encrypted = encrypt(apiSecret)
  }

  const { error } = await supabase
    .from('payment_gateway_config')
    .upsert({ 
      gateway_name: gatewayName, 
      ...updatePayload 
    }, { onConflict: 'gateway_name' })

  if (error) {
    return { error: 'Gagal menyimpan konfigurasi: ' + error.message }
  }

  revalidatePath('/admin/payments')
  return { success: true }
}

export async function approveWithdrawal(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Check role
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (userData?.role !== 'admin') return { error: 'Unauthorized: Admin only' }

  const reqId = formData.get('request_id') as string

  // 1. Update Request Status
  const { error: updateError } = await supabase
    .from('withdrawal_requests')
    .update({ status: 'completed', processed_at: new Date().toISOString() })
    .eq('id', reqId)
    .eq('status', 'pending')

  if (updateError) return { error: 'Gagal memproses pengajuan: ' + updateError.message }

  // 2. Update Ledger Status to success
  await supabase
    .from('transactions')
    .update({ status: 'success' })
    .eq('reference_id', reqId)
    .eq('tipe', 'withdrawal')

  revalidatePath('/admin/withdrawals')
  return { success: true }
}

export async function rejectWithdrawal(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (userData?.role !== 'admin') return { error: 'Unauthorized: Admin only' }

  const reqId = formData.get('request_id') as string
  const alasan = formData.get('catatan_admin') as string

  // 1. Fetch request details to know the amount and publisher
  const { data: request, error: reqError } = await supabase
    .from('withdrawal_requests')
    .select('*')
    .eq('id', reqId)
    .eq('status', 'pending')
    .single()

  if (reqError || !request) return { error: 'Pengajuan tidak ditemukan atau sudah diproses' }

  // 2. Update Request Status
  const { error: updateError } = await supabase
    .from('withdrawal_requests')
    .update({ 
      status: 'failed', 
      catatan_admin: alasan,
      processed_at: new Date().toISOString() 
    })
    .eq('id', reqId)

  if (updateError) return { error: 'Gagal menolak pengajuan' }

  // 3. Mark Ledger as failed
  await supabase
    .from('transactions')
    .update({ status: 'failed', catatan: `Ditolak Admin: ${alasan}` })
    .eq('reference_id', reqId)
    .eq('tipe', 'withdrawal')

  // 4. Refund Wallet Balance
  const { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', request.publisher_id).single()
  if (wallet) {
    await supabase
      .from('wallets')
      .update({ balance: wallet.balance + request.amount, updated_at: new Date().toISOString() })
      .eq('id', wallet.id)
  }

  revalidatePath('/admin/withdrawals')
  return { success: true }
}
