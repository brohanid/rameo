import { SupabaseClient } from '@supabase/supabase-js'
import { getOrCreateWallet } from './wallet'

/**
 * Releases escrow funds from UMKM to Publisher upon task approval
 */
export async function releaseEscrowToPublisher(
  supabase: SupabaseClient,
  taskId: string
) {
  // 1. Get Task and Campaign details
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('*, campaigns(*)')
    .eq('id', taskId)
    .single()

  if (taskError || !task) throw new Error('Task tidak ditemukan')
  if (task.status !== 'submitted') throw new Error('Task belum di-submit atau sudah diproses')

  const umkmId = task.campaigns.umkm_id
  const publisherId = task.publisher_id
  const amount = task.campaigns.budget_per_task

  // 2. Fetch UMKM Wallet
  const { data: umkmWallet, error: uwError } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', umkmId)
    .single()

  if (uwError || !umkmWallet) throw new Error('Wallet UMKM tidak ditemukan')
  if (umkmWallet.escrow_balance < amount) throw new Error('Saldo Escrow UMKM tidak mencukupi untuk direlease')

  // 3. Get or Create Publisher Wallet
  const pubWallet = await getOrCreateWallet(supabase, publisherId)

  // 4. Update UMKM Wallet (Deduct from Escrow)
  const newUmkmEscrow = umkmWallet.escrow_balance - amount
  const { error: uwUpdateError } = await supabase
    .from('wallets')
    .update({ escrow_balance: newUmkmEscrow, updated_at: new Date().toISOString() })
    .eq('id', umkmWallet.id)
  
  if (uwUpdateError) throw new Error('Gagal memotong saldo escrow UMKM: ' + uwUpdateError.message)

  // 5. Update Publisher Wallet (Add to Active Balance)
  const newPubBalance = pubWallet.balance + amount
  const { error: pwUpdateError } = await supabase
    .from('wallets')
    .update({ balance: newPubBalance, updated_at: new Date().toISOString() })
    .eq('id', pubWallet.id)

  if (pwUpdateError) {
    // In a real transactional system, we must rollback UMKM wallet here if this fails.
    console.error('CRITICAL: Gagal menambah saldo publisher', pwUpdateError)
    throw new Error('Gagal menambah saldo publisher: ' + pwUpdateError.message)
  }

  // 6. Record Transactions Ledger
  // UMKM Side (Escrow Released out)
  await supabase.from('transactions').insert({
    user_id: umkmId,
    amount: -amount,
    tipe: 'campaign_escrow', // matching the release of escrow
    status: 'success',
    reference_id: taskId,
    catatan: `Escrow release untuk approval task ${taskId}`
  })

  // Publisher Side (Reward In)
  await supabase.from('transactions').insert({
    user_id: publisherId,
    amount: amount,
    tipe: 'task_reward',
    status: 'success',
    reference_id: taskId,
    catatan: `Reward penyelesaian kampanye ${task.campaigns.judul}`
  })

  return { success: true }
}
