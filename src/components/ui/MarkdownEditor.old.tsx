"use client";

import { useState, useRef, useCallback } from "react";
import {
  FiBold,
  FiItalic,
  FiLink,
  FiCode,
  FiList,
  FiImage,
  FiEye,
  FiEdit3,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
} from "react-icons/fi";
import {
  RiStrikethrough,
  RiDoubleQuotesL,
  RiSeparator,
  RiH1,
  RiH2,
  RiH3,
  RiListOrdered,
} from "react-icons/ri";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  name?: string;
  dir?: "ltr" | "rtl";
  height?: number;
  minHeight?: number;
  maxHeight?: number;
  className?: string;
  uploadEndpoint?: string;
  enablePreview?: boolean;
  resizable?: boolean;
}

type ToolbarAction = {
  icon: React.ReactNode;
  title: string;
  action: (
    textarea: HTMLTextAreaElement,
    value: string,
    onChange: (v: string) => void
  ) => void;
};

const insertText = (
  textarea: HTMLTextAreaElement,
  value: string,
  onChange: (v: string) => void,
  before: string,
  after: string = "",
  placeholder: string = ""
) => {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = value.substring(start, end) || placeholder;
  const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
  onChange(newText);
  
  // Set cursor position after insert
  setTimeout(() => {
    textarea.focus();
    textarea.setSelectionRange(
      start + before.length,
      start + before.length + selectedText.length
    );
  }, 0);
};

const wrapLine = (
  textarea: HTMLTextAreaElement,
  value: string,
  onChange: (v: string) => void,
  wrapper: string
) => {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  
  // Find line boundaries
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const lineEnd = value.indexOf("\n", end);
  const actualLineEnd = lineEnd === -1 ? value.length : lineEnd;
  
  const lineContent = value.substring(lineStart, actualLineEnd);
  const newLine = wrapper + lineContent;
  const newText = value.substring(0, lineStart) + newLine + value.substring(actualLineEnd);
  
  onChange(newText);
  
  setTimeout(() => {
    textarea.focus();
    textarea.setSelectionRange(lineStart + wrapper.length, lineStart + wrapper.length + lineContent.length);
  }, 0);
};

const toolbarActions: ToolbarAction[] = [
  // Headers
  {
    icon: <RiH1 className="w-4 h-4" />,
    title: "Heading 1",
    action: (ta, v, onChange) => wrapLine(ta, v, onChange, "# "),
  },
  {
    icon: <RiH2 className="w-4 h-4" />,
    title: "Heading 2",
    action: (ta, v, onChange) => wrapLine(ta, v, onChange, "## "),
  },
  {
    icon: <RiH3 className="w-4 h-4" />,
    title: "Heading 3",
    action: (ta, v, onChange) => wrapLine(ta, v, onChange, "### "),
  },
  { icon: "divider", title: "", action: () => {} },
  // Text formatting
  {
    icon: <FiBold className="w-4 h-4" />,
    title: "Bold (Ctrl+B)",
    action: (ta, v, onChange) => insertText(ta, v, onChange, "**", "**", "bold"),
  },
  {
    icon: <FiItalic className="w-4 h-4" />,
    title: "Italic (Ctrl+I)",
    action: (ta, v, onChange) => insertText(ta, v, onChange, "_", "_", "italic"),
  },
  {
    icon: <RiStrikethrough className="w-4 h-4" />,
    title: "Strikethrough",
    action: (ta, v, onChange) => insertText(ta, v, onChange, "~~", "~~", "strikethrough"),
  },
  { icon: "divider", title: "", action: () => {} },
  // Alignment
  {
    icon: <FiAlignLeft className="w-4 h-4" />,
    title: "Align Left",
    action: (ta, v, onChange) => insertText(ta, v, onChange, '<div style="text-align:left">\n\n', "\n\n</div>", "text"),
  },
  {
    icon: <FiAlignCenter className="w-4 h-4" />,
    title: "Align Center",
    action: (ta, v, onChange) => insertText(ta, v, onChange, '<div style="text-align:center">\n\n', "\n\n</div>", "text"),
  },
  {
    icon: <FiAlignRight className="w-4 h-4" />,
    title: "Align Right",
    action: (ta, v, onChange) => insertText(ta, v, onChange, '<div style="text-align:right">\n\n', "\n\n</div>", "text"),
  },
  { icon: "divider", title: "", action: () => {} },
  // Lists
  {
    icon: <FiList className="w-4 h-4" />,
    title: "Unordered List",
    action: (ta, v, onChange) => insertText(ta, v, onChange, "- ", "", "list item"),
  },
  {
    icon: <RiListOrdered className="w-4 h-4" />,
    title: "Ordered List",
    action: (ta, v, onChange) => insertText(ta, v, onChange, "1. ", "", "list item"),
  },
  { icon: "divider", title: "", action: () => {} },
  // Other
  {
    icon: <FiLink className="w-4 h-4" />,
    title: "Link (Ctrl+K)",
    action: (ta, v, onChange) => insertText(ta, v, onChange, "[", "](url)", "link text"),
  },
  {
    icon: <RiDoubleQuotesL className="w-4 h-4" />,
    title: "Quote",
    action: (ta, v, onChange) => insertText(ta, v, onChange, "> ", "", "quote"),
  },
  {
    icon: <FiCode className="w-4 h-4" />,
    title: "Code",
    action: (ta, v, onChange) => insertText(ta, v, onChange, "`", "`", "code"),
  },
  {
    icon: <RiSeparator className="w-4 h-4" />,
    title: "Horizontal Rule",
    action: (ta, v, onChange) => {
      const start = ta.selectionStart;
      const lineStart = v.lastIndexOf("\n", start - 1) + 1;
      const needsNewline = lineStart !== start;
      insertText(ta, v, onChange, needsNewline ? "\n\n---\n\n" : "\n---\n\n", "", "");
    },
  },
];

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  label,
  name,
  dir = "ltr",
  height = 200,
  minHeight = 100,
  maxHeight = 600,
  className = "",
  uploadEndpoint = "/api/chat/upload",
  enablePreview = true,
  resizable = true,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [currentHeight, setCurrentHeight] = useState(height);
  const [isResizing, setIsResizing] = useState(false);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startY = e.clientY;
    const startHeight = currentHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientY - startY;
      const newHeight = Math.min(maxHeight, Math.max(minHeight, startHeight + delta));
      setCurrentHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [currentHeight, minHeight, maxHeight]);

  const handleToolbarClick = useCallback(
    (action: ToolbarAction["action"]) => {
      if (textareaRef.current) {
        action(textareaRef.current, value, onChange);
      }
    },
    [value, onChange]
  );

  const handleImageUpload = useCallback(async (file: File) => {
    if (!textareaRef.current) return;
    
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("فرمت عکس مجاز نیست. فقط JPEG, PNG, GIF و WebP مجاز است.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("حجم فایل نباید بیشتر از 10MB باشد.");
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "image");

      const res = await fetch(uploadEndpoint, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.ok && data.url) {
        const imageMarkdown = `![${file.name}](${data.url})`;
        insertText(textareaRef.current, value, onChange, imageMarkdown, "", "");
      } else {
        alert(data.error || "خطا در آپلود عکس");
      }
    } catch {
      alert("خطا در آپلود عکس");
    } finally {
      setUploading(false);
    }
  }, [value, onChange, uploadEndpoint]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  }, [handleImageUpload]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          handleImageUpload(file);
        }
        break;
      }
    }
  }, [handleImageUpload]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!textareaRef.current) return;
    
    const ta = textareaRef.current;
    const isMod = e.ctrlKey || e.metaKey;
    
    if (isMod && e.key === "b") {
      e.preventDefault();
      insertText(ta, value, onChange, "**", "**", "bold");
    } else if (isMod && e.key === "i") {
      e.preventDefault();
      insertText(ta, value, onChange, "_", "_", "italic");
    } else if (isMod && e.key === "k") {
      e.preventDefault();
      insertText(ta, value, onChange, "[", "](url)", "link text");
    } else if (isMod && e.shiftKey && e.key === "X") {
      e.preventDefault();
      insertText(ta, value, onChange, "~~", "~~", "strikethrough");
    }
  }, [value, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleImageUpload(file);
    }
  }, [handleImageUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium mb-2">{label}</label>
      )}
      <div 
        ref={containerRef}
        className={`rounded-xl overflow-hidden bg-(--background) backdrop-blur transition-all focus-within:ring-2 focus-within:ring-accent/50 ${isResizing ? "select-none" : ""}`}
        style={{
          border: "2px solid var(--surface-border)",
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {/* Toolbar */}
        <div className="flex items-center gap-1 p-2 border-b border-(--surface-border) bg-(--background)">
          {toolbarActions.map((action, idx) =>
            action.icon === "divider" ? (
              <div
                key={idx}
                className="w-px h-5 bg-(--surface-border) mx-1"
              />
            ) : (
              <button
                key={idx}
                type="button"
                title={action.title}
                onClick={() => handleToolbarClick(action.action)}
                className="p-1.5 rounded-lg hover:bg-(--chip-bg) text-(--foreground) transition-colors"
              >
                {action.icon}
              </button>
            )
          )}
          
          {/* Image upload button */}
          <div className="w-px h-5 bg-(--surface-border) mx-1" />
          <button
            type="button"
            title="Upload Image"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || previewMode}
            className="p-1.5 rounded-lg hover:bg-(--chip-bg) text-(--foreground) transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <div className="w-4 h-4 border-2 border-(--foreground) border-t-transparent rounded-full animate-spin" />
            ) : (
              <FiImage className="w-4 h-4" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {/* Preview toggle */}
          {enablePreview && (
            <>
              <div className="flex-1" />
              <button
                type="button"
                title={previewMode ? "Edit" : "Preview"}
                onClick={() => setPreviewMode(!previewMode)}
                className={`p-1.5 rounded-lg transition-colors ${previewMode ? "bg-(--accent) text-white" : "hover:bg-(--chip-bg) text-(--foreground)"}`}
              >
                {previewMode ? <FiEdit3 className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </button>
            </>
          )}
        </div>

        {/* Textarea or Preview */}
        {previewMode ? (
          <div
            style={{ height: `${currentHeight}px` }}
            className="w-full overflow-auto p-3 bg-(--background) text-(--foreground) text-sm leading-relaxed"
            dir={dir}
          >
            {value ? (
              <MarkdownRenderer content={value} />
            ) : (
              <span className="text-(--muted-foreground)">
                {dir === "rtl" ? "پیش‌نمایش خالی است" : "Preview is empty"}
              </span>
            )}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            dir={dir}
            style={{ height: `${currentHeight}px` }}
            className="w-full resize-none p-3 bg-(--background) text-(--foreground) placeholder:text-(--muted-foreground) outline-none text-sm leading-relaxed"
          />
        )}

        {/* Resize Handle */}
        {resizable && (
          <div
            onMouseDown={handleResizeStart}
            className="h-2 cursor-ns-resize bg-(--background) hover:bg-(--chip-bg) transition-colors flex items-center justify-center border-t border-(--surface-border)"
          >
            <div className="w-10 h-1 rounded-full bg-(--muted-foreground) opacity-40" />
          </div>
        )}
      </div>
      {name && <input type="hidden" name={name} value={value} />}
    </div>
  );
}

// For use with defaultValue (uncontrolled with hidden input for form submission)
interface MarkdownEditorFieldProps {
  defaultValue?: string;
  placeholder?: string;
  label?: string;
  name?: string;
  dir?: "ltr" | "rtl";
  height?: number;
  minHeight?: number;
  maxHeight?: number;
  className?: string;
  uploadEndpoint?: string;
  enablePreview?: boolean;
  resizable?: boolean;
}

export function MarkdownEditorField({
  defaultValue = "",
  placeholder,
  label,
  name,
  dir = "ltr",
  height = 200,
  minHeight = 100,
  maxHeight = 600,
  className = "",
  uploadEndpoint,
  enablePreview = true,
  resizable = true,
}: MarkdownEditorFieldProps) {
  const [value, setValue] = useState(defaultValue);

  return (
    <MarkdownEditor
      value={value}
      onChange={setValue}
      placeholder={placeholder}
      label={label}
      name={name}
      dir={dir}
      height={height}
      minHeight={minHeight}
      maxHeight={maxHeight}
      className={className}
      uploadEndpoint={uploadEndpoint}
      enablePreview={enablePreview}
      resizable={resizable}
    />
  );
}

// Markdown Renderer Component
interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  const parseMarkdown = (text: string): string => {
    if (!text) return "";
    
    // Process alignment divs first (before HTML escaping)
    let html = text.replace(/<div style="text-align:(left|center|right)">/g, '%%ALIGN%%$1%%');
    html = html.replace(/<\/div>/g, '%%/ALIGN%%');
    
    // Process images (before HTML escaping)
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '%%IMG%%$2%%ALT%%$1%%/IMG%%');
    
    // Process links (before HTML escaping)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '%%LINK%%$2%%TEXT%%$1%%/LINK%%');
    
    // Now escape HTML
    html = html
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    // Restore alignment divs
    html = html.replace(/%%ALIGN%%(left|center|right)%%/g, '<div style="text-align:$1">');
    html = html.replace(/%%\/ALIGN%%/g, '</div>');
    
    // Restore images
    html = html.replace(/%%IMG%%(.+?)%%ALT%%(.*)%%\/IMG%%/g, '<img src="$1" alt="$2" class="max-w-full rounded my-2" />');
    
    // Restore links
    html = html.replace(/%%LINK%%(.+?)%%TEXT%%(.+?)%%\/LINK%%/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-(--accent) underline">$2</a>');
    
    html = html
      // Headers
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^# (.+)$/gm, "<h1>$1</h1>")
      
      // Bold
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/__(.+?)__/g, "<strong>$1</strong>")
      
      // Italic
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/_(.+?)_/g, "<em>$1</em>")
      
      // Strikethrough
      .replace(/~~(.+?)~~/g, "<del>$1</del>")
      
      // Inline code
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      
      // Horizontal rule
      .replace(/^---$/gm, "<hr />")
      .replace(/^\*\*\*$/gm, "<hr />")
      
      // Blockquote
      .replace(/^&gt; (.+)$/gm, "<blockquote>$1</blockquote>")
      
      // Unordered list
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      .replace(/^\* (.+)$/gm, "<li>$1</li>")
      
      // Ordered list
      .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
      
      // Line breaks (double newline = paragraph)
      .replace(/\n\n/g, "</p><p>")
      
      // Single line breaks
      .replace(/\n/g, "<br />");
    
    // Wrap consecutive <li> tags in <ul>
    html = html.replace(/(<li>.*?<\/li>)(?:<br \/>)?/g, "$1");
    html = html.replace(/((?:<li>.*?<\/li>)+)/g, "<ul>$1</ul>");
    
    // Wrap in paragraph if not starting with block element
    if (!html.startsWith("<h") && !html.startsWith("<ul") && !html.startsWith("<blockquote") && !html.startsWith("<hr") && !html.startsWith("<img") && !html.startsWith("<div")) {
      html = `<p>${html}</p>`;
    }
    
    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, "");
    html = html.replace(/<p><br \/><\/p>/g, "");
    
    return html;
  };

  return (
    <div
      className={`prose prose-sm dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
    />
  );
}
