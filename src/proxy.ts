import { NextResponse, type NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth-session';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  if (process.env.BYPASS_AUTH_FOR_TEST === 'true') {
    return response;
  }

  const pathname = request.nextUrl.pathname;
  const isAdminPath = pathname.startsWith('/admin');
  const isAdminApiPath = pathname.startsWith('/api/admin');
  
  // Protect faculty mutations and inspect API
  const isFacultyMutation = pathname.startsWith('/api/faculties') && 
    ['POST', 'PATCH', 'DELETE'].includes(request.method);
  const isInspectMutation = pathname.startsWith('/api/inspect') && 
    ['POST', 'PATCH', 'DELETE'].includes(request.method);

  const isProtectedPath = isAdminPath || isAdminApiPath || isFacultyMutation || isInspectMutation;

  if (isProtectedPath) {
    const token = request.cookies.get('oau_session')?.value;
    let userRole: string | null = null;

    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        userRole = payload.role;
      }
    }

    // Determine if the user is authorized based on role and path
    let isAuthorized = false;
    if (userRole === 'superadmin') {
      isAuthorized = true;
    } else if (userRole === 'admin') {
      const isUserManagementPath = 
        pathname.startsWith('/admin/users') || 
        pathname.startsWith('/api/admin/users') || 
        pathname.startsWith('/api/admin/create-user');
      
      if (!isUserManagementPath) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      if (isAdminPath) {
        // If logged in as admin trying to access the user management page,
        // let them pass through so they see the inline "Access Denied" locking panel instead of a redirect loop.
        if (userRole === 'admin' && pathname.startsWith('/admin/users')) {
          return response;
        }
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(loginUrl);
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/assets (if any)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
