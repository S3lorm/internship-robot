"use client";

import Link from "next/link";
import {
  Ship,
  GraduationCap,
  FileText,
  Users,
  Anchor,
  Building2,
} from "lucide-react";
import { PublicPageShell } from "@/components/public-page-shell";
import {
  BlueCtaBanner,
  FancyCard,
  StaggerGrid,
} from "@/components/public-fancy";

export function AboutContent() {
  return (
    <PublicPageShell
      title="About Us"
      description="The Regional Maritime University internship portal connects students, staff, and partner organizations across Ghana's maritime sector."
      badge="Our story"
    >
      <StaggerGrid className="grid gap-6 md:grid-cols-2">
        <FancyCard icon={Building2} title="Regional Maritime University" accent="primary" delay={0}>
          <p>
            RMU is a leading institution for maritime, engineering, and port-related
            education in West Africa. Our internship programme gives students practical
            industry experience with partner organizations across Ghana and beyond.
          </p>
        </FancyCard>

        <FancyCard icon={Ship} title="Maritime excellence" accent="accent" delay={0.08}>
          <p>
            From nautical science to port administration, our graduates enter the workforce
            with skills shaped by real-world exposure — supported by a digital portal built
            for clarity and accountability.
          </p>
        </FancyCard>
      </StaggerGrid>

      <FancyCard icon={Anchor} title="About this portal" accent="blend" delay={0.12} className="md:col-span-2">
        <p className="mb-4">
          The RMU Internship Portal is the university&apos;s online system for managing the
          full internship journey — from discovering partner companies to requesting
          introduction letters, HOD review, and official placement confirmation.
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {[
            "Browse partner companies by department",
            "Submit and track letter requests",
            "HOD review and official placement",
            "University announcements in one place",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {item}
            </li>
          ))}
        </ul>
      </FancyCard>

      <StaggerGrid className="grid gap-6 md:grid-cols-3">
        <FancyCard icon={GraduationCap} title="Students" accent="primary" delay={0}>
          <p>Manage your internship workflow, requests, and placements from one dashboard.</p>
        </FancyCard>
        <FancyCard icon={Users} title="Heads of Department" accent="accent" delay={0.08}>
          <p>Review and approve requests for students in your academic programme.</p>
        </FancyCard>
        <FancyCard icon={FileText} title="Administrators" accent="blend" delay={0.16}>
          <p>Publish notices, oversee placements, and keep the system running smoothly.</p>
        </FancyCard>
      </StaggerGrid>

      <BlueCtaBanner title="Ready to set sail?">
        <Link href="/register">Create a student account</Link> or{" "}
        <Link href="/login">sign in</Link> if you already have one. Your maritime career
        starts with the right placement — we&apos;re here to help you get there.
      </BlueCtaBanner>
    </PublicPageShell>
  );
}
