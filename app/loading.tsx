/**
 * グローバルローディング画面（スケルトンスクリーン）
 */
export default function Loading() {
  return (
    <div className="container mx-auto p-4 py-6 sm:py-8">
      {/* タイトルスケルトン */}
      <div className="mb-6 sm:mb-8 space-y-2">
        <div className="h-8 w-3/4 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
      </div>

      {/* カードスケルトン */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border p-6 space-y-3">
            <div className="h-5 w-2/3 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
            <div className="h-10 w-1/3 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
