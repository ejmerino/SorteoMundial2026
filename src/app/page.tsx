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
import Image from 'next/image';

const content = {
  es: {
    title: 'Simulador de Sorteo',
    subtitle: 'Copa del Mundo 2026',
    footer: {
      developedBy: "Desarrollado por:",
      disclaimer: "Este simulador es solo para fines de entretenimiento. Todas las marcas comerciales, logotipos y nombres de equipos son propiedad de la FIFA y sus respectivas federaciones. No se reclama ninguna afiliación ni propiedad."
    },
    langSwitch: 'Cambiar Idioma',
    themeSwitch: 'Cambiar Tema',
  },
  en: {
    title: 'Draw Simulator',
    subtitle: 'World Cup 2026',
    footer: {
      developedBy: "Developed by:",
      disclaimer: "This simulator is for entertainment purposes only. All trademarks, logos, and team names are the property of FIFA and their respective federations. No affiliation or ownership is claimed."
    },
    langSwitch: 'Change Language',
    themeSwitch: 'Change Theme',
  },
};

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [lang, setLang] = useState('es');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'en' || browserLang === 'es') {
      setLang(browserLang);
      document.documentElement.lang = browserLang;
    }
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  if (!mounted) {
    return null; 
  }

  const handleLangChange = (newLang: string) => {
    setLang(newLang);
    document.documentElement.lang = newLang;
  };

  const currentContent = content[lang as keyof typeof content];

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans text-foreground">
      <header className="py-4 px-4 sm:px-6 lg:px-8 border-b shadow-sm sticky top-0 z-40 bg-card/90 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="relative h-12 w-12">
              <Image src="/images/logo_copa_negro.png" alt="World Cup Logo" fill className="object-contain dark:hidden" />
              <Image src="/images/logo_copa_blanco.png" alt="World Cup Logo" fill className="object-contain hidden dark:block" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground font-headline tracking-tight">
                {currentContent.title}
              </h1>
              <p className="text-xs font-semibold text-muted-foreground hidden sm:block">
                {currentContent.subtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
            <Button variant="outline" size="icon" onClick={toggleTheme} aria-label={currentContent.themeSwitch}>
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">{currentContent.themeSwitch}</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8">
        <DrawSimulator lang={lang} />
      </main>
      <footer className="py-6 px-4 sm:px-6 lg:px-8 border-t mt-auto bg-secondary/50">
        <div className="container mx-auto text-center text-muted-foreground">
          <div className="flex justify-center items-center gap-2 mb-2">
            <span className="text-sm font-semibold">{currentContent.footer.developedBy}</span>
            <div className="relative h-8 w-24">
              <Image src="/logos/lbv_group_negro.png" alt="Developer Logo" fill className="object-contain dark:hidden" />
              <Image src="/logos/lbv_group_blanco.png" alt="Developer Logo" fill className="object-contain hidden dark:block" />
            </div>
          </div>
          <p className="text-xs">
            {currentContent.footer.disclaimer}
          </p>
        </div>
      </footer>
    </div>
  );
}
