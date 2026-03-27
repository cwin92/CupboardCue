"use client";

import { useMemo, useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";

import { toggleIngredientShoppingAction, updateShoppingGroupAction } from "@/lib/data/actions";
import type { LookupOption, SearchableIngredientGroup, ShoppingListGroup } from "@/lib/types";

type ShoppingSearchProps = {
  items: ShoppingListGroup[];
  catalog: SearchableIngredientGroup[];
  units: LookupOption[];
};

export function ShoppingSearch({ items, catalog, units }: ShoppingSearchProps) {
  const [query, setQuery] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const normalized = query.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(normalized) ||
        item.source_menu_names.some((name) => name.toLowerCase().includes(normalized))
    );
  }, [items, query]);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const normalized = query.toLowerCase();
    const fromCurrent = items
      .filter(
        (item) =>
          item.name.toLowerCase().includes(normalized) ||
          item.source_menu_names.some((name) => name.toLowerCase().includes(normalized))
      )
      .map((item) => item.name);

    const fromCatalog = catalog
      .filter(
        (item) =>
          item.name.toLowerCase().includes(normalized) ||
          item.source_menu_names.some((name) => name.toLowerCase().includes(normalized))
      )
      .map((item) => item.name);

    return Array.from(new Set([...fromCurrent, ...fromCatalog])).slice(0, 6);
  }, [catalog, items, query]);

  const availableResults = useMemo(() => {
    if (!query.trim()) return [];
    const normalized = query.toLowerCase();
    return catalog
      .filter(
        (item) =>
          !item.on_shopping_list &&
          (item.name.toLowerCase().includes(normalized) || item.source_menu_names.some((name) => name.toLowerCase().includes(normalized)))
      )
      .slice(0, 8);
  }, [catalog, query]);

  return (
    <div className="stack-md">
      <section className="detail-card compact-panel stack-sm">
        <div className="search-form search-form-live">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search ingredients or meals..."
            list="shopping-search-suggestions"
          />
          <datalist id="shopping-search-suggestions">
            {suggestions.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </div>
      </section>

      {query.trim() && availableResults.length ? (
        <div className="stack-sm">
          {availableResults.map((ingredient) => (
            <div key={`candidate-${ingredient.key}`} className="shopping-row shopping-row-add">
              <div className="ingredient-line shopping-row-copy">
                <span>{ingredient.name}</span>
                <span className="ingredient-line-separator">·</span>
                <span className="muted-copy">
                  {ingredient.quantity} {ingredient.unit_label}
                </span>
              </div>
              <form action={toggleIngredientShoppingAction}>
                <input type="hidden" name="ingredient_ids" value={ingredient.ingredient_ids.join(",")} />
                <input type="hidden" name="next_value" value="true" />
                <input type="hidden" name="redirect_to" value="/app/shopping-list" />
                <button className="icon-mini-button" type="submit" aria-label={`Add ${ingredient.name}`}>
                  <Plus size={16} />
                </button>
              </form>
            </div>
          ))}
        </div>
      ) : null}

      {filtered.length ? (
        <div className="stack-sm">
          {filtered.map((ingredient) => (
            <div key={ingredient.key} className="shopping-row">
              <div className="shopping-row-copy">
                {editingKey === ingredient.key ? (
                  <form action={updateShoppingGroupAction} className="shopping-edit-form">
                    <input type="hidden" name="ingredient_ids" value={ingredient.ingredient_ids.join(",")} />
                    <input type="hidden" name="redirect_to" value="/app/shopping-list" />
                    <input name="quantity" type="number" min="0.1" step="0.1" defaultValue={ingredient.quantity ?? 1} />
                    <select name="unit_label" defaultValue={ingredient.unit_label ?? "unit"}>
                      {units.map((unit) => (
                        <option key={unit.id} value={unit.name}>
                          {unit.name}
                        </option>
                      ))}
                    </select>
                    <button className="icon-mini-button" type="submit" aria-label={`Save ${ingredient.name}`}>
                      <Check size={15} />
                    </button>
                  </form>
                ) : (
                  <div className="shopping-row-ingredient">
                    <div className="ingredient-line">
                      <span>{ingredient.name}</span>
                      <span className="ingredient-line-separator">·</span>
                      <span className="muted-copy">
                        {ingredient.quantity} {ingredient.unit_label}
                      </span>
                    </div>
                    {ingredient.source_menu_names.length > 0 && (
                      <p className="shopping-row-source">{ingredient.source_menu_names.join(", ")}</p>
                    )}
                  </div>
                )}
              </div>
              <div className="shopping-row-actions">
                <button
                  className={editingKey === ingredient.key ? "icon-mini-button active" : "icon-mini-button"}
                  type="button"
                  aria-label={editingKey === ingredient.key ? `Close edit for ${ingredient.name}` : `Edit ${ingredient.name}`}
                  onClick={() => setEditingKey((current) => (current === ingredient.key ? null : ingredient.key))}
                >
                  {editingKey === ingredient.key ? <X size={15} /> : <Pencil size={15} />}
                </button>
                <form action={toggleIngredientShoppingAction}>
                  <input type="hidden" name="ingredient_ids" value={ingredient.ingredient_ids.join(",")} />
                  <input type="hidden" name="next_value" value="false" />
                  <input type="hidden" name="redirect_to" value="/app/shopping-list" />
                  <button className="icon-mini-button icon-danger" type="submit" aria-label={`Remove ${ingredient.name}`}>
                    <Trash2 size={15} />
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      ) : query.trim() ? (
        <div className="empty-state">
          <h3>No matching ingredients</h3>
          <p>Try a shorter name or clear the search.</p>
        </div>
      ) : null}
    </div>
  );
}
