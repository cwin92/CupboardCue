import Link from "next/link";
import { Plus } from "lucide-react";

import { LibraryBrowser } from "@/components/items/library-browser";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getLibrary } from "@/lib/data/queries";

export default async function LibraryPage({
  searchParams
}: {
  searchParams: Promise<{ search?: string; error?: string }>;
}) {
  const params = await searchParams;
  const items = await getLibrary();

  return (
    <div>
      {params.error ? <p className="form-error">{params.error}</p> : null}

      <PageHeader
        title="Your Full Library"
        subtitle="Everything you can pull into your menu."
        actions={
          <Link className="top-action-button" href="/app/items/new" aria-label="Add new item">
            <Plus size={18} />
          </Link>
        }
      />

      {items.length ? (
        <LibraryBrowser items={items} />
      ) : (
        <EmptyState
          title="Your library is empty"
          description="Start building the foods you can pull into your menu."
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
