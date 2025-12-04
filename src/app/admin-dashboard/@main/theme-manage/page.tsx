"use client";   

import React, { useState } from 'react';
import {
  useGetAllThemesQuery,
  useGetActiveThemeQuery,
  useActivateThemeMutation,
  useToggleThemeStatusMutation,
  useGetLayoutOptionsQuery,
  useInitializeThemesMutation,
  LayoutType,
  Theme,
} from '../../../../features/themeApi';
import { 
  Monitor, 
  Layout, 
  Grid, 
  Check, 
  Power, 
  Settings, 
  RefreshCw,
  AlertCircle,
  Loader2,
  Info
} from 'lucide-react';

const ThemeManager = () => {
  const [selectedLayout, setSelectedLayout] = useState<LayoutType | null>(null);
  
  // API Hooks
  const { data: themesData, isLoading: themesLoading, error: themesError } = useGetAllThemesQuery();
  const { data: activeThemeData } = useGetActiveThemeQuery();
  const { data: layoutOptionsData } = useGetLayoutOptionsQuery();
  const [activateTheme, { isLoading: isActivating }] = useActivateThemeMutation();
  const [toggleThemeStatus, { isLoading: isToggling }] = useToggleThemeStatusMutation();
  const [initializeThemes, { isLoading: isInitializing }] = useInitializeThemesMutation();

  const themes = themesData?.data || [];
  const activeTheme = activeThemeData?.data;
  const layoutOptions = layoutOptionsData?.data || [];

  // Get icon for layout type
  const getLayoutIcon = (layoutType: LayoutType) => {
    switch (layoutType) {
      case 'layout_1':
        return <Layout className="w-6 h-6" />;
      case 'layout_2':
        return <Monitor className="w-6 h-6" />;
      case 'layout_3':
        return <Grid className="w-6 h-6" />;
      default:
        return <Layout className="w-6 h-6" />;
    }
  };

  // Handle theme activation
  const handleActivate = async (layoutType: LayoutType) => {
    try {
      await activateTheme(layoutType).unwrap();
      setSelectedLayout(null);
    } catch (error) {
      console.error('Failed to activate theme:', error);
    }
  };

  // Handle theme toggle
  const handleToggle = async (layoutType: LayoutType) => {
    try {
      await toggleThemeStatus(layoutType).unwrap();
    } catch (error) {
      console.error('Failed to toggle theme:', error);
    }
  };

  // Handle initialize themes
  const handleInitialize = async () => {
    try {
      await initializeThemes().unwrap();
    } catch (error) {
      console.error('Failed to initialize themes:', error);
    }
  };

  // Loading state
  if (themesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 text-lg">Loading themes...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (themesError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Error Loading Themes</h2>
          <p className="text-slate-600 mb-6">Failed to load theme data. Please try again.</p>
          <button
            onClick={handleInitialize}
            disabled={isInitializing}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
          >
            {isInitializing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Initialize Themes
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-2">
                Theme Manager
              </h1>
              <p className="text-slate-600">
                Manage and customize your store layout themes
              </p>
            </div>
            <button
              onClick={handleInitialize}
              disabled={isInitializing}
              className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-slate-200"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Initializing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Initialize Themes
                </>
              )}
            </button>
          </div>

          {/* Active Theme Banner */}
          {activeTheme && (
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 sm:p-6 shadow-lg text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white/20 p-2 rounded-lg">
                  {getLayoutIcon(activeTheme.layoutType)}
                </div>
                <div>
                  <p className="text-blue-100 text-sm font-medium">Currently Active</p>
                  <h2 className="text-xl sm:text-2xl font-bold">{activeTheme.name}</h2>
                </div>
              </div>
              {activeTheme.description && (
                <p className="text-blue-100 text-sm mt-2">{activeTheme.description}</p>
              )}
            </div>
          )}
        </div>

        {/* Themes Grid */}
        {themes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <Info className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No Themes Available</h3>
            <p className="text-slate-600 mb-6">Initialize themes to get started</p>
            <button
              onClick={handleInitialize}
              disabled={isInitializing}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Initializing...
                </>
              ) : (
                <>
                  <Settings className="w-5 h-5" />
                  Initialize Themes
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {themes.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                isActive={activeTheme?.id === theme.id}
                isActivating={isActivating && selectedLayout === theme.layoutType}
                isToggling={isToggling}
                onActivate={() => {
                  setSelectedLayout(theme.layoutType);
                  handleActivate(theme.layoutType);
                }}
                onToggle={() => handleToggle(theme.layoutType)}
                getLayoutIcon={getLayoutIcon}
              />
            ))}
          </div>
        )}

        {/* Layout Options Info */}
        {layoutOptions.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              Available Layout Options
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {layoutOptions.map((option) => (
                <div
                  key={option.value}
                  className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-blue-600">
                      {getLayoutIcon(option.value)}
                    </div>
                    <h4 className="font-medium text-slate-800">{option.label}</h4>
                  </div>
                  {option.description && (
                    <p className="text-sm text-slate-600">{option.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Theme Card Component
interface ThemeCardProps {
  theme: Theme;
  isActive: boolean;
  isActivating: boolean;
  isToggling: boolean;
  onActivate: () => void;
  onToggle: () => void;
  getLayoutIcon: (layoutType: LayoutType) => React.ReactNode;
}

const ThemeCard: React.FC<ThemeCardProps> = ({
  theme,
  isActive,
  isActivating,
  isToggling,
  onActivate,
  onToggle,
  getLayoutIcon,
}) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl ${
        isActive ? 'ring-2 ring-blue-500 ring-offset-2' : ''
      }`}
    >
      {/* Card Header */}
      <div className={`p-6 ${isActive ? 'bg-gradient-to-r from-blue-50 to-blue-100' : 'bg-slate-50'}`}>
        <div className="flex items-start justify-between mb-3">
          <div className={`p-3 rounded-lg ${isActive ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'} shadow-md`}>
            {getLayoutIcon(theme.layoutType)}
          </div>
          <div className="flex flex-col gap-2">
            {isActive && (
              <span className="inline-flex items-center gap-1 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                <Check className="w-3 h-3" />
                Active
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full ${
                theme.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${
                theme.status === 'active' ? 'bg-green-500' : 'bg-slate-400'
              }`} />
              {theme.status}
            </span>
          </div>
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-1">{theme.name}</h3>
        <p className="text-sm text-slate-500 font-mono">{theme.layoutType}</p>
      </div>

      {/* Card Body */}
      <div className="p-6">
        {theme.description && (
          <p className="text-slate-600 text-sm mb-4 leading-relaxed">{theme.description}</p>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-slate-500 font-medium mb-1">Created</p>
            <p className="text-slate-700 font-semibold">
              {new Date(theme.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-slate-500 font-medium mb-1">Updated</p>
            <p className="text-slate-700 font-semibold">
              {new Date(theme.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onActivate}
            disabled={isActive || isActivating}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              isActive
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isActivating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Activating...
              </>
            ) : isActive ? (
              <>
                <Check className="w-4 h-4" />
                Active
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Activate
              </>
            )}
          </button>
          <button
            onClick={onToggle}
            disabled={isToggling}
            className="px-4 py-2.5 rounded-lg font-medium transition-all border-2 border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            title={theme.status === 'active' ? 'Deactivate' : 'Activate'}
          >
            {isToggling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Power className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeManager;