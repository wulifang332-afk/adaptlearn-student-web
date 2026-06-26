import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AdaptLearn Foundational Console",
  description: "Platform foundation console for AdaptLearn tenant, RLS, storage, RAG, agents, tools, queues, audit, environment, and generated CRUD governance.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
