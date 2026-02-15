# Issue #20: NextAuth.js簡易認証（Credentials Provider）

## 背景 / 目的

NextAuth.js v5を導入し、メールアドレス＋パスワードの簡易認証を実装する。Phase 1-2では認証なしで進めたが、セキュリティ強化のため認証機能を追加する。

- **依存**: #19
- **ラベル**: backend, auth

## スコープ / 作業項目

1. `next-auth@beta`パッケージ導入
2. `/app/api/auth/[...nextauth]/route.ts`作成
3. Credentials Providerでメールアドレス＋パスワード認証実装
4. `/lib/auth.ts`に認証ヘルパー関数作成
5. ミドルウェアで未認証時にログインページへリダイレクト
6. ユーザー登録ページ作成
7. Supabase `users`テーブルにメールアドレス・パスワード（ハッシュ化）保存
8. 既存の匿名ユーザーデータを認証ユーザーに紐付け（オプション）

## ゴール / 完了条件（Acceptance Criteria）

- [ ] `next-auth@beta`パッケージ導入完了
- [ ] `/app/api/auth/[...nextauth]/route.ts`作成、Credentials Provider実装
- [ ] `/lib/auth.ts`に認証ヘルパー関数作成（`getServerSession`等）
- [ ] ミドルウェア（`middleware.ts`）で未認証時にログインページへリダイレクト
- [ ] ユーザー登録ページ（`/app/auth/signup/page.tsx`）作成
- [ ] Supabase `users`テーブルにメールアドレス・パスワード（ハッシュ化）保存
- [ ] 既存の匿名ユーザーデータを認証ユーザーに紐付け（オプション機能として実装）

## テスト観点

- **ログイン**: メールアドレス＋パスワードでログインできること
- **ログアウト**: ログアウトボタンでログアウトできること
- **ユーザー登録**: 新規ユーザー登録ができること
- **リダイレクト**: 未認証時に`/api/auth/signin`にリダイレクトされること
- **セッション管理**: ログイン後、セッションが維持されること
- **パスワードハッシュ化**: パスワードがbcryptでハッシュ化されて保存されること

### 検証方法

```bash
# NextAuth.js導入
pnpm add next-auth@beta
pnpm add bcrypt
pnpm add -D @types/bcrypt

# 開発サーバー起動
pnpm dev

# ブラウザでアクセス（未認証時は/api/auth/signinにリダイレクト）
# http://localhost:3000

# ユーザー登録
# http://localhost:3000/auth/signup

# ログイン
# http://localhost:3000/api/auth/signin
```

## 実装例

### /app/api/auth/[...nextauth]/route.ts

```typescript
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createClient } from '@/lib/supabase/server';
import bcrypt from 'bcrypt';

const handler = NextAuth({
  providers: [
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

        if (error || !user) {
          return null;
        }

        // パスワード検証
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
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
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_here_generate_with_openssl_rand_base64_32
```

### /lib/auth.ts

```typescript
import { getServerSession as getNextAuthServerSession } from 'next-auth';

export async function getServerSession() {
  return await getNextAuthServerSession();
}

export async function requireAuth() {
  const session = await getServerSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}
```

### /middleware.ts

```typescript
export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/((?!api/auth|auth/signin|auth/signup|_next/static|_next/image|favicon.ico).*)'],
};
```

### /app/auth/signup/page.tsx

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || '登録に失敗しました');
      }

      toast.success('登録が完了しました');
      router.push('/api/auth/signin');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-6">ユーザー登録</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">名前</Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
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
            minLength={8}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? '登録中...' : '登録'}
        </Button>
      </form>
    </div>
  );
}
```

### /app/api/auth/signup/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { createClient } from '@/lib/supabase/server';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = signupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: result.error.issues },
        { status: 400 }
      );
    }

    const { email, password, name } = result.data;

    // パスワードハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    const supabase = createClient();

    // メールアドレス重複チェック
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json({ message: 'Email already exists' }, { status: 400 });
    }

    // ユーザー作成
    const { data, error } = await supabase
      .from('users')
      .insert({
        email,
        password: hashedPassword,
        name,
        role: 'user',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ id: data.id, email: data.email }, { status: 201 });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
```

## 要確認事項

- `NEXTAUTH_SECRET`は`openssl rand -base64 32`で生成したランダム文字列を使用
- パスワードポリシーは最小8文字でよいか？（調整可能）
- 既存の匿名ユーザーデータの移行方法は？（オプション機能として後で実装）
