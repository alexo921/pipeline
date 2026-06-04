import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { companies } from './app/lib/companies';

const KNOWN_SUBDOMAINS_TO_SKIP = new Set(['www', 'localhost', 'pipelineworkforce', 'api', 'admin']);

function detectCompany(request: NextRequest): string {
  // 1. Query param takes highest priority (demo / local dev)
  const companyParam = request.nextUrl.searchParams.get('company');
  if (companyParam && companies[companyParam]) {
    return companyParam;
  }

  // 2. Existing session cookie
  const companyCookie = request.cookies.get('pipeline-company')?.value;
  if (companyCookie && companies[companyCookie]) {
    return companyCookie;
  }

  // 3. Subdomain detection (production: careone-holyoke.pipelineworkforce.com)
  const host = request.headers.get('host') ?? '';
  const subdomain = host.split('.')[0];
  if (subdomain && !KNOWN_SUBDOMAINS_TO_SKIP.has(subdomain) && companies[subdomain]) {
    return subdomain;
  }

  return 'default';
}

export function middleware(request: NextRequest) {
  const company = detectCompany(request);
  const response = NextResponse.next();

  // Forward company to server components via header
  response.headers.set('x-pipeline-company', company);

  // Persist in cookie so it survives navigation (query param only needed once)
  const existingCookie = request.cookies.get('pipeline-company')?.value;
  if (company !== 'default' && existingCookie !== company) {
    response.cookies.set('pipeline-company', company, {
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
      sameSite: 'lax',
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
