"use client";

import React from "react";
import { Editor } from "@tinymce/tinymce-react";
import { useUploadFileMutation } from "@/features/vendorManageApi"; 

interface Props {
  value: string;
  onChange: (val: string) => void;
}

// Define the response type locally
interface UploadedFile {
  id: string;
  fileName: string;
  url: string;
  path: string;
  fileSize: string;
  mimeType: string;
}

interface UploadFileResponse {
  success: boolean;
  files: UploadedFile[];
  totalFiles?: number;
  totalSize?: number;
}

export default function ProductDescriptionEditor({ value, onChange }: Props) {
  const [uploadFile] = useUploadFileMutation();

  const handleImageUpload = async (blobInfo: any) => {
  try {
    const formData = new FormData();
    formData.append("file", blobInfo.blob(), blobInfo.filename());

    // Upload via RTK mutation
    const res = await uploadFile(formData).unwrap();

    if (!res.success || !res.file) {
      throw new Error("Upload failed");
    }

    // Return ONLY the URL string to TinyMCE
    return res.file.url;
  } catch (err: any) {
    console.error("Image upload failed:", err.message || err);
    throw new Error(err.message || "Image upload failed");
  }
};


  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">
        Product Description
      </label>

    <Editor
  apiKey="b2zz2r7lny7pux1l4rgi2lsrelk385g581lyx6ohka861z6u"
  value={value}
  onEditorChange={(newValue) => onChange(newValue)}
  init={{
    height: 400,
    menubar: true,
    plugins: [
      "anchor",
      "autolink",
      "charmap",
      "codesample",
      "emoticons",
      "link",
      "lists",
      "media",
      "searchreplace",
      "table",
      "visualblocks",
      "wordcount",
      "image", // removed imagetools
    ],
    toolbar:
      "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | " +
      "align lineheight | numlist bullist | removeformat",

    images_upload_handler: handleImageUpload,
    automatic_uploads: true,
    image_advtab: false, // hide Advanced tab
    image_uploadtab: true,
    file_picker_types: 'image',

    branding: false,
    promotion: false,
  }}
/>

    </div>
  );
}
