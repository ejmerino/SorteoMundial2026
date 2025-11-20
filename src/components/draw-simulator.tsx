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
  'Mexico': 'A',
  'Canada': 'B',
  'United States': 'D'
};

export default function DrawSimulator() {
  const { toast } = useToast();
  const [pots, setPots] = useState<Record<Pot, Team[]>>({ 1: [], 2: [], 3: [], 4: [] });
  const [groups, setGroups] = useState<Record<Group, Team[]>>(
    Object.fromEntries(GROUP_NAMES.map(name => [name as Group, []])) as Record<Group, Team[]>
  );
  const [isDrawing, setIsDrawing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [currentPick, setCurrentPick] = useState<Team | null>(null);
  const [message, setMessage] = useState("Click 'Start Draw' to begin the simulation.");

  const drawnTeamCount = useMemo(() => {
    return Object.values(groups).flat().length;
  }, [groups]);

  const initializeState = () => {
    const initialPots: Record<Pot, Team[]> = { 1: [], 2: [], 3: [], 4: [] };
    const initialGroups = Object.fromEntries(GROUP_NAMES.map(name => [name as Group, []])) as Record<Group, Team[]>;
    const hostsToPlace = { ...HOSTS };

    TEAMS.forEach(team => {
      if (hostsToPlace[team.name as keyof typeof hostsToPlace]) {
        const groupName = hostsToPlace[team.name as keyof typeof hostsToPlace];
        initialGroups[groupName as Group].push({ ...team, positionInGroup: 1 });
        delete hostsToPlace[team.name as keyof typeof hostsToPlace];
      } else {
        initialPots[team.pot as Pot].push(team);
      }
    });

    setPots(initialPots);
    setGroups(initialGroups);
    setIsDrawing(false);
    setIsFinished(false);
    setCurrentPick(null);
    setMessage("Click 'Start Draw' to begin the simulation.");
  };

  useEffect(() => {
    initializeState();
  }, []);

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

    // Draw Pot 1
    setMessage('Drawing teams from Pot 1...');
    const pot1Groups = GROUP_NAMES.filter(g => !Object.values(HOSTS).includes(g));
    for (const team of tempPots[1]) {
      setCurrentPick(team);
      await sleep(1500);
      const groupName = pot1Groups.shift() as Group;
      tempGroups[groupName].push({ ...team, positionInGroup: 1 });
      setGroups({ ...tempGroups });
      await sleep(500);
    }
    tempPots[1] = [];
    setPots({ ...tempPots });
    setCurrentPick(null);

    // Draw Pots 2, 3, 4
    for (let potNum = 2; potNum <= 4; potNum++) {
      setMessage(`Drawing teams from Pot ${potNum}...`);
      await sleep(1000);
      for (const team of tempPots[potNum]) {
        setCurrentPick(team);
        await sleep(1500);
        
        const availableGroups = shuffle(GROUP_NAMES.filter(g => tempGroups[g as Group].length < potNum));
        
        let placed = false;
        for (const groupName of availableGroups) {
          if (isGroupValid(team, tempGroups[groupName as Group])) {
            tempGroups[groupName as Group].push({ ...team, positionInGroup: potNum as Pot });
            placed = true;
            break;
          }
        }

        if (!placed) {
          // Emergency placement: find any valid group even if it's "full" for this pot round
           const emergencyGroups = shuffle(GROUP_NAMES.filter(g => tempGroups[g as Group].length < 4));
           for (const groupName of emergencyGroups) {
              if (isGroupValid(team, tempGroups[groupName as Group])) {
                tempGroups[groupName as Group].push({ ...team, positionInGroup: potNum as Pot });
                placed = true;
                break;
              }
           }
        }
        
        if (!placed) {
            toast({
              variant: "destructive",
              title: "Draw Error",
              description: `Could not place ${team.name}. Please reset the draw.`,
            })
            setIsDrawing(false);
            return;
        }

        setGroups({ ...tempGroups });
        await sleep(500);
      }
      tempPots[potNum] = [];
      setPots(tempPots);
      setCurrentPick(null);
    }
    
    setMessage('The draw is complete!');
    setIsDrawing(false);
    setIsFinished(true);
  };

  const handleReset = () => {
    initializeState();
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold">Simulation Controls</h2>
            <div className="flex items-center gap-4">
              <Button onClick={startDraw} disabled={isDrawing || isFinished} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                {isDrawing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                Start Draw
              </Button>
              <Button onClick={handleReset} variant="outline" className="bg-background/80 hover:bg-background">
                <RotateCw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 bg-primary/5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-24">
            <div className="text-center sm:text-left">
              <p className="font-semibold text-primary">{message}</p>
              <p className="text-sm text-muted-foreground">{drawnTeamCount} of 48 teams drawn.</p>
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
                    <Award className="h-8 w-8" />
                    <p className="font-bold mt-2">Draw Complete!</p>
                  </div>
               )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {Object.entries(pots).map(([num, teams]) => (
          <PotCard key={num} potNumber={num as unknown as Pot} teams={teams} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {GROUP_NAMES.map(groupName => (
          <GroupCard key={groupName} groupName={groupName as Group} teams={groups[groupName as Group]} />
        ))}
      </div>
    </div>
  );
}