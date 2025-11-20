"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Team, Group } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TeamComponent from "@/components/team";

interface GroupCardProps {
  groupName: Group;
  teams: Team[];
}

export function GroupCard({ groupName, teams }: GroupCardProps) {
  const sortedTeams = [...teams].sort((a, b) => (a.positionInGroup || 0) - (b.positionInGroup || 0));

  return (
    <Card className="shadow-md transition-all hover:shadow-xl bg-card">
      <CardHeader className="p-3 bg-secondary/50">
        <CardTitle className="text-lg text-primary text-center">
          Group {groupName}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-2 min-h-[220px]">
        <AnimatePresence>
          {Array.from({ length: 4 }).map((_, index) => {
            const team = sortedTeams.find(t => t.positionInGroup === index + 1);
            return (
              <motion.div
                key={team ? team.code : `empty-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-3 p-2 rounded-md bg-background"
              >
                <span className="font-bold text-muted-foreground w-4">{index + 1}</span>
                {team ? (
                  <TeamComponent team={team} />
                ) : (
                  <span className="text-sm text-muted-foreground/70 italic">Empty</span>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
