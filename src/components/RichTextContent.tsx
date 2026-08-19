import { isRichText, plainTextToRichHtml, sanitizeRichText } from "@/lib/rich-text";

export default function RichTextContent({ value, className = "" }: { value: string; className?: string }) {
  const html = isRichText(value) ? sanitizeRichText(value) : plainTextToRichHtml(value);
  return <div className={`rich-text-content font-body [&_a]:font-semibold [&_a]:text-[#006874] [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-[#8ee0c0] [&_blockquote]:pl-4 [&_blockquote]:italic [&_h1]:font-display [&_h1]:text-2xl [&_h1]:font-extrabold [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-extrabold [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_ol]:list-decimal [&_p]:mb-3 [&_ul]:mb-3 ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
