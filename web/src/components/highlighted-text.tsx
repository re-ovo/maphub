import { getFuzzyMatchIndices } from "@/utils/fuzzy-match";

interface HighlightedTextProps {
  text: string;
  pattern: string;
}

export function HighlightedText({ text, pattern }: HighlightedTextProps) {
  const indices = getFuzzyMatchIndices(text, pattern);
  if (indices.length === 0) {
    return <>{text}</>;
  }

  const matchSet = new Set(indices);
  return (
    <>
      {text.split("").map((char, i) =>
        matchSet.has(i) ? (
          <span key={i} className="text-primary font-semibold">
            {char}
          </span>
        ) : (
          <span key={i}>{char}</span>
        ),
      )}
    </>
  );
}
