// components/locations/LocationManagement.tsx
import React, { useState } from 'react';
import { Box, Container, Tabs, Tab, Paper, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

import LocationList from './LocationList';
import LocationForm from './LocationForm';
import BulkUpload from './BulkUpload';
import LocationTreeView from './LocationTreeView';
import LocationStats from './LocationStats';

const LocationManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingLocation, setEditingLocation] = useState<string | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

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

  const handleBulkUploadClose = () => {
    setShowBulkUpload(false);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Location Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<CloudUploadIcon />}
              onClick={() => setShowBulkUpload(true)}
            >
              Bulk Upload
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateClick}
            >
              Add Location
            </Button>
          </Box>
        </Box>

        <Paper sx={{ mb: 3 }}>
          <LocationStats />
        </Paper>

        <Paper>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="List View" />
            <Tab label="Tree View" />
            <Tab label="Divisions" />
            <Tab label="Districts" />
            <Tab label="Thanas" />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {activeTab === 0 && (
              <LocationList onEdit={handleEditLocation} />
            )}
            {activeTab === 1 && (
              <LocationTreeView />
            )}
            {activeTab === 2 && (
              <LocationList level="DIVISION" onEdit={handleEditLocation} />
            )}
            {activeTab === 3 && (
              <LocationList level="DISTRICT" onEdit={handleEditLocation} />
            )}
            {activeTab === 4 && (
              <LocationList level="THANA" onEdit={handleEditLocation} />
            )}
          </Box>
        </Paper>

        {showForm && (
          <LocationForm
            open={showForm}
            onClose={handleFormClose}
            locationId={editingLocation}
          />
        )}

        {showBulkUpload && (
          <BulkUpload
            open={showBulkUpload}
            onClose={handleBulkUploadClose}
          />
        )}
      </Box>
    </Container>
  );
};

export default LocationManagement;