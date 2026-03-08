import { Pill, CheckCircle2, ChevronRight, X, XCircle, Bell, RefreshCw, Plus, Minus, Droplets, Smile, Sparkles, Moon, PlusCircle, Heart } from "lucide-react";
import { format, addDays, startOfDay, differenceInDays } from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useMemo } from "react";

export function Dashboard() {
  const [name, setName] = useState(() => localStorage.getItem("user_name") || "Yuri");
  const [isEditingName, setIsEditingName] = useState(false);

  // 飲水與資料格式相容性處理
  const [water, setWater] = useState(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const saved = localStorage.getItem(`daily_log_${today}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed) && parsed.water !== undefined) return Number(parsed.water);
      } catch (e) { console.error(e); }
    }
    const legacy = localStorage.getItem("today_water");
    return legacy ? Number(legacy) : 0;
  });

  const getDaysUntilNext = () => {
    if (periodRecords.length === 0) return 28;
    const sorted = [...periodRecords].sort();
    const lastDay = new Date(sorted[sorted.length - 1]);
    const diff = Math.ceil((addDays(lastDay, periodSettings.cycleLength || 28).getTime() - startOfDay(new Date()).getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const [waterGoal, setWaterGoal] = useState(() => Number(localStorage.getItem("water_goal")) || 2000);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(waterGoal.toString());
  const [customWater, setCustomWater] = useState(250);

  // 症狀與藥物狀態
  const [availableSymptoms, setAvailableSymptoms] = useState<string[]>(() => {
    const saved = localStorage.getItem("available_symptoms");
    return saved ? JSON.parse(saved) : ["心情好", "精力充沛", "下墜感", "頭痛", "腰痠"];
  });

  const [todayLogs, setTodayLogs] = useState<string[]>(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const saved = localStorage.getItem(`daily_log_${today}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : (parsed.symptoms || []);
      } catch (e) { console.error(e); }
    }
    return [];
  });

  const [newSymptom, setNewSymptom] = useState("");
  const [isAddingSymptom, setIsAddingSymptom] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const [meds, setMeds] = useState(() => {
    const saved = localStorage.getItem("med_records");
    const defaultMeds = {
      morning: { done: false, note: "", mealType: "before" },
      noon: { done: false, note: "", mealType: "before" },
      evening: { done: false, note: "", mealType: "before" },
      bedtime: { done: false, note: "" },
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...defaultMeds,
          ...parsed,
          morning: { ...defaultMeds.morning, ...(parsed.morning_before || parsed.morning_after || parsed.morning) },
          noon: { ...defaultMeds.noon, ...(parsed.noon_before || parsed.noon_after || parsed.noon) },
          evening: { ...defaultMeds.evening, ...(parsed.evening_before || parsed.evening_after || parsed.evening) },
          bedtime: { ...defaultMeds.bedtime, ...parsed.bedtime },
        };
      } catch (e) { console.error(e); }
    }
    return defaultMeds;
  });

  // 經期資訊
  const [periodRecords] = useState<string[]>(() => JSON.parse(localStorage.getItem("period_records") || "[]"));
  const [periodSettings] = useState(() => JSON.parse(localStorage.getItem("period_settings") || '{"cycleLength":28, "periodLength":5}'));
  const [isPartnerConnected] = useState(() => localStorage.getItem("partner_connected") === "true");

  useEffect(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    localStorage.setItem(`daily_log_${today}`, JSON.stringify({ symptoms: todayLogs, water, waterGoal }));
  }, [todayLogs, water, waterGoal]);

  useEffect(() => {
    localStorage.setItem("med_records", JSON.stringify(meds));
    localStorage.setItem("available_symptoms", JSON.stringify(availableSymptoms));
  }, [meds, availableSymptoms]);

  useEffect(() => {
    localStorage.setItem("water_goal", waterGoal.toString());
  }, [waterGoal]);

  const handleReset = () => {
    setWater(0);
    setTodayLogs([]);
  };

  const updateMed = (time: string, updates: any) => {
    setMeds((prev: any) => ({ ...prev, [time]: { ...prev[time], ...updates } }));
  };

  const toggleSymptom = (s: string) => {
    setTodayLogs(prev => prev.includes(s) ? prev.filter(item => item !== s) : [...prev, s]);
  };

  const addSymptom = () => {
    if (newSymptom.trim() && !availableSymptoms.includes(newSymptom.trim())) {
      setAvailableSymptoms(prev => [...prev, newSymptom.trim()]);
      setTodayLogs(prev => [...prev, newSymptom.trim()]);
      setNewSymptom("");
      setIsAddingSymptom(false);
    }
  };

  const deleteSymptom = (s: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAvailableSymptoms(prev => prev.filter(item => item !== s));
    setTodayLogs(prev => prev.filter(item => item !== s));
  };

  const getPhaseInfo = () => {
    if (periodRecords.length === 0) return null;
    const sorted = [...periodRecords].sort();
    const groups: string[][] = [];
    sorted.forEach((dateStr, i) => {
      const prev = sorted[i - 1];
      if (!prev || differenceInDays(new Date(dateStr), new Date(prev)) > 1) groups.push([dateStr]);
      else groups[groups.length - 1].push(dateStr);
    });
    const lastGroup = groups[groups.length - 1];
    const cycleStartDate = new Date(lastGroup[0]);
    const dayInCycleFull = differenceInDays(new Date(), cycleStartDate) + 1;
    const cl = periodSettings.cycleLength || 28;
    const dayInCycle = ((dayInCycleFull - 1) % cl) + 1;
    const pl = periodSettings.periodLength || 5;
    const ovulDay = cl - 14;

    const PHASES = [
      { name: "行經期", emoji: <Droplets className="w-3 h-3" />, color: "#ff2d55", bg: "rgba(255,45,85,0.1)" },
      { name: "濾泡期", emoji: <Smile className="w-3 h-3" />, color: "#34c759", bg: "rgba(52,199,89,0.1)" },
      { name: "排卵期", emoji: <Sparkles className="w-3 h-3" />, color: "#ff9500", bg: "rgba(255,149,0,0.1)" },
      { name: "黃體期", emoji: <Moon className="w-3 h-3" />, color: "#af52de", bg: "rgba(175,82,222,0.1)" },
    ];

    let phaseIdx = 3, progressInPhase = 1, totalPhase = 1;
    if (dayInCycle >= 1 && dayInCycle <= pl) {
      phaseIdx = 0; progressInPhase = dayInCycle; totalPhase = pl;
    }
    else if (dayInCycle <= ovulDay - 1) {
      phaseIdx = 1; progressInPhase = dayInCycle - pl; totalPhase = Math.max(1, ovulDay - 1 - pl);
    }
    else if (dayInCycle <= ovulDay + 2) {
      phaseIdx = 2; progressInPhase = dayInCycle - (ovulDay - 1); totalPhase = 4;
    }
    else if (dayInCycle <= cl) {
      phaseIdx = 3; progressInPhase = dayInCycle - (ovulDay + 2); totalPhase = Math.max(1, cl - (ovulDay + 2));
    }

    return {
      phase: PHASES[phaseIdx],
      dayInCycle,
      progressInPhase: Math.max(1, progressInPhase),
      totalPhase,
      isPeriod: phaseIdx === 0
    };
  };

  const phaseInfo = useMemo(() => getPhaseInfo(), [periodRecords, periodSettings]);

  const daysLeft = getDaysUntilNext();
  const waterPercent = Math.min(100, (water / waterGoal) * 100);

  const notifications = useMemo(() => {
    const list = [];
    const configRaw = localStorage.getItem("notification_config");
    const config = configRaw ? JSON.parse(configRaw) : { water: true, meds: true, period: true };

    // 飲水提示
    if (config.water && waterPercent < 100) {
      list.push({
        id: 'water',
        title: '飲水提醒',
        content: `今日達成率 ${Math.round(waterPercent)}%，別忘了喝水喔！`,
        icon: <Droplets className="w-4 h-4 text-blue-400" />
      });
    }
    // 服藥提示
    if (config.meds) {
      const pending = ['morning', 'noon', 'evening', 'bedtime'].filter(k => !(meds as any)[k]?.done);
      if (pending.length > 0) {
        const labels: any = { morning: '早上', noon: '中午', evening: '晚上', bedtime: '睡前' };
        list.push({
          id: 'meds',
          title: '服藥提醒',
          content: `還有 ${pending.length} 個時段尚未服藥：${pending.map(k => labels[k]).join('、')}。`,
          icon: <Pill className="w-4 h-4 text-rose-400" />
        });
      }
    }
    // 經期提示
    if (config.period && daysLeft <= 5) {
      list.push({
        id: 'period',
        title: '經期將近',
        content: `月經預計在 ${daysLeft} 天後報到，請備好用品。`,
        icon: <Droplets className="w-4 h-4 text-rose-500" />
      });
    }
    return list;
  }, [waterPercent, meds, daysLeft]);

  return (
    <div className="flex flex-col min-h-screen font-sans px-4 pb-28 bg-[#e6f0ff] dark:bg-[#1a1c1e] transition-colors duration-500">
      <header className="flex justify-between items-center py-6 px-1">
        <div className="flex flex-col">
          {isEditingName ? (
            <input
              autoFocus
              className="text-2xl font-black text-[#44474b] dark:text-stone-300 bg-transparent border-none outline-none w-full max-w-[200px]"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {
                setIsEditingName(false);
                localStorage.setItem("user_name", name);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setIsEditingName(false);
                  localStorage.setItem("user_name", name);
                }
              }}
            />
          ) : (
            <h1
              className="text-2xl font-black text-[#44474b] dark:text-stone-100 cursor-pointer"
              onClick={() => setIsEditingName(true)}
            >
              妳好，{name}
            </h1>
          )}
          {isPartnerConnected && (
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">伴侶已連線 · 守護中</span>
            </div>
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className={`w-11 h-11 neu-extruded dark:bg-[#2c2e33] dark:border-stone-800 rounded-2xl flex items-center justify-center transition-all ${isNotificationOpen ? "neu-pressed text-[#4a90e2]" : "text-stone-400 dark:text-stone-500"}`}
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 border-2 border-white dark:border-[#2c2e33] rounded-full flex items-center justify-center">
                <span className="text-[8px] font-black text-white">{notifications.length}</span>
              </span>
            )}
          </button>

          <AnimatePresence>
            {isNotificationOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-72 bg-white/90 dark:bg-[#2c2e33]/90 backdrop-blur-xl rounded-[30px] shadow-2xl z-[100] p-4 border border-white/40 dark:border-stone-700/40"
              >
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="text-sm font-black text-[#44474b] dark:text-stone-200">通知與提醒</h3>
                  <span className="text-[10px] font-bold text-stone-300 dark:text-stone-600">TODAY</span>
                </div>
                <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto">
                  {notifications.length > 0 ? notifications.map(n => (
                    <div key={n.id} className="p-3 bg-white/50 dark:bg-stone-800/50 rounded-2xl border border-[#f0f4fa] dark:border-stone-700/30 flex gap-3 shadow-sm">
                      <div className="w-8 h-8 rounded-xl bg-white dark:bg-[#1a1c1e] shadow-sm flex items-center justify-center flex-shrink-0">
                        {n.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] font-black text-[#44474b] dark:text-stone-200 mb-0.5">{n.title}</p>
                        <p className="text-[10px] font-medium text-stone-500 dark:text-stone-400 leading-normal">{n.content}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="py-8 text-center">
                      <p className="text-[11px] font-black text-stone-300">目前沒有新消息</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {isPartnerConnected && phaseInfo?.isPeriod && (
        <motion.section
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 mx-1 p-5 neu-extruded rounded-[30px] bg-rose-50/50 flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-rose-400 font-black">
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <div className="flex-1">
            <h3 className="text-xs font-black text-rose-500 mb-0.5">伴侶的溫馨提示</h3>
            <p className="text-[11px] font-bold text-stone-500 leading-tight">
              「親愛的，這兩天妳辛苦了。我已經準備好熱飲，晚點家事我來處理，妳好好休息喔。」
            </p>
          </div>
        </motion.section>
      )}

      <section className="neu-extruded rounded-[45px] p-8 flex flex-col items-center gap-6 mb-8 relative bg-[#e6f0ff]">
        <div className="w-48 h-48 relative flex items-center justify-center">
          <div className="absolute inset-0 neu-inset rounded-full shadow-[inset_12px_12px_24px_var(--neu-shadow),inset_-12px_-12px_24px_var(--neu-light)]"></div>
          {/* 圓形進度條 */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="opacity-10"
              style={{ color: daysLeft <= 7 ? "#ff2d55" : "#4a90e2" }}
            />
            <motion.circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              initial={false}
              animate={{
                strokeDasharray: `${(phaseInfo ? (phaseInfo.progressInPhase / phaseInfo.totalPhase) * 100 : (Math.min(100, (28 - daysLeft) / 28 * 100))) * 2.7646} 276.46`,
                color: phaseInfo?.phase.color || (daysLeft <= 3 ? "#ff2d55" : daysLeft <= 10 ? "#f472b6" : "#4a90e2")
              }}
              transition={{
                strokeDasharray: { duration: 1.5, ease: "easeOut" },
                color: { duration: 1 }
              }}
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center z-20">
            <span className="text-[11px] font-black tracking-widest mb-1 transition-colors" style={{ color: phaseInfo?.phase.color || "#4a90e2" }}>
              {phaseInfo?.phase.name || "黃體期"}
            </span>
            <span className="text-6xl font-black text-[#44474b] tracking-tighter">
              {phaseInfo?.isPeriod ? phaseInfo.progressInPhase : daysLeft}
            </span>
            <span className="text-[10px] text-stone-400 font-bold mt-2 uppercase tracking-widest">
              {phaseInfo?.isPeriod ? "Day Progress" : "Days Left"}
            </span>
          </div>
        </div>
        <div className="w-full flex flex-wrap justify-center gap-2.5">
          {availableSymptoms.map(s => (
            <div key={s} onClick={() => toggleSymptom(s)} className={`group px-4 py-2.5 rounded-2xl cursor-pointer transition-all flex items-center gap-2 ${todayLogs.includes(s) ? "bg-[#4a90e2] text-white" : "neu-extruded-sm text-[#44474b]"}`}>
              <span className="text-[11px] font-black">{s}</span>
              {todayLogs.includes(s) && (
                <XCircle onClick={(e) => deleteSymptom(s, e)} className="w-3 h-3 opacity-50 hover:opacity-100" />
              )}
            </div>
          ))}
          {isAddingSymptom ? (
            <div className="flex items-center gap-2 neu-inset px-3 py-2 rounded-2xl">
              <input
                autoFocus
                value={newSymptom}
                onChange={e => setNewSymptom(e.target.value)}
                onBlur={() => !newSymptom && setIsAddingSymptom(false)}
                onKeyDown={e => e.key === "Enter" && addSymptom()}
                className="bg-transparent text-[11px] font-black outline-none w-20"
                placeholder="輸入關鍵字..."
              />
              <CheckCircle2 onClick={addSymptom} className="w-4 h-4 text-teal-500 cursor-pointer" />
            </div>
          ) : (
            <button
              onClick={() => setIsAddingSymptom(true)}
              className="px-4 py-2.5 rounded-2xl neu-extruded-sm text-[#4a90e2] flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="text-[11px] font-black">自定義</span>
            </button>
          )}
        </div>
      </section>

      <div className="flex justify-between items-end mb-6 px-2">
        <h2 className="text-lg font-black text-[#44474b]">每日健康總結</h2>
        <button onClick={handleReset} className="w-11 h-11 neu-extruded rounded-2xl flex items-center justify-center text-[#4a90e2]"><RefreshCw className="w-5 h-5" /></button>
      </div>

      <div className="flex flex-col gap-6 mb-8">
        {/* 飲水紀錄 */}
        <div className="w-full neu-extruded rounded-[45px] p-6 flex flex-col items-center gap-5 relative overflow-hidden bg-[#e6f0ff]">
          <div className="text-center z-20 cursor-pointer group" onClick={() => { setIsEditingGoal(true); setTempGoal(waterGoal.toString()); }}>
            <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1 group-hover:text-[#4a90e2] transition-colors">飲水量目標</p>
            {isEditingGoal ? (
              <input
                autoFocus
                type="number"
                value={tempGoal}
                onChange={e => setTempGoal(e.target.value)}
                onBlur={() => { setWaterGoal(Number(tempGoal) || 2000); setIsEditingGoal(false); }}
                onKeyDown={e => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
                className="text-[18px] font-black text-[#4a90e2] tracking-tight bg-transparent border-b border-[#4a90e2] outline-none w-20 text-center"
              />
            ) : (
              <p className="text-[18px] font-black text-[#4a90e2] tracking-tight">{waterGoal}ml</p>
            )}
          </div>

          <div className="relative w-full flex-1 min-h-[250px] water-container rounded-[40px] flex flex-col justify-end overflow-hidden mb-2 neu-inset bg-[#e6f0ff]">
            <WaterWave percent={waterPercent} />
            <div className="absolute inset-0 flex flex-col items-center justify-center z-30 pointer-events-none">
              <span className="text-4xl font-black text-[#44474b] mix-blend-multiply opacity-80">{Math.round(waterPercent)}%</span>
              <span className="text-[10px] font-black text-[#44474b] mt-2 opacity-30">{water}ML</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 z-10 w-full px-2">
            <div className="flex items-center gap-2 mb-2 p-1.5 neu-inset rounded-xl">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-2">每筆量</span>
              <input
                type="number"
                value={customWater}
                onChange={(e) => setCustomWater(Number(e.target.value))}
                className="w-16 bg-transparent text-sm font-black text-[#4a90e2] outline-none text-center"
              />
              <span className="text-[10px] font-black text-stone-300 pr-2">ml</span>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full">
              <button onClick={() => setWater(w => Math.max(0, w - customWater))} className="h-12 rounded-2xl neu-extruded flex items-center justify-center text-rose-400 active:neu-pressed transition-transform active:scale-95"><Minus className="w-5 h-5" /></button>
              <button onClick={() => setWater(w => w + customWater)} className="h-12 rounded-2xl neu-extruded flex items-center justify-center text-[#4a90e2] active:neu-pressed transition-transform active:scale-95"><Plus className="w-5 h-5" /></button>
            </div>
          </div>
        </div>

        <div className="w-full neu-extruded rounded-[45px] p-7 flex flex-col gap-4 bg-[#e6f0ff]">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 neu-inset rounded-2xl flex items-center justify-center text-rose-400"><Pill className="w-5 h-5" /></div>
            <h2 className="font-black text-base text-[#44474b]">服藥詳情</h2>
          </div>
          <div className="flex flex-col gap-4">
            {[
              { id: "morning", label: "早上", showMeal: true },
              { id: "noon", label: "中午", showMeal: true },
              { id: "evening", label: "晚上", showMeal: true },
              { id: "bedtime", label: "睡前", showMeal: false },
            ].map((item) => {
              const m = (meds as any)[item.id] || { done: false, note: "", mealType: "before" };
              return (
                <div key={item.id} className={`rounded-full flex items-stretch h-[72px] transition-all duration-500 overflow-hidden relative shadow-md group ${m.done ? "border-2 border-teal-100/30" : "border-2 border-[#f0f4fa]"}`}>
                  {/* 藥丸前端：紅色區域 (時間與名稱) */}
                  <div className={`w-[45%] flex items-center gap-3 pl-5 transition-colors duration-500 ${m.done ? "bg-teal-400" : "bg-[#ff5a5f]"}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm transition-all ${m.done ? "bg-white/20 text-white" : "bg-[#fbbf24] text-[#854d0e]"}`}>
                      {item.label}
                    </div>
                    <input
                      value={m.note}
                      placeholder="..."
                      disabled={m.done}
                      onChange={e => updateMed(item.id, { note: e.target.value })}
                      className={`bg-transparent text-[14px] font-black outline-none placeholder:text-white/30 w-full min-w-0 ${m.done ? "text-white/60" : "text-white"}`}
                    />
                  </div>

                  {/* 藥丸後端：白色區域 (操作區) */}
                  <div className={`flex-1 flex items-center justify-between px-4 transition-colors duration-500 ${m.done ? "bg-[#f0fdf4]" : "bg-white"}`}>
                    <div className="flex items-center gap-2">
                      {item.showMeal && (
                        <div className="flex items-center bg-[#f8faff] rounded-full p-0.5 shadow-inner">
                          <button
                            onClick={() => !m.done && updateMed(item.id, { mealType: "before" })}
                            className={`text-[9px] px-3 py-1 rounded-full font-black transition-all ${m.mealType === "before" ? "bg-[#ff5a5f] text-white shadow-sm" : "text-stone-300"}`}
                          >
                            前
                          </button>
                          <button
                            onClick={() => !m.done && updateMed(item.id, { mealType: "after" })}
                            className={`text-[9px] px-3 py-1 rounded-full font-black transition-all ${m.mealType === "after" ? "bg-[#ff5a5f] text-white shadow-sm" : "text-stone-300"}`}
                          >
                            後
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => updateMed(item.id, { done: !m.done })}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${m.done ? "bg-teal-100 text-teal-600 scale-110" : "bg-[#f8faff] text-stone-300 hover:text-[#ff5a5f] hover:bg-rose-50"}`}
                    >
                      <CheckCircle2 className={`w-6 h-6 ${m.done ? "animate-bounce-short" : ""}`} />
                    </button>
                  </div>

                  {/* 藥丸中間的密封線效果 */}
                  <div className="absolute left-[45%] top-0 bottom-0 w-[2px] bg-black/5 z-10" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const WATER_CSS = `
@keyframes waveMove {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes bounce-short {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
.animate-bounce-short {
  animation: bounce-short 0.3s ease-out;
}
`;

function WaterWave({ percent }: { percent: number }) {
  const bubbles = Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    size: Math.random() * 8 + 4,
    left: `${Math.random() * 100}%`,
    duration: Math.random() * 4 + 3,
    delay: Math.random() * 5,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none rounded-[40px] overflow-hidden">
      <style>{WATER_CSS}</style>

      <motion.div
        className="absolute left-0 right-0 bottom-0 z-10"
        initial={{ height: "0%" }}
        animate={{ height: `${percent}%` }}
        transition={{ type: "spring", damping: 30, stiffness: 45 }}
      >
        {/* 單層一體化波浪水體 */}
        <div className="absolute inset-0 w-full h-[120%] -translate-y-[15%]">
          <svg className="w-[400%] h-full" viewBox="0 0 2000 1000" preserveAspectRatio="none" style={{ animation: 'waveMove 4s ease-in-out infinite' }}>
            <defs>
              <linearGradient id="waterGradientFlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.8" />
                <stop offset="10%" stopColor="#3b82f6" stopOpacity="1" />
                <stop offset="100%" stopColor="#1e40af" stopOpacity="1" />
              </linearGradient>
            </defs>
            {/* 一體化的貝茲曲線路徑：包含波浪頂部與底部填充，避免產生切線 */}
            <path
              d="M 0 100 C 250 150 250 50 500 100 C 750 150 750 50 1000 100 C 1250 150 1250 50 1500 100 C 1750 150 1750 50 2000 100 V 1000 H 0 Z"
              fill="url(#waterGradientFlow)"
            />
          </svg>
        </div>

        {/* 氣泡粒子系統 */}
        <AnimatePresence>
          {bubbles.map((b) => (
            <motion.div
              key={b.id}
              className="absolute bottom-0 rounded-full bg-white/20 blur-[0.3px]"
              initial={{ y: 20, opacity: 0, scale: 0.5 }}
              animate={{
                y: -600,
                opacity: [0, 0.7, 0.7, 0],
                scale: [0.5, 1, 1.2, 0.8],
                x: [0, Math.sin(b.id) * 30, Math.cos(b.id) * 20]
              }}
              transition={{
                duration: b.duration,
                repeat: Infinity,
                delay: b.delay,
                ease: "easeOut"
              }}
              style={{
                width: b.size,
                height: b.size,
                left: b.left,
                boxShadow: '0 0 12px rgba(255, 255, 255, 0.15)'
              }}
            />
          ))}
        </AnimatePresence>

        {/* 內陰影層 */}
        <div className="absolute inset-0 shadow-[inset_0_15px_40px_rgba(255,255,255,0.1)]" />
      </motion.div>

      {/* 玻璃遮罩光澤 */}
      <div className="absolute inset-0 z-30 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
    </div>
  );
}
