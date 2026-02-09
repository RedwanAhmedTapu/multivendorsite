import { Product, ProductVariant } from "../types/product";

// Helper function to flatten product data for export
export const flattenProductsForExport = (products: Product[]) => {
  const rows: any[] = [];

  products.forEach((product) => {
    // If product has variants, create a row for each variant
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach((variant: ProductVariant) => {
        const discount =
          variant.specialPrice && variant.price
            ? Math.round(((variant.price - variant.specialPrice) / variant.price) * 100)
            : 0;

        rows.push({
          "Product ID": product.id,
          "Product Name": product.name,
          "Category": product.category?.name || "N/A",
          "Status": product.approvalStatus,
          "Variant SKU": variant.sku,
          "Variant Name": variant.attributes
            .map((a) => `${a.attributeValue.attribute.name}: ${a.attributeValue.value}`)
            .join(", ") || "Default",
          "Regular Price (৳)": variant.price,
          "Special Price (৳)": variant.specialPrice || "",
          "Discount (%)": discount || "",
          "Stock": variant.stock,
          "Availability": variant.availability ? "Yes" : "No",
          "Created At": new Date(product.createdAt).toLocaleDateString("en-GB"),
          "Updated At": new Date(product.updatedAt).toLocaleDateString("en-GB"),
        });
      });
    } else {
      // Product without variants
      rows.push({
        "Product ID": product.id,
        "Product Name": product.name,
        "Category": product.category?.name || "N/A",
        "Status": product.approvalStatus,
        "Variant SKU": "N/A",
        "Variant Name": "Default",
        "Regular Price (৳)": "",
        "Special Price (৳)": "",
        "Discount (%)": "",
        "Stock": "",
        "Is Active": "N/A",
        "Created At": new Date(product.createdAt).toLocaleDateString("en-GB"),
        "Updated At": new Date(product.updatedAt).toLocaleDateString("en-GB"),
      });
    }
  });

  return rows;
};

// Export to Excel using SheetJS
export const exportToExcel = async (products: Product[]) => {
  const rows = flattenProductsForExport(products);
  
  // Dynamically import XLSX library
  const XLSX = await import('xlsx');

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Create Products sheet
  const ws = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  const colWidths = [
    { wch: 30 }, // Product ID
    { wch: 40 }, // Product Name
    { wch: 20 }, // Category
    { wch: 20 }, // Brand
    { wch: 12 }, // Status
    { wch: 25 }, // Variant SKU
    { wch: 30 }, // Variant Name
    { wch: 15 }, // Regular Price
    { wch: 15 }, // Special Price
    { wch: 12 }, // Discount
    { wch: 10 }, // Stock
    { wch: 10 }, // Is Active
    { wch: 12 }, // Created At
    { wch: 12 }, // Updated At
  ];
  ws['!cols'] = colWidths;

  // Add the Products sheet
  XLSX.utils.book_append_sheet(wb, ws, "Products");

  // Create Summary sheet
  const summaryData = [
    ["Product Export Summary"],
    [""],
    ["Total Products", new Set(rows.map(r => r["Product ID"])).size],
    ["Total Variants", rows.length],
    ["Export Date", new Date().toLocaleDateString("en-GB")],
    [""],
    ["Status Breakdown"],
  ];

  // Count status
  const statusCounts: { [key: string]: number } = {};
  rows.forEach(row => {
    const status = row.Status || "Unknown";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  Object.entries(statusCounts).forEach(([status, count]) => {
    summaryData.push([`  ${status}`, count]);
  });

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  summaryWs['!cols'] = [{ wch: 25 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

  // Generate Excel file and download
  XLSX.writeFile(wb, `products_export_${new Date().getTime()}.xlsx`);
};

// Export to CSV
export const exportToCSV = (products: Product[]) => {
  const rows = flattenProductsForExport(products);

  // Convert to CSV format
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = row[header]?.toString() || "";
          // Escape quotes and wrap in quotes if contains comma
          return value.includes(",") || value.includes('"')
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        })
        .join(",")
    ),
  ].join("\n");

  // Create blob and download
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `products_export_${new Date().getTime()}.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};