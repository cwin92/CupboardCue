"use client";

import { useState } from "react";
import { Trash2, X } from "lucide-react";

import { deleteMenuItemAction } from "@/lib/data/actions";

export function DeleteItemButton({ itemId }: { itemId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="top-action-button" aria-label="Delete item" onClick={() => setOpen(true)}>
        <Trash2 size={18} />
      </button>

      {open ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card stack-md">
            <div className="modal-head">
              <h3>Delete item?</h3>
              <button type="button" className="ghost-icon-button" onClick={() => setOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <p className="muted-copy">Are you sure you want to delete this item from your master list?</p>
            <form action={deleteMenuItemAction} className="stack-sm">
              <input type="hidden" name="item_id" value={itemId} />
              <button className="button button-primary" type="submit">
                Yes
              </button>
              <button className="button button-secondary" type="button" onClick={() => setOpen(false)}>
                No
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
