export const tokenizeForSearch = (value: string): string[] =>
  value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

export function scoreKeywordMatch(
  title: string,
  keywords: string[],
  query: string
): number {
  const queryWords = tokenizeForSearch(query);
  if (queryWords.length === 0) return 0;

  const titleWords = tokenizeForSearch(title);
  const keywordWords = keywords.flatMap(tokenizeForSearch);
  const searchableWords = [...titleWords, ...keywordWords];
  if (
    !queryWords.every((queryWord) =>
      searchableWords.some((word) => word.startsWith(queryWord))
    )
  ) {
    return 0;
  }

  const normalizedQuery = queryWords.join(" ");
  const normalizedTitle = titleWords.join(" ");
  const normalizedKeywords = keywords.map((keyword) =>
    tokenizeForSearch(keyword).join(" ")
  );
  if (normalizedTitle === normalizedQuery) return 100;
  if (normalizedTitle.startsWith(normalizedQuery)) return 50;
  if (normalizedKeywords.includes(normalizedQuery)) return 25;
  if (
    normalizedKeywords.some((keyword) => keyword.startsWith(normalizedQuery))
  ) {
    return 10;
  }
  return 1;
}
