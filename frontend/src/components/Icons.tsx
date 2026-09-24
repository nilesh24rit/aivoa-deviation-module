interface IconProps {
  size?: number
  className?: string
}

export const SparklesIcon = ({ size = 18, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3z"
      fill="currentColor"
    />
    <path
      d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14z"
      fill="currentColor"
      opacity="0.7"
    />
    <path
      d="M5 15l.7 1.6L7.3 17l-1.6.7L5 19.3l-.7-1.6L2.7 17l1.6-.4L5 15z"
      fill="currentColor"
      opacity="0.7"
    />
  </svg>
)

export const DocIcon = ({ size = 34, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M6 2.75h7.6c.4 0 .78.16 1.06.44l4.15 4.15c.28.28.44.66.44 1.06V20.25a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.75a1 1 0 0 1 1-1z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path d="M13.25 2.9v4.3a1 1 0 0 0 1 1h4.3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8.5 13h7M8.5 16.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export const SendIcon = ({ size = 18, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M3.4 20.6L21.5 12 3.4 3.4l2.3 7.1 10.3 1.5-10.3 1.5-2.3 7.1z"
      fill="currentColor"
    />
  </svg>
)

export const SaveIcon = ({ size = 16, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M5 3.75h11.2L20.25 7.8V19a1.25 1.25 0 0 1-1.25 1.25H5A1.25 1.25 0 0 1 3.75 19V5A1.25 1.25 0 0 1 5 3.75z"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path d="M7.5 3.75v5h7v-5M7.5 20.25v-6h9v6" stroke="currentColor" strokeWidth="1.6" />
  </svg>
)

export const ResetIcon = ({ size = 16, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v4h4"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const SearchIcon = ({ size = 16, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
    <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
)

export const CheckCircleIcon = ({ size = 16, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
    <path
      d="M8 12.2l2.6 2.6L16 9.4"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const AlertIcon = ({ size = 16, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M12 3.5L21.5 20H2.5L12 3.5z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <path d="M12 9.5v4.5M12 16.8v.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
)

export const BellIcon = ({ size = 18, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M6.5 9.5a5.5 5.5 0 1 1 11 0c0 4 1.5 5.5 1.5 5.5H5s1.5-1.5 1.5-5.5z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="M10 18.5a2 2 0 0 0 4 0"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
)

export const BuildingIcon = ({ size = 15, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M4 20.5V5.2c0-.66.54-1.2 1.2-1.2h8.6c.66 0 1.2.54 1.2 1.2v15.3M15 10.5h3.8c.66 0 1.2.54 1.2 1.2v8.8M2.5 20.5h19"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.5 8h4M7.5 11.5h4M7.5 15h4"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
)

export const ChevronDownIcon = ({ size = 14, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M6 9.5l6 6 6-6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const LogoMark = ({ size = 26, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
    <path d="M4 26L16 4l12 22H4z" fill="#1d4ed8" />
    <path d="M16 4l12 22H16V4z" fill="#3b82f6" />
    <path d="M11 21.5h10" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
)

export const ArrowLeftIcon = ({ size = 16, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M19 12H5M11 6l-6 6 6 6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
