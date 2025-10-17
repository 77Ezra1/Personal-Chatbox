-- 添加用户资料相关字段
-- 21: 添加用户资料支持

-- 为 users 表添加新字段
ALTER TABLE users ADD COLUMN signature TEXT;
ALTER TABLE users ADD COLUMN theme TEXT DEFAULT 'light';
ALTER TABLE users ADD COLUMN language TEXT DEFAULT 'zh-CN';
ALTER TABLE users ADD COLUMN timezone TEXT DEFAULT 'Asia/Shanghai';
ALTER TABLE users ADD COLUMN currency TEXT DEFAULT 'CNY';
ALTER TABLE users ADD COLUMN date_format TEXT DEFAULT 'YYYY-MM-DD';
