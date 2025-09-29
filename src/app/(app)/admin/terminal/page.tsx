
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Terminal as TerminalIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type OutputLine = {
  text: string;
  type: 'input' | 'output' | 'error' | 'system';
};

export default function TerminalPage() {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState<OutputLine[]>([
        { text: 'BeMatch Terminal v0.1.0', type: 'system' },
        { text: 'Type "help" for a list of available commands.', type: 'system' }
    ]);
    const endOfOutputRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfOutputRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [output]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };
    
    const handleInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const command = input.trim();
            if (command) {
                const newOutput: OutputLine[] = [...output, { text: `> ${command}`, type: 'input' }];
                setOutput(newOutput);
                
                // Process command
                await processCommand(command, newOutput);
            }
            setInput('');
        }
    };
    
    const processCommand = async (command: string, currentOutput: OutputLine[]) => {
        const [cmd, ...args] = command.split(' ');
        let result: OutputLine[];

        switch(cmd) {
            case 'help':
                result = [
                    { text: 'Available commands:', type: 'output' },
                    { text: '  help     - Shows this help message', type: 'output' },
                    { text: '  clear    - Clears the terminal screen', type: 'output' },
                    { text: '  date     - Displays the current date and time', type: 'output' },
                ];
                break;
            case 'clear':
                setOutput([]);
                return;
            case 'date':
                result = [{ text: new Date().toLocaleString('tr-TR'), type: 'output' }];
                break;
            default:
                result = [{ text: `Error: Command not found: ${command}`, type: 'error' }];
                break;
        }
        
        setOutput([...currentOutput, ...result]);
    }

    return (
        <Card className="h-[75vh] w-full flex flex-col font-mono">
            <div className="flex-shrink-0 p-2 bg-muted/50 border-b flex items-center gap-2">
                <TerminalIcon className="w-4 h-4" />
                <span className="text-sm font-semibold">Admin Terminal</span>
            </div>
            <CardContent 
                className="p-4 flex-1 overflow-y-auto bg-black text-white"
            >
                {output.map((line, index) => (
                    <div 
                        key={index}
                        className={cn('whitespace-pre-wrap', {
                            'text-green-400': line.type === 'input',
                            'text-gray-400': line.type === 'system',
                            'text-red-400': line.type === 'error',
                            'text-white': line.type === 'output',
                        })}
                    >
                        {line.text}
                    </div>
                ))}
                <div ref={endOfOutputRef} />
            </CardContent>
             <div className="flex-shrink-0 p-2 bg-black border-t border-gray-700 flex items-center">
                <span className="text-green-400 mr-2">{'>'}</span>
                <input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleInputKeyDown}
                    className="w-full bg-transparent text-white outline-none font-mono"
                    autoFocus
                    placeholder='Type a command...'
                />
            </div>
        </Card>
    );
}
