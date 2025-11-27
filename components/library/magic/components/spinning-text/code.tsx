import { SpinningText } from "@/registry/magicui/spinning-text"

export function SpinningTextBasic() {
  return (
    <SpinningText reverse className="text-4xl" duration={4} radius={6}>
      learn more • earn more • grow more •
    </SpinningText>
  )
}