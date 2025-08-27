import type React from "react";

interface FormattedTextProps {
  text: string;
  className?: string;
}

export const FormattedText: React.FC<FormattedTextProps> = ({
  text,
  className,
}) => {
  const formatText = (input: string) => {
    let formatted = input;

    // Bold italic: *_text_* or _*text*_
    formatted = formatted.replace(
      /\*_([^*_]+)_\*/g,
      "<strong><em>$1</em></strong>"
    );
    formatted = formatted.replace(
      /_\*([^*_]+)\*_/g,
      "<strong><em>$1</em></strong>"
    );

    // Bold: *text*
    formatted = formatted.replace(/\*([^*]+)\*/g, "<strong>$1</strong>");

    // Italic: _text_
    formatted = formatted.replace(/_([^_]+)_/g, "<em>$1</em>");

    return formatted;
  };

  return (
    <span
      className={className}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: the whole point
      dangerouslySetInnerHTML={{ __html: formatText(text) }}
    />
  );
};
