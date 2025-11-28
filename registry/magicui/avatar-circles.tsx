import { HTMLAttributes } from "react"

import { cn } from "@/lib/utils"

type Avatar = {
  imageUrl: string
  profileUrl?: string
}

type AvatarCirclesProps = HTMLAttributes<HTMLDivElement> & {
  avatarUrls: Avatar[]
  numPeople?: number
}

const AvatarCircles = ({
  avatarUrls,
  numPeople,
  className,
  ...props
}: AvatarCirclesProps) => {
  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <div className="flex -space-x-3">
        {avatarUrls.slice(0, 5).map((avatar, idx) => (
          <a
            key={avatar.imageUrl + idx}
            href={avatar.profileUrl}
            className="size-10 overflow-hidden rounded-full border-2 border-background ring-1 ring-border/80"
            target="_blank"
            rel="noreferrer"
          >
            <img
              src={avatar.imageUrl}
              alt="Avatar"
              className="size-full object-cover"
              loading="lazy"
            />
          </a>
        ))}
      </div>
      {numPeople ? (
        <span className="text-sm font-medium text-muted-foreground">
          +{numPeople} contributors
        </span>
      ) : null}
    </div>
  )
}

export { AvatarCircles }
