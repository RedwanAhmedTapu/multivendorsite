// src/components/privateroute/PrivateRoute.tsx
"use client";

import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect, useState, ReactNode } from "react";
import { RootState } from "@/store/store";

interface PrivateRouteProps {
  allowedRoles?: string[];
  children: ReactNode;
}

export default function PrivateRoute({ allowedRoles, children }: PrivateRouteProps) {
  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken || !user) {
      router.push("/login");
    } else if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.push("/unauthorized");
    } else {
      setLoading(false);
    }
  }, [user, accessToken, allowedRoles, router]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return <>{children}</>;
}
