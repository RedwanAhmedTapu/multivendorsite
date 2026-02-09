// components/locations/location-tree-view.tsx
"use client";

import React, { useState } from "react";
import { Search, ChevronRight, ChevronDown, Building, MapPin, Navigation, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetAllLocationsQuery } from "@/features/locationApi";

interface TreeNodeProps {
  node: any;
  level: number;
  searchTerm: string;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, level, searchTerm }) => {
  const [isExpanded, setIsExpanded] = useState(level === 0);

  const matchesSearch = searchTerm === "" || 
    node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.name_local?.toLowerCase().includes(searchTerm.toLowerCase());

  if (!matchesSearch && (!node.children || node.children.length === 0)) {
    return null;
  }

  const hasChildren = node.children && node.children.length > 0;
  const Icon = node.level === "DIVISION" 
    ? Building 
    : node.level === "DISTRICT" 
    ? MapPin 
    : Navigation;

  return (
    <div className="ml-4">
      <div
        className="flex items-center gap-2 py-2 px-3 rounded hover:bg-gray-100 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          )
        ) : (
          <div className="w-4" />
        )}
        <Icon className="h-4 w-4 text-gray-500" />
        <span className="font-medium">{node.name}</span>
        {node.name_local && (
          <span className="text-sm text-gray-500">({node.name_local})</span>
        )}
        {node.is_cod_supported && (
          <CheckCircle className="h-4 w-4 text-green-600 ml-2" />
        )}
        {node.external_code && (
          <code className="ml-2 px-2 py-1 text-xs bg-gray-100 rounded">
            {node.external_code}
          </code>
        )}
      </div>
      {isExpanded && hasChildren && (
        <div className="border-l ml-2">
          {node.children.map((child: any) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function LocationTreeView() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data, isLoading, error } = useGetAllLocationsQuery();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">Failed to load location tree</p>
      </div>
    );
  }

  const locations = data?.data || [];

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input
          placeholder="Search in tree..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="border rounded-lg p-4 max-h-[500px] overflow-y-auto">
        {locations.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No locations found</p>
        ) : (
          locations.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              level={0}
              searchTerm={searchTerm}
            />
          ))
        )}
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4" />
          <span>Division</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span>District</span>
        </div>
        <div className="flex items-center gap-2">
          <Navigation className="h-4 w-4" />
          <span>Thana</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span>COD Supported</span>
        </div>
      </div>
    </div>
  );
}