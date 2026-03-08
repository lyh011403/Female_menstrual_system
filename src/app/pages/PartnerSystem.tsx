import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { ChevronLeft, Share2, Copy, Check, Heart, Shield, Bell, Eye, EyeOff, UserPlus, Utensils } from "lucide-react";
import { useNavigate } from "react-router";

export function PartnerSystem() {
    const navigate = useNavigate();
    const [inviteCode, setInviteCode] = useState("A8K3-9P2Z");
    const [partnerCode, setPartnerCode] = useState("");
    const [isConnected, setIsConnected] = useState(() => localStorage.getItem("partner_connected") === "true");
    const [copySuccess, setCopySuccess] = useState(false);

    const [permissions, setPermissions] = useState({
        cycle: true,
        symptoms: true,
        diet: false,
        mood: true
    });

    useEffect(() => {
        localStorage.setItem("partner_connected", isConnected.toString());
    }, [isConnected]);

    const handleConnect = () => {
        if (partnerCode.trim().length >= 6) {
            setIsConnected(true);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteCode);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#e6f0ff] font-sans pb-28">
            <header className="px-6 pt-10 pb-6 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="w-10 h-10 neu-extruded rounded-2xl flex items-center justify-center text-stone-400">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-black text-[#44474b]">伴侶連線</h1>
            </header>

            <div className="px-6 space-y-6">
                {!isConnected ? (
                    <>
                        <section className="neu-extruded rounded-[2.5rem] p-8 flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 bg-rose-50 text-rose-400 rounded-3xl flex items-center justify-center mb-2">
                                <Heart className="w-8 h-8 fill-current" />
                            </div>
                            <h2 className="text-xl font-black text-[#44474b]">分享您的關懷</h2>
                            <p className="text-xs text-stone-400 font-bold leading-relaxed">
                                與伴侶同步生理週期狀態，讓對方在您最需要的時候提供體貼的照顧與支持。
                            </p>
                        </section>

                        <section className="space-y-4 font-black">
                            <h3 className="text-[10px] text-stone-400 uppercase tracking-widest pl-2">我的邀請碼</h3>
                            <div className="neu-extruded rounded-3xl p-5 flex items-center justify-between">
                                <span className="text-xl tracking-widest text-[#4a90e2]">{inviteCode}</span>
                                <button onClick={handleCopy} className="w-10 h-10 neu-extruded-sm rounded-xl flex items-center justify-center text-stone-400 active:scale-95 transition-all">
                                    {copySuccess ? <Check className="w-5 h-5 text-teal-500" /> : <Copy className="w-5 h-5" />}
                                </button>
                            </div>
                            <p className="text-[10px] text-stone-400 text-center">將此代碼傳送給伴侶，讓對方輸入即可完成連線。</p>
                        </section>

                        <section className="space-y-4 font-black pt-4">
                            <h3 className="text-[10px] text-stone-400 uppercase tracking-widest pl-2">輸入伴侶邀請碼</h3>
                            <div className="flex gap-3">
                                <input
                                    value={partnerCode}
                                    onChange={e => setPartnerCode(e.target.value)}
                                    placeholder="例如: 6J8W-2L9P"
                                    className="flex-1 bg-white/50 border-none neu-inset rounded-2xl px-5 py-4 text-sm font-bold placeholder:opacity-30 outline-none"
                                />
                                <button onClick={handleConnect} className="w-14 h-14 bg-[#4a90e2] text-white rounded-2xl shadow-lg flex items-center justify-center active:scale-95 transition-all">
                                    <UserPlus className="w-6 h-6" />
                                </button>
                            </div>
                        </section>
                    </>
                ) : (
                    <>
                        <section className="neu-extruded rounded-[2.5rem] p-8 flex flex-col items-center gap-4 bg-teal-50/30">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-14 h-14 rounded-full bg-white shadow-md border-4 border-white flex items-center justify-center overflow-hidden">
                                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Partner" />
                                </div>
                                <div className="relative">
                                    <Heart className="w-6 h-6 text-rose-400 fill-current animate-pulse" />
                                </div>
                                <div className="w-14 h-14 rounded-full bg-white shadow-md border-4 border-white flex items-center justify-center overflow-hidden font-black text-[#4a90e2]">
                                    妳
                                </div>
                            </div>
                            <h2 className="text-lg font-black text-[#44474b]">已成功連線！</h2>
                            <p className="text-xs text-stone-400 font-bold">目前伴侶可以查看到您的部分授權資料。</p>
                            <button onClick={() => setIsConnected(false)} className="text-[10px] font-black text-rose-400 underline mt-4">解除伴侶關係</button>
                        </section>

                        <section className="space-y-4">
                            <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest pl-2">隱私授權設定</h3>
                            <div className="neu-extruded rounded-[2rem] overflow-hidden">
                                <PermissionToggle icon={<Bell />} label="分享週期階段" active={permissions.cycle} onToggle={() => setPermissions(p => ({ ...p, cycle: !p.cycle }))} />
                                <div className="h-px bg-[#d9e5f5] w-full" />
                                <PermissionToggle icon={<Shield />} label="分享身體症狀" active={permissions.symptoms} onToggle={() => setPermissions(p => ({ ...p, symptoms: !p.symptoms }))} />
                                <div className="h-px bg-[#d9e5f5] w-full" />
                                <PermissionToggle icon={<Heart />} label="分享即時心情" active={permissions.mood} onToggle={() => setPermissions(p => ({ ...p, mood: !p.mood }))} />
                                <div className="h-px bg-[#d9e5f5] w-full" />
                                <PermissionToggle icon={<Utensils />} label="分享飲食紀錄" active={permissions.diet} onToggle={() => setPermissions(p => ({ ...p, diet: !p.diet }))} />
                            </div>
                        </section>

                        <section className="neu-extruded rounded-[2rem] p-6 space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Share2 className="w-4 h-4 text-[#4a90e2]" />
                                <h3 className="text-sm font-black text-[#44474b]">自動關懷系統</h3>
                            </div>
                            <p className="text-xs text-stone-400 font-bold leading-relaxed">
                                當進入經期不適期，系統會自動提示伴侶：「她今天可能比較疲憊，建議可以準備熱水或幫忙分擔家務。」
                            </p>
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}

function PermissionToggle({ icon, label, active, onToggle }: { icon: React.ReactNode, label: string, active: boolean, onToggle: () => void }) {
    return (
        <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? "bg-[#4a90e2]/10 text-[#4a90e2]" : "bg-stone-100 text-stone-400"}`}>
                    {icon}
                </div>
                <span className="font-black text-stone-600 text-sm">{label}</span>
            </div>
            <button onClick={onToggle} className={`w-12 h-6 rounded-full p-1 transition-all ${active ? "bg-[#4a90e2]" : "bg-stone-300"}`}>
                <motion.div
                    animate={{ x: active ? 24 : 0 }}
                    className="w-4 h-4 bg-white rounded-full shadow-sm"
                />
            </button>
        </div>
    );
}
