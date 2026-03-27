import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { isValid } from "date-fns";

import { PlannerGrid } from "@/components/planner/planner-grid";
import { PageHeader } from "@/components/ui/page-header";
import { addCalendarEntryAction } from "@/lib/data/actions";
import { getMenuItemsForSelect, getPlannerData } from "@/lib/data/queries";
import { DEFAULT_IMAGE } from "@/lib/utils";

export default async function PlannerPage({
  searchParams
}: {
  searchParams: Promise<{ mode?: "week" | "month"; date?: string; quickAdd?: string; selectedDate?: string; error?: string }>;
}) {
  const params = await searchParams;
  const mode = params.mode === "month" ? "month" : "week";
  const [planner, items] = await Promise.all([getPlannerData(mode, params.date), getMenuItemsForSelect(true)]);
  const quickAddItem = params.quickAdd ? items.find((item) => item.id === params.quickAdd) : null;
  const requestedSelectedDate = params.selectedDate ?? params.date;
  const safeSelectedDate =
    requestedSelectedDate && isValid(new Date(requestedSelectedDate))
      ? requestedSelectedDate
      : new Date().toISOString().slice(0, 10);

  return (
    <div className="stack-md">
      {params.error ? <p className="form-error">{params.error}</p> : null}

      <PageHeader title="Calendar" subtitle="Save ideas for later." />

      {quickAddItem || params.selectedDate ? (
        <section className="detail-card planner-quick-add-card">
          {quickAddItem ? (
            <div className="planner-quick-add-head">
              <img src={quickAddItem.image_url || DEFAULT_IMAGE} alt={quickAddItem.name} className="shopping-thumb planner-quick-add-thumb" />
              <div className="planner-quick-add-copy">
                <p className="planner-quick-add-kicker">Plan item</p>
                <h3>Schedule {quickAddItem.name}</h3>
                <p className="muted-copy">Save it for a day that sounds good.</p>
              </div>
            </div>
          ) : (
            <div className="planner-quick-add-copy">
              <p className="planner-quick-add-kicker">Plan item</p>
              <h3>Save something for later</h3>
              <p className="muted-copy">Choose an item and save it for later.</p>
            </div>
          )}
          <form action={addCalendarEntryAction} className="planner-quick-add-form">
            <input
              type="hidden"
              name="redirect_to"
              value={`/app/planner?mode=${mode}&date=${params.date ?? new Date().toISOString().slice(0, 10)}`}
            />
            {quickAddItem ? <input type="hidden" name="menu_item_id" value={quickAddItem.id} /> : null}
            {!quickAddItem ? (
              <select name="menu_item_id" defaultValue="" required>
                <option value="">Choose something from your menu...</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            ) : null}
            <div className="planner-date-shell">
              <label className="planner-date-field">
                <span>Date</span>
                <div className="planner-date-input-wrap">
                  <CalendarDays size={16} />
                  <input name="planned_date" type="date" defaultValue={safeSelectedDate} required />
                </div>
              </label>
            </div>
            <div className="planner-quick-add-actions">
              <button className="button button-primary" type="submit">
                Add to Plan
              </button>
              <Link className="button button-secondary" href={`/app/planner?mode=${mode}&date=${params.date ?? ""}`}>
                Cancel
              </Link>
            </div>
          </form>
        </section>
      ) : null}

      <PlannerGrid days={planner.days} mode={mode} focusDate={planner.focusDate} />
    </div>
  );
}
