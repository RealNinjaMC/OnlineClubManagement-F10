import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(null)
  const userId = session?.user.id

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    setProfile(null)
    if (!userId) return
    supabase
      .from('profiles')
      .select('id, name, role')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => (error ? supabase.auth.signOut() : setProfile(data)))
    const channel = supabase
      .channel('my-profile')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, ({ new: row }) =>
        setProfile({ id: row.id, name: row.name, role: row.role }),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message
  }

  async function signUp(name, email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } })
    if (error) return error.message
    if (!data.session) return 'Account created. Check your email to confirm it, then sign in.'
  }

  function signOut() {
    supabase.auth.signOut()
  }

  async function listUsers() {
    return supabase.rpc('list_users')
  }

  async function setUserRole(target, role) {
    return supabase.rpc('set_role', { target, new_role: role })
  }

  let status = 'signed-in'
  if (session === undefined || (session && !profile)) status = 'loading'
  else if (!session) status = 'signed-out'

  const value = {
    status,
    user: session?.user,
    profile,
    isRoot: profile?.role === 'root',
    canHost: profile?.role === 'host' || profile?.role === 'root',
    signIn,
    signUp,
    signOut,
    listUsers,
    setUserRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
