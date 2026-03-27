import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ShoppingSearch } from "@/components/shopping/shopping-search";
import { getLookupOptions, getShoppingCatalog, getShoppingList } from "@/lib/data/queries";

export default async function ShoppingListPage({
  searchParams
}: {
  searchParams: Promise<{ search?: string; error?: string }>;
}) {
  const params = await searchParams;
  const [items, catalog, lookup] = await Promise.all([getShoppingList(params.search), getShoppingCatalog(), getLookupOptions()]);

  return (
    <div>
      {params.error ? <p className="form-error">{params.error}</p> : null}

      <PageHeader title="Your Shopping List" subtitle="What you need for later." />

      {items.length ? (
        <ShoppingSearch items={items} catalog={catalog} units={lookup.ingredientUnits} />
      ) : (
        <div className="stack-md">
          <ShoppingSearch items={items} catalog={catalog} units={lookup.ingredientUnits} />
          <EmptyState
            icon="🧺"
            title="No shopping items yet"
            description="Pull in what you need when something sounds worth making."
            action={
              <Link className="button button-primary" href="/app/library">
                Open Library
              </Link>
            }
          />
        </div>
      )}
    </div>
  );
}
