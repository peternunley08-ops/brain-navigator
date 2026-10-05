import { isNight, minutesOf, nightStart } from './night';

// The + sheet follows the moment (docs/design/DIRECTION.md, phase 6): the
// same options, ordered for what a student is most likely doing right now.
// Returns hrefs in order; the sheet keeps every option.

const SCHOOL_OUT = 14 * 60 + 30;

export function addOrder(now: Date, windDown: number, nightOwl: boolean): { main: string[]; more: string[] } {
  const mins = minutesOf(now);
  const weekday = now.getDay() >= 1 && now.getDay() <= 5;
  const night = isNight(mins, nightStart(windDown, nightOwl));
  const main = night
    ? // After wind-down: set things down, no new work pulled forward.
      ['/new-entry', '/add-assignment', '/scan', '/focus']
    : weekday && mins >= SCHOOL_OUT
      ? // After school: homework time.
        ['/add-assignment', '/focus', '/new-entry', '/scan']
      : ['/add-assignment', '/new-entry', '/focus', '/scan'];
  const more = now.getDay() === 0 ? ['/wins', '/helpers', '/grades', '/flashcards', '/hours'] : ['/helpers', '/grades', '/flashcards', '/wins', '/hours'];
  return { main, more };
}
