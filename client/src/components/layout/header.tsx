import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon, BellIcon } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{title}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <div className="relative">
            <SearchIcon className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
            <Input
              type="text"
              placeholder="Search tickets..."
              className="w-64 pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-header-search"
            />
          </div>
          
          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="relative p-2"
            data-testid="button-notifications"
          >
            <BellIcon className="w-5 h-5" />
            {/* Notification indicator */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>
        </div>
      </div>
    </header>
  );
}
