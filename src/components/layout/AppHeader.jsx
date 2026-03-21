import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plane, Plus, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import UserMenu from './UserMenu';

export default function AppHeader() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between px-4 h-14">
        <Link to="/Dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Plane className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide text-primary">OOS TRACKER</h1>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link to="/NewOOS">
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" />
              NEW
            </Button>
          </Link>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}