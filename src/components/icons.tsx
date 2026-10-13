const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 20 20',
  fill: 'none',
  'aria-hidden': true,
} as const;

export const GripIcon = () => (
  <svg {...base}>
    {[6, 10, 14].map((y) => [7.5, 12.5].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.25" fill="currentColor" />))}
  </svg>
);

export const CloseIcon = () => (
  <svg {...base}>
    <path d="M5.5 5.5l9 9M14.5 5.5l-9 9" stroke="currentColor" stroke-width="1.25" />
  </svg>
);

export const ArrowLeftIcon = () => (
  <svg {...base}>
    <path d="M16 10H4.5M9 5.5L4.5 10 9 14.5" stroke="currentColor" stroke-width="1.25" />
  </svg>
);

export const ArrowRightIcon = () => (
  <svg {...base}>
    <path d="M4 10h11.5M11 5.5l4.5 4.5-4.5 4.5" stroke="currentColor" stroke-width="1.25" />
  </svg>
);
