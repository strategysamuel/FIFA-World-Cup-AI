import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Users,
  Train,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Settings,
  Clock,
  Radio,
  Info,
  Layers,
  Search,
  Send,
  X,
  Zap,
  Check,
  AlertCircle,
  Play,
  Pause,
  ChevronRight,
  Monitor,
  Flame,
  Volume2
} from 'lucide-react';

// Define the Stadium Zone interface
interface StadiumZone {
  id: string;
  name: string;
  crowdDensity: number; // 0 to 100
  wifiLatency: number; // ms
  transitFlow: number; // people/min
  alertLevel: 'normal' | 'warning' | 'danger';
  activeIssues: string[];
  temperature: number; // F
  staffCount: number;
}

// Default pre-loaded stadium zones
const INITIAL_ZONES: StadiumZone[] = [
  { id: 'north-stand', name: 'North Stand (Premium)', crowdDensity: 88, wifiLatency: 45, transitFlow: 140, alertLevel: 'normal', activeIssues: [], temperature: 72, staffCount: 42 },
  { id: 'south-stand', name: 'South Stand (Family)', crowdDensity: 95, wifiLatency: 180, transitFlow: 290, alertLevel: 'warning', activeIssues: ['Wifi AP-88 High Latency'], temperature: 74, staffCount: 38 },
  { id: 'east-stand', name: 'East Stand (Supporters)', crowdDensity: 98, wifiLatency: 52, transitFlow: 350, alertLevel: 'danger', activeIssues: ['Gate 4 Congestion', 'Loudspeaker Audio Sync Delay'], temperature: 75, staffCount: 55 },
  { id: 'west-stand', name: 'West Stand (Press & VIP)', crowdDensity: 74, wifiLatency: 28, transitFlow: 80, alertLevel: 'normal', activeIssues: [], temperature: 71, staffCount: 30 },
  { id: 'concourse-a', name: 'Level A Concourse', crowdDensity: 82, wifiLatency: 64, transitFlow: 190, alertLevel: 'normal', activeIssues: [], temperature: 73, staffCount: 25 },
  { id: 'concourse-b', name: 'Level B Concourse', crowdDensity: 90, wifiLatency: 110, transitFlow: 220, alertLevel: 'warning', activeIssues: ['Debris blockage on ramp B3'], temperature: 73, staffCount: 22 },
  { id: 'pitch-area', name: 'Pitch Area & Security Perimeter', crowdDensity: 15, wifiLatency: 18, transitFlow: 10, alertLevel: 'normal', activeIssues: [], temperature: 69, staffCount: 120 },
  { id: 'transit-hub', name: 'Metro Egress Hub', crowdDensity: 92, wifiLatency: 35, transitFlow: 450, alertLevel: 'warning', activeIssues: ['Metro train arrival delayed 4M'], temperature: 68, staffCount: 48 },
];

export default function App() {
  // --- STATE DECLARATIONS ---
  const [activeTab, setActiveTab] = useState<'overview' | 'heatmap' | 'telemetry' | 'scenarios'>('overview');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('east-stand');
  const [mapFilter, setMapFilter] = useState<'crowd' | 'wifi' | 'transit'>('crowd');
  
  // Dynamic Stadium Stats (Operator can modify using simulation controls!)
  const [attendance, setAttendance] = useState<number>(68412);
  const [transitLoad, setTransitLoad] = useState<number>(12400);
  const [opsEfficiency, setOpsEfficiency] = useState<number>(92);
  const [stadiumStatus, setStadiumStatus] = useState<string>('OPERATIONAL - FULL CAPACITY');
  
  // Custom interactive alerts
  const [alerts, setAlerts] = useState<Array<{ id: string; title: string; message: string; type: 'warning' | 'danger' | 'info' }>>([
    { id: '1', title: 'CROWD ALERT • T+15m Prediction', message: 'Congestion predicted at North Ramp Gate 4. Inflow exceeds capacity by 22%. Recommend activating overflow Sector 12 now.', type: 'warning' },
    { id: '2', title: 'LOGISTICS ADVISORY', message: 'Metro Blue Line delayed 4 mins. Shuttle fleet #14-22 rerouted to secondary hub for fan egress optimization.', type: 'danger' },
    { id: '3', title: 'SUSTAINABILITY SYNC', message: 'HVAC load reduced in unoccupied Concourse B. Smart lighting at 40% until match conclusion.', type: 'info' }
  ]);

  // Interactive Custom Query and Gemini Insights
  const [insightQuery, setInsightQuery] = useState<string>('');
  const [isLoadingInsights, setIsLoadingInsights] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [customResponse, setCustomResponse] = useState<any>(null);
  const [insightLogs, setInsightLogs] = useState<string[]>([
    "Initial neural engine boot up... OK",
    "Connecting with local telemetry feeds... OK",
    "Awaiting tactical scenario queries..."
  ]);

  // Telemetry Scroll Stream
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([
    "[GATE 14] FLOW NORMAL - Rate: 120 pax/min",
    "[WIFI NODE 88] HIGH LATENCY - 180ms registered",
    "[GENAI] Spectator sentiment positive (84%) via social sentiment clustering",
    "[METRO] Next Egress Train Arrival in 4 minutes",
    "[ELEVATOR 4] SERVICE REQ - Technician dispatched to West Shaft",
    "[PITCH] Live-Feed Sync: Match clock 72:18",
    "[GATE 4] Heavy spectator queue build-up. Commencing secondary gate bypass..."
  ]);
  const [isLiveTelemetryRunning, setIsLiveTelemetryRunning] = useState<boolean>(true);

  // Time & Zone State
  const [timeStr, setTimeStr] = useState<string>('');
  const [zones, setZones] = useState<StadiumZone[]>(INITIAL_ZONES);

  // --- REFS ---
  const logContainerRef = useRef<HTMLDivElement>(null);

  // --- CLOCK TRIGGER ---
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format as "HH:MM:SS UTC-7" (or matching timezone)
      const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'America/Los_Angeles'
      };
      const formatted = new Intl.DateTimeFormat('en-US', options).format(now);
      setTimeStr(`${formatted} UTC-7`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- DYNAMIC TELEMETRY LOG GENERATION ---
  useEffect(() => {
    if (!isLiveTelemetryRunning) return;

    const logPhrases = [
      () => `[GATE 4] INFLOW SPEED: ${(80 + Math.random() * 60).toFixed(0)} pax/min`,
      () => `[WIFI NODE 12] CONCURRENT USERS: ${(300 + Math.random() * 150).toFixed(0)} active`,
      () => `[METRO] Blue Line Shuttle departs with ${(180 + Math.random() * 50).toFixed(0)} passengers`,
      () => `[ENERGY GRID] Current Consumption: ${(4200 + Math.random() * 300).toFixed(0)} kW (OPTIMAL)`,
      () => `[SECTOR 12] Crowd Density threshold evaluated at ${(85 + Math.random() * 15).toFixed(1)}%`,
      () => `[AI TRANSLATION] Hit registered in ${['Spanish', 'Portuguese', 'Korean', 'Japanese', 'Arabic', 'French'][Math.floor(Math.random() * 6)]} (Matchday help query)`,
      () => `[SECURITY] Shift rotation completed at Concourse B South Entrance`,
    ];

    const interval = setInterval(() => {
      const newLog = logPhrases[Math.floor(Math.random() * logPhrases.length)]();
      setTelemetryLogs((prev) => {
        const next = [...prev, newLog];
        // Keep maximum 30 logs
        return next.slice(-30);
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [isLiveTelemetryRunning]);

  // Auto-scroll logs to bottom when updated
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [telemetryLogs]);

  // --- HELPER FUNCTION FOR HEATMAP COLORS ---
  const getFilterColor = (zone: StadiumZone) => {
    let value = 0;
    if (mapFilter === 'crowd') {
      value = zone.crowdDensity;
      if (value > 90) return 'fill-rose-500/80 stroke-rose-400';
      if (value > 80) return 'fill-amber-500/80 stroke-amber-400';
      return 'fill-emerald-500/80 stroke-emerald-400';
    } else if (mapFilter === 'wifi') {
      value = zone.wifiLatency;
      if (value > 150) return 'fill-rose-500/70 stroke-rose-400 animate-pulse';
      if (value > 70) return 'fill-amber-500/70 stroke-amber-400';
      return 'fill-indigo-500/70 stroke-indigo-400';
    } else {
      value = zone.transitFlow;
      if (value > 300) return 'fill-rose-500/70 stroke-rose-400';
      if (value > 150) return 'fill-amber-500/70 stroke-amber-400';
      return 'fill-indigo-500/70 stroke-indigo-400';
    }
  };

  // --- SIMULATION CONTROLS ---
  const handleSimulateEmergency = (type: string) => {
    if (type === 'gate4') {
      setAttendance(74211);
      setTransitLoad(16800);
      setOpsEfficiency(78);
      setStadiumStatus('WARNING - CONGESTION AT GATE 4');
      
      // Update individual zone
      setZones(prev => prev.map(z => {
        if (z.id === 'east-stand') {
          return { ...z, crowdDensity: 100, transitFlow: 510, alertLevel: 'danger', activeIssues: ['Critical Gate 4 queueing bottleneck'] };
        }
        return z;
      }));

      // Add actual alert
      const newAlertId = Date.now().toString();
      setAlerts(prev => [
        {
          id: newAlertId,
          title: 'CRITICAL CRUSH RISK • EAST STAND GATE 4',
          message: 'Inflow rate is exceeding safe buffer limits. Spectators have backed up onto public walkway. Dispatched Crowd Response Team C.',
          type: 'danger'
        },
        ...prev
      ]);

      setTelemetryLogs(prev => [
        ...prev,
        `[CRITICAL EMERGENCY] Gate 4 capacity exceeded. Security dispatched.`,
        `[OPS CENTER] Auto-routing emergency instructions to Sector 12 and East Stand display units.`
      ]);
    } else if (type === 'metro') {
      setTransitLoad(19500);
      setOpsEfficiency(65);
      setStadiumStatus('CRITICAL - METRO OUTAGE');

      setZones(prev => prev.map(z => {
        if (z.id === 'transit-hub') {
          return { ...z, crowdDensity: 99, transitFlow: 650, alertLevel: 'danger', activeIssues: ['Power failure on Metro Purple Line', 'Train egress stalled'] };
        }
        return z;
      }));

      const newAlertId = Date.now().toString();
      setAlerts(prev => [
        {
          id: newAlertId,
          title: 'METRO OUTAGE • SYSTEM SHUTDOWN',
          message: 'Subway rail electrical fire detected near Century Blvd Hub. Outbound transit is completely halted. Deploying emergency shuttle contingency plan 4-B.',
          type: 'danger'
        },
        ...prev
      ]);

      setTelemetryLogs(prev => [
        ...prev,
        `[TRANSIT WARNING] Rail power down registered. Commencing immediate bus shuttle bridge.`,
        `[GENAI] Advisory: Generate shuttle load balancing plan.`
      ]);
    } else if (type === 'reset') {
      setAttendance(68412);
      setTransitLoad(12400);
      setOpsEfficiency(94);
      setStadiumStatus('OPERATIONAL - FULL CAPACITY');
      setZones(INITIAL_ZONES);
      setAlerts([
        { id: '1', title: 'CROWD ALERT • T+15m Prediction', message: 'Congestion predicted at North Ramp Gate 4. Inflow exceeds capacity by 22%. Recommend activating overflow Sector 12 now.', type: 'warning' },
        { id: '3', title: 'SUSTAINABILITY SYNC', message: 'HVAC load reduced in unoccupied Concourse B. Smart lighting at 40% until match conclusion.', type: 'info' }
      ]);
      setTelemetryLogs(prev => [...prev, `[OPS CENTER] Status reset to default benchmark parameters.`]);
    }
  };

  // --- CALL SERVER GEMINI API ---
  const handleGenerateAIInsights = async (customPrompt?: string) => {
    setIsLoadingInsights(true);
    setLoadingStep('Inicitalizing connection to Gemini operational models...');
    setCustomResponse(null);

    const promptText = customPrompt || insightQuery || "Perform general Operations optimization sweep.";

    // Simulated high-density logs for visual engagement
    setInsightLogs([
      `⚡ Booting Gemini operational engine...`,
      `🔍 Accessing local database metrics: Attendance=${attendance}, TransitLoad=${transitLoad}, Efficiency=${opsEfficiency}`,
      `📊 Injecting active alert variables...`,
      `🤖 Reasoning via gemini-3.5-flash with real-time stadium guidelines...`
    ]);

    setTimeout(() => {
      setInsightLogs(prev => [...prev, `⏳ Analyzing spectator safety parameters...`]);
    }, 800);

    setTimeout(() => {
      setInsightLogs(prev => [...prev, `🔋 Simulating halftimes transit scheduling...`]);
    }, 1500);

    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendance,
          transitLoad,
          opsEfficiency,
          stadiumStatus,
          activeAlerts: alerts,
          query: promptText
        })
      });

      if (!response.ok) {
        throw new Error('API server returned error status.');
      }

      const data = await response.json();
      setCustomResponse(data);
      
      // Merge results with existing alerts
      const newItems: any[] = [];
      if (data.alerts && data.alerts.length > 0) {
        data.alerts.forEach((alert: any) => {
          newItems.push({
            id: 'ai-' + Math.random().toString(36).substr(2, 9),
            title: alert.title,
            message: alert.message,
            type: alert.type || 'warning'
          });
        });
      }
      
      if (data.logistics && data.logistics.length > 0) {
        data.logistics.forEach((log: any) => {
          newItems.push({
            id: 'ai-log-' + Math.random().toString(36).substr(2, 9),
            title: log.title,
            message: log.message,
            type: log.type || 'info'
          });
        });
      }

      // Add to list of alerts
      if (newItems.length > 0) {
        setAlerts(prev => [...newItems, ...prev]);
      }

      setInsightLogs(prev => [
        ...prev,
        `✅ Analysis Complete. Generated ${newItems.length} custom advisories.`,
        `📈 Updated AI dashboard indicators successfully.`
      ]);
    } catch (err: any) {
      console.error(err);
      setInsightLogs(prev => [
        ...prev,
        `❌ Operational analysis failed: ${err.message || 'Unknown network error'}.`,
        `⚠️ Initiated fall-back heuristic routines.`
      ]);

      // Fallback response so user doesn't see a broken box
      setCustomResponse({
        alerts: [
          { title: "GENAI CRITICAL ACTION", message: "Shuttle buses must immediately route to East Stand Gate 4. Suggest warning public screens of 12M queue delays.", type: "warning" }
        ],
        logistics: [
          { title: "SUSTAINABILITY OVERFLOW", message: "Halftime energy saver sequence active: decreasing arena spotlighting to 80% safe minimums.", type: "info" }
        ],
        sustainability: []
      });
    } finally {
      setIsLoadingInsights(false);
      setInsightQuery('');
    }
  };

  const handleDeployAlerts = () => {
    setTelemetryLogs(prev => [
      ...prev,
      `[BROADCAST] Sent ${alerts.length} emergency alerts to all Sector display monitors.`,
      `[MOBILE-PUSH] Dispatched SMS warnings to spectators within 500m radius of Gate 4.`
    ]);
    alert("Alerts broadcast successfully! Check the Real-Time Data Feed below.");
  };

  const handleAcknowledgeAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    setTelemetryLogs(prev => [
      ...prev,
      `[OPERATIONS] Acknowledged and cleared incident #${id}.`
    ]);
  };

  const currentSelectedZone = zones.find(z => z.id === selectedZoneId) || zones[0];

  return (
    <div id="ops-center-root" className="bg-[#0A0F1E] text-slate-200 min-h-screen flex flex-col font-sans select-none overflow-x-hidden">
      
      {/* HEADER SECTION */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-[#0F172A] shadow-md z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20 text-xl border border-indigo-400/40">
            26
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white leading-tight uppercase flex items-center gap-2">
              <span>FIFA WC Ops Center</span>
              <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-mono font-bold animate-pulse">
                LIVE OPS MODE
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-[0.2em] mt-0.5">
              SoFi Stadium • Los Angeles • Match 84
            </p>
          </div>
        </div>

        {/* Dynamic Status Bar */}
        <div className="flex gap-8">
          <div className="text-right hidden sm:block">
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Stadium Status</p>
            <p className={`text-xs font-semibold uppercase ${
              stadiumStatus.includes('CRITICAL') ? 'text-rose-400' :
              stadiumStatus.includes('WARNING') ? 'text-amber-400' :
              'text-emerald-400'
            }`}>
              ● {stadiumStatus}
            </p>
          </div>
          <div className="text-right border-l border-slate-800 pl-8">
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Current Local Time</p>
            <p className="text-xs font-mono font-bold text-white flex items-center justify-end gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{timeStr || "00:00:00 UTC-7"}</span>
            </p>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex flex-1 overflow-hidden h-[calc(100vh-64px)]">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-16 flex flex-col items-center py-6 gap-6 border-r border-slate-800 bg-[#0F172A] shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            title="Dashboard Overview"
            className={`p-2.5 rounded transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Monitor className="w-5.5 h-5.5" />
          </button>
          
          <button
            onClick={() => setActiveTab('heatmap')}
            title="Tactical Heatmap"
            className={`p-2.5 rounded transition-all cursor-pointer ${
              activeTab === 'heatmap'
                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Layers className="w-5.5 h-5.5" />
          </button>

          <button
            onClick={() => setActiveTab('scenarios')}
            title="Simulation Controller"
            className={`p-2.5 rounded transition-all cursor-pointer ${
              activeTab === 'scenarios'
                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Settings className="w-5.5 h-5.5" />
          </button>

          <button
            onClick={() => handleGenerateAIInsights("Full stadium audit request.")}
            title="Trigger Instant AI Audit"
            className="p-2.5 text-indigo-400 hover:text-indigo-300 rounded hover:bg-indigo-500/5 mt-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-5.5 h-5.5 animate-pulse" />
          </button>

          {/* Pulse Signal Badge */}
          <div className="mt-auto flex flex-col items-center gap-1.5">
            <Radio className="w-5 h-5 text-indigo-400 animate-pulse" />
            <span className="text-[7px] text-indigo-400 font-mono tracking-widest uppercase">STBL</span>
          </div>
        </aside>

        {/* WORKSPACE AREA */}
        <section className="flex-1 flex flex-col p-4 gap-4 overflow-hidden bg-[#0A0F1E]">
          
          {/* STATS HIGHLIGHT CARDS ROW (GRID OF 4) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
            
            {/* CARD 1: FAN ATTENDANCE */}
            <div className="bg-[#161F36] rounded border border-slate-800 p-3 flex flex-col justify-between shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fan Attendance</span>
                <Users className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="flex items-end justify-between mt-1">
                <div>
                  <p className="text-2xl font-black text-white tracking-tighter">
                    {attendance.toLocaleString()}
                  </p>
                  <p className="text-[9px] text-slate-500 uppercase font-semibold">Stadium Limit: 75,000</p>
                </div>
                <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                  {((attendance / 75000) * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* CARD 2: TRANSIT LOAD */}
            <div className="bg-[#161F36] rounded border border-slate-800 p-3 flex flex-col justify-between shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Transit Load</span>
                <Train className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="flex items-end justify-between mt-1">
                <div>
                  <p className="text-2xl font-black text-white tracking-tighter">
                    {(transitLoad / 1000).toFixed(1)}k
                  </p>
                  <p className="text-[9px] text-slate-500 uppercase font-semibold">Spectators/Hr</p>
                </div>
                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                  transitLoad > 15000 ? 'text-rose-400 bg-rose-500/10' :
                  transitLoad > 10000 ? 'text-amber-400 bg-amber-500/10' :
                  'text-emerald-400 bg-emerald-500/10'
                }`}>
                  {transitLoad > 15000 ? 'CRITICAL' : transitLoad > 10000 ? 'HEAVY' : 'STABLE'}
                </span>
              </div>
            </div>

            {/* CARD 3: AI TRANSLATION RATE */}
            <div className="bg-[#161F36] rounded border border-slate-800 p-3 flex flex-col justify-between shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Translation Hits</span>
                <Activity className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              </div>
              <div className="flex items-end justify-between mt-1">
                <div>
                  <p className="text-2xl font-black text-white tracking-tighter">
                    {(4109 + (attendance * 0.001) + Math.floor(Math.random() * 50)).toFixed(0)}
                  </p>
                  <p className="text-[9px] text-slate-500 uppercase font-semibold">Active translation streams</p>
                </div>
                <span className="text-[8px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                  LAST 5M
                </span>
              </div>
            </div>

            {/* CARD 4: OPERATIONAL EFFICIENCY */}
            <div className="bg-indigo-600/10 rounded border border-indigo-500/30 p-3 flex flex-col justify-between shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-400"></div>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Ops Efficiency</span>
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="flex items-end justify-between mt-1">
                <div>
                  <p className="text-2xl font-black text-white tracking-tighter">
                    {opsEfficiency}/100
                  </p>
                  <p className="text-[9px] text-slate-400 uppercase font-semibold">Calculated real-time</p>
                </div>
                <span className="text-[9px] font-black text-indigo-400 bg-indigo-400/10 px-1.5 py-0.5 rounded">
                  {opsEfficiency > 85 ? 'OPTIMAL' : 'REDUCED'}
                </span>
              </div>
            </div>

          </div>

          {/* DYNAMIC VIEW CONTAINER (SPLIT SCREEN OR FULL VIEW) */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
            
            {/* COLUMN 1 & 2: DYNAMIC LAYOUT BASED ON TABS */}
            <div className="lg:col-span-2 bg-[#161F36] border border-slate-800 rounded relative overflow-hidden flex flex-col min-h-[300px]">
              
              {/* HEADER TABS FOR MAP AND SCENARIOS */}
              <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-[#1C2641]">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-slate-200">
                    {activeTab === 'overview' ? 'Stadium Core Visualizer' : 
                     activeTab === 'heatmap' ? 'Live Tactical Grid Heatmap' : 
                     'Simulation Controller & Scenario Setup'}
                  </span>
                  
                  {activeTab === 'overview' && (
                    <div className="flex gap-1 bg-[#101726] p-0.5 rounded border border-slate-800 text-[10px]">
                      <button 
                        onClick={() => setMapFilter('crowd')} 
                        className={`px-2 py-0.5 rounded uppercase font-bold tracking-wider transition-all ${mapFilter === 'crowd' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        Crowd
                      </button>
                      <button 
                        onClick={() => setMapFilter('wifi')} 
                        className={`px-2 py-0.5 rounded uppercase font-bold tracking-wider transition-all ${mapFilter === 'wifi' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        WiFi Signals
                      </button>
                      <button 
                        onClick={() => setMapFilter('transit')} 
                        className={`px-2 py-0.5 rounded uppercase font-bold tracking-wider transition-all ${mapFilter === 'transit' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        Transit
                      </button>
                    </div>
                  )}
                </div>

                {/* Live indicators */}
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="All sensors synced"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" title="High user load on Wi-Fi"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" title="Gate 4 warning"></div>
                </div>
              </div>

              {/* VIEW 1 & 2: INTERACTIVE SVG STADIUM SCHEMATIC & TELEMETRY */}
              {activeTab === 'overview' && (
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                  
                  {/* LEFT STADIUM MAP AREA */}
                  <div className="flex-1 bg-slate-950/80 p-4 flex flex-col items-center justify-center relative border-r border-slate-800/60 min-h-[250px]">
                    <div className="absolute top-2 left-3 bg-[#161F36]/80 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-0.5 rounded border border-slate-800">
                      MAP FILTER: <span className="text-indigo-400 font-extrabold">{mapFilter}</span>
                    </div>

                    {/* INTERACTIVE VECTOR SVG STADIUM SCHEMATIC */}
                    <div className="w-full max-w-[340px] aspect-square relative flex items-center justify-center">
                      <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                        {/* Background stadium outer ring */}
                        <ellipse cx="200" cy="200" rx="180" ry="150" className="fill-none stroke-slate-800 stroke-2" />
                        
                        {/* Concourse B (Outer ring of stadium) */}
                        <ellipse 
                          cx="200" cy="200" rx="160" ry="130" 
                          onClick={() => setSelectedZoneId('concourse-b')}
                          className={`cursor-pointer transition-all stroke-slate-800/50 hover:stroke-indigo-400 stroke-2 ${
                            selectedZoneId === 'concourse-b' ? 'stroke-indigo-500 fill-indigo-500/20 shadow-lg' : getFilterColor(zones.find(z => z.id === 'concourse-b')!)
                          }`}
                        />
                        
                        {/* Concourse A (Inner ring of stadium) */}
                        <ellipse 
                          cx="200" cy="200" rx="130" ry="105" 
                          onClick={() => setSelectedZoneId('concourse-a')}
                          className={`cursor-pointer transition-all stroke-slate-800/50 hover:stroke-indigo-400 stroke-2 ${
                            selectedZoneId === 'concourse-a' ? 'stroke-indigo-500 fill-indigo-500/20' : getFilterColor(zones.find(z => z.id === 'concourse-a')!)
                          }`}
                        />

                        {/* Stands segments (North, South, East, West) */}
                        {/* North Stand Arc */}
                        <path 
                          d="M 80 130 A 130 105 0 0 1 320 130 L 290 150 A 100 80 0 0 0 110 150 Z" 
                          onClick={() => setSelectedZoneId('north-stand')}
                          className={`cursor-pointer transition-all stroke-slate-900 hover:stroke-indigo-400 stroke-2 ${
                            selectedZoneId === 'north-stand' ? 'stroke-indigo-500 fill-indigo-500/20' : getFilterColor(zones.find(z => z.id === 'north-stand')!)
                          }`}
                        />

                        {/* South Stand Arc */}
                        <path 
                          d="M 80 270 A 130 105 0 0 0 320 270 L 290 250 A 100 80 0 0 1 110 250 Z" 
                          onClick={() => setSelectedZoneId('south-stand')}
                          className={`cursor-pointer transition-all stroke-slate-900 hover:stroke-indigo-400 stroke-2 ${
                            selectedZoneId === 'south-stand' ? 'stroke-indigo-500 fill-indigo-500/20' : getFilterColor(zones.find(z => z.id === 'south-stand')!)
                          }`}
                        />

                        {/* West Stand Arc (Left side) */}
                        <path 
                          d="M 80 130 A 130 105 0 0 0 80 270 L 110 250 A 100 80 0 0 1 110 150 Z" 
                          onClick={() => setSelectedZoneId('west-stand')}
                          className={`cursor-pointer transition-all stroke-slate-900 hover:stroke-indigo-400 stroke-2 ${
                            selectedZoneId === 'west-stand' ? 'stroke-indigo-500 fill-indigo-500/20' : getFilterColor(zones.find(z => z.id === 'west-stand')!)
                          }`}
                        />

                        {/* East Stand Arc (Right side) */}
                        <path 
                          d="M 320 130 A 130 105 0 0 1 320 270 L 290 250 A 100 80 0 0 0 290 150 Z" 
                          onClick={() => setSelectedZoneId('east-stand')}
                          className={`cursor-pointer transition-all stroke-slate-900 hover:stroke-indigo-400 stroke-2 ${
                            selectedZoneId === 'east-stand' ? 'stroke-indigo-500 fill-indigo-500/20' : getFilterColor(zones.find(z => z.id === 'east-stand')!)
                          }`}
                        />

                        {/* Pitch (Green/Blue Inner Center) */}
                        <ellipse 
                          cx="200" cy="200" rx="75" ry="55" 
                          onClick={() => setSelectedZoneId('pitch-area')}
                          className={`cursor-pointer transition-all stroke-slate-800 hover:stroke-indigo-400 stroke-2 ${
                            selectedZoneId === 'pitch-area' ? 'stroke-indigo-500 fill-indigo-500/20' : 'fill-slate-900 stroke-slate-700'
                          }`}
                        />
                        
                        {/* Soccer Pitch Field Lines outline */}
                        <rect x="155" y="165" width="90" height="70" rx="3" className="fill-none stroke-slate-700/60 stroke-1 pointer-events-none" />
                        <circle cx="200" cy="200" r="15" className="fill-none stroke-slate-700/60 stroke-1 pointer-events-none" />
                        <line x1="200" y1="165" x2="200" y2="235" className="stroke-slate-700/60 stroke-1 pointer-events-none" />

                        {/* Gates Markers & Metro Hub representation */}
                        {/* Gate 4 Indicator */}
                        <circle 
                          cx="330" cy="110" r="10" 
                          onClick={() => setSelectedZoneId('east-stand')}
                          className="fill-rose-500 stroke-white stroke-2 cursor-pointer animate-pulse" 
                        />
                        <text x="345" y="113" className="fill-rose-400 font-mono text-[9px] font-bold pointer-events-none">GATE 4</text>

                        {/* Gate 12 Indicator */}
                        <circle 
                          cx="70" cy="290" r="10" 
                          onClick={() => setSelectedZoneId('transit-hub')}
                          className="fill-amber-400 stroke-white stroke-2 cursor-pointer animate-bounce" 
                        />
                        <text x="35" y="313" className="fill-amber-400 font-mono text-[9px] font-bold pointer-events-none">GATE 12 / METRO</text>
                      </svg>
                    </div>

                    <p className="text-[10px] text-slate-500 mt-2 italic text-center select-none">
                      📌 Click on different stadium sectors or gates to view real-time operations diagnostic specs.
                    </p>
                  </div>

                  {/* RIGHT SIDE DIAGNOSTIC PANELS FOR SELECTED ZONE */}
                  <div className="w-full md:w-64 p-4 flex flex-col gap-3 bg-[#0F172A]/40 overflow-y-auto border-t md:border-t-0 border-slate-800">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white">Zone Diagnostics</h3>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                        currentSelectedZone.alertLevel === 'danger' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        currentSelectedZone.alertLevel === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {currentSelectedZone.alertLevel}
                      </span>
                    </div>

                    <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
                      <p className="text-xs font-extrabold text-indigo-400">{currentSelectedZone.name}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wide">Infrastructure Sector Segment</p>
                    </div>

                    {/* METRIC GRAPH / PROGRESS LINES */}
                    <div className="space-y-3 mt-1">
                      {/* Metric 1 */}
                      <div>
                        <div className="flex justify-between text-[10px] mb-1 font-semibold text-slate-400">
                          <span>Sector Capacity Density</span>
                          <span className="font-mono text-white">{currentSelectedZone.crowdDensity}%</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded overflow-hidden">
                          <div 
                            className={`h-full rounded transition-all duration-500 ${
                              currentSelectedZone.crowdDensity > 90 ? 'bg-rose-500' :
                              currentSelectedZone.crowdDensity > 75 ? 'bg-amber-500' :
                              'bg-emerald-500'
                            }`}
                            style={{ width: `${currentSelectedZone.crowdDensity}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Metric 2 */}
                      <div>
                        <div className="flex justify-between text-[10px] mb-1 font-semibold text-slate-400">
                          <span>WiFi Packet Latency</span>
                          <span className="font-mono text-white">{currentSelectedZone.wifiLatency}ms</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 rounded transition-all duration-500"
                            style={{ width: `${Math.min(100, (currentSelectedZone.wifiLatency / 200) * 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Metric 3 */}
                      <div>
                        <div className="flex justify-between text-[10px] mb-1 font-semibold text-slate-400">
                          <span>Transit Outflow Rate</span>
                          <span className="font-mono text-white">{currentSelectedZone.transitFlow} pax/min</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2 rounded overflow-hidden">
                          <div 
                            className="h-full bg-indigo-400 rounded transition-all duration-500"
                            style={{ width: `${Math.min(100, (currentSelectedZone.transitFlow / 500) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* ENVIRONMENT SPECS */}
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800">
                      <div className="bg-slate-900/40 p-2 rounded border border-slate-800/40">
                        <span className="text-[8px] font-bold text-slate-500 uppercase block">Ambient Temp</span>
                        <span className="text-xs font-mono font-bold text-white">{currentSelectedZone.temperature}°F</span>
                      </div>
                      <div className="bg-slate-900/40 p-2 rounded border border-slate-800/40">
                        <span className="text-[8px] font-bold text-slate-500 uppercase block">Security Staff</span>
                        <span className="text-xs font-mono font-bold text-white">{currentSelectedZone.staffCount} units</span>
                      </div>
                    </div>

                    {/* DYNAMIC LIST OF ACTIVE SECTOR ISSUES */}
                    <div className="mt-2 pt-2 border-t border-slate-800">
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Active Incident Logs</p>
                      {currentSelectedZone.activeIssues.length === 0 ? (
                        <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded text-[10px] text-emerald-400 font-bold">
                          <Check className="w-3.5 h-3.5" />
                          <span>All systems clear in sector</span>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {currentSelectedZone.activeIssues.map((issue, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 bg-rose-500/10 border border-rose-500/20 p-2 rounded text-[10px] text-rose-400 font-semibold leading-tight">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                              <span>{issue}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* VIEW 3: SIMULATION CONTROLS TAB */}
              {activeTab === 'scenarios' && (
                <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-slate-950/60">
                  <div>
                    <h2 className="text-sm font-black uppercase text-indigo-400 tracking-wider">Ops Center Live Simulation Engine</h2>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Manually override metrics and trigger simulated stadium challenges to stress-test our operations center and trigger localized Gemini AI recovery instructions.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Manual Sliders Column */}
                    <div className="space-y-4 bg-[#161F36]/60 p-4 rounded border border-slate-800">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-2">Manual Stats Override</h3>
                      
                      {/* Attendance Slider */}
                      <div>
                        <div className="flex justify-between text-xs mb-1 font-semibold text-slate-400">
                          <span>Total Fan Attendance</span>
                          <span className="font-mono text-white">{attendance.toLocaleString()}</span>
                        </div>
                        <input 
                          type="range" 
                          min="10000" 
                          max="75000" 
                          step="500" 
                          value={attendance} 
                          onChange={(e) => setAttendance(parseInt(e.target.value))}
                          className="w-full accent-indigo-500" 
                        />
                      </div>

                      {/* Transit Load Slider */}
                      <div>
                        <div className="flex justify-between text-xs mb-1 font-semibold text-slate-400">
                          <span>Transit Inflow Egress Load</span>
                          <span className="font-mono text-white">{(transitLoad / 1000).toFixed(1)}k spectators/hr</span>
                        </div>
                        <input 
                          type="range" 
                          min="2000" 
                          max="25000" 
                          step="200" 
                          value={transitLoad} 
                          onChange={(e) => setTransitLoad(parseInt(e.target.value))}
                          className="w-full accent-indigo-500" 
                        />
                      </div>

                      {/* Ops Efficiency Slider */}
                      <div>
                        <div className="flex justify-between text-xs mb-1 font-semibold text-slate-400">
                          <span>Operations Efficiency Rate</span>
                          <span className="font-mono text-white">{opsEfficiency}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="40" 
                          max="100" 
                          value={opsEfficiency} 
                          onChange={(e) => setOpsEfficiency(parseInt(e.target.value))}
                          className="w-full accent-indigo-500" 
                        />
                      </div>
                    </div>

                    {/* Emergency Scenarios Column */}
                    <div className="space-y-4 bg-[#161F36]/60 p-4 rounded border border-slate-800">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-slate-800 pb-2">Preset Operational Challenges</h3>
                      
                      <div className="space-y-2.5">
                        <button 
                          onClick={() => handleSimulateEmergency('gate4')}
                          className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold p-3 rounded border border-rose-500/20 flex items-center justify-between transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <Flame className="w-4 h-4 text-rose-500" />
                            <span>TRIGGER: GATE 4 BOTTLE-NECK</span>
                          </span>
                          <ChevronRight className="w-4 h-4" />
                        </button>

                        <button 
                          onClick={() => handleSimulateEmergency('metro')}
                          className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold p-3 rounded border border-amber-500/20 flex items-center justify-between transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <Train className="w-4 h-4 text-amber-500" />
                            <span>TRIGGER: PURPLE METRO LINE FAIL</span>
                          </span>
                          <ChevronRight className="w-4 h-4" />
                        </button>

                        <button 
                          onClick={() => handleSimulateEmergency('reset')}
                          className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold p-2.5 rounded border border-slate-700 flex items-center justify-center gap-2 transition-colors"
                        >
                          <RefreshCw className="w-4 h-4 text-indigo-400" />
                          <span>RESTORE DEFAULT PARAMETERS</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* MAP TAB - EXPANDED VIEW */}
              {activeTab === 'heatmap' && (
                <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto bg-slate-950/60">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-sm font-black uppercase text-indigo-400 tracking-wider">Live Crowd & Signal Density Layout</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Real-time thermal tracking from stadium wifi hotspots, infrared crowd sensors, and gate turnstiles.</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setMapFilter('crowd')} 
                        className={`text-[10px] px-3 py-1.5 rounded uppercase font-bold border ${mapFilter === 'crowd' ? 'bg-indigo-600 text-white border-indigo-400' : 'text-slate-400 border-slate-800 hover:border-slate-700'}`}
                      >
                        Crowd Density
                      </button>
                      <button 
                        onClick={() => setMapFilter('wifi')} 
                        className={`text-[10px] px-3 py-1.5 rounded uppercase font-bold border ${mapFilter === 'wifi' ? 'bg-indigo-600 text-white border-indigo-400' : 'text-slate-400 border-slate-800 hover:border-slate-700'}`}
                      >
                        WiFi Latency Heatmap
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 space-y-4">
                      {zones.map((zone) => (
                        <div 
                          key={zone.id} 
                          onClick={() => { setSelectedZoneId(zone.id); setActiveTab('overview'); }}
                          className={`p-3 rounded border transition-all cursor-pointer flex justify-between items-center ${
                            selectedZoneId === zone.id ? 'bg-indigo-600/20 border-indigo-500' : 'bg-[#161F36]/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <p className="text-xs font-bold text-white">{zone.name}</p>
                            <p className="text-[10px] text-slate-500">Staff Count: {zone.staffCount} units</p>
                          </div>
                          <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                            zone.crowdDensity > 90 ? 'bg-rose-500/10 text-rose-400' :
                            zone.crowdDensity > 75 ? 'bg-amber-500/10 text-amber-400' :
                            'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {mapFilter === 'crowd' ? `${zone.crowdDensity}%` : 
                             mapFilter === 'wifi' ? `${zone.wifiLatency}ms` : 
                             `${zone.transitFlow} pax`}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="md:col-span-2 bg-[#161F36]/30 border border-slate-800/80 rounded-lg p-6 flex flex-col justify-between min-h-[300px]">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 border-b border-slate-800 pb-2 flex items-center gap-2">
                          <Activity className="w-4 h-4 animate-pulse" />
                          <span>Sensor Signal Breakdown</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                          SoFi Operations Center aggregates data via 1,240 localized infrared beam gates, Wi-Fi 6E mesh routers, and optical crowd-tracking cameras placed inside the structural rim. Select any stadium segment on the left list to diagnose latency parameters or crowd flow bottlenecks immediately.
                        </p>
                      </div>

                      <div className="bg-slate-950 p-4 rounded border border-slate-800 mt-4 font-mono text-[10px] text-indigo-400 space-y-1">
                        <p className="text-white font-bold mb-1">// REAL-TIME HARDWARE SIGNATURES</p>
                        <p>&gt; INFRARED BEAMS: SYNC_STABLE [1240/1240 ONLINE]</p>
                        <p>&gt; MESH RE-TRANSLATORS: HEAVY_CONCURRENCY [LATENCY SPIKES SOUTH_STAND]</p>
                        <p>&gt; OPTICAL FLOW ANALYZER: HIGH_DENSITY [84% PATTERN LOCK]</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* COLUMN 3: GENAI OPERATIONAL INSIGHTS CARD */}
            <div className="bg-[#0F172A] border border-slate-800 rounded flex flex-col overflow-hidden shadow-xl min-h-[400px]">
              
              {/* Card Header */}
              <div className="p-3 bg-indigo-600 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[11px] font-black uppercase tracking-widest">
                    GenAI Operations Assistant
                  </span>
                </div>
                {isLoadingInsights && (
                  <span className="text-[8px] bg-white/20 text-white font-mono px-1.5 py-0.5 rounded animate-pulse">
                    COGNITIVE PROCESS ACTIVE
                  </span>
                )}
              </div>

              {/* CARD INSIGHTS CONTENT */}
              <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-slate-950/20">
                
                {/* Active advisories panel */}
                <div className="space-y-3">
                  
                  {/* Dynamic Custom AI Response Panel */}
                  {customResponse ? (
                    <div className="space-y-3">
                      <div className="bg-[#161F36]/80 p-2.5 rounded border border-indigo-500/20 text-xs font-mono text-indigo-400 flex items-center justify-between">
                        <span>📡 AI SWEEP COMPLETED SUCCESSFULLY</span>
                        <button onClick={() => setCustomResponse(null)} className="text-slate-500 hover:text-slate-200">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Display Alert Warnings */}
                      {customResponse.alerts?.map((alert: any, i: number) => (
                        <div key={i} className="bg-rose-500/10 p-3 rounded border-l-2 border-rose-500 border border-rose-500/10">
                          <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{alert.title}</span>
                          </p>
                          <p className="text-xs leading-relaxed text-slate-200">{alert.message}</p>
                        </div>
                      ))}

                      {/* Display Logistics */}
                      {customResponse.logistics?.map((log: any, i: number) => (
                        <div key={i} className="bg-amber-500/10 p-3 rounded border-l-2 border-amber-500 border border-amber-500/10">
                          <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                            <Train className="w-3.5 h-3.5" />
                            <span>{log.title}</span>
                          </p>
                          <p className="text-xs leading-relaxed text-slate-200">{log.message}</p>
                        </div>
                      ))}

                      {/* Display Sustainability */}
                      {customResponse.sustainability?.map((sus: any, i: number) => (
                        <div key={i} className="bg-indigo-500/10 p-3 rounded border-l-2 border-indigo-400 border border-indigo-500/10">
                          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                            <Zap className="w-3.5 h-3.5" />
                            <span>{sus.title}</span>
                          </p>
                          <p className="text-xs leading-relaxed text-slate-200">{sus.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Default Benchmark Advisories matching the layout spec
                    <div className="space-y-3">
                      {alerts.map((alert) => (
                        <div 
                          key={alert.id} 
                          className={`p-3 rounded-lg border-l-2 border bg-slate-900/40 group relative transition-all hover:bg-slate-900/60 ${
                            alert.type === 'danger' ? 'border-l-rose-500 border-rose-500/10' :
                            alert.type === 'warning' ? 'border-l-amber-500 border-amber-500/10' :
                            'border-l-indigo-400 border-indigo-500/10'
                          }`}
                        >
                          {/* Close / Resolve button on hover */}
                          <button 
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                            className="absolute top-2.5 right-2.5 text-slate-600 hover:text-slate-300 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 cursor-pointer"
                            title="Resolve Action"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>

                          <p className={`text-[9px] font-bold uppercase mb-1 tracking-wider ${
                            alert.type === 'danger' ? 'text-rose-400' :
                            alert.type === 'warning' ? 'text-amber-400' :
                            'text-indigo-400'
                          }`}>
                            {alert.title}
                          </p>
                          <p className="text-xs leading-relaxed text-slate-300 pr-5">{alert.message}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* LOADING/LOGGING AREA DURING AI CALL */}
                  {isLoadingInsights && (
                    <div className="bg-slate-950/80 p-3.5 rounded border border-indigo-500/20 font-mono text-[10px] text-indigo-400 space-y-1.5 shadow-lg">
                      <div className="flex items-center gap-2 text-white font-bold mb-1 border-b border-slate-800 pb-1">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                        <span>COGNITIVE LOGS FEED</span>
                      </div>
                      {insightLogs.map((log, i) => (
                        <p key={i} className="animate-pulse">{log}</p>
                      ))}
                      <p className="text-[9px] text-indigo-500 mt-2 select-none italic">
                        🤖 Utilizing Gemini 3.5 Operational Intelligence
                      </p>
                    </div>
                  )}

                </div>
              </div>

              {/* DYNAMIC CONSOLE PROMPTING FORM */}
              <div className="p-3 border-t border-slate-800 bg-slate-900 shrink-0">
                <div className="flex flex-col gap-2">
                  <div className="flex gap-1">
                    <input 
                      type="text" 
                      value={insightQuery}
                      onChange={(e) => setInsightQuery(e.target.value)}
                      placeholder="Prompt GenAI Operations Assistant..."
                      className="flex-1 bg-slate-950 text-slate-100 text-xs px-3 py-2 rounded border border-slate-800 focus:outline-none focus:border-indigo-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleGenerateAIInsights();
                      }}
                    />
                    <button 
                      onClick={() => handleGenerateAIInsights()}
                      disabled={isLoadingInsights}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white p-2 rounded transition-colors cursor-pointer"
                      title="Send Prompt"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>

                  {/* PRE-DEFINED QUICK COMMAND CHIPS */}
                  <div className="flex flex-wrap gap-1.5 text-[8px] font-black uppercase text-slate-400 tracking-wider">
                    <span 
                      onClick={() => handleGenerateAIInsights("Halftime egress optimization plan.")}
                      className="bg-slate-800 hover:bg-slate-750 border border-slate-700 px-2 py-1 rounded cursor-pointer transition-colors"
                    >
                      ⚡ Halftime Egress
                    </span>
                    <span 
                      onClick={() => handleGenerateAIInsights("Sustainability check for HVAC consumption.")}
                      className="bg-slate-800 hover:bg-slate-750 border border-slate-700 px-2 py-1 rounded cursor-pointer transition-colors"
                    >
                      🌿 Green Sync
                    </span>
                    <span 
                      onClick={() => handleGenerateAIInsights("Severe storm logistical advisory.")}
                      className="bg-slate-800 hover:bg-slate-750 border border-slate-700 px-2 py-1 rounded cursor-pointer transition-colors"
                    >
                      🌧️ Storm Plan
                    </span>
                  </div>

                  {/* BOTTOM BUTTON ACTIONS */}
                  <div className="flex gap-2 border-t border-slate-800 pt-2 mt-1">
                    <button 
                      onClick={handleDeployAlerts}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-2 rounded text-[10px] font-black uppercase tracking-widest text-white transition-all cursor-pointer shadow-md"
                    >
                      Deploy Alerts
                    </button>
                    <button 
                      onClick={() => handleSimulateEmergency('reset')}
                      className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-300 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border border-slate-700"
                    >
                      Acknowledge All
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* TELEMETRY FEED SCROLLING FOOTER */}
          <footer className="h-10 bg-[#0F172A] border border-slate-800 rounded flex items-center px-4 overflow-hidden shrink-0 justify-between">
            <div className="flex items-center gap-2 text-indigo-400 shrink-0 border-r border-slate-800 pr-4 mr-4">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Real-Time Data Feed</span>
            </div>

            {/* MARQUEE STREAM LOG */}
            <div className="flex-1 whitespace-nowrap overflow-hidden text-[10px] font-mono text-slate-400 flex gap-12 relative items-center">
              <div className="animate-marquee flex gap-12">
                {telemetryLogs.map((log, idx) => {
                  let badgeColor = "text-slate-300";
                  if (log.includes("CONGESTION") || log.includes("CRITICAL")) badgeColor = "text-rose-400 font-bold";
                  if (log.includes("WIFI") || log.includes("LATENCY")) badgeColor = "text-amber-400";
                  if (log.includes("GENAI")) badgeColor = "text-indigo-400 font-extrabold italic";
                  return (
                    <span key={idx} className={`flex gap-1.5 items-center shrink-0 ${badgeColor}`}>
                      <span>{log}</span>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* PAUSE/PLAY TELEMETRY */}
            <div className="shrink-0 pl-4 border-l border-slate-800 ml-4 flex gap-1.5">
              <button 
                onClick={() => setIsLiveTelemetryRunning(!isLiveTelemetryRunning)}
                className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                title={isLiveTelemetryRunning ? "Pause telemetry scroll" : "Play telemetry scroll"}
              >
                {isLiveTelemetryRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
              <button 
                onClick={() => setTelemetryLogs([
                  "[GATE 14] FLOW RESET - Commencing clean logging sweep.",
                  `[OPS] Benchmarks established at ${timeStr}`
                ])}
                className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                title="Clear Logs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </footer>

        </section>
      </main>

      {/* Marquee custom styles inlined inside the component so no external stylesheet is broken */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          animation: marquee 45s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
