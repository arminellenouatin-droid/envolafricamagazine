"use client";

import { useEffect, useRef } from "react";
import { plainTextToRichHtml, sanitizeRichText } from "@/lib/rich-text";

type Props = { name?: string; value?: string; defaultValue?: string; onChange?: (value: string) => void; placeholder?: string; className?: string; minHeight?: number };

export default function RichTextEditor({ name, value, defaultValue = "", onChange, placeholder = "Écrivez ou collez votre texte…", className = "", minHeight = 180 }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const lastEmittedRef = useRef<string | null>(null);
  const initial = value ?? defaultValue;

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const next = /<[a-z][\s\S]*>/i.test(initial) ? sanitizeRichText(initial) : plainTextToRichHtml(initial);
    const isEditing = editor.contains(document.activeElement);
    if (!(isEditing && lastEmittedRef.current === next) && editor.innerHTML !== next) editor.innerHTML = next;
    if (hiddenRef.current) hiddenRef.current.value = next;
  }, [initial]);

  function readEditorValue(editor: HTMLDivElement) {
    const hasFormatting = Boolean(editor.querySelector("strong,b,em,i,u,blockquote,h1,h2,h3,h4,h5,h6,ul,ol,li,a,sub,sup"));
    if (!hasFormatting) {
      const plainText = (editor.innerText || editor.textContent || "").replace(/\u00a0/g, " ");
      return plainTextToRichHtml(plainText);
    }
    return sanitizeRichText(editor.innerHTML);
  }

  function emit() {
    const editor = editorRef.current;
    if (!editor) return;
    const html = readEditorValue(editor);
    lastEmittedRef.current = html;
    if (hiddenRef.current) hiddenRef.current.value = html;
    onChange?.(html);
  }

  function format(command: "bold" | "italic" | "underline") {
    editorRef.current?.focus();
    document.execCommand(command, false);
    emit();
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
    <div role="toolbar" aria-label="Mise en forme du texte" className="flex flex-wrap items-center gap-1 border-b border-[#d1e9e6] bg-white/80 px-3 py-2">
      <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => format("bold")} aria-label="Mettre en gras" title="Gras" className="grid h-8 w-8 place-items-center rounded-lg font-black text-[#082843] transition hover:bg-[#dff5f1]">B</button>
      <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => format("italic")} aria-label="Mettre en italique" title="Italique" className="grid h-8 w-8 place-items-center rounded-lg font-serif text-lg italic text-[#082843] transition hover:bg-[#dff5f1]">I</button>
      <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => format("underline")} aria-label="Souligner" title="Souligné" className="grid h-8 w-8 place-items-center rounded-lg font-bold underline text-[#082843] transition hover:bg-[#dff5f1]">U</button>
      <span className="ml-2 text-[10px] text-[#687274]">Sélectionnez un passage puis choisissez une option</span>
    </div>
    <div ref={editorRef} contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" data-placeholder={placeholder} onInput={emit} onPaste={handlePaste} className="min-h-[var(--editor-min-height)] w-full whitespace-normal p-4 text-sm leading-7 outline-none empty:before:pointer-events-none empty:before:text-[#7b8588] empty:before:content-[attr(data-placeholder)]" style={{ "--editor-min-height": `${minHeight}px` } as React.CSSProperties} />
    {name && <input ref={hiddenRef} type="hidden" name={name} />}
  </div>;
}
