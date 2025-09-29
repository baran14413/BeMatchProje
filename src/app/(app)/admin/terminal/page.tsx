
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Terminal as TerminalIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSystemInfo } from '@/ai/flows/get-system-info-flow';

type OutputLine = {
  text: string;
  type: 'input' | 'output' | 'error' | 'system' | 'header';
};

export default function TerminalPage() {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState<OutputLine[]>([
        { text: 'BeMatch Terminal v0.2.0', type: 'system' },
        { text: '`yardim` yazarak mevcut komutları görebilirsiniz.', type: 'system' }
    ]);
    const [isProcessing, setIsProcessing] = useState(false);
    const endOfOutputRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfOutputRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [output]);

    const addOutput = (lines: OutputLine[]) => {
        setOutput(prev => [...prev, ...lines]);
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const processCommand = useCallback(async (command: string) => {
        const [cmd, ...args] = command.toLowerCase().split(' ');
        
        switch(cmd) {
            case 'yardim':
                addOutput([
                    { text: 'Mevcut Komutlar:', type: 'header' },
                    { text: '  yardim      - Bu yardım menüsünü gösterir', type: 'output' },
                    { text: '  temizle     - Terminal ekranını temizler', type: 'output' },
                    { text: '  tarih       - Mevcut tarih ve saati gösterir', type: 'output' },
                    { text: '  cpu         - Sunucu işlemci durumunu gösterir', type: 'output' },
                ]);
                break;
            case 'temizle':
                setOutput([]);
                return;
            case 'tarih':
                addOutput([{ text: new Date().toLocaleString('tr-TR'), type: 'output' }]);
                break;
            case 'cpu':
                try {
                    const result = await getSystemInfo({ infoType: 'cpu' });
                    if (result.data) {
                        const { model, cores, usage, load, health } = result.data;
                        addOutput([
                            { text: 'CPU Durumu:', type: 'header' },
                            { text: `  İşlemci Modeli : ${model}`, type: 'output' },
                            { text: `  Çekirdek Sayısı : ${cores}`, type: 'output' },
                            { text: `  Anlık Kullanım : ${usage}`, type: 'output' },
                            { text: `  Ortalama Yük   : ${load}`, type: 'output' },
                            { text: `  Sağlık         : ${health}`, type: 'output' },
                        ]);
                    } else {
                        throw new Error(result.error || 'CPU bilgisi alınamadı.');
                    }
                } catch (error: any) {
                    addOutput([{ text: `Hata: ${error.message}`, type: 'error' }]);
                }
                break;
            default:
                addOutput([{ text: `Hata: Komut bulunamadı: '${command}'`, type: 'error' }]);
                break;
        }
    }, []);
    
    const handleInputKeyDown = useCallback(async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !isProcessing) {
            const command = input.trim();
            if (command) {
                addOutput([{ text: `> ${command}`, type: 'input' }]);
                setIsProcessing(true);
                await processCommand(command);
                setIsProcessing(false);
            }
            setInput('');
        }
    }, [input, isProcessing, processCommand]);

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
                            'text-cyan-400 font-bold': line.type === 'header',
                            'text-white': line.type === 'output',
                        })}
                    >
                        {line.text}
                    </div>
                ))}
                {isProcessing && <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin text-yellow-400" /> <span className="text-yellow-400">İşleniyor...</span></div>}
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
                    placeholder='Bir komut yazın...'
                    disabled={isProcessing}
                />
            </div>
        </Card>
    );
}
