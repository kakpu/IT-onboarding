import { DayProgressCards } from '@/components/day-progress-cards';

export default function HomePage() {
  return (
    <div className="container mx-auto p-4 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Day1-3のIT初期設定をサポート</h1>
        <p className="text-sm text-gray-600 sm:text-base">
          各Dayのカードをクリックして、チェックリストを確認してください。
        </p>
      </div>

      <DayProgressCards />
    </div>
  );
}
