"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Team, Pot } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TeamComponent from "@/components/team";

interface PotCardProps {
  potNumber: Pot;
  teams: Team[];
  lang: string;
}

const content = {
    es: {
      pot: "Bombo",
    },
    en: {
      pot: "Pot",
    },
  };

export function PotCard({ potNumber, teams, lang }: PotCardProps) {
    const currentContent = content[lang as keyof typeof content];
  return (
    <Card className="shadow-md bg-card">
      <CardHeader className="p-3 bg-secondary/50">
        <CardTitle className="text-md text-primary font-bold">{currentContent.pot} {potNumber}</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="grid grid-cols-2 gap-2">
          <AnimatePresence>
            {teams.map((team) => (
              <motion.div
                key={team.code}
                layout
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.3 }}
              >
                <TeamComponent team={team} variant="small" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
