import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function CampaignsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .eq('umkm_id', user.id)
    .order('created_at', { ascending: false })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount || 0)
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active': return <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full dark:bg-emerald-900/30 dark:text-emerald-400">Aktif</span>
      case 'completed': return <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full dark:bg-indigo-900/30 dark:text-indigo-400">Selesai</span>
      case 'expired': return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full dark:bg-red-900/30 dark:text-red-400">Kadaluarsa</span>
      default: return <span className="bg-zinc-100 text-zinc-800 text-xs px-2 py-1 rounded-full dark:bg-zinc-800 dark:text-zinc-300">{status}</span>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kampanye Saya</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Kelola dan pantau kampanye promosi Anda.</p>
        </div>
        <Link href="/dashboard/campaigns/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
            + Buat Kampanye
          </Button>
        </Link>
      </div>

      {!campaigns || campaigns.length === 0 ? (
        <Card className="border-dashed border-2 border-zinc-200 dark:border-zinc-800 shadow-none">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Belum ada kampanye</h3>
            <p className="mt-2 text-sm text-zinc-500 max-w-sm">Anda belum membuat kampanye promosi apapun. Mulai sebar konten Anda sekarang juga!</p>
            <Link href="/dashboard/campaigns/new" className="mt-6">
              <Button>Buat Kampanye Pertama</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.map(camp => (
            <Card key={camp.id} className="flex flex-col border-zinc-200 shadow-sm dark:border-zinc-800">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="text-xs font-medium text-zinc-500 uppercase">{camp.tipe.replace('_', ' ')}</div>
                  {getStatusBadge(camp.status)}
                </div>
                <CardTitle className="text-lg leading-tight mt-2 line-clamp-1">{camp.judul}</CardTitle>
                <CardDescription className="line-clamp-2 mt-1">{camp.deskripsi}</CardDescription>
              </CardHeader>
              <CardContent className="pb-3 flex-1">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-zinc-100 pb-2 dark:border-zinc-800">
                    <span className="text-zinc-500">Reward / Task</span>
                    <span className="font-semibold">{formatCurrency(camp.budget_per_task)}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-zinc-500">Progress Kuota</span>
                    <span className="font-medium">{camp.kuota_terpakai} / {camp.max_kuota}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-zinc-100 rounded-full h-1.5 mt-1 overflow-hidden dark:bg-zinc-800">
                    <div 
                      className="bg-indigo-600 h-1.5 rounded-full" 
                      style={{ width: `${Math.min(100, (camp.kuota_terpakai / camp.max_kuota) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <Button variant="outline" className="w-full text-xs">Lihat Detail</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
