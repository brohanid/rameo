import { createClient } from '@/lib/supabase/server'
import { submitTopUp } from '@/app/actions/wallet'
import { requestWithdrawal } from '@/app/actions/wallet'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default async function WalletPage() {
  const supabase = await createClient()

  // Verify auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch role
  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

  // Fetch wallet
  let { data: wallet } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Fetch recent transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount || 0)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dompet & Saldo</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Kelola saldo dan lihat riwayat transaksi Anda.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Wallet Balance Card */}
        <Card className="border-zinc-200 bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="text-indigo-100">Saldo Tersedia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tracking-tight">
              {formatCurrency(wallet?.balance || 0)}
            </div>
            <div className="mt-4 flex flex-col gap-1 text-sm text-indigo-100">
              <div className="flex justify-between">
                <span>Saldo Tertahan (Escrow)</span>
                <span>{formatCurrency(wallet?.escrow_balance || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conditional Actions (Top Up vs Withdraw) */}
        {userData?.role === 'umkm' ? (
          <Card className="border-zinc-200 shadow-sm dark:border-zinc-800">
            <CardHeader>
              <CardTitle>Top Up Saldo</CardTitle>
              <CardDescription>Isi ulang saldo dompet Anda (Mode Dummy / Sandbox).</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={submitTopUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Nominal Top Up (Rp)</Label>
                  <Input 
                    id="amount" 
                    name="amount" 
                    type="number" 
                    min="10000" 
                    step="10000"
                    defaultValue="100000"
                    required 
                  />
                </div>
                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                  Konfirmasi Top Up
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-zinc-200 shadow-sm dark:border-zinc-800">
            <CardHeader>
              <CardTitle>Tarik Dana (Withdrawal)</CardTitle>
              <CardDescription>Tarik saldo pendapatan Anda ke rekening bank atau E-Wallet.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={requestWithdrawal} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount_withdraw">Nominal (Min. 50k)</Label>
                    <Input id="amount_withdraw" name="amount" type="number" min="50000" step="10000" placeholder="50000" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="metode">Metode / Bank</Label>
                    <Input id="metode" name="metode" placeholder="BCA / GoPay" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nama_penerima">Nama Pemilik Rekening</Label>
                  <Input id="nama_penerima" name="nama_penerima" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nomor_rekening">Nomor Rekening / HP</Label>
                  <Input id="nomor_rekening" name="nomor_rekening" required />
                </div>
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  Ajukan Penarikan
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Transaction History */}
      <Card className="border-zinc-200 shadow-sm dark:border-zinc-800">
        <CardHeader>
          <CardTitle>Riwayat Transaksi Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {!transactions || transactions.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-4">Belum ada transaksi.</p>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between border-b border-zinc-100 pb-4 last:border-0 last:pb-0 dark:border-zinc-800">
                  <div>
                    <p className="font-medium capitalize">{tx.tipe.replace('_', ' ')}</p>
                    <p className="text-xs text-zinc-500">{new Date(tx.created_at).toLocaleString('id-ID')}</p>
                    <p className="text-xs text-zinc-500">{tx.catatan}</p>
                  </div>
                  <div className={`font-semibold ${tx.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
