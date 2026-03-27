"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, Plus, Search, Trash2 } from "lucide-react";

import { saveMenuItemAction } from "@/lib/data/actions";
import { createClient } from "@/lib/supabase/client";
import type { DraftIngredient, Ingredient, LookupOption, MenuItem } from "@/lib/types";
import { ChipSelector } from "@/components/ui/chip-selector";

type ItemFormProps = {
  item?: MenuItem | null;
  mealTypes: LookupOption[];
  cookingTimes: LookupOption[];
  ingredientUnits: LookupOption[];
  error?: string;
};

type PhotoMode = "phone" | "search";
type ImageSearchResult = {
  id: string;
  thumbnail: string;
  full: string;
};

export function ItemForm({ item, mealTypes, cookingTimes, ingredientUnits, error }: ItemFormProps) {
  const [mealTypeOptions, setMealTypeOptions] = useState(mealTypes);
  const [cookingTimeOptions, setCookingTimeOptions] = useState(cookingTimes);
  const [mealTypeValue, setMealTypeValue] = useState(item?.meal_type_id ?? "");
  const [cookingTimeValue, setCookingTimeValue] = useState(item?.cooking_time_id ?? "");
  const [customMealType, setCustomMealType] = useState("");
  const [customCookingTime, setCustomCookingTime] = useState("");
  const [photoMode, setPhotoMode] = useState<PhotoMode>("phone");
  const [photoName, setPhotoName] = useState("");
  const [filePreview, setFilePreview] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ImageSearchResult[]>([]);
  const [selectedSearchImage, setSelectedSearchImage] = useState("");
  const [confirmedImageUrl, setConfirmedImageUrl] = useState(item?.image_url?.startsWith("http") ? item.image_url : "");
  const [imageError, setImageError] = useState("");
  const [isSearchingImages, setIsSearchingImages] = useState(false);
  const [ingredientName, setIngredientName] = useState("");
  const [ingredientQuantity, setIngredientQuantity] = useState("1");
  const [ingredientUnit, setIngredientUnit] = useState("count");
  const [draftIngredients, setDraftIngredients] = useState<DraftIngredient[]>([]);

  const existingIngredients = item?.ingredients ?? [];

  const imagePreview = useMemo(() => {
    if (photoMode === "phone" && filePreview) return filePreview;
    if (photoMode === "search" && selectedSearchImage) return selectedSearchImage;
    if (confirmedImageUrl) return confirmedImageUrl;
    return item?.image_url ?? "";
  }, [confirmedImageUrl, filePreview, item?.image_url, photoMode, selectedSearchImage]);

  async function addCustomLookup(table: "meal_types" | "cooking_times") {
    const name = table === "meal_types" ? customMealType.trim() : customCookingTime.trim();
    if (!name) return;

    setLookupError("");
    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setLookupError("Please log in again.");
      return;
    }

    const { data, error: insertError } = await supabase
      .from(table)
      .insert({
        user_id: user.id,
        name,
        sort_order: 999
      })
      .select("id, name, sort_order, user_id")
      .single();

    if (insertError || !data) {
      setLookupError(insertError?.message || "Unable to add that option.");
      return;
    }

    if (table === "meal_types") {
      setMealTypeOptions((current) => [...current, data]);
      setMealTypeValue(data.id);
      setCustomMealType("");
      return;
    }

    setCookingTimeOptions((current) => [...current, data]);
    setCookingTimeValue(data.id);
    setCustomCookingTime("");
  }

  async function runImageSearch() {
    const query = searchQuery.trim();
    if (!query) return;
    setImageError("");
    setIsSearchingImages(true);

    try {
      const response = await fetch(`https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=12`);
      if (!response.ok) {
        throw new Error("Image search failed.");
      }

      const payload = (await response.json()) as {
        results?: Array<{ id?: string; thumbnail?: string | null; url?: string | null }>;
      };

      const results =
        payload.results
          ?.filter((entry) => entry.thumbnail && entry.url)
          .map((entry, index) => ({
            id: entry.id || `${query}-${index}`,
            thumbnail: entry.thumbnail as string,
            full: entry.url as string
          })) ?? [];

      setSearchResults(results);
      if (!results.length) setImageError("No images found for that search.");
    } catch {
      setSearchResults([]);
      setImageError("Image search is unavailable right now. Try another term.");
    } finally {
      setIsSearchingImages(false);
    }
  }

  function addDraftIngredient() {
    const name = ingredientName.trim();
    if (!name) return;

    const duplicate = [...existingIngredients, ...draftIngredients].some((ingredient) => ingredient.name.toLowerCase() === name.toLowerCase());
    if (duplicate) return;

    setDraftIngredients((current) => [
      ...current,
      {
        name,
        quantity: Number(ingredientQuantity) > 0 ? Number(ingredientQuantity) : 1,
        unit_label: ingredientUnit
      }
    ]);
    setIngredientName("");
    setIngredientQuantity("1");
    setIngredientUnit("count");
  }

  function removeDraftIngredient(name: string) {
    setDraftIngredients((current) => current.filter((ingredient) => ingredient.name !== name));
  }

  return (
    <form action={saveMenuItemAction} className="stack-lg" encType="multipart/form-data">
      {item ? <input type="hidden" name="item_id" value={item.id} /> : null}
      <input type="hidden" name="existing_image_url" value={item?.image_url ?? ""} />
      <input type="hidden" name="draft_ingredients" value={JSON.stringify(draftIngredients)} />

      <section className="form-section">
        <div className="form-section-header">
          <h3>Basics</h3>
          <p>Name it, choose how it fits, and mark it current if it is on hand.</p>
        </div>
        <label className="field form-field-intro">
          <span>Name</span>
          <input name="name" defaultValue={item?.name ?? ""} placeholder="Enter name..." required />
        </label>

        <ChipSelector
          name="meal_type_id"
          label="Meal Type"
          value={mealTypeValue}
          onChange={setMealTypeValue}
          options={[
            ...mealTypeOptions.map((option) => ({ label: option.name, value: option.id })),
            { label: "Create New", value: "__custom__" }
          ]}
        />

        {mealTypeValue === "__custom__" ? (
          <div className="field-action-row">
            <label className="field">
              <span>Custom Meal Type</span>
              <input value={customMealType} onChange={(event) => setCustomMealType(event.target.value)} placeholder="Enter custom meal type" />
            </label>
            {customMealType.trim() ? (
              <button className="button button-secondary button-small inline-field-button" type="button" onClick={() => addCustomLookup("meal_types")}>
                Add
              </button>
            ) : null}
          </div>
        ) : null}

        <ChipSelector
          name="cooking_time_id"
          label="Cooking Time"
          value={cookingTimeValue}
          onChange={setCookingTimeValue}
          options={[
            ...cookingTimeOptions.map((option) => ({ label: option.name, value: option.id })),
            { label: "Create New", value: "__custom__" }
          ]}
        />

        {cookingTimeValue === "__custom__" ? (
          <div className="field-action-row">
            <label className="field">
              <span>Custom Cooking Time</span>
              <input value={customCookingTime} onChange={(event) => setCustomCookingTime(event.target.value)} placeholder="Enter custom cooking time" />
            </label>
            {customCookingTime.trim() ? (
              <button className="button button-secondary button-small inline-field-button" type="button" onClick={() => addCustomLookup("cooking_times")}>
                Add
              </button>
            ) : null}
          </div>
        ) : null}

        <label className="checkbox-row">
          <input name="is_current" type="checkbox" defaultChecked={item?.is_current ?? false} />
          <span>Current Menu</span>
        </label>
      </section>

      <section className="form-section">
        <div className="form-section-header">
          <h3>Photo</h3>
          <p>Choose a cover image that feels easy to recognize at a glance.</p>
        </div>
        <div className="image-picker">
          <span className="field-label">Image</span>
          <div className="photo-mode-picker photo-mode-picker-two">
            <button className={photoMode === "phone" ? "photo-mode active" : "photo-mode"} type="button" onClick={() => setPhotoMode("phone")}>
              Choose from phone
            </button>
            <button className={photoMode === "search" ? "photo-mode active" : "photo-mode"} type="button" onClick={() => setPhotoMode("search")}>
              Search online images
            </button>
          </div>

          {photoMode === "phone" ? (
            <label className="image-picker-dropzone">
              <span className="image-picker-plus">+</span>
              <input
                className="visually-hidden-input"
                name="image_file"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setPhotoName(file?.name || "");
                  setFilePreview(file ? URL.createObjectURL(file) : "");
                }}
              />
            </label>
          ) : null}

          {photoMode === "search" ? (
            <div className="stack-sm">
              <div className="lookup-inline-actions">
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search food images" />
                <button className="button button-secondary button-small" type="button" onClick={runImageSearch}>
                  <Search size={15} />
                  {isSearchingImages ? "Searching..." : "Search"}
                </button>
              </div>

              {imageError ? <p className="form-error">{imageError}</p> : null}

              {searchResults.length ? (
                <div className="search-results-grid">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      className={selectedSearchImage === result.full ? "image-search-card selected" : "image-search-card"}
                      onClick={() => setSelectedSearchImage(result.full)}
                    >
                      <img src={result.thumbnail} alt={searchQuery || "Search result"} />
                    </button>
                  ))}
                </div>
              ) : null}

              {selectedSearchImage ? (
                <button
                  className="button button-secondary button-small image-confirm-button"
                  type="button"
                  onClick={() => {
                    setConfirmedImageUrl(selectedSearchImage);
                    setSearchResults([]);
                  }}
                >
                  <Check size={15} />
                  OK
                </button>
              ) : null}

              <input type="hidden" name="image_url" value={confirmedImageUrl} />
            </div>
          ) : null}

          {imagePreview ? (
            <div className="image-search-preview">
              <img src={imagePreview} alt="Selected preview" />
            </div>
          ) : null}
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-header ingredients-section-header">
          <h3>Ingredients</h3>
          <p>Keep the list lightweight so shopping stays easy later.</p>
        </div>
        <div className="ingredient-builder-card">
          <div className="ingredient-builder-main">
            <input value={ingredientName} onChange={(event) => setIngredientName(event.target.value)} placeholder="Ingredient name" />
            <div className="ingredient-builder-meta">
              <input value={ingredientQuantity} onChange={(event) => setIngredientQuantity(event.target.value)} type="number" min="0.1" step="0.1" placeholder="Qty" />
              <select value={ingredientUnit} onChange={(event) => setIngredientUnit(event.target.value)}>
                {ingredientUnits.map((unit) => (
                  <option key={unit.id} value={unit.name}>
                    {unit.name}
                  </option>
                ))}
              </select>
              <button className="button button-secondary ingredient-add-button" type="button" onClick={addDraftIngredient} aria-label="Add ingredient draft">
                <Plus size={16} />
                Add
              </button>
            </div>
          </div>
        </div>

        {existingIngredients.length ? (
          <div className="stack-sm">
            {existingIngredients.map((ingredient: Ingredient) => (
              <div key={ingredient.id} className="ingredient-inline-row muted-row">
                <span>{ingredient.name}</span>
                <span className="ingredient-line-separator">-</span>
                <span className="muted-copy">
                  {ingredient.quantity ?? 1} {ingredient.unit_label || "unit"}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        {draftIngredients.length ? (
          <div className="stack-sm">
            {draftIngredients.map((ingredient) => (
              <div key={ingredient.name} className="ingredient-inline-row">
                <span>{ingredient.name}</span>
                <span className="ingredient-line-separator">-</span>
                <span className="muted-copy">
                  {ingredient.quantity} {ingredient.unit_label}
                </span>
                <button className="icon-mini-button icon-danger" type="button" onClick={() => removeDraftIngredient(ingredient.name)} aria-label={`Remove ${ingredient.name}`}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <p className="subtle-note">If no ingredients are included with this item, enter the item name to be able to add to shopping cart later</p>
      </section>

      <section className="form-section">
        <div className="form-section-header">
          <h3>Details</h3>
          <p>Add any recipe steps or quick notes you want to remember.</p>
        </div>
        <label className="field">
          <span>Recipes</span>
          <textarea name="recipes" defaultValue={item?.recipes ?? ""} placeholder="Enter recipes..." rows={5} />
        </label>

        <label className="field">
          <span>Notes</span>
          <textarea name="notes" defaultValue={item?.notes ?? ""} placeholder="Enter notes..." rows={4} />
        </label>
      </section>

      {lookupError ? <p className="form-error">{lookupError}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <div className="stack-sm">
        <button className="button button-primary" type="submit">
          {item ? "Save Changes" : "Add to List"}
        </button>
        <Link className="button button-secondary" href={item ? `/app/items/${item.id}` : "/app"}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
