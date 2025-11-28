import { SVGProps } from "react"

export interface IphoneProps extends SVGProps<SVGSVGElement> {
  width?: number
  height?: number
  src?: string
  videoSrc?: string
}

export function Iphone({
  width = 375,
  height = 812,
  src,
  videoSrc,
  ...props
}: IphoneProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M0 60C0 26.8629 26.8629 0 60 0H315C348.137 0 375 26.8629 375 60V752C375 785.137 348.137 812 315 812H60C26.8629 812 0 785.137 0 752V60Z"
        className="fill-[#E5E5E5] dark:fill-[#404040]"
      />
      <path
        d="M2 61C2 28.3563 28.3563 2 61 2H314C346.644 2 373 28.3563 373 61V751C373 783.644 346.644 810 314 810H61C28.3563 810 2 783.644 2 751V61Z"
        className="fill-white dark:fill-[#262626]"
      />
      <rect
        x="10"
        y="20"
        width="355"
        height="772"
        rx="40"
        className="fill-[#E5E5E5] stroke-[#E5E5E5] stroke-[0.5] dark:fill-[#404040] dark:stroke-[#404040]"
      />
      <rect
        x="12"
        y="22"
        width="351"
        height="768"
        rx="38"
        className="fill-black dark:fill-white"
      />
      {src && (
        <image
          href={src}
          width="351"
          height="768"
          x="12"
          y="22"
          rx="38"
          className="object-cover"
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#iphone-screen)"
        />
      )}
      {videoSrc && (
        <foreignObject
          x="12"
          y="22"
          width="351"
          height="768"
          clipPath="url(#iphone-screen)"
        >
          <video
            className="size-full object-cover"
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
          />
        </foreignObject>
      )}
      <defs>
        <clipPath id="iphone-screen">
          <rect
            x="12"
            y="22"
            width="351"
            height="768"
            rx="38"
          />
        </clipPath>
      </defs>
    </svg>
  )
}

