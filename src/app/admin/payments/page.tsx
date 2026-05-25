import { createClient } from '@/lib/supabase/server'
import { savePaymentConfig } from '@/app/actions/admin-payment'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default async function PaymentsAdminPage() {
  const supabase = await createClient()

  // Fetch current configurations
  const { data: configs } = await supabase
    .from('payment_gateway_config')
    .select('*')

  const tripayConfig = configs?.find(c => c.gateway_name === 'tripay') || { is_active: false, is_sandbox: true }
  const xenditConfig = configs?.find(c => c.gateway_name === 'xendit') || { is_active: false, is_sandbox: true }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pengaturan Pembayaran</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Konfigurasi API kunci untuk Payment Gateway Tripay & Xendit.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Tripay Configuration */}
        <Card className="border-zinc-200 shadow-sm dark:border-zinc-800">
          <CardHeader>
            <CardTitle>Tripay (Deposit)</CardTitle>
            <CardDescription>Gateway utama untuk UMKM melakukan top-up wallet.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={savePaymentConfig} className="space-y-4">
              <input type="hidden" name="gateway_name" value="tripay" />
              
              <div className="flex items-center gap-4 border-b border-zinc-100 pb-4 dark:border-zinc-800">
                <div className="space-y-0.5 flex-1">
                  <Label>Status Gateway</Label>
                  <div className="text-sm text-zinc-500">Aktifkan untuk menerima pembayaran via Tripay.</div>
                </div>
                <select name="is_active" defaultValue={String(tripayConfig.is_active)} className="border rounded p-2 text-sm bg-white dark:bg-zinc-950">
                  <option value="true">Aktif</option>
                  <option value="false">Nonaktif</option>
                </select>
              </div>

              <div className="flex items-center gap-4 border-b border-zinc-100 pb-4 dark:border-zinc-800">
                <div className="space-y-0.5 flex-1">
                  <Label>Environment</Label>
                  <div className="text-sm text-zinc-500">Gunakan Sandbox untuk testing.</div>
                </div>
                <select name="is_sandbox" defaultValue={String(tripayConfig.is_sandbox)} className="border rounded p-2 text-sm bg-white dark:bg-zinc-950">
                  <option value="true">Sandbox</option>
                  <option value="false">Production</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tripay_api_key">API Key</Label>
                <Input 
                  id="tripay_api_key" 
                  name="api_key" 
                  type="password" 
                  placeholder={tripayConfig.api_key_encrypted ? "******** (Tersimpan terenkripsi)" : "Masukkan API Key Tripay"} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tripay_api_secret">Private/Secret Key</Label>
                <Input 
                  id="tripay_api_secret" 
                  name="api_secret" 
                  type="password" 
                  placeholder={tripayConfig.api_secret_encrypted ? "******** (Tersimpan terenkripsi)" : "Masukkan Secret Key Tripay"} 
                />
              </div>

              <Button type="submit" className="w-full bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200">
                Simpan Konfigurasi Tripay
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Xendit Configuration */}
        <Card className="border-zinc-200 shadow-sm dark:border-zinc-800">
          <CardHeader>
            <CardTitle>Xendit (Disbursement)</CardTitle>
            <CardDescription>Gateway utama untuk pencairan dana ke rekening Publisher.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={savePaymentConfig} className="space-y-4">
              <input type="hidden" name="gateway_name" value="xendit" />
              
              <div className="flex items-center gap-4 border-b border-zinc-100 pb-4 dark:border-zinc-800">
                <div className="space-y-0.5 flex-1">
                  <Label>Status Gateway</Label>
                  <div className="text-sm text-zinc-500">Aktifkan untuk mengizinkan pencairan dana.</div>
                </div>
                <select name="is_active" defaultValue={String(xenditConfig.is_active)} className="border rounded p-2 text-sm bg-white dark:bg-zinc-950">
                  <option value="true">Aktif</option>
                  <option value="false">Nonaktif</option>
                </select>
              </div>

              <div className="flex items-center gap-4 border-b border-zinc-100 pb-4 dark:border-zinc-800">
                <div className="space-y-0.5 flex-1">
                  <Label>Environment</Label>
                  <div className="text-sm text-zinc-500">Gunakan Sandbox untuk testing.</div>
                </div>
                <select name="is_sandbox" defaultValue={String(xenditConfig.is_sandbox)} className="border rounded p-2 text-sm bg-white dark:bg-zinc-950">
                  <option value="true">Sandbox</option>
                  <option value="false">Production</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="xendit_api_key">Secret API Key</Label>
                <Input 
                  id="xendit_api_key" 
                  name="api_key" 
                  type="password" 
                  placeholder={xenditConfig.api_key_encrypted ? "******** (Tersimpan terenkripsi)" : "xnd_development_..."} 
                />
              </div>

              <Button type="submit" className="w-full mt-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200">
                Simpan Konfigurasi Xendit
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
