# Quotation DOCX placeholders

Official letterhead lives at `templates/quotation/enercon-quotation-template.docx`.
**Do not replace it with the tiny starter stub** — download files must keep letterhead, logo, and layout (~1MB template).

## Placeholders used by the official Enercon template

| Placeholder | Source |
|-------------|--------|
| `{{no_quote}}` | Pipeline quote number (also in footer) |
| `{{date}}` | Generation date (`dd MMMM yyyy`) |
| `{{customer_name}}` | Customer name (`To:`) |
| `{{pic_name}}` | PIC with salutation when set (`Attn:` / `Dear`) |
| `{{pipeline_name}}` | Pipeline / work name (`Ref:`) |
| `{{price_validity_days}}` | e.g. `30 days` |
| `{{delivery_weeks}}` | e.g. `8 weeks` |
| `{{payment_terms}}` | Human-readable payment terms |
| `{{sales_name}}` | Pipeline owner display name |

## Also available (optional in custom templates)

| Placeholder | Source |
|-------------|--------|
| `{{customer_sector}}` | Customer sector |
| `{{pic_salutation}}` | `Mr.` / `Mrs.` / `Ms.` (empty if unset) |
| `{{pic_full}}` | Same as formatted `{{pic_name}}` |
| `{{pipeline_type}}` | Project / Trading / Service |
| `{{progress_type}}` | Progress type |
| `{{value_idr}}` | Tender value as `Rp …` |
| `{{sales_email}}` | Owner email |

Empty values generally render as `—`.

Tags use **double curly braces** (`{{name}}`). Keep each `{{token}}` in a single Word text run (avoid splitting braces across bold/font changes).

## How to update the official template

1. Edit `templates/quotation/enercon-quotation-template.docx` in Word.
2. Keep the same placeholder names.
3. Save in place (file should stay large — letterhead + images).
4. Redeploy / restart. No code changes needed if placeholders are unchanged.

If Download Quotation returns a tiny unstructured doc (~3KB), the starter stub was deployed by mistake — restore this file and redeploy.
