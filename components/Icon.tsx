'use client'

interface IconProps {
  name: string
  className?: string
}

export default function Icon({ name, className = 'w-5 h-5' }: IconProps) {
  return (
    <div
      className={className}
      style={{
        backgroundColor: 'currentColor',
        mask: `url(/icons/${name}.svg) center/contain no-repeat`,
        WebkitMask: `url(/icons/${name}.svg) center/contain no-repeat`,
      }}
    />
  )
}
