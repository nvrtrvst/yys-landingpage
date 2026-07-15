==========================================================
MIGRATION INSTRUCTION: QUERY OPTIMIZATION
==========================================================

INSTALLATION
======================================
1. Backup database sebelum menjalankan migration
2. Run migration_query_optimization.sql on your MySQL database
3. Verify indexes created: SHOW INDEX FROM table_name;

VERIFICATION
======================================
After applying migration, check index usage:

-- Test PPDB search index
EXPLAIN SELECT * FROM ppdb_submissions 
WHERE MATCH(student_name, registration_number, nisn) 
AGAINST ('ahmad' IN BOOLEAN MODE);

-- Test mading_posts indexes
EXPLAIN SELECT p.*, u.name FROM mading_posts p 
JOIN users u ON p.author_id = u.id 
WHERE p.status = 'approved' AND p.unit_id = 1 
ORDER BY p.published_at DESC LIMIT 10;

-- Test units queries
EXPLAIN SELECT id, name, slug FROM units 
WHERE status = 'active' ORDER BY order_index;

PERFORMANCE EXPECTATIONS
======================================
- PPDB Search: 10-100x faster with FULLTEXT vs LIKE
- Mading Posts: 3-5x faster with composite indexes  
- Stats Queries: 5-10x faster with proper indexes
- Homepage Load: 2-3x faster with selective columns
- Admin Lists: 2-4x faster avoiding SELECT *

ROLLBACK PLAN
======================================
If needed, drop created indexes:
DROP INDEX ft_student_search ON ppdb_submissions;
DROP INDEX idx_mading_posts_filter_sort ON mading_posts;
DROP INDEX idx_mading_author_status ON mading_posts;
-- etc. for other indexes

MONITORING
======================================
Monitor query performance with:
SHOW PROCESSLIST;
SHOW ENGINE INNODB STATUS;
Analyze slow query log periodically.

DEPLOYMENT NOTES
======================================
- Run during low traffic period
- Test on staging environment first
- Monitor application logs post-deployment
- Have rollback plan ready

==========================================================