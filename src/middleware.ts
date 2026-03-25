import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const uid = searchParams.get('UID');

  // If URL contains ?UID= and we're not already on /bett, redirect there
  if (uid && !pathname.startsWith('/bett')) {
    const url = request.nextUrl.clone();
    url.pathname = '/bett';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
