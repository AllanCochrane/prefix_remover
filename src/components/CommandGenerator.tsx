import React, { useState } from 'react';
import { Copy, Terminal, Download, CheckCircle2, FileCode2, Play, AlertTriangle } from 'lucide-react';
import { generateBashCommand, generatePowerShellCommand, cn, copyToClipboard } from '../utils';

export function CommandGenerator() {
  const [directory, setDirectory] = useState('/mnt/media/TV/FBI/Season 8');
  const [prefix, setPrefix] = useState('www.UIndex.org    -    ');
  const [os, setOs] = useState<'linux' | 'windows'>('linux');
  const [action, setAction] = useState<'rename' | 'delete'>('rename');
  const [dryRun, setDryRun] = useState(false);
  const [copied, setCopied] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [execResult, setExecResult] = useState<{success?: boolean, processed?: number, errors?: string[], msg?: string} | null>(null);

  const command = os === 'linux' 
    ? generateBashCommand(directory, prefix, action, dryRun)
    : generatePowerShellCommand(directory, prefix, action, dryRun);

  const handleCopy = async () => {
    const success = await copyToClipboard(command);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([command], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = os === 'linux' ? 'rename.sh' : 'rename.ps1';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const executeOnServer = async () => {
    if (dryRun) {
      setExecResult({ msg: "Cannot execute dry run directly on server. Uncheck Dry Run or use the generated script." });
      return;
    }
    if (action === 'delete' && !window.confirm(`Are you sure you want to permanently delete files starting with "${prefix}" in "${directory}"?`)) {
      return;
    }
    
    setExecuting(true);
    setExecResult(null);
    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directory, prefix, action })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server error');
      setExecResult(data);
    } catch (err: any) {
      setExecResult({ errors: [err.message] });
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-8 flex flex-col flex-1">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">Target Directory</label>
          <input
            type="text"
            value={directory}
            onChange={(e) => setDirectory(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-mono"
            placeholder="/path/to/folder"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">Prefix to Remove</label>
          <input
            type="text"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-mono"
            placeholder="Prefix to remove"
          />
        </div>
      </div>

      <div className="flex gap-6 items-center flex-wrap">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-700">Action:</label>
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
            <button
              onClick={() => setAction('rename')}
              className={cn(
                "px-4 py-1.5 text-xs font-bold rounded-md transition-all uppercase tracking-wide",
                action === 'rename' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              )}
            >
              Rename
            </button>
            <button
              onClick={() => setAction('delete')}
              className={cn(
                "px-4 py-1.5 text-xs font-bold rounded-md transition-all uppercase tracking-wide",
                action === 'delete' ? "bg-red-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              )}
            >
              Delete
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer group">
          <input 
            type="checkbox" 
            checked={dryRun} 
            onChange={(e) => setDryRun(e.target.checked)} 
            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500/20"
          />
          <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">Dry Run Script</span>
        </label>
        
        <button
          onClick={executeOnServer}
          disabled={executing || dryRun}
          className="ml-auto flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all"
        >
          {executing ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          Execute on Server
        </button>
      </div>

      {execResult && (
        <div className={cn("p-4 rounded-xl border flex gap-3", execResult.errors?.length || execResult.msg ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-green-50 border-green-200 text-green-800')}>
          {execResult.errors?.length || execResult.msg ? <AlertTriangle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
          <div>
            {execResult.success && <div className="font-semibold mb-1">Successfully processed {execResult.processed} files.</div>}
            {execResult.msg && <div>{execResult.msg}</div>}
            {execResult.errors && execResult.errors.length > 0 && (
              <ul className="list-disc list-inside text-sm space-y-1 mt-1">
                {execResult.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}
              </ul>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Generated Script</h2>
            <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
              <button
                onClick={() => setOs('linux')}
                className={cn(
                  "px-3 py-1.5 text-[11px] font-bold rounded-md transition-all uppercase tracking-wide",
                  os === 'linux' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                )}
              >
                Bash (Linux/Mac)
              </button>
              <button
                onClick={() => setOs('windows')}
                className={cn(
                  "px-3 py-1.5 text-[11px] font-bold rounded-md transition-all uppercase tracking-wide",
                  os === 'windows' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                )}
              >
                PowerShell (Windows)
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-sm"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 border border-blue-700 rounded-lg transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-inner flex flex-col min-h-[300px]">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 bg-white">
            <div className="flex items-center text-[11px] text-slate-500 font-mono font-bold uppercase tracking-widest">
              {os === 'linux' ? <Terminal className="w-4 h-4 mr-2" /> : <FileCode2 className="w-4 h-4 mr-2" />}
              {os === 'linux' ? 'rename.sh' : 'rename.ps1'}
            </div>
          </div>
          <pre className="p-5 overflow-auto text-[13px] font-mono text-slate-700 bg-slate-50 flex-1">
            <code>{command}</code>
          </pre>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-4 text-blue-800 text-sm leading-relaxed">
        <div className="mt-0.5 text-blue-600 shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <div>
          <strong className="text-blue-900 block mb-1 font-semibold">Important Note</strong>
          Because web browsers cannot efficiently rename large local media files directly without duplicating them, this tool generates a highly-optimized script for you to run locally. Run the script in your terminal to instantly rename the files in place.
        </div>
      </div>
    </div>
  );
}
