const mysql = require('mysql2/promise');

async function seed() {
  const c = await mysql.createConnection('mysql://root:@localhost:3306/yayasan_db');
  try {
    await c.query(`
      CREATE TABLE IF NOT EXISTS majors (
        id          CHAR(36)     NOT NULL DEFAULT (UUID()),
        school_id   CHAR(36)     NOT NULL,
        name        VARCHAR(100) NOT NULL,
        code        VARCHAR(20),
        is_active   TINYINT(1)   NOT NULL DEFAULT 1,
        created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE ON UPDATE CASCADE,
        UNIQUE KEY uq_major_school_name (school_id, name)
      ) ENGINE=InnoDB;
    `);
    console.log('Table majors created/verified');
    
    // Find SMK school id
    const [schools] = await c.query(`SELECT id FROM schools WHERE name LIKE '%SMK%' LIMIT 1`);
    if (schools.length > 0) {
      const schoolId = schools[0].id;
      // Insert default majors
      await c.query(`INSERT IGNORE INTO majors (school_id, name, code) VALUES 
        (?, 'Teknik Komputer dan Jaringan', 'TKJ'),
        (?, 'Rekayasa Perangkat Lunak', 'RPL'),
        (?, 'Teknik Kendaraan Ringan Otomotif', 'TKRO')
      `, [schoolId, schoolId, schoolId]);
      console.log('Default majors seeded for SMK!');
    } else {
      console.log('No SMK school found in schools table');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    c.end();
  }
}

seed();
