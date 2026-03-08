import { motion } from "motion/react";
import { Mic, X, Coffee, Frown, Smile, Droplet, Wind, Moon } from "lucide-react";
import { useState } from "react";

export function LoggingSheet({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"voice" | "symptoms" | "mood">("voice");

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black z-50 max-w-md mx-auto"
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        className="absolute bottom-0 w-full bg-white rounded-t-3xl shadow-2xl z-50 p-6 flex flex-col gap-6 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-stone-800">快速紀錄</h2>
          <button onClick={onClose} className="p-2 text-stone-400 hover:bg-stone-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex bg-stone-100 rounded-xl p-1">
          <TabButton active={activeTab === "voice"} onClick={() => setActiveTab("voice")}>語音分析</TabButton>
          <TabButton active={activeTab === "symptoms"} onClick={() => setActiveTab("symptoms")}>症狀</TabButton>
          <TabButton active={activeTab === "mood"} onClick={() => setActiveTab("mood")}>心情</TabButton>
        </div>

        {activeTab === "voice" && (
          <div className="flex flex-col items-center justify-center py-8 gap-6">
            <div className="text-center">
              <p className="text-stone-500 mb-2">按下並說出你吃了什麼</p>
              <p className="text-sm text-stone-400">「我剛吃了一碗拉麵跟一顆蘋果」</p>
            </div>
            <VoiceRecorder onResult={(text) => console.log("Voice Result:", text)} />
          </div>
        )}

        {activeTab === "symptoms" && (
          <div className="grid grid-cols-3 gap-4">
            <TagButton icon={<Droplet />} label="經痛" />
            <TagButton icon={<Wind />} label="脹氣" />
            <TagButton icon={<Moon />} label="失眠" />
            <TagButton icon={<Coffee />} label="頭痛" />
          </div>
        )}

        {activeTab === "mood" && (
          <div className="grid grid-cols-3 gap-4">
            <TagButton icon={<Smile />} label="平靜" />
            <TagButton icon={<Frown />} label="焦慮" />
            <TagButton icon={<Wind />} label="易怒" />
            <TagButton icon={<Smile />} label="開心" />
          </div>
        )}
      </motion.div>
    </>
  );
}

function VoiceRecorder({ onResult }: { onResult: (text: string) => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");

  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("您的瀏覽器不支援語音辨識。");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "zh-TW";
    recognition.interimResults = true;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = (event: any) => {
      setIsRecording(false);
      console.error("語音識別錯誤:", event.error);
      if (event.error === "not-allowed") {
        alert("權限不足：行動裝置（尤其 Chrome）需要透過 HTTPS 安全連線才能開啟麥克風語音功能。請嘗試在電腦 localhost 上測試。");
      } else {
        alert("辨識發生錯誤：" + event.error);
      }
    };

    recognition.onresult = (event: any) => {
      const current = event.results[event.resultIndex][0].transcript;
      setTranscript(current);
      if (event.results[event.resultIndex].isFinal) {
        onResult(current);
      }
    };

    recognition.start();
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={startSpeechRecognition}
        className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-colors ${isRecording ? "bg-rose-500 animate-pulse text-white" : "bg-teal-600 text-white"
          }`}
      >
        <Mic className="w-10 h-10" />
      </motion.button>
      {isRecording && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-rose-500 font-bold animate-pulse">正在聆聽中...</p>
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 w-full text-center">
            <p className="text-stone-600 italic">"{transcript || "請說話..."}"</p>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${active ? "bg-white text-teal-700 shadow-sm" : "text-stone-500 hover:text-stone-700"
        }`}
    >
      {children}
    </button>
  );
}

function TagButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  const [selected, setSelected] = useState(false);
  return (
    <button
      onClick={() => setSelected(!selected)}
      className={`flex flex-col items-center justify-center p-4 rounded-2xl gap-2 transition-all border ${selected ? "bg-teal-50 border-teal-200 text-teal-700 shadow-sm" : "bg-white border-stone-200 text-stone-500 hover:bg-stone-50"
        }`}
    >
      <div className="w-6 h-6">{icon}</div>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
