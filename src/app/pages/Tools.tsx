import { Download, FileText, Settings, Shield, Moon, Bell, ChevronRight, Sun, Upload } from "lucide-react";
import { NavLink } from "react-router";
import { useState, useEffect } from "react";

export function Tools() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("dark_mode");
    if (saved) return saved === "true";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    localStorage.setItem("dark_mode", isDarkMode.toString());
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      document.body.style.backgroundColor = "#1a1c1e";
    } else {
      document.documentElement.classList.remove("dark");
      document.body.style.backgroundColor = "#fafaf9"; // stone-50
    }
  }, [isDarkMode]);

  const handleExport = () => {
    const data: any = {};
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      const val = localStorage.getItem(key);
      try {
        data[key] = JSON.parse(val || "");
      } catch {
        data[key] = val;
      }
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `HealthData_Export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    alert("數據已成功準備！即將開始下載 JSON 備份檔案。");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("匯入備份將會覆蓋目前的數據。建議先匯出目前的檔案進行備份，確定要續嗎？")) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        localStorage.clear();
        Object.keys(data).forEach(key => {
          if (typeof data[key] === 'object') {
            localStorage.setItem(key, JSON.stringify(data[key]));
          } else {
            localStorage.setItem(key, data[key]);
          }
        });
        alert("資料匯入成功！系統將自動重新整理以應用變更。");
        window.location.reload();
      } catch (err) {
        alert("匯入失敗：檔案格式錯誤。請確保您上傳的是本系統導出的 JSON 備份檔。");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 dark:bg-[#1a1c1e] overflow-y-auto pb-24 font-sans focus:outline-none transition-colors duration-500">
      <header className="px-6 pt-10 pb-6">
        <h1 className="text-2xl font-black text-stone-800 dark:text-stone-100 tracking-tight">設定</h1>
      </header>

      {/* Export Section */}
      <section className="px-6 mb-8">
        <div className="bg-teal-600 rounded-[2.5rem] p-7 text-white shadow-xl flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500 rounded-bl-full -z-10 opacity-50"></div>
          <div className="z-10">
            <h2 className="text-xl font-black mb-2">匯出就診數據</h2>
            <p className="text-teal-100 text-[10px] mb-5 font-bold max-w-[200px] leading-relaxed opacity-90">
              一鍵將本裝置上的完整健康、用藥與經期數據匯出備份，或從備份檔還原。
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                className="bg-white text-teal-700 px-5 py-2.5 rounded-full text-xs font-black shadow-lg hover:bg-teal-50 flex items-center gap-2 transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                立即匯出
              </button>
              <label className="bg-teal-500/50 border border-teal-300/30 text-white px-5 py-2.5 rounded-full text-xs font-black shadow-lg hover:bg-teal-500 flex items-center gap-2 cursor-pointer transition-all active:scale-95">
                <Upload className="w-3.5 h-3.5" />
                匯入備份
                <input type="file" accept=".json" className="hidden" onChange={handleImport} />
              </label>
            </div>
          </div>
          <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center opacity-80 z-10 shadow-inner">
            <FileText className="w-8 h-8 text-teal-100" />
          </div>
        </div>
      </section>

      {/* Settings List */}
      <section className="px-6">
        <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-4">一般設定</h3>
        <div className="bg-white dark:bg-[#2c2e33] rounded-[2rem] shadow-sm border border-stone-100 dark:border-stone-800 overflow-hidden">
          <SettingItem icon={<Bell />} label="通知與提醒" to="/settings/notifications" />
          <div className="h-px bg-stone-100 dark:bg-stone-800 w-[calc(100%-4rem)] mx-auto" />
          <SettingItem icon={<FileText />} label="伴侶連線" to="/partner" />
          <div className="h-px bg-stone-100 dark:bg-stone-800 w-[calc(100%-4rem)] mx-auto" />
          <div className="w-full flex items-center justify-between p-5 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer" onClick={() => setIsDarkMode(!isDarkMode)}>
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-stone-50 dark:bg-[#1a1c1e] text-stone-400 rounded-2xl flex items-center justify-center shadow-sm border border-stone-50 dark:border-stone-800">
                {isDarkMode ? <Sun className="text-amber-400" /> : <Moon />}
              </div>
              <span className="font-black text-stone-700 dark:text-stone-200">深色模式</span>
            </div>
            <div className={`w-12 h-6 rounded-full relative transition-colors ${isDarkMode ? "bg-teal-500" : "bg-stone-200"}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isDarkMode ? "left-[1.75rem]" : "left-1"}`} />
            </div>
          </div>
          <div className="h-px bg-stone-100 dark:bg-stone-800 w-[calc(100%-4rem)] mx-auto" />
          <SettingItem icon={<Shield />} label="隱私與安全性" to="/settings/privacy" />
        </div>
      </section>
    </div>
  );
}

function SettingItem({ icon, label, to }: { icon: React.ReactNode, label: string, to?: string }) {
  const content = (
    <div className="w-full flex items-center justify-between p-5 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 bg-stone-50 dark:bg-[#1a1c1e] text-stone-400 rounded-2xl flex items-center justify-center shadow-sm border border-stone-50 dark:border-stone-800">
          {icon}
        </div>
        <span className="font-black text-stone-700 dark:text-stone-200">{label}</span>
      </div>
      <div className="w-8 h-8 flex items-center justify-center text-stone-300 dark:text-stone-600">
        <ChevronRight className="w-5 h-5" />
      </div>
    </div>
  );

  if (to) {
    return <NavLink to={to} className="block hover:bg-stone-50">{content}</NavLink>;
  }

  return (
    <button className="w-full block text-left hover:bg-stone-50 transition-colors">
      {content}
    </button>
  );
}
