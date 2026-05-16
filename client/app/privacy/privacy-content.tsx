"use client";

import Link from "next/link";
import { Shield, Lock, Eye, Share2, Database, UserCheck, RefreshCw } from "lucide-react";
import { PublicPageShell } from "@/components/public-page-shell";
import { BlueCtaBanner, FadeIn, PolicyStep, StaggerGrid } from "@/components/public-fancy";

const sections = [
  {
    icon: Shield,
    number: 1,
    title: "Introduction",
    content: (
      <p>
        Regional Maritime University (&quot;RMU&quot;, &quot;we&quot;, &quot;us&quot;) operates the RMU Internship
        Portal. This policy explains what personal data we collect, why we collect it, and
        how we protect it when you use this website and related services.
      </p>
    ),
  },
  {
    icon: Eye,
    number: 2,
    title: "Information we collect",
    content: (
      <>
        <p>Depending on your role, we may collect:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Account details (name, university email, student ID, department, programme)</li>
          <li>Internship and placement information you submit</li>
          <li>Communications sent through the portal</li>
          <li>Technical data such as browser type and access logs</li>
        </ul>
      </>
    ),
  },
  {
    icon: Database,
    number: 3,
    title: "How we use your information",
    content: (
      <p>
        We use personal data to operate the internship workflow, verify identities, route
        requests to the appropriate department, send required notifications, and improve
        system reliability. We do not sell your personal information to third parties.
      </p>
    ),
  },
  {
    icon: Share2,
    number: 4,
    title: "Sharing of information",
    content: (
      <p>
        Information may be shared with authorised RMU staff, your Head of Department, and
        host organizations only when necessary to process your internship letter or official
        placement. We may also disclose information when required by law.
      </p>
    ),
  },
  {
    icon: Lock,
    number: 5,
    title: "Data retention and security",
    content: (
      <p>
        We retain records in line with university requirements. Access controls,
        authentication, and secure hosting are used to reduce unauthorised access, loss, or
        misuse of data.
      </p>
    ),
  },
  {
    icon: UserCheck,
    number: 6,
    title: "Your rights",
    content: (
      <p>
        You may request correction of inaccurate profile information through your dashboard
        or by contacting the university. For privacy questions, please use our{" "}
        <Link href="/contact">Contact</Link> page.
      </p>
    ),
  },
  {
    icon: RefreshCw,
    number: 7,
    title: "Changes to this policy",
    content: (
      <p>
        We may update this policy from time to time. Material changes will be reflected on
        this page with an updated date. Continued use of the portal constitutes acceptance
        of the revised policy.
      </p>
    ),
  },
];

export function PrivacyContent() {
  return (
    <PublicPageShell
      title="Privacy Policy"
      description="Last updated: May 2026. How we collect, use, and protect your information on the RMU Internship Portal."
      badge="Your data, protected"
    >
      <FadeIn>
        <div className="flex items-center gap-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 p-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg shadow-primary/30">
            <Shield className="h-7 w-7" />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We are committed to handling your personal information responsibly and in line
            with university standards. This policy applies to all users of the internship
            portal.
          </p>
        </div>
      </FadeIn>

      <StaggerGrid className="space-y-4">
        {sections.map((section, i) => (
          <PolicyStep
            key={section.number}
            number={section.number}
            title={section.title}
            delay={i * 0.05}
          >
            {section.content}
          </PolicyStep>
        ))}
      </StaggerGrid>

      <BlueCtaBanner title="Questions about your data?">
        Reach out via our <Link href="/contact">Contact page</Link> and include your full
        name, student ID, and department so we can assist you promptly.
      </BlueCtaBanner>
    </PublicPageShell>
  );
}
