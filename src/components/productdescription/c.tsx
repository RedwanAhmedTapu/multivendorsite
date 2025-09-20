import React, { useRef, useCallback, useEffect, useState } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Link,
  List,
  ListOrdered,
  Quote,
  Table,
  Undo2,
  Redo2,
  Image,
  Palette,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Type,
  Heading1,
  Heading2,
  Heading3,
  X
} from 'lucide-react';

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export default function ProductDescriptionEditor({ value, onChange }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const highlightInputRef = useRef<HTMLInputElement>(null);
  
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [isTableSelectorOpen, setIsTableSelectorOpen] = useState(false);
  const [hoveredCell, setHoveredCell] = useState({ row: -1, col: -1 });
  const [currentFont, setCurrentFont] = useState('Inter, sans-serif');
  const [currentFontSize, setCurrentFontSize] = useState('14px');
  const [activeFormat, setActiveFormat] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    align: '',
    list: '',
    heading: ''
  });

  // Font options with modern web fonts
  const fontOptions = [
    { name: 'Inter', value: 'Inter, sans-serif' },
    { name: 'Roboto', value: 'Roboto, sans-serif' },
    { name: 'Open Sans', value: '"Open Sans", sans-serif' },
    { name: 'Lato', value: 'Lato, sans-serif' },
    { name: 'Montserrat', value: 'Montserrat, sans-serif' },
    { name: 'Poppins', value: 'Poppins, sans-serif' },
    { name: 'Source Sans Pro', value: '"Source Sans Pro", sans-serif' },
    { name: 'Playfair Display', value: '"Playfair Display", serif' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Times New Roman', value: '"Times New Roman", serif' },
    { name: 'JetBrains Mono', value: '"JetBrains Mono", monospace' },
    { name: 'Courier New', value: '"Courier New", monospace' },
  ];

  // Font size options
  const fontSizeOptions = [
    { label: 'Extra Small', value: '10px' },
    { label: 'Small', value: '12px' },
    { label: 'Normal', value: '14px' },
    { label: 'Medium', value: '16px' },
    { label: 'Large', value: '18px' },
    { label: 'Extra Large', value: '20px' },
    { label: 'XX-Large', value: '24px' },
    { label: 'Huge', value: '32px' },
  ];

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  // Check active formatting
  const checkActiveFormatting = useCallback(() => {
    if (!editorRef.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const newActiveFormat = { ...activeFormat };
    
    // Check text formatting
    newActiveFormat.bold = document.queryCommandState('bold');
    newActiveFormat.italic = document.queryCommandState('italic');
    newActiveFormat.underline = document.queryCommandState('underline');
    newActiveFormat.strikethrough = document.queryCommandState('strikeThrough');
    
    // Check alignment
    if (document.queryCommandState('justifyLeft')) newActiveFormat.align = 'left';
    else if (document.queryCommandState('justifyCenter')) newActiveFormat.align = 'center';
    else if (document.queryCommandState('justifyRight')) newActiveFormat.align = 'right';
    else if (document.queryCommandState('justifyFull')) newActiveFormat.align = 'justify';
    else newActiveFormat.align = '';
    
    // Check list type
    const node = selection.anchorNode;
    if (node) {
      const listParent = node.parentElement?.closest('ul, ol');
      if (listParent) {
        newActiveFormat.list = listParent.tagName === 'UL' ? 'unordered' : 'ordered';
      } else {
        newActiveFormat.list = '';
      }
      
      // Check heading
      const blockParent = node.parentElement?.closest('h1, h2, h3, h4, h5, h6');
      if (blockParent) {
        newActiveFormat.heading = blockParent.tagName.toLowerCase();
      } else {
        newActiveFormat.heading = '';
      }
    }
    
    setActiveFormat(newActiveFormat);
  }, [activeFormat]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      checkActiveFormatting();
      
      // Auto-expand the editor
      editorRef.current.style.height = 'auto';
      editorRef.current.style.height = editorRef.current.scrollHeight + 'px';
    }
  }, [onChange, checkActiveFormatting]);

  const executeCommand = useCallback((command: string, value?: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
      handleInput();
    }
  }, [handleInput]);

  const insertHTML = useCallback((html: string) => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      
      const div = document.createElement('div');
      div.innerHTML = html;
      const fragment = document.createDocumentFragment();
      
      while (div.firstChild) {
        fragment.appendChild(div.firstChild);
      }
      
      range.insertNode(fragment);
      
      // Move cursor after inserted content
      if (fragment.lastChild) {
        const newRange = document.createRange();
        newRange.setStartAfter(fragment.lastChild);
        newRange.collapse(true);
        
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    } else {
      // Fallback: append to end
      editorRef.current.innerHTML += html;
      
      // Move cursor to the end
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      const newSelection = window.getSelection();
      newSelection?.removeAllRanges();
      newSelection?.addRange(range);
    }
    
    handleInput();
  }, [handleInput]);

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = `<img src="${e.target?.result}" alt="Uploaded image" style="max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />`;
        insertHTML(img);
      };
      reader.readAsDataURL(file);
    }
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [insertHTML]);

  const insertTable = useCallback((rows: number, cols: number) => {
    let tableHTML = `<table style="width: 100%; border-collapse: collapse; margin: 16px 0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: 1px solid #e5e7eb;">`;
    
    // Add header row
    tableHTML += '<thead><tr style="background-color: #f9fafb;">';
    for (let j = 0; j < cols; j++) {
      tableHTML += `<th style="padding: 12px 16px; border: 1px solid #e5e7eb; font-weight: 600; color: #374151; text-align: left;">Header ${j+1}</th>`;
    }
    tableHTML += '</tr></thead>';
    
    // Add body rows
    tableHTML += '<tbody>';
    for (let i = 1; i < rows; i++) {
      tableHTML += '<tr style="border-bottom: 1px solid #e5e7eb;">';
      for (let j = 0; j < cols; j++) {
        tableHTML += `<td style="padding: 12px 16px; border: 1px solid #e5e7eb; background-color: white;">Cell ${i+1}-${j+1}</td>`;
      }
      tableHTML += '</tr>';
    }
    tableHTML += '</tbody></table><p><br></p>';
    
    insertHTML(tableHTML);
    setIsTableSelectorOpen(false);
    setHoveredCell({ row: -1, col: -1 });
  }, [insertHTML]);

  const handleLinkSubmit = useCallback(() => {
    if (linkUrl.trim()) {
      const selection = window.getSelection();
      const selectedText = selection?.toString() || '';
      const displayText = linkText.trim() || selectedText || linkUrl;
      
      const link = `<a href="${linkUrl}" target="_blank" style="color: #3b82f6; text-decoration: underline; transition: color 0.2s;">${displayText}</a>`;
      
      if (selectedText) {
        // Replace selected text
        executeCommand('insertHTML', link);
      } else {
        // Insert at cursor
        insertHTML(link);
      }
    }
    setIsLinkModalOpen(false);
    setLinkUrl('');
    setLinkText('');
  }, [linkUrl, linkText, insertHTML, executeCommand]);

  const openLinkModal = useCallback(() => {
    const selection = window.getSelection();
    if (selection) {
      setLinkText(selection.toString());
    }
    setIsLinkModalOpen(true);
  }, []);

  const handleFontChange = useCallback((fontValue: string) => {
    setCurrentFont(fontValue);
    executeCommand('fontName', fontValue);
  }, [executeCommand]);

  const handleFontSizeChange = useCallback((sizeValue: string) => {
    setCurrentFontSize(sizeValue);
    
    // Use fontSize command for better compatibility
    const sizeMap = {
      '10px': '1',
      '12px': '2', 
      '14px': '3',
      '16px': '4',
      '18px': '5',
      '20px': '6',
      '24px': '7',
      '32px': '7'
    };
    
    executeCommand('fontSize', sizeMap[sizeValue as keyof typeof sizeMap] || '3');
  }, [executeCommand]);

  const handleList = useCallback((type: 'ordered' | 'unordered') => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    
    // Execute the list command
    if (type === 'ordered') {
      document.execCommand('insertOrderedList', false);
    } else {
      document.execCommand('insertUnorderedList', false);
    }
    
    // Ensure proper styling for lists
    setTimeout(() => {
      const lists = editorRef.current?.querySelectorAll('ul, ol');
      lists?.forEach(list => {
        list.setAttribute('style', 'margin: 16px 0; padding-left: 24px; line-height: 1.6;');
        const items = list.querySelectorAll('li');
        items.forEach(item => {
          item.setAttribute('style', 'margin: 8px 0; line-height: 1.6;');
        });
      });
      handleInput();
    }, 10);
  }, [handleInput]);

  const handleColorChange = useCallback((color: string) => {
    executeCommand('foreColor', color);
  }, [executeCommand]);

  const handleHighlightChange = useCallback((color: string) => {
    executeCommand('hiliteColor', color);
  }, [executeCommand]);

  const handleBlockquote = useCallback(() => {
    const blockquoteHTML = `<blockquote style="margin: 16px 0; padding: 16px 24px; border-left: 4px solid #3b82f6; background: linear-gradient(90deg, #eff6ff 0%, #f8fafc 100%); font-style: italic; border-radius: 0 8px 8px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">Quote text here...</blockquote><p><br></p>`;
    insertHTML(blockquoteHTML);
  }, [insertHTML]);

  // Table grid component
  const TableGrid = () => {
    const maxRows = 8;
    const maxCols = 8;

    return (
      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50">
        <div className="text-xs text-gray-600 mb-2 text-center">
          {hoveredCell.row >= 0 && hoveredCell.col >= 0 
            ? `${hoveredCell.row + 1} × ${hoveredCell.col + 1} table`
            : 'Select table size'
          }
        </div>
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${maxCols}, 1fr)` }}>
          {Array.from({ length: maxRows }, (_, row) =>
            Array.from({ length: maxCols }, (_, col) => (
              <div
                key={`${row}-${col}`}
                className={`w-4 h-4 border border-gray-300 cursor-pointer transition-colors ${
                  row <= hoveredCell.row && col <= hoveredCell.col
                    ? 'bg-blue-500 border-blue-600'
                    : 'bg-white hover:bg-gray-100'
                }`}
                onMouseEnter={() => setHoveredCell({ row, col })}
                onClick={() => {
                  insertTable(row + 1, col + 1);
                }}
              />
            ))
          )}
        </div>
        <div className="mt-2 pt-2 border-t border-gray-200">
          <button
            onClick={() => setIsTableSelectorOpen(false)}
            className="text-xs text-gray-500 hover:text-gray-700 w-full text-center"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  const ToolbarButton = ({ 
    onClick, 
    children, 
    tooltip, 
    className = "",
    active = false
  }: {
    onClick: () => void;
    children: React.ReactNode;
    tooltip: string;
    className?: string;
    active?: boolean;
  }) => (
    <div className="relative group">
      <button
        type="button"
        onClick={onClick}
        className={`h-8 px-2 border border-gray-200 rounded hover:bg-gray-50 transition-colors flex items-center justify-center ${
          active ? 'bg-blue-50 border-blue-300 text-blue-600' : 'bg-white'
        } ${className}`}
      >
        {children}
      </button>
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-gray-800 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        {tooltip}
      </div>
    </div>
  );

  const Select = ({ value, onValueChange, children, className = "" }: {
    value: string;
    onValueChange: (value: string) => void;
    children: React.ReactNode;
    className?: string;
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    return (
      <div ref={selectRef} className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="h-8 px-3 border border-gray-200 rounded bg-white hover:bg-gray-50 transition-colors flex items-center justify-between text-sm w-full"
        >
          <span>{value}</span>
          <span className="ml-2">▼</span>
        </button>
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-full max-h-48 overflow-y-auto">
            {children}
          </div>
        )}
      </div>
    );
  };

  const SelectItem = ({ value, onSelect, children }: {
    value: string;
    onSelect: (value: string) => void;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm border-b border-gray-100 last:border-b-0"
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-900">
        Product Description
      </label>
      
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="border-b border-gray-200 p-3 bg-gray-50/50">
          <div className="flex flex-wrap gap-1 items-center">
            {/* Font Family */}
            <Select 
              value={fontOptions.find(f => f.value === currentFont)?.name || 'Inter'} 
              onValueChange={(name) => {
                const font = fontOptions.find(f => f.name === name);
                if (font) handleFontChange(font.value);
              }}
              className="w-32"
            >
              {fontOptions.map(font => (
                <SelectItem 
                  key={font.value} 
                  value={font.name}
                  onSelect={(name) => {
                    const selectedFont = fontOptions.find(f => f.name === name);
                    if (selectedFont) handleFontChange(selectedFont.value);
                  }}
                >
                  <span style={{ fontFamily: font.value }}>{font.name}</span>
                </SelectItem>
              ))}
            </Select>

            {/* Font Size */}
            <Select 
              value={fontSizeOptions.find(s => s.value === currentFontSize)?.label || 'Normal'}
              onValueChange={(label) => {
                const size = fontSizeOptions.find(s => s.label === label);
                if (size) handleFontSizeChange(size.value);
              }}
              className="w-24"
            >
              {fontSizeOptions.map(size => (
                <SelectItem 
                  key={size.value} 
                  value={size.label}
                  onSelect={(label) => {
                    const selectedSize = fontSizeOptions.find(s => s.label === label);
                    if (selectedSize) handleFontSizeChange(selectedSize.value);
                  }}
                >
                  {size.label}
                </SelectItem>
              ))}
            </Select>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* Headings */}
            <ToolbarButton
              onClick={() => executeCommand('formatBlock', '<h1>')}
              tooltip="Heading 1"
              active={activeFormat.heading === 'h1'}
            >
              <Heading1 className="h-4 w-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => executeCommand('formatBlock', '<h2>')}
              tooltip="Heading 2"
              active={activeFormat.heading === 'h2'}
            >
              <Heading2 className="h-4 w-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => executeCommand('formatBlock', '<h3>')}
              tooltip="Heading 3"
              active={activeFormat.heading === 'h3'}
            >
              <Heading3 className="h-4 w-4" />
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* Text Formatting */}
            <ToolbarButton
              onClick={() => executeCommand('bold')}
              tooltip="Bold"
              active={activeFormat.bold}
            >
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => executeCommand('italic')}
              tooltip="Italic"
              active={activeFormat.italic}
            >
              <Italic className="h-4 w-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => executeCommand('underline')}
              tooltip="Underline"
              active={activeFormat.underline}
            >
              <Underline className="h-4 w-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => executeCommand('strikeThrough')}
              tooltip="Strikethrough"
              active={activeFormat.strikethrough}
            >
              <Strikethrough className="h-4 w-4" />
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* Colors */}
            <div className="relative">
              <ToolbarButton
                onClick={() => colorInputRef.current?.click()}
                tooltip="Text Color"
              >
                <Palette className="h-4 w-4" />
              </ToolbarButton>
              <input
                ref={colorInputRef}
                type="color"
                className="absolute opacity-0 w-0 h-0"
                onChange={(e) => handleColorChange(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <ToolbarButton
                onClick={() => highlightInputRef.current?.click()}
                tooltip="Highlight"
              >
                <Highlighter className="h-4 w-4" />
              </ToolbarButton>
              <input
                ref={highlightInputRef}
                type="color"
                className="absolute opacity-0 w-0 h-0"
                defaultValue="#ffff00"
                onChange={(e) => handleHighlightChange(e.target.value)}
              />
            </div>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* Alignment */}
            <ToolbarButton
              onClick={() => executeCommand('justifyLeft')}
              tooltip="Align Left"
              active={activeFormat.align === 'left'}
            >
              <AlignLeft className="h-4 w-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => executeCommand('justifyCenter')}
              tooltip="Align Center"
              active={activeFormat.align === 'center'}
            >
              <AlignCenter className="h-4 w-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => executeCommand('justifyRight')}
              tooltip="Align Right"
              active={activeFormat.align === 'right'}
            >
              <AlignRight className="h-4 w-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => executeCommand('justifyFull')}
              tooltip="Justify"
              active={activeFormat.align === 'justify'}
            >
              <AlignJustify className="h-4 w-4" />
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* Lists */}
            <ToolbarButton
              onClick={() => handleList('unordered')}
              tooltip="Bullet List"
              active={activeFormat.list === 'unordered'}
            >
              <List className="h-4 w-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => handleList('ordered')}
              tooltip="Numbered List"
              active={activeFormat.list === 'ordered'}
            >
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* Insert Elements */}
            <ToolbarButton
              onClick={openLinkModal}
              tooltip="Insert Link"
            >
              <Link className="h-4 w-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={handleBlockquote}
              tooltip="Blockquote"
            >
              <Quote className="h-4 w-4" />
            </ToolbarButton>
            
            <div className="relative">
              <ToolbarButton
                onClick={() => setIsTableSelectorOpen(!isTableSelectorOpen)}
                tooltip="Insert Table"
              >
                <Table className="h-4 w-4" />
              </ToolbarButton>
              {isTableSelectorOpen && <TableGrid />}
            </div>
            
            <ToolbarButton
              onClick={() => fileInputRef.current?.click()}
              tooltip="Insert Image"
            >
              <Image className="h-4 w-4" />
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            {/* Undo/Redo */}
            <ToolbarButton
              onClick={() => executeCommand('undo')}
              tooltip="Undo"
            >
              <Undo2 className="h-4 w-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => executeCommand('redo')}
              tooltip="Redo"
            >
              <Redo2 className="h-4 w-4" />
            </ToolbarButton>
          </div>
        </div>

        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onClick={checkActiveFormatting}
          onKeyUp={checkActiveFormatting}
          className="min-h-[300px] p-6 focus:outline-none overflow-y-auto"
          style={{
            lineHeight: '1.7',
            fontFamily: currentFont,
            fontSize: currentFontSize,
            maxHeight: '70vh'
          }}
          suppressContentEditableWarning={true}
          placeholder="Start writing your product description..."
        />

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* Click outside to close table selector */}
      {isTableSelectorOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsTableSelectorOpen(false)}
        />
      )}

      {/* Link Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Insert Link</h3>
              <button
                onClick={() => {
                  setIsLinkModalOpen(false);
                  setLinkUrl('');
                  setLinkText('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link Text (optional)</label>
                <input
                  type="text"
                  placeholder="Link text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setIsLinkModalOpen(false);
                  setLinkUrl('');
                  setLinkText('');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLinkSubmit}
                disabled={!linkUrl.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(placeholder);
          color: #9ca3af;
          font-style: italic;
          pointer-events: none;
        }
        
        [contenteditable]:focus {
          outline: none;
        }
        
        [contenteditable] h1 {
          font-size: 2.25em !important;
          font-weight: 700 !important;
          line-height: 1.2 !important;
          margin: 1em 0 0.5em 0 !important;
          color: #1f2937 !important;
        }
        
        [contenteditable] h2 {
          font-size: 1.875em !important;
          font-weight: 600 !important;
          line-height: 1.3 !important;
          margin: 1em 0 0.5em 0 !important;
          color: #374151 !important;
        }
        
        [contenteditable] h3 {
          font-size: 1.5em !important;
          font-weight: 600 !important;
          line-height: 1.4 !important;
          margin: 1em 0 0.5em 0 !important;
          color: 4b5563 !important;
        }
        
        [contenteditable] ul, [contenteditable] ol {
          margin: 16px 0 !important;
          padding-left: 24px !important;
          line-height: 1.6 !important;
        }
        
        [contenteditable] li {
          margin: 8px 0 !important;
          line-height: 1.6 !important;
          list-style-position: outside !important;
        }
        
        [contenteditable] ul li {
          list-style-type: disc !important;
        }
        
        [contenteditable] ol li {
          list-style-type: decimal !important;
        }
        
        [contenteditable] p {
          margin: 1em 0 !important;
          line-height: 1.7 !important;
        }
        
        [contenteditable] blockquote {
          margin: 16px 0 !important;
          padding: 16px 24px !important;
          border-left: 4px solid #3b82f6 !important;
          background: linear-gradient(90deg, #eff6ff 0%, #f8fafc 100%) !important;
          font-style: italic !important;
          border-radius: 0 8px 8px 0 !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
        }
        
        [contenteditable] table {
          width: 100% !important;
          border-collapse: collapse !important;
          margin: 16px 0 !important;
          border-radius: 8px !important;
          overflow: hidden !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
          border: 1px solid #e5e7eb !important;
        }
        
        [contenteditable] td, [contenteditable] th {
          border: 1px solid #e5e7eb !important;
          padding: 12px 16px !important;
          text-align: left !important;
          vertical-align: top !important;
        }
        
        [contenteditable] th {
          background-color: #f9fafb !important;
          font-weight: 600 !important;
          color: #374151 !important;
        }
        
        [contenteditable] tr:nth-child(even) td {
          background-color: #f9fafb !important;
        }
        
        [contenteditable] tr:hover td {
          background-color: #f3f4f6 !important;
        }
        
        [contenteditable] img {
          max-width: 100% !important;
          height: auto !important;
          border-radius: 8px !important;
          margin: 12px 0 !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
        }
        
        [contenteditable] strong {
          font-weight: 600 !important;
          color: #1f2937 !important;
        }
        
        [contenteditable] em {
          font-style: italic !important;
          color: #4b5563 !important;
        }
        
        [contenteditable] a {
          color: #3b82f6 !important;
          text-decoration: underline !important;
          transition: color 0.2s !important;
        }
        
        [contenteditable] a:hover {
          color: #1e40af !important;
        }
      `}</style>
    </div>
  );
}