"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TEAMS } from '@/lib/data';
import type { Team, Pot, Group } from '@/lib/types';
import { shuffle, sleep } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PotCard } from '@/components/pot-card';
import { GroupCard } from '@/components/group-card';
import TeamComponent from '@/components/team';
import { Play, RotateCw, Loader2, Award } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const GROUP_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const HOSTS = {
  'United States': 'D',
  'Mexico': 'A',
  'Canada': 'B'
};

const content = {
  es: {
    simulationControls: "Controles de Simulación",
    startDraw: "Iniciar Sorteo",
    reset: "Reiniciar",
    initialMessage: "Haz clic en 'Iniciar Sorteo' para comenzar la simulación.",
    teamsDrawn: "equipos sorteados",
    drawingFromPot: "Sorteando equipos del Bombo",
    drawComplete: "¡El sorteo ha finalizado!",
    drawErrorTitle: "Error en el Sorteo",
    drawErrorMessage: "No se pudo colocar {teamName}. Por favor, reinicia el sorteo.",
  },
  en: {
    simulationControls: "Simulation Controls",
    startDraw: "Start Draw",
    reset: "Reset",
    initialMessage: "Click 'Start Draw' to begin the simulation.",
    teamsDrawn: "teams drawn",
    drawingFromPot: "Drawing teams from Pot",
    drawComplete: "The draw is complete!",
    drawErrorTitle: "Draw Error",
    drawErrorMessage: "Could not place {teamName}. Please reset the draw.",
  },
};

export default function DrawSimulator({ lang }: { lang: string }) {
  const { toast } = useToast();
  const [pots, setPots] = useState<Record<Pot, Team[]>>({ 1: [], 2: [], 3: [], 4: [] });
  const [groups, setGroups] = useState<Record<Group, Team[]>>(
    Object.fromEntries(GROUP_NAMES.map(name => [name as Group, []])) as Record<Group, Team[]>
  );
  const [isDrawing, setIsDrawing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [currentPick, setCurrentPick] = useState<Team | null>(null);
  const [message, setMessage] = useState("");

  const currentContent = content[lang as keyof typeof content];

  useEffect(() => {
    setMessage(currentContent.initialMessage);
  }, [currentContent.initialMessage]);

  const drawnTeamCount = useMemo(() => {
    return Object.values(groups).flat().length;
  }, [groups]);

  const initializeState = () => {
    const initialPots: Record<Pot, Team[]> = { 1: [], 2: [], 3: [], 4: [] };
    const initialGroups = Object.fromEntries(GROUP_NAMES.map(name => [name as Group, []])) as Record<Group, Team[]>;
    
    const sortedHosts = Object.keys(HOSTS).sort((a,b) => a.localeCompare(b));

    const teamsToPlace = [...TEAMS];
    
    sortedHosts.forEach(hostName => {
        const teamIndex = teamsToPlace.findIndex(t => t.name === hostName);
        if (teamIndex > -1) {
            const team = teamsToPlace[teamIndex];
            const groupName = HOSTS[hostName as keyof typeof HOSTS] as Group;
            initialGroups[groupName].push({ ...team, positionInGroup: 1 });
            teamsToPlace.splice(teamIndex, 1);
        }
    });

    teamsToPlace.forEach(team => {
        initialPots[team.pot as Pot].push(team);
    });

    setPots(initialPots);
    setGroups(initialGroups);
    setIsDrawing(false);
    setIsFinished(false);
    setCurrentPick(null);
    setMessage(currentContent.initialMessage);
  };

  useEffect(() => {
    initializeState();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const isGroupValid = (team: Team, group: Team[]): boolean => {
    if (group.length >= 4) return false;
    
    const uefaCount = group.filter(t => t.confederation === 'UEFA').length;
    if (team.confederation === 'UEFA') {
      if (uefaCount >= 2) return false;
    } else {
      if (group.some(t => t.confederation === team.confederation)) return false;
    }
    return true;
  };

  const startDraw = async () => {
    setIsDrawing(true);
    setIsFinished(false);
    
    let tempPots = JSON.parse(JSON.stringify(pots));
    Object.keys(tempPots).forEach(potNum => {
      tempPots[potNum] = shuffle(tempPots[potNum]);
    });
    let tempGroups = JSON.parse(JSON.stringify(groups));

    for (let potNum = 1; potNum <= 4; potNum++) {
      if (tempPots[potNum].length === 0) continue;
      
      setMessage(`${currentContent.drawingFromPot} ${potNum}...`);
      await sleep(1000);

      for (const team of tempPots[potNum]) {
        setCurrentPick(team);
        await sleep(1500);
        
        const availableGroups = shuffle(GROUP_NAMES.filter(g => tempGroups[g as Group].length < 4));
        
        let placed = false;
        for (const groupName of availableGroups) {
          if (isGroupValid(team, tempGroups[groupName as Group])) {
            const position = tempGroups[groupName as Group].length + 1;
            tempGroups[groupName as Group].push({ ...team, positionInGroup: position as Pot });
            placed = true;
            break;
          }
        }

        if (!placed) {
            toast({
              variant: "destructive",
              title: currentContent.drawErrorTitle,
              description: currentContent.drawErrorMessage.replace('{teamName}', team.name),
            })
            setIsDrawing(false);
            return;
        }

        setGroups({ ...tempGroups });
        await sleep(500);
      }
      tempPots[potNum] = [];
      setPots(current => ({...current, ...tempPots}));
      setCurrentPick(null);
    }
    
    setMessage(currentContent.drawComplete);
    setIsDrawing(false);
    setIsFinished(true);
  };

  const handleReset = () => {
    initializeState();
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg overflow-hidden border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary via-blue-800 to-primary text-primary-foreground p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">{currentContent.simulationControls}</h2>
            <div className="flex items-center gap-4">
              <Button onClick={startDraw} disabled={isDrawing || isFinished} className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md">
                {isDrawing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                {currentContent.startDraw}
              </Button>
              <Button onClick={handleReset} variant="outline" className="bg-background/80 hover:bg-background text-foreground shadow-md">
                <RotateCw className="mr-2 h-4 w-4" />
                {currentContent.reset}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 bg-secondary/30">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-24">
            <div className="text-center sm:text-left">
              <p className="font-semibold text-primary">{message}</p>
              <p className="text-sm text-muted-foreground">{drawnTeamCount} of 48 {currentContent.teamsDrawn}.</p>
            </div>
            <div className="w-full sm:w-72 h-full">
              <AnimatePresence>
                {currentPick && (
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="h-full"
                  >
                    <Card className="h-full border-accent border-2 shadow-2xl animate-pulse flex items-center justify-center p-2 bg-card">
                       <TeamComponent team={currentPick} />
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
               {!currentPick && isFinished && (
                  <div className="h-full flex flex-col items-center justify-center text-center text-primary">
                    <Award className="h-8 w-8 text-amber-500" />
                    <p className="font-bold mt-2">{currentContent.drawComplete}</p>
                  </div>
               )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(pots).map(([num, teams]) => (
          <PotCard key={num} potNumber={num as unknown as Pot} teams={teams} lang={lang} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {GROUP_NAMES.map(groupName => (
          <GroupCard key={groupName} groupName={groupName as Group} teams={groups[groupName as Group]} lang={lang} />
        ))}
      </div>
    </div>
  );
}
