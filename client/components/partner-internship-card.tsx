"use client";

import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import { Clock, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { publicImageSrc } from "@/lib/department-partner-images";
import type { Internship } from "@/types";
import { cn } from "@/lib/utils";

const cardReveal: Variants = {
  hidden: { opacity: 0, y: 36, scale: 0.94 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

type PartnerInternshipCardProps = {
  internship: Internship;
  index: number;
  isAuthenticated: boolean;
};

export function PartnerInternshipCard({
  internship,
  index,
  isAuthenticated,
}: PartnerInternshipCardProps) {
  const slotsLeft = Math.max(
    0,
    internship.slots - internship.applicationsCount
  );

  return (
    <motion.article
      variants={cardReveal}
      whileHover={{
        y: -10,
        transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
      }}
      className="h-full"
    >
      <Card
        className={cn(
          "group relative h-full overflow-hidden border-primary/20 bg-card/90 backdrop-blur-sm",
          "transition-all duration-500",
          "hover:border-primary/45 hover:shadow-2xl hover:shadow-primary/15"
        )}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-gradient-to-br from-primary/25 to-accent/20 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

        <CardContent className="relative p-0">
          <motion.div
            className="relative h-40 overflow-hidden"
            initial={{ opacity: 0.85 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 + 0.15 }}
          >
            <motion.div
              className="absolute inset-0"
              whileHover={{ scale: 1.08 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            >
              <Image
                src={publicImageSrc(internship.coverImage ?? "/placeholder.jpg")}
                alt={`${internship.company} — ${internship.targetDepartment ?? internship.category}`}
                fill
                unoptimized
                className="object-cover"
              />
            </motion.div>
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/25 to-transparent"
              initial={{ opacity: 0.7 }}
              whileHover={{ opacity: 0.9 }}
              transition={{ duration: 0.35 }}
            />
            <motion.p
              className="absolute bottom-3 left-3 right-3 text-sm font-semibold text-white drop-shadow-md"
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 + 0.25, duration: 0.45 }}
            >
              {internship.company}
            </motion.p>
          </motion.div>

          <div className="space-y-3 p-5">
            <div className="flex flex-wrap items-center gap-2">
              {internship.targetDepartment && (
                <Badge className="border-0 bg-primary text-primary-foreground shadow-sm shadow-primary/20">
                  {internship.targetDepartment}
                </Badge>
              )}
              <Badge variant="secondary">{internship.category}</Badge>
              {internship.isRemote && <Badge variant="outline">Remote</Badge>}
            </div>

            <h3 className="text-lg font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">
              {internship.title}
            </h3>

            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {internship.description}
            </p>

            <motion.div
              className="flex flex-wrap gap-3 text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 + 0.35 }}
            >
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary/80 px-2.5 py-1">
                <MapPin className="h-3 w-3 text-primary" />
                {internship.location}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary/80 px-2.5 py-1">
                <Clock className="h-3 w-3 text-primary" />
                {internship.duration}
              </span>
            </motion.div>

            <div className="flex items-center justify-between border-t border-primary/10 pt-4">
              <motion.span
                className="text-xs text-muted-foreground"
                whileHover={{ scale: 1.02 }}
              >
                <span className="font-semibold text-primary">{slotsLeft}</span> slots
                remaining
              </motion.span>
              <span className="text-xs font-medium text-accent transition-colors group-hover:text-primary">
                {isAuthenticated ? "Track via dashboard →" : "Sign in to continue →"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.article>
  );
}

export const partnerCardStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.06 } },
};
