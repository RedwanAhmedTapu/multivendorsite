"use client";

import React, { useRef, useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUploadFileMutation } from "@/features/vendorManageApi";
import LayoutTemplateModal, { type BlockType } from "./LayoutTemplateModal";
import LayoutBuilderModal from "./Layoutbuildermodal";

interface Props {
  value: string;
  onChange: (val: string) => void;
}

// Highlights the block currently under the cursor so vendors can see what the
// move/duplicate/delete toolbar is about to act on.
const DESC_BLOCK_STYLE = `
  .desc-block { position: relative; }
  .desc-block:hover,
  .desc-block:focus-within { outline: 1.5px dashed #1565C0; outline-offset: 3px; }
`;

export default function ProductDescriptionEditor({ value, onChange }: Props) {
  const [uploadFile] = useUploadFileMutation();
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [builderType, setBuilderType] = useState<BlockType | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const editorRef = useRef<any>(null);

  // The `setup` callback below only runs once, when TinyMCE initializes — so it
  // reads onChange through this ref to always call the latest prop.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const handleImageUpload = async (blobInfo: any) => {
    try {
      const formData = new FormData();
      formData.append("file", blobInfo.blob(), blobInfo.filename());
      const res = await uploadFile(formData).unwrap();
      if (!res.success || !res.file) {
        throw new Error("Upload failed");
      }
      return res.file.url;
    } catch (err: any) {
      console.error("Image upload failed:", err.message || err);
      throw new Error(err.message || "Image upload failed");
    }
  };

  const handleLayoutTypeSelected = (type: BlockType) => {
    setBuilderType(type);
    setBuilderOpen(true);
  };

  const handleInsertLayout = (html: string) => {
  if (!editorRef.current) return;
  const editor = editorRef.current;

  editor.undoManager.transact(() => {
    const body = editor.getBody() as HTMLElement;
    // insertAdjacentHTML appends the new block as a brand-new SIBLING
    // node at the very end of the body — it never lands inside the
    // last existing element (a paragraph, image, or a previous
    // .desc-block), so it can never merge into whatever was there
    // before. Each template keeps its own separate area.
    body.insertAdjacentHTML("beforeend", html);
  });

  editor.focus();
  // Move the caret to the very end, after the newly appended block,
  // so if the vendor keeps typing it continues naturally below it.
  editor.selection.select(editor.getBody(), true);
  editor.selection.collapse(false);

  onChangeRef.current(editor.getContent());
};

  const handleEditorSetup = (editor: any) => {
    const findBlock = (): HTMLElement | null => {
      const node = editor.selection.getNode() as HTMLElement;
      return (node.closest && (node.closest(".desc-block") as HTMLElement)) || null;
    };

    const syncAfter = (fn: () => void) => {
      editor.undoManager.transact(fn);
      onChangeRef.current(editor.getContent());
    };

    editor.ui.registry.addButton("descMoveUp", {
      text: "↑ Up",
      tooltip: "Move layout up",
      onAction: () => {
        const block = findBlock();
        const prev = block?.previousElementSibling;
        if (!block || !prev) return;
        syncAfter(() => block.parentNode?.insertBefore(block, prev));
      },
    });

    editor.ui.registry.addButton("descMoveDown", {
      text: "↓ Down",
      tooltip: "Move layout down",
      onAction: () => {
        const block = findBlock();
        const next = block?.nextElementSibling;
        if (!block || !next) return;
        syncAfter(() => block.parentNode?.insertBefore(next, block));
      },
    });

    editor.ui.registry.addButton("descDuplicate", {
      text: "Copy",
      tooltip: "Duplicate layout",
      onAction: () => {
        const block = findBlock();
        if (!block) return;
        syncAfter(() => {
          const clone = block.cloneNode(true) as HTMLElement;
          clone.setAttribute("data-block-id", `blk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
          block.parentNode?.insertBefore(clone, block.nextSibling);
        });
      },
    });

    editor.ui.registry.addButton("descDelete", {
      text: "Delete",
      tooltip: "Delete layout",
      onAction: () => {
        const block = findBlock();
        if (!block) return;
        syncAfter(() => block.parentNode?.removeChild(block));
      },
    });

    editor.ui.registry.addContextToolbar("descBlockToolbar", {
      predicate: (node: HTMLElement) => !!(node.closest && node.closest(".desc-block")),
      items: "descMoveUp descMoveDown descDuplicate descDelete",
      position: "node",
      scope: "node",
    });
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium">Product Description</label>
        <Button
          type="button"
          size="sm"
          onClick={() => setTemplateModalOpen(true)}
          style={{
            fontSize: 11.5,
            height: 30,
            background: "#1565C0",
            color: "#fff",
            border: "none",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <LayoutTemplate size={13} /> Use Template
        </Button>
      </div>

      <Editor
        apiKey="b2zz2r7lny7pux1l4rgi2lsrelk385g581lyx6ohka861z6u"
        value={value}
        onInit={(_evt, editor) => {
          editorRef.current = editor;
        }}
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
          file_picker_types: "image",
          branding: false,
          promotion: false,
          content_style: DESC_BLOCK_STYLE,
          setup: handleEditorSetup,
        }}
      />

      {/* Step 1: pick a layout type */}
      <LayoutTemplateModal
        open={templateModalOpen}
        onOpenChange={setTemplateModalOpen}
        onSelect={handleLayoutTypeSelected}
      />

      {/* Step 2: fill in text/images (Upload or Media Center), then paste it in */}
      <LayoutBuilderModal
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        type={builderType}
        onInsert={handleInsertLayout}
      />
    </div>
  );
}