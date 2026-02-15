import { DayProgressCards } from '@/components/day-progress-cards';

export default function HomePage() {
  return (
    <div className="container mx-auto p-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Day1-3のIT初期設定をサポート</h1>
        <p className="text-gray-600">
          各Dayのカードをクリックして、チェックリストを確認してください。
        </p>
      </div>

      <DayProgressCards />
    </div>
  );
}
