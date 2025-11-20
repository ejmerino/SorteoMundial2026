"use client";

import * as React from 'react';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TEAMS } from '@/lib/data';
import type { Team, Pot, Group } from '@/lib/types';
import { shuffle, sleep } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PotCard } from '@/components/pot-card';
import { GroupCard } from '@/components/group-card';
import TeamComponent from '@/components/team';
import { Play, RotateCw, Loader2, Award, Zap, Film, Ticket, Trophy } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const GROUP_NAMES: Group[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
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
    drawingTeam: "Sorteando equipo...",
    drawingGroup: "Asignando grupo...",
    drawComplete: "¡El sorteo ha finalizado!",
    drawErrorTitle: "Error en el Sorteo",
    drawErrorMessage: "No se pudo colocar a {teamName}. Por favor, reinicia el sorteo.",
    pot: "Bombo",
    group: "Grupo"
  },
  en: {
    simulationControls: "Simulation Controls",
    fastDraw: "Fast Draw",
    animatedDraw: "Animated Draw",
    reset: "Reset",
    initialMessage: "Select a draw mode to begin.",
    teamsDrawn: "teams drawn",
    drawingTeam: "Drawing team...",
    drawingGroup: "Assigning group...",
    drawComplete: "The draw is complete!",
    drawErrorTitle: "Draw Error",
    drawErrorMessage: "Could not place {teamName}. Please reset the draw.",
    pot: "Pot",
    group: "Group"
  },
};

const AnimationPicker = ({ teams, groups, onStop, duration = 3000 }: { teams?: Team[], groups?: string[], onStop: () => void, duration?: number }) => {
  const itemHeight = 80;
  const listRef = useRef<HTMLDivElement>(null);
  const [itemsToDisplay, setItemsToDisplay] = useState<any[]>([]);

  useEffect(() => {
    let sourceItems: any[] = [];
    if (teams) {
      sourceItems = teams.map((team, i) => <div key={`${team.code}-${i}`} className="h-[80px] flex items-center justify-center"><TeamComponent team={team} variant="large" /></div>);
    } else if (groups) {
      sourceItems = groups.map((group, i) => <div key={`${group}-${i}`} className="h-[80px] flex items-center justify-center text-4xl font-bold">{group}</div>);
    }

    if (sourceItems.length > 0) {
      const extended = Array(5).fill(sourceItems).flat().map((item, index) => React.cloneElement(item, { key: `${item.key}-${index}` }));
      setItemsToDisplay(extended);
    }
  }, [teams, groups]);


  useEffect(() => {
    if (itemsToDisplay.length <= 1 || !listRef.current) return;

    listRef.current.style.transform = `translateY(0px)`;
    listRef.current.style.transition = 'none';
    
    const shuffleAndPick = () => {
      const totalHeight = listRef.current?.scrollHeight || 0;
      // Adjust the multiplier and logic to get a good random spin
      const spinCycles = 3;
      const basePosition = (itemsToDisplay.length / 5) * itemHeight * spinCycles;
      const randomOffset = Math.floor(Math.random() * (itemsToDisplay.length / 5)) * itemHeight;

      const finalPosition = basePosition + randomOffset;
      
      if (listRef.current) {
        listRef.current.style.transition = `transform ${duration / 1000}s cubic-bezier(0.25, 0.1, 0.25, 1)`;
        listRef.current.style.transform = `translateY(-${finalPosition}px)`;
      }
    };
    
    requestAnimationFrame(() => {
        requestAnimationFrame(shuffleAndPick);
    });

    const timer = setTimeout(onStop, duration);
    return () => clearTimeout(timer);
  }, [itemsToDisplay, duration, onStop, itemHeight]);


  return (
    <div className="h-[80px] w-full overflow-hidden relative">
      <div 
        ref={listRef} 
        className="absolute top-0 left-0 w-full"
      >
        {itemsToDisplay}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-card via-transparent to-card" />
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
  const [isDrawing, setIsDrawing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [currentPick, setCurrentPick] = useState<{team: Team, state: 'picking-team' | 'picked-team' | 'picking-group' | 'picked-group'} | null>(null);
  const [message, setMessage] = useState("");
  const [drawMode, setDrawMode] = useState<'fast' | 'animated'>('animated');
  const [currentPot, setCurrentPot] = useState<Pot | null>(null);
  const [animatingTeams, setAnimatingTeams] = useState<Team[]>([]);
  const [animatingGroups, setAnimatingGroups] = useState<string[]>([]);
  const [assignedGroup, setAssignedGroup] = useState<Group | null>(null);
  
  const currentContent = content[lang as keyof typeof content];

  const initializeState = useCallback(() => {
    let initialPots: Record<Pot, Team[]> = { 1: [], 2: [], 3: [], 4: [] };
    let initialGroups = Object.fromEntries(GROUP_NAMES.map(name => [name, []])) as Record<Group, Team[]>;
    
    const teamsToPlace = [...TEAMS];
    
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
    setCurrentPot(null);
    setAnimatingTeams([]);
    setAnimatingGroups([]);
    setAssignedGroup(null);
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
      if (group.some(t => t.confederation === team.confederation)) return false;
    }
    return true;
  };

  const getValidGroupsForTeam = (team: Team, currentGroups: Record<Group, Team[]>) => {
    return GROUP_NAMES.filter(g => isGroupValid(team, currentGroups[g]));
  }

 const startDraw = async () => {
    setIsDrawing(true);
    setIsFinished(false);
    
    let tempPots = JSON.parse(JSON.stringify(pots)) as Record<Pot, Team[]>;
    let tempGroups = JSON.parse(JSON.stringify(groups)) as Record<Group, Team[]>;

    const teamPickDelay = drawMode === 'animated' ? 3000 : 0;
    const groupPickDelay = drawMode === 'animated' ? 3000 : 0;
    const finalDelay = drawMode === 'animated' ? 1500 : 0;

    for (let potNum = 1; potNum <= 4; potNum++) {
      setCurrentPot(potNum as Pot);
      const currentPotTeams = [...tempPots[potNum as Pot]];
      
      for (const team of currentPotTeams) {
        if (team.pot === 1 && Object.keys(HOSTS).includes(team.name)) {
          continue; 
        }

        setMessage(`${currentContent.drawingTeam}`);
        if(drawMode === 'animated') {
            const teamsForAnimation = shuffle([...tempPots[potNum as Pot]]);
            setAnimatingTeams(teamsForAnimation);
            setCurrentPick({team, state: 'picking-team'});
            await sleep(teamPickDelay); 
            
            setCurrentPick({team, state: 'picked-team'});
            tempPots[potNum as Pot] = tempPots[potNum as Pot].filter((t: Team) => t.code !== team.code);
            setPots(prev => ({...prev, [potNum]: prev[potNum as Pot].filter(p => p.code !== team.code)}));
            await sleep(1000); 
        } else {
             tempPots[potNum as Pot] = tempPots[potNum as Pot].filter((t: Team) => t.code !== team.code);
        }
        
        let assignedGroupResult: Group | null = null;
        let positionInGroup: Pot | null = null;
        
        const validGroups = getValidGroupsForTeam(team, tempGroups);

        if(validGroups.length === 0) {
             toast({
                variant: "destructive",
                title: currentContent.drawErrorTitle,
                description: currentContent.drawErrorMessage.replace('{teamName}', team.name),
            })
            setIsDrawing(false);
            initializeState();
            return;
        }

        if (team.pot === 1) {
            const emptyPot1Groups = GROUP_NAMES.filter(g => tempGroups[g].length === 0);
            assignedGroupResult = shuffle(emptyPot1Groups)[0];
            positionInGroup = 1;
        } else {
            // "computer" logic: find first available group alphabetically
            let placed = false;
            for (const groupName of GROUP_NAMES) {
                if (isGroupValid(team, tempGroups[groupName])) {
                    assignedGroupResult = groupName;
                    placed = true;
                    break;
                }
            }

            if (!placed) { // Should not happen with correct logic, but as a fallback
                 assignedGroupResult = shuffle(validGroups)[0];
            }
            
            const availablePositions = [1, 2, 3, 4].filter(
              p => !tempGroups[assignedGroupResult as Group].some(t => t.positionInGroup === p)
            );
            positionInGroup = shuffle(availablePositions)[0] as Pot;
        }

        if (assignedGroupResult && positionInGroup) {
             if (drawMode === 'animated') {
                setMessage(`${currentContent.drawingGroup}`);
                const groupsForAnimation = shuffle(validGroups.map(g => g.toString()));
                setAnimatingGroups(groupsForAnimation);
                setAssignedGroup(assignedGroupResult);
                setCurrentPick({team, state: 'picking-group'});
                await sleep(groupPickDelay);
                setCurrentPick({team, state: 'picked-group'});
                await sleep(1000);
            }

            tempGroups[assignedGroupResult].push({ ...team, positionInGroup });
            
            if (drawMode === 'animated') {
                setGroups({ ...tempGroups });
                setCurrentPick(null);
                await sleep(finalDelay);
            }
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
      }
      
      if (drawMode === 'fast') {
          setPots(current => ({...current, ...tempPots}));
      }
      setCurrentPick(null);
    }
    
    setGroups(tempGroups);
    setPots({ 1: [], 2: [], 3: [], 4: [] });
    setMessage(currentContent.drawComplete);
    setIsDrawing(false);
    setIsFinished(true);
    setCurrentPick(null);
    setCurrentPot(null);
  };

  const handleReset = () => {
    initializeState();
  };

  const renderCurrentPickAnimation = () => {
    if (!currentPick || !isDrawing || drawMode !== 'animated') return null;
  
    const { team, state } = currentPick;
  
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="h-full w-full"
        >
          {state === 'picking-team' && animatingTeams.length > 0 && (
            <AnimationPicker teams={animatingTeams} onStop={() => {}} duration={2800} />
          )}
          {state === 'picked-team' && (
            <Card className="h-full border-accent border-2 shadow-2xl flex items-center justify-center p-2 bg-card/80 backdrop-blur-sm">
                <TeamComponent team={team} variant="large" />
            </Card>
          )}
           {state === 'picking-group' && animatingGroups.length > 0 && (
             <div className="h-full flex items-center justify-center gap-4">
                <div className="w-48">
                    <Card className="border-accent border-2 shadow-xl flex items-center justify-center p-2 bg-card/80 backdrop-blur-sm">
                        <TeamComponent team={team} variant="default" />
                    </Card>
                </div>
                <div className="w-32">
                    <AnimationPicker groups={animatingGroups} onStop={() => {}} duration={2800} />
                </div>
             </div>
          )}
           {state === 'picked-group' && assignedGroup && (
             <Card className="h-full border-primary border-2 shadow-2xl flex flex-col items-center justify-center p-2 bg-card/80 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Ticket className="h-8 w-8 text-primary" />
                  <p className="text-2xl font-bold text-primary">{currentContent.group} {assignedGroup}</p>
                </div>
                <TeamComponent team={team} variant="default" />
             </Card>
           )}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg overflow-hidden border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary via-blue-800 to-primary text-primary-foreground p-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-lg font-bold flex items-center gap-2"><Trophy /> {currentContent.simulationControls}</h2>
            <div className="flex items-center gap-2 sm:gap-4">
              <Tabs value={drawMode} onValueChange={(value) => setDrawMode(value as 'fast' | 'animated')} className="w-auto">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="animated" disabled={isDrawing}>
                    <Film className="mr-2 h-4 w-4"/> {currentContent.animatedDraw}
                  </TabsTrigger>
                  <TabsTrigger value="fast" disabled={isDrawing}>
                    <Zap className="mr-2 h-4 w-4"/> {currentContent.fastDraw}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button onClick={startDraw} disabled={isDrawing || isFinished} className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md px-4 sm:px-6">
                {isDrawing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                <span className="hidden sm:inline">{isDrawing ? '...' : ''}</span>
              </Button>
              <Button onClick={handleReset} variant="outline" className="bg-background/80 hover:bg-background text-foreground shadow-md">
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 bg-secondary/30">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-28 sm:h-24">
            <div className="text-center sm:text-left">
              <p className="font-semibold text-primary">{message}</p>
              <p className="text-sm text-muted-foreground">{drawnTeamCount} of 48 {currentContent.teamsDrawn}.</p>
            </div>
            <div className="w-full sm:w-72 h-full relative">
              <AnimatePresence>
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
          <PotCard 
            key={num} 
            potNumber={parseInt(num, 10) as Pot} 
            teams={teams} 
            lang={lang} 
            title={currentContent.pot}
            isDrawing={isDrawing && currentPot === parseInt(num, 10)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {GROUP_NAMES.map(groupName => (
          <GroupCard key={groupName} groupName={groupName} teams={groups[groupName]} lang={lang} />
        ))}
      </div>
    </div>
  );
}
