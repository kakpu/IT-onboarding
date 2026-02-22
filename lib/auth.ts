import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import MicrosoftEntraId from 'next-auth/providers/microsoft-entra-id';
import { compare } from 'bcryptjs';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { authConfig } from './auth.config';

/**
 * Supabaseクライアントを作成する（auth内部用）
 */
function createAuthSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('[auth] Missing Supabase environment variables');
  }
  return createSupabaseClient(supabaseUrl, supabaseKey);
}

/**
 * NextAuth.js v5 完全設定（Node.jsランタイム）
 * Credentials Provider（メールアドレス＋パスワード認証）と
 * Microsoft Entra ID Provider（企業SSO）を提供
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    // Entra ID（Azure AD）プロバイダー（環境変数が設定されている場合のみ有効）
    ...(process.env.AZURE_AD_CLIENT_ID
      ? [
          MicrosoftEntraId({
            clientId: process.env.AZURE_AD_CLIENT_ID,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET ?? '',
            // テナントIDはissuer URLで指定する
            issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID ?? 'common'}/v2.0`,
          }),
        ]
      : []),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'メールアドレス', type: 'email' },
        password: { label: 'パスワード', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const email = credentials?.email as string | undefined;
          const password = credentials?.password as string | undefined;

          if (!email || !password) {
            return null;
          }

          const supabase = createAuthSupabaseClient();
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
        } catch (error) {
          console.error('[auth] authorize error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    /**
     * 初回ログイン時のコールバック
     * Entra IDログイン時にSupabaseへユーザーを自動作成する
     */
    async signIn({ user, account }) {
      if (account?.provider === 'microsoft-entra-id') {
        try {
          const supabase = createAuthSupabaseClient();

          // entra_idでユーザー存在確認
          const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('entra_id', user.id)
            .single();

          if (!existing) {
            // 初回ログイン：ユーザーを自動作成
            const { error } = await supabase.from('users').insert({
              entra_id: user.id,
              email: user.email ?? '',
              name: user.name ?? '',
              role: 'user',
            });

            if (error) {
              console.error('[auth] Entra IDユーザーの作成に失敗しました:', error);
              return false;
            }
          }
        } catch (error) {
          console.error('[auth] signIn callback error:', error);
          return false;
        }
      }
      return true;
    },
    /**
     * JWTトークンにユーザー情報を含める
     * Entra IDログイン時はSupabaseからDBのid/roleを取得する
     */
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === 'microsoft-entra-id') {
          // Entra IDユーザー：entra_idからDBのid/roleを取得
          try {
            const supabase = createAuthSupabaseClient();
            const { data } = await supabase
              .from('users')
              .select('id, role')
              .eq('entra_id', user.id)
              .single();

            if (data) {
              token.id = data.id;
              token.role = data.role;
            }
          } catch (error) {
            console.error('[auth] jwt callback error (Entra ID):', error);
          }
        } else {
          // Credentials：authorizeの戻り値からid/roleを設定
          token.id = user.id;
          token.role = (user as { role?: string }).role;
        }
      }
      return token;
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
