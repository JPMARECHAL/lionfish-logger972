/**
 * Google Apps Script to receive Lionfish Logger JSON payloads and append to a Google Sheet.
 * How to use:
 * 1) Create a Google Sheet and note its ID from the URL.
 * 2) Tools > Script editor, paste this code.
 * 3) Set SHEET_ID below.
 * 4) Deploy > New deployment > type "Web app" > Anyone with the link.
 * 5) Use the deployment URL as the webhook in the app settings.
 */
const SHEET_ID = 'PASTE_YOUR_SHEET_ID_HERE';
const SHEET_NAME = 'lionfish_logs';

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const rows = body.entries || [];
    const meta = body.meta || {};
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sh = ss.getSheetByName(SHEET_NAME);
    if (!sh) {
      sh = ss.insertSheet(SHEET_NAME);
      sh.appendRow([
        'id','timestamp','site','lat','lon','method','depth_band','divers','bottom_time_min',
        'count_0_10','count_10_15','count_15_20','count_20_25','count_25_30','count_ge_30',
        'total','cpue','club','team','notes','meta_ts'
      ]);
    }
    const values = rows.map(r => [
      r.id,r.timestamp,r.site,r.lat,r.lon,r.method,r.depth_band,r.divers,r.bottom_time_min,
      r.count_0_10,r.count_10_15,r.count_15_20,r.count_20_25,r.count_25_30,r.count_ge_30,
      r.total,r.cpue,r.club,r.team,r.notes, meta.ts || new Date().toISOString()
    ]);
    if (values.length) sh.getRange(sh.getLastRow()+1,1,values.length,values[0].length).setValues(values);
    return ContentService.createTextOutput(JSON.stringify({ ok: true, inserted: values.length })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  }
}
