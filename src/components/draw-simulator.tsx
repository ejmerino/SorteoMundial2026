"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TEAMS } from '@/lib/data';
import type { Team, Pot, Group } from '@/lib/types';
import { shuffle, sleep } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PotCard } from '@/components/pot-card';
import { GroupCard } from '@/components/group-card';
import TeamComponent from '@/components/team';
import { Play, RotateCw, Loader2, Award, Zap, Film } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const GROUP_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const HOSTS: Record<string, Group> = {
  'Mexico': 'A',
  'Canada': 'B',
  'United States': 'D'
};

const content = {
  es: {
    simulationControls: "Controles de Simulación",
    fastDraw: "Sorteo Rápido",
    animatedDraw: "Sorteo Animado",
    reset: "Reiniciar",
    initialMessage: "Selecciona un modo de sorteo para comenzar.",
    teamsDrawn: "equipos sorteados",
    drawingFromPot: "Sorteando equipos del Bombo",
    drawComplete: "¡El sorteo ha finalizado!",
    drawErrorTitle: "Error en el Sorteo",
    drawErrorMessage: "No se pudo colocar a {teamName}. Por favor, reinicia el sorteo.",
    pot: "Bombo",
  },
  en: {
    simulationControls: "Simulation Controls",
    fastDraw: "Fast Draw",
    animatedDraw: "Animated Draw",
    reset: "Reset",
    initialMessage: "Select a draw mode to begin.",
    teamsDrawn: "teams drawn",
    drawingFromPot: "Drawing teams from Pot",
    drawComplete: "The draw is complete!",
    drawErrorTitle: "Draw Error",
    drawErrorMessage: "Could not place {teamName}. Please reset the draw.",
    pot: "Pot",
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
  const [drawMode, setDrawMode] = useState<'fast' | 'animated'>('animated');

  const currentContent = content[lang as keyof typeof content];

  const initializeState = useCallback(() => {
    let initialPots: Record<Pot, Team[]> = { 1: [], 2: [], 3: [], 4: [] };
    let initialGroups = Object.fromEntries(GROUP_NAMES.map(name => [name as Group, []])) as Record<Group, Team[]>;
    
    const teamsToPlace = [...TEAMS];
    
    // Pre-assign hosts
    Object.entries(HOSTS).forEach(([hostName, groupName]) => {
        const teamIndex = teamsToPlace.findIndex(t => t.name === hostName);
        if (teamIndex > -1) {
            const team = teamsToPlace.splice(teamIndex, 1)[0];
            initialGroups[groupName].push({ ...team, positionInGroup: 1 });
        }
    });

    teamsToPlace.forEach(team => {
        if(initialPots[team.pot]) {
          initialPots[team.pot as Pot].push(team);
        }
    });

    Object.keys(initialPots).forEach(potNum => {
      initialPots[potNum as unknown as Pot] = shuffle(initialPots[potNum as unknown as Pot]);
    });

    setPots(initialPots);
    setGroups(initialGroups);
    setIsDrawing(false);
    setIsFinished(false);
    setCurrentPick(null);
    setMessage(currentContent.initialMessage);
  }, [currentContent.initialMessage]);

  useEffect(() => {
    initializeState();
  }, [initializeState, lang]);

  const drawnTeamCount = useMemo(() => {
    return Object.values(groups).flat().length;
  }, [groups]);

  const isGroupValid = (team: Team, group: Team[]): boolean => {
    if (group.length >= 4) return false;
    
    const uefaCount = group.filter(t => t.confederation === 'UEFA').length;
    if (team.confederation === 'UEFA') {
      if (uefaCount >= 2) return false;
    } else {
      if (group.some(t => t.confederation === team.confederation && !t.confederation.startsWith('PLAYOFF'))) return false;
    }
    return true;
  };

  const findValidGroupForTeam = (team: Team, currentGroups: Record<Group, Team[]>) => {
    const availableGroups = shuffle(GROUP_NAMES.filter(g => currentGroups[g as Group].length < 4));
    for (const groupName of availableGroups) {
      if (isGroupValid(team, currentGroups[groupName as Group])) {
        return groupName as Group;
      }
    }
    return null;
  }

  const startDraw = async () => {
    setIsDrawing(true);
    setIsFinished(false);
    
    let tempPots = JSON.parse(JSON.stringify(pots));
    let tempGroups = JSON.parse(JSON.stringify(groups));

    const animationDelay = drawMode === 'animated' ? 1500 : 10;
    const potDelay = drawMode === 'animated' ? 1000 : 10;

    for (let potNum = 1; potNum <= 4; potNum++) {
      if (tempPots[potNum].length === 0) continue;
      
      setMessage(`${currentContent.drawingFromPot} ${potNum}...`);
      if (drawMode === 'animated') await sleep(potDelay);

      for (const team of tempPots[potNum]) {
        if (drawMode === 'animated') {
          setCurrentPick(team);
          await sleep(animationDelay);
        }
        
        const validGroup = findValidGroupForTeam(team, tempGroups);

        if (validGroup) {
            const position = tempGroups[validGroup].length + 1;
            tempGroups[validGroup].push({ ...team, positionInGroup: position as Pot });
        } else {
            toast({
              variant: "destructive",
              title: currentContent.drawErrorTitle,
              description: currentContent.drawErrorMessage.replace('{teamName}', team.name),
            })
            setIsDrawing(false);
            initializeState();
            return;
        }

        if (drawMode === 'animated') {
            setGroups({ ...tempGroups });
            await sleep(500);
        }
      }
      tempPots[potNum] = [];
      if (drawMode === 'animated') {
        setPots(current => ({...current, ...tempPots}));
        setCurrentPick(null);
      }
    }
    
    setGroups(tempGroups);
    setPots({ 1: [], 2: [], 3: [], 4: [] });
    setMessage(currentContent.drawComplete);
    setIsDrawing(false);
    setIsFinished(true);
    setCurrentPick(null);
  };

  const handleReset = () => {
    initializeState();
  };

  const renderCurrentPickAnimation = () => {
    if (!currentPick) return null;

    return (
       <motion.div
          key={currentPick.code}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={{
            initial: { opacity: 0, scale: 0.5, y: 100 },
            animate: { 
              opacity: 1, 
              scale: 1, 
              y: 0,
              transition: { 
                type: 'spring', 
                stiffness: 260, 
                damping: 20,
                duration: 0.7
              } 
            },
            exit: { opacity: 0, scale: 0.8, transition: { duration: 0.3 } },
          }}
          className="h-full w-full"
        >
          <Card className="h-full border-accent border-2 shadow-2xl flex items-center justify-center p-2 bg-card/80 backdrop-blur-sm">
              <TeamComponent team={currentPick} />
          </Card>
        </motion.div>
    )
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg overflow-hidden border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary via-blue-800 to-primary text-primary-foreground p-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-lg font-bold">{currentContent.simulationControls}</h2>
            <div className="flex items-center gap-2 sm:gap-4">
              <Tabs value={drawMode} onValueChange={(value) => setDrawMode(value as 'fast' | 'animated')} className="w-auto">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="animated" disabled={isDrawing}>
                    <Film className="mr-2"/> {currentContent.animatedDraw}
                  </TabsTrigger>
                  <TabsTrigger value="fast" disabled={isDrawing}>
                    <Zap className="mr-2"/> {currentContent.fastDraw}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button onClick={startDraw} disabled={isDrawing || isFinished} className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md px-6">
                {isDrawing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              </Button>
              <Button onClick={handleReset} variant="outline" className="bg-background/80 hover:bg-background text-foreground shadow-md">
                <RotateCw className="h-4 w-4" />
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
            <div className="w-full sm:w-72 h-full relative">
              <AnimatePresence mode="wait">
                {isDrawing && drawMode === 'animated' ? (
                  renderCurrentPickAnimation()
                ) : (
                  <motion.div
                    key="status"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center text-center text-primary"
                  >
                    {isFinished ? (
                      <>
                        <Award className="h-8 w-8 text-amber-500" />
                        <p className="font-bold mt-2">{currentContent.drawComplete}</p>
                      </>
                    ) : (
                       !isDrawing && <p className="text-muted-foreground">{currentContent.initialMessage}</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(pots).map(([num, teams]) => (
          <PotCard key={num} potNumber={parseInt(num, 10) as Pot} teams={teams} lang={lang} title={currentContent.pot} />
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
