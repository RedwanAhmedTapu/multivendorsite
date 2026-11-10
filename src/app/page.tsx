import { Suspense } from "react";

import LayoutProvider from "@/components/layout/LayoutProvider";
import { getCategoriesServer } from "@/lib/api-utils";
import { getActivePaletteServer, buildHomepagePaletteCss } from "@/lib/palette/active";
import { getActiveLayoutType, getPublishedHomepageConfig } from "@/lib/theme-utils";

export default async function Home() {
  const [layoutType, categoriesData, homepageConfig, palette] = await Promise.all([
    getActiveLayoutType(),
    getCategoriesServer(),
    getPublishedHomepageConfig(),
    getActivePaletteServer(),
  ]);

  const categories = categoriesData || [];
  // SSR'd inline <style> applying the published palette to :root. Empty for
  // Neutral (globals.css already carries those values); mounted only by this
  // page, so client-side navigation away removes it — dashboards and other
  // routes never see the overrides. No flash: the CSS ships in the first
  // HTML payload, and server/client render the identical tag.
  const paletteCss = buildHomepagePaletteCss(palette);

  return (
    <Suspense>
      {paletteCss ? (
        <style id="fm-home-palette" dangerouslySetInnerHTML={{ __html: paletteCss }} />
      ) : null}
      {/* data-fm-home scopes homepage-only styling */}
      <main className="min-h-screen" data-fm-home="">
        {/* product card design comes from the root layout's ProductCardConfigProvider */}
        <LayoutProvider
          layoutType={layoutType}
          categories={categories}
          config={homepageConfig}
        />
      </main>
    </Suspense>
  );
}