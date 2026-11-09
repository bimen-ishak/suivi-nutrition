import type { ReactNode } from 'react';
import './Icon.css';
import { t } from '../i18n';

// Icônes en trait fin, dessinées pour l'application : elles prennent la couleur du texte autour d'elles
const PATHS = {
  flame: <path d="M12 3c1 3 4 4.5 4 8.5a4 4 0 0 1-8 0c0-1.5.6-2.6 1.5-3.5.2 1.2.9 1.8 1.7 2C11.5 7.5 11.2 5 12 3z" />,
  trash: <path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12M10 11v5M14 11v5" />,
  pencil: <path d="M4 20l1-4L16 5l3 3L8 19zM14 7l3 3" />,
  tag: (
    <>
      <path d="M4 12V5h7l9 9-7 7z" />
      <circle cx="8.5" cy="8.5" r="1" />
    </>
  ),
  chart: <path d="M5 20V10M12 20V5M19 20v-7" />,
  bulb: <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.5.4.5 1.1.5 1.6V16h6v-.5c0-.5 0-1.2.5-1.6A6 6 0 0 0 12 3z" />,
  star: <path d="M12 4l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6L7.1 19.2l.9-5.5-4-3.9 5.5-.8z" />,
  bolt: <path d="M13 3L5 13h6l-1 8 8-10h-6z" />,
  scan: <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M8 9v6M12 9v6M16 9v6" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4.2-4.2" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7H8l1.2-2h5.6L16 7h2.5A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" />
      <circle cx="12" cy="13" r="3.2" />
    </>
  ),
  book: <path d="M6 4h10a2 2 0 0 1 2 2v14H8a2 2 0 0 1-2-2zM6 18a2 2 0 0 1 2-2h10M10 8h5" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
    </>
  ),
  sparkles: <path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6zM18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z" />,
  calc: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" />
    </>
  ),
  download: <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />,
  upload: <path d="M12 16V5M7 9l5-5 5 5M5 20h14" />,
  save: <path d="M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6" />,
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 12h.01" />
    </>
  ),
  palette: (
    <>
      <path d="M12 4a8 8 0 1 0 0 16c1.2 0 1.8-.8 1.4-1.8-.4-1 .2-2.2 1.4-2.2H17a3 3 0 0 0 3-3A8 8 0 0 0 12 4z" />
      <path d="M8 11h.01M11 8h.01M15 9h.01" />
    </>
  ),
  smile: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 14a4 4 0 0 0 7 0M9 9.5h.01M15 9.5h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
  scale: <path d="M12 4v16M7 20h10M5 7h14M5 7l-2 6a3 3 0 0 0 4 0zM19 7l-2 6a3 3 0 0 0 4 0z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  warning: <path d="M12 4l9 16H3zM12 10v4M12 17h.01" />,
  leaf: <path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14M5 19l7-7" />,
  ghost: <path d="M6 20V11a6 6 0 0 1 12 0v9l-3-2-3 2-3-2zM10 11h.01M14 11h.01" />,
  sliders: (
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </>
  )
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;

export function Icon({ name }: { name: IconName }) {
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

// Les emojis qu'on trouve au début des textes, et l'icône qui les remplace
const EMOJI_ICONS: Record<string, IconName> = {
  '🔥': 'flame', '🗑': 'trash', '🏷': 'tag', '📊': 'chart', '✏': 'pencil', '💡': 'bulb', '⭐': 'star',
  '⚡': 'bolt', '📱': 'scan', '🔍': 'search', '🎥': 'camera', '📚': 'book', '🌍': 'globe', '🤖': 'sparkles',
  '📷': 'camera', '🧮': 'calc', '📥': 'download', '📤': 'upload', '💾': 'save', '🎯': 'target', '🎨': 'palette',
  '😏': 'smile', 'ℹ': 'info', '❤': 'heart', '⚖': 'scale', '😴': 'moon', '⚠': 'warning', '🌿': 'leaf',
  '🎃': 'ghost', '⚙': 'sliders', '☀': 'sun', '🌙': 'moon'
};
// Ces emojis n'ont pas d'icône : on les retire simplement (sablier, coches)
const DROPPED = ['⏳', '✅', '❌'];

/** Un texte qui commence par un emoji : on affiche l'icône correspondante à la place */
export function withIcon(text: string): ReactNode {
  const match = /^(\p{Extended_Pictographic})️?\s*/u.exec(text);
  if (!match) return text;
  const rest = text.slice(match[0].length);
  if (DROPPED.includes(match[1])) return rest;
  const name = EMOJI_ICONS[match[1]];
  return name ? (
    <>
      <Icon name={name} />
      <span>{rest}</span>
    </>
  ) : (
    text
  );
}

/** Comme t(), mais un emoji au début du texte devient une icône */
export function ti(fr: string, params?: Record<string, string | number>): ReactNode {
  return withIcon(t(fr, params));
}
