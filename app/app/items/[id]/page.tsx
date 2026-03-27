import Link from "next/link";
import { ChevronLeft, Clock3, Pencil, Utensils } from "lucide-react";
import { format } from "date-fns";
import { notFound } from "next/navigation";

import { DeleteItemButton } from "@/components/items/delete-item-button";
import { IngredientList } from "@/components/items/ingredient-list";
import { MealTypePill } from "@/components/ui/meal-type-pill";
import {
  addCalendarEntryAction,
  addIngredientAction,
  removeFromCurrentAction,
  toggleCurrentAction
} from "@/lib/data/actions";
import { getIngredientSuggestions, getLookupOptions, getMenuItem, getUpcomingCalendarDatesForItem } from "@/lib/data/queries";
import { DEFAULT_IMAGE } from "@/lib/utils";

export default async function ItemDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; pickShopping?: string }>;
}) {
  const { id } = await params;
  const pageParams = await searchParams;
  const [item, suggestions, lookup, upcomingDates] = await Promise.all([
    getMenuItem(id),
    getIngredientSuggestions(),
    getLookupOptions(),
    getUpcomingCalendarDatesForItem(id)
  ]);
  if (!item) notFound();

  return (
    <div className="stack-md">
      <div className="detail-topbar">
        <Link href="/app" className="back-link">
          <ChevronLeft size={16} />
          <span>Back</span>
        </Link>
        <div className="detail-actions">
          <Link className="top-action-button" href={`/app/items/${item.id}/edit`}>
            <Pencil size={18} />
          </Link>
          <DeleteItemButton itemId={item.id} />
        </div>
      </div>

      <section className="item-hero">
        <img src={item.image_url || DEFAULT_IMAGE} alt={item.name} />
        <div className="item-hero-copy">
          <h2 className="item-detail-title">{item.name}</h2>
          <div className="item-meta">
            <div className="item-meta-row">
              <Utensils size={18} />
              <MealTypePill name={item.meal_type?.name} />
            </div>
            <div className="item-meta-row">
              <Clock3 size={18} />
              <span>{item.cooking_time?.name || "No cooking time set"}</span>
            </div>
          </div>

          <form action={toggleCurrentAction} className="current-menu-toggle-row">
            <span>Current Menu</span>
            <input type="hidden" name="item_id" value={item.id} />
            <input type="hidden" name="is_current" value={String(item.is_current)} />
            <input type="hidden" name="redirect_to" value={`/app/items/${item.id}`} />
            <button className={item.is_current ? "toggle-pill toggle-pill-on" : "toggle-pill"} type="submit">
              {item.is_current ? "On" : "Off"}
            </button>
          </form>
        </div>
      </section>

      <section className="detail-section">
        <h3>Recipes</h3>
        <div className="detail-section-content">{item.recipes || "No recipe notes added yet."}</div>
      </section>

      <section className="detail-section">
        <h3>Notes</h3>
        <div className="detail-section-content">{item.notes || "No notes added yet."}</div>
      </section>

      <section className="detail-section stack-md">
        {pageParams.pickShopping ? (
          <div className="stack-sm">
            <p className="inline-note">Add any ingredients you need before removing this item.</p>
            <form action={removeFromCurrentAction}>
              <input type="hidden" name="item_id" value={item.id} />
              <input type="hidden" name="redirect_to" value="/app" />
              <button className="button button-secondary button-small" type="submit">
                Remove From Current Menu
              </button>
            </form>
          </div>
        ) : null}

        <div className="stack-sm">
          <h3>Ingredients</h3>
          <form action={addIngredientAction} className="stack-sm">
            <input type="hidden" name="item_id" value={item.id} />
            <input type="hidden" name="redirect_to" value={`/app/items/${item.id}${pageParams.pickShopping ? "?pickShopping=1" : ""}`} />
            <input name="name" list="ingredient-suggestions" placeholder="Type ingredient name..." autoComplete="off" required />
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
            <datalist id="ingredient-suggestions">
              {suggestions.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
            {pageParams.error ? <p className="form-error">{pageParams.error}</p> : null}
            <button className="button button-primary" type="submit">
              Add Ingredient
            </button>
          </form>

          <IngredientList ingredients={item.ingredients ?? []} itemId={item.id} redirectTo={`/app/items/${item.id}`} />
        </div>
      </section>

      <section className="detail-section stack-sm">
        <h3>Choose a date for this item</h3>
        <form action={addCalendarEntryAction} className="stack-sm">
          <input type="hidden" name="menu_item_id" value={item.id} />
          <input name="planned_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
          <button className="button button-secondary" type="submit">
            Add to calendar
          </button>
        </form>
        {upcomingDates.length ? (
          <div className="scheduled-list">
            {upcomingDates.map((date) => (
              <p key={date} className="muted-copy">
                Scheduled: {format(new Date(date), "EEEE, MMMM do")}
              </p>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
