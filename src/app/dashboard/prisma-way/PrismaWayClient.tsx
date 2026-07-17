'use client'

import React, { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { updateProfileRolePrisma, handleSignOut } from './actions'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { 
  User, 
  Shield, 
  Lock, 
  Mail, 
  Key, 
  LogOut, 
  UserCheck, 
  RefreshCw, 
  ChevronRight, 
  Activity,
  UserPlus,
  Layers
} from 'lucide-react'

interface Profile {
  id: string
  email: string
  role: 'superadmin' | 'admin'
  created_at: string
}

interface PrismaWayClientProps {
  initialUser: SupabaseUser | null
  initialProfile: Profile | null
  initialProfiles: Profile[] | null
}

export default function PrismaWayClient({
  initialUser,
  initialProfile,
  initialProfiles
}: PrismaWayClientProps) {
  const supabase = createClient()
  const [user] = useState<SupabaseUser | null>(initialUser)
  const [profile, setProfile] = useState<Profile | null>(initialProfile)
  const [profiles, setProfiles] = useState<Profile[] | null>(initialProfiles)
  const [loading, setLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  
  // Auth Form State
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: 'user'
            }
          }
        })
        if (error) throw error
        setSuccessMsg('Sign up successful! Please check your email or refresh if auto-confirmed.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
        window.location.reload()
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  const toggleRole = async (targetProfileId: string, currentRole: 'superadmin' | 'admin') => {
    setActionLoadingId(targetProfileId)
    setErrorMsg('')
    setSuccessMsg('')
    
    const newRole = currentRole === 'superadmin' ? 'admin' : 'superadmin'
    const result = await updateProfileRolePrisma(targetProfileId, newRole)

    if (result.success && result.data) {
      const updatedRole = result.data.role === 'superadmin' ? 'superadmin' : 'admin'
      
      // Update local profiles list
      if (profiles) {
        setProfiles(profiles.map(p => p.id === targetProfileId ? { ...p, role: updatedRole } : p))
      }
      // If we updated our own role
      if (profile && profile.id === targetProfileId) {
        setProfile({ ...profile, role: updatedRole })
      }
      setSuccessMsg(`[Prisma RLS success] Updated role for ${result.data.email} to ${result.data.role}`)
    } else {
      setErrorMsg(result.error || 'Failed to update role')
    }
    setActionLoadingId(null)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-navy via-brand-gold to-brand-navy-light" />
          
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-brand-navy/30 flex items-center justify-center text-brand-gold mb-4 border border-brand-navy/50">
              <Layers className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-black tracking-tight">Prisma + RLS Client</h2>
            <p className="text-sm text-slate-400 mt-2">Approach B: Prisma ORM with RLS injection</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {errorMsg && (
              <div className="p-4 bg-rose-950/40 border border-rose-900/50 rounded-2xl text-xs font-semibold text-rose-400">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-4 bg-emerald-950/40 border border-emerald-900/50 rounded-2xl text-xs font-semibold text-emerald-400">
                {successMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-12 bg-slate-950 border border-slate-850 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold text-slate-100 transition-all"
                placeholder="you@oau.edu.ng"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5" /> Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full h-12 bg-slate-950 border border-slate-850 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold text-slate-100 transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-brand-gold text-brand-navy font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-brand-gold-dark transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-brand-gold/10"
            >
              {loading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : isSignUp ? (
                <>
                  <UserPlus className="h-5 w-5" /> Sign Up
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5" /> Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center text-xs">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp)
                setErrorMsg('')
                setSuccessMsg('')
              }}
              className="text-brand-gold hover:underline font-bold"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-850 p-6 rounded-3xl shadow-xl">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-500 animate-ping" />
              <span className="text-xs uppercase font-bold text-slate-400 tracking-widest">Prisma + Supabase RLS flow</span>
            </div>
            <h1 className="text-2xl font-black mt-1">Dashboard (Prisma-Way)</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-slate-950 border border-slate-850 px-4 py-2 rounded-2xl flex items-center gap-3">
              <User className="h-4 w-4 text-brand-gold" />
              <div className="text-left text-xs">
                <span className="block font-bold text-slate-300">{user.email}</span>
                <span className="block text-[10px] text-slate-400 uppercase font-black tracking-widest mt-0.5">
                  {profile?.role || 'admin'}
                </span>
              </div>
            </div>

            <button
              onClick={async () => {
                await handleSignOut()
                window.location.reload()
              }}
              className="h-10 w-10 bg-slate-800 hover:bg-slate-705 border border-slate-700/50 text-slate-300 rounded-2xl flex items-center justify-center cursor-pointer transition-all"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="p-4 bg-rose-950/40 border border-rose-900/50 rounded-2xl text-xs font-semibold text-rose-400">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-4 bg-emerald-950/40 border border-emerald-900/50 rounded-2xl text-xs font-semibold text-emerald-400">
            {successMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Profile Overview Card */}
          <div className="bg-slate-900 border border-slate-850 p-8 rounded-3xl shadow-xl flex flex-col justify-between min-h-[280px]">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-extrabold text-lg text-slate-200">Your Profile</h3>
                <Activity className="h-5 w-5 text-brand-gold" />
              </div>
              
              <div className="space-y-4 text-sm">
                <div>
                  <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Account ID</span>
                  <span className="block font-mono text-slate-300 text-xs mt-1 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-850 break-all select-all">
                    {user.id}
                  </span>
                </div>

                <div>
                  <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Role</span>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      profile?.role === 'superadmin'
                        ? 'bg-brand-gold/10 text-brand-gold border-brand-gold/30'
                        : 'bg-slate-950 text-slate-400 border-slate-850'
                    }`}>
                      <Shield className="h-3.5 w-3.5" />
                      {profile?.role === 'superadmin' ? 'Superadmin' : 'Standard User'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-850 flex justify-between items-center">
              <span className="text-xs text-slate-500">
                Created: {profile ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
              </span>
              <button
                onClick={() => toggleRole(user.id, profile?.role || 'admin')}
                disabled={actionLoadingId === user.id}
                className="text-xs font-bold text-brand-gold flex items-center gap-1 hover:underline disabled:opacity-50 cursor-pointer"
              >
                {actionLoadingId === user.id ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    Toggle Role <ChevronRight className="h-3 w-3" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Superadmin User Management Panel */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-850 p-8 rounded-3xl shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6 border-b border-slate-850 pb-4">
                <div>
                  <h3 className="font-extrabold text-lg text-slate-200">Prisma Queries (RLS-Restricted)</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    This table list is queried via **Prisma Client** inside a database transaction carrying the active session JWT.
                  </p>
                </div>
                <UserCheck className="h-5 w-5 text-brand-gold" />
              </div>

              {profiles && profiles.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-850 text-slate-500 uppercase tracking-wider font-bold">
                        <th className="pb-3">Email</th>
                        <th className="pb-3">User ID</th>
                        <th className="pb-3">Role</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/50">
                      {profiles.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-850/10">
                          <td className="py-3 font-semibold text-slate-350">{p.email}</td>
                          <td className="py-3 font-mono text-slate-500 text-[10px]">{p.id}</td>
                          <td className="py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              p.role === 'superadmin'
                                ? 'bg-brand-gold/10 text-brand-gold border-brand-gold/30'
                                : 'bg-slate-950 text-slate-400 border-slate-850'
                            }`}>
                              {p.role}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => toggleRole(p.id, p.role)}
                              disabled={actionLoadingId === p.id}
                              className="text-[10px] font-extrabold bg-slate-950 hover:bg-slate-850 text-brand-gold border border-slate-850 px-2.5 py-1 rounded-lg disabled:opacity-50 transition-all cursor-pointer"
                            >
                              {actionLoadingId === p.id ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                'Toggle Role'
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 bg-slate-950/30 border border-slate-850 rounded-2xl">
                  {profile?.role === 'superadmin' ? 'No profiles found.' : 'Restricted: Prisma execution respects Supabase RLS and limits results to your own profile.'}
                </div>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-slate-850 text-xs text-slate-500 flex justify-between">
              <span>Row Level Security (RLS) is applied on the DB connection level inside Prisma transactions.</span>
              <a href="/dashboard/supabase-way" className="text-brand-gold hover:underline font-bold">
                ← Go to Supabase Way
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
