import { NextRequest, NextResponse } from 'next/server';
import * as ftp from 'basic-ftp';
import { Writable } from 'stream';
import { query } from '@/lib/db';

// ─── FTP helpers ────────────────────────────────────────────────────────────

async function ftpDownload(client: ftp.Client, remotePath: string): Promise<string> {
  const chunks: Buffer[] = [];
  const writable = new Writable({
    write(chunk, _, cb) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      cb();
    },
  });
  await client.downloadTo(writable, remotePath);
  return Buffer.concat(chunks)
    .toString('utf-8')
    .replace(/^\uFEFF/, ''); // strip BOM
}

// ─── CSV parser (semicolon-separated) ───────────────────────────────────────

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return { headers: [], rows: [] };

  const headers = lines[0]
    .split(';')
    .map(h => h.trim().toLowerCase().replace(/^\uFEFF/, ''));

  const rows = lines.slice(1)
    .map(line => {
      const cells = line.split(';').map(v => v.trim());
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = cells[i] ?? ''; });
      return obj;
    })
    .filter(r => Object.values(r).some(v => v !== ''));

  return { headers, rows };
}

// ─── Import PRO_ → Products ──────────────────────────────────────────────────

const PROD_COLS = [
  'product_id',
  'fld01','fld02','fld03','fld04','fld05','fld06','fld07','fld08','fld09','fld10',
  'fldd01','fldd02','fldd03','fldd04','fldd05',
];

async function importPRO(content: string): Promise<number> {
  // PRO_ files have no header row: map columns positionally via PROD_COLS
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  const rows: Record<string, string>[] = lines.map(line => {
    const cells = line.split(';').map(v => v.trim());
    const obj: Record<string, string> = {};
    PROD_COLS.forEach((col, i) => { obj[col] = cells[i] ?? ''; });
    return obj;
  }).filter(r => Object.values(r).some(v => v !== ''));

  let count = 0;

  for (const row of rows) {
    if (!row.product_id) continue;

    const cols = PROD_COLS.filter(c => row[c] !== undefined && row[c] !== '');
    if (!cols.includes('product_id')) cols.unshift('product_id');

    const vals = cols.map(c => row[c] || null);
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
    const updateSet = cols
      .filter(c => c !== 'product_id')
      .map(c => `${c} = EXCLUDED.${c}`)
      .join(', ');

    await query(
      `INSERT INTO "Products" (${cols.join(', ')})
       VALUES (${placeholders})
       ON CONFLICT (product_id) DO UPDATE SET ${updateSet}`,
      vals
    );
    count++;
  }
  return count;
}

// ─── Import EPC_ → Items ─────────────────────────────────────────────────────

async function importEPC(content: string): Promise<number> {
  // EPC_ files have no header row: col[0]=item_id (EPC), col[1]=product_id
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  let count = 0;

  for (const line of lines) {
    const cells = line.split(';').map(v => v.trim());
    const itemId    = cells[0];
    const productId = cells[1] || null;

    if (!itemId) continue;

    // Ensure product exists; if not, create a minimal record
    if (productId) {
      const exists = await query('SELECT 1 FROM "Products" WHERE product_id = $1', [productId]);
      if (exists.rows.length === 0) {
        await query(
          'INSERT INTO "Products" (product_id) VALUES ($1) ON CONFLICT (product_id) DO NOTHING',
          [productId]
        );
      }
    }

    // Insert item only if not already present
    await query(
      `INSERT INTO "Items" (item_id, item_product_id, date_creation, date_lastseen)
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (item_id) DO NOTHING`,
      [itemId, productId]
    );
    count++;
  }
  return count;
}

// ─── Import CHK_ → checklist / checklist_products / checklist_items ──────────

async function importCHK(
  content: string,
  logUser: string
): Promise<{ count: number; errors: string[] }> {
  // Resolve logged user's default place
  const userRes = await query('SELECT usr_def_place FROM users WHERE usr_name = $1', [logUser]);
  const userPlace = userRes.rows[0]?.usr_def_place ?? null;

  const lines = content.split(/\r?\n/).filter(l => l.trim());
  let count = 0;
  const errors: string[] = [];
  const seenCodes = new Set<string>(); // tracks codes already cleaned this import run

  for (const line of lines) {
    const cells   = line.split(';').map(v => v.trim());
    const chkCode  = cells[0] || null;
    const chkNotes = cells[1] || null;
    const productId = cells[2] || null;
    const qty       = cells[3] || null;
    const epcId     = cells[4] || null; // empty → SKU-level; populated → item-level

    if (!chkCode) continue;

    // 1. Get or create checklist header
    let chkId: number;
    const existing = await query('SELECT chk_id FROM "checklist" WHERE chk_code = $1', [chkCode]);
    if (existing.rows.length > 0) {
      chkId = existing.rows[0].chk_id;
      // First encounter of this code in the current import: purge dependent rows
      if (!seenCodes.has(chkCode)) {
        await query('DELETE FROM checklist_products WHERE ckp_chl_id = $1', [chkId]);
        await query('DELETE FROM checklist_items    WHERE ckp_chl_id = $1', [chkId]);
      }
    } else {
      const ins = await query(
        `INSERT INTO "checklist" (chk_code, chk_place, chk_zone, chk_notes, chk_creationdate)
         VALUES ($1, $2, 'IMPORT', $3, NOW()) RETURNING chk_id`,
        [chkCode, userPlace, chkNotes]
      );
      chkId = ins.rows[0].chk_id;
    }
    seenCodes.add(chkCode);

    // 2. Verify product exists
    if (!productId) continue;
    const prodCheck = await query('SELECT 1 FROM "Products" WHERE product_id = $1', [productId]);
    if (prodCheck.rows.length === 0) {
      errors.push(`Prodotto non trovato: ${productId}`);
      continue;
    }

    // 3a. SKU-level (col[4] empty)
    if (!epcId) {
      await query(
        `INSERT INTO checklist_products (ckp_chl_id, ckp_product_id, ckp_qta)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [chkId, productId, qty || null]
      );
    } else {
      // 3b. Item-level (col[4] populated)
      const itemCheck = await query('SELECT 1 FROM "Items" WHERE item_id = $1', [epcId]);
      if (itemCheck.rows.length === 0) {
        await query(
          `INSERT INTO "Items" (item_id, item_product_id, date_creation, date_lastseen, place_last, zone_last)
           VALUES ($1, $2, NOW(), NOW(), $3, 'IMPORT CHK')`,
          [epcId, productId, userPlace]
        );
      }
      await query(
        `INSERT INTO checklist_items (ckp_chl_id, ckp_epc_id, ckp_qta)
         VALUES ($1, $2, 1)
         ON CONFLICT DO NOTHING`,
        [chkId, epcId]
      );
    }
    count++;
  }
  return { count, errors };
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { host, port, user, password, prefix, logUser } = await req.json();

    if (!host) {
      return NextResponse.json({ error: 'Host FTP non configurato' }, { status: 400 });
    }

    const client = new ftp.Client();
    client.ftp.verbose = false;

    try {
      await client.access({
        host,
        port: Number(port) || 21,
        user,
        password,
        secure: false,
      });

      // Ensure destination folders exist
      for (const folder of ['/Imports/Elapsed', '/Imports/Failed']) {
        try { await client.ensureDir(folder); } catch { /* already exists */ }
      }
      await client.cd('/'); // reset working dir after ensureDir

      const list = await client.list('/Imports');
      const files = list.filter(f => f.type === ftp.FileType.File);

      const results: { file: string; rows: number; status: string; moved: string; errors?: string[] }[] = [];

      for (const file of files) {
        const filePrefix3 = file.name.substring(0, 3).toUpperCase();

        // Filter by prefix if specified
        if (prefix) {
          const req3 = prefix.substring(0, 3).toUpperCase();
          if (filePrefix3 !== req3) continue;
        }

        if (!['PRO', 'EPC', 'CHK'].includes(filePrefix3)) continue;

        let imported = 0;
        let status = 'ok';
        let destFolder = '/Imports/Elapsed';
        let chkErrors: string[] = [];

        try {
          const content = await ftpDownload(client, `/Imports/${file.name}`);

          if (filePrefix3 === 'PRO') {
            imported = await importPRO(content);
          } else if (filePrefix3 === 'EPC') {
            imported = await importEPC(content);
          } else if (filePrefix3 === 'CHK') {
            const chkResult = await importCHK(content, logUser ?? 'system');
            imported = chkResult.count;
            if (chkResult.errors.length > 0) {
              chkErrors = chkResult.errors;
              status = `ok (${chkResult.errors.length} errori)`;
            }
          }
        } catch (fileErr: any) {
          status = `errore: ${fileErr.message}`;
          destFolder = '/Imports/Failed';
        }

        // Move file to Elapsed or Failed
        let moved = '';
        try {
          await client.rename(`/Imports/${file.name}`, `${destFolder}/${file.name}`);
          moved = destFolder.split('/').pop()!;
        } catch (mvErr: any) {
          moved = `spostamento fallito: ${mvErr.message}`;
        }

        results.push({ file: file.name, rows: imported, status, moved, errors: chkErrors.length ? chkErrors : undefined });
      }

      if (results.length === 0) {
        return NextResponse.json({ results: [], message: 'Nessun file trovato in /Imports' });
      }

      return NextResponse.json({ results });
    } finally {
      client.close();
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Errore FTP' }, { status: 500 });
  }
}
