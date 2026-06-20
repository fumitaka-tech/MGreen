import type { AiInsights } from "@/types/plant-ai";

export function AiInsightsPanel({ insights }: { insights: AiInsights | null }) {
  if (!insights) return null;

  const hasContent =
    insights.current_status ||
    insights.care_guide ||
    insights.care_tips ||
    (insights.recommendations && insights.recommendations.length > 0);

  if (!hasContent) return null;

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-green-100 bg-green-50/60 p-3">
      <p className="text-xs font-medium text-green-700">AI からのヒント（参考情報）</p>

      {insights.current_status && (
        <div>
          <p className="text-xs font-medium text-gray-600">今の状態</p>
          <p className="mt-0.5 text-sm leading-relaxed text-gray-700">
            {insights.current_status}
          </p>
        </div>
      )}

      {insights.care_guide && (
        <div>
          <p className="text-xs font-medium text-gray-600">育て方</p>
          <p className="mt-0.5 text-sm leading-relaxed text-gray-700">
            {insights.care_guide}
          </p>
        </div>
      )}

      {insights.care_tips && (
        <div>
          <p className="text-xs font-medium text-gray-600">お手入れのヒント</p>
          <p className="mt-0.5 text-sm leading-relaxed text-gray-700">
            {insights.care_tips}
          </p>
        </div>
      )}

      {insights.recommendations && insights.recommendations.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-600">おすすめ</p>
          <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-gray-700">
            {insights.recommendations.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
