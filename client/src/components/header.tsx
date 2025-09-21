import { Button } from "@/components/ui/button";
import { Images, Moon, Sun } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <header className="border-b border-border bg-card" data-testid="header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Images className="text-primary text-2xl" data-testid="logo-icon" />
            <h1 className="text-xl font-bold text-foreground" data-testid="app-title">
              PresentationFinder
            </h1>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a 
              href="#" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="nav-search"
            >
              Search
            </a>
            <a 
              href="#" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="nav-history"
            >
              History
            </a>
            <a 
              href="#" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="nav-favorites"
            >
              Favorites
            </a>
            <a 
              href="#" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="nav-about"
            >
              About
            </a>
          </nav>
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleTheme}
              data-testid="theme-toggle"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button data-testid="sign-in-button">
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
