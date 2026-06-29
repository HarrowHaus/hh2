#!/usr/bin/env node
/*
 * ingest-music.mjs — populate the self-hosted R2 music catalog.
 *
 * Walks the OWNER'S organized music library, reads ID3/Vorbis tags, uploads the
 * audio + embedded cover art to a Cloudflare R2 bucket (via wrangler), and emits
 * data/audio-manifest.json (the generated bulk foobar2000 reads). This is how the
 * ENTIRE catalog gets in without hand-listing it. We do NOT scrape Bandcamp.
 *
 * Expected library layout (best-effort; tags win where present):
 *   <src>/<Label>/<Band>/<Album>/01 - Track.flac
 *   <src>/<Band>/<Album>/01 - Track.mp3        (no label -> "")
 *
 * Setup (owner runs once):
 *   npm i -D music-metadata
 *   wrangler r2 bucket create hh2-music           # once
 *   # make it public (r2.dev or a custom domain), note the public base URL
 *
 * Run:
 *   node scripts/ingest-music.mjs \
 *     --src "/path/to/Music" \
 *     --bucket hh2-music \
 *     --public-base https://music.example.com \
 *     [--dry-run]   # parse + write manifest, skip uploads
 *
 * R2 objects are uploaded with: Cache-Control: public, max-age=31536000, immutable
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const run = promisify(execFile)

const AUDIO_EXT = new Set(['.mp3', '.flac', '.m4a', '.aac', '.ogg', '.opus', '.wav', '.wma'])
const CACHE_CONTROL = 'public, max-age=31536000, immutable'
const CONTENT_TYPE = {
  '.mp3': 'audio/mpeg', '.flac': 'audio/flac', '.m4a': 'audio/mp4', '.aac': 'audio/aac',
  '.ogg': 'audio/ogg', '.opus': 'audio/opus', '.wav': 'audio/wav', '.wma': 'audio/x-ms-wma',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
}

function parseArgs(argv) {
  const a = {}
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i]
    if (k === '--dry-run') a.dryRun = true
    else if (k.startsWith('--')) a[k.slice(2)] = argv[++i]
  }
  return a
}

const slug = (s) =>
  String(s || '')
    .normalize('NFKD')
    .replace(/[^\w\s.-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase() || 'unknown'

async function* walk(dir) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) yield* walk(full)
    else if (AUDIO_EXT.has(path.extname(e.name).toLowerCase())) yield full
  }
}

// Derive label/band/album from path, tags filling the gaps.
function classify(file, srcRoot, common) {
  const rel = path.relative(srcRoot, file)
  const parts = rel.split(path.sep)
  let label = '', band = '', album = ''
  if (parts.length >= 4) [label, band, album] = parts
  else if (parts.length === 3) [band, album] = parts
  else if (parts.length === 2) [album] = [parts[0]]
  band = common.albumartist || common.artist || band || 'Unknown Artist'
  album = common.album || album || 'Unknown Album'
  return { label, band, album }
}

async function r2put(bucket, key, file, ext, dryRun) {
  if (dryRun) return
  const ct = CONTENT_TYPE[ext] || 'application/octet-stream'
  await run('npx', [
    'wrangler', 'r2', 'object', 'put', `${bucket}/${key}`,
    '--file', file, '--content-type', ct, '--cache-control', CACHE_CONTROL, '--remote',
  ])
}

async function main() {
  const args = parseArgs(process.argv)
  if (!args.src || !args.bucket || !args['public-base']) {
    console.error('usage: node scripts/ingest-music.mjs --src <dir> --bucket <r2bucket> --public-base <url> [--dry-run]')
    process.exit(1)
  }
  const { default: mm } = await import('music-metadata').catch(() => {
    console.error("Missing dep. Run: npm i -D music-metadata")
    process.exit(1)
  })

  const srcRoot = path.resolve(args.src)
  const publicBase = args['public-base'].replace(/\/$/, '')
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'hh2-art-'))
  const tracks = []
  const artDone = new Set()
  let n = 0

  for await (const file of walk(srcRoot)) {
    let meta
    try {
      meta = await mm.parseFile(file, { duration: true })
    } catch (e) {
      console.warn('skip (unreadable tags):', file)
      continue
    }
    const c = meta.common
    const { label, band, album } = classify(file, srcRoot, c)
    const year = c.year ?? null
    const trackNo = c.track?.no ?? 0
    const title = c.title || path.basename(file, path.extname(file))
    const ext = path.extname(file).toLowerCase()

    const albumKey = `${slug(label)}/${slug(band)}/${slug(album)}`
    const trackKey = `${albumKey}/${String(trackNo).padStart(2, '0')}-${slug(title)}${ext}`

    // upload cover art once per album (from embedded picture)
    let artUrl = null
    if (c.picture?.[0] && !artDone.has(albumKey)) {
      const pic = c.picture[0]
      const aExt = pic.format?.includes('png') ? '.png' : '.jpg'
      const artFile = path.join(tmp, `${slug(album)}${aExt}`)
      await fs.writeFile(artFile, pic.data)
      const artKey = `art/${albumKey}${aExt}`
      await r2put(args.bucket, artKey, artFile, aExt, args.dryRun)
      artUrl = `${publicBase}/${artKey}`
      artDone.add(albumKey)
    } else if (artDone.has(albumKey)) {
      artUrl = `${publicBase}/art/${albumKey}.jpg`
    }

    await r2put(args.bucket, `audio/${trackKey}`, file, ext, args.dryRun)

    tracks.push({
      id: slug(`${band}-${album}-${trackNo}-${title}`),
      title, artist: band, album, label,
      year, trackNo,
      durationSec: meta.format.duration ? Math.round(meta.format.duration) : null,
      art: artUrl,
      src: `${publicBase}/audio/${trackKey}`,
    })
    n++
    if (n % 50 === 0) console.log(`...${n} tracks`)
  }

  tracks.sort((a, b) =>
    (a.label || '').localeCompare(b.label) ||
    a.artist.localeCompare(b.artist) ||
    (a.album || '').localeCompare(b.album) ||
    a.trackNo - b.trackNo)

  const manifest = {
    _comment: 'GENERATED by scripts/ingest-music.mjs — do not hand-edit.',
    generatedAt: new Date().toISOString(),
    r2PublicBase: publicBase,
    tracks,
  }
  const out = path.resolve('data/audio-manifest.json')
  await fs.writeFile(out, JSON.stringify(manifest, null, 2) + '\n')
  console.log(`\n${args.dryRun ? '[dry-run] ' : ''}wrote ${tracks.length} tracks -> ${out}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
