import { createClient } from '@/lib/supabase/server'
import { takeJob } from '@/app/actions/publisher'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function JobBoardPage() {
  const supabase = await createClient()

  // Fetch all active campaigns that haven't reached their max_kuota
  // Note: For MVP, we filter simple conditions. 
  // In a real app, we'd use raw SQL or a view to do: max_kuota > kuota_terpakai
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*, users!campaigns_umkm_id_fkey(nama_lengkap, umkm_profiles(nama_bisnis))')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
  
  // Filter available quotas
  const availableJobs = campaigns?.filter(c => c.kuota_terpakai < c.max_kuota) || []

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount || 0)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cari Pekerjaan (Job Board)</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Jelajahi kampanye promosi aktif dan hasilkan pendapatan.</p>
      </div>

      {availableJobs.length === 0 ? (
        <Card className="border-dashed border-2 border-zinc-200 dark:border-zinc-800 shadow-none">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Belum ada kampanye tersedia</h3>
            <p className="mt-2 text-sm text-zinc-500 max-w-sm">Saat ini belum ada tugas baru dari UMKM. Silakan kembali lagi nanti.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {availableJobs.map(job => (
            <Card key={job.id} className="flex flex-col border-zinc-200 shadow-sm dark:border-zinc-800">
              <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-3">
                <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1 uppercase tracking-wider">
                  {job.tipe.replace('_', ' ')}
                </div>
                <CardTitle className="text-xl leading-tight line-clamp-2">{job.judul}</CardTitle>
                <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mt-2 flex items-center gap-2">
                  <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-xs">
                    {/* eslint-disable-next-line */}
                    {job.users?.umkm_profiles?.[0]?.nama_bisnis || job.users?.nama_lengkap || 'UMKM'}
                  </span>
                </div>
              </CardHeader>
              
              <CardContent className="pb-4 flex-1">
                <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3 mb-4">
                  {job.deskripsi}
                </p>
                <div className="space-y-2 mt-auto">
                  <div className="flex justify-between items-center text-sm bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded">
                    <span className="text-zinc-500">Reward</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                      {formatCurrency(job.budget_per_task)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs px-1">
                    <span className="text-zinc-500">Sisa Kuota</span>
                    <span className="font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded">
                      {job.max_kuota - job.kuota_terpakai} tugas
                    </span>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="pt-0">
                <form action={takeJob} className="w-full">
                  <input type="hidden" name="campaign_id" value={job.id} />
                  <Button type="submit" className="w-full bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900">
                    Ambil Tugas
                  </Button>
                </form>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
