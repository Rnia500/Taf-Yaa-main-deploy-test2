import 'dotenv/config';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import puppeteer from 'puppeteer';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

let admin = null;
let firestore = null;
const USE_FIREBASE = (() => {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin = require('firebase-admin');
      const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT; // JSON string
      if (serviceAccountEnv) {
        const serviceAccount = JSON.parse(serviceAccountEnv);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } else {
        // GOOGLE_APPLICATION_CREDENTIALS points to a file path
        admin.initializeApp();
      }
      firestore = admin.firestore();
      console.log('[Tafia] Firebase Admin initialized. Using Firestore for persistence.');
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[Tafia] Firebase initialization failed, falling back to in-memory store.', err.message);
    admin = null;
    firestore = null;
    return false;
  }
})();

// In-memory fallback stores (only for dev / if Firebase not configured)
const inMemory = {
  invites: {},   // token -> { token, email, role, createdAt, used }
  members: {},   // memberId -> { id, name, joinedAt, meta }
};

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = process.env.PORT || 4000;
const APP_BASE_URL = process.env.APP_BASE_URL || 'https://tafyaa.netlify.app'; // used for creating invite links
const INVITE_COLLECTION = 'tafia_invites';
const MEMBERS_COLLECTION = 'tafia_members';

/** Utility: store invite (Firebase or in-memory) */
async function storeInvite(invite) {
  if (USE_FIREBASE && firestore) {
    const docRef = firestore.collection(INVITE_COLLECTION).doc(invite.token);
    await docRef.set(invite);
    return invite;
  } else {
    inMemory.invites[invite.token] = invite;
    return invite;
  }
}

/** Utility: get invite by token */
async function getInvite(token) {
  if (USE_FIREBASE && firestore) {
    const doc = await firestore.collection(INVITE_COLLECTION).doc(token).get();
    if (!doc.exists) return null;
    return doc.data();
  } else {
    return inMemory.invites[token] || null;
  }
}

/** Utility: mark invite used / create member */
async function acceptInvite(token, memberData = {}) {
  const invite = await getInvite(token);
  if (!invite) throw new Error('Invite not found');
  if (invite.used) throw new Error('Invite already used');

  // create member
  const memberId = uuidv4();
  const member = {
    id: memberId,
    name: memberData.name || 'Unnamed',
    email: memberData.email || invite.email || null,
    joinedAt: new Date().toISOString(),
    meta: memberData.meta || {},
  };

  if (USE_FIREBASE && firestore) {
    await firestore.collection(MEMBERS_COLLECTION).doc(memberId).set(member);
    await firestore.collection(INVITE_COLLECTION).doc(token).update({ used: true, usedBy: memberId, usedAt: new Date().toISOString() });
  } else {
    inMemory.members[memberId] = member;
    invite.used = true;
    invite.usedBy = memberId;
    invite.usedAt = new Date().toISOString();
    inMemory.invites[token] = invite;
  }

  return member;
}

/** Generate a QR code for a given text (returns data URL and PNG buffer) */
async function generateQr(text) {
  // dataURL
  const dataUrl = await QRCode.toDataURL(text, { errorCorrectionLevel: 'H', margin: 2, scale: 6 });
  // PNG buffer
  const pngBuffer = await QRCode.toBuffer(text, { errorCorrectionLevel: 'H', margin: 2, scale: 6 });
  return { dataUrl, pngBuffer };
}

/** Simple HTML renderer for a genealogy tree.
 * Expects `tree` to be a nested object or array describing persons and children.
 * We'll produce a simple, printable HTML document (you can customize styling).
 */
function renderTreeHtml(tree, title = 'Tafia Genealogy') {
  // Helper to render recursively
  function renderNode(node) {
    // Accept node as { name, birthYear?, meta?, children: [...] } or string
    if (!node) return '';
    if (typeof node === 'string') return `<li>${escapeHtml(node)}</li>`;
    const name = escapeHtml(node.name || 'Unnamed');
    const metaParts = [];
    if (node.birthYear) metaParts.push(`b. ${escapeHtml(String(node.birthYear))}`);
    if (node.meta && typeof node.meta === 'object') {
      // show a few meta fields
      Object.keys(node.meta).slice(0, 3).forEach(k => {
        metaParts.push(`${escapeHtml(k)}: ${escapeHtml(String(node.meta[k]))}`);
      });
    }
    const metaHtml = metaParts.length ? ` <small>(${metaParts.join(' • ')})</small>` : '';
    let childrenHtml = '';
    if (Array.isArray(node.children) && node.children.length) {
      childrenHtml = `<ul>
        ${node.children.map(child => renderNode(child)).join('\n')}
      </ul>`;
    }
    return `<li><div class="person">${name}${metaHtml}</div>${childrenHtml}</li>`;
  }

  const bodyContent = Array.isArray(tree)
    ? `<ul class="tree-root">${tree.map(n => renderNode(n)).join('\n')}</ul>`
    : `<ul class="tree-root">${renderNode(tree)}</ul>`;

  const css = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial; padding: 20px; color: #222; }
      h1 { text-align: center; }
      ul { list-style-type: none; margin-left: 20px; padding-left: 10px; }
      .tree-root { margin: 0; padding: 0; }
      li { margin: 6px 0; }
      .person { padding: 6px 8px; border-radius: 6px; display: inline-block; background: #f7f7f7; border: 1px solid #e2e2e2; }
      small { color: #666; margin-left: 6px; }
    </style>
  `;

  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8">
      <title>${escapeHtml(title)}</title>
      ${css}
    </head>
    <body>
      <h1>${escapeHtml(title)}</h1>
      ${bodyContent}
    </body>
  </html>`;
  return html;
}

/** Simple HTML escape helper */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Endpoint: create invite and QR code */
app.post('/api/invite', async (req, res) => {
  try {
    // Accept fields: email, role, expiresIn (seconds), meta
    const { email, role, expiresIn = 60 * 60 * 24 * 7, meta = {} } = req.body || {};

    const token = uuidv4();
    const createdAt = new Date().toISOString();
    const expireAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Build invite object
    const invite = {
      token,
      email: email || null,
      role: role || 'member',
      createdAt,
      expireAt,
      used: false,
      meta,
    };

    await storeInvite(invite);

    // Create a join link encoded in QR. Frontend routes should handle /join?token=...
    const joinUrl = `${APP_BASE_URL}/join?token=${encodeURIComponent(token)}`;
    const { dataUrl, pngBuffer } = await generateQr(joinUrl);

    // Return both data URL and base64 PNG so frontend can choose
    res.json({
      success: true,
      invite,
      token,
      joinUrl,
      qrDataUrl: dataUrl,
      qrPngBase64: pngBuffer.toString('base64'),
      message: 'Invite created. Scan QR to open join link.',
    });
  } catch (err) {
    console.error('Error /api/invite', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/** Endpoint: simulate scanning a QR and joining (GET for simplicity).
 *  In practice the QR will point to frontend which then calls backend to accept the token.
 */
app.get('/api/join/:token', async (req, res) => {
  try {
    const token = req.params.token;
    const invite = await getInvite(token);
    if (!invite) return res.status(404).json({ success: false, error: 'Invite not found' });
    if (invite.used) return res.status(400).json({ success: false, error: 'Invite already used' });
    if (invite.expireAt && new Date(invite.expireAt) < new Date()) return res.status(400).json({ success: false, error: 'Invite expired' });

    // For demo: we don't auto-register; return invite info to frontend so it can show confirm screen
    res.json({ success: true, invite, message: 'Invite valid. Frontend should call accept endpoint to register.' });
  } catch (err) {
    console.error('Error /api/join/:token', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/** Endpoint: accept invite (register member) */
app.post('/api/join/:token/accept', async (req, res) => {
  try {
    const token = req.params.token;
    const memberData = req.body || {}; // expects { name, email, meta }
    const member = await acceptInvite(token, memberData);
    res.json({ success: true, member, message: 'Member created and invite marked used.' });
  } catch (err) {
    console.error('Error /api/join/:token/accept', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

/** Endpoint: export genealogy tree
 * Body: { tree: <json tree>, format: 'pdf'|'png'|'jpeg', filename?: 'name' }
 * Returns a download (application/pdf or image/png)
 */
app.post('/api/export/tree', async (req, res) => {
  try {
    const { tree, format = 'pdf', filename = `tafia_tree_${Date.now()}` } = req.body || {};

    if (!tree) return res.status(400).json({ success: false, error: 'Missing tree data in request body.' });
    if (!['pdf', 'png', 'jpeg'].includes(format)) return res.status(400).json({ success: false, error: 'Invalid format. Use pdf, png or jpeg.' });

    const html = renderTreeHtml(tree, 'Tafia Genealogy Tree');

    // Launch puppeteer
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Set page size for PDF
    if (format === 'pdf') {
      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' } });
      await browser.close();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
      return res.send(pdfBuffer);
    } else {
      // screenshot as PNG or JPEG; full page
      const imageBuffer = await page.screenshot({ fullPage: true, type: format === 'jpeg' ? 'jpeg' : 'png' });
      await browser.close();

      const contentType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.${format === 'jpeg' ? 'jpg' : 'png'}"`);
      return res.send(imageBuffer);
    }
  } catch (err) {
    console.error('Error /api/export/tree', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/sim/invite', async (req, res) => {
  try {
    const token = uuidv4();
    const createdAt = new Date().toISOString();
    const expireAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const invite = { token, email: 'demo@example.com', role: 'member', createdAt, expireAt, used: false, meta: {} };
    await storeInvite(invite);
    const joinUrl = `${APP_BASE_URL}/join?token=${encodeURIComponent(token)}`;
    const { dataUrl, pngBuffer } = await generateQr(joinUrl);
    res.json({ success: true, invite, token, joinUrl, qrDataUrl: dataUrl, qrPngBase64: pngBuffer.toString('base64') });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/sim/export/:format', async (req, res) => {
  try {
    const format = (req.params.format || 'pdf').toLowerCase();
    if (!['pdf', 'png', 'jpeg'].includes(format)) return res.status(400).json({ success: false, error: 'Invalid format. Use pdf, png or jpeg.' });
    const tree = { name: 'Root', birthYear: 1950, children: [{ name: 'Child 1', birthYear: 1975, children: [{ name: 'Grandchild A' }] }, { name: 'Child 2' }] };
    const html = renderTreeHtml(tree, 'Tafia Genealogy Tree');
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 2 });
      await page.setContent(html, { waitUntil: 'networkidle0' });
      if (format === 'pdf') {
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' } });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="demo_tree.pdf"');
        res.setHeader('Cache-Control', 'no-store');
        return res.send(pdfBuffer);
      } else {
        const type = format === 'jpeg' ? 'jpeg' : 'png';
        const imageBuffer = await page.screenshot({ fullPage: true, type, quality: type === 'jpeg' ? 90 : undefined });
        const contentType = type === 'jpeg' ? 'image/jpeg' : 'image/png';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="demo_tree.${type === 'jpeg' ? 'jpg' : 'png'}"`);
        res.setHeader('Cache-Control', 'no-store');
        return res.send(imageBuffer);
      }
    } finally {
      try { await browser.close(); } catch {}
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/** Simple health check */
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', firebase: !!USE_FIREBASE });
});

/** Start server */
app.listen(PORT, () => {
  console.log(`[Tafia] Backend running on port ${PORT}.`);
  console.log(`[Tafia] Endpoints: POST /api/invite  |  GET /api/join/:token  |  POST /api/join/:token/accept  |  POST /api/export/tree`);
});
