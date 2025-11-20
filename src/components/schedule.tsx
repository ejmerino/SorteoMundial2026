import * as React from 'react';
import { Group, Team, Match } from '@/lib/types';
import { SCHEDULE } from '@/lib/schedule';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TeamComponent from '@/components/team';
import { Calendar, MapPin, Filter, SortAsc, SortDesc } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ScheduleProps {
    groups: Record<Group, Team[]>;
    lang: string;
}

const content = {
    es: {
        game: "Juego",
        scheduleTitle: "Calendario de Partidos",
        filterByGroup: "Filtrar por Grupo",
        filterByStadium: "Filtrar por Estadio",
        filterByCountry: "Filtrar por País",
        allGroups: "Todos los Grupos",
        allStadiums: "Todos los Estadios",
        allCountries: "Todos los Países",
        sortBy: "Ordenar por",
        date: "Fecha",
        group: "Grupo",
    },
    en: {
        game: "Game",
        scheduleTitle: "Match Schedule",
        filterByGroup: "Filter by Group",
        filterByStadium: "Filter by Stadium",
        filterByCountry: "Filter by Country",
        allGroups: "All Groups",
        allStadiums: "All Stadiums",
        allCountries: "All Countries",
        sortBy: "Sort by",
        date: "Date",
        group: "Group",
    },
};

const countryFlags: Record<string, string> = {
    'Mexico': 'mx',
    'Canada': 'ca',
    'United States': 'us'
};

const Schedule: React.FC<ScheduleProps> = ({ groups, lang }) => {
    const currentContent = content[lang as keyof typeof content];
    const [sortBy, setSortBy] = React.useState<'date' | 'group'>('date');
    const [filterGroup, setFilterGroup] = React.useState<string>('all');
    const [filterStadium, setFilterStadium] = React.useState<string>('all');
    const [filterCountry, setFilterCountry] = React.useState<string>('all');

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

    const stadiums = React.useMemo(() => [...new Set(SCHEDULE.map(m => m.stadium))], []);
    const countries = React.useMemo(() => [...new Set(SCHEDULE.map(m => m.country))], []);

    const filteredAndSortedMatches = React.useMemo(() => {
        let matches = [...SCHEDULE];

        if (filterGroup !== 'all') {
            matches = matches.filter(m => m.group === filterGroup);
        }
        if (filterStadium !== 'all') {
            matches = matches.filter(m => m.stadium === filterStadium);
        }
        if (filterCountry !== 'all') {
            matches = matches.filter(m => m.country === filterCountry);
        }

        if (sortBy === 'group') {
            matches.sort((a, b) => a.group.localeCompare(b.group) || a.gameId - b.gameId);
        } else {
            // Default sort is by date (gameId)
            matches.sort((a, b) => a.gameId - b.gameId);
        }
        return matches;
    }, [filterGroup, filterStadium, filterCountry, sortBy]);

    const groupedMatches = filteredAndSortedMatches.reduce((acc, match) => {
        const key = sortBy === 'date' ? match.date : `${currentContent.group} ${match.group}`;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(match);
        return acc;
    }, {} as Record<string, Match[]>);

    return (
        <Card className="shadow-lg border-primary/20 overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-primary/90 to-primary/80 dark:from-primary/50 dark:to-primary/40 text-primary-foreground p-4">
                <h2 className="text-2xl font-bold text-center">{currentContent.scheduleTitle}</h2>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                 <Card className="p-4 bg-secondary/30">
                    <div className="flex flex-wrap items-center gap-4">
                        <Filter className="h-5 w-5 text-muted-foreground" />
                        <Select value={filterGroup} onValueChange={setFilterGroup}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder={currentContent.filterByGroup} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{currentContent.allGroups}</SelectItem>
                                {Object.keys(groups).map(g => <SelectItem key={g} value={g}>{currentContent.group} {g}</SelectItem>)}
                            </SelectContent>
                        </Select>
                         <Select value={filterStadium} onValueChange={setFilterStadium}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder={currentContent.filterByStadium} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{currentContent.allStadiums}</SelectItem>
                                {stadiums.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={filterCountry} onValueChange={setFilterCountry}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder={currentContent.filterByCountry} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{currentContent.allCountries}</SelectItem>
                                {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2 ml-auto">
                            <span className="text-sm font-medium text-muted-foreground">{currentContent.sortBy}</span>
                            <Button variant="outline" size="icon" onClick={() => setSortBy(sortBy === 'date' ? 'group' : 'date')}>
                                {sortBy === 'date' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4"/>}
                                <span className="sr-only">Toggle Sort Order</span>
                            </Button>
                        </div>
                    </div>
                </Card>

                <div className="space-y-6">
                    {Object.entries(groupedMatches).map(([key, matches]) => (
                        <div key={key}>
                            <h3 className="text-lg font-semibold text-center mb-3 flex items-center justify-center gap-2 text-primary dark:text-primary-foreground/90">
                                {sortBy === 'date' ? <Calendar className="h-5 w-5" /> : null}
                                <span className="capitalize">{key}</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {matches.map(match => (
                                    <Card key={match.gameId} className="shadow-sm hover:shadow-lg transition-shadow overflow-hidden relative">
                                        <div className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none">
                                            <Image 
                                               src={`https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/${countryFlags[match.country]}.svg`}
                                               alt={`${match.country} flag`}
                                               layout="fill"
                                               objectFit="cover"
                                            />
                                        </div>
                                        <CardHeader className="p-3 bg-card/50 backdrop-blur-sm relative">
                                            <CardTitle className="text-sm font-semibold flex justify-between items-center text-muted-foreground">
                                                <span>{currentContent.game} {match.gameId}</span>
                                                <span className="font-mono text-xs">{match.time}</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 space-y-3 relative">
                                            <div className="flex items-center justify-between">
                                                <div className="w-2/5 flex-shrink-0">{renderTeam(match.team1, match.group)}</div>
                                                <span className="text-lg font-bold text-muted-foreground mx-2">vs</span>
                                                <div className="w-2/5 flex-shrink-0 flex justify-end text-right">{renderTeam(match.team2, match.group)}</div>
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
            </CardContent>
        </Card>
    );
};

// Need to add TEAMS to get the flag data for hosts
const TEAMS: Team[] = [
  { name: 'Mexico', code: 'mx', confederation: 'CONCACAF', pot: 1 },
  { name: 'Canada', code: 'ca', confederation: 'CONCACAF', pot: 1 },
  { name: 'United States', code: 'us', confederation: 'CONCACAF', pot: 1 },
];

export default Schedule;

    