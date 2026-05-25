import { createClient } from '@/lib/supabase/server'
import { approveWithdrawal, rejectWithdrawal } from '@/app/actions/admin-payment'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default async function AdminWithdrawalsPage() {
  const supabase = await createClient()

  // Fetch withdrawal requests
  const { data: requests } = await supabase
    .from('withdrawal_requests')
    .select(`
      *,
      users!withdrawal_requests_publisher_id_fkey(nama_lengkap, email)
    `)
    .order('created_at', { ascending: false })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount || 0)
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending': return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full dark:bg-yellow-900/30 dark:text-yellow-400">Menunggu</span>
      case 'completed': return <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full dark:bg-emerald-900/30 dark:text-emerald-400">Selesai</span>
      case 'failed': return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full dark:bg-red-900/30 dark:text-red-400">Ditolak/Gagal</span>
      default: return <span className="bg-zinc-100 text-zinc-800 text-xs px-2 py-1 rounded-full dark:bg-zinc-800 dark:text-zinc-300">{status}</span>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manajemen Penarikan Dana</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Proses pencairan dana pendapatan dari Publisher.</p>
      </div>

      <Card className="border-zinc-200 shadow-sm dark:border-zinc-800">
        <CardHeader>
          <CardTitle>Daftar Pengajuan Withdrawal</CardTitle>
          <CardDescription>Segera transfer dana secara manual ke rekening tujuan lalu klik Setujui.</CardDescription>
        </CardHeader>
        <CardContent>
          {!requests || requests.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              Belum ada pengajuan penarikan dana.
            </div>
          ) : (
            <div className="space-y-6">
              {requests.map((req: any) => (
                <div key={req.id} className="border border-zinc-200 rounded-lg p-4 flex flex-col md:flex-row gap-6 dark:border-zinc-800">
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-lg">{req.users?.nama_lengkap || req.users?.email}</div>
                        <div className="text-xs text-zinc-500">{new Date(req.created_at).toLocaleString('id-ID')}</div>
                      </div>
                      {getStatusBadge(req.status)}
                    </div>

                    <div className="bg-zinc-50 p-3 rounded-md border border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800 mt-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-zinc-500">Nominal:</div>
                        <div className="font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(req.amount)}</div>
                        <div className="text-zinc-500">Bank/E-Wallet:</div>
                        <div className="font-medium">{req.metode}</div>
                        <div className="text-zinc-500">Penerima:</div>
                        <div className="font-medium">{req.nama_penerima}</div>
                        <div className="text-zinc-500">No. Rekening:</div>
                        <div className="font-mono">{req.nomor_rekening}</div>
                      </div>
                    </div>
                    
                    {req.status === 'failed' && req.catatan_admin && (
                      <div className="text-xs text-red-600 bg-red-50 p-2 rounded mt-2 dark:bg-red-950/30 dark:text-red-400">
                        <strong>Alasan Penolakan:</strong> {req.catatan_admin}
                      </div>
                    )}
                  </div>

                  {req.status === 'pending' && (
                    <div className="w-full md:w-64 flex flex-col gap-3 justify-end border-t md:border-t-0 md:border-l border-zinc-100 pt-4 md:pt-0 md:pl-6 dark:border-zinc-800">
                      <form action={approveWithdrawal}>
                        <input type="hidden" name="request_id" value={req.id} />
                        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                          Sudah Ditransfer (Setujui)
                        </Button>
                      </form>

                      <form action={rejectWithdrawal} className="flex flex-col gap-2">
                        <input type="hidden" name="request_id" value={req.id} />
                        <Input 
                          name="catatan_admin" 
                          placeholder="Alasan penolakan..." 
                          className="text-xs h-8" 
                          required 
                        />
                        <Button type="submit" variant="destructive" size="sm" className="w-full">
                          Tolak & Kembalikan Saldo
                        </Button>
                      </form>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
