import { useMemo, useState } from 'react';
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

const moments = [
  { author: '爸爸', type: '照片', title: '野生动物邻居', text: '今天早晨在小区里碰到了两只很可爱的小松鼠，像在和我们打招呼。', meta: '2小时前', image: heroImages[0], likes: 24, comments: 5 },
  { author: 'yjh', type: '文字', title: '今天的快乐清单', text: '我吃了彩虹糖饼干，还把作业和阅读时间安排得很好，感觉自己很厉害。', meta: '昨晚', image: null, likes: 31, comments: 7 },
  { author: '爸爸', type: '语音', title: '从公寓到森林', text: '今天我在卡尔加里的湖边走了一圈，风很轻，天很蓝。', meta: '今天上午', image: heroImages[2], likes: 18, comments: 3 },
];

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

  const t = copy[lang];
  const daysInCanada = useMemo(() => {
    const diff = Date.now() - START_DATE.getTime();
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)) + 1);
  }, []);

  const dadStatus = getCurrentStatus('dad');
  const daughterStatus = getCurrentStatus('daughter');

  const login = (selectedRole) => {
    setRole(selectedRole);
    if (selectedRole === 'dad') {
      setIsLoggedIn(true);
      return;
    }
    setIsLoggedIn(true);
  };

  const logout = () => setIsLoggedIn(false);

  if (!isLoggedIn) {
    return (
      <div className="login-shell">
        <div className="login-panel">
          <div className="leaf-badge">
            <Leaf size={42} />
          </div>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>

          <div className="login-buttons">
            <button type="button" className="primary-btn" onClick={() => login('dad')}>
              {t.dadLogin}
            </button>
            <button type="button" className="secondary-btn" onClick={() => login('daughter')}>
              {t.daughterLogin}
            </button>
          </div>

          <div className="login-footnote">
            <span>{t.admin}:</span> {t.email} / {t.password}
          </div>
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
                  <span>{t.days}</span>
                  <strong>{daysInCanada}</strong>
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

            <div className="card-grid three-up">
              {moments.map((item) => (
                <article key={item.title} className="story-card">
                  {item.image && <img src={item.image} alt={item.title} />}
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

            <div className="split-grid">
              <div className="mini-panel">
                <div className="mini-header">
                  <h3>{t.taskBoard}</h3>
                  <button type="button">+ {lang === 'zh' ? '新任务' : 'New Task'}</button>
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
                  <button type="button">+ {lang === 'zh' ? '提问题' : 'Ask'}</button>
                </div>
                {qnaPairs.map((pair) => (
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
            <div className="card-grid three-up compact">
              {schoolCards.map(({ title, text, icon: Icon }) => (
                <article key={title} className="feature-card">
                  <div className="feature-icon"><Icon size={22} /></div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>

            <div className="video-card">
              <div className="video-header">
                <div className="feature-icon purple"><Video size={20} /></div>
                <h3>{t.schoolVideo}</h3>
              </div>
              <div className="video-frame">
                <iframe
                  src="https://www.youtube.com/embed/5qap5aO4i9A?si=Q9x2M4PzF0A2b7nR"
                  title="school video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          </section>
        )}

        {activeTab === 'health' && (
          <section className="page-block">
            <div className="card-grid three-up compact">
              {healthCards.map(({ title, text, icon: Icon }) => (
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
            <div className="game-grid">
              {games.map((game) => (
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
