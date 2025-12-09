"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import CategoryTreeSelector from '../categorytreeselector/CategoryTreeSelector';
import { useGenerateTemplateMutation } from '@/features/productApi';

const BulkProductTemplate: React.FC = () => {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [isLeafCategory, setIsLeafCategory] = useState<boolean>(false);
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [categoryAttributes, setCategoryAttributes] = useState<any[]>([]);
  
  const [generateTemplate, { isLoading, error }] = useGenerateTemplateMutation();

  const handleCategorySelect = (
    id: string,
    path: string,
    isLeaf: boolean,
    attributes: any[]
  ) => {
    setCategoryId(id);
    setIsLeafCategory(isLeaf);
    setSelectedPath(path);
    setCategoryAttributes(attributes || []);
  };

  const handleGenerate = async () => {
    if (!categoryId || !isLeafCategory) {
      alert('⚠️ Please select a leaf category');
      return;
    }
    
    try {
      await generateTemplate(categoryId).unwrap();
      alert('✅ Template generated successfully');
    } catch (err) {
      console.error('Error generating template:', err);
      alert('❌ Failed to generate template. Please try again.');
    }
  };

  const handleDownload = async () => {
    if (!categoryId || !isLeafCategory) {
      alert('⚠️ Please select a leaf category');
      return;
    }
    
    setIsDownloading(true);
    
    try {
      // Note: You might need to adjust the URL based on your API setup
      // If using the API slice, you could also use the downloadTemplate query hook
      const response = await fetch(`http://localhost:5000/api/bulkproduct-templates/download/${categoryId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to download template' }));
        throw new Error(errorData.message || 'Failed to download template');
      }
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `template_${categoryId}.xlsx`;
      
      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      alert('✅ Template downloaded successfully');
      
    } catch (err: any) {
      console.error('Error downloading template:', err);
      alert(`❌ ${err.message || 'Failed to download template. Please try again.'}`);
    } finally {
      setIsDownloading(false);
    }
  };

  // Calculate attribute statistics
  const requiredAttributesCount = categoryAttributes.filter(attr => attr.isRequired).length;
  const optionalAttributesCount = categoryAttributes.length - requiredAttributesCount;

  return (
    <Card className='w-full mx-auto shadow-none border-none md:p-6'>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Generate Bulk Product Template</CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Create an Excel template for bulk product upload based on category attributes
        </p>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Category Selection */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Step 1: Select Category</h3>
          <CategoryTreeSelector onSelect={handleCategorySelect} />
        </div>
        
        {/* Selected Category Info */}
        {categoryId && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-blue-800">Selected Category</h4>
                <p className="text-sm text-blue-700">{selectedPath}</p>
              </div>
              <div className="flex items-center gap-2">
                {isLeafCategory ? (
                  <span className='text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium'>
                    ✓ Leaf Category
                  </span>
                ) : (
                  <span className='text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-medium'>
                    ⚠ Has Subcategories
                  </span>
                )}
              </div>
            </div>
            
            {/* Attribute Summary */}
            {isLeafCategory && categoryAttributes.length > 0 && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <h5 className="text-sm font-medium text-blue-800 mb-2">Attributes Summary</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded border">
                    <p className="text-xs text-gray-500">Total Attributes</p>
                    <p className="text-lg font-bold">{categoryAttributes.length}</p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-xs text-gray-500">Required</p>
                    <p className="text-lg font-bold text-red-600">{requiredAttributesCount}</p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-xs text-gray-500">Optional</p>
                    <p className="text-lg font-bold text-blue-600">{optionalAttributesCount}</p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-xs text-gray-500">Types</p>
                    <p className="text-sm font-medium">
                      {Array.from(new Set(categoryAttributes.map(a => a.type))).join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Action Buttons */}
        {categoryId && isLeafCategory && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 2: Generate & Download Template</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="w-full h-12"
                  variant={isLoading ? "secondary" : "default"}
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Generating Template...
                    </>
                  ) : (
                    'Step 1: Generate Template'
                  )}
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  Generate the Excel template structure
                </p>
              </div>
              
              <div className="space-y-2">
                <Button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="w-full h-12 bg-green-600 hover:bg-green-700"
                  variant={isDownloading ? "secondary" : "default"}
                >
                  {isDownloading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Downloading...
                    </>
                  ) : (
                    'Step 2: Download Template'
                  )}
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  Download the generated Excel file
                </p>
              </div>
            </div>
            
            {/* Combined Button (Alternative) */}
            <div className="pt-4 border-t">
              <Button
                onClick={async () => {
                  await handleGenerate();
                  await handleDownload();
                }}
                disabled={isLoading || isDownloading}
                className="w-full h-12 bg-purple-600 hover:bg-purple-700"
              >
                {isLoading || isDownloading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Processing...
                  </>
                ) : (
                  'Generate & Download Template'
                )}
              </Button>
              <p className="text-xs text-gray-500 text-center mt-1">
                One-click generate and download
              </p>
            </div>
          </div>
        )}
        
        {/* Warning for non-leaf categories */}
        {categoryId && !isLeafCategory && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-yellow-600 text-xl mt-0.5">⚠️</span>
              <div>
                <h4 className="font-medium text-yellow-800">Non-Leaf Category Selected</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  You have selected "{selectedPath}" which is not a leaf category. 
                  Please select a leaf category (one without subcategories) to generate a template.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Instructions */}
        {!categoryId && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">How to Generate Bulk Template</h4>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal pl-5">
              <li>Select a leaf category from the tree above</li>
              <li>The template will include columns for all category attributes</li>
              <li>Click "Generate Template" to create the Excel structure</li>
              <li>Click "Download Template" to get the Excel file</li>
              <li>Fill in the template with your product data</li>
              <li>Use the bulk upload feature to import the filled template</li>
            </ol>
          </div>
        )}
        
        {/* Error Display */}
        {error && (
          <div className='p-4 bg-red-50 border border-red-200 rounded-lg'>
            <h4 className="font-medium text-red-800 mb-1">Error Generating Template</h4>
            <p className='text-sm text-red-700'>
              {(error as any).data?.message || 'Failed to generate template. Please try again.'}
            </p>
            <p className="text-xs text-red-600 mt-2">
              Tip: Make sure you have selected a valid leaf category with attributes defined.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BulkProductTemplate;