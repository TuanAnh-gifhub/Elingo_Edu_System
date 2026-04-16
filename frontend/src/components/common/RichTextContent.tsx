import { useMemo } from "react";
import DOMPurify from "dompurify";

interface RichTextContentProps {
  content?: string | null;
  className?: string;
  emptyFallback?: string;
}

const HTML_TAG_REGEX = /<\/?[a-z][\s\S]*>/i;

const escapeHtml = (value: string): string => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const RichTextContent = ({
  content,
  className,
  emptyFallback = "Chưa có mô tả.",
}: RichTextContentProps) => {
  const safeHtml = useMemo(() => {
    const raw = (content || "").trim();
    if (!raw) {
      return `<p>${escapeHtml(emptyFallback)}</p>`;
    }

    const normalizedInput = HTML_TAG_REGEX.test(raw)
      ? raw
      : escapeHtml(raw).replace(/\n/g, "<br />");

    return DOMPurify.sanitize(normalizedInput, {
      ALLOWED_TAGS: [
        "p",
        "br",
        "strong",
        "b",
        "em",
        "i",
        "u",
        "s",
        "ul",
        "ol",
        "li",
        "blockquote",
        "pre",
        "code",
        "span",
        "div",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "sub",
        "sup",
        "a",
      ],
      ALLOWED_ATTR: ["href", "target", "rel", "style", "class"],
      FORBID_TAGS: ["script", "iframe", "object", "embed", "form"],
    });
  }, [content, emptyFallback]);

  return (
    <div className={className} dangerouslySetInnerHTML={{ __html: safeHtml }} />
  );
};

export default RichTextContent;
