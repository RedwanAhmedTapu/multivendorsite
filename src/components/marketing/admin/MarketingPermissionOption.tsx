"use client";

// The marketingManagement checkbox for the employee permission editor.
// Rendered only for an ADMIN (PermissionCheckboxGroup decides); text via
// next-intl with its own scoped provider, styled like the other base options.

import { useTranslations } from "next-intl";
import { MarketingIntlProvider } from "@/i18n/MarketingIntlProvider";

function Option({ checked, disabled, onChange }: { checked: boolean; disabled?: boolean; onChange: (checked: boolean) => void }) {
  const t = useTranslations("marketing.permission");
  return (
    <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 cursor-pointer">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div>
        <p className="text-sm font-medium text-gray-900">{t("label")}</p>
        <p className="text-xs text-gray-500">{t("description")}</p>
      </div>
    </label>
  );
}

export function MarketingPermissionOption(props: { checked: boolean; disabled?: boolean; onChange: (checked: boolean) => void }) {
  return (
    <MarketingIntlProvider>
      <Option {...props} />
    </MarketingIntlProvider>
  );
}
