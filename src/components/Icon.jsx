const paths = {
  dashboard: <><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="5" rx="1.5" /><rect x="13" y="10" width="8" height="11" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /></>,
  products: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.5 7.8 7.5 4.3 7.5-4.3M12 12v9" /></>,
  inventory: <><path d="M4 5h16M4 12h16M4 19h16" /><path d="M8 3v4m8-4v4M8 10v4m8-4v4M8 17v4m8-4v4" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.8-.6a8 8 0 0 1-1.5.9l-.3 1.9h-2.8l-.3-1.9a8 8 0 0 1-1.5-.9l-1.8.6-1.4-2.4L7.5 15a7 7 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.8.6a8 8 0 0 1 1.5-.9l.3-1.9h2.8l.3 1.9a8 8 0 0 1 1.5.9l1.8-.6 1.4 2.4-1.4 1.1a7 7 0 0 1-.1 1.8Z" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
  eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
  eyeOff: <><path d="m3 3 18 18M10.6 6.2A10.7 10.7 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.1 3.6M6.2 6.7C3.5 8.3 2 12 2 12s3.5 6 10 6c1 0 1.9-.2 2.7-.5" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  warning: <><path d="M10.3 3.8 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4m0 3h.01" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  arrow: <><path d="M5 12h14m-7-7 7 7-7 7" /></>,
  logout: <><path d="M10 17l5-5-5-5m5 5H3" /><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></>,
}

export default function Icon({ name, size = 18, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name] || paths.dashboard}
    </svg>
  )
}
