
'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { X as XIcon, ChevronsUpDown } from 'lucide-react';

export type MultiSelectOption = {
  value: string;
  label: string;
};

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({ options, selected, onChange, placeholder = "Select options...", className }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleUnselect = (value: string) => {
    onChange(selected.filter((s) => s !== value));
  };

  const selectedLabels = useMemo(() => {
    return options.filter(option => selected.includes(option.value)).map(option => option.label);
  }, [options, selected]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild ref={triggerRef}>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal h-auto min-h-10", className)}
          onClick={() => setOpen(!open)}
        >
          <div className="flex gap-1 flex-wrap">
            {selectedLabels.length > 0 ? (
              selectedLabels.map((label) => (
                <Badge
                  key={label}
                  variant="secondary"
                  className="mr-1"
                  onClick={(e) => {
                     e.stopPropagation();
                     const option = options.find(o => o.label === label);
                     if (option) {
                         handleUnselect(option.value);
                     }
                  }}
                >
                  {label}
                  <XIcon className="ml-1 h-3 w-3" />
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-full p-0" 
        style={{ width: `${triggerRef.current?.offsetWidth}px` }} 
        align="start"
      >
        <Command>
          <CommandInput placeholder="Ara..." />
          <CommandList>
            <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => {
                    const newSelected = selected.includes(option.value)
                      ? selected.filter((s) => s !== option.value)
                      : [...selected, option.value];
                    onChange(newSelected);
                  }}
                >
                  <div
                    className={cn(
                      'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                      selected.includes(option.value) ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible'
                    )}
                  >
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
