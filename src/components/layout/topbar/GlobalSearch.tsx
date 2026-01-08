import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import { useNavigate } from 'react-router-dom';

export function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    return (
        <>
            <Button
                variant="outline"
                className="relative h-8 w-8 p-0 xl:h-8 xl:w-96 xl:justify-start xl:px-3 xl:py-1"
                onClick={() => setOpen(true)}
            >
                <Search className="h-4 w-4 xl:mr-2" />
                <span className="hidden xl:inline-flex text-muted-foreground font-normal">Search...</span>
                <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[12px] font-medium opacity-100 xl:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Type a command or search..." />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup heading="Suggestions">
                        <CommandItem onSelect={() => runCommand(() => navigate('/dashboard'))}>
                            Dashboard
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate('/campaigns'))}>
                            Campaigns
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate('/contacts'))}>
                            Contacts
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate('/forms'))}>
                            Forms
                        </CommandItem>
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Settings">
                        <CommandItem onSelect={() => runCommand(() => navigate('/settings'))}>
                            Profile
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate('/settings#agency'))}>
                            Agency Settings
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    );
}
