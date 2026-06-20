import { createArea, updateArea } from "@/app/actions/areas";
import type { Area } from "@/types/database";

export function AreaForm({ area }: { area?: Area }) {
  const isEdit = Boolean(area);

  return (
    <form action={isEdit ? updateArea : createArea} className="space-y-5">
      {isEdit && <input type="hidden" name="area_id" value={area!.id} />}

      <div>
        <label htmlFor="name" className="field-label">
          エリア名
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={area?.name ?? ""}
          placeholder="例: ベランダ、リビング"
          className="field-input"
        />
      </div>

      <div>
        <label htmlFor="type" className="field-label">
          種類
        </label>
        <select
          id="type"
          name="type"
          required
          defaultValue={area?.type ?? "outdoor"}
          className="field-input"
        >
          <option value="outdoor">屋外</option>
          <option value="indoor">室内</option>
        </select>
      </div>

      <div>
        <label htmlFor="description" className="field-label">
          メモ（任意）
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={area?.description ?? ""}
          placeholder="日当たりや置き場所のメモなど"
          className="field-textarea"
        />
      </div>

      <button type="submit" className="btn-primary">
        {isEdit ? "変更を保存" : "エリアを追加"}
      </button>
    </form>
  );
}
