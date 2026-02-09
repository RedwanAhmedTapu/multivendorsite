// app/locations/page.tsx
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Upload, TreePine, ListTree, Building, MapPin, Navigation } from "lucide-react";
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
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Location Management</h1>
          <p className="text-muted-foreground">
            Manage divisions, districts, and thanas with hierarchical structure
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowBulkUpload(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Bulk Upload
          </Button>
          <Button onClick={handleCreateClick}>
            <Plus className="mr-2 h-4 w-4" />
            Add Location
          </Button>
        </div>
      </div>

      <LocationStats />

      <Card>
        <CardHeader>
          <CardTitle>Location Overview</CardTitle>
          <CardDescription>
            View and manage locations in different formats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="list" className="flex items-center gap-2">
                <ListTree className="h-4 w-4" />
                <span className="hidden sm:inline">List View</span>
              </TabsTrigger>
              <TabsTrigger value="tree" className="flex items-center gap-2">
                <TreePine className="h-4 w-4" />
                <span className="hidden sm:inline">Tree View</span>
              </TabsTrigger>
              <TabsTrigger value="divisions" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span className="hidden sm:inline">Divisions</span>
              </TabsTrigger>
              <TabsTrigger value="districts" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">Districts</span>
              </TabsTrigger>
              <TabsTrigger value="thanas" className="flex items-center gap-2">
                <Navigation className="h-4 w-4" />
                <span className="hidden sm:inline">Thanas</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              <LocationList onEdit={handleEditLocation} />
            </TabsContent>

            <TabsContent value="tree" className="space-y-4">
              <LocationTreeView />
            </TabsContent>

            <TabsContent value="divisions" className="space-y-4">
              <LocationList level="DIVISION" onEdit={handleEditLocation} />
            </TabsContent>

            <TabsContent value="districts" className="space-y-4">
              <LocationList level="DISTRICT" onEdit={handleEditLocation} />
            </TabsContent>

            <TabsContent value="thanas" className="space-y-4">
              <LocationList level="THANA" onEdit={handleEditLocation} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <LocationForm
        open={showForm}
        onClose={handleFormClose}
        locationId={editingLocation}
      />

      <BulkUpload
        open={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
      />
    </div>
  );
}