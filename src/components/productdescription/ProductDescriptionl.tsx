"use client";

import React from "react";
import { Editor } from "@tinymce/tinymce-react";

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export default function ProductDescriptionEditor({ value, onChange }: Props) {
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
            // Core editing features
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
          ],
          toolbar:
            "undo redo | blocks fontfamily fontsize | " +
            "bold italic underline strikethrough | link media table mergetags | " +
            " spellcheckdialog a11ycheck typography uploadcare | " +
            "align lineheight | checklist numlist bullist indent outdent | " +
            "emoticons charmap | removeformat",

          // Uploadcare integration key
          uploadcare_public_key: "e34c30762f0f53fb9231",

          branding: false,
          promotion: false,
        }}
      />
    </div>
  );
}
