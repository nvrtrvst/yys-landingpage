const mysql = require('mysql2/promise');

async function seedDatabase() {
  let conn;
  try {
    conn = await mysql.createConnection({ user: 'root', database: 'yayasan_db' });

    // Seed Testimonials
    const [testiRows] = await conn.execute('SELECT COUNT(*) as count FROM testimonials');
    if (testiRows[0].count === 0) {
      console.log('Seeding Testimonials...');
      const testimonials = [
        ['Bapak Budi Santoso', 'Orang tua siswa SMP', 'Pendidikan di Yayasan Nuurul Muttaqiin sangat memperhatikan adab dan akhlak. Anak saya menjadi lebih mandiri dan rajin ibadahnya sejak bersekolah di sini.', null, 1, 1],
        ['Ibu Siti Aminah', 'Orang tua siswa SD', 'Fasilitas yang lengkap dan guru-guru yang penyabar membuat anak saya selalu semangat untuk berangkat sekolah setiap harinya.', null, 2, 1],
        ['Dr. Andi Wijaya', 'Alumni SMA Terpadu', 'Bukan hanya bekal akademis, tapi nilai-nilai Qurani yang ditanamkan sangat membantu saya dalam kehidupan profesional saat ini.', null, 3, 1]
      ];
      for (const t of testimonials) {
        await conn.execute('INSERT INTO testimonials (author_name, role, content, image_url, order_index, is_active) VALUES (?, ?, ?, ?, ?, ?)', t);
      }
      console.log('Testimonials seeded successfully.');
    } else {
      console.log('Testimonials already exist, skipping...');
    }

    // Seed FAQs
    const [faqRows] = await conn.execute('SELECT COUNT(*) as count FROM faqs');
    if (faqRows[0].count === 0) {
      console.log('Seeding FAQs...');
      const faqs = [
        ['PPDB', 'Bagaimana prosedur pendaftaran siswa baru?', 'Anda dapat mendaftar langsung secara online melalui halaman ini dengan mengisi form yang telah disediakan, atau datang langsung ke sekretariat pendaftaran di unit sekolah.', 1, 1],
        ['PPDB', 'Kapan jadwal pendaftaran dibuka?', 'Gelombang pertama pendaftaran dibuka mulai bulan Januari hingga Maret. Gelombang kedua (apabila kuota masih tersedia) dibuka pada bulan April hingga Mei.', 2, 1],
        ['Biaya', 'Berapa rincian biaya pendaftaran dan SPP bulanan?', 'Rincian biaya berbeda untuk setiap unit (TK, SD, SMP, SMA/SMK). Secara umum biaya meliputi Uang Pangkal, Seragam, dan SPP bulan pertama. Detail dapat diunduh pada brosur di menu PPDB.', 1, 1],
        ['Biaya', 'Apakah tersedia program beasiswa?', 'Ya, yayasan menyediakan kuota beasiswa khusus bagi siswa berprestasi (akademik maupun tahfidz) serta jalur afirmasi/yatim piatu.', 2, 1],
        ['Umum', 'Apakah sekolah ini menyediakan fasilitas asrama (boarding)?', 'Saat ini kami menyediakan fasilitas asrama khusus untuk siswa jenjang SMP dan SMA Terpadu program tahfidz khusus.', 1, 1],
        ['Umum', 'Apakah ada kegiatan ekstrakurikuler?', 'Tentu saja. Kami memiliki beragam ekstrakurikuler mulai dari Pramuka, PMR, Paskibra, panahan, beladiri, hingga klub robotika dan bahasa asing.', 2, 1]
      ];
      for (const f of faqs) {
        await conn.execute('INSERT INTO faqs (category, question, answer, order_index, is_active) VALUES (?, ?, ?, ?, ?)', f);
      }
      console.log('FAQs seeded successfully.');
    } else {
      console.log('FAQs already exist, skipping...');
    }

  } catch (err) {
    console.error('Error during seeding:', err);
  } finally {
    if (conn) conn.end();
  }
}

seedDatabase();
