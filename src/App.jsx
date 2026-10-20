import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  BookOpenText,
  Brain,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Gamepad2,
  Globe,
  Heart,
  Home,
  Leaf,
  LogOut,
  MessageCircle,
  School,
  Settings2,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  SunMedium,
  Video,
} from 'lucide-react';

const START_DATE = new Date('2026-03-10T00:00:00-06:00');
const SESSION_TIMEOUT_MS = 5 * 60 * 1000;
const DEFAULT_SITE_LOGO = 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80';
const CANADA_TIME_ZONE = 'America/Edmonton';

const getCanadaElapsed = () => {
  const now = new Date();
  const canadaNow = new Date(now.toLocaleString('en-US', { timeZone: CANADA_TIME_ZONE }));
  const diff = Math.max(0, canadaNow.getTime() - START_DATE.getTime());
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
};

const getSortDate = (item) => {
  if (!item) return 0;
  return new Date(item.sortAt || item.createdAt || item.metaAt || Date.now()).getTime();
};

const sortByDateDesc = (items = []) => [...items].sort((a, b) => getSortDate(b) - getSortDate(a));
const heroImages = [
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80',
];

const tabs = [
  { key: 'home', icon: Home },
  { key: 'school', icon: School },
  { key: 'health', icon: Stethoscope },
  { key: 'games', icon: Gamepad2 },
];

const dailyQuote = {
  zh: '自由的思考，温暖的陪伴。',
  en: 'Free thinking, warm companionship.',
};

const dailyMessage = {
  zh: '把每个小小成长瞬间，视为一张珍贵的地图。',
  en: 'Every small growth moment becomes a precious map of our life.',
};

const copy = {
  zh: {
    title: '我们的秘密基地',
    subtitle: '温暖的父女时光，藏在每一张照片和每一次对话里。',
    loginBase: '登录基地',
    dadLogin: '爸爸登录',
    daughterLogin: '女儿登录',
    admin: '管理员',
    email: 'yqcw@qq.com',
    password: '123456',
    home: '首页',
    school: '认识社会',
    health: '健康生活',
    games: '游戏乐园',
    logout: '退出',
    quickNote: '今天的微小惊喜',
    reminder: '一起去湖边看枫叶，记录一段“加拿大的自由下午”。',
    days: '来到加拿大的第',
    day: '天',
    dadStatus: '爸爸状态',
    daughterStatus: '女儿状态',
    memory: '记忆盒',
    taskBoard: '任务墙',
    qna: '父女问答',
    today: '今天',
    message: '自由的思考，温暖的陪伴。',
    goodMorning: '把每个小小成长瞬间，视为一张珍贵的地图。',
    schoolVideo: '校园视频',
    needLogin: '请先登录才能进入秘密基地。',
    english: 'EN',
    chinese: '中文',
  },
  en: {
    title: 'Our Secret Base',
    subtitle: 'A warm father-daughter space made of memories, stories, and small adventures.',
    loginBase: 'Login base',
    dadLogin: 'Dad Login',
    daughterLogin: 'Daughter Login',
    admin: 'Admin',
    email: 'yqcw@qq.com',
    password: '123456',
    home: 'Home',
    school: 'Social Learning',
    health: 'Health',
    games: 'Game Corner',
    logout: 'Log out',
    quickNote: 'Small surprise today',
    reminder: 'Let’s walk by the lake, watch the maple leaves, and keep a gentle memory of Canadian afternoons.',
    days: 'Days in Canada',
    day: 'days',
    dadStatus: 'Dad Status',
    daughterStatus: 'Daughter Status',
    memory: 'Memory Box',
    taskBoard: 'Task Board',
    qna: 'Q&A',
    today: 'Today',
    message: 'Free thinking, warm companionship.',
    goodMorning: 'Every small growth moment becomes a precious map of our life.',
    schoolVideo: 'Campus Video',
    needLogin: 'Please sign in to enter the secret base.',
    english: 'EN',
    chinese: '中文',
  },
};

const initialMoments = [
  { author: '爸爸', type: '照片', title: '野生动物邻居', text: '今天早晨在小区里碰到了两只很可爱的小松鼠，像在和我们打招呼。', meta: '2小时前', mediaUrl: heroImages[0], mediaType: 'image', likes: 24, comments: 5 },
  { author: 'yjh', type: '文字', title: '今天的快乐清单', text: '我吃了彩虹糖饼干，还把作业和阅读时间安排得很好，感觉自己很厉害。', meta: '昨晚', mediaUrl: null, mediaType: 'text', likes: 31, comments: 7 },
  { author: '爸爸', type: '语音', title: '从公寓到森林', text: '今天我在卡尔加里的湖边走了一圈，风很轻，天很蓝。', meta: '今天上午', mediaUrl: heroImages[2], mediaType: 'image', likes: 18, comments: 3 },
];

const defaultWishBoard = [
  { id: 1, author: '爸爸', target: 'yjh', title: '想要一张加拿大明信片', detail: '周末我想为你准备一张加拿大风景明信片，留作纪念。', type: '文字', status: 'pending', response: '' },
  { id: 2, author: 'yjh', target: '爸爸', title: '想学做加拿大小点心', detail: '我想试试做一份简单的加拿大小点心，记录自己的第一次尝试。', type: '照片', status: 'pending', response: '' },
];

function toEmbedUrl(rawUrl) {
  if (!rawUrl) return '';
  const url = rawUrl.trim();
  if (!url) return '';

  if (/bilibili\.com|b23\.tv/i.test(url)) {
    const match = url.match(/(?:\/video\/)?(BV[0-9A-Za-z]+|av\d+)(?:\/|\?|$)/i) || url.match(/(BV[0-9A-Za-z]+|av\d+)/i);
    const bvid = match ? match[1] || match[0] : '';
    if (bvid) {
      return `https://player.bilibili.com/player.html?bvid=${bvid}&autoplay=0&muted=1&danmaku=0`;
    }
    return url;
  }

  if (/youtube\.com|youtu\.be/i.test(url)) {
    const match = url.match(/(?:v=|\/)([A-Za-z0-9_-]{11})/i);
    const videoId = match ? match[1] : '';
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=0&mute=1&rel=0` : url;
  }

  return url;
}

function hasImageExtension(url) {
  if (!url) return false;
  return /\.(png|jpe?g|gif|webp|svg|bmp|avif)(\?.*)?$/i.test(url) || /images?\.|unsplash|pexels|cdn/gi.test(url);
}

function isAudioUrl(url = '') {
  const cleaned = String(url).trim();
  return /\.(mp3|wav|ogg|m4a|aac|flac)(\?.*)?$/i.test(cleaned) || /audio/i.test(cleaned);
}

function isVideoUrl(url = '') {
  const cleaned = String(url).trim();
  return /\.(mp4|webm|mov|m4v|ogg|avi|m3u8)(\?.*)?$/i.test(cleaned) || /video/i.test(cleaned);
}

function parseMediaLinks(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value)
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeSchoolContent(items = []) {
  const albums = [];
  const stories = [];
  const audios = [];
  const videos = [];

  items.forEach((item) => {
    const source = item || {};
    const type = String(source.type || '').trim();
    const mediaUrl = source.mediaUrl || source.image || source.url || '';
    if (type === '照片' || type === '图片' || (!type && hasImageExtension(mediaUrl))) {
      albums.push({ ...source, image: source.image || mediaUrl, title: source.title || '校园照片', text: source.text || '' });
      return;
    }
    if (type === '文字' || (!type && !mediaUrl && source.text)) {
      stories.push({ ...source, title: source.title || '校园故事', text: source.text || '' });
      return;
    }
    if (type === '音频' || isAudioUrl(mediaUrl) || /audio/i.test(String(mediaUrl || ''))) {
      audios.push({ ...source, title: source.title || '校园声音', url: source.url || mediaUrl || 'https://samplelib.com/lib/preview/mp3/sample-3s.mp3' });
      return;
    }
    if (type === '视频' || isVideoUrl(mediaUrl) || /bilibili|youtube/i.test(String(mediaUrl || '')) || source.url) {
      videos.push({ ...source, title: source.title || '校园视频', url: source.url || mediaUrl || 'https://www.bilibili.com/', type: source.type || 'bilibili' });
    }
  });

  return { albums, stories, audios, videos };
}

function MediaFrame({ url, title, type }) {
  if (!url) return null;

  if (type === 'image' || hasImageExtension(url)) {
    return (
      <div className="media-frame image-frame">
        <img src={url} alt={title} className="media-image" loading="lazy" />
      </div>
    );
  }

  if (type === 'audio' || isAudioUrl(url)) {
    return (
      <div className="media-frame audio-frame">
        <audio controls preload="none" src={url} />
      </div>
    );
  }

  if (type === 'video' || isVideoUrl(url)) {
    return (
      <div className="media-frame video-frame">
        <video controls preload="metadata" playsInline muted src={url} />
      </div>
    );
  }

  const embedUrl = toEmbedUrl(url);
  if (embedUrl && embedUrl !== url) {
    return (
      <div className="media-frame video-frame">
        <iframe
          src={embedUrl}
          title={title}
          loading="lazy"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="media-frame unsupported-frame">
      <span>{title}</span>
    </div>
  );
}

const qnaPairs = [
  { q: '为什么加拿大的树叶会在秋天变红？', a: '因为很多树会把叶绿素变少，而橙黄红色的色素显现出来，像在给大地换衣服。', from: '爸爸', replies: [{ author: '爸爸', text: '因为很多树会把叶绿素变少，而橙黄红色的色素显现出来，像在给大地换衣服。', createdAt: new Date().toISOString() }] },
  { q: '为什么小朋友也可以有自己的节奏？', a: '因为每个人的成长方式不同，慢一点不等于落后，反而更容易开心地成长。', from: 'yjh', replies: [{ author: 'yjh', text: '因为每个人的成长方式不同，慢一点不等于落后，反而更容易开心地成长。', createdAt: new Date().toISOString() }] },
];

function normalizeQaEntry(entry = {}) {
  const question = String(entry.q || entry.question || '新问题').trim() || '新问题';
  const answer = String(entry.a || entry.answer || '').trim();
  const replies = Array.isArray(entry.replies) ? entry.replies.map((reply) => ({
    author: reply.author || entry.from || '爸爸',
    text: String(reply.text || '').trim(),
    createdAt: reply.createdAt || new Date().toISOString(),
  })).filter((reply) => reply.text) : [];

  if (answer && !replies.some((reply) => reply.text === answer)) {
    replies.push({ author: entry.from || '爸爸', text: answer, createdAt: entry.sortAt || new Date().toISOString() });
  }

  return {
    ...entry,
    q: question,
    a: answer || (replies.length ? replies[replies.length - 1].text : '待回答'),
    replies,
    from: entry.from || '爸爸',
    sortAt: entry.sortAt || entry.createdAt || new Date().toISOString(),
  };
}

function normalizeQaList(entries = []) {
  return entries.map(normalizeQaEntry).sort((left, right) => new Date(right.sortAt).getTime() - new Date(left.sortAt).getTime());
}

const tasks = [
  { title: '想看松鼠', detail: '爸爸去山里找松鼠，带回来一个小故事。', status: '已完成', owner: 'yjh' },
  { title: '牙齿拍照', detail: '记录刷牙后的可爱笑容。', status: '待完成', owner: '爸爸' },
];

const schoolCards = [
  { title: 'Science Fair', text: '没有标准答案，只有好奇心和发现的乐趣。', icon: Brain },
  { title: 'Outdoor sports', text: '在雪地和草地上奔跑，拥抱真实的童年。', icon: SunMedium },
  { title: 'Respect self', text: '尊重每个孩子的节奏、兴趣和表达方式。', icon: Heart },
];

const healthCards = [
  { title: '牙齿保护', text: '早晚刷牙、少吃甜品、定期检查，记得微笑最美。', icon: CheckCircle2 },
  { title: '眼睛保护', text: '阅读时保持距离、遵循20-20-20法则，别让疲劳悄悄来。', icon: Sparkles },
  { title: '如何应对作业', text: '分段整理、先做最难的题、和家人一起解题更轻松。', icon: BookOpenText },
];

const games = [
  { title: '贪吃蛇', href: './snake-game.html', accent: 'from-emerald-400 to-lime-300', visual: '🐍' },
  { title: '打地鼠', href: './whack-a-mole.html', accent: 'from-amber-400 to-yellow-300', visual: '🦔' },
  { title: '赛车', href: './racing-game.html', accent: 'from-sky-400 to-cyan-300', visual: '🏎️' },
  { title: '射击小游戏', href: './shooting-game.html', accent: 'from-violet-400 to-fuchsia-300', visual: '🎯' },
  { title: '校园求生', href: './campus-survival.html', accent: 'from-pink-400 to-rose-300', visual: '🧭' },
  { title: '围棋对战', href: './go-game.html', accent: 'from-slate-500 to-slate-300', visual: '🔵' },
  { title: '彩虹俄罗斯方块', href: './rainbow-tetris.html', accent: 'from-cyan-400 to-indigo-400', visual: '🧩' },
  { title: '英语学习', href: './english.html', accent: 'from-red-400 to-orange-300', visual: '📘' },
  { title: 'AI 编程', href: './index2.html', accent: 'from-cyan-400 to-indigo-400', visual: '🤖' },
];

const healthIconMap = {
  Heart,
  Sparkles,
  CheckCircle2,
  BookOpenText,
};

const sectionTypeOptions = {
  homeStory: ['文字', '照片', '音频', '视频'],
  school: ['照片', '文字', '音频', '视频'],
  health: ['文字', '照片', '音频', '视频'],
  game: ['游戏链接'],
  wish: ['文字', '照片', '音频', '视频'],
};

function buildBlankEditorItem(section) {
  const base = {
    author: '爸爸',
    title: '',
    text: '',
    type: '照片',
    mediaUrl: '',
    image: '',
    url: '',
    href: './snake-game.html',
    accent: 'from-emerald-400 to-lime-300',
    icon: 'Heart',
    originalTitle: '',
  };

  if (section === 'homeStory') return { ...base, author: '爸爸', type: '照片', mediaUrl: heroImages[0], mediaType: 'image' };
  if (section === 'schoolAlbum') return { ...base, title: '', text: '', image: heroImages[0], type: '图片' };
  if (section === 'schoolVideo') return { ...base, title: '', url: 'https://www.bilibili.com/', type: 'bilibili' };
  if (section === 'health') return { ...base, title: '', text: '', icon: 'Heart', type: '提醒' };
  if (section === 'game') return { ...base, title: '', href: './snake-game.html', accent: 'from-emerald-400 to-lime-300', type: '游戏链接' };
  return base;
}

function getCurrentStatus(type) {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  const weekend = day === 0 || day === 6;

  if (type === 'dad') {
    if (weekend) {
      if (hour < 9) return { label: '还在睡梦中', tone: 'text-slate-500' };
      if (hour < 13) return { label: '在休息和散步', tone: 'text-emerald-600' };
      if (hour < 18) return { label: '在温暖的生活里', tone: 'text-sky-600' };
      return { label: '在放松休息', tone: 'text-violet-600' };
    }
    if (hour < 7) return { label: '还在睡觉', tone: 'text-slate-500' };
    if (hour < 8) return { label: '正在准备出发', tone: 'text-amber-600' };
    if (hour < 17) return { label: '正在工作中', tone: 'text-sky-600' };
    if (hour < 22) return { label: '下班回家中', tone: 'text-emerald-600' };
    return { label: '已入睡', tone: 'text-slate-500' };
  }

  if (weekend) {
    if (hour < 8) return { label: '还在睡觉', tone: 'text-slate-500' };
    if (hour < 13) return { label: '在享受周末', tone: 'text-emerald-600' };
    if (hour < 18) return { label: '在朋友间玩耍', tone: 'text-sky-600' };
    return { label: '正在放松', tone: 'text-violet-600' };
  }

  if (hour < 7) return { label: '还在睡梦中', tone: 'text-slate-500' };
  if (hour < 8) return { label: '起床准备上学', tone: 'text-amber-600' };
  if (hour < 18) return { label: '在学校努力学习', tone: 'text-sky-600' };
  if (hour < 21) return { label: '在放松和复习', tone: 'text-emerald-600' };
  return { label: '准备睡觉', tone: 'text-violet-600' };
}

function App() {
  const [lang, setLang] = useState('en');
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    return localStorage.getItem('secret-base-theme') || 'light';
  });
  const [role, setRole] = useState('dad');
  const [activeTab, setActiveTab] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [sessionLocked, setSessionLocked] = useState(false);
  const [lastActivityAt, setLastActivityAt] = useState(Date.now());
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [siteLogo, setSiteLogo] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_SITE_LOGO;
    return localStorage.getItem('secret-base-logo') || DEFAULT_SITE_LOGO;
  });
  const [moments, setMoments] = useState(initialMoments);
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [clock, setClock] = useState(() => getCanadaElapsed());
  const [showQaPanel, setShowQaPanel] = useState(true);
  const [qaFormOpen, setQaFormOpen] = useState(false);
  const [qaMode, setQaMode] = useState('question');
  const [qaDraft, setQaDraft] = useState({ from: '爸爸', question: '', answer: '' });
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [schoolAlbums, setSchoolAlbums] = useState([
    { title: '校园风景', text: '秋天的教学楼在金色阳光下特别安静。', image: heroImages[1] },
    { title: '学习角落', text: '书桌上的小礼物和温暖的笔记本。', image: heroImages[2] },
    { title: '运动日', text: '跑步和打球的快乐从来不缺。', image: heroImages[0] },
  ]);
  const [schoolVideos, setSchoolVideos] = useState([
    { title: '校园故事短片', url: 'https://www.bilibili.com/video/BV1GJ411x7h7/?share_source=copy_web&vd_source=38d745f4d4a2c2b32a4a0e1e8d44a1f0', type: 'bilibili' },
    { title: '课堂纪录', url: 'https://www.bilibili.com/video/BV1Q5411T7Ln/?share_source=copy_web&vd_source=38d745f4d4a2c2b32a4a0e1e8d44a1f0', type: 'bilibili' },
  ]);
  const [healthCardsLocal, setHealthCardsLocal] = useState(healthCards);
  const [gamesLocal, setGamesLocal] = useState(() => {
    if (typeof window === 'undefined') return games;
    try {
      const stored = localStorage.getItem('secret-base-games');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (error) {
      console.warn('Failed to recover stored games', error);
    }
    return games;
  });
  const [qaEntries, setQaEntries] = useState(() => normalizeQaList(qnaPairs));
  const [wishBoard, setWishBoard] = useState(defaultWishBoard);
  const [schoolStories, setSchoolStories] = useState([
    { title: '校园故事', text: '今天老师让我们和同学一起做小海报，大家都很认真，气氛特别温暖。', type: '文字' },
  ]);
  const [schoolAudios, setSchoolAudios] = useState([
    { title: '校园声音', url: 'https://samplelib.com/lib/preview/mp3/sample-3s.mp3', type: '音频' },
  ]);
  const [editor, setEditor] = useState(null);
  const [adminSection, setAdminSection] = useState('homeStory');
  const [adminDraft, setAdminDraft] = useState({
    id: '',
    author: '爸爸',
    title: '',
    text: '',
    type: '照片',
    mediaUrl: '',
    url: '',
    image: '',
    href: './snake-game.html',
    visual: '🎮',
    accent: 'from-emerald-400 to-lime-300',
    q: '',
    a: '',
    from: '爸爸',
    sortAt: new Date().toISOString(),
  });

  const t = copy[lang];
  const dadStatus = getCurrentStatus('dad');
  const daughterStatus = getCurrentStatus('daughter');
  const isDad = role === 'dad';
  const isAdmin = role === 'admin';
  const currentAuthor = isDad ? '爸爸' : isAdmin ? '管理员' : 'yjh';
  const canManageSharedSections = isAdmin || isDad;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClock(getCanadaElapsed());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;

    const handleActivity = () => {
      setLastActivityAt(Date.now());
      setSessionLocked(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setSessionLocked(true);
        setIsLoggedIn(false);
        setShowAuthForm(true);
        setPassword('');
        return;
      }

      if (document.visibilityState === 'visible' && sessionLocked) {
        setShowAuthForm(true);
      }
    };

    const timer = window.setInterval(() => {
      if (Date.now() - lastActivityAt >= SESSION_TIMEOUT_MS) {
        setSessionLocked(true);
        setIsLoggedIn(false);
        setShowAuthForm(true);
        setPassword('');
      }
    }, 1000);

    window.addEventListener('pointerdown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pointerdown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.clearInterval(timer);
    };
  }, [isLoggedIn, lastActivityAt, sessionLocked]);

  const persistFamilySection = async (section, item, mode = 'save') => {
    try {
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: mode === 'delete' ? 'delete' : 'save', section, item }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || '保存失败');
      }

      return payload.item || payload;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const loadContent = async () => {
    setIsLoadingContent(true);
    try {
      const response = await fetch('/api/content');
      const payload = await response.json();
      if (!response.ok || !payload.success || !payload.sections) {
        return;
      }

      const sections = payload.sections;
      if (Array.isArray(sections.homeStory)) setMoments(sections.homeStory);
      if (Array.isArray(sections.schoolAlbum)) setSchoolAlbums(sections.schoolAlbum);
      if (Array.isArray(sections.schoolVideo)) setSchoolVideos(sections.schoolVideo);
      if (Array.isArray(sections.school)) {
        const normalized = normalizeSchoolContent(sections.school);
        if (normalized.albums.length) setSchoolAlbums(normalized.albums);
        if (normalized.stories.length) setSchoolStories(normalized.stories);
        if (normalized.audios.length) setSchoolAudios(normalized.audios);
        if (normalized.videos.length) setSchoolVideos(normalized.videos);
      }
      if (Array.isArray(sections.health)) setHealthCardsLocal(sections.health.map((item) => ({ ...item, icon: healthIconMap[item.icon] || Heart })));
      if (Array.isArray(sections.game) && sections.game.length > 0) {
        setGamesLocal(sections.game);
      } else {
        setGamesLocal(games);
      }
      if (Array.isArray(sections.qna)) setQaEntries(normalizeQaList(sections.qna));
    } catch (error) {
      console.error('Failed to load family content', error);
    } finally {
      setIsLoadingContent(false);
    }
  };

  const syncFamilyContent = async () => {
    setIsLoadingContent(true);
    try {
      const response = await fetch('/api/content');
      const payload = await response.json();
      if (!response.ok || !payload.success || !payload.sections) {
        throw new Error(payload.error || '数据库同步失败');
      }

      const sections = payload.sections;
      if (Array.isArray(sections.homeStory)) setMoments(sections.homeStory);
      if (Array.isArray(sections.schoolAlbum)) setSchoolAlbums(sections.schoolAlbum);
      if (Array.isArray(sections.schoolVideo)) setSchoolVideos(sections.schoolVideo);
      if (Array.isArray(sections.school)) {
        const normalized = normalizeSchoolContent(sections.school);
        if (normalized.albums.length) setSchoolAlbums(normalized.albums);
        if (normalized.stories.length) setSchoolStories(normalized.stories);
        if (normalized.audios.length) setSchoolAudios(normalized.audios);
        if (normalized.videos.length) setSchoolVideos(normalized.videos);
      }
      if (Array.isArray(sections.health)) setHealthCardsLocal(sections.health.map((item) => ({ ...item, icon: healthIconMap[item.icon] || Heart })));
      if (Array.isArray(sections.game) && sections.game.length > 0) setGamesLocal(sections.game);
      if (Array.isArray(sections.qna)) setQaEntries(normalizeQaList(sections.qna));
      alert(lang === 'zh' ? '数据库已同步到当前页面。' : 'The database has been synced to the current page.');
    } catch (error) {
      console.error('Failed to sync content', error);
      alert(error.message || '同步失败');
    } finally {
      setIsLoadingContent(false);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sessionUser = localStorage.getItem('secret-base-user');
      if (sessionUser) {
        try {
          const parsed = JSON.parse(sessionUser);
          if (parsed?.role) {
            setRole(parsed.role);
            setIsLoggedIn(true);
            setShowAuthForm(false);
          }
        } catch (error) {
          console.warn('Failed to restore session user', error);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('secret-base-logo', siteLogo || DEFAULT_SITE_LOGO);
    }
  }, [siteLogo]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('secret-base-theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.style.colorScheme = theme;
    }
  }, [theme]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('secret-base-games', JSON.stringify(gamesLocal));
    }
  }, [gamesLocal]);

  const canEditSection = (section) => {
    if (!isLoggedIn) return false;
    if (isAdmin) return true;
    if (section === 'dad') return isDad;
    if (section === 'daughter') return !isDad;
    return true;
  };

  const canCreateInSection = (section) => {
    if (isAdmin || isDad) return true;
    return section === 'homeStory' && !isDad;
  };

  const openLogin = () => {
    setShowAuthForm(true);
    setUsername('');
    setPassword('');
    setRole('dad');
  };

  const login = () => {
    const trimmedUsername = String(username || '').trim();
    const trimmedPassword = String(password || '').trim();

    const resolvedRole =
      trimmedUsername === 'yq' && trimmedPassword === '123456'
        ? 'dad'
        : trimmedUsername === 'yjh' && trimmedPassword === '150113'
          ? 'daughter'
          : trimmedUsername === 'yqcw@qq.com' && trimmedPassword === '123456'
            ? 'admin'
            : null;

    if (!resolvedRole) {
      alert(lang === 'zh' ? '用户名或密码不正确，请检查后再试。' : 'Incorrect username or password. Please try again.');
      return;
    }

    setRole(resolvedRole);

    if (typeof window !== 'undefined') {
      localStorage.setItem('secret-base-user', JSON.stringify({ username: trimmedUsername, role: resolvedRole }));
    }

    setLastActivityAt(Date.now());
    setSessionLocked(false);
    setIsLoggedIn(true);
    setShowAuthForm(false);
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('secret-base-user');
    }
    setSessionLocked(false);
    setIsLoggedIn(false);
    setShowAuthForm(false);
    setPassword('');
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);
      const response = await fetch('/api/media', { method: 'POST', body: formData });
      const payload = await response.json();
      if (!response.ok || !payload.success || !payload.url) {
        throw new Error(payload.error || '上传 Logo 失败');
      }
      setSiteLogo(payload.url);
      alert(lang === 'zh' ? '站点 Logo 已更新。' : 'Site logo updated.');
    } catch (error) {
      alert(error.message || 'Logo upload failed');
    } finally {
      event.target.value = '';
    }
  };

  const addMediaItem = async (item) => {
    const nextItem = {
      author: isDad ? '爸爸' : 'yjh',
      type: item.type || '照片',
      title: item.title || '新媒体',
      text: item.text || '新上传的家庭记忆。',
      meta: '刚刚',
      mediaUrl: item.mediaUrl || null,
      mediaType: item.mediaType || (item.mediaUrl && hasImageExtension(item.mediaUrl) ? 'image' : 'video'),
      likes: 0,
      comments: 0,
    };

    const saved = await persistFamilySection('homeStory', nextItem, 'save');
    if (saved) {
      setMoments((current) => [saved, ...current.filter((entry) => entry.id !== saved.id)]);
      return;
    }

    setMoments((current) => [nextItem, ...current]);
  };

  const openWishEditor = (targetRole = 'yjh') => {
    setEditor({
      section: 'wish',
      mode: 'add',
      item: {
        id: Date.now(),
        author: isDad ? '爸爸' : 'yjh',
        target: targetRole,
        title: '',
        detail: '',
        type: '文字',
        mediaUrl: '',
        audioUrl: '',
        sortAt: new Date().toISOString(),
      },
    });
  };

  const updateWishStatus = (wishId, nextStatus, reason = '') => {
    setWishBoard((current) => current.map((wish) => wish.id === wishId ? { ...wish, status: nextStatus, response: reason || (nextStatus === 'accepted' ? '已接受，安排实施中。' : '暂时无法接受，先调整计划。') } : wish));
  };

  const handleLocalUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);

      const response = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || '文件上传失败');
      }

      if (payload.url) {
        await addMediaItem({
          type: file.type.startsWith('video/') ? '视频' : '照片',
          title: uploadTitle || file.name,
          text: '从 Cloudflare R2 上传的最新记忆。',
          mediaUrl: payload.url,
          mediaType: file.type.startsWith('video/') ? 'video' : 'image',
        });
      }

      alert(lang === 'zh' ? '上传成功。' : 'Uploaded successfully.');
    } catch (error) {
      alert(error.message || (lang === 'zh' ? '上传失败，请检查云端 R2 绑定。' : 'Upload failed. Please check the Cloudflare R2 binding.'));
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleExternalUrlSubmit = async (event) => {
    event.preventDefault();
    const url = uploadUrl.trim();
    if (!url) return;

    await addMediaItem({
      type: hasImageExtension(url) ? '照片' : '视频',
      title: uploadTitle || '外部链接媒体',
      text: '从外部链接插入的家庭故事。',
      mediaUrl: url,
      mediaType: hasImageExtension(url) ? 'image' : 'video',
    });

    setUploadUrl('');
    setUploadTitle('');
  };

  const openEditor = (section, item = null, mode = 'add') => {
    const fallbackType = sectionTypeOptions[section]?.[0] || '照片';
    setEditor({
      section,
      mode,
      item: item ? { ...buildBlankEditorItem(section), ...item, type: item.type || fallbackType } : { ...buildBlankEditorItem(section), type: fallbackType },
    });
  };

  const closeEditor = () => setEditor(null);

  const updateEditorField = (field, value) => {
    setEditor((current) => current ? ({ ...current, item: { ...current.item, [field]: value } }) : current);
  };

  const saveSectionEditor = async () => {
    if (!editor) return;
    const { section, mode, item } = editor;

    const resolveHealthIcon = (iconName) => healthIconMap[iconName] || Heart;

    if (section === 'wish') {
      const nextWish = {
        id: item.id || Date.now(),
        author: item.author || '爸爸',
        target: item.target || 'yjh',
        title: item.title || '新愿望',
        detail: item.detail || item.text || '新的愿望。',
        type: item.type || '文字',
        status: 'pending',
        response: '',
        sortAt: item.sortAt || item.createdAt || new Date().toISOString(),
      };

      setWishBoard((current) => {
        const next = mode === 'add' ? [nextWish, ...current] : current.map((wish) => (wish.id === nextWish.id ? { ...wish, ...nextWish } : wish));
        return sortByDateDesc(next);
      });
      closeEditor();
      return;
    }

    const payload = (() => {
      const firstMediaLink = parseMediaLinks(item.mediaUrl || item.url || item.mediaLinks || '')[0] || '';
      const sortAt = item.sortAt || item.createdAt || new Date().toISOString();

      if (section === 'homeStory') {
        return {
          id: item.id || item.originalTitle || undefined,
          author: item.author || (isAdmin ? '管理员' : isDad ? '爸爸' : 'yjh'),
          type: item.type || '照片',
          title: item.title || '新记录',
          text: item.text || '新的家庭记录。',
          mediaUrl: firstMediaLink,
          mediaType: item.mediaType || (firstMediaLink && hasImageExtension(firstMediaLink) ? 'image' : 'video'),
          sortAt,
        };
      }

      if (section === 'school') {
        const schoolType = item.type || '照片';
        if (schoolType === '照片') {
          return { type: '照片', title: item.title || '新学校照片', text: item.text || '新的校园记录。', image: item.image || firstMediaLink || heroImages[0], sortAt };
        }
        if (schoolType === '文字') {
          return { type: '文字', title: item.title || '校园故事', text: item.text || '新的校园故事。', url: firstMediaLink || '', sortAt };
        }
        if (schoolType === '音频') {
          return { type: '音频', title: item.title || '校园声音', text: item.text || '校园声音记录。', url: firstMediaLink || '', sortAt };
        }
        return { type: '视频', title: item.title || '校园视频', url: firstMediaLink || 'https://www.bilibili.com/', text: item.text || '', sortAt };
      }

      if (section === 'health') {
        const nextIcon = resolveHealthIcon(item.icon || 'Heart');
        return {
          id: item.id || item.originalTitle || undefined,
          title: item.title || '新健康提醒',
          text: item.text || '新的温暖提醒。',
          icon: nextIcon.displayName || item.icon || 'Heart',
          type: item.type || '文字',
          mediaUrl: firstMediaLink,
          url: firstMediaLink,
          sortAt,
        };
      }

      if (section === 'game') {
        return {
          id: item.id || item.originalTitle || undefined,
          title: item.title || '新游戏',
          href: item.href || './snake-game.html',
          accent: item.accent || 'from-emerald-400 to-lime-300',
          visual: item.visual || '🎮',
          sortAt,
        };
      }

      return item;
    })();

    const saved = await persistFamilySection(section, payload, mode === 'edit' ? 'save' : 'save');

    if (section === 'homeStory') {
      if (saved) {
        setMoments((current) => mode === 'add' ? [saved, ...current.filter((entry) => entry.id !== saved.id)] : current.map((entry) => (entry.id === saved.id || (entry.title === item.originalTitle && entry.author === (item.author || entry.author))) ? saved : entry));
      } else {
        if (mode === 'add') {
          setMoments((current) => [{
            author: payload.author || '爸爸',
            type: payload.type || '照片',
            title: payload.title || '新记录',
            text: payload.text || '新的家庭记录。',
            meta: '刚刚',
            mediaUrl: payload.mediaUrl || null,
            mediaType: payload.mediaType || (payload.mediaUrl && hasImageExtension(payload.mediaUrl) ? 'image' : 'video'),
            likes: 0,
            comments: 0,
          }, ...current]);
        } else {
          setMoments((current) => current.map((entry) => entry.title === item.originalTitle ? {
            ...entry,
            author: payload.author || entry.author,
            type: payload.type || entry.type,
            title: payload.title || entry.title,
            text: payload.text || entry.text,
            mediaUrl: payload.mediaUrl || entry.mediaUrl,
            mediaType: payload.mediaType || entry.mediaType,
          } : entry));
        }
      }
    }

    if (section === 'school') {
      const schoolType = item.type || '照片';
      if (schoolType === '照片') {
        setSchoolAlbums((current) => mode === 'add' ? [{ title: item.title || '新校园照片', text: item.text || '新的校园记录。', image: item.image || item.mediaUrl || heroImages[0] }, ...current] : current.map((entry) => entry.title === item.originalTitle ? { ...entry, title: item.title || entry.title, text: item.text || entry.text, image: item.image || item.mediaUrl || entry.image } : entry));
      }
      if (schoolType === '文字') {
        setSchoolStories((current) => mode === 'add' ? [{ title: item.title || '校园故事', text: item.text || '新的校园故事。' }, ...current] : current.map((entry) => entry.title === item.originalTitle ? { ...entry, title: item.title || entry.title, text: item.text || entry.text } : entry));
      }
      if (schoolType === '音频') {
        setSchoolAudios((current) => mode === 'add' ? [{ title: item.title || '校园声音', url: item.url || item.mediaUrl || 'https://samplelib.com/lib/preview/mp3/sample-3s.mp3' }, ...current] : current.map((entry) => entry.title === item.originalTitle ? { ...entry, title: item.title || entry.title, url: item.url || item.mediaUrl || entry.url } : entry));
      }
      if (schoolType === '视频') {
        setSchoolVideos((current) => mode === 'add' ? [{ title: item.title || '校园视频', url: item.url || item.mediaUrl || 'https://www.bilibili.com/', type: 'bilibili' }, ...current] : current.map((entry) => entry.title === item.originalTitle ? { ...entry, title: item.title || entry.title, url: item.url || item.mediaUrl || entry.url } : entry));
      }
    }

    if (section === 'health') {
      const nextIcon = resolveHealthIcon(payload.icon || 'Heart');
      if (saved) {
        setHealthCardsLocal((current) => mode === 'add' ? [saved, ...current.filter((entry) => entry.id !== saved.id)] : current.map((entry) => (entry.id === saved.id || entry.title === item.originalTitle) ? { ...saved, icon: nextIcon } : entry));
      } else {
        if (mode === 'add') {
          setHealthCardsLocal((current) => [{ title: payload.title || '新健康提醒', text: payload.text || '新的温暖提醒。', icon: nextIcon }, ...current]);
        } else {
          setHealthCardsLocal((current) => current.map((entry) => entry.title === item.originalTitle ? {
            ...entry,
            title: payload.title || entry.title,
            text: payload.text || entry.text,
            icon: nextIcon,
          } : entry));
        }
      }
    }

    if (section === 'game') {
      if (saved) {
        setGamesLocal((current) => mode === 'add' ? [saved, ...current.filter((entry) => entry.id !== saved.id)] : current.map((entry) => (entry.id === saved.id || entry.title === item.originalTitle) ? saved : entry));
      } else {
        if (mode === 'add') {
          setGamesLocal((current) => [{ title: payload.title || '新游戏', href: payload.href || './snake-game.html', accent: payload.accent || 'from-emerald-400 to-lime-300' }, ...current]);
        } else {
          setGamesLocal((current) => current.map((entry) => entry.title === item.originalTitle ? {
            ...entry,
            title: payload.title || entry.title,
            href: payload.href || entry.href,
            accent: payload.accent || entry.accent,
          } : entry));
        }
      }
    }

    closeEditor();
  };

  const deleteSectionItem = async (section, item) => {
    const result = await persistFamilySection(section, item, 'delete');
    if (result === null) {
      if (section === 'homeStory') {
        setMoments((current) => current.filter((entry) => !(entry.title === item.title && entry.author === item.author)));
      }
      if (section === 'schoolAlbum') {
        setSchoolAlbums((current) => current.filter((entry) => entry.title !== item.title));
      }
      if (section === 'schoolVideo') {
        setSchoolVideos((current) => current.filter((entry) => !(entry.title === item.title && entry.url === item.url)));
      }
      if (section === 'health') {
        setHealthCardsLocal((current) => current.filter((entry) => entry.title !== item.title));
      }
      if (section === 'game') {
        setGamesLocal((current) => current.filter((entry) => entry.title !== item.title));
      }
      return;
    }

    if (section === 'homeStory') {
      setMoments((current) => current.filter((entry) => !(entry.id === item.id || (entry.title === item.title && entry.author === item.author))));
    }
    if (section === 'schoolAlbum') {
      setSchoolAlbums((current) => current.filter((entry) => !(entry.id === item.id || entry.title === item.title)));
    }
    if (section === 'schoolVideo') {
      setSchoolVideos((current) => current.filter((entry) => !(entry.id === item.id || (entry.title === item.title && entry.url === item.url))));
    }
    if (section === 'health') {
      setHealthCardsLocal((current) => current.filter((entry) => !(entry.id === item.id || entry.title === item.title)));
    }
    if (section === 'game') {
      setGamesLocal((current) => current.filter((entry) => !(entry.id === item.id || entry.title === item.title)));
    }
    if (section === 'qna') {
      setQaEntries((current) => current.filter((entry) => !(entry.id === item.id || entry.q === item.q)));
    }
  };

  const saveQa = async () => {
    if (!qaDraft.question.trim()) return;
    const currentTime = new Date().toISOString();
    const pair = {
      q: qaDraft.question.trim(),
      a: qaDraft.answer.trim() || (qaMode === 'answer' ? '待回答' : '待补充'),
      from: qaDraft.from || (isDad ? '爸爸' : 'yjh'),
      sortAt: currentTime,
    };

    const saved = await persistFamilySection('qna', pair, 'save');

    if (qaMode === 'answer') {
      setQaEntries((current) => {
        const targetQuestion = qaDraft.question.trim();
        const next = current.map((entry) => {
          if (entry.q !== targetQuestion && entry.q !== qaDraft.question) return entry;
          const nextReplies = Array.isArray(entry.replies) ? [...entry.replies] : [];
          const nextAnswer = pair.a || '待回答';
          nextReplies.push({ author: pair.from, text: nextAnswer, createdAt: currentTime });
          return normalizeQaEntry({
            ...entry,
            q: entry.q,
            a: nextAnswer,
            from: pair.from,
            sortAt: currentTime,
            replies: nextReplies,
          });
        });
        return normalizeQaList(next.length ? next : [pair]);
      });
    } else {
      const nextItem = normalizeQaEntry({ ...pair, replies: [{ author: pair.from, text: pair.a, createdAt: currentTime }] });
      setQaEntries((current) => saved ? normalizeQaList([nextItem, ...current.filter((entry) => entry.id !== saved.id)]) : normalizeQaList([nextItem, ...current]));
    }

    setQaFormOpen(false);
    setQaMode('question');
    setQaDraft({ from: isDad ? '爸爸' : 'yjh', question: '', answer: '' });
  };

  const tabLabels = {
    home: t.home,
    school: t.school,
    health: t.health,
    games: t.games,
    admin: isAdmin ? '系统后台' : 'Admin',
  };

  const mainTabs = isAdmin
    ? [
        { key: 'home', icon: Home },
        { key: 'school', icon: School },
        { key: 'health', icon: Stethoscope },
        { key: 'games', icon: Gamepad2 },
        { key: 'admin', icon: ShieldCheck },
      ]
    : tabs;

  const makeAdminDraft = (section, item = null) => {
    const next = {
      id: item?.id || '',
      author: item?.author || '爸爸',
      title: item?.title || '',
      text: item?.text || item?.detail || '',
      type: item?.type || '照片',
      mediaUrl: item?.mediaUrl || item?.image || item?.url || '',
      url: item?.url || item?.mediaUrl || item?.image || '',
      image: item?.image || item?.mediaUrl || '',
      href: item?.href || './snake-game.html',
      visual: item?.visual || '🎮',
      accent: item?.accent || 'from-emerald-400 to-lime-300',
      q: item?.q || '',
      a: item?.a || '',
      from: item?.from || '爸爸',
      sortAt: item?.sortAt || item?.createdAt || new Date().toISOString(),
    };

    if (section === 'qna') {
      return {
        id: item?.id || '',
        q: item?.q || '',
        a: item?.a || '',
        from: item?.from || '爸爸',
        sortAt: item?.sortAt || item?.createdAt || new Date().toISOString(),
      };
    }

    if (section === 'game') {
      return {
        id: item?.id || '',
        title: item?.title || '',
        href: item?.href || './snake-game.html',
        visual: item?.visual || '🎮',
        accent: item?.accent || 'from-emerald-400 to-lime-300',
        sortAt: item?.sortAt || item?.createdAt || new Date().toISOString(),
      };
    }

    if (section === 'health') {
      return {
        id: item?.id || '',
        title: item?.title || '',
        text: item?.text || '',
        type: item?.type || '文字',
        mediaUrl: item?.mediaUrl || item?.url || '',
        url: item?.url || item?.mediaUrl || '',
        icon: item?.icon || 'Heart',
        sortAt: item?.sortAt || item?.createdAt || new Date().toISOString(),
      };
    }

    if (section === 'school') {
      return {
        id: item?.id || '',
        title: item?.title || '',
        text: item?.text || '',
        type: item?.type || '照片',
        mediaUrl: item?.mediaUrl || item?.image || item?.url || '',
        url: item?.url || item?.mediaUrl || item?.image || '',
        image: item?.image || item?.mediaUrl || '',
        sortAt: item?.sortAt || item?.createdAt || new Date().toISOString(),
      };
    }

    return next;
  };

  const adminSectionList = useMemo(() => {
    switch (adminSection) {
      case 'homeStory':
        return moments;
      case 'school':
        return [
          ...schoolAlbums.map((item) => ({ ...item, __type: '照片', __section: 'school' })),
          ...schoolStories.map((item) => ({ ...item, __type: '文字', __section: 'school' })),
          ...schoolAudios.map((item) => ({ ...item, __type: '音频', __section: 'school' })),
          ...schoolVideos.map((item) => ({ ...item, __type: '视频', __section: 'school' })),
        ];
      case 'health':
        return healthCardsLocal;
      case 'game':
        return gamesLocal;
      case 'qna':
        return qaEntries;
      default:
        return moments;
    }
  }, [adminSection, moments, schoolAlbums, schoolStories, schoolAudios, schoolVideos, healthCardsLocal, gamesLocal, qaEntries]);

  if (!isLoggedIn) {
    return (
      <div className="login-shell">
        <div className="login-panel">
          <div className="leaf-badge" aria-label="Site logo">
            {siteLogo ? <img src={siteLogo} alt="site logo" className="logo-image" /> : <span>🇨🇦</span>}
          </div>
          <h1>{t.title}</h1>
          {sessionLocked && (
            <p className="login-lock-note">
              {lang === 'zh'
                ? '页面已自动锁定，请在 5 分钟内操作，或重新登录后再继续查看。'
                : 'This session was locked for safety. Please sign in again to continue.'}
            </p>
          )}

          {!showAuthForm && (
            <button type="button" className="primary-btn" onClick={openLogin}>
              {t.loginBase}
            </button>
          )}

          {showAuthForm && (
            <div className="auth-form">
              <label>
                <span>{lang === 'zh' ? '用户名' : 'Username'}</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={lang === 'zh' ? '输入用户名' : 'Enter username'}
                />
              </label>

              <label>
                <span>{lang === 'zh' ? '密码' : 'Password'}</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={lang === 'zh' ? '请输入密码' : 'Enter password'}
                />
              </label>

              <button type="button" className="submit-btn" onClick={login} disabled={!username || !password}>
                {lang === 'zh' ? '登录基地' : 'Login base'}
              </button>
            </div>
          )}

          <button type="button" className="lang-toggle small" onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}>
            {lang === 'zh' ? 'EN' : '中文'}
          </button>
        </div>
      </div>
    );
  }

  const handleAdminField = (field, value) => {
    setAdminDraft((current) => ({ ...current, [field]: value }));
  };

  const resetAdminDraft = (nextSection = adminSection) => {
    setAdminDraft(makeAdminDraft(nextSection));
  };

  const saveAdminDraft = async () => {
    if (!isAdmin) return;

    if (adminSection === 'homeStory') {
      const item = {
        id: adminDraft.id || undefined,
        author: adminDraft.author || '爸爸',
        type: adminDraft.type || '照片',
        title: adminDraft.title || '新记录',
        text: adminDraft.text || '',
        mediaUrl: adminDraft.mediaUrl || '',
        mediaType: adminDraft.mediaUrl && hasImageExtension(adminDraft.mediaUrl) ? 'image' : 'video',
        sortAt: adminDraft.sortAt || new Date().toISOString(),
      };
      const saved = await persistFamilySection('homeStory', item, 'save');
      if (saved) setMoments((current) => [saved, ...current.filter((entry) => entry.id !== saved.id)]);
      else setMoments((current) => [item, ...current]);
      resetAdminDraft('homeStory');
      return;
    }

    if (adminSection === 'school') {
      const type = adminDraft.type || '照片';
      const payload = {
        id: adminDraft.id || undefined,
        type,
        title: adminDraft.title || '新校园内容',
        text: adminDraft.text || '',
        image: adminDraft.image || adminDraft.mediaUrl || '',
        url: adminDraft.url || adminDraft.mediaUrl || '',
        mediaUrl: adminDraft.mediaUrl || adminDraft.url || adminDraft.image || '',
        sortAt: adminDraft.sortAt || new Date().toISOString(),
      };
      const saved = await persistFamilySection('school', payload, 'save');
      if (type === '照片') {
        const nextAlbum = { title: payload.title, text: payload.text, image: payload.image || payload.mediaUrl || heroImages[0] };
        setSchoolAlbums((current) => {
          if (adminDraft.id) return current.map((entry) => entry.title === adminDraft.title ? nextAlbum : entry);
          return [nextAlbum, ...current];
        });
      }
      if (type === '文字') {
        const nextStory = { title: payload.title, text: payload.text };
        setSchoolStories((current) => {
          if (adminDraft.id) return current.map((entry) => entry.title === adminDraft.title ? nextStory : entry);
          return [nextStory, ...current];
        });
      }
      if (type === '音频') {
        const nextAudio = { title: payload.title, url: payload.url || 'https://samplelib.com/lib/preview/mp3/sample-3s.mp3' };
        setSchoolAudios((current) => {
          if (adminDraft.id) return current.map((entry) => entry.title === adminDraft.title ? nextAudio : entry);
          return [nextAudio, ...current];
        });
      }
      if (type === '视频') {
        const nextVideo = { title: payload.title, url: payload.url || 'https://www.bilibili.com/', type: 'bilibili' };
        setSchoolVideos((current) => {
          if (adminDraft.id) return current.map((entry) => entry.title === adminDraft.title ? nextVideo : entry);
          return [nextVideo, ...current];
        });
      }
      if (saved) {
        const normalized = normalizeSchoolContent([saved]);
        if (normalized.albums.length) setSchoolAlbums((current) => [normalized.albums[0], ...current.filter((entry) => entry.title !== normalized.albums[0].title)]);
        if (normalized.stories.length) setSchoolStories((current) => [normalized.stories[0], ...current.filter((entry) => entry.title !== normalized.stories[0].title)]);
        if (normalized.audios.length) setSchoolAudios((current) => [normalized.audios[0], ...current.filter((entry) => entry.title !== normalized.audios[0].title)]);
        if (normalized.videos.length) setSchoolVideos((current) => [normalized.videos[0], ...current.filter((entry) => entry.title !== normalized.videos[0].title)]);
      }
      resetAdminDraft('school');
      return;
    }

    if (adminSection === 'health') {
      const item = {
        id: adminDraft.id || undefined,
        title: adminDraft.title || '新健康提醒',
        text: adminDraft.text || '',
        type: adminDraft.type || '文字',
        mediaUrl: adminDraft.mediaUrl || '',
        url: adminDraft.url || adminDraft.mediaUrl || '',
        icon: adminDraft.icon || 'Heart',
        sortAt: adminDraft.sortAt || new Date().toISOString(),
      };
      const saved = await persistFamilySection('health', item, 'save');
      if (saved) setHealthCardsLocal((current) => [saved, ...current.filter((entry) => entry.id !== saved.id)]);
      else setHealthCardsLocal((current) => [item, ...current]);
      resetAdminDraft('health');
      return;
    }

    if (adminSection === 'game') {
      const item = {
        id: adminDraft.id || undefined,
        title: adminDraft.title || '新游戏',
        href: adminDraft.href || './snake-game.html',
        visual: adminDraft.visual || '🎮',
        accent: adminDraft.accent || 'from-emerald-400 to-lime-300',
        sortAt: adminDraft.sortAt || new Date().toISOString(),
      };
      const saved = await persistFamilySection('game', item, 'save');
      if (saved) setGamesLocal((current) => [saved, ...current.filter((entry) => entry.id !== saved.id)]);
      else setGamesLocal((current) => [item, ...current]);
      resetAdminDraft('game');
      return;
    }

    if (adminSection === 'qna') {
      const item = {
        id: adminDraft.id || undefined,
        q: adminDraft.q || '新问题',
        a: adminDraft.a || '待回答',
        from: adminDraft.from || '爸爸',
        sortAt: adminDraft.sortAt || new Date().toISOString(),
      };
      const saved = await persistFamilySection('qna', item, 'save');
      const nextItem = normalizeQaEntry({ ...item, ...(saved || {}) });
      setQaEntries((current) => [nextItem, ...current.filter((entry) => entry.id !== nextItem.id)]);
      resetAdminDraft('qna');
      return;
    }
  };

  const deleteAdminDraft = async (target) => {
    if (!isAdmin) return;
    if (adminSection === 'homeStory') {
      await deleteSectionItem('homeStory', target);
      resetAdminDraft('homeStory');
      return;
    }
    if (adminSection === 'school') {
      await deleteSectionItem('school', target);
      resetAdminDraft('school');
      return;
    }
    if (adminSection === 'health') {
      await deleteSectionItem('health', target);
      resetAdminDraft('health');
      return;
    }
    if (adminSection === 'game') {
      await deleteSectionItem('game', target);
      resetAdminDraft('game');
      return;
    }
    if (adminSection === 'qna') {
      await deleteSectionItem('qna', target);
      resetAdminDraft('qna');
    }
  };

  const adminSectionOptions = [
    { value: 'homeStory', label: lang === 'zh' ? '首页记录' : 'Home stories' },
    { value: 'school', label: lang === 'zh' ? '认识社会' : 'Social learning' },
    { value: 'health', label: lang === 'zh' ? '健康生活' : 'Healthy living' },
    { value: 'game', label: lang === 'zh' ? '游戏乐园' : 'Game corner' },
    { value: 'qna', label: lang === 'zh' ? '父女问答' : 'Q&A' },
  ];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-group">
          <div className="brand-mark" aria-label="Site logo">
            {siteLogo ? <img src={siteLogo} alt="site logo" className="brand-logo" /> : '🇨🇦'}
          </div>
          <div>
            <small>Secret</small>
            <strong>Base</strong>
          </div>
        </div>

        <nav className="tab-bar" aria-label="Main navigation">
          {mainTabs.map(({ key, icon: Icon }) => (
            <button
              key={key}
              type="button"
              className={activeTab === key ? 'tab active' : 'tab'}
              onClick={() => setActiveTab(key)}
            >
              <Icon size={16} />
              <span>{tabLabels[key]}</span>
            </button>
          ))}
        </nav>

        <div className="top-actions">
          <span className={isAdmin ? 'role-tag admin' : isDad ? 'role-tag dad' : 'role-tag daughter'}>
            {isAdmin ? '管理员权限' : isDad ? '爸爸权限' : '女儿权限'}
          </span>
          {isAdmin && (
            <label className="ghost-btn upload-mini-btn">
              <span>{lang === 'zh' ? 'Logo' : 'Logo'}</span>
              <input type="file" accept="image/*" onChange={handleLogoUpload} hidden />
            </label>
          )}
          <button type="button" className="ghost-btn" onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}>
            {lang === 'zh' ? 'EN' : '中文'}
          </button>
          <button type="button" className="ghost-btn" onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? (lang === 'zh' ? '浅色' : 'Light') : (lang === 'zh' ? '深色' : 'Dark')}
          </button>
          <button type="button" className="ghost-btn" onClick={logout}>
            <LogOut size={14} />
            {t.logout}
          </button>
        </div>
      </header>

      <main className="content-panel">
        {activeTab === 'home' && (
          <section className="page-block home-page">
            <div className="hero-card">
              <div className="days-box">
                <div className="days-copy">
                  <span>爸爸来到加拿大</span>
                  <strong>{clock.days}</strong>
                  <small className="clock-tiny">天 {clock.hours} 小时 {clock.minutes} 分 {clock.seconds} 秒</small>
                </div>
                <div className="calendar-badge"><CalendarDays size={24} /></div>
              </div>
              <div className="status-row">
                <StatusPill title={t.dadStatus} label={dadStatus.label} tone={dadStatus.tone} />
                <StatusPill title={t.daughterStatus} label={daughterStatus.label} tone={daughterStatus.tone} />
              </div>
            </div>

            <div className="quote-panel">
              <div className="quote-icon"><Sparkles size={18} /></div>
              <div>
                <span>{t.today}</span>
                <h3>{dailyQuote[lang]}</h3>
                <p>{dailyMessage[lang]}</p>
              </div>
            </div>

            <div className="split-grid single-panel">
              <div className="mini-panel">
                <div className="mini-header">
                  <h3>{lang === 'zh' ? '愿望墙' : 'Wish wall'}</h3>
                  <button type="button" onClick={() => (isDad ? openWishEditor('yjh') : openWishEditor('爸爸'))}>+ {lang === 'zh' ? '新增愿望' : 'New wish'}</button>
                </div>
                <div className="wish-split-grid">
                  <div className="wish-column">
                    <h4>{lang === 'zh' ? '女儿向爸爸提出' : 'Daughter to dad'}</h4>
                    {sortByDateDesc(wishBoard.filter((wish) => wish.author === 'yjh')).map((wish) => (
                      <div key={wish.id} className="task-item">
                        <div>
                          <strong>{wish.title}</strong>
                          <p>{wish.detail}</p>
                          {wish.response && <small>{wish.response}</small>}
                        </div>
                        <div className="story-actions compact-actions">
                          <button type="button" className="inline-action" onClick={() => updateWishStatus(wish.id, 'accepted', '已接受，马上安排。')}>{lang === 'zh' ? '接受' : 'Accept'}</button>
                          <button type="button" className="inline-action danger" onClick={() => {
                            const reason = window.prompt(lang === 'zh' ? '拒绝理由：' : 'Reason for refusal:');
                            if (reason) updateWishStatus(wish.id, 'rejected', reason);
                          }}>{lang === 'zh' ? '拒绝' : 'Reject'}</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="wish-column">
                    <h4>{lang === 'zh' ? '爸爸向女儿提出' : 'Dad to daughter'}</h4>
                    {sortByDateDesc(wishBoard.filter((wish) => wish.author === '爸爸')).map((wish) => (
                      <div key={wish.id} className="task-item">
                        <div>
                          <strong>{wish.title}</strong>
                          <p>{wish.detail}</p>
                          {wish.response && <small>{wish.response}</small>}
                        </div>
                        <div className="story-actions compact-actions">
                          <button type="button" className="inline-action" onClick={() => updateWishStatus(wish.id, 'accepted', '已接受，马上安排。')}>{lang === 'zh' ? '接受' : 'Accept'}</button>
                          <button type="button" className="inline-action danger" onClick={() => {
                            const reason = window.prompt(lang === 'zh' ? '拒绝理由：' : 'Reason for refusal:');
                            if (reason) updateWishStatus(wish.id, 'rejected', reason);
                          }}>{lang === 'zh' ? '拒绝' : 'Reject'}</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mini-panel">
                <div className="mini-header">
                  <h3>{lang === 'zh' ? '你问我答' : 'Ask & Answer'}</h3>
                </div>
                <div className="qa-panel-list home-qa-list">
                  {qaEntries.map((entry) => (
                    <div key={`${entry.q}-${entry.from}`} className="qa-item-floating">
                      <p><strong>{entry.from || '爸爸'}：</strong> {entry.q}</p>
                      {entry.a && <p>{entry.a}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="home-two-column">
              <div className="story-column">
                <div className="section-toolbar">
                  <h3>{lang === 'zh' ? '爸爸在加拿大' : 'Dad in Canada'}</h3>
                  <div className="toolbar-actions">
                    <button type="button" className="section-editor" onClick={() => canEditSection('dad') && openEditor('homeStory', null, 'add')}>
                      + {lang === 'zh' ? '新增' : 'Add'}
                    </button>
                  </div>
                </div>
                {moments.filter((item) => item.author === '爸爸').map((item) => (
                  <article key={`${item.author}-${item.title}`} className="story-card split-story">
                    {item.mediaUrl && <MediaFrame url={item.mediaUrl} title={item.title} type={item.mediaType || 'image'} />}
                    <div className="story-content">
                      <div className="meta-row">
                        <span className="author-tag">{item.author}</span>
                        <span>{item.type}</span>
                      </div>
                      <h4>{item.title}</h4>
                      <p>{item.text}</p>
                      <div className="story-footer">
                        <span>{item.meta}</span>
                        <div className="story-actions">
                          <button type="button" className="inline-action" onClick={() => canEditSection('dad') && openEditor('homeStory', { ...item, originalTitle: item.title }, 'edit')}>{lang === 'zh' ? '编辑' : 'Edit'}</button>
                          <button type="button" className="inline-action danger" onClick={() => deleteSectionItem('homeStory', item)}>{lang === 'zh' ? '删除' : 'Delete'}</button>
                          <span><Heart size={12} /> {item.likes}</span>
                          <span><MessageCircle size={12} /> {item.comments}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="story-column">
                <div className="section-toolbar">
                  <h3>{lang === 'zh' ? '女儿的记录' : 'Daughter journal'}</h3>
                  <div className="toolbar-actions">
                    <button type="button" className="section-editor" onClick={() => canEditSection('daughter') && openEditor('homeStory', { ...buildBlankEditorItem('homeStory'), author: 'yjh' }, 'add')}>
                      + {lang === 'zh' ? '新增' : 'Add'}
                    </button>
                  </div>
                </div>
                {moments.filter((item) => item.author === 'yjh').map((item) => (
                  <article key={`${item.author}-${item.title}`} className="story-card split-story">
                    {item.mediaUrl && <MediaFrame url={item.mediaUrl} title={item.title} type={item.mediaType || 'image'} />}
                    <div className="story-content">
                      <div className="meta-row">
                        <span className="author-tag daughter-tag">{item.author}</span>
                        <span>{item.type}</span>
                      </div>
                      <h4>{item.title}</h4>
                      <p>{item.text}</p>
                      <div className="story-footer">
                        <span>{item.meta}</span>
                        <div className="story-actions">
                          <button type="button" className="inline-action" onClick={() => canEditSection('daughter') && openEditor('homeStory', { ...item, originalTitle: item.title }, 'edit')}>{lang === 'zh' ? '编辑' : 'Edit'}</button>
                          <button type="button" className="inline-action danger" onClick={() => deleteSectionItem('homeStory', item)}>{lang === 'zh' ? '删除' : 'Delete'}</button>
                          <span><Heart size={12} /> {item.likes}</span>
                          <span><MessageCircle size={12} /> {item.comments}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'school' && (
          <section className="page-block">
            <div className="school-two-column">
              <div className="story-column">
                <div className="section-toolbar">
                  <h3>{lang === 'zh' ? '新闻' : 'News'}</h3>
                  <div className="toolbar-actions">
                    {canCreateInSection('school') && (
                      <button type="button" className="section-editor" onClick={() => openEditor('school', { type: '照片', title: '', text: '', image: heroImages[0], originalTitle: '' }, 'add')}>+ {lang === 'zh' ? '新增' : 'Add'}</button>
                    )}
                  </div>
                </div>
                <div className="school-album-grid">
                  {schoolAlbums.map((item) => (
                    <article key={item.title} className="album-card">
                      <MediaFrame url={item.image} title={item.title} type="image" />
                      <div className="story-content compact-content">
                        <h4>{item.title}</h4>
                        <p>{item.text}</p>
                        <div className="story-actions compact-actions">
                          <button type="button" className="inline-action" onClick={() => openEditor('school', { ...item, type: '照片', originalTitle: item.title }, 'edit')}>{lang === 'zh' ? '编辑' : 'Edit'}</button>
                          <button type="button" className="inline-action danger" onClick={() => deleteSectionItem('schoolAlbum', item)}>{lang === 'zh' ? '删除' : 'Delete'}</button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="story-column">
                <div className="section-toolbar">
                  <h3>{lang === 'zh' ? '故事' : 'Story'}</h3>
                  <div className="toolbar-actions">
                    {canCreateInSection('school') && (
                      <button type="button" className="section-editor" onClick={() => openEditor('school', { type: '文字', title: '', text: '', originalTitle: '' }, 'add')}>+ {lang === 'zh' ? '新增' : 'Add'}</button>
                    )}
                  </div>
                </div>
                <div className="school-video-list">
                  {schoolStories.map((item) => (
                    <div key={item.title} className="video-list-item">
                      <div className="video-list-copy">
                        <strong>{item.title}</strong>
                        <small>{item.text}</small>
                      </div>
                      <div className="video-list-tools">
                        <button type="button" className="inline-action" onClick={() => openEditor('school', { ...item, type: '文字', originalTitle: item.title }, 'edit')}>{lang === 'zh' ? '编辑' : 'Edit'}</button>
                        <button type="button" className="inline-action danger" onClick={() => setSchoolStories((current) => current.filter((entry) => entry.title !== item.title))}>{lang === 'zh' ? '删' : 'Del'}</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="school-two-column" style={{ marginTop: '18px' }}>
              <div className="story-column">
                <div className="section-toolbar">
                  <h3>{lang === 'zh' ? '真知' : 'Wisdom'}</h3>
                  <div className="toolbar-actions">
                    {canCreateInSection('school') && (
                      <button type="button" className="section-editor" onClick={() => openEditor('school', { type: '音频', title: '', url: 'https://samplelib.com/lib/preview/mp3/sample-3s.mp3', originalTitle: '' }, 'add')}>+ {lang === 'zh' ? '新增' : 'Add'}</button>
                    )}
                  </div>
                </div>
                <div className="school-video-list">
                  {schoolAudios.map((item) => (
                    <div key={item.title} className="video-list-item">
                      <div className="video-list-copy">
                        <strong>{item.title}</strong>
                        <audio controls src={item.url} style={{ width: '100%', marginTop: '8px' }} />
                      </div>
                      <div className="video-list-tools">
                        <button type="button" className="inline-action" onClick={() => openEditor('school', { ...item, type: '音频', originalTitle: item.title }, 'edit')}>{lang === 'zh' ? '编辑' : 'Edit'}</button>
                        <button type="button" className="inline-action danger" onClick={() => setSchoolAudios((current) => current.filter((entry) => entry.title !== item.title))}>{lang === 'zh' ? '删' : 'Del'}</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="story-column">
                <div className="section-toolbar">
                  <h3>{lang === 'zh' ? '灼见' : 'Insight'}</h3>
                  <div className="toolbar-actions">
                    {canCreateInSection('school') && (
                      <button type="button" className="section-editor" onClick={() => openEditor('school', { type: '视频', title: '', url: 'https://www.bilibili.com/', originalTitle: '' }, 'add')}>+ {lang === 'zh' ? '新增' : 'Add'}</button>
                    )}
                  </div>
                </div>
                <div className="school-video-list">
                  {schoolVideos.map((item) => (
                    <div key={`${item.title}-${item.url}`} className="video-list-item">
                      <div className="video-list-copy">
                        <strong>{item.title}</strong>
                        <small>{item.url}</small>
                      </div>
                      <div className="video-list-tools">
                        <button type="button" className="inline-action" onClick={() => openEditor('school', { ...item, type: '视频', originalTitle: item.title }, 'edit')}>{lang === 'zh' ? '编辑' : 'Edit'}</button>
                        <button type="button" className="inline-action danger" onClick={() => deleteSectionItem('schoolVideo', item)}>{lang === 'zh' ? '删' : 'Del'}</button>
                        <button type="button" onClick={() => window.open(toEmbedUrl(item.url), '_blank', 'noopener,noreferrer')}>{lang === 'zh' ? '播放' : 'Play'}</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'health' && (
          <section className="page-block">
            <div className="section-toolbar">
              <h3>{lang === 'zh' ? '健康生活' : 'Healthy living'}</h3>
              <div className="toolbar-actions">
                {canCreateInSection('health') && (
                  <button type="button" className="section-editor" onClick={() => openEditor('health', { type: '文字', title: '', text: '', mediaUrl: '', url: '', originalTitle: '' }, 'add')}>+ {lang === 'zh' ? '新增' : 'Add'}</button>
                )}
              </div>
            </div>
            <div className="card-grid three-up compact">
              {healthCardsLocal.map(({ title, text, icon: Icon, mediaUrl, url, type }) => {
                const mediaSource = mediaUrl || url || '';
                const mediaType = type === '音频' ? 'audio' : type === '视频' ? 'video' : type === '照片' ? 'image' : (mediaSource && hasImageExtension(mediaSource) ? 'image' : 'video');
                const FeatureIcon = Icon || Heart;
                return (
                  <article key={title} className="feature-card green">
                    {mediaSource && <MediaFrame url={mediaSource} title={title} type={mediaType} />}
                    <div className="feature-content">
                      <div className="feature-icon green"><FeatureIcon size={22} /></div>
                      <h3>{title}</h3>
                      <p>{text}</p>
                    </div>
                    <div className="story-actions compact-actions">
                      <button type="button" className="inline-action" onClick={() => openEditor('health', { title, text, mediaUrl: mediaSource, url: mediaSource, originalTitle: title, type: type || '文字' }, 'edit')}>{lang === 'zh' ? '编辑' : 'Edit'}</button>
                      <button type="button" className="inline-action danger" onClick={() => deleteSectionItem('health', { title, text, icon: Icon })}>{lang === 'zh' ? '删除' : 'Delete'}</button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === 'games' && (
          <section className="page-block">
            <div className="section-toolbar">
              <h3>{lang === 'zh' ? '游戏乐园' : 'Game corner'}</h3>
              <div className="toolbar-actions">
                {canCreateInSection('game') && (
                  <button type="button" className="section-editor" onClick={() => openEditor('game', null, 'add')}>+ {lang === 'zh' ? '新增' : 'Add'}</button>
                )}
              </div>
            </div>
            <div className="game-grid">
              {sortByDateDesc(gamesLocal).map((game) => (
                <div key={game.title} className="game-card-wrapper">
                  <a href={game.href} target="_blank" rel="noreferrer" className={`game-card ${game.accent}`}>
                    <div className="game-top">
                      <span className="game-visual" aria-hidden="true">{game.visual || '🎮'}</span>
                      <ChevronRight size={18} />
                    </div>
                    <div className="game-copy">
                      <small>{lang === 'zh' ? '小游戏' : 'Mini game'}</small>
                      <h3>{game.title}</h3>
                    </div>
                  </a>
                  <div className="story-actions compact-actions">
                    <button type="button" className="inline-action" onClick={() => openEditor('game', { ...game, originalTitle: game.title }, 'edit')}>{lang === 'zh' ? '编辑' : 'Edit'}</button>
                    <button type="button" className="inline-action danger" onClick={() => deleteSectionItem('game', game)}>{lang === 'zh' ? '删除' : 'Delete'}</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {isAdmin && activeTab === 'admin' && (
          <section className="page-block admin-panel">
            <div className="section-toolbar">
              <h3>{lang === 'zh' ? '系统管理员后台' : 'System admin dashboard'}</h3>
              <div className="toolbar-actions">
                <button type="button" className="section-editor" onClick={syncFamilyContent}>
                  {lang === 'zh' ? '同步数据库' : 'Sync database'}
                </button>
              </div>
            </div>

            <div className="admin-grid">
              <div className="admin-stat-card">
                <span>{lang === 'zh' ? '首页记录' : 'Home stories'}</span>
                <strong>{moments.length}</strong>
              </div>
              <div className="admin-stat-card">
                <span>{lang === 'zh' ? '认识社会' : 'Social learning'}</span>
                <strong>{schoolAlbums.length + schoolStories.length + schoolAudios.length + schoolVideos.length}</strong>
              </div>
              <div className="admin-stat-card">
                <span>{lang === 'zh' ? '健康生活' : 'Healthy living'}</span>
                <strong>{healthCardsLocal.length}</strong>
              </div>
              <div className="admin-stat-card">
                <span>{lang === 'zh' ? '父女问答' : 'Q&A'}</span>
                <strong>{qaEntries.length}</strong>
              </div>
            </div>

            <div className="admin-panel-note">
              <p>{lang === 'zh' ? '备注：该后台用于系统和内容管理；如需更新最新数据库内容，可点击“同步数据库”。' : 'Note: This dashboard is for system and content management. Use “Sync database” to refresh the latest records.'}</p>
            </div>

            <div className="admin-manager-layout">
              <div className="admin-sidebar">
                <label className="full">
                  <span>{lang === 'zh' ? '模块' : 'Module'}</span>
                  <select value={adminSection} onChange={(event) => { setAdminSection(event.target.value); resetAdminDraft(event.target.value); }}>
                    {adminSectionOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <div className="admin-list">
                  {adminSectionList.map((item, index) => (
                    <div key={`${adminSection}-${item.id || item.title || index}`} className="admin-list-item">
                      <div>
                        <strong>{item.title || item.q || item.name || `Item ${index + 1}`}</strong>
                        <small>{item.type || item.from || (adminSection === 'game' ? '游戏' : '内容')}</small>
                      </div>
                      <div className="story-actions compact-actions">
                        <button type="button" className="inline-action" onClick={() => { setAdminDraft(makeAdminDraft(adminSection, item)); }}>{lang === 'zh' ? '编辑' : 'Edit'}</button>
                        <button type="button" className="inline-action danger" onClick={() => deleteAdminDraft(item)}>{lang === 'zh' ? '删除' : 'Delete'}</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="admin-form-card">
                <div className="section-toolbar">
                  <h3>{lang === 'zh' ? '内容表单' : 'Content form'}</h3>
                  <div className="toolbar-actions">
                    <button type="button" className="section-editor" onClick={() => resetAdminDraft(adminSection)}>{lang === 'zh' ? '新建' : 'New'}</button>
                  </div>
                </div>

                {adminSection === 'homeStory' && (
                  <div className="editor-grid">
                    <label className="full"><span>{lang === 'zh' ? '作者' : 'Author'}</span><input value={adminDraft.author || ''} onChange={(event) => handleAdminField('author', event.target.value)} /></label>
                    <label className="full"><span>{lang === 'zh' ? '类型' : 'Type'}</span><select value={adminDraft.type || '照片'} onChange={(event) => handleAdminField('type', event.target.value)}><option value="照片">照片</option><option value="文字">文字</option><option value="音频">音频</option><option value="视频">视频</option></select></label>
                    <label className="full"><span>{lang === 'zh' ? '标题' : 'Title'}</span><input value={adminDraft.title || ''} onChange={(event) => handleAdminField('title', event.target.value)} /></label>
                    <label className="full"><span>{lang === 'zh' ? '正文' : 'Text'}</span><textarea rows={4} value={adminDraft.text || ''} onChange={(event) => handleAdminField('text', event.target.value)} /></label>
                    <label className="full"><span>{lang === 'zh' ? '媒体链接' : 'Media URL'}</span><input value={adminDraft.mediaUrl || ''} onChange={(event) => handleAdminField('mediaUrl', event.target.value)} placeholder="https://..." /></label>
                  </div>
                )}

                {adminSection === 'school' && (
                  <div className="editor-grid">
                    <label className="full"><span>{lang === 'zh' ? '类型' : 'Type'}</span><select value={adminDraft.type || '照片'} onChange={(event) => handleAdminField('type', event.target.value)}><option value="照片">照片</option><option value="文字">文字</option><option value="音频">音频</option><option value="视频">视频</option></select></label>
                    <label className="full"><span>{lang === 'zh' ? '标题' : 'Title'}</span><input value={adminDraft.title || ''} onChange={(event) => handleAdminField('title', event.target.value)} /></label>
                    <label className="full"><span>{lang === 'zh' ? '正文' : 'Text'}</span><textarea rows={4} value={adminDraft.text || ''} onChange={(event) => handleAdminField('text', event.target.value)} /></label>
                    <label className="full"><span>{lang === 'zh' ? '图片/媒体链接' : 'Image/media URL'}</span><input value={adminDraft.mediaUrl || adminDraft.url || adminDraft.image || ''} onChange={(event) => { handleAdminField('mediaUrl', event.target.value); handleAdminField('url', event.target.value); handleAdminField('image', event.target.value); }} placeholder="https://..." /></label>
                  </div>
                )}

                {adminSection === 'health' && (
                  <div className="editor-grid">
                    <label className="full"><span>{lang === 'zh' ? '标题' : 'Title'}</span><input value={adminDraft.title || ''} onChange={(event) => handleAdminField('title', event.target.value)} /></label>
                    <label className="full"><span>{lang === 'zh' ? '正文' : 'Text'}</span><textarea rows={4} value={adminDraft.text || ''} onChange={(event) => handleAdminField('text', event.target.value)} /></label>
                    <label className="full"><span>{lang === 'zh' ? '类型' : 'Type'}</span><select value={adminDraft.type || '文字'} onChange={(event) => handleAdminField('type', event.target.value)}><option value="文字">文字</option><option value="照片">照片</option><option value="音频">音频</option><option value="视频">视频</option></select></label>
                    <label className="full"><span>{lang === 'zh' ? '图标' : 'Icon'}</span><select value={adminDraft.icon || 'Heart'} onChange={(event) => handleAdminField('icon', event.target.value)}>{Object.keys(healthIconMap).map((key) => <option key={key} value={key}>{key}</option>)}</select></label>
                    <label className="full"><span>{lang === 'zh' ? '媒体链接' : 'Media URL'}</span><input value={adminDraft.mediaUrl || adminDraft.url || ''} onChange={(event) => { handleAdminField('mediaUrl', event.target.value); handleAdminField('url', event.target.value); }} placeholder="https://..." /></label>
                  </div>
                )}

                {adminSection === 'game' && (
                  <div className="editor-grid">
                    <label className="full"><span>{lang === 'zh' ? '标题' : 'Title'}</span><input value={adminDraft.title || ''} onChange={(event) => handleAdminField('title', event.target.value)} /></label>
                    <label className="full"><span>{lang === 'zh' ? '链接' : 'URL'}</span><input value={adminDraft.href || ''} onChange={(event) => handleAdminField('href', event.target.value)} /></label>
                    <label className="full"><span>{lang === 'zh' ? '图标' : 'Icon'}</span><input value={adminDraft.visual || '🎮'} onChange={(event) => handleAdminField('visual', event.target.value)} /></label>
                    <label className="full"><span>{lang === 'zh' ? '样式' : 'Style'}</span><select value={adminDraft.accent || 'from-emerald-400 to-lime-300'} onChange={(event) => handleAdminField('accent', event.target.value)}><option value="from-emerald-400 to-lime-300">绿色</option><option value="from-amber-400 to-yellow-300">黄色</option><option value="from-sky-400 to-cyan-300">蓝色</option><option value="from-violet-400 to-fuchsia-300">紫色</option></select></label>
                  </div>
                )}

                {adminSection === 'qna' && (
                  <div className="editor-grid">
                    <label className="full"><span>{lang === 'zh' ? '发布者' : 'Author'}</span><select value={adminDraft.from || '爸爸'} onChange={(event) => handleAdminField('from', event.target.value)}><option value="爸爸">爸爸</option><option value="yjh">yjh</option></select></label>
                    <label className="full"><span>{lang === 'zh' ? '提问' : 'Question'}</span><textarea rows={3} value={adminDraft.q || ''} onChange={(event) => handleAdminField('q', event.target.value)} /></label>
                    <label className="full"><span>{lang === 'zh' ? '回答摘要' : 'Answer summary'}</span><textarea rows={3} value={adminDraft.a || ''} onChange={(event) => handleAdminField('a', event.target.value)} /></label>
                  </div>
                )}

                <div className="editor-actions">
                  <button type="button" className="qa-submit-btn" onClick={saveAdminDraft}>{lang === 'zh' ? '保存' : 'Save'}</button>
                  <button type="button" className="qa-cancel-btn" onClick={() => resetAdminDraft(adminSection)}>{lang === 'zh' ? '重置' : 'Reset'}</button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <div className="qa-floating">
        <button type="button" className="qa-toggle" onClick={() => setShowQaPanel((value) => !value)}>
          {showQaPanel ? (lang === 'zh' ? '关闭' : 'Close') : (lang === 'zh' ? '你问我答' : 'Q&A')}
        </button>
        {showQaPanel && (
          <div className="qa-panel">
            <div className="qa-panel-header">
              <strong>{lang === 'zh' ? '父女问答' : 'Parent & daughter Q&A'}</strong>
              <button type="button" onClick={() => setShowQaPanel(false)}>{lang === 'zh' ? '收起' : 'Hide'}</button>
            </div>
            <div className="qa-actions-row">
              <button type="button" className="qa-mini-btn" onClick={() => { setQaMode('question'); setQaDraft({ from: isDad ? '爸爸' : 'yjh', question: '', answer: '' }); setQaFormOpen(true); }}>{lang === 'zh' ? '提问' : 'Ask'}</button>
              <button type="button" className="qa-mini-btn" onClick={() => { setQaMode('answer'); setQaDraft({ from: isDad ? '爸爸' : 'yjh', question: qaEntries[0]?.q || '', answer: '' }); setQaFormOpen(true); }}>{lang === 'zh' ? '回答' : 'Answer'}</button>
            </div>
            <div className="qa-list-ordered">
              {qaEntries.map((entry, index) => (
                <div key={`${entry.q}-${index}`} className="qa-thread-item">
                  <div className="qa-thread-index">#{index + 1}</div>
                  <div className="qa-thread-body">
                    <p><strong>{entry.from || '爸爸'}：</strong> {entry.q}</p>
                    <p className="qa-summary"><span>{lang === 'zh' ? '回答摘要' : 'Answer summary'}：</span> {entry.a || (lang === 'zh' ? '待回答' : 'Waiting for answer')}</p>
                    {Array.isArray(entry.replies) && entry.replies.length > 1 && (
                      <div className="qa-replies">
                        {entry.replies.slice(-2).map((reply, replyIndex) => (
                          <div key={`${reply.author}-${replyIndex}`} className="qa-reply">
                            <span>{reply.author || '爸爸'}：</span> {reply.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {qaFormOpen && (
              <div className="qa-form-box">
                <label>
                  <span>{lang === 'zh' ? '问题' : 'Question'}</span>
                  <textarea value={qaDraft.question} onChange={(event) => setQaDraft((current) => ({ ...current, question: event.target.value }))} rows={3} />
                </label>
                {qaMode === 'answer' && (
                  <label>
                    <span>{lang === 'zh' ? '回答' : 'Answer'}</span>
                    <textarea value={qaDraft.answer} onChange={(event) => setQaDraft((current) => ({ ...current, answer: event.target.value }))} rows={3} />
                  </label>
                )}
                <div className="qa-form-actions">
                  <button type="button" className="qa-submit-btn" onClick={saveQa}>{lang === 'zh' ? '保存' : 'Save'}</button>
                  <button type="button" className="qa-cancel-btn" onClick={() => setQaFormOpen(false)}>{lang === 'zh' ? '取消' : 'Cancel'}</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {editor && (
        <div className="editor-modal-overlay">
          <div className="editor-modal" onClick={(event) => event.stopPropagation()}>
            <div className="editor-modal-header">
              <h3>{editor.mode === 'add' ? (lang === 'zh' ? '新增内容' : 'Add item') : (lang === 'zh' ? '编辑内容' : 'Edit item')}</h3>
              <button type="button" onClick={closeEditor}>×</button>
            </div>

            <div className="editor-grid">
              <label className="full">
                <span>{lang === 'zh' ? '类型' : 'Type'}</span>
                <select value={editor.item.type || (sectionTypeOptions[editor.section] || ['照片'])[0]} onChange={(event) => updateEditorField('type', event.target.value)}>
                  {(sectionTypeOptions[editor.section] || ['照片']).map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label className="full">
                <span>{lang === 'zh' ? '日期时间（排序）' : 'Date & time (sort)'}</span>
                <input type="datetime-local" value={editor.item.sortAt ? editor.item.sortAt.slice(0, 16) : new Date().toISOString().slice(0, 16)} onChange={(event) => updateEditorField('sortAt', new Date(event.target.value).toISOString())} />
              </label>
            </div>

            {['homeStory', 'school', 'health'].includes(editor.section) && (
              <div className="editor-grid">
                <label className="full"><span>{lang === 'zh' ? '标题' : 'Title'}</span><input value={editor.item.title || ''} onChange={(event) => updateEditorField('title', event.target.value)} /></label>
                <label className="full"><span>{lang === 'zh' ? '正文' : 'Text'}</span><textarea rows={5} value={editor.item.text || ''} onChange={(event) => updateEditorField('text', event.target.value)} /></label>
                <label className="full"><span>{lang === 'zh' ? '外部链接（可填多个，每行一个）' : 'External link(s), one per line'}</span><textarea rows={3} value={parseMediaLinks(editor.item.mediaUrl || editor.item.url || editor.item.mediaLinks || '').join('\n')} onChange={(event) => {
                  const nextValue = event.target.value.trim();
                  updateEditorField('mediaUrl', nextValue || '');
                  updateEditorField('mediaLinks', nextValue || '');
                  if (editor.item.type === '照片' && nextValue) {
                    updateEditorField('image', nextValue.split(/\r?\n|,/)[0].trim());
                  }
                  if ((editor.item.type === '音频' || editor.item.type === '视频') && nextValue) {
                    updateEditorField('url', nextValue.split(/\r?\n|,/)[0].trim());
                  }
                }} placeholder="https://..." /></label>
                <label className="full upload-inline upload-inline-compact">
                  <span>{lang === 'zh' ? '本地上传（可多选，图片/音频/视频通用）' : 'Upload files (multiple allowed; image/audio/video)'}</span>
                  <input type="file" accept="image/*,audio/*,video/*" multiple onChange={async (event) => {
                    const files = Array.from(event.target.files || []);
                    if (!files.length) return;
                    const uploaded = [];
                    for (const file of files) {
                      const formData = new FormData();
                      formData.append('file', file);
                      formData.append('title', file.name);
                      const response = await fetch('/api/media', { method: 'POST', body: formData });
                      const payload = await response.json();
                      if (response.ok && payload.success && payload.url) {
                        uploaded.push(payload.url);
                      }
                    }
                    const existing = parseMediaLinks(editor.item.mediaUrl || editor.item.url || editor.item.mediaLinks || '');
                    const merged = [...existing, ...uploaded].filter(Boolean);
                    const combined = merged.join('\n');
                    updateEditorField('mediaUrl', combined);
                    updateEditorField('mediaLinks', combined);
                    if (editor.item.type === '照片') {
                      updateEditorField('image', merged[0] || '');
                    }
                    if (editor.item.type === '音频' || editor.item.type === '视频') {
                      updateEditorField('url', merged[0] || '');
                    }
                    event.target.value = '';
                  }} />
                </label>
              </div>
            )}

            {editor.section === 'schoolAlbum' && (
              <div className="editor-grid">
                <label className="full"><span>{lang === 'zh' ? '标题' : 'Title'}</span><input value={editor.item.title || ''} onChange={(event) => updateEditorField('title', event.target.value)} /></label>
                <label className="full"><span>{lang === 'zh' ? '说明' : 'Text'}</span><textarea rows={4} value={editor.item.text || ''} onChange={(event) => updateEditorField('text', event.target.value)} /></label>
                <label className="full"><span>{lang === 'zh' ? '图片 / 外部链接' : 'Image / external URL'}</span><input value={editor.item.image || editor.item.url || editor.item.mediaUrl || ''} onChange={(event) => { updateEditorField('image', event.target.value); updateEditorField('url', event.target.value); updateEditorField('mediaUrl', event.target.value); }} placeholder="https://..." /></label>
                <label className="full upload-inline upload-inline-compact">
                  <span>{lang === 'zh' ? '本地上传图片到 R2' : 'Upload image to R2'}</span>
                  <input type="file" accept="image/*" onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('title', file.name);
                    const response = await fetch('/api/media', { method: 'POST', body: formData });
                    const payload = await response.json();
                    if (response.ok && payload.success && payload.url) {
                      updateEditorField('image', payload.url);
                      updateEditorField('mediaUrl', payload.url);
                    }
                    event.target.value = '';
                  }} />
                </label>
              </div>
            )}

            {editor.section === 'schoolVideo' && (
              <div className="editor-grid">
                <label className="full"><span>{lang === 'zh' ? '标题' : 'Title'}</span><input value={editor.item.title || ''} onChange={(event) => updateEditorField('title', event.target.value)} /></label>
                <label className="full"><span>{lang === 'zh' ? '链接' : 'URL'}</span><input value={editor.item.url || ''} onChange={(event) => updateEditorField('url', event.target.value)} placeholder="https://..." /></label>
                <label className="full upload-inline upload-inline-compact">
                  <span>{lang === 'zh' ? '本地上传视频到 R2' : 'Upload video to R2'}</span>
                  <input type="file" accept="video/*" onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('title', file.name);
                    const response = await fetch('/api/media', { method: 'POST', body: formData });
                    const payload = await response.json();
                    if (response.ok && payload.success && payload.url) {
                      updateEditorField('url', payload.url);
                    }
                    event.target.value = '';
                  }} />
                </label>
              </div>
            )}

            {editor.section === 'health' && (
              <div className="editor-grid">
                <label className="full"><span>{lang === 'zh' ? '标题' : 'Title'}</span><input value={editor.item.title || ''} onChange={(event) => updateEditorField('title', event.target.value)} /></label>
                <label className="full"><span>{lang === 'zh' ? '正文' : 'Text'}</span><textarea rows={4} value={editor.item.text || ''} onChange={(event) => updateEditorField('text', event.target.value)} /></label>
                <label className="full"><span>{lang === 'zh' ? '链接' : 'URL'}</span><input value={editor.item.url || editor.item.mediaUrl || ''} onChange={(event) => { updateEditorField('url', event.target.value); updateEditorField('mediaUrl', event.target.value); }} placeholder="https://..." /></label>
                <label className="full upload-inline upload-inline-compact">
                  <span>{lang === 'zh' ? '本地上传到 R2' : 'Upload to R2'}</span>
                  <input type="file" accept="image/*,audio/*,video/*" onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('title', file.name);
                    const response = await fetch('/api/media', { method: 'POST', body: formData });
                    const payload = await response.json();
                    if (response.ok && payload.success && payload.url) {
                      updateEditorField('url', payload.url);
                      updateEditorField('mediaUrl', payload.url);
                    }
                    event.target.value = '';
                  }} />
                </label>
              </div>
            )}

            {editor.section === 'game' && (
              <div className="editor-grid">
                <label><span>{lang === 'zh' ? '类型' : 'Type'}</span><select value={editor.item.type || '游戏链接'} onChange={(event) => updateEditorField('type', event.target.value)}><option value="游戏链接">游戏链接</option></select></label>
                <label className="full"><span>{lang === 'zh' ? '标题' : 'Title'}</span><input value={editor.item.title || ''} onChange={(event) => updateEditorField('title', event.target.value)} /></label>
                <label className="full"><span>{lang === 'zh' ? '图标' : 'Icon'}</span><input value={editor.item.visual || '🎮'} onChange={(event) => updateEditorField('visual', event.target.value)} /></label>
                <label className="full"><span>{lang === 'zh' ? '链接' : 'URL'}</span><input value={editor.item.href || ''} onChange={(event) => updateEditorField('href', event.target.value)} /></label>
                <label className="full"><span>{lang === 'zh' ? '样式' : 'Style'}</span><select value={editor.item.accent || 'from-emerald-400 to-lime-300'} onChange={(event) => updateEditorField('accent', event.target.value)}><option value="from-emerald-400 to-lime-300">绿色</option><option value="from-amber-400 to-yellow-300">黄色</option><option value="from-sky-400 to-cyan-300">蓝色</option><option value="from-violet-400 to-fuchsia-300">紫色</option></select></label>
              </div>
            )}

            <div className="editor-actions">
              <button type="button" className="qa-submit-btn" onClick={saveSectionEditor}>{lang === 'zh' ? '保存' : 'Save'}</button>
              <button type="button" className="qa-cancel-btn" onClick={closeEditor}>{lang === 'zh' ? '取消' : 'Cancel'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPill({ title, label, tone }) {
  return (
    <div className="status-pill">
      <span>{title}</span>
      <strong className={tone}>{label}</strong>
    </div>
  );
}

export default App;
