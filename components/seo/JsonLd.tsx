"use client";

import { useEffect, useState } from "react";
import DOMPurify from "dompurify";

interface JsonLdProps {
  data: Record<string, unknown>;
}

export default function JsonLd({ data }: JsonLdProps) {
  const [html, setHtml] = useState("");

  useEffect(() => {
    setHtml(DOMPurify.sanitize(JSON.stringify(data), { USE_PROFILES: { html: true } }));
  }, [data]);

  if (!html) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
