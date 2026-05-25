'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { processDummyTopUp } from '@/lib/wallet'
import { z } from 'zod'

const TopUpSchema = z.object({
  amount: z.coerce.number().min(10000, { message: 'Minimal top-up adalah Rp 10.000' }),
})

export async function submitTopUp(formData: FormData) {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('Unauthorized')
  }

  // Parse amount
  const parsed = TopUpSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message)
  }

  const { amount } = parsed.data

  try {
    // Process top up
    await processDummyTopUp(supabase, user.id, amount)
    
    // Revalidate dashboard layout so balance updates
    revalidatePath('/dashboard', 'layout')
    
  } catch (err: any) {
    throw new Error(err.message)
  }
}

const WithdrawalSchema = z.object({
  amount: z.coerce.number().min(50000, { message: 'Minimal penarikan adalah Rp 50.000' }),
  metode: z.string().min(2, { message: 'Metode penarikan wajib diisi (mis. Bank BCA, GoPay)' }),
  nama_penerima: z.string().min(3, { message: 'Nama penerima wajib diisi' }),
  nomor_rekening: z.string().min(5, { message: 'Nomor rekening/HP wajib diisi' })
})

export async function requestWithdrawal(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Check role
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (userData?.role !== 'publisher') throw new Error('Hanya Publisher yang dapat melakukan penarikan dana')

  // Parse Form
  const parsed = WithdrawalSchema.safeParse(Object.fromEntries(formData.entries()))
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0].message)
  }

  const payload = parsed.data

  // Fetch Wallet
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (walletError || !wallet) throw new Error('Wallet tidak ditemukan')
  if (wallet.balance < payload.amount) throw new Error('Saldo tidak mencukupi')

  try {
    // 1. Deduct Balance
    const newBalance = wallet.balance - payload.amount
    const { error: updateError } = await supabase
      .from('wallets')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', wallet.id)

    if (updateError) throw new Error('Gagal memotong saldo')

    // 2. Insert Withdrawal Request
    const { data: request, error: reqError } = await supabase
      .from('withdrawal_requests')
      .insert({
        publisher_id: user.id,
        amount: payload.amount,
        metode: payload.metode,
        nama_penerima: payload.nama_penerima,
        nomor_rekening: payload.nomor_rekening,
        status: 'pending'
      })
      .select()
      .single()

    if (reqError) throw new Error('Gagal membuat pengajuan penarikan')

    // 3. Insert Transaction Ledger (Pending state)
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        amount: -payload.amount,
        tipe: 'withdrawal',
        status: 'pending',
        reference_id: request.id,
        catatan: `Pengajuan penarikan dana ke ${payload.metode}`
      })

    if (txError) console.error('Ledger error for withdrawal', txError)

    revalidatePath('/dashboard/wallet')
  } catch (err: any) {
    throw new Error(err.message)
  }
}

