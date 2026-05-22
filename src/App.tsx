import React, { useState } from 'react';
import { Terminal, ListPlus, Wand2 } from 'lucide-react';
import { CommandGenerator } from './components/CommandGenerator';
import { ListRenamer } from './components/ListRenamer';
import { cn } from './utils';

export default function App() {
  const [activeTab, setActiveTab] = useState<'command' | 'list'>('command');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col pt-8 sm:pt-12">
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 flex-1 flex flex-col">
        
        {/* Header */}
        <header className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl px-6 py-5 mb-8 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-600/20">
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                Prefix Remover
              </h1>
              <p className="text-sm font-medium text-slate-500 mt-0.5">
                Generate safe local shell scripts
              </p>
            </div>
          </div>
        </header>

        {/* Main Card */}
        <main className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col mb-12">
          
          {/* Tabs */}
          <div className="flex px-3 pt-3 border-b border-slate-100 bg-slate-50">
            <button
              onClick={() => setActiveTab('command')}
              className={cn(
                "flex items-center gap-2 px-6 py-3.5 text-sm font-bold uppercase tracking-wider transition-all outline-none",
                activeTab === 'command' 
                  ? "border-b-2 border-blue-600 text-blue-600 bg-white rounded-t-xl shadow-sm z-10" 
                  : "border-b-2 border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 rounded-t-xl"
              )}
            >
              <Terminal className="w-4 h-4" />
              Dynamic Command
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={cn(
                "flex items-center gap-2 px-6 py-3.5 text-sm font-bold uppercase tracking-wider transition-all outline-none ml-1",
                activeTab === 'list' 
                  ? "border-b-2 border-blue-600 text-blue-600 bg-white rounded-t-xl shadow-sm z-10" 
                  : "border-b-2 border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 rounded-t-xl"
              )}
            >
              <ListPlus className="w-4 h-4" />
              Manual List
            </button>
          </div>

          {/* Content Area */}
          <div className="p-6 sm:p-8 flex-1 bg-white flex flex-col">
            {activeTab === 'command' ? (
              <div className="animate-in fade-in duration-300 flex-1 flex flex-col">
                <CommandGenerator />
              </div>
            ) : (
              <div className="animate-in fade-in duration-300 flex-1 flex flex-col">
                <ListRenamer />
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
