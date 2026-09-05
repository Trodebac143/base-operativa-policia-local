"use client";

export type PrimarySection = "home" | "search" | "library" | "help";

type Props = {
  active: PrimarySection;
  onHome: () => void;
  onSearch: () => void;
  onLibrary: () => void;
  onHelp: () => void;
};

const items = [
  ["home", "Inicio", "⌂", "onHome"],
  ["search", "Buscar", "⌕", "onSearch"],
  ["library", "Biblioteca", "▤", "onLibrary"],
  ["help", "Ayuda", "?", "onHelp"],
] as const;

export function BottomNavigation(props: Props) {
  const handlers = {
    onHome: props.onHome,
    onSearch: props.onSearch,
    onLibrary: props.onLibrary,
    onHelp: props.onHelp,
  };

  return <nav className="bottom-navigation" aria-label="Navegación principal">
    {items.map(([id, label, icon, handler]) => <button
      type="button"
      key={id}
      className={props.active === id ? "active" : undefined}
      aria-current={props.active === id ? "page" : undefined}
      onClick={handlers[handler]}
    >
      <b className="bottom-navigation-icon" aria-hidden="true">{icon}</b>
      <span>{label}</span>
    </button>)}
  </nav>;
}
