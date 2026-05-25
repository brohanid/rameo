import Link from 'next/link'
import { login } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-900">
      <Card className="w-full max-w-md shadow-lg border-zinc-200 dark:border-zinc-800">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Masuk ke Rameo</CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">
            Masukkan email dan kata sandi Anda untuk mengakses akun.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={login} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="nama@email.com"
                required
                className="transition-colors focus-visible:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Kata Sandi</Label>
                <Link href="#" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
                  Lupa kata sandi?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="transition-colors focus-visible:ring-indigo-500"
              />
            </div>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white transition-all">
              Masuk
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-200 dark:border-zinc-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
                Atau lanjutkan dengan
              </span>
            </div>
          </div>

          <Button variant="outline" type="button" className="w-full transition-all">
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
            Google
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">Belum punya akun? </span>
          <Link href="/register" className="ml-1 font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
            Daftar sekarang
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
