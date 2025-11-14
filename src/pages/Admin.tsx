import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const API_URL = 'https://functions.poehali.dev/941f1118-e5bc-48a9-8a2d-ff4bd917dc4b';

interface Article {
  id?: number;
  title: string;
  short_description: string;
  full_content: string;
  icon: string;
  display_order: number;
  is_published: boolean;
}

const Admin = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [formData, setFormData] = useState<Article>({
    title: '',
    short_description: '',
    full_content: '',
    icon: 'FileText',
    display_order: 0,
    is_published: true
  });
  const { toast } = useToast();

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setArticles(data);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить статьи',
        variant: 'destructive'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const method = editingArticle ? 'PUT' : 'POST';
      const body = editingArticle ? { ...formData, id: editingArticle.id } : formData;
      
      const response = await fetch(API_URL, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        toast({
          title: 'Успех',
          description: editingArticle ? 'Статья обновлена' : 'Статья создана'
        });
        resetForm();
        loadArticles();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить статью',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить статью?')) return;
    
    try {
      await fetch(`${API_URL}?id=${id}`, { method: 'DELETE' });
      toast({ title: 'Успех', description: 'Статья удалена' });
      loadArticles();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить статью',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setFormData(article);
  };

  const resetForm = () => {
    setEditingArticle(null);
    setFormData({
      title: '',
      short_description: '',
      full_content: '',
      icon: 'FileText',
      display_order: 0,
      is_published: true
    });
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-heading font-bold text-secondary mb-2">
              Админ-панель
            </h1>
            <p className="text-muted-foreground">Управление статьями на сайте</p>
          </div>
          <a href="/">
            <Button variant="outline">
              <Icon name="ArrowLeft" size={16} className="mr-2" />
              На главную
            </Button>
          </a>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>
                {editingArticle ? 'Редактировать статью' : 'Новая статья'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Заголовок</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="short_description">Краткое описание</Label>
                  <Textarea
                    id="short_description"
                    value={formData.short_description}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_content">Полный текст</Label>
                  <Textarea
                    id="full_content"
                    value={formData.full_content}
                    onChange={(e) => setFormData({ ...formData, full_content: e.target.value })}
                    rows={10}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="icon">Иконка</Label>
                    <Input
                      id="icon"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="FileText"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="display_order">Порядок</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_published"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="is_published">Опубликовано</Label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingArticle ? 'Обновить' : 'Создать'}
                  </Button>
                  {editingArticle && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Отмена
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-2xl font-heading font-bold text-secondary">
              Статьи ({articles.length})
            </h2>
            {articles.map((article) => (
              <Card key={article.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{article.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {article.short_description}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-primary/10 rounded">
                          {article.icon}
                        </span>
                        <span className="text-xs px-2 py-1 bg-secondary/10 rounded">
                          #{article.display_order}
                        </span>
                        {article.is_published && (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                            Опубликовано
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(article)}
                      >
                        <Icon name="Edit" size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(article.id!)}
                      >
                        <Icon name="Trash2" size={16} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;