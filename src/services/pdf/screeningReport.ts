import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import { getAllScreenings, getScreeningById, ScreeningRecord } from "../../db/database";
import { getScreeningImageDataUri } from "../../db/screeningImages";

const STATUS_LABELS: Record<string, string> = {
  clear: "No yellowing detected",
  possible: "Possible jaundice",
  inconclusive: "Image not clear enough",
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

function safeFilePart(value: string) {
  return value.normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase() || "lumicare";
}

async function renderRecord(record: ScreeningRecord) {
  const imageData = await getScreeningImageDataUri(record.imagePath).catch(() => null);
  const image = imageData
    ? `<img src="${imageData}" alt="Screening eye image" />`
    : `<p class="muted">The locally saved image is unavailable.</p>`;
  const dob = record.dateOfBirth
    ? `<p><strong>Date of birth:</strong> ${escapeHtml(record.dateOfBirth)}</p>`
    : "";
  const notes = record.notes
    ? `<p><strong>Notes:</strong> ${escapeHtml(record.notes)}</p>`
    : "";
  const demo = record.demo
    ? `<p class="evaluation">ENGINEERING EVALUATION ONLY — NOT A CLINICAL RESULT</p>`
    : "";

  return `<article>
    <h2>${escapeHtml(record.babyName || "Baby")}</h2>
    ${dob}
    <p><strong>Date and time:</strong> ${escapeHtml(new Date(record.date).toLocaleString())}</p>
    <p><strong>Screening result:</strong> ${escapeHtml(STATUS_LABELS[record.riskScore] ?? record.riskScore)}</p>
    ${notes}${demo}
    <h3>Submitted eye image</h3>${image}
  </article>`;
}

async function createPdf(records: ScreeningRecord[], title: string, contactHtml = "") {
  if (!records.length) throw new Error("No screening records are available to export.");
  const sections = await Promise.all(records.map(renderRecord));
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title><style>
      @page{margin:24px}body{font-family:Arial,sans-serif;padding:20px;color:#20352a}
      h1{color:#315d3e;font-size:24px}h2{color:#315d3e;font-size:19px}
      article{page-break-inside:avoid;border-bottom:1px solid #dce5da;padding:14px 0 22px}
      p{font-size:12px;line-height:1.5}img{display:block;max-width:100%;max-height:380px;object-fit:contain;margin:14px auto;border-radius:8px}
      .evaluation{color:#8c3b16;font-weight:bold;background:#fff0df;padding:10px}.muted,small{color:#66756b}
      .disclaimer{margin-top:24px;border-top:1px solid #dce5da;padding-top:12px}
    </style></head><body><h1>${escapeHtml(title)}</h1>${contactHtml}${sections.join("")}
    <p class="disclaimer"><small>Screening support only. This report is not a diagnosis and must be reviewed by a qualified healthcare professional.</small></p>
    </body></html>`;
  if (Platform.OS === "web") {
    await Print.printAsync({ html });
    return null;
  }
  const pdf = await Print.printToFileAsync({ html });
  return pdf.uri;
}

export async function exportScreeningPdf(recordId: number) {
  const record = await getScreeningById(recordId);
  if (!record) throw new Error("This screening record could not be found.");
  const uri = await createPdf([record], `${safeFilePart(record.babyName)} LumiCare screening report`);
  if (uri && await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: ".pdf" });
  } else if (uri) {
    await Print.printAsync({ uri });
  }
}

export async function exportScreeningsPdf(recordIds: number[]) {
  const records = await Promise.all(recordIds.map(getScreeningById));
  const availableRecords = records.filter((record): record is ScreeningRecord => record !== null);
  const firstRecord = availableRecords[0];
  const filePart = safeFilePart(firstRecord?.babyName ?? "lumicare");
  const uri = await createPdf(availableRecords, `${filePart} LumiCare screening results`);
  if (uri && await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: ".pdf" });
  } else if (uri) {
    await Print.printAsync({ uri });
  }
}

export async function exportReferralPdf(contact: { name: string; phone: string; facility: string }) {
  const records = await getAllScreenings();
  const contactHtml = `<h2>Care contact</h2><p>${escapeHtml(contact.name || "Not provided")} · ${escapeHtml(contact.phone || "Not provided")} · ${escapeHtml(contact.facility || "Not provided")}</p>`;
  if (!records.length) {
    throw new Error("No screening records are available for the referral report.");
  }
  const uri = await createPdf(records, "LumiCare referral report", contactHtml);
  if (uri && await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: ".pdf" });
  } else if (uri) {
    await Print.printAsync({ uri });
  }
}

export async function getReferralRecordCount() {
  return (await getAllScreenings()).length;
}