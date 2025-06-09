
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Eye, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Proyecto {
  id: string;
  titulo: string;
  autor: string;
  isbn: string;
  num_paginas: number;
  tirada: number;
  costo_estimado: number;
  precio_venta_sugerido: number;
  portada_url: string;
  created_at: string;
  tipos_papel: {
    nombre: string;
  };
  tipos_tapa: {
    nombre: string;
  };
}

const ProjectsList = () => {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('proyectos_libros')
        .select(`
          *,
          tipos_papel(nombre),
          tipos_tapa(nombre)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProyectos(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Error al cargar los proyectos');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este proyecto?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('proyectos_libros')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProyectos(prev => prev.filter(p => p.id !== id));
      toast.success('Proyecto eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Error al eliminar el proyecto');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (proyectos.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay proyectos</h3>
          <p className="text-gray-500 text-center">
            Aún no has creado ningún proyecto. ¡Crea tu primer cálculo de costos!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-6">Proyectos Guardados</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {proyectos.map((proyecto) => (
          <Card key={proyecto.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg line-clamp-2">{proyecto.titulo}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteProject(proyecto.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {proyecto.autor && (
                <p className="text-sm text-gray-600">por {proyecto.autor}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {proyecto.portada_url && (
                <div className="w-full h-32 bg-gray-100 rounded-md overflow-hidden">
                  <img
                    src={proyecto.portada_url}
                    alt={`Portada de ${proyecto.titulo}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Páginas:</span> {proyecto.num_paginas}
                </div>
                <div>
                  <span className="font-medium">Tirada:</span> {proyecto.tirada}
                </div>
              </div>

              {proyecto.tipos_papel && (
                <Badge variant="secondary" className="text-xs">
                  {proyecto.tipos_papel.nombre}
                </Badge>
              )}
              
              {proyecto.tipos_tapa && (
                <Badge variant="outline" className="text-xs ml-2">
                  {proyecto.tipos_tapa.nombre}
                </Badge>
              )}

              <div className="pt-3 border-t">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Costo Total:</span>
                    <span className="font-semibold">${proyecto.costo_estimado?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Precio Sugerido:</span>
                    <span className="font-semibold text-green-600">${proyecto.precio_venta_sugerido?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Por ejemplar:</span>
                    <span>${((proyecto.precio_venta_sugerido || 0) / proyecto.tirada).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center text-xs text-gray-500 pt-2">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(proyecto.created_at).toLocaleDateString('es-ES')}
              </div>

              {proyecto.isbn && (
                <div className="text-xs text-gray-500">
                  <span className="font-medium">ISBN:</span> {proyecto.isbn}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProjectsList;
