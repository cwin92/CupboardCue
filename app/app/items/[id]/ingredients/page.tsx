import Link from "next/link";
import { Clock3, SquareCheckBig, Utensils } from "lucide-react";
import { notFound } from "next/navigation";

import { IngredientList } from "@/components/items/ingredient-list";
import { PageHeader } from "@/components/ui/page-header";
import { addIngredientAction } from "@/lib/data/actions";
import { getIngredientSuggestions, getLookupOptions, getMenuItem } from "@/lib/data/queries";
import { DEFAULT_IMAGE } from "@/lib/utils";

export default async function EditIngredientsPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const pageParams = await searchParams;
  const [item, suggestions, lookup] = await Promise.all([getMenuItem(id), getIngredientSuggestions(), getLookupOptions()]);

  if (!item) notFound();

  return (
    <div className="stack-md">
      <PageHeader
        title="Add/Edit Ingredients"
        subtitle="Add what this item needs."
        backHref={`/app/items/${item.id}`}
      />

      <section className="item-hero">
        <img src={item.image_url || DEFAULT_IMAGE} alt={item.name} />
        <div className="item-hero-copy">
          <h2>{item.name}</h2>
          <div className="item-meta">
            <div className="item-meta-row">
              <Utensils size={18} />
              <span>{item.meal_type?.name || "Uncategorized"}</span>
            </div>
            <div className="item-meta-row">
              <Clock3 size={18} />
              <span>{item.cooking_time?.name || "No cooking time set"}</span>
            </div>
            <div className="item-meta-row">
              <SquareCheckBig size={18} />
              <span>{item.is_current ? "Current Menu" : "Saved in Library"}</span>
            </div>
          </div>
        </div>
      </section>

      <form action={addIngredientAction} className="detail-section stack-md">
        <input type="hidden" name="item_id" value={item.id} />
        <input type="hidden" name="redirect_to" value={`/app/items/${item.id}/ingredients`} />
        <input name="name" list="ingredient-suggestions-edit" placeholder="Type ingredient name..." required />
        <div className="ingredient-form-grid">
          <input name="quantity" type="number" min="0.1" step="0.1" defaultValue="1" placeholder="Qty" required />
          <select name="unit_label" defaultValue="count">
            {lookup.ingredientUnits.map((unit) => (
              <option key={unit.id} value={unit.name}>
                {unit.name}
              </option>
            ))}
          </select>
        </div>
        <datalist id="ingredient-suggestions-edit">
          {suggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
        {pageParams.error ? <p className="form-error">{pageParams.error}</p> : null}
        <button className="button button-primary" type="submit">
          Create Ingredient
        </button>
        <Link className="button button-secondary" href={`/app/items/${item.id}`}>
          Cancel
        </Link>
      </form>

      <section className="detail-section">
        <h3>Ingredients</h3>
        <IngredientList ingredients={item.ingredients ?? []} itemId={item.id} redirectTo={`/app/items/${item.id}/ingredients`} />
      </section>
    </div>
  );
}
