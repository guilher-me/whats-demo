/** An illustrative street pattern used offline for every simulated location. */
export function LocationMap() {
  return (
    <svg className="mock-location-map" viewBox="0 0 320 160" aria-hidden="true" focusable="false">
      <path fill="#ebede5" d="M0 0h320v160H0z" />
      <path fill="#d2e5cb" d="M0 0h93l-19 44-51 15L0 43zm226 91 42-19 52 21v67h-82z" />
      <path
        fill="none"
        stroke="#a8d2e7"
        strokeWidth="20"
        d="M280-15c-38 35-44 57-26 80s66 32 77 75"
      />
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="5"
        d="M-12 32 63 91l97 18 173-32M21-12l41 47 57 137m34-184-25 52 54 79 4 52M93-12l17 54 22 12 88-16 34-29M-12 124l88-41m40-20 78-14 37 20 23 43 79 13M44 174l51-56 74-24 58 8m-9-114-24 61m23 123 36-44 75 7"
      />
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="10"
        d="M-10 69 80 55l89 18 59 25 101 17M90 174l60-78 31-50 26-58"
      />
      <path
        fill="none"
        stroke="#f0d392"
        strokeWidth="6"
        d="M-10 69 80 55l89 18 59 25 101 17M90 174l60-78 31-50 26-58"
      />
      <ellipse cx="160" cy="107" rx="12" ry="4" fill="#283a32" opacity=".19" />
      <path
        d="M160 107c-3-5-15-17-15-28a15 15 0 1 1 30 0c0 11-12 23-15 28Z"
        fill="#dc5148"
        stroke="#fff"
        strokeWidth="2"
      />
      <circle cx="160" cy="79" r="5" fill="#fff" />
    </svg>
  );
}
