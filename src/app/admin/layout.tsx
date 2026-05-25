import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signout } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Verify auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // Fetch user role from custom users table
  const { data: userData, error: dbError } = await supabase
    .from('users')
    .select('role, nama_lengkap')
    .eq('id', user.id)
    .single()

  // STRICT ADMIN CHECK
  if (dbError || userData?.role !== 'admin') {
    // If not admin, redirect them back to their appropriate dashboard
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar for Desktop */}
      <aside className="hidden w-64 flex-col border-r border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 md:flex">
        <div className="p-6">
          <div className="flex items-center gap-2 px-2">
            <span className="text-xl font-bold tracking-tight text-red-600 dark:text-red-500">Rameo Admin</span>
          </div>
        </div>
        
        <nav className="flex-1 space-y-2">
          <Link href="/admin/moderation" className="block rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900">
            Moderasi Kampanye
          </Link>
          <Link href="/admin/withdrawals" className="block rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900">
            Withdrawal
          </Link>
          <Link href="/admin/disputes" className="block rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900">
            Resolusi Dispute
          </Link>
          <Link href="/admin/payments" className="block rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 dark:bg-red-950/50 dark:text-red-400">
            Pengaturan Pembayaran
          </Link>
          <Link href="/admin/config" className="block rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900">
            Platform Config
          </Link>
        </nav>

        <div className="mt-auto">
          <div className="mb-4 text-sm font-medium text-zinc-800 dark:text-zinc-200">
            {userData.nama_lengkap}
          </div>
          <form action={signout}>
            <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950">
              Keluar Admin
            </Button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8">
        <div className="md:hidden mb-4 p-4 bg-white rounded-lg border border-zinc-200 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <p className="text-sm font-medium text-red-600">Admin Panel (Mobile view restricted, please use Desktop)</p>
        </div>
        {children}
      </main>
    </div>
  )
}
