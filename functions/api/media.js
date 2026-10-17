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

function normalizePublicUrl(base, key) {
  if (!base) return '';
  const cleanBase = String(base).trim().replace(/\/+$/, '');
  return `${cleanBase}/${key.replace(/^\/+/, '')}`;
}

function deriveExtension(name) {
  const raw = String(name || '').split('?')[0];
  const match = raw.match(/\.([A-Za-z0-9]+)$/);
  return match ? match[1].toLowerCase() : 'bin';
}

function chooseTypeFromUrl(rawUrl) {
  const url = String(rawUrl || '').trim();
  if (!url) return 'unknown';
  return /\.(png|jpe?g|gif|webp|svg|bmp|avif)(\?.*)?$/i.test(url) || /images?\.|unsplash|pexels|cdn/i.test(url)
    ? 'image'
    : 'video';
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const bucket = env.MY_BUCKET || env.R2_BUCKET || null;

  if (!bucket) {
    return json({ success: false, error: 'Cloudflare R2 bucket binding is not configured.' }, 500);
  }

  const url = new URL(request.url);
  const prefix = url.searchParams.get('prefix') || 'family-media/';
  const listed = await bucket.list({ prefix, limit: 20 });

  return json({
    success: true,
    items: (listed.objects || []).map((item) => ({
      key: item.key,
      size: item.size,
      uploaded: item.uploaded,
      etag: item.etag,
      url: normalizePublicUrl(env.R2_PUBLIC_URL || env.VITE_APP_R2_ENDPOINT || '', item.key),
    })),
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const bucket = env.MY_BUCKET || env.R2_BUCKET || null;

  if (!bucket) {
    return json({ success: false, error: 'Cloudflare R2 bucket binding is not configured.' }, 500);
  }

  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const file = formData.get('file');
    const title = String(formData.get('title') || 'upload').trim();

    if (!(file instanceof File)) {
      return json({ success: false, error: 'No file uploaded' }, 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const ext = deriveExtension(file.name || title || 'upload');
    const key = `family-media/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    await bucket.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type || 'application/octet-stream',
      },
    });

    const publicUrl = normalizePublicUrl(env.R2_PUBLIC_URL || env.VITE_APP_R2_ENDPOINT || '', key);

    return json({
      success: true,
      title: title || file.name,
      key,
      url: publicUrl || '',
      type: file.type.startsWith('video/') ? 'video' : 'image',
      message: publicUrl ? 'Uploaded to Cloudflare R2 successfully.' : 'Uploaded, but no public URL has been configured yet.',
    });
  }

  try {
    const body = await request.json();
    const rawUrl = String(body.url || '').trim();
    const urlTitle = String(body.title || 'external-link').trim();

    if (!rawUrl) {
      return json({ success: false, error: 'Missing URL for external media.' }, 400);
    }

    return json({
      success: true,
      entry: {
        title: urlTitle,
        url: rawUrl,
        type: chooseTypeFromUrl(rawUrl),
      },
    });
  } catch (error) {
    return json({ success: false, error: 'Invalid request. Expected JSON or form-data.' }, 400);
  }
}
