# Pengaturan unit: deployment

Jalankan `migration_unit_site_settings.sql` pada database aktif **sebelum** menjalankan aplikasi baru. Migrasi menambahkan judul/subjudul hero, gambar OG, dan timestamp perubahan dengan presisi mikrodetik. Kolom dan data lama dipertahankan.

Pengaturan tersedia di `/scp/units` → **Edit**. Judul hero kosong memakai tagline; subjudul kosong memakai deskripsi. OG kosong memakai foto unit, lalu branding yayasan. Favicon tetap mengikuti yayasan.

API simpan unit dan jadwal PPDB mewajibkan token `updated_at` dari respons GET. Konflik menghasilkan HTTP 409; input yang belum disimpan dipertahankan sampai pengguna memilih **Muat ulang**. Klien lama harus memuat ulang data setelah deployment.

## Verifikasi operasional

- Jalankan migrasi dua kali pada database staging untuk memeriksa idempotensi.
- Buka unit sama di dua tab. Simpan tab pertama, kemudian tab kedua: simpan kedua harus mendapat 409.
- Simpan perubahan hero/OG dan periksa `/sd` serta metadata Open Graph.
- Periksa form dan daftar unit pada layar sempit, termasuk tombol unggah, hapus, dan simpan.

Tes otomatis memakai database mock. Eksekusi SQL dan tampilan browser tetap perlu diverifikasi terhadap database staging.

## Temuan audit dependency

`npm audit --omit=dev` melaporkan 15 advisory dependency yang sudah ada: 5 moderate, 7 high, 3 critical. Kategori critical mencakup Next.js, mysql2 (termasuk dependency mysqldump), dan next-auth. Ini belum merupakan penilaian exploitability tiap advisory. Pembaruan dependency perlu pekerjaan terpisah dan pengujian kompatibilitas; versi dependency tidak diubah dalam PR ini.
