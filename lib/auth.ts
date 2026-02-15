import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * NextAuth.js v5 設定
 * Credentials Provider（メールアドレス＋パスワード認証）
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
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
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    /** ミドルウェア用：未認証ユーザーをログインページへリダイレクト */
    authorized({ auth }) {
      return !!auth?.user;
    },
    /** JWTトークンにユーザー情報を含める */
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    /** セッションにユーザーID・ロールを公開 */
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
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
