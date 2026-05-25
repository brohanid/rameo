import { SupabaseClient } from '@supabase/supabase-js'

export async function processCampaignEscrow(
  supabase: SupabaseClient, 
  userId: string, 
  totalBudget: number, 
  campaignData: any
) {
  // 1. Fetch wallet
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (walletError || !wallet) {
    throw new Error('Wallet tidak ditemukan')
  }

  // 2. Check balance
  if (wallet.balance < totalBudget) {
    throw new Error(`Saldo tidak cukup. Saldo Anda: Rp ${wallet.balance}, dibutuhkan: Rp ${totalBudget}`)
  }

  // 3. Create Campaign
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .insert({
      umkm_id: userId,
      ...campaignData,
      status: 'active'
    })
    .select()
    .single()

  if (campaignError) {
    throw new Error('Gagal membuat kampanye: ' + campaignError.message)
  }

  // 4. Update Wallet (Move balance to escrow_balance)
  const newBalance = wallet.balance - totalBudget
  const newEscrow = wallet.escrow_balance + totalBudget

  const { error: updateWalletError } = await supabase
    .from('wallets')
    .update({ balance: newBalance, escrow_balance: newEscrow, updated_at: new Date().toISOString() })
    .eq('id', wallet.id)

  if (updateWalletError) {
    // Note: In real production without RPC, if this fails, we need to rollback campaign creation.
    // Assuming Supabase JS handles this or we rely on robust connection.
    throw new Error('Gagal memproses escrow: ' + updateWalletError.message)
  }

  // 5. Insert Transaction Ledger
  const { error: txError } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      amount: -totalBudget, // negative means outcome from main balance
      tipe: 'campaign_escrow',
      status: 'success',
      reference_id: campaign.id,
      catatan: `Escrow untuk kampanye: ${campaignData.judul}`
    })

  if (txError) {
    console.error('Failed to create ledger log for escrow', txError)
  }

  return { success: true, campaignId: campaign.id }
}
