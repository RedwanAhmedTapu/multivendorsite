import BulkImportUploader from "../../../../components/admindashboadrcomponents/BulkImportUploader";

export default function BulkImportPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Bulk Import</h1>
      <BulkImportUploader />
    </div>
  );
}
