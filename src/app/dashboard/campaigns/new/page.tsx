'use client'

import { useState } from 'react'
import { submitCampaign } from '@/app/actions/campaign'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function NewCampaignPage() {
  const [budget, setBudget] = useState(20000)
  const [kuota, setKuota] = useState(10)
  const totalAnggaran = budget * kuota

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount || 0)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Buat Kampanye Baru</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Desain tugas promosi Anda untuk dikerjakan oleh para Publisher.</p>
      </div>

      <form action={submitCampaign} className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Left Column: Form Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-zinc-200 shadow-sm dark:border-zinc-800">
            <CardHeader>
              <CardTitle>Informasi Dasar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="judul">Judul Kampanye <span className="text-red-500">*</span></Label>
                <Input id="judul" name="judul" placeholder="Contoh: Review Sepatu Kets Lokal Terbaru" required minLength={5} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deskripsi">Deskripsi & Instruksi Tugas <span className="text-red-500">*</span></Label>
                <textarea 
                  id="deskripsi" 
                  name="deskripsi" 
                  rows={4}
                  className="flex w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:placeholder:text-zinc-400 dark:focus-visible:ring-indigo-500"
                  placeholder="Jelaskan secara detail apa yang harus dilakukan oleh publisher..." 
                  required 
                  minLength={20}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipe">Tipe Kampanye <span className="text-red-500">*</span></Label>
                <select id="tipe" name="tipe" className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 dark:border-zinc-800 dark:bg-zinc-950">
                  <option value="blog_post">Blog Post / Backlink</option>
                  <option value="sosmed_post">Sosial Media Post</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-200 shadow-sm dark:border-zinc-800">
            <CardHeader>
              <CardTitle>Materi Kampanye</CardTitle>
              <CardDescription>Materi ini akan diberikan kepada publisher ketika mereka mengambil tugas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="konten_artikel">Teks Artikel / Caption</Label>
                <textarea 
                  id="konten_artikel" 
                  name="konten_artikel" 
                  rows={6}
                  className="flex w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:placeholder:text-zinc-400"
                  placeholder="Ketik atau paste materi teks di sini..." 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gambar_url">URL Gambar Poster (Opsional)</Label>
                <Input id="gambar_url" name="gambar_url" type="url" placeholder="https://example.com/poster.jpg" />
                <p className="text-xs text-zinc-500">Masukkan link gambar (Google Drive public, Imgur, dll).</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Budget & Target */}
        <div className="space-y-6">
          <Card className="border-zinc-200 shadow-sm dark:border-zinc-800 sticky top-24">
            <CardHeader>
              <CardTitle>Anggaran & Target</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="budget_per_task">Budget per Publikasi (Rp) <span className="text-red-500">*</span></Label>
                <Input 
                  id="budget_per_task" 
                  name="budget_per_task" 
                  type="number" 
                  min="5000" 
                  step="5000" 
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value) || 0)}
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_kuota">Target Jumlah Publisher <span className="text-red-500">*</span></Label>
                <Input 
                  id="max_kuota" 
                  name="max_kuota" 
                  type="number" 
                  min="1" 
                  value={kuota}
                  onChange={(e) => setKuota(Number(e.target.value) || 0)}
                  required 
                />
              </div>

              <div className="rounded-lg bg-indigo-50 p-4 border border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900 mt-6">
                <div className="text-sm font-medium text-indigo-900 dark:text-indigo-200">Total Anggaran (Escrow)</div>
                <div className="text-3xl font-bold text-indigo-700 dark:text-indigo-400 mt-1">
                  {formatCurrency(totalAnggaran)}
                </div>
                <p className="text-xs text-indigo-600/80 dark:text-indigo-400/80 mt-2">
                  Saldo ini akan langsung dipotong dan ditahan dari wallet Anda.
                </p>
              </div>

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-4">
                Buat Kampanye
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
