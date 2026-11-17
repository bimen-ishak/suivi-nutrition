// Motivation de la sèche : date à tenir sans craquer, photo choisie par l'utilisateur et phrase du jour.
// La photo reste sur le téléphone (localStorage) : elle n'est jamais envoyée ni publiée.

const GOAL_KEY = 'cutGoalDate';
const PHOTO_KEY = 'motivationPhoto';

// Phrases connues de David Goggins, laissées dans leur langue d'origine
export const MOTIVATION_QUOTES = [
  'Stay hard!',
  'Who’s gonna carry the boats?',
  'Don’t stop when you’re tired. Stop when you’re done.',
  'You are in danger of living a life so comfortable and soft that you will die without ever realizing your true potential.',
  'Suffering is the true test of life.',
  'Be uncommon amongst uncommon people.',
  'Callus your mind.',
];
export const QUOTE_AUTHOR = 'David Goggins';

const isDate = (value: string | null): value is string => !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);

export function getGoalDate(): string | null {
  try {
    const value = localStorage.getItem(GOAL_KEY);
    return isDate(value) ? value : null;
  } catch {
    return null;
  }
}

export function setGoalDate(date: string | null): void {
  if (date && isDate(date)) localStorage.setItem(GOAL_KEY, date);
  else localStorage.removeItem(GOAL_KEY);
}

export function getMotivationPhoto(): string | null {
  try {
    const value = localStorage.getItem(PHOTO_KEY);
    return value?.startsWith('data:image/') ? value : null;
  } catch {
    return null;
  }
}

/** Enregistre la photo ; renvoie false si le téléphone n'a plus de place */
export function setMotivationPhoto(dataUrl: string | null): boolean {
  try {
    if (dataUrl) localStorage.setItem(PHOTO_KEY, dataUrl);
    else localStorage.removeItem(PHOTO_KEY);
    return true;
  } catch {
    return false;
  }
}

/** Jours restants jusqu'à la date objectif (0 le jour même, négatif une fois passée) */
export function daysUntil(goal: string, today: string): number {
  const start = Date.UTC(+today.slice(0, 4), +today.slice(5, 7) - 1, +today.slice(8, 10));
  const end = Date.UTC(+goal.slice(0, 4), +goal.slice(5, 7) - 1, +goal.slice(8, 10));
  return Math.round((end - start) / 86_400_000);
}

/** Une phrase différente à chaque ouverture, sans répéter la précédente */
export function nextQuote(): string {
  let last = -1;
  try {
    last = Number(localStorage.getItem('motivationQuote') ?? -1);
  } catch {
    // Sans stockage, on tire simplement au hasard
  }
  let index = Math.floor(Math.random() * MOTIVATION_QUOTES.length);
  if (index === last) index = (index + 1) % MOTIVATION_QUOTES.length;
  try {
    localStorage.setItem('motivationQuote', String(index));
  } catch {
    // Pas grave : la phrase pourra se répéter
  }
  return MOTIVATION_QUOTES[index];
}

/** L'écran de motivation s'affiche tant que la date objectif n'est pas dépassée */
export function shouldShowMotivation(today: string): boolean {
  const goal = getGoalDate();
  return !!goal && daysUntil(goal, today) >= 0;
}
