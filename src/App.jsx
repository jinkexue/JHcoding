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
const FAMILY_STATUS_TZ = {
  dad: 'America/Edmonton',
  daughter: 'Asia/Shanghai',
};
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
  game: [
    { id: 'g1', title: '贪吃蛇', href: './snake-game.html', accent: 'from-emerald-400 to-lime-300', visual: '🐍', visible: true, reads: 26, sortAt: '2026-10-15T10:00:00.000Z' },
    { id: 'g2', title: '打地鼠', href: './whack-a-mole.html', accent: 'from-amber-400 to-yellow-300', visual: '🦔', visible: true, reads: 19, sortAt: '2026-10-14T13:00:00.000Z' },
  ],
};

const defaultWishBoard = [
  { id: 'wish-1', author: 'yjh', target: '爸爸', title: '想学做加拿大小点心', detail: '我想做一个简单的甜点，记录第一次尝试的开心时刻。', status: 'pending', response: '', sortAt: '2026-10-20T08:00:00.000Z' },
  { id: 'wish-2', author: '爸爸', target: 'yjh', title: '想和你一起去湖边散步', detail: '周末我们一起去看湖边的枫叶和风景，留住一段温暖的记忆。', status: 'accepted', response: '已安排周末出发。', sortAt: '2026-10-19T17:00:00.000Z' },
];

const defaultQaEntries = [
  { id: 'qa-1', q: '为什么加拿大的树叶会变色？', a: '因为树木会减少叶绿素，橙黄色和红色更容易显现出来。', from: '爸爸', sortAt: '2026-10-20T10:15:00.000Z', replies: [{ author: '爸爸', text: '因为树木会减少叶绿素，橙黄色和红色更容易显现出来。', createdAt: '2026-10-20T10:15:00.000Z' }] },
  { id: 'qa-2', q: '为什么有时候放慢脚步也很重要？', a: '因为成长不需要赶路，慢一点才能更清晰地感受幸福。', from: 'yjh', sortAt: '2026-10-19T11:00:00.000Z', replies: [{ author: 'yjh', text: '因为成长不需要赶路，慢一点才能更清晰地感受幸福。', createdAt: '2026-10-19T11:00:00.000Z' }] },
];

const defaultFamilySchedule = {
  dad: [
    { id: 'dad-work', name: '工作', start: '08:00', end: '17:00' },
    { id: 'dad-rest', name: '休息', start: '17:00', end: '22:00' },
    { id: 'dad-sleep', name: '睡觉', start: '22:00', end: '08:00' },
  ],
  daughter: [
    { id: 'daughter-class', name: '上课', start: '07:00', end: '18:00' },
    { id: 'daughter-rest', name: '休息', start: '18:00', end: '22:00' },
    { id: 'daughter-sleep', name: '睡觉', start: '22:00', end: '07:00' },
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
  reading: ['all', 'text', 'story'],
  listening: ['all', 'audio'],
  album: ['all', 'image'],
  video: ['all', 'video'],
  game: ['all', 'game'],
};

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
        return { label: rule.name === '睡觉' ? '睡觉中' : rule.name === '工作' ? '工作中' : rule.name === '上课' ? '上课中' : '休息中' };
      }
      continue;
    }

    if (minutes >= startMinutes && minutes < endMinutes) {
      return { label: rule.name === '睡觉' ? '睡觉中' : rule.name === '工作' ? '工作中' : rule.name === '上课' ? '上课中' : '休息中' };
    }
  }

  return { label: '休息中' };
}

async function uploadLocalMediaToR2(file, title = 'family-upload') {
  if (!file) return null;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title || file.name || 'family-upload');

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

function MediaPreview({ item, compact = false }) {
  const url = item.url || item.mediaUrl || '';
  if (!url) return null;

  const isImage = item.type === 'image' || /\.(png|jpe?g|gif|webp|svg|bmp|avif)(\?.*)?$/i.test(url) || /unsplash|images?\.|cdn/i.test(url);
  const isAudio = item.type === 'audio' || /\.(mp3|wav|ogg|m4a|aac|flac)(\?.*)?$/i.test(url) || /audio/i.test(url);
  const isVideo = item.type === 'video' || /\.(mp4|webm|mov|m4v|ogg|avi|m3u8)(\?.*)?$/i.test(url) || /video|bilibili|youtube/i.test(url);

  if (isImage) {
    return <div className={compact ? 'media-preview compact' : 'media-preview'}><img src={url} alt={item.title} /></div>;
  }
  if (isAudio) {
    return <div className={compact ? 'media-preview compact' : 'media-preview'}><audio controls preload="none" src={url} /></div>;
  }
  if (isVideo) {
    return <div className={compact ? 'media-preview compact' : 'media-preview'}>
      <video controls preload="metadata" playsInline src={url} />
    </div>;
  }

  return <div className="media-preview unsupported"><span>{item.title || 'Media'}</span></div>;
}

function App() {
  const [lang, setLang] = useState('zh');
  const [theme, setTheme] = useState('light');
  const [role, setRole] = useState(() => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(ROLE_KEY) || null;
  });
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(window.localStorage.getItem(ROLE_KEY));
  });
  const [activeTab, setActiveTab] = useState('home');
  const [clock, setClock] = useState(getCanadaElapsed());
  const [wishBoard, setWishBoard] = useState(defaultWishBoard);
  const [qaEntries, setQaEntries] = useState(defaultQaEntries);
  const [showQaPanel, setShowQaPanel] = useState(true);
  const [qaDraft, setQaDraft] = useState({ from: '爸爸', question: '', answer: '' });
  const [composerOpen, setComposerOpen] = useState(false);
  const [composer, setComposer] = useState({ section: 'reading', title: '', text: '', url: '', type: 'text', visible: true, href: './snake-game.html', visual: '🎮', accent: 'from-emerald-400 to-lime-300' });
  const [contentFilters, setContentFilters] = useState({ reading: 'all', listening: 'all', album: 'all', video: 'all', game: 'all' });
  const [contentSections, setContentSections] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_CONTENT;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) return DEFAULT_CONTENT;
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_CONTENT, ...parsed };
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

  const handleLogin = () => {
    const nextRole = typeof window !== 'undefined' ? (window.localStorage.getItem(ROLE_KEY) || 'admin') : 'admin';
    setRole(nextRole);
    setIsLoggedIn(true);
    setActiveTab('home');
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
      if (section === 'reading') return item.type === filter || item.type === 'text' && filter === 'text' || item.type === 'story' && filter === 'story';
      if (section === 'listening') return item.type === 'audio';
      if (section === 'album') return item.type === 'image';
      if (section === 'video') return item.type === 'video';
      if (section === 'game') return true;
      return true;
    });
  };

  const getTotalReads = (section) => (contentSections[section] || []).reduce((sum, item) => sum + Number(item.reads || 0), 0);

  const handleSaveComposer = () => {
    const base = {
      id: composer.id || `${composer.section}-${Date.now()}`,
      title: composer.title.trim(),
      text: composer.text.trim(),
      visible: composer.visible !== false,
      reads: Number(composer.reads || 0),
      sortAt: composer.sortAt || new Date().toISOString(),
    };

    if (composer.section === 'game') {
      const gameItem = {
        ...base,
        id: composer.id || `game-${Date.now()}`,
        href: composer.href || './snake-game.html',
        visual: composer.visual || '🎮',
        accent: composer.accent || 'from-emerald-400 to-lime-300',
      };
      setContentSections((current) => ({ ...current, game: sortByDateDesc([gameItem, ...(current.game || [])]) }));
    } else {
      const mediaItem = {
        ...base,
        type: composer.type || 'text',
        url: composer.url || '',
      };
      setContentSections((current) => ({
        ...current,
        [composer.section]: sortByDateDesc([mediaItem, ...(current[composer.section] || [])]),
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

  const handleDeleteItem = (section, item) => {
    setContentSections((current) => ({
      ...current,
      [section]: (current[section] || []).filter((entry) => entry.id !== item.id),
    }));
  };

  const handleWishAction = (type, detail = null) => {
    if (!canManageWishAndQa) return;
    if (type === 'add') {
      setWishBoard((current) => [
        { id: `wish-${Date.now()}`, author: '爸爸', target: 'yjh', title: '新愿望', detail: '新愿望内容', status: 'pending', response: '', sortAt: new Date().toISOString() },
        ...current,
      ]);
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
      const nextItem = {
        id: `qa-${Date.now()}`,
        q: input,
        a: (detail?.answer || '').trim() || '待回答',
        from: detail?.from || '爸爸',
        sortAt: new Date().toISOString(),
        replies: [{ author: detail?.from || '爸爸', text: (detail?.answer || '').trim() || '待回答', createdAt: new Date().toISOString() }],
      };
      setQaEntries((current) => [nextItem, ...current]);
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
    const payload = { ...adminDraft, id: adminDraft.id || `${adminSection}-${Date.now()}` };
    setContentSections((current) => ({
      ...current,
      [adminSection]: sortByDateDesc([
        payload,
        ...(current[adminSection] || []).filter((item) => item.id !== payload.id),
      ]),
    }));
    setAdminDraft(getDefaultItemBySection(adminSection));
  };

  const updateScheduleForMember = (member, targetId, field, value) => {
    setFamilySchedule((current) => ({
      ...current,
      [member]: (current[member] || []).map((rule) => rule.id === targetId ? { ...rule, [field]: value } : rule),
    }));
  };

  const addScheduleRuleForMember = (member) => {
    const defaultName = member === 'dad' ? '休息' : '休息';
    const nextRule = {
      id: `${member}-${Date.now()}`,
      name: defaultName,
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
      [adminSection]: (current[adminSection] || []).filter((entry) => entry.id !== item.id),
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
                {filter === 'all' ? t.filterAll : filter === 'text' ? t.filterText : filter === 'story' ? '故事' : filter === 'audio' ? t.filterAudio : filter === 'image' ? t.filterImage : filter === 'video' ? t.filterVideo : filter}
              </button>
            ))}
            {isAdmin && (
              <button type="button" className="section-editor" onClick={() => openComposer(section)}>
                + {t.addContent}
              </button>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="empty-state">{t.noData}</div>
        ) : (
          <div className="content-grid">
            {items.map((item) => (
              <article key={item.id || `${section}-${item.title}`} className="content-card">
                <MediaPreview item={item} />
                <div className="content-card-body">
                  <div className="card-topline">
                    <span className="pill-type">{item.type || 'text'}</span>
                  </div>
                  <h4>{item.title}</h4>
                  {item.text && <p>{item.text}</p>}
                  <div className="content-card-actions">
                    {section !== 'game' ? (
                      <button type="button" className="inline-action" onClick={() => { incrementReads(section, item); window.open(item.url, '_blank', 'noopener,noreferrer'); }}>{lang === 'zh' ? '阅读' : 'Open'}</button>
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
        )}
      </section>
    );
  };

  if (!isLoggedIn) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-brand">
            <div className="brand-mark">🇨🇦</div>
            <div>
              <small>Secret</small>
              <strong>我们的秘密基地</strong>
            </div>
          </div>
          <button type="button" className="auth-role-btn primary" onClick={handleLogin}>登陆基地</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="header-banner">
        <div className="banner-title-group">
          <div className="banner-pill"><CalendarDays size={16} /> {copy[lang].pageTitle}</div>
          <div className="family-status-row banner-status-row">
            <span className="status-pill">爸爸 {dadStatus.label}</span>
            <span className="status-pill">女儿 {daughterStatus.label}</span>
          </div>
        </div>
        <div className="banner-counter">
          <strong>{clock.days}</strong>
          <span>{lang === 'zh' ? '天' : 'days'}</span>
          <small>{clock.hours}:{String(clock.minutes).padStart(2, '0')}:{String(clock.seconds).padStart(2, '0')}</small>
        </div>
      </div>

      <header className="topbar">
        <div className="brand-group">
          <div className="brand-mark">🇨🇦</div>
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
          <button type="button" className="ghost-btn" onClick={() => setComposerOpen(true)}>
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
                    <button type="button" onClick={() => handleWishAction('add')}>+ {t.add}</button>
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
                          {adminSection === 'reading' && <><option value="text">文字</option><option value="story">故事</option></>}
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
                          const result = await uploadLocalMediaToR2(file, adminDraft.title || file.name);
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
                    <select value={composer.type || 'text'} onChange={(event) => setComposer((current) => ({ ...current, type: event.target.value }))}>
                      {composer.section === 'reading' && <><option value="text">文字</option><option value="story">故事</option></>}
                      {composer.section === 'listening' && <option value="audio">音频</option>}
                      {composer.section === 'album' && <option value="image">图片</option>}
                      {composer.section === 'video' && <option value="video">视频</option>}
                    </select>
                  </label>
                  <label className="full"><span>{t.text}</span><textarea rows={4} value={composer.text || ''} onChange={(event) => setComposer((current) => ({ ...current, text: event.target.value }))} /></label>
                  <label className="full"><span>{t.url}</span><input value={composer.url || ''} onChange={(event) => setComposer((current) => ({ ...current, url: event.target.value }))} /></label>
                  <label className="full upload-label"><span>{t.upload}</span>
                    <input type="file" accept={composer.section === 'video' ? 'video/*' : composer.section === 'listening' ? 'audio/*' : 'image/*'} onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      try {
                        const result = await uploadLocalMediaToR2(file, composer.title || file.name);
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
