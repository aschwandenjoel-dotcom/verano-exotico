#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');
const env = {};
for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const ACCESS_TOKEN = env.INSTAGRAM_ACCESS_TOKEN;
const USER_ID     = env.INSTAGRAM_USER_ID;
const API         = `https://graph.instagram.com/v23.0`;

async function apiFetch(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, access_token: ACCESS_TOKEN }),
  });
  return res.json();
}

const server = new Server(
  { name: 'instagram', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'instagram_post_photo',
      description: 'Veröffentlicht ein Foto auf Instagram mit Caption und Hashtags',
      inputSchema: {
        type: 'object',
        properties: {
          image_url: { type: 'string', description: 'Öffentliche URL des Bildes (muss online erreichbar sein)' },
          caption:   { type: 'string', description: 'Caption inkl. Hashtags und Mentions' },
        },
        required: ['image_url', 'caption'],
      },
    },
    {
      name: 'instagram_post_reel',
      description: 'Veröffentlicht ein Reel (Video) auf Instagram',
      inputSchema: {
        type: 'object',
        properties: {
          video_url: { type: 'string', description: 'Öffentliche URL des Videos (MP4)' },
          caption:   { type: 'string', description: 'Caption inkl. Hashtags und Mentions' },
          cover_url: { type: 'string', description: 'Optional: URL des Thumbnail-Bildes' },
        },
        required: ['video_url', 'caption'],
      },
    },
    {
      name: 'instagram_get_profile',
      description: 'Zeigt Profilinfos und Verbindungsstatus des Instagram-Accounts',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'instagram_get_insights',
      description: 'Liefert Reichweite und Engagement-Daten der letzten Posts',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Anzahl Posts (Standard: 10)' },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: a } = req.params;

  if (name === 'instagram_post_photo') {
    const container = await apiFetch(`/${USER_ID}/media`, {
      image_url: a.image_url,
      caption:   a.caption,
    });
    if (container.error) throw new Error(JSON.stringify(container.error));
    const publish = await apiFetch(`/${USER_ID}/media_publish`, { creation_id: container.id });
    if (publish.error) throw new Error(JSON.stringify(publish.error));
    return { content: [{ type: 'text', text: `✅ Post veröffentlicht! ID: ${publish.id}` }] };
  }

  if (name === 'instagram_post_reel') {
    const body = { media_type: 'REELS', video_url: a.video_url, caption: a.caption };
    if (a.cover_url) body.cover_url = a.cover_url;
    const container = await apiFetch(`/${USER_ID}/media`, body);
    if (container.error) throw new Error(JSON.stringify(container.error));
    // Reels brauchen ~30s Verarbeitung – kurz warten
    await new Promise(r => setTimeout(r, 30000));
    const publish = await apiFetch(`/${USER_ID}/media_publish`, { creation_id: container.id });
    if (publish.error) throw new Error(JSON.stringify(publish.error));
    return { content: [{ type: 'text', text: `✅ Reel veröffentlicht! ID: ${publish.id}` }] };
  }

  if (name === 'instagram_get_profile') {
    const res = await fetch(
      `${API}/${USER_ID}?fields=id,username,name,followers_count,media_count,biography,website&access_token=${ACCESS_TOKEN}`
    );
    const data = await res.json();
    if (data.error) throw new Error(JSON.stringify(data.error));
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }

  if (name === 'instagram_get_insights') {
    const limit = a.limit || 10;
    const res = await fetch(
      `${API}/${USER_ID}/media?fields=id,caption,media_type,timestamp,like_count,comments_count&limit=${limit}&access_token=${ACCESS_TOKEN}`
    );
    const data = await res.json();
    if (data.error) throw new Error(JSON.stringify(data.error));
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }

  throw new Error(`Unbekanntes Tool: ${name}`);
});

await server.connect(new StdioServerTransport());
