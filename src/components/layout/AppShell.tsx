// src/components/layout/AppShell.tsx
"use client";

import { Header }    from "./Header";
import { BottomNav } from "./BottomNav";
import type { TabId } from "./BottomNav";

type HeaderProps = Omit<React.ComponentProps<typeof Header>, "activeTab">;

interface AppShellProps {
  children:    React.ReactNode;
  activeTab:   TabId;
  headerProps?: HeaderProps;
}

export function AppShell({ children, activeTab, headerProps }: AppShellProps) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)", fontFamily: "var(--font-sans)", color: "var(--color-ink)", maxWidth: 480, margin: "0 auto", position: "relative" }}>
      <Header activeTab={activeTab} {...headerProps} />
      <main style={{ paddingBottom: 112 }}>
        {children}
      </main>
      <BottomNav activeTab={activeTab} />
    </div>
  );
}
