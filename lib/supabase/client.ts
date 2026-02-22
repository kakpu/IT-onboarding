import { createBrowserClient } from '@supabase/ssr';

/**
 * クライアントサイド用Supabaseクライアント
 * Client Componentsで使用する
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
