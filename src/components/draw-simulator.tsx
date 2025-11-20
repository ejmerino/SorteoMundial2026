"use client";

import * as React from 'react';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TEAMS } from '@/lib/data';
import type { Team, Pot, Group } from '@/lib/types';
import { shuffle } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PotCard } from '@/components/pot-card';
import { GroupCard } from '@/components/group-card';
import TeamComponent from '@/components/team';
import { Play, RotateCw, Loader2, Award, ChevronRight, ChevronsRight, Zap } from 'lucide-react';
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
    drawGroup: "Sortear Grupo",
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
    toastDescription: "Se une a los equipos del grupo."
  },
  en: {
    startDraw: "Start Animated Draw",
    fastDraw: "Fast Draw",
    nextStep: "Next",
    drawTeam: "Draw Team",
    drawGroup: "Draw Group",
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
    toastDescription: "Joins the teams in the group."
  },
};

type DrawState = 'idle' | 'ready_to_draw_team' | 'drawing_team' | 'team_drawn' | 'drawing_group' | 'group_assigned' | 'finished';

const AnimationPicker = ({
  items,
  selectedItem,
  onAnimationComplete,
  itemHeight = 80,
  duration = 2800
}: {
  items: (Team | string)[];
  selectedItem: Team | string;
  onAnimationComplete: () => void;
  itemHeight?: number;
  duration?: number;
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [displayList, setDisplayList] = useState<React.ReactNode[]>([]);
  const itemsRef = useRef<(Team | string)[]>([]);
  
  useEffect(() => {
    itemsRef.current = items;
    if (items.length > 0) {
        const itemToElement = (item: Team | string, key: string) => (
            <div key={key} className="h-[80px] flex items-center justify-center">
                {typeof item === 'string' ? (
                    <span className="text-4xl font-bold">{item}</span>
                ) : (
                    <TeamComponent team={item} variant="large" />
                )}
            </div>
        );

        const shuffled = shuffle([...items]);
        const extended = Array(5).fill(shuffled).flat().map((item, index) => {
            const itemKey = (typeof item === 'string' ? item : item.code) + `-${index}-${Math.random()}`;
            return itemToElement(item, itemKey);
        });
        setDisplayList(extended);
    }
}, [items]);


  useEffect(() => {
    if (displayList.length === 0 || !listRef.current || !selectedItem) return;

    listRef.current.style.transform = 'translateY(0px)';
    listRef.current.style.transition = 'none';

    const spin = () => {
      if (!listRef.current) return;
      
      const sourceList = itemsRef.current;
      const selectedItemKey = typeof selectedItem === 'string' ? selectedItem : selectedItem.code;
      // Find the first occurrence in the original shuffled list used to build the display list
      const firstCycle = displayList.slice(0, sourceList.length);
      const targetIndex = firstCycle.findIndex(node => (node as React.ReactElement).props.children.props.team?.code === selectedItemKey || (node as React.ReactElement).props.children.props.children === selectedItemKey);
           
      if (targetIndex === -1) {
          console.error("Selected item not found in animation list", selectedItem);
          onAnimationComplete();
          return;
      }
      
      const totalItemsInCycle = sourceList.length;
      const cycleHeight = totalItemsInCycle * itemHeight;
      const spinCycles = 3;
      
      const targetPosition = (targetIndex * itemHeight);
      const finalPosition = (spinCycles * cycleHeight) + targetPosition;

      listRef.current.style.transition = `transform ${duration / 1000}s cubic-bezier(0.25, 0.1, 0.25, 1)`;
      listRef.current.style.transform = `translateY(-${finalPosition}px)`;
    }

    requestAnimationFrame(() => {
        requestAnimationFrame(spin);
    });

    const timer = setTimeout(onAnimationComplete, duration);
    return () => clearTimeout(timer);
  }, [displayList, selectedItem, onAnimationComplete, duration, itemHeight]);

  return (
    <div className="h-full w-full overflow-hidden relative">
      <div ref={listRef} className="absolute top-0 left-0 w-full">
        {displayList}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-card/80 via-transparent to-card/80 pointer-events-none" />
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[80px] border-y-2 border-accent" />
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
  const [assignedGroup, setAssignedGroup] = useState<Group | null>(null);
  
  const [animatingItems, setAnimatingItems] = useState<(Team | string)[]>([]);
  const [selectedItem, setSelectedItem] = useState<Team | string | null>(null);
  const [isFastDraw, setIsFastDraw] = useState(false);

  const drawQueue = useRef<Team[]>([]);
  
  const currentContent = content[lang as keyof typeof content];

  const initializeState = useCallback(() => {
    let initialPots: Record<Pot, Team[]> = { 1: [], 2: [], 3: [], 4: [] };
    let initialGroups = Object.fromEntries(GROUP_NAMES.map(name => [name, []])) as Record<Group, Team[]>;
    
    TEAMS.forEach(team => {
        if(initialPots[team.pot]) {
          initialPots[team.pot as Pot].push(team);
        }
    });

    const queue: Team[] = [];
    Object.entries(HOSTS).forEach(([hostName, groupName]) => {
      const team = TEAMS.find(t => t.name === hostName);
      if (team) {
        initialGroups[groupName].push({ ...team, positionInGroup: 1 });
        initialPots[team.pot as Pot] = initialPots[team.pot as Pot].filter(t => t.name !== hostName);
      }
    });
    
    for (let potNum = 1; potNum <= 4; potNum++) {
      queue.push(...shuffle(initialPots[potNum as Pot]));
    }
    drawQueue.current = queue;

    setPots(initialPots);
    setGroups(initialGroups);
    setDrawState('idle');
    setMessage("");
    setCurrentPot(1);
    setDrawnTeam(null);
    setAssignedGroup(null);
    setAnimatingItems([]);
    setSelectedItem(null);
  }, [lang]);

  useEffect(() => {
    initializeState();
  }, [initializeState]);

  const drawnTeamCount = useMemo(() => {
    return Object.values(groups).flat().length;
  }, [groups]);

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

  const getValidGroupsForTeam = (team: Team, currentGroups: Record<Group, Team[]>) => {
    return GROUP_NAMES.filter(g => isGroupValid(team, currentGroups[g]));
  }

  const handleStartDraw = (fast = false) => {
    setIsFastDraw(fast);
    if (fast) {
      runFastDraw();
    } else {
      setDrawState('ready_to_draw_team');
      setCurrentPot(drawQueue.current[0].pot);
      setMessage(currentContent.drawingTeam.replace('{pot}', '1'));
    }
  };

  const handleReset = () => {
    initializeState();
  };

  const performDrawStep = () => {
    const teamToDraw = drawQueue.current.shift();
    if (!teamToDraw) {
      setDrawState('finished');
      setMessage(currentContent.drawComplete);
      return;
    }

    const validGroups = getValidGroupsForTeam(teamToDraw, groups);
    if (validGroups.length === 0) {
      toast({ variant: "destructive", title: currentContent.drawErrorTitle, description: currentContent.drawErrorMessage.replace('{teamName}', teamToDraw.name) });
      handleReset();
      return null;
    }

    let finalGroup: Group;
    if (teamToDraw.pot === 1) {
      const emptyPot1Groups = GROUP_NAMES.filter(g => groups[g].length === 0);
      finalGroup = shuffle(emptyPot1Groups)[0];
    } else {
      finalGroup = validGroups[0];
    }
    
    const availablePositions = [1, 2, 3, 4].filter(p => !groups[finalGroup].some(t => t.positionInGroup === p));
    const positionInGroup = (teamToDraw.pot === 1) ? 1 : (shuffle(availablePositions)[0] as Pot);
    
    const newTeam = { ...teamToDraw, positionInGroup };
    
    return { newTeam, finalGroup };
  };

  const runFastDraw = () => {
    let currentGroups = groups;
    let currentPots = pots;

    while(drawQueue.current.length > 0) {
      const result = performDrawStep();
      if (!result) return;
      const { newTeam, finalGroup } = result;

      currentGroups = {
        ...currentGroups,
        [finalGroup]: [...currentGroups[finalGroup], newTeam].sort((a,b) => (a.positionInGroup || 0) - (b.positionInGroup || 0))
      };
      currentPots = {
        ...currentPots,
        [newTeam.pot]: currentPots[newTeam.pot].filter(t => t.code !== newTeam.code)
      };
    }
    
    setGroups(currentGroups);
    setPots(currentPots);
    setDrawState('finished');
    setMessage(currentContent.drawComplete);
  };


  const handleNextStep = () => {
    if (drawState === 'ready_to_draw_team') {
      const teamToDraw = drawQueue.current[0];
      setDrawnTeam(teamToDraw);
      setSelectedItem(teamToDraw);
      setCurrentPot(teamToDraw.pot);
      setAnimatingItems(pots[teamToDraw.pot]);
      setDrawState('drawing_team');
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
      
      let finalGroup: Group;
      if (drawnTeam.pot === 1) {
        const emptyPot1Groups = GROUP_NAMES.filter(g => groups[g].length === 0);
        finalGroup = shuffle(emptyPot1Groups)[0];
      } else {
        finalGroup = validGroups[0];
      }

      setAssignedGroup(finalGroup);
      setSelectedItem(finalGroup);
      setAnimatingItems(validGroups);
      setDrawState('drawing_group');
      setMessage(currentContent.assigningGroup.replace('{teamName}', drawnTeam.name));
    }
  };

  const onAnimationComplete = () => {
    if (drawState === 'drawing_team' && drawnTeam) {
      setPots(prev => ({...prev, [drawnTeam.pot]: prev[drawnTeam.pot].filter(t => t.code !== drawnTeam.code)}));
      setDrawState('team_drawn');
    } else if (drawState === 'drawing_group' && drawnTeam && assignedGroup) {
      
      let positionInGroup: Pot;
      if(drawnTeam.pot === 1) {
        positionInGroup = 1;
      } else {
        const availablePositions = [1, 2, 3, 4].filter(
          p => !groups[assignedGroup].some(t => t.positionInGroup === p)
        );
        positionInGroup = shuffle(availablePositions)[0] as Pot;
      }

      const newTeam = { ...drawnTeam, positionInGroup };

      setGroups(prev => {
        const newGroups = {...prev};
        newGroups[assignedGroup] = [...newGroups[assignedGroup], newTeam].sort((a,b) => (a.positionInGroup || 0) - (b.positionInGroup || 0));
        return newGroups;
      });
      
      toast({
        title: currentContent.groupAssigned
          .replace('{teamName}', drawnTeam.name)
          .replace('{groupName}', assignedGroup),
        description: currentContent.toastDescription
      });

      drawQueue.current.shift();
      setDrawnTeam(null);
      setAssignedGroup(null);
      
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
  }
  
  const renderDrawArea = () => {
    switch (drawState) {
      case 'drawing_team':
      case 'drawing_group':
        return (
           <div className="w-full h-full flex items-center justify-center">
              {drawState === 'drawing_group' && drawnTeam && (
                <div className="w-48 mr-4">
                  <Card className="border-accent border-2 shadow-xl flex items-center justify-center p-2 bg-card/80 backdrop-blur-sm">
                      <TeamComponent team={drawnTeam} variant="default" />
                  </Card>
                </div>
              )}
              <div className={drawState === 'drawing_group' ? "w-32" : "w-full"}>
                  <AnimationPicker 
                    items={animatingItems}
                    selectedItem={selectedItem!}
                    onAnimationComplete={onAnimationComplete}
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

      default:
        return (
          <div className="h-full flex flex-col items-center justify-center text-center">
            {drawState === 'finished' ? (
              <>
                <Award className="h-10 w-10 text-amber-500" />
                <p className="font-bold mt-2 text-lg">{currentContent.drawComplete}</p>
              </>
            ) : (
             <div className="flex flex-col sm:flex-row gap-4">
                 <Button onClick={() => handleStartDraw(false)} size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg px-8 py-6 text-lg">
                    <Play className="mr-2 h-5 w-5" /> {currentContent.startDraw}
                 </Button>
                 <Button onClick={() => handleStartDraw(true)} size="lg" variant="secondary" className="shadow-lg px-8 py-6 text-lg">
                    <Zap className="mr-2 h-5 w-5" /> {currentContent.fastDraw}
                 </Button>
             </div>
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
              <p className="font-semibold text-lg">{message || (drawState === 'idle' ? 'Listo para el sorteo' : (drawState === 'finished' ? currentContent.drawComplete : `Bombo ${currentPot}`))}</p>
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 h-full">
            <div className="w-full sm:w-80 h-32 sm:h-full relative">
              <AnimatePresence mode="wait">
                {renderDrawArea()}
              </AnimatePresence>
            </div>
            <div className="flex items-center justify-center">
              {drawState !== 'idle' && renderActionButton()}
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
    </div>
  );
}
