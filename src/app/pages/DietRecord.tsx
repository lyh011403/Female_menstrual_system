import { motion, AnimatePresence } from "motion/react";
import { Plus, Apple, Coffee, Utensils, UtensilsCrossed, Info, Mic, X, Edit2, Trash2, DollarSign, ChevronLeft, ChevronRight, Calendar, BarChart2, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useState, useEffect, useMemo } from "react";
import { format, addDays, subDays, startOfToday, isSameDay, parseISO, eachDayOfInterval } from "date-fns";

export function DietRecord() {
  const todayStr = format(startOfToday(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // 資料結構：{ "2024-03-08": [...meals], ... }
  const [allRecords, setAllRecords] = useState<Record<string, any[]>>(() => {
    const saved = localStorage.getItem("diet_records_v2");
    if (saved) return JSON.parse(saved);

    // 遷移舊資料 (如果存在)
    const oldSaved = localStorage.getItem("diet_records");
    if (oldSaved) {
      const parsed = JSON.parse(oldSaved);
      return { [todayStr]: Array.isArray(parsed) ? parsed : [] };
    }

    return {
      [todayStr]: [
        { id: Date.now(), name: "早餐", calories: 350, time: "08:30", items: "燕麥粥, 黑咖啡", type: "breakfast", cost: 85 },
        { id: Date.now() + 1, name: "午餐", calories: 600, time: "12:45", items: "烤雞胸肉沙拉, 地瓜", type: "lunch", cost: 160 },
      ]
    };
  });

  const [isEditing, setIsEditing] = useState(false);
  const [currentMeal, setCurrentMeal] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [trendMode, setTrendMode] = useState<"week" | "month">("week");
  const [dataType, setDataType] = useState<"cal" | "cost">("cal");

  useEffect(() => {
    localStorage.setItem("diet_records_v2", JSON.stringify(allRecords));
  }, [allRecords]);

  const meals = useMemo(() => allRecords[selectedDate] || [], [allRecords, selectedDate]);
  const totalCalories = meals.reduce((acc, m) => acc + (Number(m.calories) || 0), 0);
  const totalCost = meals.reduce((acc, m) => acc + (Number(m.cost) || 0), 0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const mealToSave = { ...currentMeal, id: currentMeal.id || Date.now() };

    setAllRecords(prev => {
      const dayMeals = prev[selectedDate] || [];
      const updatedDayMeals = currentMeal.id
        ? dayMeals.map(m => m.id === currentMeal.id ? mealToSave : m)
        : [...dayMeals, mealToSave];
      return { ...prev, [selectedDate]: updatedDayMeals };
    });
    setIsEditing(false);
  };

  const handleDelete = (id: number) => {
    setAllRecords(prev => ({
      ...prev,
      [selectedDate]: (prev[selectedDate] || []).filter(m => m.id !== id)
    }));
  };

  const trendData = useMemo(() => {
    const days = trendMode === "week" ? 7 : 30;
    const end = parseISO(selectedDate);
    const start = subDays(end, days - 1);

    const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

    return eachDayOfInterval({ start, end }).map(date => {
      const dStr = format(date, "yyyy-MM-dd");
      const dayMeals = allRecords[dStr] || [];
      return {
        date: dStr,
        label: trendMode === "week" ? weekDays[date.getDay()] : format(date, "MM/dd"),
        fullLabel: format(date, "yyyy/MM/dd"),
        value: dayMeals.reduce((acc, m) => acc + (dataType === "cal" ? (Number(m.calories) || 0) : (Number(m.cost) || 0)), 0)
      };
    });
  }, [allRecords, selectedDate, trendMode, dataType]);

  const periodTotal = useMemo(() => trendData.reduce((acc, d) => acc + d.value, 0), [trendData]);

  // 彙整週期內的數據細項 (卡路里 或 開支)
  const periodList = useMemo(() => {
    const sortedDays = [...trendData].reverse();
    const list: any[] = [];
    sortedDays.forEach(day => {
      const dayMeals = (allRecords[day.date] || []).filter(m => dataType === "cal" ? m.calories > 0 : m.cost > 0);
      dayMeals.forEach(m => {
        list.push({ ...m, dateLabel: day.label, fullDate: day.date });
      });
    });
    return list;
  }, [allRecords, trendData, dataType]);

  const [showCalendar, setShowCalendar] = useState(false);

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("不支援語音識別");

    const recognition = new SpeechRecognition();
    recognition.lang = "zh-TW";
    recognition.onstart = () => setIsListening(true);
    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === "not-allowed") {
        alert("權限不足：行動裝置需要透過 HTTPS 安全連線才能開啟麥克風語音功能。");
      } else {
        alert("語音識別發生錯誤：" + event.error);
      }
    };
    recognition.onresult = (event: any) => {
      const result = event.results[0][0].transcript;
      setIsListening(false);

      const moneyRegex = /(\d+)\s*(元|塊|錢|塊錢)/;
      const moneyMatch = result.match(moneyRegex);
      let cost = 0, text = result;
      if (moneyMatch) { cost = Number(moneyMatch[1]); text = result.replace(moneyRegex, "").trim(); }

      const timeMapping: any = { breakfast: ["早餐"], lunch: ["午餐"], dinner: ["晚餐"], snack: ["點心"] };
      let type = "lunch", mealName = "午餐";
      for (const [key, keywords] of Object.entries(timeMapping)) {
        if ((keywords as string[]).some(k => result.includes(k))) {
          type = key; mealName = (keywords as string[])[0];
          (keywords as string[]).forEach(k => text = text.replace(k, ""));
          break;
        }
      }

      setCurrentMeal({ name: mealName, items: text.replace(/[，。！]/g, "").trim() || "新餐點", calories: 300, time: format(new Date(), "HH:mm"), type, cost });
      setIsEditing(true);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 overflow-y-auto pb-24 font-sans relative">
      <header className="px-6 pt-10 pb-4 bg-white/70 backdrop-blur-md sticky top-0 z-30 border-b border-stone-100">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-black text-stone-800 tracking-tight">飲食趨勢</h1>
          <button className="w-10 h-10 neu-extruded-sm rounded-2xl flex items-center justify-center bg-white"><Info className="w-5 h-5 text-stone-300" /></button>
        </div>

        {/* 日期切換器 */}
        <div className="flex items-center justify-between bg-stone-100/50 p-2 rounded-2xl">
          <button onClick={() => setSelectedDate(format(subDays(parseISO(selectedDate), 1), "yyyy-MM-dd"))} className="p-2 hover:bg-white rounded-xl transition-colors"><ChevronLeft className="w-5 h-5 text-stone-400" /></button>
          <motion.div whileTap={{ scale: 0.95 }} className="flex items-center gap-2 cursor-pointer hover:bg-white px-4 py-1.5 rounded-xl transition-colors" onClick={() => setShowCalendar(true)}>
            <Calendar className="w-4 h-4 text-orange-500" />
            <span className="font-black text-stone-700">{selectedDate === todayStr ? "今天" : selectedDate}</span>
          </motion.div>
          <button onClick={() => setSelectedDate(format(addDays(parseISO(selectedDate), 1), "yyyy-MM-dd"))} className="p-2 hover:bg-white rounded-xl transition-colors"><ChevronRight className="w-5 h-5 text-stone-400" /></button>
        </div>
      </header>

      {/* 趨勢圖表區 */}
      <section className="px-6 pt-6 mb-4">
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-stone-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">
                {trendMode === "week" ? "週" : "月"}總計{dataType === "cal" ? "熱量" : "開支"}
              </h3>
              <p className="text-2xl font-black text-stone-800">
                {dataType === "cal" ? `${periodTotal} kcal` : `$ ${periodTotal}`}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex bg-stone-50 p-1 rounded-xl">
                <button onClick={() => setTrendMode("week")} className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${trendMode === "week" ? "bg-white shadow-sm text-orange-500" : "text-stone-400"}`}>週</button>
                <button onClick={() => setTrendMode("month")} className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${trendMode === "month" ? "bg-white shadow-sm text-orange-500" : "text-stone-400"}`}>月</button>
              </div>
              <div className="flex bg-stone-50 p-1 rounded-xl">
                <button onClick={() => setDataType("cal")} className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${dataType === "cal" ? "bg-white shadow-sm text-[#4a90e2]" : "text-stone-400"}`}>Kcal</button>
                <button onClick={() => setDataType("cost")} className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${dataType === "cost" ? "bg-white shadow-sm text-emerald-500" : "text-stone-400"}`}>$ NTD</button>
              </div>
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f5f5f4" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#a8a29e' }} />
                <Tooltip cursor={{ fill: '#f5f5f4', radius: 8 }} content={({ active, payload }) => (
                  active && payload && (
                    <div className="bg-stone-800 text-white p-2 rounded-xl text-[10px] font-black shadow-lg">
                      {payload[0].value} {dataType === "cal" ? "kcal" : "$"}
                    </div>
                  )
                )} />
                <Bar dataKey="value" radius={[6, 6, 6, 6]} fill={dataType === "cal" ? "#f97316" : "#10b981"} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* 數據細項區 */}
      <section className="px-6 mb-6">
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-stone-100">
          <h3 className="text-lg font-black text-stone-800 mb-4 flex items-center gap-2">
            {dataType === "cal" ? <TrendingUp className="w-5 h-5 text-orange-500" /> : <DollarSign className="w-5 h-5 text-emerald-500" />}
            {dataType === "cal" ? "攝取細項" : "購買細項"}
          </h3>
          <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {periodList.map((item, idx) => (
              <div key={`${item.fullDate}-${idx}`} className="flex items-center justify-between p-3 bg-stone-50 rounded-2xl border border-stone-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="text-[9px] font-black text-stone-300 w-8 text-center">{item.dateLabel}</div>
                  <div className="w-px h-6 bg-stone-200" />
                  <div>
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-tighter">{item.name}</p>
                    <p className="text-xs font-black text-stone-700 truncate max-w-[120px]">{item.items}</p>
                  </div>
                </div>
                <div className={`text-sm font-black ${dataType === "cal" ? "text-orange-500" : "text-emerald-600"}`}>
                  {dataType === "cal" ? `${item.calories} kcal` : `$ ${item.cost}`}
                </div>
              </div>
            ))}
            {periodList.length === 0 && (
              <div className="py-8 text-center text-stone-300 font-bold text-sm">此週期內無{dataType === "cal" ? "熱量" : "開支"}紀錄</div>
            )}
          </div>
        </div>
      </section>

      {/* 今日摘要 (修正邏輯，當這不是今日時顯示該日摘要) */}
      <section className="px-6 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-orange-50 rounded-3xl p-5 border border-orange-100 shadow-sm">
            <h4 className="text-[9px] font-black text-orange-400 uppercase mb-2">{selectedDate === todayStr ? "今天" : "該日"}熱量</h4>
            <p className="text-xl font-black text-orange-600">{totalCalories} <span className="text-[10px]">kcal</span></p>
          </div>
          <div className="bg-emerald-50 rounded-3xl p-5 border border-emerald-100 shadow-sm">
            <h4 className="text-[9px] font-black text-emerald-400 uppercase mb-2">{selectedDate === todayStr ? "今天" : "該日"}支出</h4>
            <p className="text-xl font-black text-emerald-600">$ {totalCost}</p>
          </div>
        </div>
      </section>

      {/* 餐點清單 */}
      <section className="px-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-black text-stone-800">當日清單</h3>
          <button onClick={startVoiceInput} className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all ${isListening ? "bg-rose-500 text-white animate-pulse" : "bg-white text-[#4a90e2] shadow-sm border border-stone-100"}`}>
            <Mic className="w-4 h-4" />
            <span className="text-[11px] font-black">{isListening ? "正在聆聽..." : "語音紀錄"}</span>
          </button>
        </div>
        <div className="flex flex-col gap-4">
          {meals.map(meal => (
            <MealCard key={meal.id} m={meal} onEdit={() => { setCurrentMeal(meal); setIsEditing(true); }} onDelete={() => handleDelete(meal.id)} />
          ))}
          {meals.length === 0 && (
            <div className="p-10 text-center text-stone-300 font-bold border-2 border-dashed border-stone-100 rounded-[2.5rem]">
              該日無紀錄
            </div>
          )}
        </div>
      </section>

      <motion.button
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        onClick={() => { setCurrentMeal({ name: "午餐", calories: 0, time: format(new Date(), "HH:mm"), items: "", type: "lunch", cost: 0 }); setIsEditing(true); }}
        className="fixed bottom-24 right-6 w-14 h-14 bg-orange-500 text-white rounded-full shadow-lg flex items-center justify-center z-40 transition-transform active:scale-90"
      >
        <Plus className="w-7 h-7" />
      </motion.button>

      {/* 行事曆彈窗 */}
      <AnimatePresence>
        {showCalendar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6" onClick={() => setShowCalendar(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black text-stone-800">選擇日期</h2>
                <button onClick={() => setShowCalendar(false)} className="w-10 h-10 bg-stone-50 rounded-full flex items-center justify-center"><X className="w-5 h-5 text-stone-300" /></button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => { setSelectedDate(e.target.value); setShowCalendar(false); }}
                  className="w-full bg-stone-50 border-none rounded-2xl px-6 py-4 font-black text-stone-700 outline-none focus:ring-2 focus:ring-orange-200 transition-all text-center"
                />
                <button
                  onClick={() => { setSelectedDate(todayStr); setShowCalendar(false); }}
                  className="w-full py-4 bg-orange-50 text-orange-500 rounded-2xl font-black active:scale-95 transition-all"
                >
                  回到今天
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 彈窗編輯 */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-white w-full rounded-t-[3rem] p-8 pb-12 max-w-lg shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-stone-800">{currentMeal.id ? "編輯紀錄" : "新增餐點"}</h2>
                <button onClick={() => setIsEditing(false)} className="w-10 h-10 bg-stone-50 rounded-full flex items-center justify-center"><X className="w-5 h-5 text-stone-300" /></button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[10px] font-black text-stone-400 uppercase">用餐時段</label><input className="w-full bg-stone-50 border-none rounded-2xl px-4 py-3 font-bold" value={currentMeal.name} onChange={e => setCurrentMeal({ ...currentMeal, name: e.target.value })} required /></div>
                  <div className="space-y-1"><label className="text-[10px] font-black text-stone-400 uppercase">時間</label><input className="w-full bg-stone-50 border-none rounded-2xl px-4 py-3 font-bold" type="time" value={currentMeal.time} onChange={e => setCurrentMeal({ ...currentMeal, time: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[10px] font-black text-stone-400 uppercase">卡路里 (kcal)</label><input className="w-full bg-stone-50 border-none rounded-2xl px-4 py-3 font-bold" type="number" value={currentMeal.calories} onChange={e => setCurrentMeal({ ...currentMeal, calories: e.target.value })} /></div>
                  <div className="space-y-1"><label className="text-[10px] font-black text-stone-400 uppercase">開支 ($ NTD)</label><input className="w-full bg-stone-50 border-none rounded-2xl px-4 py-3 font-bold" type="number" value={currentMeal.cost} onChange={e => setCurrentMeal({ ...currentMeal, cost: e.target.value })} /></div>
                </div>
                <div className="space-y-1"><label className="text-[10px] font-black text-stone-400 uppercase">餐點內容</label><input className="w-full bg-stone-50 border-none rounded-2xl px-4 py-3 font-bold" value={currentMeal.items} onChange={e => setCurrentMeal({ ...currentMeal, items: e.target.value })} /></div>
                <button type="submit" className="w-full py-4 bg-orange-500 text-white rounded-[2rem] font-black mt-4 shadow-lg active:scale-95 transition-all">儲存至 {selectedDate}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MacroItem({ label, current, total, color }: any) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-1.5 mb-1.5"><div className={`w-2 h-2 rounded-full ${color}`} /><span className="text-[10px] font-black text-stone-400 uppercase tracking-tighter">{label}</span></div>
      <span className="text-sm font-black text-stone-800">{current}<span className="text-[10px] text-stone-300 font-bold ml-0.5">/{total}g</span></span>
    </div>
  );
}

function MealCard({ m, onEdit, onDelete }: any) {
  const icons: any = { breakfast: <Coffee />, lunch: <Utensils />, dinner: <UtensilsCrossed />, snack: <Apple /> };
  const colors: any = { breakfast: "bg-amber-100 text-amber-600", lunch: "bg-orange-100 text-orange-600", dinner: "bg-rose-100 text-rose-600", snack: "bg-emerald-100 text-emerald-600" };
  return (
    <div className="bg-white rounded-[2.5rem] p-5 shadow-sm border border-stone-100 flex items-center gap-4 group hover:border-orange-200 transition-all">
      <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center flex-shrink-0 ${colors[m.type] || "bg-stone-50 text-stone-400"}`}>{icons[m.type] || <Utensils />}</div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5"><h4 className="text-[9px] font-black text-stone-300 uppercase tracking-widest">{m.name}</h4><span className="text-[9px] font-bold text-stone-300">{m.time}</span></div>
        <p className="text-base text-stone-800 font-black truncate mb-2">{m.items}</p>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="text-[13px] font-black text-orange-500">{m.calories} <span className="text-[8px] text-stone-300 uppercase">kcal</span></div>
            {m.cost > 0 && <div className="text-[13px] font-black text-emerald-500 flex items-center"><DollarSign className="w-3 h-3" />{m.cost}</div>}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={onEdit} className="p-2 text-stone-300 hover:text-stone-600"><Edit2 className="w-4 h-4" /></button><button onClick={onDelete} className="p-2 text-stone-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button></div>
        </div>
      </div>
    </div>
  );
}
