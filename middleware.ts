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
    const hostnameWithoutPort = hostname.split(':')[0];
    const parts = hostnameWithoutPort.split('.');
    let subdomain = '';

    // Handle localhost subdomains (e.g., coopa.localhost)
    if (hostnameWithoutPort.endsWith('localhost')) {
        if (parts.length > 1) {
            subdomain = parts[0];
        }
    } else if (hostnameWithoutPort.endsWith('.vercel.app')) {
        // Handle Vercel deployments
        // coopa.vercel.app -> parts.length = 3 (Main Site)
        // tenant.coopa.vercel.app -> parts.length = 4 (Tenant)
        if (parts.length > 3) {
            subdomain = parts[0];
        }
    } else if (parts.length > 2) {
        // Handle production domains (e.g., coopa.yourdomain.com)
        subdomain = parts[0];
    }

    // If no subdomain, or it's just 'www', proceed to main site
    if (!subdomain || subdomain === 'www') {
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
