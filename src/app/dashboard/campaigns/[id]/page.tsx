import { createClient } from '@/lib/supabase/server'
import { approveTask, rejectTask } from '@/app/actions/campaign'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export default async function CampaignDetailsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  // Fetch campaign and its tasks
  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select(`
      *,
      tasks (
        *,
        users!tasks_publisher_id_fkey (nama_lengkap)
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !campaign) {
    return <div>Kampanye tidak ditemukan.</div>
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount || 0)
  }

  const tasks = campaign.tasks || []

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{campaign.judul}</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Tinjau laporan pekerjaan publisher untuk kampanye ini.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Campaign Summary */}
        <Card className="md:col-span-1 border-zinc-200 shadow-sm dark:border-zinc-800 h-fit">
          <CardHeader>
            <CardTitle>Ringkasan Kampanye</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-zinc-500">Total Anggaran (Escrow)</div>
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {formatCurrency(campaign.budget_per_task * campaign.max_kuota)}
              </div>
            </div>
            <div>
              <div className="text-sm text-zinc-500">Reward per Publisher</div>
              <div className="font-medium">{formatCurrency(campaign.budget_per_task)}</div>
            </div>
            <div>
              <div className="text-sm text-zinc-500">Progress Kuota</div>
              <div className="font-medium">{campaign.kuota_terpakai} / {campaign.max_kuota} Publisher</div>
            </div>
            <div>
              <div className="text-sm text-zinc-500">Status</div>
              <div className="font-medium uppercase">{campaign.status}</div>
            </div>
          </CardContent>
        </Card>

        {/* Task Reviews */}
        <Card className="md:col-span-2 border-zinc-200 shadow-sm dark:border-zinc-800">
          <CardHeader>
            <CardTitle>Daftar Pengajuan Pekerjaan</CardTitle>
            <CardDescription>Periksa tautan bukti (URL) dan putuskan untuk menyetujui atau menolak.</CardDescription>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                Belum ada publisher yang mengambil atau menyelesaikan tugas ini.
              </div>
            ) : (
              <div className="space-y-6">
                {tasks.map((task: any) => (
                  <div key={task.id} className="border border-zinc-200 rounded-lg p-4 dark:border-zinc-800">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-bold">{task.users?.nama_lengkap || 'Publisher'}</div>
                        <div className="text-xs text-zinc-500 mt-1">
                          Waktu Submit: {task.submitted_at ? new Date(task.submitted_at).toLocaleString('id-ID') : '-'}
                        </div>
                      </div>
                      <div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          task.status === 'submitted' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30' :
                          task.status === 'approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30' :
                          task.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30' :
                          'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}>
                          {task.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">URL Bukti Posting:</div>
                      {task.url_bukti ? (
                        <a href={task.url_bukti} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline break-all bg-indigo-50 p-2 rounded block dark:bg-indigo-950/30">
                          {task.url_bukti}
                        </a>
                      ) : (
                        <span className="text-sm text-zinc-500 italic">Belum mengunggah bukti</span>
                      )}
                    </div>

                    {task.status === 'submitted' && (
                      <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                        {/* Approve Form */}
                        <form action={approveTask} className="flex-1">
                          <input type="hidden" name="task_id" value={task.id} />
                          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                            Setujui (Lepas Dana)
                          </Button>
                        </form>

                        {/* Reject Form */}
                        <form action={rejectTask} className="flex-1 flex gap-2">
                          <input type="hidden" name="task_id" value={task.id} />
                          <Input 
                            name="alasan_reject" 
                            placeholder="Alasan penolakan..." 
                            className="flex-1 text-sm" 
                            required 
                            minLength={10} 
                          />
                          <Button type="submit" variant="destructive">
                            Tolak
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
    </div>
  )
}
