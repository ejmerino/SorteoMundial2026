import DrawSimulator from '@/components/draw-simulator';
import { Globe } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="py-4 px-4 sm:px-6 lg:px-8 border-b shadow-sm">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="h-8 w-8 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold text-primary font-headline tracking-tight">
              Copa Draw Simulator
            </h1>
          </div>
          <p className="text-sm font-semibold text-muted-foreground hidden sm:block">
            World Cup 2026
          </p>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8">
        <DrawSimulator />
      </main>
      <footer className="py-4 px-4 sm:px-6 lg:px-8 border-t mt-auto">
        <div className="container mx-auto text-center text-xs text-muted-foreground">
          <p>
            &copy; 2024 World Cup 2026 Draw Simulator. For entertainment purposes only.
          </p>
        </div>
      </footer>
    </div>
  );
}
