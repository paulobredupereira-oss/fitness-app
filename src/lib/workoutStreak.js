// weekday abbreviation → JS Date.getDay() (0=Sun)
const WD = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6 }

/**
 * Calculates the workout streak from all workout records.
 *
 * Rules:
 *  - If user has recurring workouts (repeat_days set):
 *      training days = weekdays in repeat_days  →  must be completed
 *      rest days     = other weekdays            →  skipped (don't break streak)
 *  - If no recurring workouts:
 *      any day with a completed workout counts
 *      any missed day breaks the streak
 */
export function calcWorkoutStreak(workouts = []) {
  // Build set of dates where at least one workout was completed
  const completedDates = new Set()
  workouts.forEach(w => {
    if (w.repeat_days) {
      try { JSON.parse(w.completed_dates || '[]').forEach(d => completedDates.add(d)) } catch {}
    } else if (w.done) {
      if (w.date) completedDates.add(w.date)
    }
  })

  // Build set of JS weekday numbers that have recurring workouts
  const trainingWeekdays = new Set()
  workouts.forEach(w => {
    if (!w.repeat_days) return
    try {
      JSON.parse(w.repeat_days).forEach(key => {
        if (WD[key] !== undefined) trainingWeekdays.add(WD[key])
      })
    } catch {}
  })

  const hasRecurring = trainingWeekdays.size > 0
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const todayStr = d.toISOString().split('T')[0]
  let streak = 0

  for (let i = 0; i < 365; i++) {
    const dateStr = d.toISOString().split('T')[0]
    const weekday = d.getDay()

    if (hasRecurring) {
      const isTraining = trainingWeekdays.has(weekday)
      if (!isTraining) {
        // Rest day → skip
        d.setDate(d.getDate() - 1)
        continue
      }
      // Training day
      if (completedDates.has(dateStr)) {
        streak++
      } else if (dateStr !== todayStr) {
        break // past training day not completed → streak broken
      }
      // today not yet done → keep going back
    } else {
      // No recurring: simple consecutive-day streak
      if (completedDates.has(dateStr)) {
        streak++
      } else if (dateStr !== todayStr) {
        break
      }
    }

    d.setDate(d.getDate() - 1)
  }

  return streak
}
