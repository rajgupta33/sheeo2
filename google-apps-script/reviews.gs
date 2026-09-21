/**
 * SheEO — Reviews backend (Google Apps Script bound to a Google Sheet).
 *
 * doPost  → saves a review as a new row in the "Reviews" tab.
 * doGet   → returns the approved reviews as JSON for the homepage.
 *
 * Setup (once):
 *   1. Create a Google Sheet, then Extensions → Apps Script, paste this file.
 *   2. Run `setup` once from the editor and accept the permissions.
 *   3. Deploy → New deployment → Web app
 *        Execute as: Me   ·   Who has access: Anyone
 *   4. Copy the /exec URL into data-endpoint on the reviews section in /index.html.
 *
 * Moderation: new reviews arrive with the "Approved" box unticked. Tick it in
 * the sheet and the review appears on the site within a minute. Set
 * AUTO_APPROVE to true to publish everything immediately instead.
 *
 * Emails are stored for your follow-up only and are never returned by doGet.
 */

const SHEET_NAME = 'Reviews';
const AUTO_APPROVE = false;
const NOTIFY_EMAIL = ''; // e.g. 'sadhna@sheeo-summit.com' to get an email per new review
const CACHE_SECONDS = 60;

const HEADERS = ['Submitted', 'Name', 'Role / Business', 'Rating', 'Review', 'Email', 'Approved', 'ID'];
const COL = { submitted: 0, name: 1, role: 2, rating: 3, review: 4, email: 5, approved: 6, id: 7 };

function setup() {
  const sheet = getSheet_();
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  sheet.setColumnWidth(COL.review + 1, 420);
}

function doGet() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('reviews');
  if (cached) return json_(cached);

  const rows = getSheet_().getDataRange().getValues().slice(1);
  const reviews = rows
    .filter((r) => isApproved_(r[COL.approved]) && String(r[COL.review]).trim())
    .map((r) => ({
      id: String(r[COL.id] || ''),
      name: String(r[COL.name] || '').trim(),
      role: String(r[COL.role] || '').trim(),
      rating: clampRating_(r[COL.rating]),
      text: String(r[COL.review] || '').trim(),
      date: r[COL.submitted] instanceof Date ? r[COL.submitted].toISOString() : ''
    }))
    .reverse(); // newest first

  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  const body = JSON.stringify({
    ok: true,
    count: reviews.length,
    average: reviews.length ? Math.round((total / reviews.length) * 10) / 10 : 0,
    reviews: reviews
  });
  // CacheService values are capped at 100KB; skip caching if we ever exceed it.
  if (body.length < 95000) cache.put('reviews', body, CACHE_SECONDS);
  return json_(body);
}

function doPost(e) {
  let data;
  try {
    data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_(JSON.stringify({ ok: false, error: 'Invalid request.' }));
  }

  // Honeypot: real visitors never see or fill this field.
  if (data.website) return json_(JSON.stringify({ ok: true, approved: false }));

  const name = clean_(data.name, 60);
  const role = clean_(data.role, 80);
  const text = clean_(data.review, 800);
  const email = clean_(data.email, 120);
  const rating = clampRating_(data.rating);

  if (name.length < 2) return error_('Please add your name.');
  if (text.length < 20) return error_('Please write at least 20 characters.');
  if (!data.consent) return error_('Please agree to your review being shown on the website.');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error_('That email address looks incomplete.');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet_();
    sheet.appendRow([new Date(), name, role, rating, text, email, AUTO_APPROVE, Utilities.getUuid()]);
    sheet.getRange(sheet.getLastRow(), COL.approved + 1).insertCheckboxes().setValue(AUTO_APPROVE);
  } finally {
    lock.releaseLock();
  }

  if (AUTO_APPROVE) CacheService.getScriptCache().remove('reviews');

  if (NOTIFY_EMAIL) {
    try {
      MailApp.sendEmail(NOTIFY_EMAIL, 'New SheEO review from ' + name,
        rating + '★ — ' + text + '\n\n' + (AUTO_APPROVE ? 'It is live on the site.' : 'Tick "Approved" in the sheet to publish it.'));
    } catch (err) { /* email is best-effort */ }
  }

  return json_(JSON.stringify({ ok: true, approved: AUTO_APPROVE }));
}

// ---- helpers -----------------------------------------------------------

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  return sheet;
}

function isApproved_(value) {
  return value === true || /^(yes|y|true|approved|1)$/i.test(String(value).trim());
}

function clampRating_(value) {
  const n = Math.round(Number(value));
  return n >= 1 && n <= 5 ? n : 5;
}

// Trim, cap length, and stop text being read as a spreadsheet formula.
function clean_(value, max) {
  let s = String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function error_(message) {
  return json_(JSON.stringify({ ok: false, error: message }));
}

function json_(body) {
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}
