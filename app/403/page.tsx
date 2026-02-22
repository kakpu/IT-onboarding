import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * 403 Forbiddenページ
 * アクセス権限がないユーザーに表示される
 */
export default function Forbidden() {
  return (
    <div className="container mx-auto flex min-h-[50vh] flex-col items-center justify-center p-4 text-center">
      <h1 className="mb-2 text-4xl font-bold">403</h1>
      <p className="mb-6 text-gray-600">このページにアクセスする権限がありません。</p>
      <Link href="/">
        <Button className="min-h-[44px]">トップに戻る</Button>
      </Link>
    </div>
  );
}
