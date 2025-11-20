import * as React from 'react';
import { Group, Team } from '@/lib/types';
import { SCHEDULE } from '@/lib/schedule';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TeamComponent from '@/components/team';
import { Calendar, MapPin } from 'lucide-react';

interface ScheduleProps {
    groups: Record<Group, Team[]>;
    lang: string;
}

const content = {
    es: {
        game: "Juego",
    },
    en: {
        game: "Game",
    },
};

const Schedule: React.FC<ScheduleProps> = ({ groups, lang }) => {
    const currentContent = content[lang as keyof typeof content];
    const groupedMatches = SCHEDULE.reduce((acc, match) => {
        if (!acc[match.date]) {
            acc[match.date] = [];
        }
        acc[match.date].push(match);
        return acc;
    }, {} as Record<string, typeof SCHEDULE>);

    const getTeamByPos = (group: Group, position: number): Team | undefined => {
        return groups[group]?.find(t => t.positionInGroup === position);
    }
    
    const renderTeam = (teamOrPlaceholder: string | { name: string; position: number }, group: Group) => {
        if (typeof teamOrPlaceholder === 'string') {
            const team = TEAMS.find(t => t.name === teamOrPlaceholder);
            return team ? <TeamComponent team={team} /> : <span className="text-sm text-muted-foreground">{teamOrPlaceholder}</span>;
        }

        const team = getTeamByPos(group, teamOrPlaceholder.position);
        if (team) {
            return <TeamComponent team={team} />;
        }
        
        return <span className="text-sm text-muted-foreground italic">{teamOrPlaceholder.name}</span>;
    };

    return (
        <div className="space-y-6">
            {Object.entries(groupedMatches).map(([date, matches]) => (
                <div key={date}>
                    <h3 className="text-lg font-semibold text-center mb-3 flex items-center justify-center gap-2">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <span className="capitalize">{date}</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {matches.map(match => (
                            <Card key={match.gameId} className="shadow-sm hover:shadow-lg transition-shadow">
                                <CardHeader className="p-3 bg-secondary/30">
                                    <CardTitle className="text-sm font-semibold flex justify-between items-center text-muted-foreground">
                                        <span>{currentContent.game} {match.gameId}</span>
                                        <span className="font-mono text-xs">{match.time}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="w-2/5 flex-shrink-0">{renderTeam(match.team1, match.group)}</div>
                                        <span className="text-lg font-bold text-muted-foreground mx-2">vs</span>
                                        <div className="w-2/5 flex-shrink-0 flex justify-end">{renderTeam(match.team2, match.group)}</div>
                                    </div>
                                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-2 border-t pt-2">
                                        <MapPin className="h-3 w-3" />
                                        <span>{match.stadium}, {match.city}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

// Need to add TEAMS to get the flag data for hosts
const TEAMS: Team[] = [
  { name: 'Mexico', code: 'mx', confederation: 'CONCACAF', pot: 1 },
  { name: 'Canada', code: 'ca', confederation: 'CONCACAF', pot: 1 },
  { name: 'United States', code: 'us', confederation: 'CONCACAF', pot: 1 },
];

export default Schedule;
