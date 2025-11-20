"use client";

import * as React from 'react';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TEAMS } from '@/lib/data';
import type { Team, Pot, Group, Confederation } from '@/lib/types';
import { shuffle, sleep } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PotCard } from '@/components/pot-card';
import { GroupCard } from '@/components/group-card';
import TeamComponent from '@/components/team';
import Schedule from '@/components/schedule';
import { Play, RotateCw, Loader2, Award, ChevronsRight, Zap, ChevronRight } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';

const GROUP_NAMES: Group[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const HOSTS: Record<string, Group> = {
  'Mexico': 'A',
  'Canada': 'B',
  'United States': 'D'
};

const content = {
  es: {
    startDraw: "Iniciar Sorteo Animado",
    fastDraw: "Sorteo Rápido",
    nextStep: "Siguiente",
    drawTeam: "Sortear Equipo",
    drawGroup: "Asignar Grupo",
    reset: "Reiniciar",
    drawingTeam: "Sorteando equipo del bombo {pot}...",
    assigningGroup: "Asignando grupo para {teamName}...",
    drawComplete: "¡Sorteo finalizado!",
    drawErrorTitle: "Error en el Sorteo",
    drawErrorMessage: "No se pudo colocar a {teamName}. Por favor, reinicia el sorteo.",
    pot: "Bombo",
    group: "Grupo",
    teamDrawn: "Equipo Sorteado",
    groupAssigned: "{teamName} al Grupo {groupName}!",
    toastDescription: "Se une a los equipos del grupo.",
    ready: "Listo para el sorteo",
    scheduleTitle: "Calendario de Partidos",
  },
  en: {
    startDraw: "Start Animated Draw",
    fastDraw: "Fast Draw",
    nextStep: "Next",
    drawTeam: "Draw Team",
    drawGroup: "Assign Group",
    reset: "Reset",
    drawingTeam: "Drawing team from pot {pot}...",
    assigningGroup: "Assigning group for {teamName}...",
    drawComplete: "Draw Complete!",
    drawErrorTitle: "Draw Error",
    drawErrorMessage: "Could not place {teamName}. Please reset the draw.",
    pot: "Pot",
    group: "Group",
    teamDrawn: "Team Drawn",
    groupAssigned: "{teamName} to Group {groupName}!",
    toastDescription: "Joins the teams in the group.",
    ready: "Ready for the draw",
    scheduleTitle: "Match Schedule",
  },
};

type DrawState = 'idle' | 'ready_to_draw_team' | 'drawing_team' | 'team_drawn' | 'drawing_group' | 'group_assigned' | 'finished';

const AnimatedPicker = ({ items, onAnimationComplete, type, selectedItem }: { items: (Team | Group)[], onAnimationComplete: (item: Team | Group) => void, type: 'team' | 'group', selectedItem: Team | Group | null }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    
    const animationDuration = 80;
    const finalItemIndex = useMemo(() => items.findIndex(item => {
        if (type === 'team' && typeof item !== 'string' && typeof selectedItem !== 'string' && selectedItem) {
            return (item as Team).code === (selectedItem as Team).code;
        }
        if (type === 'group' && typeof item === 'string' && typeof selectedItem === 'string') {
            return item === selectedItem;
        }
        return false;
    }), [items, selectedItem, type]);

    useEffect(() => {
        if (!selectedItem || items.length <= 1 || finalItemIndex === -1) {
             if (items.length === 1 && selectedItem) {
                setTimeout(() => onAnimationComplete(selectedItem), 500);
            } else if (selectedItem) {
                 onAnimationComplete(selectedItem);
            }
            return;
        }

        setIsFinished(false);
        let passes = 0;
        const targetPasses = 2;
        
        const interval = setInterval(() => {
            setCurrentIndex(prev => {
                const nextIndex = (prev + 1) % items.length;
                if (nextIndex === 0) passes++;
                if (passes >= targetPasses && nextIndex === finalItemIndex) {
                    clearInterval(interval);
                    setIsFinished(true);
                    setTimeout(() => onAnimationComplete(items[finalItemIndex]), 500);
                }
                return nextIndex;
            });
        }, animationDuration);

        return () => clearInterval(interval);

    }, [items, selectedItem, finalItemIndex, onAnimationComplete]);

    const renderItem = (item: Team | Group) => {
        if (type === 'team' && typeof item !== 'string') {
            return <TeamComponent team={item as Team} variant="large" />;
        }
        if (type === 'group' && typeof item === 'string') {
            return <div className="text-6xl font-black text-center">{item}</div>;
        }
        return null;
    }

    if (!items.length || !selectedItem) return null;

    return (
        <div className="relative h-48 w-full flex items-center justify-center overflow-hidden">
            <AnimatePresence>
                <motion.div
                    key={currentIndex}
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    transition={{ duration: animationDuration / 2000 }}
                    className="absolute"
                >
                    {renderItem(items[currentIndex])}
                </motion.div>
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-b from-card/80 via-transparent to-card/80 pointer-events-none" />
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[120px] border-y-2 border-accent" />
        </div>
    );
};


export default function DrawSimulator({ lang }: { lang: string }) {
  const { toast } = useToast();
  const [pots, setPots] = useState<Record<Pot, Team[]>>({ 1: [], 2: [], 3: [], 4: [] });
  const [groups, setGroups] = useState<Record<Group, Team[]>>(
    Object.fromEntries(GROUP_NAMES.map(name => [name, []])) as Record<Group, Team[]>
  );
  
  const [drawState, setDrawState] = useState<DrawState>('idle');
  const [message, setMessage] = useState("");
  const [currentPot, setCurrentPot] = useState<Pot>(1);
  const [drawnTeam, setDrawnTeam] = useState<Team | null>(null);
  
  const [animatingItems, setAnimatingItems] = useState<(Team | Group)[]>([]);
  const [animationType, setAnimationType] = useState<'team' | 'group'>('team');
  const [selectedItem, setSelectedItem] = useState<Team | Group | null>(null);


  const drawQueue = useRef<Team[]>([]);
  
  const currentContent = content[lang as keyof typeof content];

 const initializeState = useCallback(() => {
    const initialPots: Record<Pot, Team[]> = { 1: [], 2: [], 3: [], 4: [] };
    const initialGroups = Object.fromEntries(GROUP_NAMES.map(name => [name, []])) as Record<Group, Team[]>;
    
    // Separate hosts from other teams
    const hostTeams: Team[] = [];
    TEAMS.forEach(team => {
        if (Object.keys(HOSTS).includes(team.name)) {
            hostTeams.push(team);
        }
    });

    // Pre-assign hosts to their groups
    hostTeams.forEach(team => {
        const groupName = HOSTS[team.name];
        if (groupName) {
            initialGroups[groupName].push({ ...team, positionInGroup: 1 });
        }
    });

    // Create the ordered draw queue
    const teamsToDraw: Team[] = [];
    ([1, 2, 3, 4] as Pot[]).forEach(potNum => {
        const potTeams = TEAMS.filter(t => t.pot === potNum && !Object.keys(HOSTS).includes(t.name));
        
        // "Rigged" logic: sort teams to draw constrained ones first
        potTeams.sort((a,b) => {
            const aIsUefa = a.confederation.startsWith('UEFA');
            const bIsUefa = b.confederation.startsWith('UEFA');
            if (aIsUefa && !bIsUefa) return 1; // b (non-uefa) comes first
            if (!aIsUefa && bIsUefa) return -1; // a (non-uefa) comes first
            return 0;
        });

        teamsToDraw.push(...shuffle(potTeams));
    });
    
    drawQueue.current = teamsToDraw;

    // Populate pots for display purposes
    const displayPots: Record<Pot, Team[]> = { 1: [], 2: [], 3: [], 4: [] };
     TEAMS.forEach(team => {
        if (!Object.keys(HOSTS).includes(team.name)) {
             displayPots[team.pot as Pot].push(team);
        }
    });

    setPots(displayPots);
    setGroups(initialGroups);
    setDrawState('idle');
    setMessage(currentContent.ready);
    setCurrentPot(1);
    setDrawnTeam(null);
    setAnimatingItems([]);
    setSelectedItem(null);
  }, [currentContent.ready]);


  useEffect(() => {
    initializeState();
  }, [initializeState]);

  const drawnTeamCount = useMemo(() => {
    return Object.values(groups).flat().length;
  }, [groups]);

  const isGroupValid = useCallback((team: Team, group: Team[]): boolean => {
    if (group.length >= 4) return false;
    // A group cannot have more than one team from the same pot.
    if (group.some(t => t.pot === team.pot)) return false;

    const uefaCount = group.filter(t => t.confederation === 'UEFA' || t.confederation.startsWith('UEFA_PLAYOFF')).length;

    if (team.confederation === 'UEFA' || team.confederation.startsWith('UEFA_PLAYOFF')) {
      if (uefaCount >= 2) return false;
    } else {
      if (group.some(t => t.confederation === team.confederation && !team.confederation.startsWith('PLAYOFF'))) return false;
    }
    return true;
  }, []);

  const getValidGroupsForTeam = useCallback((team: Team, currentGroups: Record<Group, Team[]>) => {
    return shuffle(GROUP_NAMES.filter(g => isGroupValid(team, currentGroups[g])));
  }, [isGroupValid]);

  const handleStartDraw = (fast = false) => {
    if (fast) {
      runFastDraw();
    } else {
      setDrawState('ready_to_draw_team');
      const nextTeam = drawQueue.current.length > 0 ? drawQueue.current[0] : null;
      if (nextTeam) {
        setCurrentPot(nextTeam.pot);
        setMessage(currentContent.drawingTeam.replace('{pot}', nextTeam.pot.toString()));
      }
    }
  };

  const handleReset = () => {
    initializeState();
  };

 const runFastDraw = useCallback(() => {
    let tempGroups = JSON.parse(JSON.stringify(groups)) as Record<Group, Team[]>;
    const teamsToPlace = [...drawQueue.current];

    function solve(teamIndex: number): boolean {
        if (teamIndex >= teamsToPlace.length) {
            return true; // All teams placed
        }

        const team = teamsToPlace[teamIndex];
        const validGroups = getValidGroupsForTeam(team, tempGroups);

        for (const groupName of validGroups) {
            // Try placing the team
            const newTeamInGroup = { ...team, positionInGroup: team.pot as Pot };
            tempGroups[groupName].push(newTeamInGroup);

            // Recurse
            if (solve(teamIndex + 1)) {
                return true; // Found a valid solution
            }

            // Backtrack
            tempGroups[groupName] = tempGroups[groupName].filter(t => t.code !== team.code);
        }

        return false; // No valid group found for this team
    }

    const success = solve(0);
    
    if (success) {
      for (const groupName in tempGroups) {
          tempGroups[groupName as Group].sort((a, b) => (a.positionInGroup || 0) - (b.positionInGroup || 0));
      }

      setGroups(tempGroups);
      setPots({ 1: [], 2: [], 3: [], 4: [] });
      drawQueue.current = [];
      setDrawState('finished');
      setMessage(currentContent.drawComplete);
    } else {
      toast({ variant: "destructive", title: currentContent.drawErrorTitle, description: "Could not find a valid draw. Please reset." });
      initializeState();
    }
}, [groups, getValidGroupsForTeam, toast, currentContent, initializeState]);

  const handleNextStep = () => {
    if (drawState === 'ready_to_draw_team') {
      if (drawQueue.current.length === 0) {
        setDrawState('finished');
        setMessage(currentContent.drawComplete);
        return;
      }
      
      const teamToDraw = drawQueue.current[0];
      const teamsInPotForAnimation = pots[teamToDraw.pot].filter(t => drawQueue.current.some(dq => dq.code === t.code));
      
      setAnimatingItems(shuffle([...teamsInPotForAnimation]));
      setAnimationType('team');
      setSelectedItem(teamToDraw);
      setDrawState('drawing_team');
      setCurrentPot(teamToDraw.pot);
      setMessage(currentContent.drawingTeam.replace('{pot}', teamToDraw.pot.toString()));

    } else if (drawState === 'team_drawn' && drawnTeam) {
      const validGroups = getValidGroupsForTeam(drawnTeam, groups);
       if (validGroups.length === 0) {
        toast({
            variant: "destructive",
            title: currentContent.drawErrorTitle,
            description: currentContent.drawErrorMessage.replace('{teamName}', drawnTeam.name),
        });
        handleReset();
        return;
      }
      
      const finalGroup = validGroups[0];

      setAnimatingItems(validGroups);
      setAnimationType('group');
      setSelectedItem(finalGroup);
      setDrawState('drawing_group');
      setMessage(currentContent.assigningGroup.replace('{teamName}', drawnTeam.name));
    }
  };

  const onTeamAnimationComplete = (item: Team | Group) => {
    const team = item as Team;
    setDrawnTeam(team);
    setDrawState('team_drawn');
    setAnimatingItems([]);
    setSelectedItem(null);
  }
  
  const onGroupAnimationComplete = (item: Team | Group) => {
      const groupName = item as Group;
      if (!drawnTeam) return;

      const newTeamInGroup = { ...drawnTeam, positionInGroup: drawnTeam.pot as Pot };
      
      // Visually remove the drawn team from its pot
      setPots(prev => ({...prev, [drawnTeam.pot]: prev[drawnTeam.pot].filter(t => t.code !== drawnTeam.code)}));
      
      setGroups(prev => {
        const newGroups = {...prev};
        newGroups[groupName] = [...newGroups[groupName], newTeamInGroup].sort((a,b) => (a.positionInGroup || 0) - (b.positionInGroup || 0));
        return newGroups;
      });
      
      toast({
        title: currentContent.groupAssigned
          .replace('{teamName}', drawnTeam.name)
          .replace('{groupName}', groupName),
        description: currentContent.toastDescription
      });
      
      // Actually remove team from the queue
      drawQueue.current.shift();
      setDrawnTeam(null);
      setAnimatingItems([]);
      setSelectedItem(null);
      
      if (drawQueue.current.length === 0) {
        setDrawState('finished');
        setMessage(currentContent.drawComplete);
      } else {
        const nextTeam = drawQueue.current[0];
        setCurrentPot(nextTeam.pot);
        setMessage(currentContent.drawingTeam.replace('{pot}', nextTeam.pot.toString()));
        setDrawState('ready_to_draw_team');
      }
  }
  
  const renderDrawArea = () => {
    switch (drawState) {
      case 'drawing_team':
      case 'drawing_group':
        return (
          <div className="w-full h-full flex flex-col md:flex-row items-center justify-center gap-4">
              {drawState === 'drawing_group' && (
                <div className="w-full md:w-1/3">
                  <Card className="border-accent border-2 shadow-xl flex items-center justify-center p-2 bg-card/80 backdrop-blur-sm">
                      {drawnTeam && <TeamComponent team={drawnTeam} variant="default" />}
                  </Card>
                </div>
              )}
              <div className="w-full md:w-2/3">
                 <AnimatedPicker 
                  items={animatingItems}
                  onAnimationComplete={drawState === 'drawing_team' ? onTeamAnimationComplete : onGroupAnimationComplete}
                  type={animationType}
                  selectedItem={selectedItem}
                 />
              </div>
           </div>
        );
      case 'team_drawn':
        if (!drawnTeam) return null;
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full gap-2">
            <Badge variant="secondary">{currentContent.teamDrawn}</Badge>
            <TeamComponent team={drawnTeam} variant="large" />
          </motion.div>
        );

      case 'idle':
        return (
           <div className="h-full flex flex-col items-center justify-center text-center">
             <div className="flex flex-col sm:flex-row gap-4">
                 <Button onClick={() => handleStartDraw(false)} size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg px-8 py-6 text-lg">
                    <Play className="mr-2 h-5 w-5" /> {currentContent.startDraw}
                 </Button>
                 <Button onClick={() => handleStartDraw(true)} size="lg" variant="secondary" className="shadow-lg px-8 py-6 text-lg">
                    <Zap className="mr-2 h-5 w-5" /> {currentContent.fastDraw}
                 </Button>
             </div>
          </div>
        );

      default:
        return (
          <div className="h-full flex flex-col items-center justify-center text-center">
            {drawState === 'finished' ? (
              <>
                <Award className="h-10 w-10 text-amber-500" />
                <p className="font-bold mt-2 text-lg">{currentContent.drawComplete}</p>
              </>
            ) : (
              <div className="text-muted-foreground">{currentContent.ready}</div>
            )}
          </div>
        );
    }
  };

  const renderActionButton = () => {
    switch(drawState) {
      case 'ready_to_draw_team':
        return (
          <Button onClick={handleNextStep} size="lg" className="px-8 py-6 text-lg">
            {currentContent.drawTeam} <ChevronsRight className="ml-2 h-5 w-5" />
          </Button>
        );
      case 'team_drawn':
        return (
          <Button onClick={handleNextStep} size="lg" className="px-8 py-6 text-lg">
            {currentContent.drawGroup} <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        );
      case 'drawing_team':
      case 'drawing_group':
        return <Button disabled size="lg" className="px-8 py-6 text-lg"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> ...</Button>
      
      case 'finished':
         return (
          <Button onClick={handleReset} variant="outline" size="lg" className="bg-background/80 hover:bg-background text-foreground shadow-md px-8 py-6 text-lg">
            <RotateCw className="mr-2 h-5 w-5" /> {currentContent.reset}
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg overflow-hidden border-primary/20">
        <CardHeader className="bg-gradient-to-br from-primary/90 to-primary/80 dark:from-primary/50 dark:to-primary/40 text-primary-foreground p-4">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <p className="font-semibold text-lg">{message || (drawState === 'idle' ? currentContent.ready : (drawState === 'finished' ? currentContent.drawComplete : `${currentContent.pot} ${currentPot}`))}</p>
              <p className="text-sm opacity-80">{drawnTeamCount} de 48 equipos sorteados.</p>
            </div>
            {drawState !== 'idle' && (
              <Button onClick={handleReset} variant="ghost" size="icon" className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/20">
                <RotateCw className="h-5 w-5" />
                <span className="sr-only">{currentContent.reset}</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 bg-secondary/30 min-h-[16rem]">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 h-full">
            <div className="w-full sm:w-2/3 h-full relative flex items-center justify-center">
              <AnimatePresence mode="wait">
                {renderDrawArea()}
              </AnimatePresence>
            </div>
            <div className="flex items-center justify-center">
              {(drawState !== 'idle' && drawState !== 'finished') && renderActionButton()}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(pots).map(([num, teams]) => (
          <PotCard 
            key={num} 
            potNumber={parseInt(num, 10) as Pot} 
            teams={teams} 
            lang={lang} 
            title={currentContent.pot}
            isDrawing={drawState !== 'idle' && drawState !== 'finished' && currentPot === parseInt(num, 10)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {GROUP_NAMES.map(groupName => (
          <GroupCard key={groupName} groupName={groupName} teams={groups[groupName]} lang={lang} />
        ))}
      </div>

      {drawState === 'finished' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Schedule groups={groups} lang={lang} />
        </motion.div>
      )}
    </div>
  );
}
