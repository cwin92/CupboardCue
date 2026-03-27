"use client";

import { useMemo, useState } from "react";

import { LibrarySections } from "@/components/items/library-sections";
import { EmptyState } from "@/components/ui/empty-state";
import type { MenuItem } from "@/lib/types";
import { groupMenuItems } from "@/lib/utils";

export function LibraryBrowser({ items }: { items: MenuItem[] }) {
  const [query, setQuery] = useState("");

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const normalized = query.toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(normalized));
  }, [items, query]);

  const sections = useMemo(() => groupMenuItems(filteredItems), [filteredItems]);

  return (
    <div className="stack-md">
      <section className="detail-card compact-panel search-panel">
        <div className="search-form search-form-live">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search added items..."
            list="library-search-suggestions"
          />
          <datalist id="library-search-suggestions">
            {items.slice(0, 20).map((item) => (
              <option key={item.id} value={item.name} />
            ))}
          </datalist>
        </div>
      </section>

      {filteredItems.length ? (
        <LibrarySections sections={sections} />
      ) : (
        <EmptyState title="No matching items" description="Try a shorter name or clear the search." />
      )}
    </div>
  );
}
