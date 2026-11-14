// app/admin-dashboard/@main/locations/page.tsx
"use client";

import React, { useState } from "react";
import { Building, ListTree, MapPin, MapPinHouse, Navigation, Plus, TreePine, Upload } from "lucide-react";
import { Button, PageHeader, PageTabs, PayoutShell } from "@/components/payouts/ui";
import LocationStats from "@/components/locations/location-stats";
import LocationList from "@/components/locations/LocationList";
import LocationTreeView from "@/components/locations/LocationTreeView";
import LocationForm from "@/components/locations/LocationForm";
import BulkUpload from "@/components/locations/BulkUpload";

export default function LocationsPage() {
  const [activeTab, setActiveTab] = useState("list");
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingLocation, setEditingLocation] = useState<string | null>(null);

  const handleCreateClick = () => {
    setEditingLocation(null);
    setShowForm(true);
  };

  const handleEditLocation = (id: string) => {
    setEditingLocation(id);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingLocation(null);
  };

  return (
    <PayoutShell>
      <PageHeader
        icon={<MapPinHouse />}
        title="Location Management"
        subtitle="Manage divisions, districts, and thanas with hierarchical structure, COD coverage, and courier sync codes."
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowBulkUpload(true)}>
              <Upload className="h-3.5 w-3.5" /> Bulk Upload
            </Button>
            <Button onClick={handleCreateClick}>
              <Plus className="h-3.5 w-3.5" /> Add Location
            </Button>
          </>
        }
      />

      <LocationStats />

      <div className="mt-4">
        <PageTabs
          active={activeTab}
          onChange={setActiveTab}
          items={[
            { key: "list", label: "List View", icon: <ListTree /> },
            { key: "tree", label: "Tree View", icon: <TreePine /> },
            { key: "divisions", label: "Divisions", icon: <Building /> },
            { key: "districts", label: "Districts", icon: <MapPin /> },
            { key: "thanas", label: "Thanas", icon: <Navigation /> },
          ]}
        />

        {activeTab === "list" && <LocationList onEdit={handleEditLocation} />}
        {activeTab === "tree" && <LocationTreeView />}
        {activeTab === "divisions" && <LocationList level="DIVISION" onEdit={handleEditLocation} />}
        {activeTab === "districts" && <LocationList level="DISTRICT" onEdit={handleEditLocation} />}
        {activeTab === "thanas" && <LocationList level="THANA" onEdit={handleEditLocation} />}
      </div>

      <LocationForm open={showForm} onClose={handleFormClose} locationId={editingLocation} />
      <BulkUpload open={showBulkUpload} onClose={() => setShowBulkUpload(false)} />
    </PayoutShell>
  );
}