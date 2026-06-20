import Link from "next/link";
import { AreaForm } from "@/components/area-form";

export default function NewAreaPage() {
  return (
    <div className="page-stack">
      <div>
        <Link href="/" className="back-link">
          ← エリア一覧に戻る
        </Link>
        <h1 className="page-title mt-2">エリアを追加</h1>
        <p className="mt-1 text-sm leading-relaxed text-gray-500">
          ベランダ、庭、リビングなど植物を置いている場所を登録します
        </p>
      </div>

      <div className="card-form">
        <AreaForm />
      </div>
    </div>
  );
}
