import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * サーバーサイド用Supabaseクライアント
 * Server Components、API Routes、Server Actionsで使用する
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component内でcookieをsetする場合、
            // エラーが発生する可能性があるため無視
          }
        },
      },
    }
  );
}
