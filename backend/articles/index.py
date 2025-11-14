import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: API для управления статьями (CRUD операции)
    Args: event - dict с httpMethod, body, queryStringParameters
          context - объект с request_id
    Returns: HTTP response dict
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            article_id = event.get('queryStringParameters', {}).get('id')
            
            if article_id:
                cur.execute(
                    "SELECT * FROM articles WHERE id = %s",
                    (article_id,)
                )
                article = cur.fetchone()
                if not article:
                    return {
                        'statusCode': 404,
                        'headers': headers,
                        'body': json.dumps({'error': 'Article not found'})
                    }
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps(dict(article))
                }
            else:
                cur.execute(
                    "SELECT * FROM articles WHERE is_published = true ORDER BY display_order, created_at DESC"
                )
                articles = cur.fetchall()
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps([dict(row) for row in articles], default=str)
                }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            
            cur.execute(
                """
                INSERT INTO articles (title, short_description, full_content, icon, display_order, is_published)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id, title, short_description, full_content, icon, created_at, display_order, is_published
                """,
                (
                    body.get('title'),
                    body.get('short_description'),
                    body.get('full_content'),
                    body.get('icon', 'FileText'),
                    body.get('display_order', 0),
                    body.get('is_published', True)
                )
            )
            article = cur.fetchone()
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': headers,
                'body': json.dumps(dict(article), default=str)
            }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            article_id = body.get('id')
            
            if not article_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Article ID required'})
                }
            
            cur.execute(
                """
                UPDATE articles 
                SET title = %s, short_description = %s, full_content = %s, 
                    icon = %s, display_order = %s, is_published = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING id, title, short_description, full_content, icon, updated_at, display_order, is_published
                """,
                (
                    body.get('title'),
                    body.get('short_description'),
                    body.get('full_content'),
                    body.get('icon'),
                    body.get('display_order'),
                    body.get('is_published'),
                    article_id
                )
            )
            article = cur.fetchone()
            conn.commit()
            
            if not article:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Article not found'})
                }
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(dict(article), default=str)
            }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters', {})
            article_id = params.get('id')
            
            if not article_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Article ID required'})
                }
            
            cur.execute("DELETE FROM articles WHERE id = %s RETURNING id", (article_id,))
            deleted = cur.fetchone()
            conn.commit()
            
            if not deleted:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Article not found'})
                }
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'success': True, 'id': article_id})
            }
        
        return {
            'statusCode': 405,
            'headers': headers,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        cur.close()
        conn.close()
