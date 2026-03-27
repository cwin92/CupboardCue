import { Check, Plus, Trash2 } from "lucide-react";

import { deleteIngredientAction, toggleIngredientShoppingAction } from "@/lib/data/actions";
import type { Ingredient } from "@/lib/types";

export function IngredientList({
  ingredients,
  itemId,
  redirectTo
}: {
  ingredients: Ingredient[];
  itemId: string;
  redirectTo: string;
}) {
  if (!ingredients.length) {
    return <p className="muted-copy">No ingredients yet.</p>;
  }

  return (
    <div className="stack-sm">
      {ingredients.map((ingredient) => (
        <div key={ingredient.id} className="ingredient-row">
          <div className="ingredient-line">
            <span>{ingredient.name}</span>
            <span className="ingredient-line-separator">-</span>
            <span className="muted-copy">
              {ingredient.quantity ?? 1} {ingredient.unit_label || "unit"}
            </span>
          </div>
          <div className="ingredient-actions">
            <form action={toggleIngredientShoppingAction}>
              <input type="hidden" name="ingredient_id" value={ingredient.id} />
              <input type="hidden" name="item_id" value={itemId} />
              <input type="hidden" name="next_value" value={String(!ingredient.on_shopping_list)} />
              <input type="hidden" name="redirect_to" value={redirectTo} />
              <button className="ghost-icon-button ingredient-status-button" type="submit" aria-label="Toggle shopping list">
                {ingredient.on_shopping_list ? <Check size={16} /> : <Plus size={16} />}
              </button>
            </form>
            <form action={deleteIngredientAction}>
              <input type="hidden" name="ingredient_id" value={ingredient.id} />
              <input type="hidden" name="item_id" value={itemId} />
              <input type="hidden" name="redirect_to" value={redirectTo} />
              <button className="ghost-icon-button" type="submit" aria-label="Delete ingredient">
                <Trash2 size={16} />
              </button>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}
