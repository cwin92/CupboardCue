import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { format } from "date-fns";

import { deleteCalendarEntryAction } from "@/lib/data/actions";
import { MealTypePill } from "@/components/ui/meal-type-pill";
import type { PlannerDay } from "@/lib/types";
import { DEFAULT_IMAGE, formatMonthLabel, truncate } from "@/lib/utils";

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function PlannerGrid({
  days,
  mode,
  focusDate
}: {
  days: PlannerDay[];
  mode: "week" | "month";
  focusDate: Date;
}) {
  const label = formatMonthLabel(focusDate);
  const prevFocus = new Date(focusDate);
  prevFocus.setDate(mode === "week" ? focusDate.getDate() - 7 : focusDate.getDate() - 31);
  const nextFocus = new Date(focusDate);
  nextFocus.setDate(mode === "week" ? focusDate.getDate() + 7 : focusDate.getDate() + 31);

  return (
    <section className="stack-md">
      <div className="planner-toolbar">
        <div className="segmented-control">
          <Link href={`/app/planner?mode=week&date=${format(focusDate, "yyyy-MM-dd")}`} className={mode === "week" ? "active" : ""}>
            Week
          </Link>
          <Link href={`/app/planner?mode=month&date=${format(focusDate, "yyyy-MM-dd")}`} className={mode === "month" ? "active" : ""}>
            Month
          </Link>
        </div>
        <div className="planner-nav">
          <Link href={`/app/planner?mode=${mode}&date=${format(prevFocus, "yyyy-MM-dd")}`} className="circle-button">
            <ChevronLeft size={18} />
          </Link>
          <span>{label}</span>
          <Link href={`/app/planner?mode=${mode}&date=${format(nextFocus, "yyyy-MM-dd")}`} className="circle-button">
            <ChevronRight size={18} />
          </Link>
        </div>
      </div>

      {mode === "month" ? (
        <div className="month-calendar">
          <div className="month-calendar-header">
            {weekdayLabels.map((weekday) => (
              <div key={weekday} className="month-calendar-weekday">
                {weekday}
              </div>
            ))}
          </div>
          <div className="month-calendar-grid">
            {days.map((day) => (
              <div key={day.date.toISOString()} className="month-day">
                <div className="month-day-top">
                  <strong>{format(day.date, "d")}</strong>
                </div>
                <div className="month-day-entries">
                  {day.entries.slice(0, 3).map((entry) => (
                    <Link
                      key={entry.id}
                      href={`/app/items/${entry.menu_item_id}`}
                      className="month-entry"
                      data-tone={entry.menu_item?.meal_type?.name?.toLowerCase() || "default"}
                    >
                      {truncate(entry.menu_item?.name || "Menu Item", 10)}
                    </Link>
                  ))}
                </div>
                <Link
                  href={`/app/planner?mode=${mode}&date=${format(focusDate, "yyyy-MM-dd")}&selectedDate=${format(day.date, "yyyy-MM-dd")}`}
                  className="month-add-link"
                  aria-label={`Add menu item for ${format(day.date, "MMMM d")}`}
                >
                  <Plus size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="planner-grid planner-grid-week">
          {days.map((day) => (
            <div key={day.date.toISOString()} className="planner-day">
              <div className="planner-day-label">
                <strong>{format(day.date, "EEE")}</strong>
                <span>{format(day.date, "MMM d")}</span>
              </div>

              <div className="stack-sm">
                {day.entries.map((entry) => (
                  <div key={entry.id} className="planner-entry">
                    <Link href={`/app/items/${entry.menu_item_id}`} className="planner-entry-stack">
                      <img src={entry.menu_item?.image_url || DEFAULT_IMAGE} alt={entry.menu_item?.name || "Planned item"} />
                      <span>{truncate(entry.menu_item?.name || "Menu Item", 14)}</span>
                      <MealTypePill name={entry.menu_item?.meal_type?.name} />
                    </Link>
                    <form action={deleteCalendarEntryAction}>
                      <input type="hidden" name="entry_id" value={entry.id} />
                      <input type="hidden" name="redirect_to" value={`/app/planner?mode=${mode}&date=${format(focusDate, "yyyy-MM-dd")}`} />
                      <button type="submit" className="planner-remove">
                        <X size={14} />
                      </button>
                    </form>
                  </div>
                ))}
              </div>

              <Link
                href={`/app/planner?mode=${mode}&date=${format(focusDate, "yyyy-MM-dd")}&selectedDate=${format(day.date, "yyyy-MM-dd")}`}
                className="planner-add-button"
              >
                Add Menu Item
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
