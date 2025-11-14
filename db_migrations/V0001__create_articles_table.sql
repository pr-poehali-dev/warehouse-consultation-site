
CREATE TABLE IF NOT EXISTS articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    short_description TEXT NOT NULL,
    full_content TEXT NOT NULL,
    icon VARCHAR(100) DEFAULT 'FileText',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_published BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0
);

CREATE INDEX idx_articles_published ON articles(is_published, display_order);
