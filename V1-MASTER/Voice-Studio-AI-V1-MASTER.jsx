
import {
  Mic, Play, Pause, Download, Volume2, Sparkles, RefreshCw, Trash2, Heart,
  Plus, Folder, History, Settings, Copy, Check, Sliders, User, Info, FileText,
  ChevronRight, X, Music, Layers, BookOpen, Layers2, Sparkle, Search, CheckCircle2,
  Upload, Square, AudioLines, Wand2,
  AlertCircle, Share2, CornerDownRight, VolumeX, FastForward, RotateCcw
} from 'lucide-react';

// ==========================================
// CENTRALIZED VOICE MAPPING CONFIGURATION
// ==========================================
const VOICE_PRESETS = [
  {
    id: "guru_wanita",
    name: "Guru Wanita",
    gender: "Wanita",
    category: "GURU",
    tags: ["Ramah", "Jelas", "Hangat", "Edukasi"],
    description: "Suara ramah, jernih, dan hangat untuk pengajaran materi sekolah/e-learning.",
    geminiVoice: "Leda",
    sampleText: "Halo anak-anak, selamat datang di kelas sains interaktif hari ini."
  },
  {
    id: "guru_pria",
    name: "Guru Pria",
    gender: "Pria",
    category: "GURU",
    tags: ["Tenang", "Jelas", "Berwibawa"],
    description: "Suara tenang, jelas, dan berwibawa cocok untuk materi SMP, SMA & Perkuliahan.",
    geminiVoice: "Kore",
    sampleText: "Selamat pagi semuanya. Mari kita buka modul pembelajaran bab ketiga."
  },
  {
    id: "ustadz",
    name: "Ustadz",
    gender: "Pria",
    category: "USTADZ",
    tags: ["Tenang", "Reflektif", "Berwibawa", "Islami"],
    description: "Suara sintetis tenang dan berwibawa untuk dakwah, tazkiyah, & nasihat bijak.",
    geminiVoice: "Charon",
    sampleText: "Assalamu'alaikum warahmatullah. Semoga keberkahan senantiasa membimbing langkah kita."
  },
  {
    id: "ustadzah",
    name: "Ustadzah",
    gender: "Wanita",
    category: "USTADZAH",
    tags: ["Lembut", "Hangat", "Jelas", "Islami"],
    description: "Suara lembut, hangat, dan menyeudukkan untuk kajian keislaman & pembelajaran agama.",
    geminiVoice: "Aoede",
    sampleText: "Assalamu'alaikum warahmatullah. Mari kita senantiasa meningkatkan keimanan dan ketakwaan."
  },
  {
    id: "pembawa_berita",
    name: "Pembawa Berita",
    gender: "Pria",
    category: "BERITA",
    tags: ["Formal", "Tegas", "Informatif"],
    description: "Artikulasi formal, tegas, dan berwibawa untuk siaran berita resmi.",
    geminiVoice: "Kore",
    sampleText: "Berita utama hari ini: Perkembangan teknologi AI di sektor pendidikan Indonesia semakin pesat."
  },
  {
    id: "narator",
    name: "Narator Dokumenter",
    gender: "Wanita",
    category: "NARATOR",
    tags: ["Netral", "Jelas", "Stabil"],
    description: "Suara netral, tempo stabil, dan penuh kedalaman untuk video edukasi/dokumenter.",
    geminiVoice: "Zephyr",
    sampleText: "Voice Studio AI menghadirkan cara baru menghasilkan sulih suara profesional."
  },
  {
    id: "storyteller_wanita",
    name: "Storyteller Wanita",
    gender: "Wanita",
    category: "STORYTELLER",
    tags: ["Ekspresif", "Hangat", "Dramatis"],
    description: "Ekspresif dan emosional untuk dongeng anak, audiobook, dan novel suara.",
    geminiVoice: "Aoede",
    sampleText: "Di balik bukit nan jauh di sana, hidulpah sekelompok sahabat yang gemar berpetualang."
  },
  {
    id: "storyteller_pria",
    name: "Storyteller Pria",
    gender: "Pria",
    category: "STORYTELLER",
    tags: ["Dalam", "Dramatis", "Misterius"],
    description: "Suara berat dan dramatis untuk narasi dongeng, sejarah, dan petualangan.",
    geminiVoice: "Fenrir",
    sampleText: "Malam itu angin berhembus kencang, membawa kisah rahasia dari masa lampau."
  },
  {
    id: "anak_perempuan",
    name: "Anak Perempuan",
    gender: "Wanita",
    category: "ANAK",
    tags: ["Ceria", "Ringan", "Playful"],
    description: "Suara anak-anak yang riang dan ceria untuk animasi dan aplikasi edukasi anak.",
    geminiVoice: "Puck",
    sampleText: "Wah, lihat deh! Kupu-kupunya terbang tinggi sekali di atas bunga!"
  },
  {
    id: "anak_lakilaki",
    name: "Anak Laki-laki",
    gender: "Pria",
    category: "ANAK",
    tags: ["Ceria", "Aktif", "Semangat"],
    description: "Suara sintetis anak aktif dan energik untuk media belajar usia dini.",
    geminiVoice: "Puck",
    sampleText: "Ayo teman-teman, kita berangkat berpetualang ke taman sains!"
  },
  {
    id: "presenter",
    name: "Presenter Enerjik",
    gender: "Wanita",
    category: "PRESENTER",
    tags: ["Enerjik", "Persuasif", "Modern"],
    description: "Gaya persuasif dan antusias untuk seminar, acara, dan pengumuman.",
    geminiVoice: "Callirrhoe",
    sampleText: "Selamat pagi dan selamat datang di acara Pameran Inovasi Pendidikan tahun ini!"
  },
  {
    id: "podcast_host",
    name: "Podcast Host",
    gender: "Pria",
    category: "PODCAST",
    tags: ["Santai", "Akrab", "Casual"],
    description: "Gaya santai dan ramah seperti perbincangan akrab di studio podcast.",
    geminiVoice: "Orus",
    sampleText: "Halo kawan-kawan sekalian, balik lagi di episode obrolan edukasi seru kita."
  },
  {
    id: "iklan_promosi",
    name: "Iklan & Promosi",
    gender: "Wanita",
    category: "ADVERTISEMENT",
    tags: ["Menarik", "Antusias", "Komersial"],
    description: "Intonasi komersial memikat untuk video promosi produk & layanan.",
    geminiVoice: "Despina",
    sampleText: "Jangan lewatkan pendaftaran program beasiswa khusus bulan ini. Daftar sekarang!"
  }
];

const CATEGORIES = [
  "SEMUA", "WANITA", "PRIA", "ANAK", "GURU", "USTADZ", "USTADZAH",
  "NARATOR", "BERITA", "STORYTELLER", "PRESENTER", "PODCAST", "ADVERTISEMENT"
];

const STYLES = [
  "Natural", "Professional", "Friendly", "Formal", "Casual", "Warm", "Calm",
  "Energetic", "Inspirational", "Dramatic", "News", "Storytelling", "Educational",
  "Advertisement", "Podcast"
];

const EMOTIONS = [
  "Natural", "Happy", "Excited", "Calm", "Serious", "Sad", "Warm",
  "Inspirational", "Dramatic", "Confident", "Gentle", "Energetic"
];

const TEACHER_PRESETS = [
  { label: "Guru SD", voiceId: "guru_wanita", style: "Educational", emotion: "Warm", text: "Selamat pagi anak-anak pintar! Hari ini kita akan belajar hal yang sangat menyenangkan." },
  { label: "Guru SMP", voiceId: "guru_pria", style: "Educational", emotion: "Friendly", text: "Halo semuanya. Silakan buka buku modul Informatika halaman 42." },
  { label: "Guru SMA", voiceId: "guru_pria", style: "Professional", emotion: "Serious", text: "Pada bab ini kita akan menganalisis dampak sosial dan etika penggunaan AI." },
  { label: "Dosen", voiceId: "guru_pria", style: "Formal", emotion: "Confident", text: "Rekan-rekan mahasiswa, pendekatan metode ini didasari oleh prinsip pemrosesan sinyal digital." },
  { label: "Ustadz Dakwah", voiceId: "ustadz", style: "Warm", emotion: "Calm", text: "Assalamu'alaikum warahmatullah. Ilmu yang bermanfaat adalah yang membawa kebaikan bagi sesama." }
];

// Voice-to-Voice target profiles. Existing Gemini TTS presets above are untouched.
// The target voice_id is supplied by the secure /api/voice-changer backend.
const VOICE_TO_VOICE_PRESETS = [
  { id: "guru_wanita", label: "Guru Wanita", icon: "👩‍🏫", voiceId: "" },
  { id: "guru_pria", label: "Guru Pria / Dosen", icon: "👨‍🏫", voiceId: "" },
  { id: "anak_perempuan", label: "Anak Perempuan", icon: "👧", voiceId: "" },
  { id: "anak_lakilaki", label: "Anak Laki-laki", icon: "👦", voiceId: "" },
  { id: "kakek", label: "Kakek", icon: "👴", voiceId: "" },
  { id: "nenek", label: "Nenek", icon: "👵", voiceId: "" },
  { id: "creator", label: "Content Creator", icon: "🎙️", voiceId: "" },
  { id: "ustadz", label: "Ustadz", icon: "🕌", voiceId: "" },
  { id: "ustadzah", label: "Ustadzah", icon: "🧕", voiceId: "" }
];


// ==========================================
// UTILITY FUNCTIONS: PCM TO WAV CONVERSION
// ==========================================
function pcmToWav(pcmBase64, sampleRate = 24000) {
  const binaryString = window.atob(pcmBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = bytes.length;
  const chunkSize = 36 + dataSize;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  function writeString(v, offset, str) {
    for (let i = 0; i < str.length; i++) {
      v.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  writeString(view, 0, 'RIFF');
  view.setUint32(4, chunkSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  const pcmBytes = new Uint8Array(buffer, 44, dataSize);
  pcmBytes.set(bytes);

  return new Blob([buffer], { type: 'audio/wav' });
}

// Fallback synthetic wave generator for Demo / Offline mode
function generateSyntheticDemoWav(text, speed = 1.0) {
  const sampleRate = 22050;
  const wordCount = Math.max(1, text.trim().split(/\s+/).length);
  const duration = Math.min(Math.max((wordCount / 2.8) / speed, 2.0), 12.0);
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Int16Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const f0 = 160 + Math.sin(t * 10) * 20 + Math.cos(t * 4) * 10;
    const speechEnv = Math.abs(Math.sin(t * Math.PI * 3.5)) * 0.7 + 0.3;
    const fadeOut = t > duration - 0.2 ? (duration - t) / 0.2 : 1;
    const fadeIn = t < 0.1 ? t / 0.1 : 1;

    const sample = (
      Math.sin(2 * Math.PI * f0 * t) * 0.5 +
      Math.sin(2 * Math.PI * (f0 * 2) * t) * 0.2 +
      Math.sin(2 * Math.PI * (f0 * 3) * t) * 0.1
    ) * speechEnv * fadeIn * fadeOut;

    buffer[i] = Math.max(-32768, Math.min(32767, sample * 16000));
  }

  const bytes = new Uint8Array(buffer.buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return pcmToWav(base64, sampleRate);
}

// ==========================================
// MAIN APPLICATION COMPONENT
// ==========================================
export default function App() {
  const [activeTab, setActiveTab] = useState('create');
  const [script, setScript] = useState(
    "[cheerful] Selamat pagi, anak-anak!\n\n[serious] Hari ini kita akan membahas materi penting tentang keamanan data di era digital.\n\n[pause]\n\n[warm] Apakah kalian tahu apa yang terjadi jika data pribadi kita tersebar secara bebas?"
  );
  
  // Voice Controls State
  const [selectedVoiceId, setSelectedVoiceId] = useState('guru_wanita');
  const [style, setStyle] = useState('Educational');
  const [emotion, setEmotion] = useState('Warm');
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState('Normal');
  const [volume, setVolume] = useState(100);

  // Multi-Speaker State
  const [isMultiSpeaker, setIsMultiSpeaker] = useState(false);
  const [speaker1Voice, setSpeaker1Voice] = useState('guru_wanita');
  const [speaker2Voice, setSpeaker2Voice] = useState('anak_lakilaki');
  const [multiScript, setMultiScript] = useState(
    "GURU: Selamat pagi anak-anak, hari ini kita belajar materi baru.\nSISWA: Selamat pagi Bu Guru! Materi apa yang akan kita pelajari hari ini?\nGURU: Hari ini kita akan membahas tentang etika berinternet dan keamanan digital."
  );

  // AI Voice Director Modal
  const [aiDirectorOpen, setAiDirectorOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiNotes, setAiNotes] = useState(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  // Audio Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingText, setLoadingText] = useState("Menyiapkan studio AI...");
  const [currentAudio, setCurrentAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);

  // Application Data Persistence
  const [favorites, setFavorites] = useState(['guru_wanita', 'ustadz']);
  const [history, setHistory] = useState([
    {
      id: "hist-1",
      title: "Materi Cyberbullying Kelas 8",
      voiceName: "Guru Wanita",
      geminiVoice: "Leda",
      style: "Educational",
      duration: "01:12",
      date: "13 Ags 2026, 14:30",
      favorite: true,
      audioUrl: null
    },
    {
      id: "hist-2",
      title: "Kajian Rutin - Menjaga Lisan",
      voiceName: "Ustadz",
      geminiVoice: "Charon",
      style: "Warm",
      duration: "00:48",
      date: "12 Ags 2026, 09:15",
      favorite: false,
      audioUrl: null
    }
  ]);

  const [projects, setProjects] = useState([
    {
      id: "proj-1",
      title: "Video Pembelajaran Informatika SMP",
      category: "Edukasi",
      itemsCount: 3,
      updatedAt: "13 Ags 2026"
    },
    {
      id: "proj-2",
      title: "Seri Storytelling Islami Anak",
      category: "Dakwah",
      itemsCount: 5,
      updatedAt: "10 Ags 2026"
    }
  ]);

  // Audio Ref
  const audioRef = useRef(null);
  const [toast, setToast] = useState(null);

  // ==========================================
  // VOICE-TO-VOICE STATE (ADDED — EXISTING TTS UNCHANGED)
  // ==========================================
  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [sourceAudioBlob, setSourceAudioBlob] = useState(null);
  const [sourceAudioUrl, setSourceAudioUrl] = useState(null);
  const [voiceChangeAudio, setVoiceChangeAudio] = useState(null);
  const [voiceChangeTarget, setVoiceChangeTarget] = useState('guru_wanita');
  const [isConvertingVoice, setIsConvertingVoice] = useState(false);
  const [removeBackgroundNoise, setRemoveBackgroundNoise] = useState(true);


  const formatRecordingTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const sec = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const stopRecordingTimer = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const startVoiceRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        showToast('Browser tidak mendukung perekaman mikrofon.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferred = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType: preferred });
      const chunks = [];
      recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        setSourceAudioBlob(blob);
        setSourceAudioUrl(URL.createObjectURL(blob));
      };
      mediaRecorderRef.current = recorder;
      setRecordingSeconds(0);
      setIsRecording(true);
      recorder.start();
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => {
          if (prev >= 299) {
            stopVoiceRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      showToast('Perekaman dimulai.');
    } catch (error) {
      console.error(error);
      showToast('Izin mikrofon ditolak atau tidak tersedia.');
    }
  };

  const stopVoiceRecording = () => {
    stopRecordingTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleVoiceFile = (file) => {
    if (!file) return;
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast('File terlalu besar. Maksimal 50 MB.');
      return;
    }
    setSourceAudioBlob(file);
    setSourceAudioUrl(URL.createObjectURL(file));
    setVoiceChangeAudio(null);
    showToast('Audio siap dikonversi.');
  };

  const handleVoiceToVoice = async () => {
    if (!sourceAudioBlob) {
      showToast('Rekam atau upload suara terlebih dahulu.');
      return;
    }
    if (recordingSeconds > 300) {
      showToast('Audio maksimal 5 menit.');
      return;
    }

    setIsConvertingVoice(true);
    try {
      const formData = new FormData();
      formData.append('audio', sourceAudioBlob, sourceAudioBlob.name || 'recording.webm');
      formData.append('targetVoice', voiceChangeTarget);
      formData.append('removeBackgroundNoise', String(removeBackgroundNoise));

      const response = await fetch('/api/voice-changer', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
      }

      const resultBlob = await response.blob();
      const resultUrl = URL.createObjectURL(resultBlob);
      setVoiceChangeAudio({
        url: resultUrl,
        blob: resultBlob,
        target: VOICE_TO_VOICE_PRESETS.find(v => v.id === voiceChangeTarget)?.label || voiceChangeTarget
      });
      showToast('Voice-to-Voice berhasil dibuat!');
    } catch (error) {
      console.error(error);
      showToast('Voice-to-Voice gagal. Pastikan API Voice Changer sudah dikonfigurasi.');
    } finally {
      setIsConvertingVoice(false);
    }
  };

  const clearVoiceToVoice = () => {
    stopVoiceRecording();
    if (sourceAudioUrl) URL.revokeObjectURL(sourceAudioUrl);
    if (voiceChangeAudio?.url) URL.revokeObjectURL(voiceChangeAudio.url);
    setSourceAudioBlob(null);
    setSourceAudioUrl(null);
    setVoiceChangeAudio(null);
    setRecordingSeconds(0);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const selectedVoiceObj = VOICE_PRESETS.find(v => v.id === selectedVoiceId) || VOICE_PRESETS[0];

  // Calculated script stats
  const charCount = script.length;
  const wordCount = script.trim() ? script.trim().split(/\s+/).length : 0;
  const estimatedSeconds = Math.round((wordCount / 2.5) / speed);
  const estDurationFormatted = `${Math.floor(estimatedSeconds / 60).toString().padStart(2, '0')}:${(estimatedSeconds % 60).toString().padStart(2, '0')}`;

  // Gemini TTS Call Function with Retry Strategy
  // Gemini TTS is called through the secure Next.js server route.
  // The Gemini API key is NEVER exposed to the browser.
  const handleGenerateVoice = async () => {
    if ((!isMultiSpeaker && !script.trim()) || (isMultiSpeaker && !multiScript.trim())) {
      showToast("Naskah tidak boleh kosong!");
      return;
    }

    setIsGenerating(true);
    setLoadingText("Memproses instruksi & karakter suara...");

    const activeVoice = selectedVoiceObj.geminiVoice;
    const rawText = isMultiSpeaker ? multiScript : script;
    const cleanText = rawText
      .replace(/\[(happy|serious|calm|excited|whispers|pause|slow|dramatic|cheerful|warm)\]/gi, " ")
      .trim();

    let directorContext = `Style: ${style}. Emotion: ${emotion}. Speed: ${speed}x. Pitch: ${pitch}. Volume: ${volume}%.`;
    if (aiNotes) {
      directorContext += ` Director Notes: ${aiNotes.notes}`;
    }

    let generatedWavBlob = null;
    let isDemoAudio = false;

    for (let attempt = 0; attempt < 2 && !generatedWavBlob; attempt++) {
      try {
        setLoadingText(`Generating audio via Gemini TTS (Percobaan ${attempt + 1})...`);

        const payload = isMultiSpeaker
          ? {
              text: multiScript,
              multiSpeaker: true,
              speaker1Voice: (VOICE_PRESETS.find(v => v.id === speaker1Voice) || VOICE_PRESETS[0]).geminiVoice,
              speaker2Voice: (VOICE_PRESETS.find(v => v.id === speaker2Voice) || VOICE_PRESETS[8]).geminiVoice,
            }
          : {
              text: cleanText,
              multiSpeaker: false,
              voiceName: activeVoice,
              style,
              emotion,
              speed,
              pitch,
              volume,
              directorContext,
            };

        const res = await fetch("/api/gemini-tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const detail = await res.text();
          throw new Error(detail || `HTTP ${res.status}`);
        }

        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("audio/")) {
          const detail = await res.text();
          throw new Error(detail || "Server tidak mengembalikan audio.");
        }

        generatedWavBlob = await res.blob();
      } catch (err) {
        console.warn("Gemini TTS attempt failed:", err);
        if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 700));
      }
    }

    // Keep the existing local demo fallback so the UI never becomes unusable.
    if (!generatedWavBlob) {
      isDemoAudio = true;
      setLoadingText("Menggunakan Mode Studio fallback lokal...");
      generatedWavBlob = generateSyntheticDemoWav(cleanText, speed);
    }

    const audioUrl = URL.createObjectURL(generatedWavBlob);
    const titleExcerpt = cleanText.substring(0, 30) + (cleanText.length > 30 ? "..." : "");

    const newAudioObj = {
      id: `audio-${Date.now()}`,
      title: titleExcerpt,
      voiceName: isMultiSpeaker ? "Multi-Speaker (Guru & Siswa)" : selectedVoiceObj.name,
      geminiVoice: activeVoice,
      style,
      duration: estDurationFormatted,
      blob: generatedWavBlob,
      url: audioUrl,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isDemo: isDemoAudio,
    };

    setCurrentAudio(newAudioObj);
    setIsGenerating(false);

    setHistory(prev => [
      {
        id: newAudioObj.id,
        title: titleExcerpt,
        voiceName: newAudioObj.voiceName,
        geminiVoice: activeVoice,
        style,
        duration: estDurationFormatted,
        date: "Baru Saja",
        favorite: false,
        audioUrl: audioUrl,
      },
      ...prev,
    ]);

    showToast(
      isDemoAudio
        ? "Gemini belum merespons. Audio Demo Studio dibuat."
        : "Voice Over berhasil digenerate via Gemini!"
    );
  };

  // Preview Voice Function
  const handlePreviewVoice = (voiceItem) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(voiceItem.sampleText);
      utter.lang = 'id-ID';
      utter.rate = 1.0;
      window.speechSynthesis.speak(utter);
      showToast(`Memutar pratinjau: ${voiceItem.name}`);
    } else {
      showToast(`Pratinjau karakter ${voiceItem.name}`);
    }
  };

  // AI Voice Director Generator
  const handleProcessAiDirector = () => {
    if (!aiPrompt.trim()) return;
    setIsAiProcessing(true);
    setTimeout(() => {
      setAiNotes({
        profile: "Female Educational Instructor",
        scene: "Pengajaran konsep kurikulum di ruang kelas modern",
        notes: "Artikulasi jernih, intonasi ramah, tempo sedang, nada hangat & menginspirasi."
      });
      setIsAiProcessing(false);
      showToast("Instruksi AI Director berhasil dibuat!");
    }, 1200);
  };

  // Toggle Favorite
  const toggleFavorite = (voiceId) => {
    if (favorites.includes(voiceId)) {
      setFavorites(favorites.filter(id => id !== voiceId));
      showToast("Dihapus dari favorit.");
    } else {
      setFavorites([...favorites, voiceId]);
      showToast("Ditambahkan ke favorit!");
    }
  };

  // Quick Script Tag Inserter
  const insertTag = (tag) => {
    setScript(prev => `${prev} [${tag}] `);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-500 selection:text-white">
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-purple-600 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-purple-400/30 animate-bounce">
          <Sparkles className="w-4 h-4 text-purple-200" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-purple-300 via-pink-200 to-indigo-300 bg-clip-text text-transparent">
                VOICE STUDIO AI
              </h1>
              <span className="bg-purple-900/60 border border-purple-700/50 text-purple-300 text-[10px] px-2 py-0.5 rounded-full font-mono">
                GEMINI TTS
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">"Create natural voiceovers with AI."</p>
          </div>
        </div>

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800/80">
          {[
            { id: 'create', label: 'Create', icon: Mic },
            { id: 'library', label: 'Voice Library', icon: BookOpen },
            { id: 'projects', label: 'Projects', icon: Folder },
            { id: 'history', label: 'History', icon: History },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* STATUS BADGE */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-full text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-mono text-[11px] hidden sm:inline">gemini-2.5-flash-preview-tts</span>
            <span className="font-mono text-[11px] sm:hidden">Online</span>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT WORKSPACE */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 mb-16 md:mb-0">
        {/* TAB 1: CREATE VOICE */}
        {activeTab === 'create' && (
          <div className="space-y-6">
            {/* TEACHER PRESETS BANNER */}
            <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-800/30 p-4 rounded-2xl">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 text-purple-300 font-semibold text-sm">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Preset Praktis Guru & Edukator</span>
                </div>
                <span className="text-xs text-slate-400">Klik untuk langsung menerapkan gaya pengajaran</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {TEACHER_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedVoiceId(preset.voiceId);
                      setStyle(preset.style);
                      setEmotion(preset.emotion);
                      setScript(preset.text);
                      showToast(`Preset "${preset.label}" diterapkan!`);
                    }}
                    className="bg-slate-800/80 hover:bg-purple-900/50 border border-slate-700/60 hover:border-purple-500/50 text-xs px-3 py-1.5 rounded-xl transition text-slate-200 flex items-center gap-1.5"
                  >
                    <span>🎙️</span>
                    <span className="font-medium">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEFT COLUMN: SCRIPT EDITOR */}
              <div className="lg:col-span-7 space-y-5">
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h2 className="font-bold text-base text-slate-100 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-400" />
                        <span>Tulis Naskah Voice Over</span>
                      </h2>
                    </div>

                    {/* SINGLE vs MULTI SPEAKER TOGGLE */}
                    <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs">
                      <button
                        onClick={() => setIsMultiSpeaker(false)}
                        className={`px-3 py-1 rounded-lg transition font-medium ${
                          !isMultiSpeaker ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Single Voice
                      </button>
                      <button
                        onClick={() => setIsMultiSpeaker(true)}
                        className={`px-3 py-1 rounded-lg transition font-medium ${
                          isMultiSpeaker ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Multi Speaker
                      </button>
                    </div>
                  </div>

                  {!isMultiSpeaker ? (
                    <>
                      {/* SCRIPT DIRECTOR QUICK TAGS */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] text-slate-400 font-medium mr-1">Tag Emosi Naskah:</span>
                        {["happy", "serious", "calm", "excited", "whispers", "pause", "slow", "dramatic"].map((tag) => (
                          <button
                            key={tag}
                            onClick={() => insertTag(tag)}
                            className="bg-slate-800 hover:bg-slate-700 text-purple-300 text-[11px] px-2 py-1 rounded-md font-mono border border-slate-700 transition"
                          >
                            [{tag}]
                          </button>
                        ))}
                      </div>

                      {/* TEXTAREA EDITOR */}
                      <div className="relative">
                        <textarea
                          value={script}
                          onChange={(e) => setScript(e.target.value)}
                          placeholder="Tulis atau tempel naskah Anda di sini..."
                          className="w-full h-56 bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none font-sans leading-relaxed"
                        />
                      </div>
                    </>
                  ) : (
                    /* MULTI SPEAKER DIALOGUE EDITOR */
                    <div className="space-y-3">
                      <p className="text-xs text-slate-400">
                        Format dialog multi-speaker. Gunakan awalan <code className="text-purple-300">GURU:</code> dan <code className="text-purple-300">SISWA:</code> untuk percakapan interaktif.
                      </p>
                      <textarea
                        value={multiScript}
                        onChange={(e) => setMultiScript(e.target.value)}
                        placeholder="GURU: Selamat pagi...\nSISWA: Selamat pagi Bu!"
                        className="w-full h-56 bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                      />
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                          <label className="text-[11px] font-semibold text-purple-300 block mb-1">Speaker 1 (GURU)</label>
                          <select
                            value={speaker1Voice}
                            onChange={(e) => setSpeaker1Voice(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs p-1.5 text-slate-200 focus:outline-none"
                          >
                            {VOICE_PRESETS.map(v => (
                              <option key={v.id} value={v.id}>{v.name} ({v.gender})</option>
                            ))}
                          </select>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                          <label className="text-[11px] font-semibold text-pink-300 block mb-1">Speaker 2 (SISWA)</label>
                          <select
                            value={speaker2Voice}
                            onChange={(e) => setSpeaker2Voice(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs p-1.5 text-slate-200 focus:outline-none"
                          >
                            {VOICE_PRESETS.map(v => (
                              <option key={v.id} value={v.id}>{v.name} ({v.gender})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* BOTTOM TOOLBAR OF EDITOR */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                    <div className="flex items-center gap-4">
                      <span>Karakter: <strong className="text-slate-200">{charCount}</strong></span>
                      <span>Kata: <strong className="text-slate-200">{wordCount}</strong></span>
                      <span>Est. Durasi: <strong className="text-purple-300">~{estDurationFormatted}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          try {
                            const text = await navigator.clipboard.readText();
                            setScript(text);
                            showToast("Naskah ditempel dari clipboard!");
                          } catch (err) {
                            showToast("Gagal membaca clipboard.");
                          }
                        }}
                        className="flex items-center gap-1 hover:text-slate-200 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 transition"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Paste</span>
                      </button>
                      <button
                        onClick={() => {
                          setScript("");
                          showToast("Naskah dibersihkan.");
                        }}
                        className="flex items-center gap-1 hover:text-rose-300 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* AI VOICE DIRECTOR BANNER */}
                <div className="bg-gradient-to-r from-purple-900/30 via-slate-900 to-indigo-900/30 border border-purple-800/40 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-purple-300 font-semibold text-sm">
                      <Sparkle className="w-4 h-4 text-purple-400 animate-spin" />
                      <span>AI Voice Director</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Tuliskan instruksi natural untuk menyesuaikan nada, emosi, & kecepatan otomatis.
                    </p>
                  </div>
                  <button
                    onClick={() => setAiDirectorOpen(true)}
                    className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-3 py-2 rounded-xl font-medium transition flex items-center gap-1.5 shrink-0 shadow-lg shadow-purple-600/30"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Buka Director</span>
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN: VOICE SELECTION & CONTROLS */}
              <div className="lg:col-span-5 space-y-5">
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-4">
                  <h3 className="font-bold text-sm text-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4 text-purple-400" />
                      <span>Pilih Karakter Suara</span>
                    </span>
                    <button
                      onClick={() => setActiveTab('library')}
                      className="text-xs text-purple-400 hover:underline flex items-center gap-1"
                    >
                      <span>Lihat Pustaka</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </h3>

                  {/* ACTIVE VOICE CARD DISPLAY */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-purple-900/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-purple-900/50 border border-purple-700/50 flex items-center justify-center font-bold text-purple-300 text-sm">
                          {selectedVoiceObj.name[0]}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-slate-100">{selectedVoiceObj.name}</h4>
                          <span className="text-[11px] text-purple-400 font-mono">
                            Preset Gemini: {selectedVoiceObj.geminiVoice}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handlePreviewVoice(selectedVoiceObj)}
                        className="bg-slate-800 hover:bg-purple-900/40 text-purple-300 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1 transition"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Preview</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{selectedVoiceObj.description}</p>
                  </div>

                  {/* VOICE SELECT DROPDOWN */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Pilih Karakter Suara Lain:</label>
                    <select
                      value={selectedVoiceId}
                      onChange={(e) => setSelectedVoiceId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                      {VOICE_PRESETS.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.gender}) — {v.category}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* STYLE & EMOTION SELECTORS */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Gaya Suara (Style)</label>
                      <select
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none"
                      >
                        {STYLES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Emosi (Emotion)</label>
                      <select
                        value={emotion}
                        onChange={(e) => setEmotion(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none"
                      >
                        {EMOTIONS.map((e) => (
                          <option key={e} value={e}>{e}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* VOICE CONTROL SLIDERS */}
                  <div className="space-y-4 pt-3 border-t border-slate-800">
                    {/* SPEED CONTROL */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300">Kecepatan (Speed)</span>
                        <span className="text-purple-300 font-mono font-bold">{speed}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.25"
                        value={speed}
                        onChange={(e) => setSpeed(parseFloat(e.target.value))}
                        className="w-full accent-purple-500 bg-slate-950 rounded-lg cursor-pointer h-2"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>0.5x</span>
                        <span>1.0x</span>
                        <span>2.0x</span>
                      </div>
                    </div>

                    {/* PITCH & VOLUME CONTROLS */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Pitch Suara</label>
                        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
                          {['Low', 'Normal', 'High'].map((p) => (
                            <button
                              key={p}
                              onClick={() => setPitch(p)}
                              className={`py-1 rounded-lg font-medium transition ${
                                pitch === p ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-300">Volume</span>
                          <span className="text-slate-400 font-mono">{volume}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={volume}
                          onChange={(e) => setVolume(parseInt(e.target.value, 10))}
                          className="w-full accent-purple-500 bg-slate-950 rounded-lg cursor-pointer h-2 mt-2"
                        />
                      </div>
                    </div>
                  </div>

                  {/* GENERATE PRIMARY BUTTON */}
                  <button
                    onClick={handleGenerateVoice}
                    disabled={isGenerating}
                    className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>{loadingText}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 fill-current" />
                        <span>⚡ GENERATE VOICE</span>
                      </>
                    )}
                  </button>
                </div>

                {/* AUDIO PLAYER OUTPUT CARD */}
                {currentAudio && (
                  <div className="bg-gradient-to-b from-slate-900 to-purple-950/40 border border-purple-700/50 rounded-2xl p-5 shadow-2xl space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider">Hasil Sulih Suara</span>
                        <h4 className="font-bold text-sm text-slate-100">{currentAudio.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span>{currentAudio.voiceName}</span>
                          <span>•</span>
                          <span className="text-purple-300">{currentAudio.style}</span>
                        </div>
                      </div>

                      {/* DOWNLOAD WAV BUTTON */}
                      <a
                        href={currentAudio.url}
                        download={`voiceover-${currentAudio.id}.wav`}
                        className="bg-purple-600 hover:bg-purple-500 text-white p-2.5 rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-1.5 text-xs font-semibold transition"
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Download WAV</span>
                      </a>
                    </div>

                    {/* WAVEFORM VISUALIZER CANVAS MOCK */}
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center gap-1 h-14 justify-between px-4">
                      {Array.from({ length: 36 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-purple-500/70 rounded-full transition-all duration-300"
                          style={{
                            height: isPlaying ? `${Math.floor(Math.sin(i + Date.now() * 0.01) * 20 + 25)}px` : `${(i % 5) * 6 + 8}px`,
                            opacity: isPlaying ? 0.9 : 0.4
                          }}
                        />
                      ))}
                    </div>

                    {/* PLAYER CONTROLS */}
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            if (!audioRef.current) return;
                            if (isPlaying) {
                              audioRef.current.pause();
                              setIsPlaying(false);
                            } else {
                              audioRef.current.play();
                              setIsPlaying(true);
                            }
                          }}
                          className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center transition shadow-md shadow-purple-600/30"
                        >
                          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                        </button>
                        <span className="font-mono text-slate-200">{currentAudio.duration}</span>
                      </div>

                      {currentAudio.isDemo && (
                        <span className="bg-amber-950/80 border border-amber-800 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-mono">
                          Demo Mode Output
                        </span>
                      )}
                    </div>

                    <audio
                      ref={audioRef}
                      src={currentAudio.url}
                      onEnded={() => setIsPlaying(false)}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VOICE TO VOICE — NEW, EXISTING GEMINI TTS IS UNCHANGED */}
        {activeTab === 'voice-to-voice' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-800/40 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                  <AudioLines className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-100">Voice to Voice</h2>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Rekam suara Anda atau upload audio, lalu ubah karakter suaranya sambil mempertahankan cara bicara, timing, dan ekspresi rekaman. Fitur ini berdiri terpisah dari Gemini TTS yang sudah ada.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm flex items-center gap-2"><Mic className="w-4 h-4 text-purple-400" /> Suara Asli</h3>
                  <span className="text-[10px] text-slate-500 font-mono">maks. 05:00</span>
                </div>

                <div className="rounded-2xl border border-dashed border-purple-700/50 bg-slate-950 p-6 text-center">
                  {!isRecording ? (
                    <button onClick={startVoiceRecording} className="w-20 h-20 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-purple-600/30 transition active:scale-95">
                      <Mic className="w-8 h-8" />
                    </button>
                  ) : (
                    <button onClick={stopVoiceRecording} className="w-20 h-20 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-rose-600/30 transition animate-pulse">
                      <Square className="w-7 h-7 fill-current" />
                    </button>
                  )}
                  <div className="mt-3 font-mono text-lg text-slate-100">{formatRecordingTime(recordingSeconds)}</div>
                  <p className="text-xs text-slate-400 mt-1">{isRecording ? 'Sedang merekam — tekan untuk berhenti' : 'Tekan mikrofon untuk merekam'}</p>

                  <label className="mt-5 inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-semibold cursor-pointer transition">
                    <Upload className="w-4 h-4" />
                    Upload Audio
                    <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleVoiceFile(e.target.files?.[0])} />
                  </label>
                </div>

                {sourceAudioUrl && (
                  <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 space-y-2">
                    <div className="text-[11px] text-slate-400 flex items-center gap-2"><Volume2 className="w-3.5 h-3.5 text-purple-400" /> Preview suara asli</div>
                    <audio src={sourceAudioUrl} controls className="w-full h-9" />
                  </div>
                )}
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <h3 className="font-bold text-sm flex items-center gap-2"><Wand2 className="w-4 h-4 text-purple-400" /> Ubah Menjadi</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {VOICE_TO_VOICE_PRESETS.map((voice) => (
                    <button
                      key={voice.id}
                      onClick={() => setVoiceChangeTarget(voice.id)}
                      className={`p-3 rounded-xl border text-left transition ${voiceChangeTarget === voice.id ? 'bg-purple-600/20 border-purple-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-purple-700/50'}`}
                    >
                      <div className="text-xl">{voice.icon}</div>
                      <div className="text-[11px] font-semibold mt-1">{voice.label}</div>
                    </button>
                  ))}
                </div>

                <label className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-3 cursor-pointer">
                  <span>
                    <span className="block text-xs font-semibold text-slate-200">Bersihkan noise</span>
                    <span className="block text-[10px] text-slate-500 mt-0.5">Kurangi suara latar rekaman</span>
                  </span>
                  <input type="checkbox" checked={removeBackgroundNoise} onChange={(e) => setRemoveBackgroundNoise(e.target.checked)} className="accent-purple-500" />
                </label>

                <button
                  onClick={handleVoiceToVoice}
                  disabled={!sourceAudioBlob || isConvertingVoice}
                  className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-xl shadow-purple-600/20 flex items-center justify-center gap-2 transition"
                >
                  {isConvertingVoice ? <><RefreshCw className="w-5 h-5 animate-spin" /> Memproses Voice-to-Voice...</> : <><Sparkles className="w-5 h-5" /> CONVERT VOICE</>}
                </button>

                <button onClick={clearVoiceToVoice} className="w-full text-xs text-slate-500 hover:text-slate-300 py-1">Reset</button>
              </div>
            </div>

            {voiceChangeAudio && (
              <div className="bg-gradient-to-b from-slate-900 to-purple-950/40 border border-purple-700/50 rounded-2xl p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider">Hasil Voice-to-Voice</span>
                    <h3 className="font-bold text-slate-100 mt-1">{voiceChangeAudio.target}</h3>
                  </div>
                  <a href={voiceChangeAudio.url} download="voice-to-voice-result.mp3" className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"><Download className="w-4 h-4" /> Download</a>
                </div>
                <audio src={voiceChangeAudio.url} controls className="w-full" />
              </div>
            )}
          </div>
        )}

        {/* TAB 2: VOICE LIBRARY */}
        {activeTab === 'library' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-100">Pustaka Karakter Suara AI</h2>
                <p className="text-xs text-slate-400">
                  Eksplorasi preset suara sintetis generik yang dapat dipetakan secara terpusat.
                </p>
              </div>

              {/* SEARCH BOX */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Cari karakter suara..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
            </div>

            {/* CATEGORY FILTERS */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className="bg-slate-900 hover:bg-purple-900/40 border border-slate-800 hover:border-purple-600/50 text-xs px-3.5 py-1.5 rounded-xl font-medium text-slate-300 whitespace-nowrap transition"
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* VOICE CARDS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {VOICE_PRESETS.map((voice) => {
                const isFav = favorites.includes(voice.id);
                return (
                  <div
                    key={voice.id}
                    className="bg-slate-900/70 border border-slate-800 hover:border-purple-600/40 rounded-2xl p-5 shadow-lg space-y-4 transition group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-900 to-indigo-900 border border-purple-700/40 flex items-center justify-center font-bold text-purple-200 text-lg">
                          {voice.name[0]}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-100 group-hover:text-purple-300 transition">
                            {voice.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-medium">
                              {voice.gender}
                            </span>
                            <span className="text-[10px] font-mono text-purple-400">
                              Gemini: {voice.geminiVoice}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleFavorite(voice.id)}
                        className={`p-2 rounded-xl border transition ${
                          isFav
                            ? 'bg-rose-950/60 border-rose-800 text-rose-400'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">
                      {voice.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {voice.tags.map((tag) => (
                        <span key={tag} className="text-[10px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded-md border border-slate-800">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                      <button
                        onClick={() => handlePreviewVoice(voice)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
                      >
                        <Play className="w-3.5 h-3.5 fill-current text-purple-400" />
                        <span>Preview</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedVoiceId(voice.id);
                          setActiveTab('create');
                          showToast(`Suara ${voice.name} dipilih untuk studio!`);
                        }}
                        className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-3.5 py-1.5 rounded-xl font-medium transition shadow-md shadow-purple-600/20"
                      >
                        Gunakan Suara
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: PROJECTS */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-100">Project Sulih Suara</h2>
                <p className="text-xs text-slate-400">Kelola kelompok voice-over untuk seri video pembelajaran atau konten.</p>
              </div>
              <button
                onClick={() => {
                  const name = prompt("Masukkan nama project baru:");
                  if (name) {
                    setProjects([
                      ...projects,
                      {
                        id: `proj-${Date.now()}`,
                        title: name,
                        category: "Umum",
                        itemsCount: 0,
                        updatedAt: "Baru saja"
                      }
                    ]);
                    showToast("Project baru berhasil dibuat!");
                  }
                }}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-1.5 shadow-lg shadow-purple-600/30"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Project Baru</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((proj) => (
                <div key={proj.id} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-purple-900/40 border border-purple-700/40 flex items-center justify-center text-purple-300">
                      <Folder className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] bg-slate-800 text-purple-300 px-2 py-0.5 rounded-md font-mono">
                      {proj.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-100">{proj.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{proj.itemsCount} klip audio terimpan</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
                    <span>Diperbarui: {proj.updatedAt}</span>
                    <button
                      onClick={() => {
                        setActiveTab('create');
                        showToast(`Membuka workspace untuk project: ${proj.title}`);
                      }}
                      className="text-purple-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <span>Buka Workspace</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-100">Riwayat Voice Over</h2>
                <p className="text-xs text-slate-400">Daftar audio yang pernah Anda generate sebelumnya.</p>
              </div>
              <button
                onClick={() => {
                  setHistory([]);
                  showToast("Riwayat dibersihkan.");
                }}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Semua</span>
              </button>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              {history.length === 0 ? (
                <div className="p-12 text-center text-slate-500 space-y-2">
                  <History className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-sm">Belum ada riwayat audio yang dibuat.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {history.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-slate-800/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <button className="w-10 h-10 rounded-xl bg-purple-900/40 border border-purple-700/40 flex items-center justify-center text-purple-300 shrink-0">
                          <Play className="w-4 h-4 fill-current" />
                        </button>
                        <div>
                          <h4 className="font-semibold text-sm text-slate-100">{item.title}</h4>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                            <span>{item.voiceName}</span>
                            <span>•</span>
                            <span className="text-purple-300">{item.style}</span>
                            <span>•</span>
                            <span className="font-mono">{item.duration}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 justify-end text-xs">
                        <span className="text-slate-500 mr-2 text-[11px]">{item.date}</span>
                        {item.audioUrl && (
                          <a
                            href={item.audioUrl}
                            download={`${item.title}.wav`}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
                            title="Download WAV"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => {
                            setHistory(history.filter(h => h.id !== item.id));
                            showToast("Item riwayat dihapus.");
                          }}
                          className="p-2 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-100">Pengaturan Studio</h2>
              <p className="text-xs text-slate-400">Konfigurasi bawaan mesin AI TTS Gemini & preferensi antarmuka.</p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-purple-400" />
                  <span>Mesin Gemini TTS</span>
                </h3>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Model Utama:</span>
                    <span className="font-mono text-purple-300">gemini-2.5-flash-preview-tts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status Kunci API:</span>
                    <span className="text-emerald-400 font-semibold">Tersedia via Runtime Google Studio</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Format Output Audio:</span>
                    <span className="font-mono text-slate-300">WAV (PCM 16-bit)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800">
                <h3 className="font-bold text-sm text-slate-200">Bawaan Workspace (Default)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-semibold">Suara Bawaan:</label>
                    <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200">
                      {VOICE_PRESETS.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-semibold">Gaya Bawaan:</label>
                    <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200">
                      {STYLES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-2">
                <h3 className="font-bold text-sm text-slate-200">Voice-to-Voice Engine</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Voice-to-Voice menggunakan endpoint server <code className="text-purple-300">/api/voice-changer</code>. API key tidak diletakkan di browser. Target voice ID dikonfigurasi di server melalui environment variable.</p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => showToast("Pengaturan berhasil disimpan!")}
                  className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-5 py-2.5 rounded-xl font-semibold transition shadow-lg shadow-purple-600/30"
                >
                  Simpan Pengaturan
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* AI VOICE DIRECTOR MODAL */}
      {aiDirectorOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-800/60 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-base text-slate-100">AI Voice Director</h3>
              </div>
              <button
                onClick={() => setAiDirectorOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Jelaskan suasana atau gaya bacaan yang Anda inginkan. AI Director akan memformulasikan instruksi teknis untuk sulih suara.
            </p>

            <div className="space-y-2">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Contoh: Bacakan seperti guru perempuan yang sedang menjelaskan materi kepada siswa SMP. Suaranya hangat, jelas, dan profesional..."
                className="w-full h-28 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
              />
              <button
                onClick={handleProcessAiDirector}
                disabled={isAiProcessing}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white text-xs py-2.5 rounded-xl font-semibold transition flex items-center justify-center gap-2"
              >
                {isAiProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menganalisis Instruksi AI...</span>
                  </>
                ) : (
                  <span>Formulasikan Catatan Sutradara</span>
                )}
              </button>
            </div>

            {aiNotes && (
              <div className="bg-slate-950 p-4 rounded-xl border border-purple-900/50 space-y-2 text-xs">
                <div>
                  <span className="text-purple-400 font-bold">Audio Profile:</span>
                  <p className="text-slate-300">{aiNotes.profile}</p>
                </div>
                <div>
                  <span className="text-purple-400 font-bold">Scene:</span>
                  <p className="text-slate-300">{aiNotes.scene}</p>
                </div>
                <div>
                  <span className="text-purple-400 font-bold">Director Notes:</span>
                  <p className="text-slate-300">{aiNotes.notes}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setAiDirectorOpen(false);
                  showToast("Catatan Director diterapkan pada studio!");
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2 rounded-xl font-medium transition"
              >
                Terapkan ke Studio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800 px-3 py-2 flex items-center justify-around">
        {[
          { id: 'create', label: 'Create', icon: Mic },
          { id: 'library', label: 'Pustaka', icon: BookOpen },
          { id: 'projects', label: 'Projects', icon: Folder },
          { id: 'history', label: 'Riwayat', icon: History },
          { id: 'settings', label: 'Pengaturan', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 text-[10px] font-medium transition ${
                isActive ? 'text-purple-400' : 'text-slate-500'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
