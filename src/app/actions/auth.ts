'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const AuthSchema = z.object({
  email: z.string().email({ message: 'Email tidak valid.' }),
  password: z.string().min(8, { message: 'Password minimal 8 karakter.' }),
})

export async function login(formData: FormData) {
  const supabase = await createClient()

  // validate schema
  const parsed = AuthSchema.safeParse(Object.fromEntries(formData.entries()))
  
  if (!parsed.success) {
    redirect(`/login?error=${encodeURIComponent(parsed.error.issues[0].message)}`)
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  // validate schema
  const parsed = AuthSchema.safeParse(Object.fromEntries(formData.entries()))
  
  if (!parsed.success) {
    redirect(`/register?error=${encodeURIComponent(parsed.error.issues[0].message)}`)
  }

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    redirect(`/register?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/onboarding')
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  revalidatePath('/', 'layout')
  redirect('/login')
}
