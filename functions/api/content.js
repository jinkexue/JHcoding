const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders,
    },
  });
}

function normalizeText(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function normalizeNumeric(value, fallback = 0) {
  const number = Number(value ?? fallback);
  if (!Number.isFinite(number)) return fallback;
  return number;
}

async function ensureContentTable(db) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS family_content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'item',
      title TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      media_url TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      link_url TEXT DEFAULT '',
      author TEXT DEFAULT '',
      type TEXT DEFAULT '',
      icon TEXT DEFAULT '',
      accent TEXT DEFAULT '',
      answer TEXT DEFAULT '',
      from_name TEXT DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_by TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
  ];

  for (const sql of statements) {
    await db.prepare(sql).run();
  }
}

function mapRowToSection(section, row) {
  const base = {
    id: row.id,
    section,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };

  if (section === 'homeStory') {
    return {
      ...base,
      author: row.author || '爸爸',
      type: row.type || '照片',
      title: row.title || '新记录',
      text: row.body || '',
      meta: '已同步',
      mediaUrl: row.media_url || row.image_url || '',
      mediaType: row.type === '视频' ? 'video' : 'image',
      likes: 0,
      comments: 0,
    };
  }

  if (section === 'schoolAlbum') {
    return {
      ...base,
      title: row.title || '新相册',
      text: row.body || '',
      image: row.image_url || row.media_url || '',
    };
  }

  if (section === 'schoolVideo') {
    return {
      ...base,
      title: row.title || '新视频',
      url: row.link_url || row.media_url || '',
      type: row.type || 'bilibili',
    };
  }

  if (section === 'health') {
    return {
      ...base,
      title: row.title || '健康提醒',
      text: row.body || '',
      icon: row.icon || 'Heart',
    };
  }

  if (section === 'game') {
    return {
      ...base,
      title: row.title || '新游戏',
      href: row.link_url || './snake-game.html',
      accent: row.accent || 'from-emerald-400 to-lime-300',
    };
  }

  if (section === 'qna') {
    return {
      ...base,
      q: row.title || '',
      a: row.answer || row.body || '',
      from: row.from_name || row.author || '爸爸',
    };
  }

  return {
    ...base,
    title: row.title || '',
    text: row.body || '',
  };
}

async function listContent(db, section = null) {
  await ensureContentTable(db);
  const query = section
    ? 'SELECT * FROM family_content WHERE section = ? ORDER BY sort_order DESC, id DESC'
    : 'SELECT * FROM family_content ORDER BY sort_order DESC, id DESC';
  const params = section ? [section] : [];
  const rows = await db.prepare(query).bind(...params).all();
  const results = (rows.results || []).reduce((acc, row) => {
    const current = acc[row.section] || [];
    current.push(mapRowToSection(row.section, row));
    acc[row.section] = current;
    return acc;
  }, {});

  const fallbackSections = {
    homeStory: [],
    schoolAlbum: [],
    schoolVideo: [],
    health: [],
    game: [],
    qna: [],
  };

  return { ...fallbackSections, ...results };
}

async function saveContent(db, section, item) {
  await ensureContentTable(db);
  const data = item || {};
  const now = new Date().toISOString();
  const row = {
    id: data.id ? Number(data.id) : null,
    section: String(section || data.section || 'homeStory').trim() || 'homeStory',
    title: normalizeText(data.title, '新记录'),
    body: normalizeText(data.text || data.body || '', ''),
    media_url: normalizeText(data.mediaUrl || data.media_url || '', ''),
    image_url: normalizeText(data.image || data.image_url || '', ''),
    link_url: normalizeText(data.href || data.link_url || data.url || '', ''),
    author: normalizeText(data.author || data.from_name || data.from || '', ''),
    type: normalizeText(data.type || '', ''),
    icon: normalizeText(data.icon || '', 'Heart'),
    accent: normalizeText(data.accent || '', 'from-emerald-400 to-lime-300'),
    answer: normalizeText(data.answer || '', ''),
    from_name: normalizeText(data.from || data.from_name || '', '爸爸'),
    created_by: normalizeText(data.created_by || '', ''),
  };

  if (row.id) {
    const existing = await db.prepare('SELECT * FROM family_content WHERE id = ?').bind(row.id).first();
    if (!existing) {
      row.id = null;
    }
  }

  if (!row.id) {
    const stmt = `INSERT INTO family_content (section, kind, title, body, media_url, image_url, link_url, author, type, icon, accent, answer, from_name, sort_order, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    await db.prepare(stmt).bind(
      row.section,
      'item',
      row.title,
      row.body,
      row.media_url,
      row.image_url,
      row.link_url,
      row.author,
      row.type,
      row.icon,
      row.accent,
      row.answer,
      row.from_name,
      0,
      row.created_by,
      now,
      now,
    ).run();

    const latest = await db.prepare('SELECT * FROM family_content WHERE section = ? ORDER BY id DESC LIMIT 1').bind(row.section).first();
    return mapRowToSection(row.section, latest);
  }

  const updateSql = `UPDATE family_content SET section = ?, title = ?, body = ?, media_url = ?, image_url = ?, link_url = ?, author = ?, type = ?, icon = ?, accent = ?, answer = ?, from_name = ?, updated_at = ? WHERE id = ?`;
  await db.prepare(updateSql).bind(
    row.section,
    row.title,
    row.body,
    row.media_url,
    row.image_url,
    row.link_url,
    row.author,
    row.type,
    row.icon,
    row.accent,
    row.answer,
    row.from_name,
    now,
    row.id,
  ).run();

  const updated = await db.prepare('SELECT * FROM family_content WHERE id = ?').bind(row.id).first();
  return mapRowToSection(row.section, updated);
}

async function deleteContent(db, section, item) {
  await ensureContentTable(db);
  const itemId = Number(item?.id || item?.itemId || 0);
  const title = normalizeText(item?.title || '', '');

  if (itemId) {
    await db.prepare('DELETE FROM family_content WHERE id = ? AND section = ?').bind(itemId, section).run();
    return { success: true };
  }

  if (title) {
    await db.prepare('DELETE FROM family_content WHERE section = ? AND title = ?').bind(section, title).run();
  }

  return { success: true };
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet(context) {
  try {
    const { request, env } = context;
    const db = env.DB || env.YJH_DB || env.D1_DATABASE;
    if (!db) {
      return json({ success: false, error: '缺少 Cloudflare D1 绑定。请把 D1 数据库绑定名设置为 DB。' }, 500);
    }

    const url = new URL(request.url);
    const section = url.searchParams.get('section');
    const data = await listContent(db, section);

    return json({ success: true, sections: data });
  } catch (error) {
    return json({ success: false, error: error.message || '读取内容失败。' }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const db = env.DB || env.YJH_DB || env.D1_DATABASE;
    if (!db) {
      return json({ success: false, error: '缺少 Cloudflare D1 绑定。请把 D1 数据库绑定名设置为 DB。' }, 500);
    }

    const body = await request.json();
    const action = String(body.action || '').trim();
    const section = String(body.section || '').trim();

    if (action === 'list') {
      const sections = await listContent(db, section || null);
      return json({ success: true, sections });
    }

    if (action === 'save') {
      const item = await saveContent(db, section, body.item || body);
      return json({ success: true, item });
    }

    if (action === 'delete') {
      const result = await deleteContent(db, section, body.item || body);
      return json({ success: true, ...result });
    }

    return json({ success: false, error: '未知操作。' }, 400);
  } catch (error) {
    return json({ success: false, error: error.message || '保存内容失败。' }, 500);
  }
}
