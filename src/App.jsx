import { useEffect, useMemo, useState } from 'react';
import {
  BookOpenText,
  CalendarDays,
  Eye,
  EyeOff,
  Gamepad2,
  Headphones,
  Home,
  Image as ImageIcon,
  LogOut,
  MessageCircle,
  Pencil,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Video,
} from 'lucide-react';

const START_DATE = new Date('2026-03-10T00:00:00-06:00');
const STORAGE_KEY = 'family-portal-content-v2';
const ROLE_KEY = 'family-portal-role-v2';
const SCHEDULE_KEY = 'family-portal-schedule-v2';
const LOGO_KEY = 'family-portal-logo-v2';
const defaultLogo = { text: '🇨🇦', url: '' };
const FAMILY_STATUS_TZ = {
  dad: 'America/Edmonton',
  daughter: 'Asia/Shanghai',
};

const defaultGameCatalog = [
  { id: 'game-snake', title: '贪吃蛇', href: './snake-game.html', accent: 'from-emerald-400 to-lime-300', visual: '🐍', visible: true, reads: 0, sortAt: new Date().toISOString() },
  { id: 'game-whack-a-mole', title: '打地鼠', href: './whack-a-mole.html', accent: 'from-amber-400 to-yellow-300', visual: '🦔', visible: true, reads: 0, sortAt: new Date().toISOString() },
  { id: 'game-go', title: '围棋对弈', href: './go-game.html', accent: 'from-slate-500 to-zinc-300', visual: '⚫', visible: true, reads: 0, sortAt: new Date().toISOString() },
  { id: 'game-racing', title: '极速躲避赛车', href: './racing-game.html', accent: 'from-red-400 to-orange-300', visual: '🏎️', visible: true, reads: 0, sortAt: new Date().toISOString() },
  { id: 'game-shooting', title: 'WASD射击', href: './shooting-game.html', accent: 'from-cyan-400 to-blue-300', visual: '🎯', visible: true, reads: 0, sortAt: new Date().toISOString() },
  { id: 'game-campus', title: '校园求生', href: './campus-survival.html', accent: 'from-violet-400 to-fuchsia-300', visual: '🏫', visible: true, reads: 0, sortAt: new Date().toISOString() },
  { id: 'game-rainbow-tetris', title: '七彩俄罗斯方块', href: './rainbow-tetris.html', accent: 'from-pink-400 to-purple-300', visual: '🌈', visible: true, reads: 0, sortAt: new Date().toISOString() },
];

const DEFAULT_CONTENT = {
  reading: [
    { id: 'r1', title: '阅读时间：从好奇到掌握', text: '今天我们一起看了加拿大的乡村故事，学习如何从好奇心出发去观察真实世界。', type: 'text', url: '', visible: true, reads: 18, sortAt: '2026-10-20T09:00:00.000Z' },
    { id: 'r2', title: '小小作业计划', text: '把作业拆成三段，先做最难的部分，然后休息一下，最终更有成就感。', type: 'story', url: '', visible: true, reads: 12, sortAt: '2026-10-18T18:30:00.000Z' },
  ],
  listening: [
    { id: 'l1', title: '加拿大森林的声音', text: '一段轻柔的森林风声，适合放松和睡前整理思绪。', type: 'audio', url: 'https://samplelib.com/lib/preview/mp3/sample-3s.mp3', visible: true, reads: 9, sortAt: '2026-10-19T20:00:00.000Z' },
  ],
  album: [
    { id: 'a1', title: '校园风景', text: '秋天的阳光和树影，像一张温暖的明信片。', type: 'image', url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80', visible: true, reads: 16, sortAt: '2026-10-17T15:20:00.000Z' },
  ],
  video: [
    { id: 'v1', title: '加拿大小镇微电影', text: '一个安静的小镇下午，和风、树叶和人群一起慢下来。', type: 'video', url: 'https://www.bilibili.com/video/BV1GJ411x7h7/?share_source=copy_web&vd_source=38d745f4d4a2c2b32a4a0e1e8d44a1f0', visible: true, reads: 11, sortAt: '2026-10-16T12:00:00.000Z' },
  ],
  game: defaultGameCatalog,
};

const defaultWishBoard = [
  { id: 'wish-1', author: 'yjh', target: '爸爸', title: '想学做加拿大小点心', detail: '我想做一个简单的甜点，记录第一次尝试的开心时刻。', status: 'pending', response: '', sortAt: '2026-10-20T08:00:00.000Z' },
  { id: 'wish-2', author: '爸爸', target: 'yjh', title: '想和你一起去湖边散步', detail: '周末我们一起去看湖边的枫叶和风景，留住一段温暖的记忆。', status: 'accepted', response: '已安排周末出发。', sortAt: '2026-10-19T17:00:00.000Z' },
];

const defaultQaEntries = [
  { id: 'qa-1', q: '为什么加拿大的树叶会变色？', a: '因为树木会减少叶绿素，橙黄色和红色更容易显现出来。', from: '爸爸', sortAt: '2026-10-20T10:15:00.000Z', replies: [{ author: '爸爸', text: '因为树木会减少叶绿素，橙黄色和红色更容易显现出来。', createdAt: '2026-10-20T10:15:00.000Z' }] },
  { id: 'qa-2', q: '为什么有时候放慢脚步也很重要？', a: '因为成长不需要赶路，慢一点才能更清晰地感受幸福。', from: 'yjh', sortAt: '2026-10-19T11:00:00.000Z', replies: [{ author: 'yjh', text: '因为成长不需要赶路，慢一点才能更清晰地感受幸福。', createdAt: '2026-10-19T11:00:00.000Z' }] },
];

const FAMILY_SCHEDULE_STATUS_OPTIONS = ['工作', '上课', '休息', '睡觉'];

const defaultFamilySchedule = {
  dad: [
    { id: 'dad-work', name: '工作', status: '工作', start: '08:00', end: '17:00' },
    { id: 'dad-rest', name: '休息', status: '休息', start: '17:00', end: '22:00' },
    { id: 'dad-sleep', name: '睡觉', status: '睡觉', start: '22:00', end: '08:00' },
  ],
  daughter: [
    { id: 'daughter-class', name: '上课', status: '上课', start: '07:00', end: '18:00' },
    { id: 'daughter-rest', name: '休息', status: '休息', start: '18:00', end: '22:00' },
    { id: 'daughter-sleep', name: '睡觉', status: '睡觉', start: '22:00', end: '07:00' },
  ],
};

const copy = {
  zh: {
    pageTitle: '爸爸来到加拿大',
    home: 'Home',
    reading: '读书',
    listening: '聆听',
    album: '相册',
    video: '视频',
    game: '游戏',
    admin: '后台',
    wishWall: 'Wish wall',
    askAnswer: 'Ask & Answer',
    addContent: '新增内容',
    filterAll: '全部',
    filterText: '文字',
    filterAudio: '音频',
    filterImage: '图片',
    filterVideo: '视频',
    hidden: '已隐藏',
    visible: '已显示',
    reads: '阅读',
    save: '保存',
    cancel: '取消',
    delete: '删除',
    edit: '编辑',
    reset: '重置',
    ask: '提问',
    answer: '回答',
    status: '状态',
    visibleLabel: '显示',
    hiddenLabel: '隐藏',
    upload: '上传',
    labelTitle: '标题',
    text: '正文',
    url: '链接',
    type: '类型',
    author: '作者',
    add: '新增',
    roleAdmin: '管理员权限',
    roleDad: '爸爸权限',
    roleDaughter: '女儿权限',
    logout: '退出',
    noData: '暂无内容',
    readingStats: '总阅读量',
  },
  en: {
    pageTitle: 'Dad in Canada',
    home: 'Home',
    reading: 'Read',
    listening: 'Listen',
    album: 'Album',
    video: 'Video',
    game: 'Game',
    admin: 'Admin',
    wishWall: 'Wish wall',
    askAnswer: 'Ask & Answer',
    addContent: 'New content',
    filterAll: 'All',
    filterText: 'Text',
    filterAudio: 'Audio',
    filterImage: 'Image',
    filterVideo: 'Video',
    hidden: 'Hidden',
    visible: 'Visible',
    reads: 'Reads',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    reset: 'Reset',
    ask: 'Ask',
    answer: 'Answer',
    status: 'Status',
    visibleLabel: 'Show',
    hiddenLabel: 'Hide',
    upload: 'Upload',
    labelTitle: 'Title',
    text: 'Text',
    url: 'URL',
    type: 'Type',
    author: 'Author',
    add: 'Add',
    roleAdmin: 'Admin',
    roleDad: 'Dad',
    roleDaughter: 'Daughter',
    logout: 'Log out',
    noData: 'No content yet',
    readingStats: 'Total reads',
  },
};

const contentTabMap = [
  { key: 'home', icon: Home },
  { key: 'reading', icon: BookOpenText },
  { key: 'listening', icon: Headphones },
  { key: 'album', icon: ImageIcon },
  { key: 'video', icon: Video },
  { key: 'game', icon: Gamepad2 },
];

const filterOptions = {
  reading: ['all', 'text', 'story', 'website'],
  listening: ['all', 'audio'],
  album: ['all', 'image'],
  video: ['all', 'video'],
  game: ['all', 'game'],
};

const composerTypeOptions = [
  { value: 'website', section: 'reading', label: { en: 'Website', zh: '网站' } },
  { value: 'text', section: 'reading', label: { en: 'Text', zh: '文字' } },
  { value: 'audio', section: 'listening', label: { en: 'Audio', zh: '音频' } },
  { value: 'image', section: 'album', label: { en: 'Image', zh: '图片' } },
  { value: 'video', section: 'video', label: { en: 'Video', zh: '视频' } },
  { value: 'game', section: 'game', label: { en: 'Game', zh: '游戏' } },
];

function getSectionForType(type) {
  const entry = composerTypeOptions.find((option) => option.value === type);
  return entry ? entry.section : 'reading';
}

function getCanadaElapsed() {
  const now = new Date();
  const canadaNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Edmonton' }));
  const diff = Math.max(0, canadaNow.getTime() - START_DATE.getTime());
  const total = Math.floor(diff / 1000);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

function sortByDateDesc(items = []) {
  return [...items].sort((a, b) => new Date(b.sortAt || b.createdAt || 0).getTime() - new Date(a.sortAt || a.createdAt || 0).getTime());
}

function normalizeCollectionWithIds(section, items = []) {
  return (Array.isArray(items) ? items : []).map((item, index) => ({
    ...item,
    id: item?.id || `${section}-${index}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  }));
}

function normalizeRole(role) {
  const value = String(role || '').trim().toLowerCase();
  if (value === 'father' || value === 'dad') return 'dad';
  if (value === 'game_admin') return 'daughter';
  if (value === 'system_admin') return 'admin';
  if (value === 'daughter' || value === 'admin' || value === 'member') return value;
  return 'member';
}

function getLocalFallbackRole(username, password) {
  const user = String(username || '').trim().toLowerCase();
  const pass = String(password || '').trim();

  if ((user === 'yqcw@qq.com' && pass === '123456') || (user === 'admin' && pass === '123456')) return 'admin';
  if ((user === 'yjh' && pass === '150113') || (user === 'daughter' && pass === '150113')) return 'daughter';
  if ((user === 'dad' && pass === '150113') || (user === 'father' && pass === '150113')) return 'dad';
  return null;
}

function getPresenceLabelFromRule(rule) {
  const status = String(rule?.status || rule?.name || '休息');
  if (status === '睡觉') return '睡觉中';
  if (status === '工作') return '工作中';
  if (status === '上课') return '上课中';
  return '休息中';
}

function getMemberPresence(member, schedule = defaultFamilySchedule) {
  const timeZone = FAMILY_STATUS_TZ[member] || 'UTC';
  const now = new Date();
  const localNow = new Date(now.toLocaleString('en-US', { timeZone }));
  const minutes = localNow.getHours() * 60 + localNow.getMinutes();
  const rules = schedule[member] || defaultFamilySchedule[member] || [];

  for (const rule of rules) {
    const startMinutes = parseInt(rule.start.split(':')[0], 10) * 60 + parseInt(rule.start.split(':')[1], 10);
    const endMinutes = parseInt(rule.end.split(':')[0], 10) * 60 + parseInt(rule.end.split(':')[1], 10);
    const crossesMidnight = endMinutes < startMinutes;

    if (crossesMidnight) {
      if (minutes >= startMinutes || minutes < endMinutes) {
        return { label: getPresenceLabelFromRule(rule) };
      }
      continue;
    }

    if (minutes >= startMinutes && minutes < endMinutes) {
      return { label: getPresenceLabelFromRule(rule) };
    }
  }

  return { label: '休息中' };
}

async function uploadLocalMediaToR2(file, title = 'family-upload', section = 'general') {
  if (!file) return null;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title || file.name || 'family-upload');
  formData.append('section', section || 'general');

  const response = await fetch('/api/media', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error || 'Upload failed');
  }

  return response.json();
}

function getDefaultItemBySection(section) {
  const base = { id: '', title: '', text: '', type: 'text', url: '', visible: true, reads: 0, sortAt: new Date().toISOString() };
  if (section === 'reading') return { ...base, type: 'text' };
  if (section === 'listening') return { ...base, type: 'audio', url: 'https://samplelib.com/lib/preview/mp3/sample-3s.mp3' };
  if (section === 'album') return { ...base, type: 'image', url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80' };
  if (section === 'video') return { ...base, type: 'video', url: 'https://www.bilibili.com/' };
  if (section === 'game') return { id: '', title: '', href: './snake-game.html', visual: '🎮', accent: 'from-emerald-400 to-lime-300', visible: true, reads: 0, sortAt: new Date().toISOString() };
  return base;
}

function isWebsiteUrl(value) {
  if (!value) return false;
  const url = String(value).trim();
  return /^https?:\/\//i.test(url) || /^\/\//.test(url);
}

function normalizeVideoEmbedUrl(rawUrl) {
  if (!rawUrl) return '';
  const url = String(rawUrl).trim();

  if (/\.(mp4|webm|mov|m4v|ogg|avi|m3u8)(\?.*)?$/i.test(url)) {
    return url;
  }

  if (/bilibili\.com\/video\//i.test(url) || /b23\.tv\//i.test(url)) {
    const match = url.match(/BV[a-zA-Z0-9]+/i) || url.match(/[a-zA-Z0-9]+/);
    if (match) {
      return `https://player.bilibili.com/player.html?bvid=${encodeURIComponent(match[0])}&autoplay=0&danmaku=0`;
    }
    return url;
  }

  if (/douyin\.com\//i.test(url) || /iesdouyin\.com\//i.test(url)) {
    return url;
  }

  if (/xhs|xiaohongshu/i.test(url)) {
    return url;
  }

  if (/youtube\.com|youtu\.be/i.test(url)) {
    const videoId = url.match(/(?:v=|be\/)([A-Za-z0-9_-]{11})/i)?.[1];
    if (videoId) return `https://www.youtube.com/embed/${videoId}`;
  }

  if (/vimeo\.com/i.test(url)) {
    const videoId = url.match(/vimeo\.com\/(\d+)/i)?.[1];
    if (videoId) return `https://player.vimeo.com/video/${videoId}`;
  }

  return url;
}

function MediaPreview({ item, compact = false, onOpen = null }) {
  const url = item.url || item.mediaUrl || '';
  if (!url) return null;

  const isImage = item.type === 'image' || /\.(png|jpe?g|gif|webp|svg|bmp|avif)(\?.*)?$/i.test(url) || /unsplash|images?\.|cdn/i.test(url);
  const isAudio = item.type === 'audio' || /\.(mp3|wav|ogg|m4a|aac|flac)(\?.*)?$/i.test(url) || /audio/i.test(url);
  const isVideo = item.type === 'video' || /\.(mp4|webm|mov|m4v|ogg|avi|m3u8)(\?.*)?$/i.test(url) || /video|bilibili|youtube|douyin|xiaohongshu|xhs/i.test(url);
  const isWebsite = item.type === 'website' || (item.type !== 'video' && isWebsiteUrl(url));

  if (isImage) {
    return <button type="button" className={compact ? 'media-preview compact image-preview' : 'media-preview image-preview'} onClick={() => onOpen && onOpen()}><img src={url} alt={item.title} /></button>;
  }
  if (isAudio) {
    return <div className={compact ? 'media-preview compact' : 'media-preview'}><audio controls preload="none" src={url} /></div>;
  }
  if (isVideo) {
    const embedUrl = normalizeVideoEmbedUrl(url);
    const isExternalShareLink = /bilibili|youtube|youtu\.be|vimeo|douyin|xiaohongshu|xhs/i.test(url) && !/\.(mp4|webm|mov|m4v|ogg|avi|m3u8)(\?.*)?$/i.test(url);
    return <div className={compact ? 'media-preview compact video-preview' : 'media-preview video-preview'}>
      {isExternalShareLink ? (
        <iframe src={embedUrl} title={item.title || 'video'} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      ) : (
        <video controls preload="metadata" playsInline src={embedUrl || url} />
      )}
    </div>;
  }
  if (isWebsite) {
    return <div className={compact ? 'media-preview compact embedded-page' : 'media-preview embedded-page'}><iframe src={url} title={item.title || 'website'} sandbox="allow-scripts allow-same-origin allow-popups allow-forms" loading="lazy" /></div>;
  }

  return <div className="media-preview unsupported"><span>{item.title || 'Media'}</span></div>;
}

function App() {
  const [lang, setLang] = useState('en');
  const [theme, setTheme] = useState('light');
  const [role, setRole] = useState(() => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(ROLE_KEY) || null;
  });
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(window.localStorage.getItem(ROLE_KEY));
  });
  const [loginForm, setLoginForm] = useState({ username: 'yqcw@qq.com', password: '123456' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [clock, setClock] = useState(getCanadaElapsed());
  const [wishBoard, setWishBoard] = useState(defaultWishBoard);
  const [qaEntries, setQaEntries] = useState(defaultQaEntries);
  const [showQaPanel, setShowQaPanel] = useState(true);
  const [qaDraft, setQaDraft] = useState({ from: '爸爸', question: '', answer: '' });
  const [replyDrafts, setReplyDrafts] = useState({});
  const [composerOpen, setComposerOpen] = useState(false);
  const [wishFormOpen, setWishFormOpen] = useState(false);
  const [wishDraft, setWishDraft] = useState({ title: '', detail: '', response: '' });
  const [lightboxMedia, setLightboxMedia] = useState(null);
  const [composer, setComposer] = useState({ section: 'reading', title: '', text: '', url: '', type: 'text', visible: true, href: './snake-game.html', visual: '🎮', accent: 'from-emerald-400 to-lime-300' });
  const [contentFilters, setContentFilters] = useState({ reading: 'all', listening: 'all', album: 'all', video: 'all', game: 'all' });
  const [contentSections, setContentSections] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_CONTENT;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) return DEFAULT_CONTENT;
      const parsed = JSON.parse(stored);
      const merged = { ...DEFAULT_CONTENT, ...parsed };
      return Object.fromEntries(
        Object.entries(merged).map(([section, list]) => [section, normalizeCollectionWithIds(section, list)])
      );
    } catch (error) {
      console.warn('Unable to parse stored content', error);
      return DEFAULT_CONTENT;
    }
  });
  const [adminSection, setAdminSection] = useState('reading');
  const [adminDraft, setAdminDraft] = useState(getDefaultItemBySection('reading'));
  const [familySchedule, setFamilySchedule] = useState(() => {
    if (typeof window === 'undefined') return defaultFamilySchedule;
    try {
      const stored = window.localStorage.getItem(SCHEDULE_KEY);
      return stored ? JSON.parse(stored) : defaultFamilySchedule;
    } catch (error) {
      return defaultFamilySchedule;
    }
  });
  const [siteLogo, setSiteLogo] = useState(() => {
    if (typeof window === 'undefined') return defaultLogo;
    try {
      const stored = window.localStorage.getItem(LOGO_KEY);
      return stored ? { ...defaultLogo, ...JSON.parse(stored) } : defaultLogo;
    } catch (error) {
      return defaultLogo;
    }
  });

  useEffect(() => {
    const timer = window.setInterval(() => setClock(getCanadaElapsed()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(contentSections));
    }
  }, [contentSections]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SCHEDULE_KEY, JSON.stringify(familySchedule));
    }
  }, [familySchedule]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOGO_KEY, JSON.stringify(siteLogo));
    }
  }, [siteLogo]);

  useEffect(() => {
    if (typeof window !== 'undefined' && role) {
      window.localStorage.setItem(ROLE_KEY, role);
    }
  }, [role]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.style.colorScheme = theme;
    }
  }, [theme]);

  const t = copy[lang];
  const isAdmin = role === 'admin';
  const canManageWishAndQa = role === 'dad' || role === 'admin';
  const dadStatus = getMemberPresence('dad', familySchedule);
  const daughterStatus = getMemberPresence('daughter', familySchedule);

  const handleLogin = async (event = null) => {
    if (event) {
      event.preventDefault();
    }

    const username = (loginForm.username || '').trim();
    const password = (loginForm.password || '').trim();
    if (!username || !password) {
      setLoginError('请输入用户名和密码。');
      return;
    }

    setLoginLoading(true);
    setLoginError('');

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', username, password }),
      });

      let payload = null;
      try {
        payload = await response.json();
      } catch (error) {
        payload = null;
      }

      if (!response.ok || !payload?.success) {
        const fallbackRole = getLocalFallbackRole(username, password);
        if (fallbackRole) {
          setRole(fallbackRole);
          setIsLoggedIn(true);
          setActiveTab('home');
          window.localStorage.setItem(ROLE_KEY, fallbackRole);
          return;
        }
        throw new Error(payload?.error || '账号或密码错误。');
      }

      const nextRole = normalizeRole(payload.user?.role || 'member');
      setRole(nextRole);
      setIsLoggedIn(true);
      setActiveTab('home');
      window.localStorage.setItem(ROLE_KEY, nextRole);
    } catch (error) {
      const fallbackRole = getLocalFallbackRole(username, password);
      if (fallbackRole) {
        setRole(fallbackRole);
        setIsLoggedIn(true);
        setActiveTab('home');
        window.localStorage.setItem(ROLE_KEY, fallbackRole);
        setLoginError('');
        return;
      }
      setLoginError(error.message || '登录失败，请确认账号密码。');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setRole(null);
    setIsLoggedIn(false);
    setActiveTab('home');
    setShowQaPanel(false);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(ROLE_KEY);
    }
  };

  const getVisibleItems = (section) => {
    const items = sortByDateDesc((contentSections[section] || []).filter((item) => item.visible !== false));
    const filter = contentFilters[section] || 'all';
    if (filter === 'all') return items;
    return items.filter((item) => {
      if (section === 'reading') {
        if (filter === 'website') return item.type === 'website';
        return item.type === filter || (item.type === 'text' && filter === 'text') || (item.type === 'story' && filter === 'story');
      }
      if (section === 'listening') return item.type === 'audio';
      if (section === 'album') return item.type === 'image';
      if (section === 'video') return item.type === 'video';
      if (section === 'game') return true;
      return true;
    });
  };

  const getTotalReads = (section) => (contentSections[section] || []).reduce((sum, item) => sum + Number(item.reads || 0), 0);

  const handleSaveComposer = () => {
    const nextId = composer.id || `${composer.section}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const base = {
      id: nextId,
      title: composer.title.trim(),
      text: composer.text.trim(),
      visible: composer.visible !== false,
      reads: Number(composer.reads || 0),
      sortAt: composer.sortAt || new Date().toISOString(),
    };

    if (composer.section === 'game') {
      const gameItem = {
        ...base,
        id: composer.id || nextId,
        href: composer.href || './snake-game.html',
        visual: composer.visual || '🎮',
        accent: composer.accent || 'from-emerald-400 to-lime-300',
      };
      setContentSections((current) => ({
        ...current,
        game: sortByDateDesc([
          gameItem,
          ...normalizeCollectionWithIds('game', current.game || []).filter((item) => item.id !== gameItem.id),
        ]),
      }));
    } else {
      const mediaItem = {
        ...base,
        id: composer.id || nextId,
        type: composer.type || 'text',
        url: composer.url || '',
      };
      setContentSections((current) => ({
        ...current,
        [composer.section]: sortByDateDesc([
          mediaItem,
          ...normalizeCollectionWithIds(composer.section, current[composer.section] || []).filter((item) => item.id !== mediaItem.id),
        ]),
      }));
    }
    setComposerOpen(false);
    setComposer({ section: composer.section, title: '', text: '', url: '', type: 'text', visible: true, href: './snake-game.html', visual: '🎮', accent: 'from-emerald-400 to-lime-300' });
  };

  const openComposer = (section = 'reading', item = null) => {
    if (item) {
      setComposer({ ...item, section });
    } else {
      setComposer({ ...getDefaultItemBySection(section), section, title: '', text: '', url: '', visible: true });
    }
    setComposerOpen(true);
  };

  const openComposerFromTop = () => {
    setComposer({ ...getDefaultItemBySection('reading'), section: 'reading', title: '', text: '', url: '', type: 'text', visible: true });
    setComposerOpen(true);
  };

  const handleDeleteItem = (section, item) => {
    setContentSections((current) => ({
      ...current,
      [section]: normalizeCollectionWithIds(section, (current[section] || [])).filter((entry) => String(entry.id ?? '') !== String(item?.id ?? '')),
    }));
  };

  const handleWishAction = (type, detail = null) => {
    if (!canManageWishAndQa) return;
    if (type === 'add') {
      const title = (wishDraft.title || '').trim();
      const detailText = (wishDraft.detail || '').trim();
      if (!title || !detailText) return;
      const nextWish = {
        id: `wish-${Date.now()}`,
        author: '爸爸',
        target: 'yjh',
        title,
        detail: detailText,
        status: 'pending',
        response: wishDraft.response || '',
        sortAt: new Date().toISOString(),
      };
      setWishBoard((current) => [nextWish, ...current]);
      setWishDraft({ title: '', detail: '', response: '' });
      setWishFormOpen(false);
      return;
    }
    if (type === 'update') {
      setWishBoard((current) => current.map((item) => item.id === detail.id ? { ...item, ...detail } : item));
      return;
    }
    if (type === 'delete') {
      setWishBoard((current) => current.filter((item) => item.id !== detail.id));
    }
  };

  const handleQaAction = (type, detail = null) => {
    if (!canManageWishAndQa) return;
    if (type === 'add') {
      const input = (detail?.question || '').trim();
      if (!input) return;
      const answerText = (detail?.answer || '').trim();
      const nextItem = {
        id: `qa-${Date.now()}`,
        q: input,
        a: answerText || '待回答',
        from: detail?.from || '爸爸',
        sortAt: new Date().toISOString(),
        replies: answerText ? [{ author: detail?.from || '爸爸', text: answerText, createdAt: new Date().toISOString() }] : [],
      };
      setQaEntries((current) => [nextItem, ...current]);
      return;
    }
    if (type === 'reply') {
      const text = (detail?.text || '').trim();
      if (!text) return;
      const author = detail?.author || (role === 'dad' ? '爸爸' : '女儿');
      setQaEntries((current) => current.map((item) => item.id === detail.id ? {
        ...item,
        a: text,
        replies: [...(item.replies || []), { author, text, createdAt: new Date().toISOString() }],
      } : item));
      return;
    }
    if (type === 'update') {
      setQaEntries((current) => current.map((item) => item.id === detail.id ? { ...item, ...detail } : item));
      return;
    }
    if (type === 'delete') {
      setQaEntries((current) => current.filter((item) => item.id !== detail.id));
    }
  };

  const handleToggleVisibility = (section, item) => {
    setContentSections((current) => ({
      ...current,
      [section]: (current[section] || []).map((entry) => entry.id === item.id ? { ...entry, visible: !entry.visible } : entry),
    }));
  };

  const incrementReads = (section, item) => {
    setContentSections((current) => ({
      ...current,
      [section]: (current[section] || []).map((entry) => entry.id === item.id ? { ...entry, reads: Number(entry.reads || 0) + 1 } : entry),
    }));
  };

  const handleSaveAdmin = () => {
    if (!adminDraft) return;
    const payload = {
      ...adminDraft,
      id: adminDraft.id || `${adminSection}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    };
    setContentSections((current) => ({
      ...current,
      [adminSection]: sortByDateDesc([
        payload,
        ...normalizeCollectionWithIds(adminSection, current[adminSection] || []).filter((item) => String(item.id ?? '') !== String(payload.id ?? '')),
      ]),
    }));
    setAdminDraft(getDefaultItemBySection(adminSection));
  };

  const updateScheduleForMember = (member, targetId, field, value) => {
    setFamilySchedule((current) => ({
      ...current,
      [member]: (current[member] || []).map((rule) => {
        if (rule.id !== targetId) return rule;
        if (field === 'status') {
          return { ...rule, status: value, name: value };
        }
        return { ...rule, [field]: value };
      }),
    }));
  };

  const addScheduleRuleForMember = (member) => {
    const defaultName = '休息';
    const nextRule = {
      id: `${member}-${Date.now()}`,
      name: defaultName,
      status: defaultName,
      start: '08:00',
      end: '17:00',
    };
    setFamilySchedule((current) => ({
      ...current,
      [member]: [...(current[member] || []), nextRule],
    }));
  };

  const deleteScheduleRuleForMember = (member, ruleId) => {
    setFamilySchedule((current) => ({
      ...current,
      [member]: (current[member] || []).filter((rule) => rule.id !== ruleId),
    }));
  };

  const handleDeleteAdmin = (item) => {
    setContentSections((current) => ({
      ...current,
      [adminSection]: normalizeCollectionWithIds(adminSection, current[adminSection] || []).filter((entry) => String(entry.id ?? '') !== String(item?.id ?? '')),
    }));
  };

  const adminItems = useMemo(() => contentSections[adminSection] || [], [contentSections, adminSection]);
  const adminStats = useMemo(() => ({
    total: adminItems.reduce((sum, item) => sum + Number(item.reads || 0), 0),
    visible: adminItems.filter((item) => item.visible !== false).length,
    hidden: adminItems.filter((item) => item.visible === false).length,
  }), [adminItems]);

  const renderContentList = (section, label) => {
    const items = getVisibleItems(section);
    const filters = filterOptions[section] || ['all'];
    const featuredAlbumItems = section === 'album' && items.length > 4 ? (() => {
      const itemsCopy = [...items];
      for (let index = itemsCopy.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [itemsCopy[index], itemsCopy[randomIndex]] = [itemsCopy[randomIndex], itemsCopy[index]];
      }
      return itemsCopy.slice(0, 4);
    })() : section === 'album' ? items.slice(0, 4) : [];
    const restAlbumItems = section === 'album' ? items.filter((item) => !featuredAlbumItems.some((featuredItem) => featuredItem.id === item.id)) : [];
    return (
      <section className="page-block">
        <div className="section-toolbar">
          <h3>{label}</h3>
          <div className="toolbar-actions">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                className={contentFilters[section] === filter ? 'filter-btn active' : 'filter-btn'}
                onClick={() => setContentFilters((current) => ({ ...current, [section]: filter }))}
              >
                {filter === 'all' ? t.filterAll : filter === 'text' ? t.filterText : filter === 'story' ? '故事' : filter === 'audio' ? t.filterAudio : filter === 'image' ? t.filterImage : filter === 'video' ? t.filterVideo : filter === 'website' ? '网站' : filter}
              </button>
            ))}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="empty-state">{t.noData}</div>
        ) : (
          <>
            {section === 'album' && featuredAlbumItems.length > 0 && (
              <div className="album-featured-wrap">
                <div className="album-featured-header">
                  <h4>精选相册</h4>
                </div>
                <div className="album-featured-row">
                  {featuredAlbumItems.map((item, index) => (
                    <button key={item.id || `${item.title}-${index}`} type="button" className="album-featured-item" onClick={() => setLightboxMedia({ items: items, index: items.findIndex((entry) => entry.id === item.id) })}>
                      <img src={item.url} alt={item.title} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={section === 'album' ? 'content-grid album-grid' : 'content-grid'}>
              {(section === 'album' ? restAlbumItems : items).map((item) => (
                <article key={item.id || `${section}-${item.title}`} className={section === 'album' ? 'content-card album-card' : section === 'video' ? 'content-card video-card' : item.type === 'website' ? 'content-card website-card' : 'content-card'}>
                  <MediaPreview item={item} onOpen={() => item.type === 'image' && setLightboxMedia({ items: items, index: items.findIndex((entry) => entry.id === item.id) })} />
                  <div className="content-card-body">
                    <div className="card-topline">
                      <span className="pill-type">{item.type || 'text'}</span>
                    </div>
                    <h4>{item.title}</h4>
                    {item.text && <p>{item.text}</p>}
                    <div className="content-card-actions">
                      {section !== 'game' ? (
                        <button type="button" className="inline-action" onClick={() => { incrementReads(section, item); if (item.type === 'website' && item.url) { window.open(item.url, '_blank', 'noopener,noreferrer'); } else if (item.url) { window.open(item.url, '_blank', 'noopener,noreferrer'); } }}>{lang === 'zh' ? '阅读' : 'Open'}</button>
                      ) : (
                        <a href={item.href} target="_blank" rel="noreferrer" className="inline-action-link">{lang === 'zh' ? '进入游戏' : 'Play'}</a>
                      )}
                      {isAdmin && (
                        <>
                          <button type="button" className="inline-action" onClick={() => openComposer(section, item)}><Pencil size={14} /></button>
                          <button type="button" className="inline-action danger" onClick={() => handleDeleteItem(section, item)}><Trash2 size={14} /></button>
                          <button type="button" className="inline-action" onClick={() => handleToggleVisibility(section, item)}>
                            {item.visible !== false ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    );
  };

  if (!isLoggedIn) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-topbar">
            <button type="button" className="ghost-btn auth-lang-btn" onClick={() => setLang((prev) => (prev === 'en' ? 'zh' : 'en'))}>{lang === 'en' ? '中文' : 'English'}</button>
          </div>

          <div className="auth-brand">
            {siteLogo.url ? <img className="brand-mark-image" src={siteLogo.url} alt="site logo" /> : <div className="brand-mark">{siteLogo.text || '🇨🇦'}</div>}
            <div>
              <small>Secret</small>
              <strong>{lang === 'en' ? 'Secret Base' : '秘密基地'}</strong>
            </div>
          </div>

          <form className="auth-form" onSubmit={handleLogin}>
            <label className="auth-field">
              <span>{lang === 'en' ? 'Username' : '用户名'}</span>
              <input
                type="text"
                value={loginForm.username}
                onChange={(event) => setLoginForm((current) => ({ ...current, username: event.target.value }))}
                placeholder={lang === 'en' ? 'yqcw@qq.com / yjh' : 'yqcw@qq.com / yjh'}
              />
            </label>

            <label className="auth-field">
              <span>{lang === 'en' ? 'Password' : '密码'}</span>
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                placeholder={lang === 'en' ? 'Enter password' : '请输入密码'}
              />
            </label>

            {loginError && <div className="auth-error">{loginError}</div>}

            <button type="submit" className="auth-role-btn primary" disabled={loginLoading}>
              {loginLoading ? (lang === 'en' ? 'Logging in...' : '登录中...') : (lang === 'en' ? 'Enter Base' : '登陆基地')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="header-banner">
        <div className="family-status-row banner-status-row">
          <span className="status-pill">爸爸 {dadStatus.label}</span>
          <span className="status-pill">女儿 {daughterStatus.label}</span>
        </div>

        <div className="header-main-row">
          <div className="banner-tip">不定期更新哦，看完下次再来！</div>

          <div className="banner-title-group">
            <div className="banner-pill"><CalendarDays size={16} /> 来到加拿大</div>
            <div className="banner-counter">
              <strong>{clock.days}</strong>
              <span>{lang === 'zh' ? '天' : 'days'}</span>
              <small>{clock.hours}:{String(clock.minutes).padStart(2, '0')}:{String(clock.seconds).padStart(2, '0')}</small>
            </div>
          </div>
        </div>
      </div>

      <header className="topbar">
        <div className="brand-group">
          {siteLogo.url ? <img className="brand-mark-image" src={siteLogo.url} alt="site logo" /> : <div className="brand-mark">{siteLogo.text || '🇨🇦'}</div>}
          <div className="brand-copy">
            <small>Secret</small>
            <strong>Base</strong>
          </div>
        </div>

        <nav className="tab-bar" aria-label="Main navigation">
          {contentTabMap.map(({ key, icon: Icon }) => (
            isAdmin || key !== 'admin' ? (
              <button key={key} type="button" className={activeTab === key ? 'tab active' : 'tab'} onClick={() => setActiveTab(key)}>
                <Icon size={16} />
                <span>{key === 'home' ? t.home : key === 'reading' ? t.reading : key === 'listening' ? t.listening : key === 'album' ? t.album : key === 'video' ? t.video : key === 'game' ? t.game : t.admin}</span>
              </button>
            ) : null
          ))}
          {isAdmin && (
            <button type="button" className={activeTab === 'admin' ? 'tab active' : 'tab'} onClick={() => setActiveTab('admin')}>
              <ShieldCheck size={16} />
              <span>{t.admin}</span>
            </button>
          )}
        </nav>

        <div className="top-actions">
          <button type="button" className="ghost-btn" onClick={() => setLang((prev) => prev === 'zh' ? 'en' : 'zh')}>{lang === 'zh' ? 'EN' : '中文'}</button>
          <button type="button" className="ghost-btn" onClick={() => setTheme((prev) => prev === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? 'Light' : 'Dark'}</button>
          <button type="button" className="ghost-btn" onClick={openComposerFromTop}>
            <Plus size={14} /> {t.addContent}
          </button>
          <button type="button" className="ghost-btn" onClick={handleLogout}><LogOut size={14} /> {t.logout}</button>
        </div>
      </header>

      <main className="content-panel">
        {activeTab === 'home' && (
          <section className="page-block home-page">
            <div className="home-grid">
              <div className="mini-panel">
                <div className="mini-header">
                  <h3>{t.wishWall}</h3>
                  {canManageWishAndQa && (
                    <button type="button" onClick={() => setWishFormOpen(true)}>+ {t.add}</button>
                  )}
                </div>
                <div className="wish-list">
                  {wishBoard.map((wish) => (
                    <div key={wish.id} className="wish-item">
                      <div>
                        <strong>{wish.title}</strong>
                        <p>{wish.detail}</p>
                        {wish.response && <small>{wish.response}</small>}
                      </div>
                      {canManageWishAndQa && (
                        <div className="story-actions compact-actions">
                          <button type="button" className="inline-action" onClick={() => handleWishAction('update', { id: wish.id, status: 'accepted', response: '已接受，马上安排。' })}>Accept</button>
                          <button type="button" className="inline-action danger" onClick={() => handleWishAction('update', { id: wish.id, status: 'rejected', response: '暂时调整计划。' })}>Reject</button>
                          <button type="button" className="inline-action" onClick={() => handleWishAction('delete', { id: wish.id })}>Delete</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mini-panel">
                <div className="mini-header">
                  <h3>{t.askAnswer}</h3>
                </div>
                <div className="qa-list home-qa-list">
                  {qaEntries.map((entry) => (
                    <div key={entry.id || entry.q} className="qa-item-floating">
                      <p><strong>{entry.from || '爸爸'}：</strong> {entry.q}</p>
                      {entry.a && <p>{entry.a}</p>}
                      {(entry.replies || []).map((reply, idx) => (
                        <div key={`${entry.id}-reply-${idx}`} className="qa-reply-line">
                          <strong>{reply.author || '爸爸'}：</strong> {reply.text}
                        </div>
                      ))}
                      {canManageWishAndQa && (
                        <div className="qa-reply-box">
                          <textarea
                            rows={2}
                            value={replyDrafts[entry.id] || ''}
                            onChange={(event) => setReplyDrafts((current) => ({ ...current, [entry.id]: event.target.value }))}
                            placeholder="继续补充讨论..."
                          />
                          <button type="button" className="inline-action" onClick={() => {
                            const text = (replyDrafts[entry.id] || '').trim();
                            if (!text) return;
                            handleQaAction('reply', { id: entry.id, text, author: role === 'dad' || role === 'admin' ? '爸爸' : '女儿' });
                            setReplyDrafts((current) => ({ ...current, [entry.id]: '' }));
                          }}>继续讨论</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'reading' && renderContentList('reading', t.reading)}
        {activeTab === 'listening' && renderContentList('listening', t.listening)}
        {activeTab === 'album' && renderContentList('album', t.album)}
        {activeTab === 'video' && renderContentList('video', t.video)}
        {activeTab === 'game' && renderContentList('game', t.game)}

        {isAdmin && activeTab === 'admin' && (
          <section className="page-block admin-panel">
            <div className="section-toolbar">
              <h3>管理员后台</h3>
              <div className="toolbar-actions">
                <span className="summary-badge">总阅读量: {Object.values(contentSections).flat().reduce((sum, item) => sum + Number(item.reads || 0), 0)}</span>
              </div>
            </div>

            <div className="admin-overview-grid">
              {['reading', 'listening', 'album', 'video', 'game'].map((key) => (
                <button key={key} type="button" className={adminSection === key ? 'admin-overview-card active' : 'admin-overview-card'} onClick={() => { setAdminSection(key); setAdminDraft(getDefaultItemBySection(key)); }}>
                  <span>{key === 'reading' ? t.reading : key === 'listening' ? t.listening : key === 'album' ? t.album : key === 'video' ? t.video : t.game}</span>
                  <strong>{(contentSections[key] || []).length}</strong>
                  <small>{getTotalReads(key)} 阅读</small>
                </button>
              ))}
            </div>

            <div className="admin-manager-layout">
              <aside className="admin-sidebar">
                <div className="brand-config-box">
                  <h4>站点 Logo</h4>
                  <label className="full"><span>图片链接</span><input value={siteLogo.url} onChange={(event) => setSiteLogo((current) => ({ ...current, url: event.target.value }))} /></label>
                  <label className="full"><span>文字 / Emoji</span><input value={siteLogo.text} onChange={(event) => setSiteLogo((current) => ({ ...current, text: event.target.value }))} /></label>
                  <div className="preview-row">
                    {siteLogo.url ? <img className="brand-mark-image" src={siteLogo.url} alt="logo preview" /> : <div className="brand-mark">{siteLogo.text || '🇨🇦'}</div>}
                  </div>
                </div>

                <div className="admin-sidebar-header">
                  <h4>批量管理</h4>
                  <select value={adminSection} onChange={(event) => {
                    setAdminSection(event.target.value);
                    setAdminDraft(getDefaultItemBySection(event.target.value));
                  }}>
                    <option value="reading">{t.reading}</option>
                    <option value="listening">{t.listening}</option>
                    <option value="album">{t.album}</option>
                    <option value="video">{t.video}</option>
                    <option value="game">{t.game}</option>
                  </select>
                </div>

                <div className="admin-list">
                  {adminItems.map((item) => (
                    <div key={item.id || item.title} className="admin-list-item">
                      <div>
                        <strong>{item.title || 'Untitled'}</strong>
                        <small>{item.type || 'item'} · {item.visible === false ? t.hidden : t.visible}</small>
                      </div>
                      <div className="story-actions compact-actions">
                        <button type="button" className="inline-action" onClick={() => setAdminDraft({ ...item })}>{t.edit}</button>
                        <button type="button" className="inline-action danger" onClick={() => handleDeleteAdmin(item)}>{t.delete}</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="schedule-box">
                  <h4>作息设置</h4>
                  {['dad', 'daughter'].map((member) => (
                    <div key={member} className="schedule-member-block">
                      <div className="schedule-member-header">
                        <strong>{member === 'dad' ? '爸爸' : '女儿'}</strong>
                        <span>{member === 'dad' ? '卡尔加里' : '成都'}</span>
                        <button type="button" className="schedule-add-btn" onClick={() => addScheduleRuleForMember(member)}>+ 新增</button>
                      </div>
                      <div className="schedule-rules">
                        {(familySchedule[member] || []).map((rule) => (
                          <div key={rule.id} className="schedule-rule-row">
                            <input value={rule.name} onChange={(event) => updateScheduleForMember(member, rule.id, 'name', event.target.value)} />
                            <input type="time" value={rule.start} onChange={(event) => updateScheduleForMember(member, rule.id, 'start', event.target.value)} />
                            <input type="time" value={rule.end} onChange={(event) => updateScheduleForMember(member, rule.id, 'end', event.target.value)} />
                            <select value={rule.status || rule.name || '休息'} onChange={(event) => updateScheduleForMember(member, rule.id, 'status', event.target.value)}>
                              {FAMILY_SCHEDULE_STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                            <button type="button" className="schedule-delete-btn" onClick={() => deleteScheduleRuleForMember(member, rule.id)}>删除</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </aside>

              <div className="admin-form-card">
                <div className="section-toolbar">
                  <h3>{adminSection === 'game' ? '游戏板块管理' : t.addContent}</h3>
                  <div className="toolbar-actions">
                    <button type="button" className="section-editor" onClick={() => setAdminDraft(getDefaultItemBySection(adminSection))}>{t.reset}</button>
                  </div>
                </div>

                <div className="editor-grid">
                  {adminSection === 'game' ? (
                    <>
                      <label className="full"><span>{t.labelTitle}</span><input value={adminDraft.title || ''} onChange={(event) => setAdminDraft((current) => ({ ...current, title: event.target.value }))} /></label>
                      <label className="full"><span>{t.url}</span><input value={adminDraft.href || ''} onChange={(event) => setAdminDraft((current) => ({ ...current, href: event.target.value }))} /></label>
                      <label className="full"><span>Emoji</span><input value={adminDraft.visual || '🎮'} onChange={(event) => setAdminDraft((current) => ({ ...current, visual: event.target.value }))} /></label>
                    </>
                  ) : (
                    <>
                      <label className="full"><span>{t.labelTitle}</span><input value={adminDraft.title || ''} onChange={(event) => setAdminDraft((current) => ({ ...current, title: event.target.value }))} /></label>
                      <label className="full"><span>{t.type}</span>
                        <select value={adminDraft.type || 'text'} onChange={(event) => setAdminDraft((current) => ({ ...current, type: event.target.value }))}>
                          {adminSection === 'reading' && <><option value="text">文字</option><option value="story">故事</option><option value="website">网站</option></>}
                          {adminSection === 'listening' && <option value="audio">音频</option>}
                          {adminSection === 'album' && <option value="image">图片</option>}
                          {adminSection === 'video' && <option value="video">视频</option>}
                        </select>
                      </label>
                      <label className="full"><span>{t.text}</span><textarea rows={4} value={adminDraft.text || ''} onChange={(event) => setAdminDraft((current) => ({ ...current, text: event.target.value }))} /></label>
                      <label className="full"><span>{t.url}</span><input value={adminDraft.url || ''} onChange={(event) => setAdminDraft((current) => ({ ...current, url: event.target.value }))} /></label>
                    </>
                  )}

                  <label className="full"><span>{t.status}</span>
                    <select value={adminDraft.visible === false ? 'hidden' : 'visible'} onChange={(event) => setAdminDraft((current) => ({ ...current, visible: event.target.value === 'visible' }))}>
                      <option value="visible">{t.visibleLabel}</option>
                      <option value="hidden">{t.hiddenLabel}</option>
                    </select>
                  </label>

                  <label className="full"><span>{t.reads}</span><input type="number" value={adminDraft.reads || 0} onChange={(event) => setAdminDraft((current) => ({ ...current, reads: Number(event.target.value || 0) }))} /></label>

                  {adminSection !== 'game' && (
                    <label className="full upload-label"><span>{t.upload}</span>
                      <input type="file" accept={adminSection === 'video' ? 'video/*' : adminSection === 'listening' ? 'audio/*' : 'image/*'} onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        try {
                          const result = await uploadLocalMediaToR2(file, adminDraft.title || file.name, adminSection);
                          setAdminDraft((current) => ({
                            ...current,
                            url: result?.url || current.url,
                            type: result?.type || current.type,
                            title: current.title || result?.title || file.name,
                          }));
                        } catch (error) {
                          console.error('R2 upload failed', error);
                          window.alert(error.message || 'Upload failed');
                        }
                      }} />
                    </label>
                  )}
                </div>

                <div className="editor-actions">
                  <button type="button" className="qa-submit-btn" onClick={handleSaveAdmin}>{t.save}</button>
                  <button type="button" className="qa-cancel-btn" onClick={() => setAdminDraft(getDefaultItemBySection(adminSection))}>{t.cancel}</button>
                </div>

                <div className="admin-summary-box">
                  <strong>{adminStats.visible}</strong> {t.visible} · <strong>{adminStats.hidden}</strong> {t.hidden} · <strong>{adminStats.total}</strong> {t.reads}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <div className="qa-floating">
        <button type="button" className="qa-toggle" onClick={() => setShowQaPanel((current) => !current)}>{showQaPanel ? 'Hide' : t.askAnswer}</button>
        {showQaPanel && (
          <div className="qa-panel">
            <div className="qa-panel-header">
              <strong>{t.askAnswer}</strong>
              <button type="button" onClick={() => setShowQaPanel(false)}>x</button>
            </div>
            <div className="qa-actions-row">
              {canManageWishAndQa && (
                <>
                  <button type="button" className="qa-mini-btn" onClick={() => setQaDraft({ from: '爸爸', question: '', answer: '' })}>{t.ask}</button>
                  <button type="button" className="qa-mini-btn" onClick={() => setQaDraft((current) => ({ ...current, question: qaEntries[0]?.q || '', answer: '' }))}>{t.answer}</button>
                </>
              )}
            </div>
            <div className="qa-list-ordered">
              {qaEntries.map((entry, index) => (
                <div key={entry.id || `${entry.q}-${index}`} className="qa-thread-item">
                  <div className="qa-thread-index">#{index + 1}</div>
                  <div className="qa-thread-body">
                    <p><strong>{entry.from || '爸爸'}：</strong> {entry.q}</p>
                    <p className="qa-summary">{entry.a || '待回答'}</p>
                    {(entry.replies || []).map((reply, replyIdx) => (
                      <div key={`${entry.id}-reply-${replyIdx}`} className="qa-reply-line">
                        <strong>{reply.author || '爸爸'}：</strong> {reply.text}
                      </div>
                    ))}
                    {canManageWishAndQa && (
                      <button type="button" className="inline-action danger qa-inline-delete" onClick={() => handleQaAction('delete', { id: entry.id })}>Delete</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {canManageWishAndQa && (
            <div className="qa-form-box">
              <label>
                <span>{lang === 'zh' ? '提问' : 'Question'}</span>
                <textarea rows={3} value={qaDraft.question} onChange={(event) => setQaDraft((current) => ({ ...current, question: event.target.value }))} />
              </label>
              <label>
                <span>{lang === 'zh' ? '回答' : 'Answer'}</span>
                <textarea rows={3} value={qaDraft.answer} onChange={(event) => setQaDraft((current) => ({ ...current, answer: event.target.value }))} />
              </label>
              <div className="qa-form-actions">
                <button type="button" className="qa-submit-btn" onClick={() => {
                  handleQaAction('add', { question: qaDraft.question, answer: qaDraft.answer, from: qaDraft.from || '爸爸' });
                  setQaDraft({ from: '爸爸', question: '', answer: '' });
                }}>{t.save}</button>
                <button type="button" className="qa-cancel-btn" onClick={() => setShowQaPanel(false)}>{t.cancel}</button>
              </div>
            </div>
            )}
          </div>
        )}
      </div>

      {lightboxMedia && (
        <div className="lightbox-overlay" onClick={() => setLightboxMedia(null)}>
          <div className="lightbox-dialog" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="lightbox-close" onClick={() => setLightboxMedia(null)}>×</button>
            {lightboxMedia.items && lightboxMedia.items.length > 1 && (
              <>
                <button type="button" className="lightbox-nav prev" onClick={() => setLightboxMedia((current) => {
                  if (!current?.items?.length) return current;
                  const nextIndex = (current.index - 1 + current.items.length) % current.items.length;
                  return { ...current, index: nextIndex };
                })}>←</button>
                <button type="button" className="lightbox-nav next" onClick={() => setLightboxMedia((current) => {
                  if (!current?.items?.length) return current;
                  const nextIndex = (current.index + 1) % current.items.length;
                  return { ...current, index: nextIndex };
                })}>→</button>
              </>
            )}
            <img src={lightboxMedia.items?.[lightboxMedia.index]?.url || lightboxMedia.url} alt={lightboxMedia.items?.[lightboxMedia.index]?.title || lightboxMedia.title || 'Preview'} />
            <div className="lightbox-meta">
              <strong>{lightboxMedia.items?.[lightboxMedia.index]?.title || lightboxMedia.title}</strong>
              {(lightboxMedia.items?.[lightboxMedia.index]?.text || lightboxMedia.text) && <p>{lightboxMedia.items?.[lightboxMedia.index]?.text || lightboxMedia.text}</p>}
            </div>
          </div>
        </div>
      )}

      {wishFormOpen && (
        <div className="editor-modal-overlay" onClick={() => setWishFormOpen(false)}>
          <div className="editor-modal" onClick={(event) => event.stopPropagation()}>
            <div className="editor-modal-header">
              <h3>新增愿望</h3>
              <button type="button" onClick={() => setWishFormOpen(false)}>×</button>
            </div>
            <div className="editor-grid">
              <label className="full"><span>标题</span><input value={wishDraft.title} onChange={(event) => setWishDraft((current) => ({ ...current, title: event.target.value }))} /></label>
              <label className="full"><span>愿望内容</span><textarea rows={4} value={wishDraft.detail} onChange={(event) => setWishDraft((current) => ({ ...current, detail: event.target.value }))} /></label>
              <label className="full"><span>回复</span><textarea rows={2} value={wishDraft.response} onChange={(event) => setWishDraft((current) => ({ ...current, response: event.target.value }))} /></label>
            </div>
            <div className="editor-actions">
              <button type="button" className="qa-submit-btn" onClick={() => handleWishAction('add')}>保存</button>
              <button type="button" className="qa-cancel-btn" onClick={() => setWishFormOpen(false)}>取消</button>
            </div>
          </div>
        </div>
      )}

      {composerOpen && (
        <div className="editor-modal-overlay" onClick={() => setComposerOpen(false)}>
          <div className="editor-modal" onClick={(event) => event.stopPropagation()}>
            <div className="editor-modal-header">
              <h3>{composer.id ? t.edit : t.addContent}</h3>
              <button type="button" onClick={() => setComposerOpen(false)}>×</button>
            </div>
            <div className="editor-grid">
              {composer.section === 'game' ? (
                <>
                  <label className="full"><span>{t.labelTitle}</span><input value={composer.title || ''} onChange={(event) => setComposer((current) => ({ ...current, title: event.target.value }))} /></label>
                  <label className="full"><span>{t.url}</span><input value={composer.href || ''} onChange={(event) => setComposer((current) => ({ ...current, href: event.target.value }))} /></label>
                  <label className="full"><span>Emoji</span><input value={composer.visual || '🎮'} onChange={(event) => setComposer((current) => ({ ...current, visual: event.target.value }))} /></label>
                </>
              ) : (
                <>
                  <label className="full"><span>{t.labelTitle}</span><input value={composer.title || ''} onChange={(event) => setComposer((current) => ({ ...current, title: event.target.value }))} /></label>
                  <label className="full"><span>{t.type}</span>
                    <select value={composer.section === 'game' ? 'game' : composer.type || 'text'} onChange={(event) => {
                      const nextType = event.target.value;
                      const nextSection = getSectionForType(nextType);
                      setComposer((current) => ({
                        ...getDefaultItemBySection(nextSection),
                        ...current,
                        section: nextSection,
                        type: nextType,
                        title: current.title || '',
                        text: current.text || '',
                        url: current.url || '',
                        visible: current.visible !== false,
                      }));
                    }}>
                      {composerTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label[lang]}</option>
                      ))}
                    </select>
                  </label>
                  <label className="full"><span>{t.text}</span><textarea rows={4} value={composer.text || ''} onChange={(event) => setComposer((current) => ({ ...current, text: event.target.value }))} /></label>
                  <label className="full"><span>{t.url}</span><input value={composer.url || ''} onChange={(event) => setComposer((current) => ({ ...current, url: event.target.value }))} /></label>
                  <label className="full upload-label"><span>{t.upload}</span>
                    <input type="file" accept={composer.section === 'video' ? 'video/*' : composer.section === 'listening' ? 'audio/*' : 'image/*'} onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      try {
                        const result = await uploadLocalMediaToR2(file, composer.title || file.name, composer.section);
                        setComposer((current) => ({
                          ...current,
                          url: result?.url || current.url,
                          type: result?.type || current.type,
                          title: current.title || result?.title || file.name,
                        }));
                      } catch (error) {
                        console.error('R2 upload failed', error);
                        window.alert(error.message || 'Upload failed');
                      }
                    }} />
                  </label>
                </>
              )}
              <label className="full"><span>{t.status}</span>
                <select value={composer.visible === false ? 'hidden' : 'visible'} onChange={(event) => setComposer((current) => ({ ...current, visible: event.target.value === 'visible' }))}>
                  <option value="visible">{t.visibleLabel}</option>
                  <option value="hidden">{t.hiddenLabel}</option>
                </select>
              </label>
            </div>
            <div className="editor-actions">
              <button type="button" className="qa-submit-btn" onClick={handleSaveComposer}>{t.save}</button>
              <button type="button" className="qa-cancel-btn" onClick={() => setComposerOpen(false)}>{t.cancel}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
