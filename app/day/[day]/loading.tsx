/**
 * Day別ページのローディング画面
 */
export default function DayLoading() {
  return (
    <div className="container mx-auto p-4">
      {/* パンくずスケルトン */}
      <div className="mb-4 h-4 w-24 animate-pulse rounded bg-gray-200" />

      {/* タイトルスケルトン */}
      <div className="mb-2 h-7 w-48 animate-pulse rounded bg-gray-200" />
      <div className="mb-6 h-4 w-64 animate-pulse rounded bg-gray-200" />

      {/* チェックリストカードスケルトン */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border p-4 space-y-3">
            <div className="h-5 w-1/2 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="flex gap-2">
              <div className="h-10 w-24 animate-pulse rounded bg-gray-200" />
              <div className="h-10 w-24 animate-pulse rounded bg-gray-200" />
              <div className="h-10 w-32 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
