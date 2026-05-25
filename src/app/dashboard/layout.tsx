import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signout } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'

export default async function DashboardLayout({
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

  // Redirect to onboarding if role is missing or not set yet
  // If dbError is PGRST116 (No rows found), the user might not be synced yet, but we'll redirect anyway
  if (dbError || !userData?.role) {
    redirect('/onboarding')
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Top Navigation */}
      <header className="sticky top-0 z-10 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">Rameo</span>
            <span className="hidden rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 md:inline-flex">
              {userData.role.toUpperCase()}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden space-x-4 md:flex items-center mr-4">
              <a href="/dashboard" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">Dashboard</a>
              
              {userData.role === 'umkm' && (
                <a href="/dashboard/campaigns" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">Kampanye</a>
              )}
              
              {userData.role === 'publisher' && (
                <>
                  <a href="/dashboard/jobs" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">Cari Pekerjaan</a>
                  <a href="/dashboard/my-tasks" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">Tugas Saya</a>
                </>
              )}

              <a href="/dashboard/wallet" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">Wallet</a>
            </div>
            <div className="hidden flex-col items-end md:flex border-l border-zinc-200 pl-4 dark:border-zinc-800">
              <span className="text-sm font-medium">{userData.nama_lengkap || user.email}</span>
              <span className="text-xs text-zinc-500 capitalize">{userData.role}</span>
            </div>
            <form action={signout}>
              <Button variant="outline" size="sm" type="submit">Keluar</Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  )
}
