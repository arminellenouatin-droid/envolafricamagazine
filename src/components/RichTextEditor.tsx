"use client";

import { useEffect, useRef } from "react";
import { plainTextToRichHtml, sanitizeRichText } from "@/lib/rich-text";

type Props = { name?: string; value?: string; defaultValue?: string; onChange?: (value: string) => void; placeholder?: string; className?: string; minHeight?: number };

export default function RichTextEditor({ name, value, defaultValue = "", onChange, placeholder = "Écrivez ou collez votre texte…", className = "", minHeight = 180 }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const initial = value ?? defaultValue;

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const next = /<[a-z][\s\S]*>/i.test(initial) ? sanitizeRichText(initial) : plainTextToRichHtml(initial);
    if (editor.innerHTML !== next) editor.innerHTML = next;
    if (hiddenRef.current) hiddenRef.current.value = next;
  }, [initial]);

  function emit() {
    const editor = editorRef.current;
    if (!editor) return;
    const html = sanitizeRichText(editor.innerHTML);
    if (editor.innerHTML !== html) editor.innerHTML = html;
    if (hiddenRef.current) hiddenRef.current.value = html;
    onChange?.(html);
  }

  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    const html = event.clipboardData.getData("text/html");
    const text = event.clipboardData.getData("text/plain");
    const safe = html ? sanitizeRichText(html) : plainTextToRichHtml(text);
    document.execCommand("insertHTML", false, safe);
    emit();
  }

  return <div className={`rich-text-editor overflow-hidden rounded-[16px] border border-[#d1e9e6] bg-[#eefcfa] ${className}`}>
    <div ref={editorRef} contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" data-placeholder={placeholder} onInput={emit} onPaste={handlePaste} className="min-h-[var(--editor-min-height)] w-full whitespace-normal p-4 text-sm leading-7 outline-none empty:before:pointer-events-none empty:before:text-[#7b8588] empty:before:content-[attr(data-placeholder)]" style={{ "--editor-min-height": `${minHeight}px` } as React.CSSProperties} />
    {name && <input ref={hiddenRef} type="hidden" name={name} />}
  </div>;
}
