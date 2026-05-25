import { createClient } from '@/lib/supabase/server'
import { submitProof } from '@/app/actions/publisher'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default async function MyTasksPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch publisher's tasks joined with campaign data
  const { data: tasks } = await supabase
    .from('tasks')
    .select(`
      *,
      campaigns (
        judul,
        deskripsi,
        tipe,
        budget_per_task,
        konten_artikel,
        gambar_url,
        caption
      )
    `)
    .eq('publisher_id', user.id)
    .order('created_at', { ascending: false })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount || 0)
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'in_progress': return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full dark:bg-yellow-900/30 dark:text-yellow-400">Sedang Dikerjakan</span>
      case 'submitted': return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full dark:bg-blue-900/30 dark:text-blue-400">Menunggu Review</span>
      case 'approved': return <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full dark:bg-emerald-900/30 dark:text-emerald-400">Disetujui</span>
      case 'rejected': return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full dark:bg-red-900/30 dark:text-red-400">Ditolak (Revisi)</span>
      default: return <span className="bg-zinc-100 text-zinc-800 text-xs px-2 py-1 rounded-full dark:bg-zinc-800 dark:text-zinc-300">{status.replace('_', ' ')}</span>
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tugas Saya</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Pantau tugas yang Anda ambil dan unggah bukti publikasi.</p>
      </div>

      {!tasks || tasks.length === 0 ? (
        <Card className="border-dashed border-2 border-zinc-200 dark:border-zinc-800 shadow-none">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Belum ada tugas</h3>
            <p className="mt-2 text-sm text-zinc-500 max-w-sm">Anda belum mengambil tugas apapun. Kunjungi bursa pekerjaan untuk mulai menghasilkan uang.</p>
            <a href="/dashboard/jobs" className="mt-6">
              <Button>Cari Pekerjaan</Button>
            </a>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {tasks.map((task: any) => (
            <Card key={task.id} className="border-zinc-200 shadow-sm dark:border-zinc-800 overflow-hidden">
              <div className="flex flex-col md:flex-row">
                {/* Left side: Task Details */}
                <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-zinc-100 dark:border-zinc-800">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
                        {task.campaigns?.tipe?.replace('_', ' ')}
                      </div>
                      <h3 className="text-xl font-bold">{task.campaigns?.judul}</h3>
                    </div>
                    {getStatusBadge(task.status)}
                  </div>
                  
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-4">
                    <p>{task.campaigns?.deskripsi}</p>
                    
                    {(task.campaigns?.konten_artikel || task.campaigns?.caption) && (
                      <div className="bg-zinc-50 p-4 rounded-md border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
                        <span className="text-xs font-bold uppercase text-zinc-500 mb-2 block">Materi yang harus di-posting:</span>
                        <p className="whitespace-pre-wrap font-mono text-xs">{task.campaigns?.konten_artikel || task.campaigns?.caption}</p>
                      </div>
                    )}
                    
                    {task.campaigns?.gambar_url && (
                      <div className="mt-2">
                        <a href={task.campaigns.gambar_url} target="_blank" rel="noreferrer" className="text-indigo-600 text-sm hover:underline">
                          📎 Lihat Materi Gambar/Poster
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Actions & Status */}
                <div className="w-full md:w-80 bg-zinc-50 p-6 dark:bg-zinc-900/30 flex flex-col justify-between">
                  <div>
                    <div className="text-sm text-zinc-500 mb-1">Reward Publikasi</div>
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-6">
                      {formatCurrency(task.campaigns?.budget_per_task)}
                    </div>
                    
                    {task.status === 'rejected' && task.alasan_reject && (
                      <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900">
                        <span className="font-bold block mb-1">Alasan Penolakan:</span>
                        {task.alasan_reject}
                      </div>
                    )}
                  </div>

                  {(task.status === 'in_progress' || task.status === 'rejected') ? (
                    <form action={submitProof} className="space-y-4 mt-auto">
                      <input type="hidden" name="task_id" value={task.id} />
                      <div className="space-y-2">
                        <Label htmlFor={`proof-${task.id}`}>URL Bukti Posting <span className="text-red-500">*</span></Label>
                        <Input 
                          id={`proof-${task.id}`} 
                          name="url_bukti" 
                          type="url" 
                          placeholder="https://instagram.com/p/..." 
                          required 
                        />
                      </div>
                      <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                        Kirim Bukti
                      </Button>
                    </form>
                  ) : (
                    <div className="mt-auto space-y-2">
                      <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">URL Bukti Terkirim:</div>
                      <a href={task.url_bukti} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline break-all block bg-white p-2 rounded border border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800">
                        {task.url_bukti}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
