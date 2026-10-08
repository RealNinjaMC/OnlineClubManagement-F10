export const STARS = [1, 2, 3, 4, 5]

export function getRating(club) {
  const count = club.feedback.length
  const total = club.feedback.reduce((sum, item) => sum + item.rating, 0)

  return {
    count,
    average: count > 0 ? Math.round((total / count) * 10) / 10 : 0,
    breakdown: [...STARS].reverse().map((star) => ({
      star,
      count: club.feedback.filter((item) => item.rating === star).length,
    })),
  }
}
