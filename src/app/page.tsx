'use client';
import DrawSimulator from '@/components/draw-simulator';
import { Globe, Languages, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState, useEffect } from 'react';

const content = {
  es: {
    title: 'Simulador de Sorteo de la Copa',
    subtitle: 'Copa del Mundo 2026',
    footer: '© 2024 Simulador de Sorteo de la Copa del Mundo 2026. Solo para fines de entretenimiento.',
    langSwitch: 'Cambiar Idioma',
    themeSwitch: 'Cambiar Tema',
  },
  en: {
    title: 'Copa Draw Simulator',
    subtitle: 'World Cup 2026',
    footer: '© 2024 World Cup 2026 Draw Simulator. For entertainment purposes only.',
    langSwitch: 'Change Language',
    themeSwitch: 'Change Theme',
  },
};

export default function Home() {
  const { setTheme } = useTheme();
  const [lang, setLang] = useState('es');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'en') {
      setLang('en');
    }
  }, []);

  if (!mounted) {
    return null; 
  }

  const handleLangChange = (newLang: string) => {
    setLang(newLang);
    document.documentElement.lang = newLang;
  };

  const currentContent = content[lang as keyof typeof content];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="py-4 px-4 sm:px-6 lg:px-8 border-b shadow-sm">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="h-8 w-8 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold text-primary font-headline tracking-tight">
              {currentContent.title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-muted-foreground hidden sm:block">
              {currentContent.subtitle}
            </p>
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Languages className="h-[1.2rem] w-[1.2rem]" />
                  <span className="sr-only">{currentContent.langSwitch}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleLangChange('es')}>
                  Español
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleLangChange('en')}>
                  English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">{currentContent.themeSwitch}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8">
        <DrawSimulator lang={lang} />
      </main>
      <footer className="py-4 px-4 sm:px-6 lg:px-8 border-t mt-auto">
        <div className="container mx-auto text-center text-xs text-muted-foreground">
          <p>
            {currentContent.footer}
          </p>
        </div>
      </footer>
    </div>
  );
}
