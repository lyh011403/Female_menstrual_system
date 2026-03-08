import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Shield, Trash2, Lock, ChevronLeft, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router";

export function PrivacySettings() {
    const navigate = useNavigate();
    const [hideSensitiveData, setHideSensitiveData] = useState(() => localStorage.getItem("hide_sensitive") === "true");

    useEffect(() => {
        localStorage.setItem("hide_sensitive", hideSensitiveData.toString());
    }, [hideSensitiveData]);

    const clearAllData = () => {
        if (confirm("確定要清除所有紀錄嗎？這項操作無法復原，包含經期、飲水、服藥與飲食的所有數據都將被刪除。")) {
            localStorage.clear();
            alert("所有數據已清除。頁面將重新載入。");
            window.location.href = "/";
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-stone-50 dark:bg-[#1a1c1e] overflow-y-auto pb-24 font-sans focus:outline-none transition-colors duration-500">
            <header className="px-6 pt-10 pb-6 flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-full bg-white dark:bg-[#2c2e33] shadow-sm flex items-center justify-center text-stone-400 active:scale-95 transition-all"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-black text-stone-800 dark:text-stone-100 tracking-tight">隱私與安全性</h1>
            </header>

            <div className="px-6 space-y-6 mt-4">
                <div className="bg-white dark:bg-[#2c2e33] rounded-[2.5rem] shadow-sm border border-stone-100 dark:border-stone-800 overflow-hidden">
                    <div className="p-6">
                        <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-6 px-2">資料隱私設定</h3>

                        <div className="space-y-2">
                            <ToggleItem
                                icon={hideSensitiveData ? <EyeOff className="text-rose-400" /> : <Eye className="text-teal-400" />}
                                title="隱藏敏感數據"
                                desc="在預覽畫面中模糊化經期具體日期與體重數值"
                                enabled={hideSensitiveData}
                                onToggle={() => setHideSensitiveData(!hideSensitiveData)}
                            />
                            <div className="h-px bg-stone-50 dark:bg-stone-800 mx-4" />
                            <div className="flex items-center justify-between p-4 rounded-3xl opacity-50 cursor-not-allowed">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white dark:bg-[#1a1c1e] shadow-sm rounded-2xl flex items-center justify-center text-stone-400 border border-stone-50 dark:border-stone-800">
                                        <Lock />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[15px] font-black text-stone-700 dark:text-stone-300">生物辨識鎖定</span>
                                        <span className="text-[10px] font-medium text-stone-400">開啟應用程式時要求 FaceID / 指紋</span>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black text-stone-300 px-3 py-1 bg-stone-50 dark:bg-stone-800 rounded-full">即將推出</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#2c2e33] rounded-[2.5rem] shadow-sm border border-stone-100 dark:border-stone-800 overflow-hidden">
                    <div className="p-6">
                        <h3 className="text-[10px] font-black text-[#ff5a5f] uppercase tracking-widest mb-6 px-2">危險區域</h3>
                        <button
                            onClick={clearAllData}
                            className="w-full flex items-center gap-4 p-4 rounded-3xl hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors group"
                        >
                            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-[15px] font-black text-rose-600">清除所有紀錄</span>
                                <span className="text-[10px] font-medium text-rose-400">刪除本裝置上儲存的所有個人健康數據</span>
                            </div>
                        </button>
                    </div>
                </div>

                <div className="p-6 bg-stone-100/50 dark:bg-stone-900/50 rounded-[2rem] border border-dashed border-stone-200 dark:border-stone-800 text-center">
                    <Shield className="w-8 h-8 text-stone-300 dark:text-stone-700 mx-auto mb-3" />
                    <p className="text-[11px] text-stone-400 dark:text-stone-500 font-bold leading-relaxed">
                        您的數據僅儲存於目前的本地瀏覽器中，我們不會將您的任何生理紀錄上傳至雲端伺服器，確保您的私密資訊絕對安全。
                    </p>
                </div>
            </div>
        </div>
    );
}

function ToggleItem({ icon, title, desc, enabled, onToggle }: {
    icon: React.ReactNode,
    title: string,
    desc: string,
    enabled: boolean,
    onToggle: () => void
}) {
    return (
        <div className="flex items-center justify-between p-4 rounded-3xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white dark:bg-[#1a1c1e] shadow-sm rounded-2xl flex items-center justify-center text-stone-400 border border-stone-50 dark:border-stone-800">
                    {icon}
                </div>
                <div className="flex flex-col">
                    <span className="text-[15px] font-black text-stone-700 dark:text-stone-300">{title}</span>
                    <span className="text-[10px] font-medium text-stone-400 max-w-[160px]">{desc}</span>
                </div>
            </div>
            <button
                onClick={onToggle}
                className={`w-14 h-8 rounded-full transition-all relative ${enabled ? "bg-teal-500 shadow-teal-100 shadow-lg" : "bg-stone-200 dark:bg-stone-700"}`}
            >
                <motion.div
                    animate={{ x: enabled ? 26 : 4 }}
                    className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                />
            </button>
        </div>
    );
}
