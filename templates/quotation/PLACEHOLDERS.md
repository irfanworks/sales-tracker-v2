# Quotation DOCX placeholders

Replace `enercon-quotation-template.docx` with the official Enercon letterhead template when ready.
**Keep the same placeholder names** (including double curly braces) so no code changes are required.

| Placeholder | Source |
|-------------|--------|
| `{{no_quote}}` | Pipeline quote number |
| `{{date}}` | Generation date (`dd MMM yyyy`) |
| `{{customer_name}}` | Customer name |
| `{{customer_sector}}` | Customer sector |
| `{{pic_salutation}}` | `Mr.` / `Mrs.` / `Ms.` (empty string if unset) |
| `{{pic_name}}` | PIC name only |
| `{{pic_full}}` | Combined `Mr. Name` (or name alone / `—`) |
| `{{pipeline_name}}` | Pipeline / work name |
| `{{pipeline_type}}` | Project / Trading / Service |
| `{{progress_type}}` | Progress type |
| `{{value_idr}}` | Tender value formatted as `Rp …` (IDR) |
| `{{price_validity_days}}` | e.g. `60 days` |
| `{{delivery_weeks}}` | e.g. `8 weeks` |
| `{{payment_terms}}` | Human-readable payment terms (joined with `; `) |
| `{{sales_name}}` | Pipeline owner display name |
| `{{sales_email}}` | Pipeline owner email |

Empty values generally render as `—`. `{{pic_salutation}}` is blank when unset so `{{pic_salutation}} {{pic_name}}` does not print a stray dash.

Tags use **double curly braces** (`{{name}}`). The generator is configured for these delimiters.

Recommended PIC line in the official template:

```text
PIC: {{pic_salutation}} {{pic_name}}
```

Or a single token (used by the starter template):

```text
PIC: {{pic_full}}
```

## How to swap the official template

1. Open your Enercon quotation `.docx` in Word.
2. Type the placeholders above exactly where values should appear (one complete `{{token}}` per run of text — avoid splitting a placeholder across formatting).
3. Save as `templates/quotation/enercon-quotation-template.docx` (overwrite this file).
4. Redeploy / restart the app. No code changes needed.
