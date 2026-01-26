import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const url = request.nextUrl;
    const hostname = request.headers.get('host') || 'localhost:3000';

    // Define excluded paths (static files, api routes, etc.)
    const isExcluded =
        url.pathname.startsWith('/_next') ||
        url.pathname.startsWith('/api') ||
        url.pathname.startsWith('/static') ||
        url.pathname.includes('.');

    if (isExcluded) {
        return NextResponse.next();
    }

    // Extract subdomain (e.g., "coopa.localhost:3000" -> "coopa")
    // For production, this would be coopa.yourdomain.com
    const parts = hostname.split('.');
    let subdomain = '';

    if (parts.length > 2) {
        subdomain = parts[0];
    }

    // If no subdomain, check if it's the main domain or localhost
    if (!subdomain || subdomain === 'www' || subdomain === 'localhost:3000') {
        return NextResponse.next();
    }

    // Rewrite to an internal path if needed, or just set a header
    // For now, let's just set a header that we can read in the Layout/Server Components
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant-subdomain', subdomain);

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
