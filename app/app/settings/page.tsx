import { PageHeader } from "@/components/ui/page-header";
import { createLookupAction, deleteLookupAction, signOutAction, updateProfileAction } from "@/lib/data/actions";
import { getLookupOptions, getProfile } from "@/lib/data/queries";

export default async function SettingsPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const [lookup, profile] = await Promise.all([getLookupOptions(), getProfile()]);
  const { mealTypes, cookingTimes, ingredientUnits } = lookup;

  return (
    <div className="stack-md">
      <PageHeader title="Settings" />

      {params.error ? <p className="form-error">{params.error}</p> : null}

      <section className="settings-grid">
        <div className="form-section">
          <div className="form-section-header">
            <h3>Account</h3>
            <p>Keep the basics behind your visual menu up to date.</p>
          </div>
          <form action={updateProfileAction} className="stack-sm">
            <label className="field">
              <span>Name</span>
              <input name="full_name" defaultValue={profile?.full_name ?? ""} placeholder="Your name" />
            </label>
            <label className="field">
              <span>Email</span>
              <input value={profile?.email ?? ""} disabled readOnly />
            </label>
            <button className="button button-primary" type="submit">
              Save Profile
            </button>
          </form>
        </div>

        <div className="form-section">
          <div className="form-section-header">
            <h3>Meal Types</h3>
            <p>Adjust the labels that shape your menu.</p>
          </div>
          <div className="settings-option-list">
            {mealTypes.map((option) => (
              <div key={option.id} className="settings-option-row">
                <div className="settings-option-copy">
                  <span>{option.name}</span>
                  {!option.user_id ? <span className="settings-badge">Default</span> : null}
                </div>
                {option.user_id ? (
                  <form action={deleteLookupAction}>
                    <input type="hidden" name="table" value="meal_types" />
                    <input type="hidden" name="id" value={option.id} />
                    <button className="button button-secondary button-small" type="submit">
                      Delete
                    </button>
                  </form>
                ) : null}
              </div>
            ))}
          </div>
          <form action={createLookupAction} className="stack-sm">
            <input type="hidden" name="table" value="meal_types" />
            <input name="name" placeholder="Add custom meal type" />
            <button className="button button-primary" type="submit">
              Add Meal Type
            </button>
          </form>
        </div>

        <div className="form-section">
          <div className="form-section-header">
            <h3>Cooking Times</h3>
            <p>Keep time cues short and easy to scan.</p>
          </div>
          <div className="settings-option-list">
            {cookingTimes.map((option) => (
              <div key={option.id} className="settings-option-row">
                <div className="settings-option-copy">
                  <span>{option.name}</span>
                  {!option.user_id ? <span className="settings-badge">Default</span> : null}
                </div>
                {option.user_id ? (
                  <form action={deleteLookupAction}>
                    <input type="hidden" name="table" value="cooking_times" />
                    <input type="hidden" name="id" value={option.id} />
                    <button className="button button-secondary button-small" type="submit">
                      Delete
                    </button>
                  </form>
                ) : null}
              </div>
            ))}
          </div>
          <form action={createLookupAction} className="stack-sm">
            <input type="hidden" name="table" value="cooking_times" />
            <input name="name" placeholder="Add custom cooking time" />
            <button className="button button-primary" type="submit">
              Add Cooking Time
            </button>
          </form>
        </div>

        <div className="form-section">
          <div className="form-section-header">
            <h3>Ingredient Units</h3>
            <p>Use the measurement labels that fit your kitchen.</p>
          </div>
          <div className="settings-option-list">
            {ingredientUnits.map((option) => (
              <div key={option.id} className="settings-option-row">
                <div className="settings-option-copy">
                  <span>{option.name}</span>
                  {!option.user_id ? <span className="settings-badge">Default</span> : null}
                </div>
                {option.user_id ? (
                  <form action={deleteLookupAction}>
                    <input type="hidden" name="table" value="ingredient_units" />
                    <input type="hidden" name="id" value={option.id} />
                    <button className="button button-secondary button-small" type="submit">
                      Delete
                    </button>
                  </form>
                ) : null}
              </div>
            ))}
          </div>
          <form action={createLookupAction} className="stack-sm">
            <input type="hidden" name="table" value="ingredient_units" />
            <input name="name" placeholder="Add custom unit" />
            <button className="button button-primary" type="submit">
              Add Unit
            </button>
          </form>
        </div>

        <section className="form-section">
          <div className="form-section-header">
            <h3>Session</h3>
            <p>Sign out when you want to switch accounts or leave this device.</p>
          </div>
          <form action={signOutAction}>
            <button className="button button-secondary" type="submit">
              Sign Out
            </button>
          </form>
        </section>
      </section>
    </div>
  );
}
