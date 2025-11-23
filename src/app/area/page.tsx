// app/area/page.tsx

import { LocationManager } from "@/components/LocationManager";

export default function AreaPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Delivery Areas</h1>
      <LocationManager provider="PATHAO" />
    </div>
  );
}