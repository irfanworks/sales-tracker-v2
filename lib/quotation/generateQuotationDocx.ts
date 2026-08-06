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

  const content = fs.readFileSync(templatePath, "binary");
  const zip = new PizZip(content);
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
