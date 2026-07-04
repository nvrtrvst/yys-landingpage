ALTER TABLE ppdb_submissions 
ADD COLUMN nik VARCHAR(50) AFTER nisn, 
ADD COLUMN religion VARCHAR(50) AFTER gender, 
ADD COLUMN is_pip ENUM('YA', 'TIDAK') DEFAULT 'TIDAK' AFTER previous_school;
