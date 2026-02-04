# Security Hardening — sales.enercon.id

Dokumen ini menjelaskan langkah keamanan yang diterapkan dan rekomendasi untuk deployment di subdomain `sales.enercon.id`.

## Langkah yang Sudah Diterapkan

### 1. HTTP Security Headers (next.config.mjs)

- **X-Frame-Options: DENY** — Mencegah clickjacking
- **X-Content-Type-Options: nosniff** — Mencegah MIME sniffing
- **Referrer-Policy: strict-origin-when-cross-origin** — Batasi info referrer
- **Permissions-Policy** — Nonaktifkan camera, microphone, geolocation
- **Strict-Transport-Security (HSTS)** — Wajib HTTPS, 1 tahun
- **Content-Security-Policy (CSP)** — Batasi sumber script, style, connect (whitelist Supabase)

### 2. Secure Cookies (lib/supabase/middleware.ts)

- **Production**: `secure`, `httpOnly`, `sameSite: lax` untuk auth cookies
- Cookie diset pada response (bukan request) agar persist

### 3. Row Level Security (RLS) di Supabase

- **Projects**: Sales hanya akses project sendiri; Admin akses penuh
- **Customers**: Authenticated users
- **BD Updates**: Sales CRUD milik sendiri; Admin read all + delete
- **Profiles**: User baca sendiri; Admin baca semua

### 4. Environment Variables

- `.env*.local` dan `.env` di-ignore oleh Git
- Hanya `NEXT_PUBLIC_*` yang ter-expose ke client (Supabase URL & anon key)
- Service role key **tidak** dipakai di client

---

## Checklist Deployment (sales.enercon.id)

### Vercel

- [ ] Set environment variables di Vercel Dashboard (Production):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Pastikan domain `sales.enercon.id` terhubung dan HTTPS aktif
- [ ] Enable Vercel Firewall / DDoS protection (jika tersedia di plan)

### Supabase

- [ ] Jalankan semua migration (001–008) di Supabase production
- [ ] Pastikan RLS aktif di semua tabel
- [ ] Di Supabase Dashboard → Authentication → URL Configuration:
  - Site URL: `https://sales.enercon.id`
  - Redirect URLs: `https://sales.enercon.id/**`, `https://sales.enercon.id`
- [ ] Review API keys: anon key untuk client, service role **jangan** di client

### DNS & SSL

- [ ] Subdomain `sales.enercon.id` mengarah ke Vercel
- [ ] SSL/TLS aktif (Vercel otomatis jika pakai Vercel DNS)

---

## Rekomendasi Tambahan

### Rate Limiting

- Vercel Pro: gunakan Edge Middleware + rate limit (mis. Upstash Redis)
- Alternatif: Cloudflare di depan Vercel untuk DDoS & rate limiting

### Monitoring

- Aktifkan Vercel Analytics / Logs untuk deteksi traffic anomali
- Supabase Dashboard: pantau usage & failed auth attempts

### Backup & Recovery

- Supabase: enable Point-in-Time Recovery (PITR) jika tersedia
- Ekspor data penting secara berkala

### Audit Berkala

- `npm audit` untuk cek vulnerability dependency
- Update dependencies secara teratur
- Review Supabase logs untuk aktivitas mencurigakan

---

## Kontak Security

Jika menemukan kerentanan keamanan, hubungi tim IT/security internal sebelum mengungkapkan ke publik.
