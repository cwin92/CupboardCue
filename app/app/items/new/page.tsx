import { ItemForm } from "@/components/items/item-form";
import { PageHeader } from "@/components/ui/page-header";
import { getLookupOptions } from "@/lib/data/queries";

export default async function NewItemPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const { mealTypes, cookingTimes, ingredientUnits } = await getLookupOptions();

  return (
    <div>
      <PageHeader
        title="New Menu Item"
        compact
        backHref="/app"
      />
      <ItemForm mealTypes={mealTypes} cookingTimes={cookingTimes} ingredientUnits={ingredientUnits} error={params.error} />
    </div>
  );
}
