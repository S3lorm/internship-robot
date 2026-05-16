"use client";

import { motion } from "framer-motion";
import { Briefcase, Sparkles } from "lucide-react";
import {
  PartnerInternshipCard,
  partnerCardStagger,
} from "@/components/partner-internship-card";
import type { Internship } from "@/types";

type PartnerInternshipsSectionProps = {
  internships: Internship[];
  isAuthenticated: boolean;
};

export function PartnerInternshipsSection({
  internships,
  isAuthenticated,
}: PartnerInternshipsSectionProps) {
  return (
    <section
      id="internships"
      className="relative overflow-hidden border-y border-primary/10 bg-gradient-to-b from-secondary/30 via-background to-background py-16 md:py-24"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-20 h-80 w-80 rounded-full bg-primary/10 blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-accent/10 blur-3xl"
        animate={{ x: [0, -24, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <motion.div
        className="container relative z-10 mx-auto px-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 text-center"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Industry partners
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.55 }}
            className="mb-4 bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-4xl"
          >
            Partner Companies & Internship Opportunities
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="mx-auto max-w-2xl text-muted-foreground md:text-lg"
          >
            A sample partner company for each RMU department — browse where students
            intern and prepare your letter request and placement details in advance.
          </motion.p>

          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-6 flex h-1 w-24 origin-center rounded-full bg-gradient-to-r from-primary to-accent"
          />

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.45 }}
            className="mx-auto mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Briefcase className="h-4 w-4 text-primary" />
            {internships.length} departments · local partner showcase
          </motion.div>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-48px" }}
          variants={partnerCardStagger}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {internships.map((internship, i) => (
            <PartnerInternshipCard
              key={internship.id}
              internship={internship}
              index={i}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
