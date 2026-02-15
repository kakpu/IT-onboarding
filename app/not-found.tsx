import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * 404ページ
 * 存在しないページにアクセスした際に表示
 */
export default function NotFound() {
  return (
    <div className="container mx-auto flex min-h-[50vh] flex-col items-center justify-center p-4 text-center">
      <h2 className="mb-2 text-4xl font-bold text-gray-300">404</h2>
      <h3 className="mb-2 text-xl font-bold">ページが見つかりません</h3>
      <p className="mb-6 text-gray-600">お探しのページは存在しないか、移動した可能性があります。</p>
      <Link href="/">
        <Button className="min-h-[44px]">トップに戻る</Button>
      </Link>
    </div>
  );
}
