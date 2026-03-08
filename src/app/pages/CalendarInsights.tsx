import { useState, useEffect, useMemo } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, startOfDay, differenceInDays, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Droplets, History, Settings, ClipboardList, X, Heart, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

function MoodIcon({ type, size = 24 }: { type: string; size?: number }) {
  const colors: Record<string, string> = {
    happy: "#ffd60a",
    neutral: "#afb8c1",
    unhappy: "#6fb8f6"
  };
  const color = colors[type] || "#afb8c1";

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill={color} stroke="#1a1a1a" strokeWidth="6" />
      <circle cx="35" cy="40" r="5" fill="#1a1a1a" />
      <circle cx="65" cy="40" r="5" fill="#1a1a1a" />
      {type === "happy" && <path d="M30 65 C 40 75, 60 75, 70 65" stroke="#1a1a1a" strokeWidth="6" strokeLinecap="round" />}
      {type === "neutral" && <path d="M35 70 L 65 70" stroke="#1a1a1a" strokeWidth="6" strokeLinecap="round" />}
      {type === "unhappy" && <path d="M30 75 C 40 65, 60 65, 70 75" stroke="#1a1a1a" strokeWidth="6" strokeLinecap="round" />}
    </svg>
  );
}

export function CalendarInsights() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(startOfDay(new Date()));
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isHealthQueryOpen, setIsHealthQueryOpen] = useState(false);
  const [healthQueryMonth, setHealthQueryMonth] = useState(new Date());
  const [showAboutCycle, setShowAboutCycle] = useState(false);

  // 基礎數據狀態
  const [water, setWater] = useState(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const saved = localStorage.getItem(`daily_log_${today}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.water !== undefined) return Number(parsed.water);
      } catch (e) { console.error(e); }
    }
    return 0;
  });
  const [waterGoal] = useState(() => Number(localStorage.getItem("water_goal")) || 2000);
  const [availableSymptoms] = useState<string[]>(() => {
    const saved = localStorage.getItem("available_symptoms");
    return saved ? JSON.parse(saved) : ["心情好", "精力充沛", "下墜感", "頭痛", "腰痠"];
  });
  const [periodSettings, setPeriodSettings] = useState(() => {
    const saved = localStorage.getItem("period_settings");
    return saved ? JSON.parse(saved) : { cycleLength: 28, periodLength: 5 };
  });
  const [periodRecords, setPeriodRecords] = useState<string[]>(() => {
    const saved = localStorage.getItem("period_records");
    return saved ? JSON.parse(saved) : [];
  });

  const [dayDetail, setDayDetail] = useState<string[]>([]);
  const [mood, setMood] = useState<string>("");
  const [peekDay, setPeekDay] = useState<Date | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<any>(null);
  const [clickTimer, setClickTimer] = useState<any>(null);
  const [wasLongPress, setWasLongPress] = useState(false);

  const MOODS = [
    { key: "unhappy", label: "心情不好" },
    { key: "neutral", label: "一般" },
    { key: "happy", label: "開心" },
  ];

  const getPeekData = (d: Date) => {
    const dateStr = format(d, "yyyy-MM-dd");
    const log = localStorage.getItem("daily_log_" + dateStr);
    let water = 0;
    let symptoms: string[] = [];
    let mood = "";
    if (log) {
      try {
        const parsed = JSON.parse(log);
        water = parsed.water || 0;
        symptoms = parsed.symptoms || [];
        mood = parsed.mood || "";
      } catch (e) {
        console.error(e);
      }
    }
    return { water, symptoms, mood };
  };

  const [pastPredictions, setPastPredictions] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("period_past_predictions");
    return saved ? new Set<string>(JSON.parse(saved)) : new Set<string>();
  });

  const savePastPredictions = (predictions: Set<string>) => {
    if (predictions.size === 0) return;
    setPastPredictions(prev => {
      const updated = new Set<string>(prev);
      predictions.forEach(d => updated.add(d));
      localStorage.setItem("period_past_predictions", JSON.stringify([...updated]));
      return updated;
    });
  };

  useEffect(() => localStorage.setItem("period_records", JSON.stringify(periodRecords)), [periodRecords]);
  useEffect(() => localStorage.setItem("period_settings", JSON.stringify(periodSettings)), [periodSettings]);

  // 更新今日數據到 localStorage
  const todayKey = format(new Date(), "yyyy-MM-dd");
  useEffect(() => {
    const log = localStorage.getItem("daily_log_" + todayKey);
    let parsed = log ? JSON.parse(log) : {};
    if (Array.isArray(parsed)) parsed = { symptoms: parsed };
    const waterPercent = Math.min(100, Math.round((water / waterGoal) * 100));
    localStorage.setItem("daily_log_" + todayKey, JSON.stringify({ ...parsed, water, waterGoal, waterPercent }));
  }, [water, waterGoal, todayKey]);

  // 切換日期時載入細節
  useEffect(() => {
    const dateStr = format(selectedDay, "yyyy-MM-dd");
    const log = localStorage.getItem("daily_log_" + dateStr);
    let parsed = log ? JSON.parse(log) : {};
    if (Array.isArray(parsed)) parsed = { symptoms: parsed };
    setDayDetail(parsed.symptoms || []);
    setMood(parsed.mood || "");
  }, [selectedDay]);

  const toggleMood = (m: string) => {
    const dateStr = format(selectedDay, "yyyy-MM-dd");
    const log = localStorage.getItem("daily_log_" + dateStr);
    let parsed = log ? JSON.parse(log) : {};
    const updatedMood = mood === m ? "" : m;
    localStorage.setItem("daily_log_" + dateStr, JSON.stringify({ ...parsed, mood: updatedMood }));
    setMood(updatedMood);
  };

  const getDayMood = (d: Date) => {
    const log = localStorage.getItem("daily_log_" + format(d, "yyyy-MM-dd"));
    if (log) {
      try { return JSON.parse(log).mood; } catch (e) { return null; }
    }
    return null;
  };

  const getPredictedDays = () => {
    const predictions = new Set<string>();
    if (periodRecords.length === 0) return predictions;
    const sorted = [...periodRecords].sort();
    const groups: string[][] = [];
    sorted.forEach((dateStr, i) => {
      const prev = sorted[i - 1];
      if (!prev || differenceInDays(new Date(dateStr), new Date(prev)) > 1) groups.push([dateStr]);
      else groups[groups.length - 1].push(dateStr);
    });
    const lastGroup = groups[groups.length - 1];
    const lastStart = new Date(lastGroup[0]);
    const cl = periodSettings.cycleLength;
    const pl = periodSettings.periodLength;
    for (let cycle = 1; cycle <= 3; cycle++) {
      const nextStart = new Date(lastStart);
      nextStart.setDate(nextStart.getDate() + cl * cycle);
      for (let d = 0; d < pl; d++) {
        const day = new Date(nextStart);
        day.setDate(day.getDate() + d);
        predictions.add(format(day, "yyyy-MM-dd"));
      }
    }
    return predictions;
  };

  const predictedDays = getPredictedDays();
  useEffect(() => { savePastPredictions(predictedDays); }, [periodRecords, periodSettings]);

  const today = format(new Date(), "yyyy-MM-dd");
  const isPeriod = (d: Date) => periodRecords.includes(format(d, "yyyy-MM-dd"));
  const isPredicted = (d: Date) => predictedDays.has(format(d, "yyyy-MM-dd"));
  const isHistoricPrediction = (d: Date) => {
    const str = format(d, "yyyy-MM-dd");
    return pastPredictions.has(str) && !periodRecords.includes(str) && str < today;
  };

  const PHASES = [
    { key: "period", name: "行經期", emoji: "🩸", color: "#ff2d55", bg: "rgba(255,45,85,0.1)", desc: "子宮內膜脫落出血，激素水平最低，適合放慢步調充分休息。", tips: ["補充鐵質（菠菜、豆類）", "避免劇烈運動", "可用熱敷緩解經痛"] },
    { key: "follicular", name: "濾泡期", emoji: "🌱", color: "#34c759", bg: "rgba(52,199,89,0.1)", desc: "FSH 促使濾泡成熟，雌激素上升，精力與情緒逐漸改善。", tips: ["適合開始規律運動", "補充葉酸與維生素 B", "皮膚狀況改善中"] },
    { key: "ovulation", name: "排卵期", emoji: "✨", color: "#ff9500", bg: "rgba(255,149,0,0.1)", desc: "卵巢釋放成熟卵子，雌激素達高峰，精力旺盛。", tips: ["體溫可能略升 0.2–0.5°C", "白帶呈透明拉絲狀", "適合高強度運動"] },
    { key: "luteal", name: "黃體期", emoji: "🌙", color: "#af52de", bg: "rgba(175,82,222,0.1)", desc: "黃體素升高，可能出現情緒波動或水腫（PMS），適合和緩活動。", tips: ["減少鹽分攝取避免水腫", "補充鎂（黑巧克力、堅果）", "優先選擇伸展與瑜伽"] },
  ];

  // 核心邏輯：從 periodRecords 計算真實週期歷史
  const cycleAnalysis = useMemo(() => {
    if (periodRecords.length === 0) return { history: [28, 28, 28, 28, 28], avg: 28, status: "尚無數據" };
    const sorted = [...periodRecords].sort();
    const groups: string[][] = [];
    sorted.forEach((dateStr, i) => {
      const prev = sorted[i - 1];
      if (!prev || differenceInDays(new Date(dateStr), new Date(prev)) > 1) groups.push([dateStr]);
      else groups[groups.length - 1].push(dateStr);
    });

    // 計算相鄰經期起始日的天數差 (週期長度)
    const lengths: number[] = [];
    for (let i = 1; i < groups.length; i++) {
      const diff = differenceInDays(new Date(groups[i][0]), new Date(groups[i - 1][0]));
      lengths.push(diff);
    }

    const recentHistory = lengths.slice(-5);
    while (recentHistory.length < 5) recentHistory.unshift(28); // 補齊 5 個顯示位

    const avg = lengths.length > 0 ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length) : 28;

    // 判斷規律性 (標準差簡易版)
    let status = "規律性良好";
    if (lengths.length >= 2) {
      const variance = lengths.map(x => Math.pow(x - avg, 2)).reduce((a, b) => a + b, 0) / lengths.length;
      if (variance > 16) status = "週期略有波動";
      if (variance > 49) status = "建議關注規律性";
    }

    return { history: recentHistory, avg, status };
  }, [periodRecords]);

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
    let phaseIdx = 3, progressInPhase = 1, totalPhase = 1;
    if (dayInCycle >= 1 && dayInCycle <= pl) { phaseIdx = 0; progressInPhase = dayInCycle; totalPhase = pl; }
    else if (dayInCycle <= ovulDay - 1) { phaseIdx = 1; progressInPhase = dayInCycle - pl; totalPhase = Math.max(1, ovulDay - 1 - pl); }
    else if (dayInCycle <= ovulDay + 2) { phaseIdx = 2; progressInPhase = dayInCycle - (ovulDay - 1); totalPhase = 4; }
    else if (dayInCycle <= cl) { phaseIdx = 3; progressInPhase = dayInCycle - (ovulDay + 2); totalPhase = Math.max(1, cl - (ovulDay + 2)); }
    return { phase: PHASES[phaseIdx], phaseIdx, dayInCycle: Math.max(1, dayInCycle), progressInPhase: Math.max(1, progressInPhase), totalPhase, cycleLength: cl };
  };

  const getAnomalyWarning = () => {
    if (periodRecords.length === 0) return null;
    const sorted = [...periodRecords].sort();
    const groups: string[][] = [];
    sorted.forEach((dateStr, i) => {
      const prev = sorted[i - 1];
      if (!prev || differenceInDays(new Date(dateStr), new Date(prev)) > 1) groups.push([dateStr]);
      else groups[groups.length - 1].push(dateStr);
    });
    if (groups.length < 2) return null;
    const actualCycle = differenceInDays(new Date(groups[groups.length - 1][0]), new Date(groups[groups.length - 2][0]));
    if (actualCycle > 60) return { level: "danger", msg: "距離上次經期已延遲 " + actualCycle + " 天，建議諮詢醫療建議。" };
    if (actualCycle < 21) return { level: "warn", msg: "近期週期縮短至 " + actualCycle + " 天，請多休息。" };
    return null;
  };

  const phaseInfo = getPhaseInfo();
  const anomaly = getAnomalyWarning();
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate2 = startOfWeek(monthStart);
  const endDate2 = endOfWeek(monthEnd);
  const days: Date[] = [];
  let day2 = startDate2;
  while (day2 <= endDate2) { days.push(day2); day2 = addDays(day2, 1); }

  const handleDayClick = (d: Date) => {
    if (wasLongPress) {
      setWasLongPress(false);
      return;
    }

    // 清除舊的計時器
    if (clickTimer) clearTimeout(clickTimer);

    // 設定新的計時器，延遲執行單擊邏輯
    const timer = setTimeout(() => {
      setSelectedDay(startOfDay(d));
      const dateStr = format(d, "yyyy-MM-dd");
      if (periodRecords.includes(dateStr)) setPeriodRecords(prev => prev.filter(r => r !== dateStr));
      else setPeriodRecords(prev => [...prev, dateStr].sort());
      setClickTimer(null);
    }, 250); // 250ms 是區分雙擊的常見閾值

    setClickTimer(timer);
  };

  const handleDayDoubleClick = (d: Date) => {
    // 關鍵：清除單擊計時器，攔截生理期紀錄邏輯
    if (clickTimer) {
      clearTimeout(clickTimer);
      setClickTimer(null);
    }

    // 執行雙擊純跳轉邏輯
    setSelectedDay(startOfDay(d));
    if (window.navigator.vibrate) window.navigator.vibrate([30, 50, 30]);
  };

  const handlePressStart = (d: Date) => {
    setWasLongPress(false);
    const timer = setTimeout(() => {
      setPeekDay(d);
      setWasLongPress(true);
      if (window.navigator.vibrate) window.navigator.vibrate(50);
    }, 500);
    setLongPressTimer(timer);
  };

  const handlePressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setPeekDay(null);
  };

  const toggleSymptom = (s: string) => {
    const dateStr = format(selectedDay, "yyyy-MM-dd");
    const log = localStorage.getItem("daily_log_" + dateStr);
    let parsed = log ? JSON.parse(log) : {};
    if (Array.isArray(parsed)) parsed = { symptoms: parsed };
    const symptoms: string[] = parsed.symptoms || [];
    const updated = symptoms.includes(s) ? symptoms.filter((x: string) => x !== s) : [...symptoms, s];
    localStorage.setItem("daily_log_" + dateStr, JSON.stringify({ ...parsed, symptoms: updated }));
    setDayDetail(updated);
  };

  return (
    <div className="p-4 pb-24 space-y-6 max-w-md mx-auto relative">
      <div className="flex justify-between items-center px-1">
        <h1 className="text-2xl font-black text-[#44474b]">週期明細</h1>
        <div className="flex gap-2">
          <button onClick={() => setIsHistoryOpen(true)} className="w-9 h-9 neu-extruded rounded-2xl flex items-center justify-center">
            <History className="w-4 h-4 text-[#44474b]" />
          </button>
          <button onClick={() => setIsSettingsOpen(true)} className="w-9 h-9 neu-extruded rounded-2xl flex items-center justify-center">
            <Settings className="w-4 h-4 text-[#44474b]" />
          </button>
        </div>
      </div>

      {/* 日曆區塊 */}
      <section className="neu-extruded rounded-[40px] p-6 bg-[#e6f0ff]">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="w-8 h-8 neu-extruded rounded-xl flex items-center justify-center"><ChevronLeft className="w-4 h-4" /></button>
          <h2 className="font-black text-[#44474b]">{format(currentDate, "yyyy 年 MM 月")}</h2>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="w-8 h-8 neu-extruded rounded-xl flex items-center justify-center"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d, idx) => {
            const dateStr = format(d, "yyyy-MM-dd");
            const isCurrentMonth = isSameMonth(d, currentDate);
            const isPeriodDay = isPeriod(d);
            const isPredictedDay = isPredicted(d);
            const isHistoric = isHistoricPrediction(d);
            const isToday = dateStr === today;
            const isSelected = isSameDay(d, selectedDay);
            const dayMood = getDayMood(d);

            let outerClass = "h-11 flex flex-col items-center justify-center rounded-xl font-black text-sm cursor-pointer relative transition-all ";
            if (!isCurrentMonth) outerClass += "opacity-30 ";

            if (isPeriodDay) outerClass += "bg-[#ff2d55] text-white shadow-lg ";
            else if (isPredictedDay) outerClass += "bg-[#ff2d55]/20 text-[#ff2d55] ";
            else if (isHistoric) outerClass += "border-2 border-dashed border-stone-200 text-stone-300 ";
            else if (isToday) outerClass += "bg-[#44474b] text-white ";
            else if (isSelected) outerClass += "neu-extruded-sm text-[#44474b] ";
            else outerClass += "text-[#44474b] ";

            return (
              <button
                key={idx}
                className={outerClass}
                onClick={() => handleDayClick(d)}
                onDoubleClick={() => handleDayDoubleClick(d)}
                onMouseDown={() => handlePressStart(d)}
                onMouseUp={handlePressEnd}
                onMouseLeave={handlePressEnd}
                onTouchStart={() => handlePressStart(d)}
                onTouchEnd={handlePressEnd}
              >
                <span>{format(d, "d")}</span>
                {dayMood && (
                  <span className="absolute -bottom-1">
                    <MoodIcon type={dayMood} size={18} />
                  </span>
                )}
                {isPredictedDay && !isPeriodDay && <span className="absolute top-1 right-1 w-1 h-1 bg-[#ff2d55] rounded-full animate-pulse" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* 心情選擇區 */}
      <section className="space-y-4 px-1">
        <h2 className="text-lg font-black text-[#44474b]">{format(selectedDay, "MM月dd日")} 心情狀態</h2>
        <div className="grid grid-cols-3 gap-3">
          {MOODS.map(m => (
            <button key={m.key} onClick={() => toggleMood(m.key)} className={"py-4 rounded-[25px] flex flex-col items-center gap-2 transition-all " + (mood === m.key ? "bg-white shadow-lg border-2 border-orange-200" : "neu-extruded-sm text-stone-400 opacity-60")}>
              <MoodIcon type={m.key} size={36} />
              <span className="text-[10px] font-black">{m.label}</span>
            </button>
          ))}
        </div>
      </section>

      <PhaseCard phaseInfo={phaseInfo} anomaly={anomaly} expandedPhase={expandedPhase} setExpandedPhase={setExpandedPhase} PHASES={PHASES} />

      {/* 今日身心摘要 - 重定義原本的症狀記錄 */}
      <section className="neu-extruded rounded-[32px] p-6 bg-white overflow-hidden relative">
        <div className="flex items-center justify-between mb-5">
          <div className="flex flex-col">
            <h3 className="text-base font-black text-[#44474b]">今日身心摘要</h3>
            <p className="text-[10px] font-bold text-stone-400">總結您的生理與心理狀態</p>
          </div>
          {mood && (
            <div className="flex flex-col items-center p-2 bg-[#f0f4fa] rounded-2xl shadow-inner">
              <MoodIcon type={mood} size={28} />
              <span className="text-[8px] font-black text-stone-400 mt-1">
                {MOODS.find(m => m.key === mood)?.label}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {availableSymptoms.map(s => {
              const isActive = dayDetail.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => toggleSymptom(s)}
                  className={`py-2.5 px-4 rounded-2xl text-[11px] font-black transition-all flex items-center gap-1.5 ${isActive
                    ? "bg-[#ff2d55] text-white shadow-lg translate-y-0.5"
                    : "bg-[#f8faff] text-[#44474b] border border-stone-100 hover:border-stone-200"
                    }`}
                >
                  {isActive && <Heart className="w-3 h-3 fill-current" />}
                  {s}
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-stone-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                <Droplets className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] font-black text-stone-400 leading-none mb-1">今日水分</p>
                <p className="text-xs font-black text-[#44474b]">{water} <span className="opacity-50">ml</span></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 生理期預測與受孕提醒 - 替換掉原本的週期健康概況 */}
      {phaseInfo && (
        <div className="neu-extruded rounded-[32px] p-6 bg-gradient-to-br from-[#fff0f3] to-[#e6f0ff] border border-white/20 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Heart className="w-16 h-16 text-[#ff2d55]" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black text-[#44474b]">經期與排卵預測</h3>
            <span className="px-3 py-1 bg-white/60 rounded-full text-[10px] font-black text-[#ff2d55] shadow-sm">
              預計下次：{(() => {
                const next = Array.from(predictedDays).filter(d => d >= today).sort()[0];
                return next ? format(new Date(next), "MM/dd") : "計算中";
              })()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/40 rounded-3xl border border-white/20 backdrop-blur-sm flex flex-col items-center justify-center">
              <p className="text-[10px] font-black text-stone-400 mb-1">下次經期倒數</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-[#ff2d55]">
                  {(() => {
                    const next = Array.from(predictedDays).filter(d => d >= today).sort()[0];
                    if (!next) return "--";
                    const diff = differenceInDays(new Date(next), new Date(today));
                    return diff > 0 ? diff : "今日";
                  })()}
                </span>
                <span className="text-[10px] font-black text-stone-400">天</span>
              </div>
            </div>

            <div className="p-4 bg-white/40 rounded-3xl border border-white/20 backdrop-blur-sm flex flex-col items-center justify-center">
              <p className="text-[10px] font-black text-stone-400 mb-1">排卵/受孕評估</p>
              <div className="flex flex-col items-center gap-0.5">
                <span className={`text-xs font-black ${phaseInfo.phaseIdx === 2 ? "text-orange-500" : "text-teal-500"}`}>
                  {phaseInfo.phaseIdx === 2 ? "高受孕機率期" : "一般安全期"}
                </span>
                <span className="text-[8px] font-bold text-stone-400">系統自動評估</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm">
              <Info className="w-5 h-5 text-rose-300" />
            </div>
            <p className="text-[11px] font-bold text-stone-600 leading-snug">
              {phaseInfo.phaseIdx === 0 ? "目前正值經期，請注意多補充水分與溫熱飲食。" :
                phaseInfo.phaseIdx === 2 ? "排卵期將近，身體可能出現輕微不適或體溫升高。" :
                  "週期狀態良好，建議保持良好的睡眠習慣。"}
            </p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 z-50 flex items-end justify-center" onClick={() => setIsSettingsOpen(false)}>
            <motion.div initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }} className="w-full max-w-md bg-[#e6f0ff] rounded-t-[40px] p-8" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-black text-stone-800 mb-6">週期設定</h2>
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-black text-stone-500 mb-2">週期長度 ({periodSettings.cycleLength} 天)</p>
                  <input type="range" min={21} max={45} value={periodSettings.cycleLength} onChange={e => setPeriodSettings({ ...periodSettings, cycleLength: Number(e.target.value) })} className="w-full" />
                </div>
                <div>
                  <p className="text-xs font-black text-stone-500 mb-2">經期天數 ({periodSettings.periodLength} 天)</p>
                  <input type="range" min={3} max={10} value={periodSettings.periodLength} onChange={e => setPeriodSettings({ ...periodSettings, periodLength: Number(e.target.value) })} className="w-full" />
                </div>
              </div>
              <button onClick={() => setIsSettingsOpen(false)} className="w-full mt-8 py-4 bg-[#44474b] text-white rounded-2xl font-black">完成</button>
            </motion.div>
          </motion.div>
        )}

        {isHistoryOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 z-50 flex items-end justify-center" onClick={() => setIsHistoryOpen(false)}>
            <motion.div initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }} className="w-full max-w-md bg-[#f0f4fa] rounded-t-[40px] p-8 max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-black text-stone-800 mb-6 font-sans">歷史記錄</h2>
              <div className="space-y-3">
                {periodRecords.map(d => (
                  <div key={d} className="p-4 bg-white rounded-2xl shadow-sm border border-stone-100 flex justify-between">
                    <span className="font-bold text-stone-600 font-sans">{d}</span>
                    <span className="text-rose-400 font-black font-sans">🩸 紀錄</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {showAboutCycle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-md" onClick={() => setShowAboutCycle(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl space-y-6" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-black text-stone-800">關於健康概況</h2>
              <p className="text-sm font-bold text-stone-500 leading-loose">系統會自動彙整您的「月度經期天數」與「心情趨勢」。規律性越高，代表您的身體機能越趨於平衡。</p>
              <button onClick={() => setShowAboutCycle(false)} className="w-full py-4 bg-stone-800 text-white rounded-2xl font-black">知道了</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {peekDay && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-6"
          >
            <div className="bg-white/90 backdrop-blur-xl border border-white/40 p-6 rounded-[32px] shadow-2xl max-w-xs w-full text-center space-y-4">
              <h3 className="text-sm font-black text-[#44474b] opacity-60 uppercase tracking-widest">{format(peekDay, "MM月dd日")} 預覽</h3>
              {(() => {
                const data = getPeekData(peekDay);
                return (
                  <>
                    <div className="flex justify-center gap-4">
                      {data.mood && (
                        <div className="flex flex-col items-center gap-1">
                          <MoodIcon type={data.mood} size={40} />
                          <span className="text-[10px] font-black text-stone-400">當日情緒</span>
                        </div>
                      )}
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10 neu-extruded-sm rounded-2xl flex items-center justify-center">
                          <Droplets className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-[10px] font-black text-stone-400">{data.water} ml</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-stone-400 mb-2">已選症狀</h4>
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {data.symptoms.length > 0 ? (
                          data.symptoms.map(s => <span key={s} className="px-3 py-1 bg-[#ff2d55]/10 text-[#ff2d55] text-[10px] font-black rounded-full">{s}</span>)
                        ) : (
                          <span className="text-[10px] font-bold text-stone-400 italic">尚未記錄任何症狀</span>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PhaseCard({ phaseInfo, anomaly, expandedPhase, setExpandedPhase, PHASES }: any) {
  if (!phaseInfo) return null;
  return (
    <section className="px-1">
      <div className={"neu-extruded rounded-[32px] p-5 cursor-pointer transition-all " + (expandedPhase === 0 ? "scale-105" : "")} style={{ backgroundColor: phaseInfo.phase.bg }} onClick={() => setExpandedPhase(expandedPhase === 0 ? null : 0)}>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{phaseInfo.phase.emoji}</span>
            <span className="text-sm font-black" style={{ color: phaseInfo.phase.color }}>{phaseInfo.phase.name} · Day {phaseInfo.progressInPhase}</span>
          </div>
          <ChevronRight className={"w-4 h-4 transition-transform " + (expandedPhase === 0 ? "rotate-90" : "")} style={{ color: phaseInfo.phase.color }} />
        </div>
        <p className="text-[10px] font-bold text-stone-500 opacity-80 leading-tight mb-3">{phaseInfo.phase.desc}</p>
        <div className="w-full h-1.5 bg-white/50 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: (phaseInfo.progressInPhase / phaseInfo.totalPhase) * 100 + "%" }} className="h-full rounded-full" style={{ backgroundColor: phaseInfo.phase.color }} />
        </div>
      </div>
      <AnimatePresence>
        {expandedPhase === 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-3 p-4 bg-white/40 rounded-[25px] border border-white/20">
              <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">專家筆記與建議</h4>
              <ul className="space-y-1.5">
                {phaseInfo.phase.tips.map((tip: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] font-bold text-stone-600">
                    <span className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: phaseInfo.phase.color }} />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {anomaly && (
        <div className={"mt-4 p-4 rounded-[25px] flex items-center gap-3 border " + (anomaly.level === "danger" ? "bg-rose-50 border-rose-100 text-rose-500" : "bg-orange-50 border-orange-100 text-orange-500")}>
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <Info className="w-4 h-4" />
          </div>
          <p className="text-[11px] font-black leading-tight">{anomaly.msg}</p>
        </div>
      )}
    </section>
  );
}
