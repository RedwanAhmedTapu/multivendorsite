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
  
  const [generateTemplate, { isLoading, error }] = useGenerateTemplateMutation();

  const handleCategorySelect = (
    id: string,
    path: string,
    isLeaf: boolean,
    attributes: any[],
    specifications: any[]
  ) => {
    setCategoryId(id);
    setIsLeafCategory(isLeaf);
    setSelectedPath(path);
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
      // Fetch the file as a blob
      const response = await fetch(`http://localhost:5000/api/bulkproduct-templates/download/${categoryId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to download template' }));
        throw new Error(errorData.message || 'Failed to download template');
      }
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : 'template.xlsx';
      
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

  return (
    <Card className='w-full mx-auto shadow-none border-none md:p-6'>
      <CardHeader>
        <CardTitle>Generate Bulk Product Template</CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <CategoryTreeSelector
          onSelect={(id, path, isLeaf, attributes, specifications) =>
            handleCategorySelect(id, path, isLeaf, attributes, specifications)
          }
        />
        {categoryId && (
          <div className='flex items-center gap-4'>
            <Button
              onClick={handleGenerate}
              disabled={!categoryId || !isLeafCategory || isLoading}
              className='flex-1'
            >
              {isLoading ? 'Generating...' : 'Generate Template'}
            </Button>
            <Button
              onClick={handleDownload}
              disabled={!categoryId || !isLeafCategory || isDownloading}
              className='flex-1 bg-green-500 hover:bg-green-600'
            >
              {isDownloading ? 'Downloading...' : 'Download Template'}
            </Button>
          </div>
        )}
        {error && (
          <div className='text-red-500 text-sm'>
            Error: {(error as any).data?.message || 'Failed to generate template'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BulkProductTemplate;