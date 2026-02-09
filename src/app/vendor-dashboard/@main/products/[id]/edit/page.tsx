// app/vendor-dashboard/products/[id]/edit/page.tsx
"use client";
import { RightSidebarProvider } from "@/app/vendor-dashboard/rightbar/RightSidebar";
import UpdateProductForm from "@/components/product/vendor/updateproductform/UpdateproductForm";

export default function EditProductPage() {
  return (
    <RightSidebarProvider>
      <UpdateProductForm />
    </RightSidebarProvider>
  );
}