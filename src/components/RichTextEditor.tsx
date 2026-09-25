"use client";

import { useEffect, useRef, useState } from "react";
import { escapeHtml, fixMojibake, plainTextToRichHtml, sanitizeRichText } from "@/lib/rich-text";

type Props = { name?: string; value?: string; defaultValue?: string; onChange?: (value: string) => void; placeholder?: string; className?: string; minHeight?: number };

export default function RichTextEditor({ name, value, defaultValue = "", onChange, placeholder = "Écrivez ou collez votre texte…", className = "", minHeight = 180 }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const lastEmittedRef = useRef<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const initial = value ?? defaultValue;

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    // Ne jamais écraser si le contenu provient de l'éditeur lui-même
    if (initial === lastEmittedRef.current) return;
    const isEditing = editor.contains(document.activeElement);
    // Ne jamais écraser le contenu pendant que l'utilisateur est en train d'écrire
    if (isEditing) return;
    const healed = fixMojibake(initial);
    const next = /<[a-z][\s\S]*>/i.test(healed) ? sanitizeRichText(healed) : plainTextToRichHtml(healed);
    if (editor.innerHTML !== next) editor.innerHTML = next;
    if (hiddenRef.current) hiddenRef.current.value = next;
  }, [initial]);

  function emit() {
    const editor = editorRef.current;
    if (!editor) return;
    let html = editor.innerHTML
      .replace(/&amp;nbsp;?/gi, " ")
      .replace(/&nbsp;?/gi, " ")
      .replace(/\u00a0/g, " ")
      .replace(/\u202f/g, " ")
      .replace(/\u200b/g, "");

    const textOnly = html.replace(/<[^>]*>/g, "").trim();
    if (!textOnly && !/<img\b/i.test(html)) {
      html = "";
    }

    lastEmittedRef.current = html;
    if (hiddenRef.current) hiddenRef.current.value = html;
    onChange?.(html);
  }

  function rememberSelection() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || !editorRef.current?.contains(selection.anchorNode)) return;
    selectionRef.current = selection.getRangeAt(0).cloneRange();
  }

  function restoreSelection() {
    const selection = window.getSelection();
    const range = selectionRef.current;
    if (!selection || !range) return;
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function format(command: "bold" | "italic" | "underline") {
    editorRef.current?.focus();
    document.execCommand(command, false);
    emit();
  }

  function insertImage(src: string, alt: string) {
    if (!/^https?:\/\//i.test(src) && !src.startsWith("/")) return;
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand("insertHTML", false, `<p><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async"></p>`);
    emit();
  }

  function insertImageFromUrl() {
    rememberSelection();
    const src = window.prompt("URL de l’image (https://...) :", "https://");
    if (!src || src === "https://") return;
    const alt = window.prompt("Texte alternatif de l’image :", "Illustration de l’article") || "";
    insertImage(src.trim(), alt.trim());
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    rememberSelection();
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "article-inline");
      formData.append("magazineId", "article-inline");
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.url) throw new Error(data.error || "Téléversement impossible");
      const alt = window.prompt("Texte alternatif de l’image :", file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ")) || "";
      insertImage(data.url, alt.trim());
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Téléversement impossible");
    } finally {
      setUploadingImage(false);
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    const html = event.clipboardData.getData("text/html");
    const text = event.clipboardData.getData("text/plain");
    const safe = html ? sanitizeRichText(fixMojibake(html)) : plainTextToRichHtml(fixMojibake(text));
    document.execCommand("insertHTML", false, safe);
    emit();
  }

  return <div className={`rich-text-editor overflow-hidden rounded-[16px] border border-[#d1e9e6] bg-[#eefcfa] ${className}`}>
    <div role="toolbar" aria-label="Mise en forme du texte" className="flex flex-wrap items-center gap-1 border-b border-[#d1e9e6] bg-white/80 px-3 py-2">
      <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => format("bold")} aria-label="Mettre en gras" title="Gras" className="grid h-8 w-8 place-items-center rounded-lg font-black text-[#082843] transition hover:bg-[#dff5f1]">B</button>
      <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => format("italic")} aria-label="Mettre en italique" title="Italique" className="grid h-8 w-8 place-items-center rounded-lg font-serif text-lg italic text-[#082843] transition hover:bg-[#dff5f1]">I</button>
      <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => format("underline")} aria-label="Souligner" title="Souligné" className="grid h-8 w-8 place-items-center rounded-lg font-bold underline text-[#082843] transition hover:bg-[#dff5f1]">U</button>
      <button type="button" onMouseDown={(event) => { event.preventDefault(); rememberSelection(); }} onClick={insertImageFromUrl} aria-label="Insérer une image depuis une URL" title="Insérer une image" className="ml-1 inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-bold text-[#082843] transition hover:bg-[#dff5f1]">▧ Image</button>
      <label onMouseDown={(event) => { event.preventDefault(); rememberSelection(); }} title="Téléverser une image dans le contenu" className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg px-2 text-[11px] font-bold text-[#082843] transition hover:bg-[#dff5f1]">↑ Téléverser<input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" disabled={uploadingImage} onChange={(event) => void handleImageUpload(event)} /></label>
      {uploadingImage ? <span className="ml-1 text-[10px] text-[#687274]">Téléversement…</span> : <span className="ml-1 text-[10px] text-[#687274]">Sélectionnez un passage puis choisissez une option</span>}
    </div>
    <div ref={editorRef} contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" data-placeholder={placeholder} onInput={emit} onBlur={emit} onKeyUp={emit} onPaste={handlePaste} className="min-h-[var(--editor-min-height)] w-full whitespace-normal p-4 text-sm leading-7 outline-none empty:before:pointer-events-none empty:before:text-[#7b8588] empty:before:content-[attr(data-placeholder)]" style={{ "--editor-min-height": `${minHeight}px` } as React.CSSProperties} />
    {name && <input ref={hiddenRef} type="hidden" name={name} defaultValue={initial} />}
  </div>;
}
