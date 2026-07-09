import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  if (process.env.BYPASS_AUTH_FOR_TEST === 'true') {
    return supabaseResponse
  }

  // Refreshing the auth token
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const isAdminPath = pathname.startsWith('/admin')
  const isAdminApiPath = pathname.startsWith('/api/admin')
  
  // Protect faculty mutations and inspect API
  const isFacultyMutation = pathname.startsWith('/api/faculties') && 
    ['POST', 'PATCH', 'DELETE'].includes(request.method)
  const isInspectMutation = pathname.startsWith('/api/inspect') && 
    ['POST', 'PATCH', 'DELETE'].includes(request.method)

  const isProtectedPath = isAdminPath || isAdminApiPath || isFacultyMutation || isInspectMutation

  if (isProtectedPath) {
    if (!user) {
      if (isAdminPath) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(loginUrl)
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // User is logged in, check their role via local API endpoint to bridge split db architecture
    let isSuperadmin = false
    try {
      const roleCheckUrl = new URL('/api/auth/role', request.url)
      const roleRes = await fetch(roleCheckUrl, {
        headers: {
          cookie: request.headers.get('cookie') || '',
        },
      })
      if (roleRes.ok) {
        const { role } = await roleRes.json()
        isSuperadmin = role === 'superadmin'
      }
    } catch (err) {
      console.error('Middleware role check error:', err)
    }

    if (!isSuperadmin) {
      if (isAdminPath) {
        return NextResponse.redirect(new URL('/403', request.url))
      } else {
        return NextResponse.json({ error: 'Forbidden: Superadmin access required' }, { status: 403 })
      }
    }
  }

  return supabaseResponse
}
