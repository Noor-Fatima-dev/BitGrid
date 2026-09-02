// app/studio/layout.tsx
import { StudioProvider } from "./StudioContext";

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <StudioProvider>{children}</StudioProvider>;
}