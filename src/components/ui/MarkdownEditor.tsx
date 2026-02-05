"use client";

import { useState, useRef, useCallback } from "react";
import {
  FiBold,
  FiItalic,
  FiLink,
  FiCode,
  FiList,
  FiImage,
  FiCheckSquare,
  FiCornerUpLeft,
  FiCornerUpRight,
  FiMaximize2,
  FiMinimize2,
} from "react-icons/fi";
import {
  RiDoubleQuotesL,
  RiListOrdered,
  RiH1,
  RiH2,
  RiH3,
  RiCodeSSlashLine,
  RiTableLine,
  RiSeparator,
  RiAtLine,
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
  resizable?: boolean;
}

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
  
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const lineEnd = value.indexOf("\n", end);
  const actualLineEnd = lineEnd === -1 ? value.length : lineEnd;
  
  const lineContent = value.substring(lineStart, actualLineEnd);
  // Remove existing header markers
  const cleanContent = lineContent.replace(/^#{1,6}\s*/, "");
  const newLine = wrapper + cleanContent;
  const newText = value.substring(0, lineStart) + newLine + value.substring(actualLineEnd);
  
  onChange(newText);
  
  setTimeout(() => {
    textarea.focus();
    textarea.setSelectionRange(lineStart + wrapper.length, lineStart + wrapper.length + cleanContent.length);
  }, 0);
};

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  label,
  name,
  dir = "ltr",
  height = 200,
  minHeight = 100,
  maxHeight = 800,
  className = "",
  uploadEndpoint = "/api/chat/upload",
  resizable = true,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [currentHeight, setCurrentHeight] = useState(height);
  const [isResizing, setIsResizing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [history, setHistory] = useState<string[]>([value]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);

  // History management
  const pushHistory = useCallback((newValue: string) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newValue);
      return newHistory.slice(-50); // Keep last 50 states
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  const handleChange = useCallback((newValue: string) => {
    onChange(newValue);
    pushHistory(newValue);
  }, [onChange, pushHistory]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  }, [historyIndex, history, onChange]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  }, [historyIndex, history, onChange]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    if (isFullscreen) return;
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
  }, [currentHeight, minHeight, maxHeight, isFullscreen]);

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
        insertText(textareaRef.current, value, handleChange, imageMarkdown, "", "");
      } else {
        alert(data.error || "خطا در آپلود عکس");
      }
    } catch {
      alert("خطا در آپلود عکس");
    } finally {
      setUploading(false);
    }
  }, [value, handleChange, uploadEndpoint]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
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
      insertText(ta, value, handleChange, "**", "**", "bold text");
    } else if (isMod && e.key === "i") {
      e.preventDefault();
      insertText(ta, value, handleChange, "_", "_", "italic text");
    } else if (isMod && e.key === "k") {
      e.preventDefault();
      insertText(ta, value, handleChange, "[", "](url)", "link text");
    } else if (isMod && e.key === "e") {
      e.preventDefault();
      insertText(ta, value, handleChange, "`", "`", "code");
    } else if (isMod && e.key === "z") {
      e.preventDefault();
      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
    } else if (isMod && e.key === "y") {
      e.preventDefault();
      redo();
    }
  }, [value, handleChange, undo, redo]);

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

  const toolbarButton = (
    icon: React.ReactNode,
    title: string,
    onClick: () => void,
    disabled = false
  ) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled || activeTab === "preview"}
      className="p-1.5 rounded hover:bg-(--chip-bg) text-(--muted-foreground) hover:text-(--foreground) transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {icon}
    </button>
  );

  const divider = () => (
    <div className="w-px h-5 bg-(--surface-border) mx-1" />
  );

  const fullscreenClass = isFullscreen 
    ? "fixed inset-0 z-50 bg-(--background) flex flex-col" 
    : "";

  return (
    <div className={`w-full ${className}`}>
      {label && !isFullscreen && (
        <label className="block text-sm font-medium mb-2">{label}</label>
      )}
      <div 
        ref={containerRef}
        className={`rounded-lg overflow-hidden bg-(--background) transition-all ${isResizing ? "select-none" : ""} ${fullscreenClass}`}
        style={{
          border: isFullscreen ? "none" : "1px solid var(--surface-border)",
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {/* Header with tabs and toolbar */}
        <div className="border-b border-(--surface-border) bg-(--background)">
          {/* Tabs */}
          <div className="flex items-center justify-between px-2 pt-2">
            <div className="flex">
              <button
                type="button"
                onClick={() => setActiveTab("write")}
                className={`px-3 py-1.5 text-sm font-medium rounded-t-md transition-colors ${
                  activeTab === "write"
                    ? "bg-(--chip-bg) text-(--foreground) border-b-2 border-(--accent)"
                    : "text-(--muted-foreground) hover:text-(--foreground)"
                }`}
              >
                Write
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1.5 text-sm font-medium rounded-t-md transition-colors ${
                  activeTab === "preview"
                    ? "bg-(--chip-bg) text-(--foreground) border-b-2 border-(--accent)"
                    : "text-(--muted-foreground) hover:text-(--foreground)"
                }`}
              >
                Preview
              </button>
            </div>
            
            {/* Right side tools */}
            <div className="flex items-center gap-1">
              {toolbarButton(
                <FiCornerUpLeft className="w-4 h-4" />,
                "Undo (Ctrl+Z)",
                undo,
                historyIndex <= 0
              )}
              {toolbarButton(
                <FiCornerUpRight className="w-4 h-4" />,
                "Redo (Ctrl+Shift+Z)",
                redo,
                historyIndex >= history.length - 1
              )}
              {divider()}
              {toolbarButton(
                isFullscreen ? <FiMinimize2 className="w-4 h-4" /> : <FiMaximize2 className="w-4 h-4" />,
                isFullscreen ? "Exit Fullscreen" : "Fullscreen",
                () => setIsFullscreen(!isFullscreen)
              )}
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-0.5 px-2 py-1.5 flex-wrap">
            {/* Heading dropdown */}
            <div className="relative">
              <button
                type="button"
                title="Heading"
                onClick={() => setShowHeadingMenu(!showHeadingMenu)}
                disabled={activeTab === "preview"}
                className="p-1.5 rounded hover:bg-(--chip-bg) text-(--muted-foreground) hover:text-(--foreground) transition-colors disabled:opacity-40 flex items-center gap-1"
              >
                <span className="text-sm font-bold">H</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showHeadingMenu && activeTab === "write" && (
                <div className="absolute top-full left-0 mt-1 bg-(--background) border border-(--surface-border) rounded-lg shadow-lg z-10 py-1">
                  {[1, 2, 3, 4, 5, 6].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => {
                        if (textareaRef.current) {
                          wrapLine(textareaRef.current, value, handleChange, "#".repeat(level) + " ");
                        }
                        setShowHeadingMenu(false);
                      }}
                      className="w-full px-3 py-1.5 text-left hover:bg-(--chip-bg) transition-colors"
                    >
                      <span className={`font-bold ${level === 1 ? "text-xl" : level === 2 ? "text-lg" : level === 3 ? "text-base" : "text-sm"}`}>
                        H{level}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {divider()}

            {toolbarButton(
              <FiBold className="w-4 h-4" />,
              "Bold (Ctrl+B)",
              () => textareaRef.current && insertText(textareaRef.current, value, handleChange, "**", "**", "bold text")
            )}
            {toolbarButton(
              <FiItalic className="w-4 h-4" />,
              "Italic (Ctrl+I)",
              () => textareaRef.current && insertText(textareaRef.current, value, handleChange, "_", "_", "italic text")
            )}

            {divider()}

            {toolbarButton(
              <RiDoubleQuotesL className="w-4 h-4" />,
              "Quote",
              () => textareaRef.current && insertText(textareaRef.current, value, handleChange, "\n> ", "", "quote")
            )}
            {toolbarButton(
              <FiCode className="w-4 h-4" />,
              "Inline Code (Ctrl+E)",
              () => textareaRef.current && insertText(textareaRef.current, value, handleChange, "`", "`", "code")
            )}
            {toolbarButton(
              <RiCodeSSlashLine className="w-4 h-4" />,
              "Code Block",
              () => textareaRef.current && insertText(textareaRef.current, value, handleChange, "\n```\n", "\n```\n", "code block")
            )}
            {toolbarButton(
              <FiLink className="w-4 h-4" />,
              "Link (Ctrl+K)",
              () => textareaRef.current && insertText(textareaRef.current, value, handleChange, "[", "](url)", "link text")
            )}

            {divider()}

            {toolbarButton(
              <FiList className="w-4 h-4" />,
              "Unordered List",
              () => textareaRef.current && insertText(textareaRef.current, value, handleChange, "\n- ", "", "list item")
            )}
            {toolbarButton(
              <RiListOrdered className="w-4 h-4" />,
              "Ordered List",
              () => textareaRef.current && insertText(textareaRef.current, value, handleChange, "\n1. ", "", "list item")
            )}
            {toolbarButton(
              <FiCheckSquare className="w-4 h-4" />,
              "Task List",
              () => textareaRef.current && insertText(textareaRef.current, value, handleChange, "\n- [ ] ", "", "task")
            )}

            {divider()}

            {toolbarButton(
              <RiTableLine className="w-4 h-4" />,
              "Table",
              () => textareaRef.current && insertText(
                textareaRef.current, 
                value, 
                handleChange, 
                "\n| Header | Header |\n| ------ | ------ |\n| Cell   | Cell   |\n", 
                "", 
                ""
              )
            )}
            {toolbarButton(
              <RiSeparator className="w-4 h-4" />,
              "Horizontal Rule",
              () => textareaRef.current && insertText(textareaRef.current, value, handleChange, "\n\n---\n\n", "", "")
            )}

            {divider()}

            {/* Image upload button */}
            <button
              type="button"
              title="Add Image"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || activeTab === "preview"}
              className="p-1.5 rounded hover:bg-(--chip-bg) text-(--muted-foreground) hover:text-(--foreground) transition-colors disabled:opacity-40"
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
          </div>
        </div>

        {/* Content area */}
        <div style={{ height: isFullscreen ? "calc(100vh - 120px)" : `${currentHeight}px` }}>
          {activeTab === "preview" ? (
            <div
              className="w-full h-full overflow-auto p-4 bg-(--background) text-(--foreground) text-sm leading-relaxed"
              dir={dir}
            >
              {value ? (
                <MarkdownRenderer content={value} />
              ) : (
                <span className="text-(--muted-foreground)">
                  {dir === "rtl" ? "چیزی برای پیش‌نمایش نیست" : "Nothing to preview"}
                </span>
              )}
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || (dir === "rtl" ? "توضیحات خود را اینجا بنویسید..." : "Type your description here...")}
              dir={dir}
              className="w-full h-full resize-none p-4 bg-(--background) text-(--foreground) placeholder:text-(--muted-foreground) outline-none text-sm leading-relaxed font-mono"
            />
          )}
        </div>

        {/* Resize Handle */}
        {resizable && !isFullscreen && (
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
  maxHeight = 800,
  className = "",
  uploadEndpoint,
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
    
    // Process code blocks (before other processing)
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '%%CODEBLOCK%%$1%%CODE%%$2%%/CODEBLOCK%%');
    
    // Process images (before HTML escaping)
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '%%IMG%%$2%%ALT%%$1%%/IMG%%');
    
    // Process links (before HTML escaping)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '%%LINK%%$2%%TEXT%%$1%%/LINK%%');
    
    // Process tables
    html = html.replace(/\|(.+)\|\n\|[-|\s]+\|\n((?:\|.+\|\n?)+)/g, (match, header, body) => {
      const headerCells = header.split('|').filter((c: string) => c.trim()).map((c: string) => `<th class="border border-(--surface-border) px-3 py-2 bg-(--chip-bg)">${c.trim()}</th>`).join('');
      const bodyRows = body.trim().split('\n').map((row: string) => {
        const cells = row.split('|').filter((c: string) => c.trim()).map((c: string) => `<td class="border border-(--surface-border) px-3 py-2">${c.trim()}</td>`).join('');
        return `<tr>${cells}</tr>`;
      }).join('');
      return `%%TABLE%%<thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody>%%/TABLE%%`;
    });
    
    // Now escape HTML
    html = html
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    // Restore alignment divs
    html = html.replace(/%%ALIGN%%(left|center|right)%%/g, '<div style="text-align:$1">');
    html = html.replace(/%%\/ALIGN%%/g, '</div>');
    
    // Restore code blocks
    html = html.replace(/%%CODEBLOCK%%(\w*)%%CODE%%([\s\S]*?)%%\/CODEBLOCK%%/g, '<pre class="bg-(--chip-bg) rounded-lg p-4 overflow-x-auto my-2"><code class="text-sm">$2</code></pre>');
    
    // Restore tables
    html = html.replace(/%%TABLE%%([\s\S]*?)%%\/TABLE%%/g, '<table class="border-collapse w-full my-4">$1</table>');
    
    // Restore images
    html = html.replace(/%%IMG%%(.+?)%%ALT%%(.*)%%\/IMG%%/g, '<img src="$1" alt="$2" class="max-w-full rounded my-2" />');
    
    // Restore links
    html = html.replace(/%%LINK%%(.+?)%%TEXT%%(.+?)%%\/LINK%%/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-(--accent) underline hover:opacity-80">$2</a>');
    
    html = html
      // Headers
      .replace(/^###### (.+)$/gm, "<h6 class='text-sm font-semibold my-2'>$1</h6>")
      .replace(/^##### (.+)$/gm, "<h5 class='text-base font-semibold my-2'>$1</h5>")
      .replace(/^#### (.+)$/gm, "<h4 class='text-lg font-semibold my-3'>$1</h4>")
      .replace(/^### (.+)$/gm, "<h3 class='text-xl font-semibold my-3'>$1</h3>")
      .replace(/^## (.+)$/gm, "<h2 class='text-2xl font-bold my-4'>$1</h2>")
      .replace(/^# (.+)$/gm, "<h1 class='text-3xl font-bold my-4'>$1</h1>")
      
      // Task lists (must be before unordered lists)
      .replace(/^- \[x\] (.+)$/gm, '<li class="flex items-center gap-2"><input type="checkbox" checked disabled class="rounded" /><span class="line-through text-(--muted-foreground)">$1</span></li>')
      .replace(/^- \[ \] (.+)$/gm, '<li class="flex items-center gap-2"><input type="checkbox" disabled class="rounded" /><span>$1</span></li>')
      
      // Bold
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/__(.+?)__/g, "<strong>$1</strong>")
      
      // Italic
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/_(.+?)_/g, "<em>$1</em>")
      
      // Strikethrough
      .replace(/~~(.+?)~~/g, "<del class='text-(--muted-foreground)'>$1</del>")
      
      // Inline code
      .replace(/`([^`]+)`/g, "<code class='bg-(--chip-bg) px-1.5 py-0.5 rounded text-sm'>$1</code>")
      
      // Horizontal rule
      .replace(/^---$/gm, "<hr class='border-(--surface-border) my-4' />")
      .replace(/^\*\*\*$/gm, "<hr class='border-(--surface-border) my-4' />")
      
      // Blockquote
      .replace(/^&gt; (.+)$/gm, "<blockquote class='border-l-4 border-(--accent) pl-4 py-1 my-2 text-(--muted-foreground) italic'>$1</blockquote>")
      
      // Unordered list
      .replace(/^- (.+)$/gm, "<li class='ml-4'>• $1</li>")
      .replace(/^\* (.+)$/gm, "<li class='ml-4'>• $1</li>")
      
      // Ordered list
      .replace(/^(\d+)\. (.+)$/gm, "<li class='ml-4'>$1. $2</li>")
      
      // Line breaks (double newline = paragraph)
      .replace(/\n\n/g, "</p><p class='my-2'>")
      
      // Single line breaks
      .replace(/\n/g, "<br />");
    
    // Wrap consecutive <li> tags in <ul>
    html = html.replace(/(<li[^>]*>.*?<\/li>)(?:<br \/>)?/g, "$1");
    html = html.replace(/((?:<li[^>]*>.*?<\/li>)+)/g, "<ul class='my-2'>$1</ul>");
    
    // Wrap in paragraph if not starting with block element
    if (!html.startsWith("<h") && !html.startsWith("<ul") && !html.startsWith("<blockquote") && !html.startsWith("<hr") && !html.startsWith("<img") && !html.startsWith("<div") && !html.startsWith("<pre") && !html.startsWith("<table")) {
      html = `<p class='my-2'>${html}</p>`;
    }
    
    // Clean up empty paragraphs
    html = html.replace(/<p[^>]*><\/p>/g, "");
    html = html.replace(/<p[^>]*><br \/><\/p>/g, "");
    
    return html;
  };

  return (
    <div
      className={`markdown-body ${className}`}
      dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
    />
  );
}
