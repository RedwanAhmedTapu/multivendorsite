"use client";
import React, { useState, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { toast } from "sonner";
import { format } from "date-fns";

import { 
  Card, CardHeader, CardTitle, CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { 
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  FolderPlus, Upload, Move, Trash2, CheckSquare, Square, Grid3x3, List, 
  FolderOpen, X, Copy, Edit, Download, MoreVertical, Image, FolderUp 
} from "lucide-react";

import {
  useGetFoldersQuery,
  useCreateFolderMutation,
  useRenameFolderMutation,
  useDeleteFolderMutation,
  useMoveFilesToFolderMutation,
  useGetVendorFilesQuery,
  useUploadMultipleFilesMutation,
  useDeleteFileMutation,
} from "@/features/vendorManageApi";

type ViewMode = "grid" | "list";
type FileType = "IMAGE" | "VIDEO" | "DOCUMENT";

interface FileItem {
  id: string;
  fileName: string;
  fileKey: string;
  fileSize: string;
  mimeType: string;
  fileType: FileType;
  r2Url: string;
  folder?: string;
  createdAt: string;
}

interface FolderItem {
  id: string;
  name: string;
  path: string;
  fileCount?: number;
}

// Simple data URL for a transparent placeholder
const PLACEHOLDER_IMAGE = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCA0MEg2MFY2MEg0MFY0MFoiIGZpbGw9IiNEOEQ5REIiLz4KPC9zdmc+";

// Stable folder extraction function
const extractFoldersFromResponse = (foldersData: any): FolderItem[] => {
  if (!foldersData) return [];

  if (Array.isArray(foldersData)) {
    return foldersData.map(item => ({
      id: item.id || item._id || Math.random().toString(),
      name: item.name || item.folderName || 'Unnamed Folder',
      path: item.path || item.id || item._id || item.name,
      fileCount: item.fileCount || item.count || 0
    }));
  }

  let foldersArray: any[] = [];

  if (foldersData.folders && Array.isArray(foldersData.folders)) {
    foldersArray = foldersData.folders;
  } else if (foldersData.data && Array.isArray(foldersData.data)) {
    foldersArray = foldersData.data;
  } else if (foldersData.data?.folders && Array.isArray(foldersData.data.folders)) {
    foldersArray = foldersData.data.folders;
  } else if (foldersData.items && Array.isArray(foldersData.items)) {
    foldersArray = foldersData.items;
  } else if (foldersData.results && Array.isArray(foldersData.results)) {
    foldersArray = foldersData.results;
  } else {
    for (const key in foldersData) {
      if (Array.isArray(foldersData[key])) {
        foldersArray = foldersData[key];
        break;
      }
    }
  }

  return foldersArray.map(item => {
    if (!item) return null;
    
    return {
      id: item.id || item._id || item.folderId || Math.random().toString(),
      name: item.name || item.folderName || item.title || 'Unnamed Folder',
      path: item.path || item.folderPath || item.id || item._id || item.name,
      fileCount: item.fileCount || item.count || item.totalFiles || 0
    };
  }).filter(Boolean) as FolderItem[];
};

// Custom image component to prevent infinite re-renders
const StableImage = React.memo(({ src, alt, className, onError }: { 
  src: string; 
  alt: string; 
  className?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(PLACEHOLDER_IMAGE);
      onError?.(e);
    }
  }, [hasError, onError]);

  // Reset when src changes
  React.useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
    />
  );
});

StableImage.displayName = 'StableImage';

export default function VendorFileManager() {
  const { user } = useSelector((state: RootState) => state.auth);
  const vendorId = user?.vendorId;

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [currentFolder, setCurrentFolder] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const [createFolderDialog, setCreateFolderDialog] = useState(false);
  const [renameFolderDialog, setRenameFolderDialog] = useState(false);
  const [moveDialog, setMoveDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameFolderName, setRenameFolderName] = useState("");
  const [selectedFolderToRename, setSelectedFolderToRename] = useState<string | null>(null);
  const [targetFolder, setTargetFolder] = useState("");

  // API Hooks
  const { 
    data: foldersData, 
    refetch: refetchFolders,
    isLoading: foldersLoading,
    error: foldersError 
  } = useGetFoldersQuery(undefined, { 
    skip: !vendorId,
    refetchOnMountOrArgChange: true 
  });
  
  const [createFolder] = useCreateFolderMutation();
  const [renameFolder] = useRenameFolderMutation();
  const [deleteFolder] = useDeleteFolderMutation();
  
  // Enhanced move files mutation with better error handling
  const [moveFilesToFolder, { isLoading: isMovingFiles }] = useMoveFilesToFolderMutation();
  
  const { 
    data: filesData, 
    refetch: refetchFiles, 
    isLoading: filesLoading 
  } = useGetVendorFilesQuery({ 
    vendorId: vendorId || "", 
    fileType: "IMAGE", 
    page: 1, 
    limit: 100 
  }, { skip: !vendorId });
  
  const [deleteFile] = useDeleteFileMutation();
  
  // Enhanced upload mutation with loading state
  const [uploadFiles, { isLoading: isUploading }] = useUploadMultipleFilesMutation();

  // Stable folder data extraction
  const folders = useMemo(() => {
    console.log("Raw folders data:", foldersData);
    const extracted = extractFoldersFromResponse(foldersData);
    console.log("Extracted folders:", extracted);
    return extracted;
  }, [foldersData]);

  // Stable files data
  const files = useMemo(() => {
    if (!filesData?.files || !Array.isArray(filesData.files)) return [];
    
    return filesData.files.map((f: any) => ({
      ...f,
      fileSize: typeof f.fileSize === "number" ? f.fileSize.toString() : f.fileSize,
    }));
  }, [filesData?.files]);

  // SIMPLIFIED folder filtering logic - Show ALL folders in root
  const currentDirectoryFolders = useMemo(() => {
    console.log("=== FOLDER FILTERING ===");
    console.log("Total folders:", folders.length);
    console.log("Current folder:", currentFolder);
    console.log("All folders:", folders);

    if (!folders.length) {
      console.log("No folders available");
      return [];
    }

    // If we're in root (currentFolder is empty), show ALL folders
    if (!currentFolder) {
      console.log("In root - showing all folders");
      return folders;
    }

    // If we're in a specific folder, show direct subfolders
    // This looks for folders whose path starts with currentFolder + '/'
    const subfolders = folders.filter(folder => {
      const isSubfolder = folder.path.startsWith(currentFolder + '/');
      console.log(`Folder: ${folder.name}, path: ${folder.path}, isSubfolder: ${isSubfolder}`);
      return isSubfolder;
    });

    console.log("Subfolders found:", subfolders);
    return subfolders;
  }, [folders, currentFolder]);

  // Fixed: Enhanced filtered files with proper folder filtering
  const filteredFiles = useMemo(() => {
    const filtered = files.filter(f => {
      const matchesSearch = f.fileName.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Enhanced folder filtering logic
      let matchesFolder = false;
      
      if (!currentFolder) {
        // In root - show files that don't have a folder or have empty folder
        matchesFolder = !f.folder || f.folder === "" || f.folder === null;
      } else {
        // In specific folder - show files that match the current folder path
        matchesFolder = f.folder === currentFolder;
      }
      
      console.log(`File: ${f.fileName}, folder: ${f.folder}, currentFolder: ${currentFolder}, matchesFolder: ${matchesFolder}`);
      
      return matchesSearch && matchesFolder;
    });
    
    console.log("Filtered files:", filtered.length, "search:", searchQuery, "currentFolder:", currentFolder);
    return filtered;
  }, [files, searchQuery, currentFolder]);

  // Current folder name
  const currentFolderName = useMemo(() => {
    if (!currentFolder) return "All Files";
    const folder = folders.find(f => f.id === currentFolder || f.path === currentFolder);
    return folder ? folder.name : currentFolder.split('/').pop() || currentFolder;
  }, [currentFolder, folders]);

  // Target folder name for display
  const targetFolderName = useMemo(() => {
    if (!targetFolder) return "Root";
    const folder = folders.find(f => f.path === targetFolder);
    return folder ? folder.name : targetFolder.split('/').pop() || targetFolder;
  }, [targetFolder, folders]);

  // Event handlers with proper dependencies
  const toggleFileSelection = useCallback((id: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedFiles(prev => {
      if (prev.size === filteredFiles.length) {
        return new Set();
      } else {
        return new Set(filteredFiles.map(f => f.id));
      }
    });
  }, [filteredFiles]);

  const clearSelection = useCallback(() => {
    setSelectedFiles(new Set());
  }, []);

  const formatFileSize = useCallback((size: string) => {
    const bytes = parseInt(size);
    if (isNaN(bytes)) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }, []);

  // File actions
  const handleDeleteFiles = useCallback(async (ids: string[]) => {
    if (!confirm(`Delete ${ids.length} file(s)? This action cannot be undone.`)) return;
    try {
      await Promise.all(ids.map(id => deleteFile(id).unwrap()));
      toast.success(`Deleted ${ids.length} file(s)`);
      clearSelection();
      refetchFiles();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete files");
    }
  }, [deleteFile, clearSelection, refetchFiles]);

  const handleUpload = async (files: FileList) => {
    const formData = new FormData();
    Array.from(files).forEach(file => formData.append("files", file));
    if (currentFolder) formData.append("folder", currentFolder);

    try {
      await uploadFiles(formData).unwrap();
      toast.success(`Uploaded ${files.length} file(s)`);
      refetchFiles();
    } catch (error) {
      toast.error("Upload failed");
    }
  };

  const handleDownload = useCallback((file: FileItem) => {
    const link = document.createElement('a');
    link.href = file.r2Url;
    link.download = file.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleCopyUrl = useCallback((file: FileItem) => {
    navigator.clipboard.writeText(file.r2Url)
      .then(() => toast.success("URL copied to clipboard"))
      .catch(() => toast.error("Failed to copy URL"));
  }, []);

  // FIXED: Enhanced move files function with immediate UI update and proper API call
  const handleMoveFiles = useCallback(async () => {
    if (!targetFolder || selectedFiles.size === 0) return;
    
    const fileIds = Array.from(selectedFiles);
    console.log("Moving files:", {
      fileIds,
      targetFolder,
      selectedFilesCount: selectedFiles.size,
      currentFolder
    });

    try {
      // Store the files being moved for immediate UI update
      const filesBeingMoved = filteredFiles.filter(file => selectedFiles.has(file.id));
      
      // Call API with correct parameters
      const result = await moveFilesToFolder({ 
        fileIds, 
        targetFolderPath: targetFolder 
      }).unwrap();

      console.log("Move files result:", result);
      
      // Clear selection and refresh data
      clearSelection();
      setMoveDialog(false);
      setTargetFolder("");
      
      // Refresh both files and folders to get updated counts
      await Promise.all([
        refetchFiles(),
        refetchFolders()
      ]);
      
      toast.success(`Moved ${selectedFiles.size} file(s) to ${targetFolderName}`);
      
    } catch (error: any) {
      console.error("Move files error:", error);
      const errorMessage = error?.data?.message || error?.message || "Failed to move files";
      toast.error(errorMessage);
    }
  }, [
    targetFolder, 
    selectedFiles, 
    moveFilesToFolder, 
    clearSelection, 
    refetchFiles, 
    refetchFolders, 
    targetFolderName, 
    currentFolder, 
    filteredFiles
  ]);

  // Folder actions
  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) return toast.error("Folder name is required");
    try {
      await createFolder({ 
        name: newFolderName.trim(), 
        parentPath: currentFolder || undefined 
      }).unwrap();
      toast.success(`Folder "${newFolderName}" created`);
      setCreateFolderDialog(false);
      setNewFolderName("");
      refetchFolders();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create folder");
    }
  }, [newFolderName, currentFolder, createFolder, refetchFolders]);

  const handleRenameFolder = useCallback(async () => {
    if (!renameFolderName.trim() || !selectedFolderToRename) return;
    try {
      await renameFolder({ 
        folderId: selectedFolderToRename, 
        newName: renameFolderName.trim() 
      }).unwrap();
      toast.success("Folder renamed successfully");
      setRenameFolderDialog(false);
      setRenameFolderName("");
      setSelectedFolderToRename(null);
      refetchFolders();
      refetchFiles();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to rename folder");
    }
  }, [renameFolderName, selectedFolderToRename, renameFolder, refetchFolders, refetchFiles]);

  const handleDeleteFolder = useCallback(async (folderId: string, folderName: string) => {
    if (!confirm(`Delete folder "${folderName}"? This will also delete all files inside.`)) return;
    try {
      await deleteFolder({ folderId }).unwrap();
      toast.success("Folder deleted successfully");
      
      const folderToDelete = folders.find(f => f.id === folderId);
      if (folderToDelete && currentFolder === folderToDelete.path) {
        setCurrentFolder("");
      }
      
      refetchFolders();
      refetchFiles();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete folder");
    }
  }, [folders, currentFolder, deleteFolder, refetchFolders, refetchFiles]);

  const openRenameFolderDialog = useCallback((folder: FolderItem) => {
    setSelectedFolderToRename(folder.id);
    setRenameFolderName(folder.name);
    setRenameFolderDialog(true);
  }, []);

  const navigateToFolder = useCallback((folderPath: string) => {
    console.log("Navigating to folder:", folderPath);
    setCurrentFolder(folderPath);
    clearSelection();
  }, [clearSelection]);

  const navigateUp = useCallback(() => {
    if (!currentFolder) return;
    
    if (currentFolder.includes('/')) {
      const pathParts = currentFolder.split('/');
      pathParts.pop();
      const newPath = pathParts.join('/');
      console.log("Navigating up to:", newPath);
      setCurrentFolder(newPath);
    } else {
      console.log("Navigating up to root");
      setCurrentFolder("");
    }
    clearSelection();
  }, [currentFolder, clearSelection]);

  // Reset target folder when move dialog opens
  const openMoveDialog = useCallback(() => {
    setTargetFolder("");
    setMoveDialog(true);
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" /> File Manager
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant={viewMode === "grid" ? "default" : "outline"} 
                size="icon" 
                onClick={() => setViewMode("grid")}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button 
                variant={viewMode === "list" ? "default" : "outline"} 
                size="icon" 
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Debug Info */}
          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span>Status:</span>
              {foldersLoading && <Badge variant="secondary">Loading folders...</Badge>}
              {filesLoading && <Badge variant="secondary">Loading files...</Badge>}
              {isUploading && <Badge variant="secondary">Uploading...</Badge>}
              {isMovingFiles && <Badge variant="secondary">Moving files...</Badge>}
              {foldersError && <Badge variant="destructive">Folders error</Badge>}
              <Badge variant="outline">Total Folders: {folders.length}</Badge>
              <Badge variant="outline">Current Dir: {currentDirectoryFolders.length}</Badge>
              <Badge variant="outline">Files: {filteredFiles.length}</Badge>
              <Badge variant="outline">Selected: {selectedFiles.size}</Badge>
              <Badge variant="outline">Location: {currentFolder || "Root"}</Badge>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setCurrentFolder("")}
              className={!currentFolder ? "bg-background" : ""}
            >
              Root
            </Button>
            
            {currentFolder && (
              <>
                <span className="text-muted-foreground">/</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={navigateUp}
                  className="flex items-center gap-1"
                >
                  <FolderUp className="w-3 h-3" />
                  ...
                </Button>
                <span className="text-muted-foreground">/</span>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <FolderOpen className="w-3 h-3" />
                  {currentFolderName}
                </Badge>
              </>
            )}
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <label htmlFor="file-upload">
              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files && handleUpload(e.target.files)}
                disabled={isUploading || isMovingFiles}
              />
              <Button asChild disabled={isUploading || isMovingFiles}>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? "Uploading..." : "Upload Image"}
                </span>
              </Button>
            </label>
            
            <Button 
              variant="outline" 
              onClick={() => setCreateFolderDialog(true)}
              disabled={isUploading || isMovingFiles}
            >
              <FolderPlus className="w-4 h-4 mr-2" /> Create Folder
            </Button>
            
            {selectedFiles.size > 0 && (
              <>
                <Button 
                  variant="outline" 
                  onClick={openMoveDialog}
                  disabled={isMovingFiles || isUploading}
                >
                  <Move className="w-4 h-4 mr-2" /> 
                  {isMovingFiles ? "Moving..." : `Move (${selectedFiles.size})`}
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleDeleteFiles(Array.from(selectedFiles))}
                  disabled={isUploading || isMovingFiles}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete ({selectedFiles.size})
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearSelection}
                  disabled={isUploading || isMovingFiles}
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            )}
            
            <div className="ml-auto flex items-center gap-2">
              <Input 
                placeholder="Search files..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-64" 
                disabled={isUploading || isMovingFiles}
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={selectAll}
                title={selectedFiles.size === filteredFiles.length ? "Deselect all" : "Select all"}
                disabled={isUploading || isMovingFiles || filteredFiles.length === 0}
              >
                {selectedFiles.size === filteredFiles.length ? 
                  <CheckSquare className="w-4 h-4" /> : 
                  <Square className="w-4 h-4" />
                }
              </Button>
            </div>
          </div>

          {/* Folders Section */}
          {foldersLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : currentDirectoryFolders.length > 0 ? (
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3">Folders ({currentDirectoryFolders.length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {currentDirectoryFolders.map(folder => (
                  <div 
                    key={folder.id} 
                    className="flex flex-col items-center p-4 border rounded-lg hover:border-primary cursor-pointer transition-colors group relative"
                    onClick={() => navigateToFolder(folder.path)}
                  >
                    <FolderOpen className="w-12 h-12 text-yellow-500 mb-2" />
                    <p className="truncate text-center text-sm font-medium" title={folder.name}>
                      {folder.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {folder.fileCount || 0} items
                    </p>
                    
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button 
                        size="icon" 
                        variant="secondary" 
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          openRenameFolderDialog(folder);
                        }}
                        disabled={isMovingFiles}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="destructive" 
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolder(folder.id, folder.name);
                        }}
                        disabled={isMovingFiles}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            !foldersLoading && folders.length > 0 && (
              <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg mb-6">
                <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No subfolders in this directory</p>
                <p className="text-sm mt-2">Create a new folder or navigate to a different directory</p>
              </div>
            )
          )}

          {/* Show empty state when no folders at all */}
          {!foldersLoading && folders.length === 0 && (
            <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg mb-6">
              <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No folders created yet</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setCreateFolderDialog(true)}
                disabled={isMovingFiles}
              >
                <FolderPlus className="w-4 h-4 mr-2" /> Create Your First Folder
              </Button>
            </div>
          )}

          {/* Files Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">
                {currentFolderName} ({filteredFiles.length} files)
              </h3>
              {selectedFiles.size > 0 && (
                <span className="text-sm text-muted-foreground">
                  {selectedFiles.size} selected
                </span>
              )}
            </div>

            {filesLoading ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="text-center p-12 text-muted-foreground border-2 border-dashed rounded-lg">
                <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No images found</p>
                {searchQuery && (
                  <p className="text-sm mt-2">Try adjusting your search terms</p>
                )}
                {!searchQuery && currentFolder && (
                  <p className="text-sm mt-2">This folder is empty</p>
                )}
                {!searchQuery && !currentFolder && (
                  <p className="text-sm mt-2">Upload some images or navigate to a folder</p>
                )}
              </div>
            ) : viewMode === "grid" ? (
              // Grid View with StableImage component
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredFiles.map(file => (
                  <div 
                    key={file.id} 
                    className={`group relative rounded-lg border-2 overflow-hidden transition-all cursor-pointer ${
                      selectedFiles.has(file.id) ? 
                      "border-primary shadow-lg scale-[1.02]" : 
                      "border-transparent hover:border-muted-foreground/30"
                    }`}
                    onClick={() => toggleFileSelection(file.id)}
                  >
                    <div className="aspect-square bg-muted/50">
                      <StableImage 
                        src={file.r2Url} 
                        alt={file.fileName}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>

                    <div className="absolute top-2 left-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFileSelection(file.id);
                        }}
                        className="w-6 h-6 rounded bg-white/90 flex items-center justify-center shadow-sm border"
                        disabled={isMovingFiles}
                      >
                        {selectedFiles.has(file.id) ? 
                          <CheckSquare className="w-4 h-4 text-primary" /> : 
                          <Square className="w-4 h-4 text-muted-foreground" />
                        }
                      </button>
                    </div>

                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            size="icon" 
                            variant="secondary" 
                            className="h-6 w-6 bg-white/90"
                            onClick={(e) => e.stopPropagation()}
                            disabled={isMovingFiles}
                          >
                            <MoreVertical className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownload(file)}>
                            <Download className="w-4 h-4 mr-2" /> Download
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyUrl(file)}>
                            <Copy className="w-4 h-4 mr-2" /> Copy URL
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive" 
                            onClick={() => handleDeleteFiles([file.id])}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="p-2 bg-background">
                      <p className="text-xs font-medium truncate" title={file.fileName}>
                        {file.fileName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.fileSize)} • {format(new Date(file.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // List View with StableImage component
              <div className="space-y-2">
                {filteredFiles.map(file => (
                  <div 
                    key={file.id} 
                    className={`flex items-center gap-4 p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                      selectedFiles.has(file.id) ? 
                      "border-primary bg-primary/5" : 
                      "border-transparent hover:border-muted-foreground/30"
                    }`}
                    onClick={() => toggleFileSelection(file.id)}
                  >
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFileSelection(file.id);
                      }}
                      disabled={isMovingFiles}
                    >
                      {selectedFiles.has(file.id) ? 
                        <CheckSquare className="w-5 h-5 text-primary" /> : 
                        <Square className="w-5 h-5 text-muted-foreground" />
                      }
                    </button>

                    <StableImage 
                      src={file.r2Url} 
                      alt={file.fileName}
                      className="w-12 h-12 rounded object-cover flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate" title={file.fileName}>
                        {file.fileName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.fileSize)} • {format(new Date(file.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={(e) => e.stopPropagation()}
                          disabled={isMovingFiles}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDownload(file)}>
                          <Download className="w-4 h-4 mr-2" /> Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCopyUrl(file)}>
                          <Copy className="w-4 h-4 mr-2" /> Copy URL
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive" 
                          onClick={() => handleDeleteFiles([file.id])}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Folder Dialog */}
      <Dialog open={createFolderDialog} onOpenChange={setCreateFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for your new folder{currentFolder && ` in "${currentFolderName}"`}
            </DialogDescription>
          </DialogHeader>
          <Input 
            placeholder="Folder name" 
            value={newFolderName} 
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateFolderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Folder Dialog */}
      <Dialog open={renameFolderDialog} onOpenChange={setRenameFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
            <DialogDescription>
              Enter a new name for the folder
            </DialogDescription>
          </DialogHeader>
          <Input 
            placeholder="New folder name" 
            value={renameFolderName} 
            onChange={(e) => setRenameFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRenameFolder()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameFolderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameFolder} disabled={!renameFolderName.trim()}>
              Rename Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Files Dialog */}
      <Dialog open={moveDialog} onOpenChange={setMoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Files</DialogTitle>
            <DialogDescription>
              Select a destination folder for {selectedFiles.size} file(s)
              {targetFolder && (
                <span className="block mt-1 text-green-600">
                  Selected: {targetFolderName}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="max-h-60 overflow-y-auto border rounded-lg p-2">
              <div className="grid grid-cols-1 gap-1">
                <Button
                  variant={targetFolder === "" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTargetFolder("")}
                  className="justify-start"
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Root Directory
                </Button>
                {folders.map(folder => (
                  <Button
                    key={folder.id}
                    variant={targetFolder === folder.path ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTargetFolder(folder.path)}
                    className="justify-start"
                  >
                    <FolderOpen className="w-4 h-4 mr-2" />
                    <span className="truncate">{folder.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {folder.fileCount || 0}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
            
            {targetFolder && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">Move Summary:</p>
                <p className="text-sm text-muted-foreground">
                  Moving {selectedFiles.size} file(s) from <strong>{currentFolderName}</strong> to <strong>{targetFolderName}</strong>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleMoveFiles} 
              disabled={!targetFolder || selectedFiles.size === 0 || isMovingFiles}
            >
              {isMovingFiles ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Moving...
                </>
              ) : (
                `Move ${selectedFiles.size} File(s)`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}