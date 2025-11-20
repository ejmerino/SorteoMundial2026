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

const AnimatedPicker = ({ items, onAnimationComplete, type }: { items: (Team | Group)[], onAnimationComplete: (item: Team | Group) => void, type: 'team' | 'group' }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const duration = 80;
    const totalAnimationTime = items.length * duration + 1000;

    useEffect(() => {
        if (items.length <= 1) {
            if (items.length === 1) setTimeout(() => onAnimationComplete(items[0]), 500);
            return;
        }

        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % items.length);
        }, duration);

        setTimeout(() => {
            clearInterval(interval);
            onAnimationComplete(items[items.length - 1]);
        }, totalAnimationTime - 1000);

        return () => {
            clearInterval(interval);
        };
    }, [items, onAnimationComplete, duration, totalAnimationTime]);

    const renderItem = (item: Team | Group) => {
        if (type === 'team' && typeof item !== 'string') {
            return <TeamComponent team={item as Team} variant="large" />;
        }
        if (type === 'group' && typeof item === 'string') {
            return <div className="text-6xl font-black text-center">{item}</div>;
        }
        return null;
    }

    if (!items.length) return null;

    return (
        <div className="relative h-48 w-full flex items-center justify-center overflow-hidden">
            <AnimatePresence>
                <motion.div
                    key={currentIndex}
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    transition={{ duration: duration / 2000 }}
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

  const drawQueue = useRef<Team[]>([]);
  
  const currentContent = content[lang as keyof typeof content];

  const initializeState = useCallback(() => {
    const initialPots: Record<Pot, Team[]> = { 1: [], 2: [], 3: [], 4: [] };
    const initialGroups = Object.fromEntries(GROUP_NAMES.map(name => [name, []])) as Record<Group, Team[]>;
    
    TEAMS.forEach(team => {
      if (initialPots[team.pot]) {
        initialPots[team.pot as Pot].push(team);
      }
    });

    const teamsToPlace = [...TEAMS];
    
    Object.entries(HOSTS).forEach(([hostName, groupName]) => {
      const team = teamsToPlace.find(t => t.name === hostName);
      if (team) {
        initialGroups[groupName].push({ ...team, positionInGroup: 1 });
        initialPots[team.pot as Pot] = initialPots[team.pot as Pot].filter(t => t.name !== hostName);
      }
    });
    
    const queue: Team[] = [];
    for (let potNum = 1; potNum <= 4; potNum++) {
      const teamsInPot = initialPots[potNum as Pot];
      queue.push(...shuffle(teamsInPot));
    }
    drawQueue.current = queue;

    setPots(initialPots);
    setGroups(initialGroups);
    setDrawState('idle');
    setMessage(currentContent.ready);
    setCurrentPot(1);
    setDrawnTeam(null);
    setAnimatingItems([]);
  }, [currentContent.ready]);

  useEffect(() => {
    initializeState();
  }, [initializeState]);

  const drawnTeamCount = useMemo(() => {
    return Object.values(groups).flat().length;
  }, [groups]);

  const isGroupValid = useCallback((team: Team, group: Team[]): boolean => {
    if (group.length >= 4) return false;
    
    const uefaCount = group.filter(t => t.confederation === 'UEFA' || t.confederation.startsWith('UEFA_PLAYOFF')).length;

    if (team.confederation === 'UEFA' || team.confederation.startsWith('UEFA_PLAYOFF')) {
      if (uefaCount >= 2) return false;
    } else {
      if (group.some(t => t.confederation === team.confederation && !team.confederation.startsWith('PLAYOFF'))) return false;
    }
    return true;
  }, []);

  const getValidGroupsForTeam = useCallback((team: Team, currentGroups: Record<Group, Team[]>) => {
    return GROUP_NAMES.filter(g => isGroupValid(team, currentGroups[g]));
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
    let teamsToDraw = [...drawQueue.current];
    let success = true;

    for (const team of teamsToDraw) {
        let placed = false;
        const validGroups = shuffle(getValidGroupsForTeam(team, tempGroups));
        
        for (const groupName of validGroups) {
            if (isGroupValid(team, tempGroups[groupName])) {
                tempGroups[groupName].push({ ...team, positionInGroup: team.pot });
                placed = true;
                break;
            }
        }
        
        if (!placed) {
            toast({ variant: "destructive", title: currentContent.drawErrorTitle, description: currentContent.drawErrorMessage.replace('{teamName}', team.name) });
            success = false;
            break;
        }
    }
    
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
      initializeState();
    }
}, [groups, getValidGroupsForTeam, toast, currentContent, isGroupValid, initializeState]);

  const handleNextStep = () => {
    if (drawState === 'ready_to_draw_team') {
      if (drawQueue.current.length === 0) {
        setDrawState('finished');
        setMessage(currentContent.drawComplete);
        return;
      }
      
      const teamToDraw = drawQueue.current[0];
      const teamsInPot = pots[teamToDraw.pot];
      
      setAnimatingItems([...shuffle(teamsInPot.filter(t => t.code !== teamToDraw.code)), teamToDraw]);
      setAnimationType('team');
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
      
      const finalGroup = shuffle(validGroups)[0];

      setAnimatingItems([...shuffle(validGroups.filter(g => g !== finalGroup)), finalGroup]);
      setAnimationType('group');
      setDrawState('drawing_group');
      setMessage(currentContent.assigningGroup.replace('{teamName}', drawnTeam.name));
    }
  };

  const onTeamAnimationComplete = (item: Team | Group) => {
    const team = item as Team;
    setDrawnTeam(team);
    setPots(prev => ({...prev, [team.pot]: prev[team.pot].filter(t => t.code !== team.code)}));
    setDrawState('team_drawn');
    setAnimatingItems([]);
  }
  
  const onGroupAnimationComplete = (item: Team | Group) => {
      const groupName = item as Group;
      if (!drawnTeam) return;

      const newTeamInGroup = { ...drawnTeam, positionInGroup: drawnTeam.pot as Pot };

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

      drawQueue.current.shift();
      setDrawnTeam(null);
      setAnimatingItems([]);
      
      if (drawQueue.current.length === 0) {
        setDrawState('finished');
        setMessage(currentContent.drawComplete);
      } else {
        const nextTeamPot = drawQueue.current[0].pot;
        setCurrentPot(nextTeamPot);
        setMessage(currentContent.drawingTeam.replace('{pot}', nextTeamPot.toString()));
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

    