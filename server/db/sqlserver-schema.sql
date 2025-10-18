-- ============================================
-- SQL Server Schema for Personal Chatbox
-- ============================================

-- 1. Users Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[users] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [email] NVARCHAR(255) NOT NULL UNIQUE,
        [password_hash] NVARCHAR(255) NOT NULL,
        [username] NVARCHAR(100),
        [avatar_url] NVARCHAR(500),
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE(),
        [last_login_at] DATETIME2,
        [is_locked] INT DEFAULT 0,
        [locked_until] DATETIME2,
        [failed_login_attempts] INT DEFAULT 0
    );
END
GO

-- 2. OAuth Accounts Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[oauth_accounts]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[oauth_accounts] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [user_id] INT NOT NULL,
        [provider] NVARCHAR(50) NOT NULL,
        [provider_user_id] NVARCHAR(255) NOT NULL,
        [provider_email] NVARCHAR(255),
        [provider_username] NVARCHAR(100),
        [access_token] NVARCHAR(MAX),
        [refresh_token] NVARCHAR(MAX),
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_oauth_user FOREIGN KEY ([user_id]) REFERENCES [users]([id]) ON DELETE CASCADE,
        CONSTRAINT UQ_oauth_provider UNIQUE ([provider], [provider_user_id])
    );
END
GO

-- 3. Sessions Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[sessions]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[sessions] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [user_id] INT NOT NULL,
        [token] NVARCHAR(255) NOT NULL UNIQUE,
        [expires_at] DATETIME2 NOT NULL,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [ip_address] NVARCHAR(50),
        [user_agent] NVARCHAR(500),
        CONSTRAINT FK_session_user FOREIGN KEY ([user_id]) REFERENCES [users]([id]) ON DELETE CASCADE
    );
END
GO

-- 4. Login History Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[login_history]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[login_history] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [user_id] INT NOT NULL,
        [login_at] DATETIME2 DEFAULT GETDATE(),
        [ip_address] NVARCHAR(50),
        [user_agent] NVARCHAR(500),
        [success] INT DEFAULT 1,
        [failure_reason] NVARCHAR(500),
        CONSTRAINT FK_login_user FOREIGN KEY ([user_id]) REFERENCES [users]([id]) ON DELETE CASCADE
    );
END
GO

-- 5. Conversations Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[conversations]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[conversations] (
        [id] NVARCHAR(100) PRIMARY KEY,
        [user_id] INT NOT NULL,
        [title] NVARCHAR(500) NOT NULL,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_conversation_user FOREIGN KEY ([user_id]) REFERENCES [users]([id]) ON DELETE CASCADE
    );
    CREATE INDEX IX_conversations_user_id ON [conversations]([user_id]);
END
GO

-- 6. Messages Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[messages]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[messages] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [conversation_id] NVARCHAR(100) NOT NULL,
        [role] NVARCHAR(50) NOT NULL,
        [content] NVARCHAR(MAX) NOT NULL,
        [timestamp] DATETIME2 DEFAULT GETDATE(),
        [metadata] NVARCHAR(MAX),
        [status] NVARCHAR(50) DEFAULT 'done',
        [attachments] NVARCHAR(MAX),
        CONSTRAINT FK_message_conversation FOREIGN KEY ([conversation_id]) REFERENCES [conversations]([id]) ON DELETE CASCADE
    );
    CREATE INDEX IX_messages_conversation_id ON [messages]([conversation_id]);
END
GO

-- 7. User Configs Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[user_configs]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[user_configs] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [user_id] INT NOT NULL UNIQUE,
        [theme] NVARCHAR(20) DEFAULT 'light',
        [language] NVARCHAR(10) DEFAULT 'en',
        [ai_model] NVARCHAR(50),
        [api_key_encrypted] NVARCHAR(MAX),
        [settings] NVARCHAR(MAX),
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_config_user FOREIGN KEY ([user_id]) REFERENCES [users]([id]) ON DELETE CASCADE
    );
END
GO

-- 8. Notes Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[notes]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[notes] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [user_id] INT NOT NULL,
        [title] NVARCHAR(500) NOT NULL,
        [content] NVARCHAR(MAX),
        [category] NVARCHAR(100),
        [tags] NVARCHAR(MAX),
        [is_favorite] INT DEFAULT 0,
        [is_archived] INT DEFAULT 0,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_note_user FOREIGN KEY ([user_id]) REFERENCES [users]([id]) ON DELETE CASCADE
    );
    CREATE INDEX IX_notes_user_id ON [notes]([user_id]);
    CREATE INDEX IX_notes_category ON [notes]([category]);
END
GO

-- 9. Documents Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[documents]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[documents] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [user_id] INT NOT NULL,
        [title] NVARCHAR(500) NOT NULL,
        [content] NVARCHAR(MAX),
        [file_path] NVARCHAR(1000),
        [file_type] NVARCHAR(50),
        [file_size] BIGINT,
        [category] NVARCHAR(100),
        [tags] NVARCHAR(MAX),
        [access_count] INT DEFAULT 0,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_document_user FOREIGN KEY ([user_id]) REFERENCES [users]([id]) ON DELETE CASCADE
    );
    CREATE INDEX IX_documents_user_id ON [documents]([user_id]);
    CREATE INDEX IX_documents_category ON [documents]([category]);
END
GO

-- 10. Password Vault Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[password_vault]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[password_vault] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [user_id] INT NOT NULL,
        [site_name] NVARCHAR(255) NOT NULL,
        [site_url] NVARCHAR(1000),
        [username] NVARCHAR(255),
        [password_encrypted] NVARCHAR(MAX) NOT NULL,
        [notes] NVARCHAR(MAX),
        [category] NVARCHAR(100),
        [is_favorite] INT DEFAULT 0,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE(),
        [last_used_at] DATETIME2,
        CONSTRAINT FK_vault_user FOREIGN KEY ([user_id]) REFERENCES [users]([id]) ON DELETE CASCADE
    );
    CREATE INDEX IX_vault_user_id ON [password_vault]([user_id]);
END
GO

-- 11. User MCP Configs Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[user_mcp_configs]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[user_mcp_configs] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [user_id] INT NOT NULL,
        [service_name] NVARCHAR(100) NOT NULL,
        [config_data] NVARCHAR(MAX),
        [is_enabled] INT DEFAULT 1,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_mcp_user FOREIGN KEY ([user_id]) REFERENCES [users]([id]) ON DELETE CASCADE,
        CONSTRAINT UQ_user_mcp UNIQUE ([user_id], [service_name])
    );
END
GO

-- 12. Knowledge Base Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[knowledge_base]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[knowledge_base] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [user_id] INT NOT NULL,
        [title] NVARCHAR(500) NOT NULL,
        [content] NVARCHAR(MAX),
        [category] NVARCHAR(100),
        [tags] NVARCHAR(MAX),
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_knowledge_user FOREIGN KEY ([user_id]) REFERENCES [users]([id]) ON DELETE CASCADE
    );
    CREATE INDEX IX_knowledge_user_id ON [knowledge_base]([user_id]);
END
GO

-- 13. Personas Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[personas]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[personas] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [user_id] INT NOT NULL,
        [name] NVARCHAR(100) NOT NULL,
        [description] NVARCHAR(MAX),
        [system_prompt] NVARCHAR(MAX),
        [avatar] NVARCHAR(500),
        [model] NVARCHAR(50),
        [is_active] INT DEFAULT 1,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_persona_user FOREIGN KEY ([user_id]) REFERENCES [users]([id]) ON DELETE CASCADE
    );
END
GO

-- 14. Workflows Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[workflows]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[workflows] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [user_id] INT NOT NULL,
        [name] NVARCHAR(200) NOT NULL,
        [description] NVARCHAR(MAX),
        [workflow_data] NVARCHAR(MAX),
        [is_active] INT DEFAULT 1,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_workflow_user FOREIGN KEY ([user_id]) REFERENCES [users]([id]) ON DELETE CASCADE
    );
END
GO

PRINT 'SQL Server schema created successfully!';
