import Link from "next/link";
import { CalendarPlus, Check, Plus } from "lucide-react";

import { toggleCurrentAction } from "@/lib/data/actions";
import { MealTypePill } from "@/components/ui/meal-type-pill";
import type { MenuItem } from "@/lib/types";
import { DEFAULT_IMAGE } from "@/lib/utils";

type LibrarySectionsProps = {
  sections: Array<[string, MenuItem[]]>;
};

export function LibrarySections({ sections }: LibrarySectionsProps) {
  return (
    <div className="stack-lg">
      {sections.map(([sectionName, items]) => (
        <section key={sectionName} className="stack-sm">
          <div className="section-heading-row">
            <h2>{sectionName}</h2>
          </div>
          <div className="library-list">
            {items.map((item) => (
              <div key={item.id} className="library-row">
                <Link href={`/app/items/${item.id}`} className="library-row-link">
                  <img src={item.image_url || DEFAULT_IMAGE} alt={item.name} className="library-thumb" />
                  <div>
                    <h3>{item.name}</h3>
                    <MealTypePill name={item.meal_type?.name} />
                  </div>
                </Link>

                <div className="row-actions">
                  <form action={toggleCurrentAction}>
                    <input type="hidden" name="item_id" value={item.id} />
                    <input type="hidden" name="is_current" value={String(item.is_current)} />
                    <input type="hidden" name="redirect_to" value="/app/library" />
                    <button className="icon-toggle" type="submit" aria-label={item.is_current ? "Remove from current menu" : "Add to current menu"}>
                      {item.is_current ? <Check size={15} strokeWidth={2.4} /> : <Plus size={15} strokeWidth={2.4} />}
                    </button>
                  </form>

                  {item.is_current ? (
                    <Link href={`/app/planner?quickAdd=${item.id}`} className="ghost-icon-button row-icon-action" aria-label="Plan this item">
                      <CalendarPlus size={16} />
                    </Link>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
