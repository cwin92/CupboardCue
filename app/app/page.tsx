import Link from "next/link";
import { Plus } from "lucide-react";

import { CurrentMenuSections } from "@/components/items/current-menu-sections";
import { EmptyState } from "@/components/ui/empty-state";
import { MealTypeFilter } from "@/components/ui/meal-type-filter";
import { getCurrentMenu, getLookupOptions } from "@/lib/data/queries";
import { groupMenuItems } from "@/lib/utils";

export default async function CurrentMenuPage({
  searchParams
}: {
  searchParams: Promise<{ mealType?: string; search?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { mealTypes } = await getLookupOptions();
  const items = await getCurrentMenu(params.mealType, params.search);
  const sections = groupMenuItems(items);

  return (
    <div>
      {params.error ? <p className="form-error">{params.error}</p> : null}

      <section className="home-header">
        <div className="home-header-copy">
          <h1>Your Current Menu</h1>
          <p>See what&apos;s ready right now.</p>
        </div>
        <Link className="home-add-button" href="/app/items/new" aria-label="Add new item">
          <Plus size={18} />
        </Link>
      </section>

      <section className="home-filter-shell">
        <MealTypeFilter options={mealTypes} />
      </section>

      {items.length ? (
        <CurrentMenuSections sections={sections} />
      ) : (
        <EmptyState
          title="No current menu items yet"
          description="Add foods you have on hand so your menu is ready to browse."
          action={
            <Link className="button button-primary" href="/app/items/new">
              Add New Item
            </Link>
          }
        />
      )}
    </div>
  );
}
