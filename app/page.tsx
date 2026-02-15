import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="container mx-auto p-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Day1-3のIT初期設定をサポート</h1>
        <p className="text-gray-600">
          各Dayのカードをクリックして、チェックリストを確認してください。
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Day1 カード */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Day1 初期設定</CardTitle>
            <CardDescription>ログイン・M365・Teams・iPhone初期設定</CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Link href="/day/1">
              <Button className="w-full">詳細を見る →</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Day2 カード */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Day2 ポータル・ツール設定</CardTitle>
            <CardDescription>ポータル・プリンタ・VPN・セキュリティ確認</CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Link href="/day/2">
              <Button className="w-full">詳細を見る →</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Day3 カード */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Day3 トラブル対応</CardTitle>
            <CardDescription>よくあるトラブル対応</CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Link href="/day/3">
              <Button className="w-full">詳細を見る →</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
