export function getAllTags(clubs) {
  return [...new Set(clubs.flatMap((club) => club.tags))].sort()
}

export function getMatches(clubs, selectedTags) {
  if (selectedTags.length === 0) return []

  return clubs
    .map((club) => {
      const shared = club.tags.filter((tag) => selectedTags.includes(tag))
      const score = Math.round((shared.length / selectedTags.length) * 100)
      return { club, shared, score }
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score || b.club.members.length - a.club.members.length)
}
