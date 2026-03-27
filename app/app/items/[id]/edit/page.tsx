import { notFound } from "next/navigation";

import { ItemForm } from "@/components/items/item-form";
import { PageHeader } from "@/components/ui/page-header";
import { getLookupOptions, getMenuItem } from "@/lib/data/queries";

export default async function EditItemPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const paramsSearch = await searchParams;
  const [item, lookup] = await Promise.all([getMenuItem(id), getLookupOptions()]);
  if (!item) notFound();

  return (
    <div>
      <PageHeader
        title="Edit Menu Item"
        compact
        backHref={`/app/items/${item.id}`}
      />
      <ItemForm
        item={item}
        mealTypes={lookup.mealTypes}
        cookingTimes={lookup.cookingTimes}
        ingredientUnits={lookup.ingredientUnits}
        error={paramsSearch.error}
      />
    </div>
  );
}
