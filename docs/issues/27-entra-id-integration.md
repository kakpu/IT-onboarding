# Issue #27: Entra ID統合（将来機能）

## 背景 / 目的

NextAuth.js v5のEntra ID (Azure AD) Providerに切り替え、企業SSOを実装する。これにより、社員は会社のアカウントでログインできる。

- **依存**: #20
- **ラベル**: backend, auth

## スコープ / 作業項目

1. Entra ID（Azure AD）でアプリケーション登録
2. Client ID/Secret取得
3. NextAuth.js設定をEntra ID Providerに変更
4. OAuth 2.0 / OpenID Connectフロー実装
5. `.env.local`にEntra ID環境変数追加
6. Supabase `users`テーブルに`entra_id`カラムでユーザー自動作成
7. Credentials Providerと併用可能な設定

## ゴール / 完了条件（Acceptance Criteria）

- [ ] Entra ID（Azure AD）でアプリケーション登録、Client ID/Secret取得完了
- [ ] NextAuth.js設定をEntra ID Providerに変更
- [ ] OAuth 2.0 / OpenID Connectフロー実装完了
- [ ] `.env.local`にEntra ID環境変数追加
- [ ] ログイン→リダイレクト→トークン取得の動作確認
- [ ] Supabase `users`テーブルに`entra_id`カラムでユーザー自動作成
- [ ] Credentials Providerと併用可能な設定（既存ユーザーへの影響最小化）

## テスト観点

- **Entra IDログイン**: 会社のアカウントでログインできること
- **ユーザー自動作成**: 初回ログイン時にusersテーブルに新規レコードが作成されること
- **トークン取得**: アクセストークンが正しく取得されること
- **リダイレクト**: ログイン後、元のページにリダイレクトされること
- **Credentials併用**: 既存のメールアドレス＋パスワード認証も利用可能であること

### 検証方法

```bash
# .env.localにEntra ID環境変数追加
AZURE_AD_CLIENT_ID=your_client_id
AZURE_AD_CLIENT_SECRET=your_client_secret
AZURE_AD_TENANT_ID=your_tenant_id

# 開発サーバー起動
pnpm dev

# ブラウザでアクセス
# http://localhost:3000/api/auth/signin
# 「Sign in with Azure AD」ボタンをクリック
# 会社のアカウントでログイン
```

## Entra ID（Azure AD）アプリケーション登録手順

### 1. Azure Portalにアクセス

https://portal.azure.com/

### 2. Entra ID（Azure AD）を選択

「Azure Active Directory」または「Microsoft Entra ID」を選択

### 3. アプリの登録

1. 左メニュー > 「アプリの登録」
2. 「新規登録」をクリック
3. 以下を入力：
   - 名前: `IT-onboarding`
   - サポートされているアカウントの種類: `この組織ディレクトリのみに含まれるアカウント`
   - リダイレクトURI: `Web` > `http://localhost:3000/api/auth/callback/azure-ad`（開発環境）
4. 「登録」をクリック

### 4. Client ID / Tenant IDを取得

登録後、「概要」ページから以下をコピー：

- **アプリケーション（クライアント）ID**: Client ID
- **ディレクトリ（テナント）ID**: Tenant ID

### 5. Client Secretを作成

1. 左メニュー > 「証明書とシークレット」
2. 「新しいクライアントシークレット」をクリック
3. 説明: `IT-onboarding-secret`
4. 有効期限: `24か月`（推奨）
5. 「追加」をクリック
6. **値（Client Secret）**をコピー（この画面でしか表示されないので注意）

### 6. リダイレクトURIを追加（本番環境）

1. 左メニュー > 「認証」
2. 「プラットフォームの追加」> 「Web」
3. リダイレクトURI: `https://it-onboarding.vercel.app/api/auth/callback/azure-ad`
4. 「構成」をクリック

## 実装例

### /app/api/auth/[...nextauth]/route.ts（更新）

```typescript
import NextAuth from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createClient } from '@/lib/supabase/server';
import bcrypt from 'bcrypt';

const handler = NextAuth({
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const supabase = createClient();
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', credentials.email)
          .single();

        if (error || !user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Entra IDログイン時にユーザーを自動作成
      if (account?.provider === 'azure-ad') {
        const supabase = createClient();

        // Entra IDでユーザーが存在するか確認
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('entra_id', user.id)
          .single();

        if (!existing) {
          // 新規ユーザー作成
          await supabase.from('users').insert({
            entra_id: user.id,
            email: user.email!,
            name: user.name || '',
            role: 'user',
          });
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;

        // Entra IDログイン時はentra_idからuser_idを取得
        if (account?.provider === 'azure-ad') {
          const supabase = createClient();
          const { data } = await supabase
            .from('users')
            .select('id, role')
            .eq('entra_id', user.id)
            .single();

          if (data) {
            token.id = data.id;
            token.role = data.role;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
```

### /.env.local（追加）

```bash
# Entra ID (Azure AD)
AZURE_AD_CLIENT_ID=your_client_id
AZURE_AD_CLIENT_SECRET=your_client_secret
AZURE_AD_TENANT_ID=your_tenant_id
```

### /supabase/migrations/XXX_add_entra_id.sql

```sql
-- usersテーブルにentra_idカラム追加
ALTER TABLE users
ADD COLUMN entra_id VARCHAR(255) UNIQUE;

-- インデックス追加
CREATE INDEX idx_users_entra_id ON users(entra_id);

-- passwordカラムをNULLABLEに変更（Entra IDユーザーはパスワード不要）
ALTER TABLE users
ALTER COLUMN password DROP NOT NULL;
```

### /app/auth/signin/page.tsx（更新）

```typescript
'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn('credentials', {
      email,
      password,
      callbackUrl: '/',
    });
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-6">ログイン</h1>

      {/* Entra IDログイン */}
      <Button
        className="w-full mb-4"
        onClick={() => signIn('azure-ad', { callbackUrl: '/' })}
      >
        会社のアカウントでログイン（Entra ID）
      </Button>

      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">または</span>
        </div>
      </div>

      {/* メールアドレス＋パスワードログイン */}
      <form onSubmit={handleCredentialsSignIn} className="space-y-4">
        <div>
          <Label htmlFor="email">メールアドレス</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="password">パスワード</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full">
          メールアドレスでログイン
        </Button>
      </form>
    </div>
  );
}
```

## Entra ID権限スコープ

デフォルトで以下のスコープが付与されます:

- `openid`: OpenID Connect認証
- `profile`: プロフィール情報（名前等）
- `email`: メールアドレス

追加で必要な場合、Azure Portalの「APIのアクセス許可」から追加できます。

## 要確認事項

- Entra IDアプリケーション登録は誰が行うか？（IT管理者に依頼が必要か）
- 既存のCredentials Providerユーザーの移行方法は？（Entra IDアカウントと紐付ける必要があるか）
- Entra IDログインを必須にするか、Credentials Providerと併用するか？
