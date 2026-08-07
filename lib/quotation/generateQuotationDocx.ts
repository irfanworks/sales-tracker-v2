import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import type { QuotationTemplateFields } from "@/lib/quotation/buildQuotationData";

export const QUOTATION_TEMPLATE_RELATIVE_PATH =
  "templates/quotation/enercon-quotation-template.docx";

export function getQuotationTemplatePath(): string {
  return path.join(process.cwd(), QUOTATION_TEMPLATE_RELATIVE_PATH);
}

export function generateQuotationDocx(data: QuotationTemplateFields): Buffer {
  const templatePath = getQuotationTemplatePath();
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Quotation template not found at ${QUOTATION_TEMPLATE_RELATIVE_PATH}`);
  }

  const stat = fs.statSync(templatePath);
  // Official Enercon letterhead is ~1MB; the programmatic starter is ~8KB.
  if (stat.size < 50_000) {
    throw new Error(
      "Quotation template looks like the starter stub (too small). " +
        "Restore the official Enercon DOCX to templates/quotation/enercon-quotation-template.docx and redeploy."
    );
  }

  const content = fs.readFileSync(templatePath, "binary");
  const zip = new PizZip(content);

  // Guard: refuse the placeholder starter if it sneaks back into deploys
  const documentXml = zip.file("word/document.xml")?.asText() ?? "";
  if (documentXml.includes("starter template")) {
    throw new Error(
      "Quotation template is still the starter stub. " +
        "Overwrite templates/quotation/enercon-quotation-template.docx with the official Enercon letterhead."
    );
  }

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{{", end: "}}" },
    nullGetter: () => "—",
  });

  doc.render(data);

  return doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  }) as Buffer;
}
