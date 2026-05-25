import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Ensures a user has a wallet. If not, creates one.
 */
export async function getOrCreateWallet(supabase: SupabaseClient, userId: string) {
  const { data: wallet, error: fetchError } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (wallet) return wallet

  // Wallet doesn't exist, create it
  const { data: newWallet, error: insertError } = await supabase
    .from('wallets')
    .insert({ user_id: userId, balance: 0, escrow_balance: 0 })
    .select()
    .single()

  if (insertError) {
    throw new Error('Failed to create wallet: ' + insertError.message)
  }

  return newWallet
}

/**
 * Process a top-up transaction (Dummy Mode)
 */
export async function processDummyTopUp(supabase: SupabaseClient, userId: string, amount: number) {
  // 1. Get or create wallet
  const wallet = await getOrCreateWallet(supabase, userId)

  // 2. Insert transaction ledger
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      amount: amount,
      tipe: 'deposit',
      status: 'success',
      gateway: 'dummy',
      catatan: 'Dummy Top-up',
    })
    .select()
    .single()

  if (txError) {
    throw new Error('Failed to record transaction: ' + txError.message)
  }

  // 3. Update wallet balance
  const newBalance = wallet.balance + amount
  const { error: walletError } = await supabase
    .from('wallets')
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq('id', wallet.id)

  if (walletError) {
    // In a real system, we need a rollback or RPC transaction here.
    throw new Error('Failed to update wallet balance: ' + walletError.message)
  }

  return { success: true, newBalance, transactionId: transaction.id }
}
