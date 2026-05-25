import { submitProfile } from '@/app/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-900">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Selamat Datang di Rameo!</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Pilih jenis akun yang sesuai dengan kebutuhan Anda.</p>
        </div>

        <Tabs defaultValue="umkm" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-14 mb-8">
            <TabsTrigger value="umkm" className="text-lg">👩‍💼 Saya UMKM</TabsTrigger>
            <TabsTrigger value="publisher" className="text-lg">🚀 Saya Publisher</TabsTrigger>
          </TabsList>
          
          <TabsContent value="umkm">
            <Card className="border-indigo-100 shadow-md dark:border-indigo-950">
              <CardHeader>
                <CardTitle>Profil Bisnis UMKM</CardTitle>
                <CardDescription>
                  Lengkapi data bisnis Anda agar publisher lebih mudah mengenali produk Anda.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={submitProfile} className="space-y-4">
                  <input type="hidden" name="role" value="umkm" />
                  
                  <div className="space-y-2">
                    <Label htmlFor="nama_bisnis">Nama Bisnis / Toko <span className="text-red-500">*</span></Label>
                    <Input id="nama_bisnis" name="nama_bisnis" placeholder="Contoh: Sepatu Lokal Bandung" required />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="kategori">Kategori Industri</Label>
                    <Input id="kategori" name="kategori" placeholder="Contoh: Fashion & Apparel" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">Nomor WhatsApp Aktif <span className="text-red-500">*</span></Label>
                    <Input id="whatsapp" name="whatsapp" placeholder="08123456789" required />
                    <p className="text-xs text-zinc-500">Nomor ini digunakan untuk mempermudah koordinasi jika terjadi dispute.</p>
                  </div>
                  
                  <Button type="submit" className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700">Simpan Profil & Lanjut</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="publisher">
            <Card className="border-emerald-100 shadow-md dark:border-emerald-950">
              <CardHeader>
                <CardTitle>Profil Publisher</CardTitle>
                <CardDescription>
                  Daftarkan aset digital Anda (blog atau media sosial) untuk mulai menerima job. Minimal isi salah satu.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={submitProfile} className="space-y-4">
                  <input type="hidden" name="role" value="publisher" />
                  
                  <div className="space-y-2">
                    <Label htmlFor="blog_url">URL Website / Blog</Label>
                    <Input id="blog_url" name="blog_url" placeholder="https://www.blog-saya.com" type="url" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="instagram_url">URL Instagram</Label>
                    <Input id="instagram_url" name="instagram_url" placeholder="https://instagram.com/username" type="url" />
                  </div>
                  
                  <Button type="submit" className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700">Simpan Profil & Lanjut</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
