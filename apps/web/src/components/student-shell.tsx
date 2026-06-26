"use client";

import { BookOpenCheck, Home, Leaf, Route, Sprout, Trophy, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navItems = [
  { href: "/student", label: "Home", icon: Home },
  { href: "/student/path/PTH01", label: "Path", icon: Route },
  { href: "/student/progress", label: "Progress", icon: Trophy },
  { href: "/student/profile", label: "Profile", icon: UserRound },
];

export function StudentShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const onTask = pathname.startsWith("/student/tasks/");

  return (
    <main className="stage">
      <div className="phone-shell" aria-label="AdaptLearn student web">
        <div className="phone-chrome">
          <div className="status-bar" aria-hidden="true">
            <span>9:41</span>
            <span className="status-icons">5G</span>
          </div>
          <header className={onTask ? "task-topbar" : "student-header"}>
            <Link className="brand-lockup" href="/student" aria-label="AdaptLearn home">
              <span className="brand-mark" aria-hidden="true">
                <Sprout size={24} />
              </span>
              <span>
                <strong>AdaptLearn</strong>
                <small>Xiaoming Zhang</small>
              </span>
            </Link>
            <div className="course-picker" aria-label="Selected course">
              <span className="course-icon" aria-hidden="true">
                <BookOpenCheck size={18} />
              </span>
              <span>Grade 7 English</span>
            </div>
          </header>
        </div>

        <section className="screen-scroll" aria-live="polite">
          {children}
        </section>

        <nav className="bottom-nav" aria-label="Student navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/student"
                ? pathname === "/student"
                : pathname === item.href || pathname.startsWith(item.href.replace("/PTH01", ""));
            return (
              <Link key={item.href} className={active ? "active" : ""} href={item.href}>
                <Icon size={19} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </main>
  );
}

export function SimulationNotice() {
  return (
    <p className="simulation-notice">
      <Leaf size={15} aria-hidden="true" />
      Prototype data; not a real model result.
    </p>
  );
}
