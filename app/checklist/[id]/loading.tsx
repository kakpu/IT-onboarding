/**
 * 詳細ページのローディング画面
 */
export default function ChecklistLoading() {
  return (
    <div className="container mx-auto max-w-2xl p-4">
      {/* パンくずスケルトン */}
      <div className="mb-4 h-4 w-40 animate-pulse rounded bg-gray-200" />

      {/* バッジスケルトン */}
      <div className="mb-2 h-6 w-20 animate-pulse rounded-full bg-gray-200" />

      {/* タイトルスケルトン */}
      <div className="mb-2 h-7 w-2/3 animate-pulse rounded bg-gray-200" />
      <div className="mb-6 h-4 w-full animate-pulse rounded bg-gray-200" />

      {/* 手順スケルトン */}
      <div className="mb-3 h-5 w-12 animate-pulse rounded bg-gray-200" />
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-3 rounded-lg border p-3">
            <div className="h-6 w-6 shrink-0 animate-pulse rounded-full bg-gray-200" />
            <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>

      {/* ボタンスケルトン */}
      <div className="mt-6 space-y-4">
        <div className="flex gap-3">
          <div className="h-11 flex-1 animate-pulse rounded bg-gray-200" />
          <div className="h-11 flex-1 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="h-11 w-full animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );
}
