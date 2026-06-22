import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // ต้องเรียก getUser() เพื่อ refresh session token ห้ามลบทิ้ง
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isTeacherRoute = pathname.startsWith("/teacher");
  const isPublicAuthRoute =
    pathname === "/teacher/login" ||
    pathname === "/teacher/signup" ||
    pathname === "/teacher/forgot-password" ||
    pathname === "/teacher/reset-password";

  if (isTeacherRoute && !isPublicAuthRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/teacher/login";
    return NextResponse.redirect(url);
  }

  if (isPublicAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/teacher/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
