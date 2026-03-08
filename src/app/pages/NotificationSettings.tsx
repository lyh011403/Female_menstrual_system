import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Bell, Droplets, Pill, Sparkles, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router";

interface NotificationConfig {
    water: boolean;
    meds: boolean;
    period: boolean;
}

export function NotificationSettings() {
    const navigate = useNavigate();
    const [config, setConfig] = useState<NotificationConfig>(() => {
        const saved = localStorage.getItem("notification_config");
        return saved ? JSON.parse(saved) : { water: true, meds: true, period: true };
    });

    useEffect(() => {
        localStorage.setItem("notification_config", JSON.stringify(config));
    }, [config]);

    const toggle = (key: keyof NotificationConfig) => {
        setConfig(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="flex flex-col min-h-screen bg-stone-50 overflow-y-auto pb-24 font-sans focus:outline-none">
            <header className="px-6 pt-10 pb-6 flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-stone-400 active:scale-95 transition-all"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-black text-stone-800 tracking-tight">通知與提醒</h1>
            </header>

            <div className="px-6 space-y-6 mt-4">
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 overflow-hidden">
                    <div className="p-6">
                        <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-6 px-2">提醒項目設定</h3>

                        <div className="space-y-2">
                            <ToggleItem
                                icon={<Droplets className="text-blue-400" />}
                                title="飲水提醒"
                                desc="當今日飲水目標尚未達成時發出通知"
                                enabled={config.water}
                                onToggle={() => toggle('water')}
                            />
                            <div className="h-px bg-stone-50 mx-4" />
                            <ToggleItem
                                icon={<Pill className="text-rose-400" />}
                                title="服藥提醒"
                                desc="當有尚未標記服用的藥物時發出通知"
                                enabled={config.meds}
                                onToggle={() => toggle('meds')}
                            />
                            <div className="h-px bg-stone-50 mx-4" />
                            <ToggleItem
                                icon={<Sparkles className="text-rose-500" />}
                                title="經期預警"
                                desc="經期預計到訪前 5 天發出溫馨提醒"
                                enabled={config.period}
                                onToggle={() => toggle('period')}
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-stone-100/50 rounded-[2rem] border border-dashed border-stone-200">
                    <p className="text-[11px] text-stone-400 font-bold leading-relaxed">
                        💡 小提示：開啟通知能幫助您更規律地進行健康管理。如果您在手機上使用，請確保也開啟了 PWA 的系統通知權限。
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
        <div className="flex items-center justify-between p-4 rounded-3xl hover:bg-stone-50 transition-colors">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white shadow-sm rounded-2xl flex items-center justify-center text-stone-400 border border-stone-50">
                    {icon}
                </div>
                <div className="flex flex-col">
                    <span className="text-[15px] font-black text-stone-700">{title}</span>
                    <span className="text-[10px] font-medium text-stone-400 max-w-[160px]">{desc}</span>
                </div>
            </div>
            <button
                onClick={onToggle}
                className={`w-14 h-8 rounded-full transition-all relative ${enabled ? "bg-teal-500 shadow-teal-100 shadow-lg" : "bg-stone-200"}`}
            >
                <motion.div
                    animate={{ x: enabled ? 26 : 4 }}
                    className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                />
            </button>
        </div>
    );
}
