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
  Sparkles,
  Stethoscope,
  SunMedium,
  Video,
} from 'lucide-react';

const START_DATE = new Date('2026-03-10T00:00:00');
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

const copy = {
  zh: {
    title: '我们的秘密基地',
    subtitle: '温暖的父女时光，藏在每一张照片和每一次对话里。',
    dadLogin: '爸爸登录',
    daughterLogin: '女儿登录',
    admin: '管理员',
    email: 'yqcw@qq.com',
    password: '123456',
    home: '首页',
    school: '校园生活',
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
    dadLogin: 'Dad Login',
    daughterLogin: 'Daughter Login',
    admin: 'Admin',
    email: 'yqcw@qq.com',
    password: '123456',
    home: 'Home',
    school: 'School Life',
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

function toEmbedUrl(rawUrl) {
  if (!rawUrl) return '';
  const url = rawUrl.trim();
  if (!url) return '';

  if (/bilibili\.com|b23\.tv/i.test(url)) {
    const match = url.match(/BV[0-9A-Za-z]+|av\d+/i);
    const bvid = match ? match[0] : '';
    if (bvid) {
      return `https://player.bilibili.com/player.html?bvid=${bvid}`;
    }
    return url;
  }

  if (/youtube\.com|youtu\.be/i.test(url)) {
    const match = url.match(/(?:v=|\/)([A-Za-z0-9_-]{11})/i);
    const videoId = match ? match[1] : '';
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }

  return url;
}

function hasImageExtension(url) {
  if (!url) return false;
  return /\.(png|jpe?g|gif|webp|svg|bmp|avif)(\?.*)?$/i.test(url) || /images?\.|unsplash|pexels|cdn/gi.test(url);
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

  const embedUrl = toEmbedUrl(url);
  if (embedUrl) {
    return (
      <div className="media-frame video-frame">
        <iframe
          src={embedUrl}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
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
  { q: '为什么加拿大的树叶会在秋天变红？', a: '因为很多树会把叶绿素变少，而橙黄红色的色素显现出来，像在给大地换衣服。', from: '爸爸' },
  { q: '为什么小朋友也可以有自己的节奏？', a: '因为每个人的成长方式不同，慢一点不等于落后，反而更容易开心地成长。', from: 'yjh' },
];

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
  { title: '贪吃蛇', href: './snake-game.html', accent: 'from-emerald-400 to-lime-300' },
  { title: '打地鼠', href: './whack-a-mole.html', accent: 'from-amber-400 to-yellow-300' },
  { title: '赛车', href: './racing-game.html', accent: 'from-sky-400 to-cyan-300' },
  { title: '射击小游戏', href: './shooting-game.html', accent: 'from-violet-400 to-fuchsia-300' },
];

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
  const [lang, setLang] = useState('zh');
  const [role, setRole] = useState('dad');
  const [activeTab, setActiveTab] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [moments, setMoments] = useState(initialMoments);
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [clock, setClock] = useState(() => {
    const diff = Date.now() - START_DATE.getTime();
    const totalSeconds = Math.max(0, Math.floor(diff / 1000));
    return {
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
    };
  });
  const [showQaPanel, setShowQaPanel] = useState(true);
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
  const [gamesLocal, setGamesLocal] = useState(games);
  const [qaEntries, setQaEntries] = useState(qnaPairs);

  const t = copy[lang];
  const dadStatus = getCurrentStatus('dad');
  const daughterStatus = getCurrentStatus('daughter');
  const isDad = role === 'dad';

  useEffect(() => {
    const timer = window.setInterval(() => {
      const diff = Date.now() - START_DATE.getTime();
      const totalSeconds = Math.max(0, Math.floor(diff / 1000));
      setClock({
        days: Math.floor(totalSeconds / 86400),
        hours: Math.floor((totalSeconds % 86400) / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const canEditSection = (section) => {
    if (!isLoggedIn) return false;
    if (section === 'dad') return isDad;
    if (section === 'daughter') return !isDad;
    return true;
  };

  const openLogin = (selectedRole) => {
    setRole(selectedRole);
    setShowAuthForm(true);
    setUsername('');
    setPassword('');
  };

  const login = () => {
    const credentials = {
      dad: { username: 'yqcw@qq.com', password: '123456' },
      daughter: { username: 'yjh', password: '150113' },
    };

    const selected = credentials[role];
    if (!selected || username !== selected.username || password !== selected.password) {
      alert(lang === 'zh' ? '用户名或密码不正确，请检查后再试。' : 'Incorrect username or password. Please try again.');
      return;
    }

    setIsLoggedIn(true);
    setShowAuthForm(false);
  };

  const logout = () => setIsLoggedIn(false);

  const addMediaItem = (item) => {
    setMoments((current) => [{
      author: isDad ? '爸爸' : 'yjh',
      type: item.type || '照片',
      title: item.title || '新媒体',
      text: item.text || '新上传的家庭记忆。',
      meta: '刚刚',
      mediaUrl: item.mediaUrl || null,
      mediaType: item.mediaType || (item.mediaUrl && hasImageExtension(item.mediaUrl) ? 'image' : 'video'),
      likes: 0,
      comments: 0,
    }, ...current]);
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
        addMediaItem({
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

  const handleExternalUrlSubmit = (event) => {
    event.preventDefault();
    const url = uploadUrl.trim();
    if (!url) return;

    addMediaItem({
      type: hasImageExtension(url) ? '照片' : '视频',
      title: uploadTitle || '外部链接媒体',
      text: '从外部链接插入的家庭故事。',
      mediaUrl: url,
      mediaType: hasImageExtension(url) ? 'image' : 'video',
    });

    setUploadUrl('');
    setUploadTitle('');
  };

  const insertSchoolAlbum = () => {
    setSchoolAlbums((current) => [
      { title: '新加国校园瞬间', text: '新的校园记忆正在写进故事。', image: heroImages[0] },
      ...current,
    ]);
  };

  const insertSchoolVideo = () => {
    setSchoolVideos((current) => [
      { title: '新课堂记录', url: 'https://www.bilibili.com/', type: 'bilibili' },
      ...current,
    ]);
  };

  const insertHealthCard = () => {
    setHealthCardsLocal((current) => [
      { title: '新健康提醒', text: '每一天都在尽力照顾身体与心情。', icon: Heart },
      ...current,
    ]);
  };

  const insertGameCard = () => {
    setGamesLocal((current) => [
      { title: '家庭小游戏', href: '/snake-game.html', accent: 'from-emerald-400 to-lime-300' },
      ...current,
    ]);
  };

  if (!isLoggedIn) {
    return (
      <div className="login-shell">
        <div className="login-panel">
          <div className="leaf-badge" aria-label="Canada maple leaf logo">
            <span>🍁</span>
          </div>
          <h1>{t.title}</h1>

          <div className="login-buttons">
            <button type="button" className="primary-btn" onClick={() => openLogin('dad')}>
              {t.dadLogin}
            </button>
            <button type="button" className="secondary-btn" onClick={() => openLogin('daughter')}>
              {t.daughterLogin}
            </button>
          </div>

          {showAuthForm && (
            <div className="auth-form">
              <label>
                <span>{lang === 'zh' ? '用户名' : 'Username'}</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={role === 'dad' ? 'yqcw@qq.com' : 'yjh'}
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
                {lang === 'zh' ? '进入基地' : 'Enter base'}
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

  const tabLabels = {
    home: t.home,
    school: t.school,
    health: t.health,
    games: t.games,
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-group">
          <div className="brand-mark"><Leaf size={18} /></div>
          <div>
            <small>Secret</small>
            <strong>Base</strong>
          </div>
        </div>

        <nav className="tab-bar" aria-label="Main navigation">
          {tabs.map(({ key, icon: Icon }) => (
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
          <span className={isDad ? 'role-tag dad' : 'role-tag daughter'}>
            {isDad ? '爸爸权限' : '女儿权限'}
          </span>
          <button type="button" className="ghost-btn" onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}>
            {lang === 'zh' ? 'EN' : '中文'}
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
                <h3>{t.message}</h3>
                <p>{t.goodMorning}</p>
              </div>
            </div>

            <div className="media-upload-panel">
              <div className="media-upload-header">
                <div className="feature-icon purple"><Video size={18} /></div>
                <h3>{lang === 'zh' ? '照片 / 视频存库' : 'Photo & Video Library'}</h3>
              </div>

              <div className="upload-grid">
                <label className="upload-field upload-file">
                  <span>{lang === 'zh' ? '上传到 R2' : 'Upload to R2'}</span>
                  <input type="file" accept="image/*,video/*" onChange={handleLocalUpload} disabled={uploading} />
                </label>

                <form className="upload-field upload-url-form" onSubmit={handleExternalUrlSubmit}>
                  <span>{lang === 'zh' ? '外部链接' : 'External link'}</span>
                  <div className="upload-inline">
                    <input
                      type="text"
                      value={uploadTitle}
                      onChange={(event) => setUploadTitle(event.target.value)}
                      placeholder={lang === 'zh' ? '标题（可选）' : 'Title (optional)'}
                    />
                    <input
                      type="url"
                      value={uploadUrl}
                      onChange={(event) => setUploadUrl(event.target.value)}
                      placeholder="https://..."
                    />
                    <button type="submit" className="upload-btn">
                      {lang === 'zh' ? '插入' : 'Insert'}
                    </button>
                  </div>
                </form>
              </div>

              <small className="upload-help">
                {lang === 'zh'
                  ? '支持本地上传到 Cloudflare R2，也支持 Bilibili / 图片外链直接展示。'
                  : 'Supports local uploads to Cloudflare R2 and direct embedding of Bilibili or image URLs.'}
              </small>
            </div>

            <div className="home-two-column">
              <div className="story-column">
                <div className="section-toolbar">
                  <h3>{lang === 'zh' ? '爸爸在加拿大' : 'Dad in Canada'}</h3>
                  <button type="button" className="section-editor" onClick={() => canEditSection('dad') && addMediaItem({ title: '爸爸新增记录', text: '新的加拿大生活正在记录中。', mediaUrl: heroImages[0], mediaType: 'image', type: '照片' })}>
                    {lang === 'zh' ? '编辑' : 'Edit'}
                  </button>
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
                        <div>
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
                  <button type="button" className="section-editor" onClick={() => canEditSection('daughter') && addMediaItem({ title: '女儿新增记录', text: '新的成长和想法正在整理中。', mediaUrl: heroImages[2], mediaType: 'image', type: '照片' })}>
                    {lang === 'zh' ? '编辑' : 'Edit'}
                  </button>
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
                        <div>
                          <span><Heart size={12} /> {item.likes}</span>
                          <span><MessageCircle size={12} /> {item.comments}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="split-grid">
              <div className="mini-panel">
                <div className="mini-header">
                  <h3>{t.taskBoard}</h3>
                  {canEditSection('dad') && <button type="button">+ {lang === 'zh' ? '新任务' : 'New Task'}</button>}
                </div>
                {tasks.map((task) => (
                  <div key={task.title} className="task-item">
                    <div>
                      <strong>{task.title}</strong>
                      <p>{task.detail}</p>
                    </div>
                    <span className={task.status === '已完成' ? 'done' : 'pending'}>{task.status}</span>
                  </div>
                ))}
              </div>

              <div className="mini-panel">
                <div className="mini-header">
                  <h3>{t.qna}</h3>
                  <button type="button">+ {isDad ? (lang === 'zh' ? '提问题' : 'Ask') : (lang === 'zh' ? '记录' : 'Record')}</button>
                </div>
                {qaEntries.map((pair) => (
                  <div key={pair.q} className="qa-item">
                    <p><strong>Q:</strong> {pair.q}</p>
                    <p><strong>A:</strong> {pair.a}</p>
                    <div className="qa-row">
                      <span>由 {pair.from} 回答</span>
                      <button type="button">已保存</button>
                    </div>
                  </div>
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
                  <h3>{lang === 'zh' ? '加国校园相册' : 'Campus album'}</h3>
                  {canEditSection('dad') && <button type="button" className="section-editor" onClick={insertSchoolAlbum}>{lang === 'zh' ? '编辑' : 'Edit'}</button>}
                </div>
                <div className="school-album-grid">
                  {schoolAlbums.map((item) => (
                    <article key={item.title} className="album-card">
                      <MediaFrame url={item.image} title={item.title} type="image" />
                      <div className="story-content compact-content">
                        <h4>{item.title}</h4>
                        <p>{item.text}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="story-column">
                <div className="section-toolbar">
                  <h3>{lang === 'zh' ? '加国校园视频' : 'Campus video'}</h3>
                  {canEditSection('dad') && <button type="button" className="section-editor" onClick={insertSchoolVideo}>{lang === 'zh' ? '编辑' : 'Edit'}</button>}
                </div>
                <div className="school-video-panel">
                  <form className="video-upload-form" onSubmit={(event) => {
                    event.preventDefault();
                    const videoUrl = event.currentTarget.videoUrl.value.trim();
                    if (!videoUrl) return;
                    setSchoolVideos((current) => [{ title: '新增记录', url: videoUrl, type: 'bilibili' }, ...current]);
                    event.currentTarget.reset();
                  }}>
                    <input type="url" name="videoUrl" placeholder="https://www.bilibili.com/video/..." />
                    <button type="submit">{lang === 'zh' ? '插入 B站链接' : 'Add Bilibili link'}</button>
                  </form>

                  <label className="upload-inline upload-inline-compact">
                    <span>{lang === 'zh' ? '本地上传' : 'Local upload'}</span>
                    <input type="file" accept="video/*" onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const form = new FormData();
                      form.append('file', file);
                      form.append('title', file.name);
                      const res = await fetch('/api/media', { method: 'POST', body: form });
                      const data = await res.json();
                      if (data.success && data.url) {
                        setSchoolVideos((current) => [{ title: file.name, url: data.url, type: 'local' }, ...current]);
                      }
                      event.target.value = '';
                    }} />
                  </label>

                  <div className="school-video-list">
                    {schoolVideos.map((item) => (
                      <div key={`${item.title}-${item.url}`} className="video-list-item">
                        <div className="video-list-badge">{item.type === 'bilibili' ? 'B站' : '本地'}</div>
                        <div className="video-list-copy">
                          <strong>{item.title}</strong>
                          <small>{item.url}</small>
                        </div>
                        <button type="button" onClick={() => window.open(toEmbedUrl(item.url), '_blank', 'noopener,noreferrer')}>{lang === 'zh' ? '播放' : 'Play'}</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'health' && (
          <section className="page-block">
            <div className="section-toolbar">
              <h3>{lang === 'zh' ? '健康生活' : 'Healthy living'}</h3>
              {canEditSection('dad') && <button type="button" className="section-editor" onClick={insertHealthCard}>{lang === 'zh' ? '编辑' : 'Edit'}</button>}
            </div>
            <div className="card-grid three-up compact">
              {healthCardsLocal.map(({ title, text, icon: Icon }) => (
                <article key={title} className="feature-card green">
                  <div className="feature-icon green"><Icon size={22} /></div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'games' && (
          <section className="page-block">
            <div className="section-toolbar">
              <h3>{lang === 'zh' ? '游戏乐园' : 'Game corner'}</h3>
              {canEditSection('dad') && <button type="button" className="section-editor" onClick={insertGameCard}>{lang === 'zh' ? '编辑' : 'Edit'}</button>}
            </div>
            <div className="game-grid">
              {gamesLocal.map((game) => (
                <a key={game.title} href={game.href} target="_blank" rel="noreferrer" className={`game-card ${game.accent}`}>
                  <div className="game-top">
                    <Gamepad2 size={26} />
                    <ChevronRight size={18} />
                  </div>
                  <div className="game-copy">
                    <small>Mini game</small>
                    <h3>{game.title}</h3>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
      </main>

      <div className="qa-floating">
        <button type="button" className="qa-toggle" onClick={() => setShowQaPanel((value) => !value)}>
          {showQaPanel ? (lang === 'zh' ? '关闭问答' : 'Close Q&A') : 'Q&A'}
        </button>
        {showQaPanel && (
          <div className="qa-panel">
            <div className="qa-panel-header">
              <strong>{lang === 'zh' ? '父女问答' : 'Parent & daughter Q&A'}</strong>
              <button type="button" onClick={() => setShowQaPanel(false)}>{lang === 'zh' ? '收起' : 'Hide'}</button>
            </div>
            <div className="qa-panel-list">
              {qaEntries.map((pair) => (
                <div key={pair.q} className="qa-item-floating">
                  <p><strong>Q:</strong> {pair.q}</p>
                  <p><strong>A:</strong> {pair.a}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
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
