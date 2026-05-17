"use client";

import Link from "next/link";
import { Mail, MapPin, Phone, Clock, MessageCircle, LogIn } from "lucide-react";
import { PublicPageShell } from "@/components/public-page-shell";
import {
  BlueCtaBanner,
  ContactCard,
  FadeIn,
  StaggerGrid,
} from "@/components/public-fancy";

export function ContactContent() {
  return (
    <PublicPageShell
      title="Contact"
      description="Get in touch with Regional Maritime University for internship portal support, letters, and placements."
      badge="We're here to help"
    >
      <FadeIn>
        <p className="rounded-2xl border border-primary/20 bg-secondary/40 px-5 py-4 text-sm leading-relaxed text-muted-foreground">
          For questions about internship letters, placements, or technical issues, use the
          contacts below. Students should include their <strong className="text-foreground">full name</strong>,{" "}
          <strong className="text-foreground">student ID</strong>, and{" "}
          <strong className="text-foreground">department</strong> in all enquiries.
        </p>
      </FadeIn>

      <StaggerGrid className="grid gap-5 sm:grid-cols-2">
        <ContactCard icon={MapPin} title="Campus address" delay={0}>
          Regional Maritime University
          <br />
          Nungua, Accra
          <br />
          Ghana
        </ContactCard>

        <ContactCard icon={Mail} title="Email" delay={0.08}>
          <p>
            General:{" "}
            <a href="mailto:info@rmu.edu.gh">info@rmu.edu.gh</a>
          </p>
          <p className="mt-2">
            Internships:{" "}
            <a href="mailto:internships@rmu.edu.gh">internships@rmu.edu.gh</a>
          </p>
        </ContactCard>

        <ContactCard icon={Phone} title="Phone" delay={0.16}>
          Main line:{" "}
          <a href="tel:+233302719150">+233 30 271 9150</a>
        </ContactCard>

        <ContactCard icon={Clock} title="Office hours" delay={0.24}>
          Monday – Friday, 8:00 AM – 4:30 PM (GMT)
          <br />
          Excluding public holidays
        </ContactCard>
      </StaggerGrid>

      <StaggerGrid className="grid gap-5 md:grid-cols-2">
        <FadeIn delay={0.1}>
          <div className="flex h-full flex-col justify-center rounded-2xl border border-dashed border-primary/30 bg-gradient-to-br from-secondary/50 to-card p-6">
            <MessageCircle className="mb-3 h-8 w-8 text-primary" />
            <h3 className="mb-2 font-semibold text-foreground">Student support</h3>
            <p className="text-sm text-muted-foreground">
              Letter requests, placement confirmations, and dashboard access — our team
              responds during office hours.
            </p>
          </div>
        </FadeIn>
        <FadeIn delay={0.18}>
          <div className="flex h-full flex-col justify-center rounded-2xl border border-dashed border-accent/30 bg-gradient-to-br from-secondary/30 to-card p-6">
            <LogIn className="mb-3 h-8 w-8 text-accent" />
            <h3 className="mb-2 font-semibold text-foreground">Already registered?</h3>
            <p className="text-sm text-muted-foreground">
              Sign in to track requests from your dashboard. Need a password reset? Use the{" "}
              <Link href="/login?forgot=1">forgot password</Link> flow from the login page.
            </p>
          </div>
        </FadeIn>
      </StaggerGrid>

      <BlueCtaBanner title="Sign in to your dashboard">
        <Link href="/login">Log in</Link> to manage letter requests, placements, and notices.
        New student? <Link href="/register">Register here</Link> with your @st.rmu.edu.gh email.
      </BlueCtaBanner>
    </PublicPageShell>
  );
}
