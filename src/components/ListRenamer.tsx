import React, { useState, useMemo } from 'react';
import { Copy, CheckCircle2, Play, AlertTriangle } from 'lucide-react';
import { cn, copyToClipboard } from '../utils';

export function ListRenamer() {
  const [inputList, setInputList] = useState('');
  const [prefix, setPrefix] = useState('www.UIndex.org    -    ');
  const [action, setAction] = useState<'rename' | 'delete'>('rename');
  const [dryRun, setDryRun] = useState(false);
  const [copied, setCopied] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [execResult, setExecResult] = useState<{success?: boolean, processed?: number, errors?: string[], msg?: string} | null>(null);

  const previewList = useMemo(() => {
    if (!inputList.trim()) return [];
    
    return inputList.split('\n').filter(line => line.trim() !== '').map(rawLine => {
      // Remove trailing \r from Windows clipboard to prevent filename distortion
      const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
      
      // Support both forward slashes and backslashes for path splitting
      const isWindowsPath = line.includes('\\') && !line.includes('/');
      const separator = isWindowsPath ? '\\' : '/';
      const parts = line.split(separator);
      const filename = parts.pop() || '';
      const dir = parts.join(separator);
      
      let newFilename = filename;
      if (filename.startsWith(prefix)) {
        newFilename = filename.slice(prefix.length);
      }
      
      return {
        original: line,
        dir,
        base: filename,
        newBase: action === 'delete' ? null : newFilename,
        changed: filename.startsWith(prefix)
      };
    });
  }, [inputList, prefix, action]);

  const script = useMemo(() => {
    let output = '#!/usr/bin/env bash\n\n';
    if (dryRun) {
      output += 'echo ">>> DRY RUN MODE ESTABLISHED. NO FILES WILL BE MODIFIED. <<<"\n\n';
    }
    
    previewList.filter(item => item.changed).forEach(item => {
      const safeOriginal = item.original.replace(/'/g, "'\\''");
      
      if (action === 'delete') {
         if (dryRun) {
           output += `echo "[DRY RUN] Would delete: ${safeOriginal}"\n`;
         } else {
           output += `echo "Deleting: ${safeOriginal}"\n`;
           output += `rm -f '${safeOriginal}'\n`;
         }
      } else {
        const safeNewBase = item.newBase!.replace(/'/g, "'\\''");
        const safeDir = item.dir.replace(/'/g, "'\\''");
        // Use full absolute path if available, else just the filename
        const isWindowsPath = item.original.includes('\\') && !item.original.includes('/');
        const separator = isWindowsPath ? '\\' : '/';
        const targetPath = item.dir ? `${safeDir}${separator}${safeNewBase}` : safeNewBase;
        
        if (dryRun) {
          output += `echo "[DRY RUN] Would rename to: ${targetPath}"\n`;
        } else {
          output += `mv -n '${safeOriginal}' '${targetPath}'\n`;
        }
      }
    });
    return output;
  }, [previewList, action, dryRun]);

  const handleCopy = async () => {
    const success = await copyToClipboard(script);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const executeOnServer = async () => {
    if (dryRun) {
      setExecResult({ msg: "Cannot execute dry run directly on server. Uncheck Dry Run or use the generated script." });
      return;
    }
    
    const itemsToProcess = previewList.filter(p => p.changed);
    if (itemsToProcess.length === 0) return;
    
    if (action === 'delete' && !window.confirm(`Are you sure you want to permanently delete ${itemsToProcess.length} files?`)) {
      return;
    }
    
    setExecuting(true);
    setExecResult(null);
    try {
      const res = await fetch('/api/execute-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToProcess, action, prefix })
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
    <div className="space-y-6 flex flex-col flex-1">
      <div className="grid grid-cols-1 gap-6">
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
        <div className="space-y-1">
          <div className="flex justify-between items-baseline mb-1">
            <label className="block text-sm font-medium text-slate-700">Paste File Paths List</label>
            <span className="text-xs text-slate-500">One path/filename per line</span>
          </div>
          <textarea
            value={inputList}
            onChange={(e) => setInputList(e.target.value)}
            className="w-full h-32 bg-slate-50 border border-slate-200 rounded-lg p-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-mono text-[13px] resize-y shadow-inner"
            placeholder="/mnt/media/TV/FBI/Season 8/www.UIndex.org    -    FBI.S08E15.mkv&#10;/mnt/media/TV/FBI/Season 8/www.UIndex.org    -    FBI.S08E16.mkv"
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
          disabled={executing || dryRun || inputList.trim() === '' || previewList.filter(p => p.changed).length === 0}
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

      {previewList.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-slate-100 flex-1 flex flex-col">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
               <div className="flex items-center gap-2">
                 <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Changes Preview</h2>
               </div>
               <span className={cn("px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wide", action === 'delete' ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600")}>
                 {previewList.filter(p => p.changed).length} {action === 'delete' ? 'queued for deletion' : 'changed'}
               </span>
            </div>

            <div className="flex-1 overflow-x-auto max-h-[300px] overflow-y-auto bg-white">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest sticky top-0 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3 w-1/2">Original Filename</th>
                    <th className="px-6 py-3 w-1/2">New Filename</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                  {previewList.map((item, i) => (
                    <tr key={i} className={cn("transition-colors", item.changed && action === 'delete' ? "bg-red-50/50 hover:bg-red-50" : "hover:bg-slate-50")}>
                      <td className={cn("px-6 py-3 font-mono text-[12px] max-w-xs truncate", item.changed && action === 'delete' ? "text-red-700" : "text-slate-700")} title={item.base}>
                        {item.changed && prefix && action !== 'delete' ? (
                          <>
                            <span className="text-red-500 bg-red-50 px-0.5 rounded-sm whitespace-pre">{prefix}</span>
                            <span className="whitespace-pre">{item.base.slice(prefix.length)}</span>
                          </>
                        ) : (
                          <span className="whitespace-pre">{item.base}</span>
                        )}
                      </td>
                      <td className={cn("px-6 py-3 font-mono text-[12px] max-w-xs truncate", item.changed ? (action === 'delete' ? "text-red-500 line-through" : "text-blue-600 font-medium") : "text-slate-500")} title={item.newBase || ""}>
                        <span className="whitespace-pre">{action === 'delete' && item.changed ? "DELETED" : item.newBase}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-[11px] font-medium text-slate-500 flex items-center justify-between">
              <span>Showing {previewList.length} items</span>
            </div>
          </div>

          {previewList.some(p => p.changed) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Generated Command</h2>
                 <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-sm"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy Script"}
                </button>
              </div>
              <pre className="p-5 bg-slate-50 border border-slate-200 rounded-xl overflow-x-auto text-[13px] font-mono text-slate-800 max-h-48 overflow-y-auto shadow-inner">
                <code>{script}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
