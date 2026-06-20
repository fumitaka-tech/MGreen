import { createPlant, updatePlant } from "@/app/actions/plants";
import type { Area, Plant } from "@/types/database";

export function PlantForm({
  areas,
  defaultAreaId,
  plant,
}: {
  areas: Area[];
  defaultAreaId?: string;
  plant?: Plant;
}) {
  const isEdit = Boolean(plant);

  return (
    <form action={isEdit ? updatePlant : createPlant} className="space-y-5">
      {isEdit && <input type="hidden" name="plant_id" value={plant!.id} />}

      <div>
        <label htmlFor="area_id" className="field-label">
          エリア
        </label>
        <select
          id="area_id"
          name="area_id"
          required
          defaultValue={plant?.area_id ?? defaultAreaId ?? ""}
          className="field-input"
        >
          <option value="">選択してください</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}（{area.type === "outdoor" ? "屋外" : "室内"}）
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="nickname" className="field-label">
          名前（ニックネーム）
        </label>
        <input
          id="nickname"
          name="nickname"
          type="text"
          required
          defaultValue={plant?.nickname ?? ""}
          placeholder="例: モンステラちゃん"
          className="field-input"
        />
      </div>

      <div>
        <label htmlFor="species_name" className="field-label">
          種類（任意）
        </label>
        <input
          id="species_name"
          name="species_name"
          type="text"
          defaultValue={plant?.species_name ?? ""}
          placeholder="例: モンステラ"
          className="field-input"
        />
      </div>

      <div>
        <label htmlFor="planted_at" className="field-label">
          植えた日（任意）
        </label>
        <input
          id="planted_at"
          name="planted_at"
          type="date"
          defaultValue={plant?.planted_at ?? ""}
          className="field-input"
        />
      </div>

      <div>
        <label htmlFor="notes" className="field-label">
          メモ（任意）
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={plant?.notes ?? ""}
          placeholder="育て方のメモなど"
          className="field-textarea"
        />
      </div>

      <button type="submit" className="btn-primary">
        {isEdit ? "変更を保存" : "植物を追加"}
      </button>
    </form>
  );
}
