import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Cpu, Terminal, Clock, Activity, AlertTriangle } from 'lucide-react';

export default function AILogsConsole() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);

  const loadLogs = async () => {
    try {
      const res = await api.get('/ai/logs/');
      setLogs(res.data.data || res.data);
    } catch (err) {
      toast.error('Failed to load AI logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Cpu className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">AI Engine Request Monitor</h1>
          <p className="text-sm text-slate-500 mt-1">Audit execution latency, responses, and errors of Gemini API operations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Logs List Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Execution Logs</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500">
                  <th className="py-3">Endpoint</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Latency</th>
                  <th className="py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr 
                    key={log.id} 
                    onClick={() => setSelectedLog(log)}
                    className={`border-b border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-350 cursor-pointer transition-colors
                      ${selectedLog?.id === log.id ? 'bg-blue-50/50 dark:bg-blue-950/20' : 'hover:bg-slate-50/50'}
                    `}
                  >
                    <td className="py-3.5 font-semibold flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-slate-400" /> {log.endpoint}
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full 
                        ${log.status === 'Success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}
                      `}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3.5 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {log.execution_time.toFixed(2)}s</td>
                    <td className="py-3.5 text-xs text-slate-450">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Log Inspector */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
          {selectedLog ? (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Request Details</h3>
              
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Request Payload</span>
                  <pre className="text-xs bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto text-slate-700 dark:text-slate-300 mt-1 max-h-48 whitespace-pre-wrap">
                    {JSON.stringify(JSON.parse(selectedLog.request_payload || '{}'), null, 2)}
                  </pre>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Response Payload</span>
                  <pre className="text-xs bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto text-slate-755 dark:text-slate-300 mt-1 max-h-64 whitespace-pre-wrap">
                    {selectedLog.status === 'Success' 
                      ? JSON.stringify(JSON.parse(selectedLog.response_payload || '{}'), null, 2)
                      : selectedLog.response_payload
                    }
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4 animate-pulse" />
              <h4 className="font-bold text-slate-700 dark:text-slate-350">Select a log entry</h4>
              <p className="text-xs text-slate-400 mt-1">Click any entry on the left to inspect raw payloads and execution parameters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
