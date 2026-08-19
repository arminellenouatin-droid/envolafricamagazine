"use client";

import { useEffect, useRef, useState } from "react";
import RichTextContent from "@/components/RichTextContent";

export default function ExpandablePostText({ value }: { value: string }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [longContent, setLongContent] = useState(false);

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;
    const measure = () => setLongContent(element.scrollHeight > element.clientHeight + 2);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [value, expanded]);

  return (
    <>
      <div ref={contentRef} className={`${expanded ? "" : "line-clamp-4 overflow-hidden"} leading-7`}>
        <RichTextContent value={value} />
      </div>
      {longContent && (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-1 text-sm font-extrabold text-[#006874] underline-offset-2 transition hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006874]"
          aria-expanded={expanded}
        >
          {expanded ? "Voir moins" : "Voir plus"}
        </button>
      )}
    </>
  );
}
