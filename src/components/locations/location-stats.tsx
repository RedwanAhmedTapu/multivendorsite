// components/locations/location-stats.tsx - With deferred loading
"use client";

import React, { useState, useEffect } from "react";
import { Building, MapPin, Navigation, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetAllLocationsQuery } from "@/features/locationApi";

export default function LocationStats() {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only run the query on the client side
  const { data: locationsData, isLoading } = useGetAllLocationsQuery(undefined, {
    skip: !isClient, // Skip on server side
  });

  // Calculate stats
  const stats = React.useMemo(() => {
    if (!locationsData?.data) {
      return {
        divisions: 0,
        districts: 0,
        thanas: 0,
        total: 0,
        codDivisions: 0,
        dgCodDivisions: 0,
        codDistricts: 0,
        dgCodDistricts: 0,
        codThanas: 0,
        dgCodThanas: 0,
      };
    }

    let divisions = 0;
    let districts = 0;
    let thanas = 0;
    let codDivisions = 0;
    let dgCodDivisions = 0;
    let codDistricts = 0;
    let dgCodDistricts = 0;
    let codThanas = 0;
    let dgCodThanas = 0;

    const processLocationTree = (nodes: any[]) => {
      nodes.forEach(node => {
        if (node.level === 'DIVISION') {
          divisions++;
          if (node.is_cod_supported) codDivisions++;
          if (node.is_dg_cod_supported) dgCodDivisions++;
        } else if (node.level === 'DISTRICT') {
          districts++;
          if (node.is_cod_supported) codDistricts++;
          if (node.is_dg_cod_supported) dgCodDistricts++;
        } else if (node.level === 'THANA') {
          thanas++;
          if (node.is_cod_supported) codThanas++;
          if (node.is_dg_cod_supported) dgCodThanas++;
        }
        
        if (node.children && node.children.length > 0) {
          processLocationTree(node.children);
        }
      });
    };

    processLocationTree(locationsData.data);

    return {
      divisions,
      districts,
      thanas,
      total: divisions + districts + thanas,
      codDivisions,
      dgCodDivisions,
      codDistricts,
      dgCodDistricts,
      codThanas,
      dgCodThanas,
    };
  }, [locationsData]);

  const statCards = [
    {
      title: "Divisions",
      value: stats.divisions,
      icon: Building,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      codCount: stats.codDivisions,
      dgCodCount: stats.dgCodDivisions,
    },
    {
      title: "Districts",
      value: stats.districts,
      icon: MapPin,
      color: "text-green-600",
      bgColor: "bg-green-50",
      codCount: stats.codDistricts,
      dgCodCount: stats.dgCodDistricts,
    },
    {
      title: "Thanas",
      value: stats.thanas,
      icon: Navigation,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      codCount: stats.codThanas,
      dgCodCount: stats.dgCodThanas,
    },
    {
      title: "Total Locations",
      value: stats.total,
      icon: CheckCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      codCount: stats.codDivisions + stats.codDistricts + stats.codThanas,
      dgCodCount: stats.dgCodDivisions + stats.dgCodDistricts + stats.dgCodThanas,
    },
  ];

  if (isLoading || !isClient) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.title} className={`${stat.bgColor}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="flex items-center gap-4 mt-2 text-xs">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span className="text-gray-600">COD: {stat.codCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-blue-600" />
                <span className="text-gray-600">DG COD: {stat.dgCodCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}