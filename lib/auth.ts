import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { authConfig } from './auth.config';

/**
 * NextAuth.js v5 完全設定（Node.jsランタイム）
 * Credentials Provider（メールアドレス＋パスワード認証）を含む
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'メールアドレス', type: 'email' },
        password: { label: 'パスワード', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) {
          return null;
        }

        const supabase = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: user, error } = await supabase
          .from('users')
          .select('id, email, name, role, password_hash')
          .eq('email', email)
          .single();

        if (error || !user || !user.password_hash) {
          return null;
        }

        const isValid = await compare(password, user.password_hash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
});

/**
 * サーバーサイドで現在の認証セッションを取得
 * @returns セッション情報（未認証時はnull）
 */
export async function getServerSession() {
  return await auth();
}

/**
 * 認証必須のAPIルートで使用するヘルパー
 * 未認証時はエラーをスロー
 * @returns 認証済みセッション
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('認証が必要です');
  }
  return session;
}
