
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Calculator, BookOpen } from 'lucide-react';

interface TipoPapel {
  id: string;
  nombre: string;
  costo_por_hoja: number;
  descripcion: string;
}

interface TipoTapa {
  id: string;
  nombre: string;
  costo_adicional: number;
  descripcion: string;
}

interface ParametrosCostos {
  depreciacion_equipo: number;
  costo_energia_kwh: number;
  porcentaje_derechos_autor: number;
  porcentaje_costos_admin: number;
}

interface FormData {
  titulo: string;
  autor: string;
  isbn: string;
  num_paginas: number;
  tirada: number;
  tipo_papel_id: string;
  tipo_tapa_id: string;
  portada_file: File | null;
}

const BookCostCalculator = () => {
  const [formData, setFormData] = useState<FormData>({
    titulo: '',
    autor: '',
    isbn: '',
    num_paginas: 0,
    tirada: 0,
    tipo_papel_id: '',
    tipo_tapa_id: '',
    portada_file: null
  });

  const [tiposPapel, setTiposPapel] = useState<TipoPapel[]>([]);
  const [tiposTapa, setTiposTapa] = useState<TipoTapa[]>([]);
  const [parametros, setParametros] = useState<ParametrosCostos | null>(null);
  const [costoEstimado, setCostoEstimado] = useState<number>(0);
  const [precioSugerido, setPrecioSugerido] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Cargar tipos de papel
      const { data: papelData, error: papelError } = await supabase
        .from('tipos_papel')
        .select('*')
        .order('nombre');

      if (papelError) throw papelError;
      setTiposPapel(papelData || []);

      // Cargar tipos de tapa
      const { data: tapaData, error: tapaError } = await supabase
        .from('tipos_tapa')
        .select('*')
        .order('nombre');

      if (tapaError) throw tapaError;
      setTiposTapa(tapaData || []);

      // Cargar parámetros de costos
      const { data: paramData, error: paramError } = await supabase
        .from('parametros_costos')
        .select('*')
        .limit(1)
        .single();

      if (paramError) throw paramError;
      setParametros(paramData);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Error al cargar los datos iniciales');
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setFormData(prev => ({ ...prev, portada_file: file }));
      } else {
        toast.error('Por favor selecciona un archivo de imagen válido');
      }
    }
  };

  const calculateCost = () => {
    if (!parametros || !formData.tipo_papel_id || !formData.tipo_tapa_id) {
      toast.error('Faltan datos para realizar el cálculo');
      return;
    }

    setIsCalculating(true);

    try {
      const tipoPapel = tiposPapel.find(p => p.id === formData.tipo_papel_id);
      const tipoTapa = tiposTapa.find(t => t.id === formData.tipo_tapa_id);

      if (!tipoPapel || !tipoTapa) {
        throw new Error('Tipo de papel o tapa no encontrado');
      }

      // Calcular costo del papel (páginas / 2 porque cada hoja tiene 2 páginas)
      const hojasPorEjemplar = Math.ceil(formData.num_paginas / 2);
      const costoPapelTotal = hojasPorEjemplar * tipoPapel.costo_por_hoja * formData.tirada;

      // Costo de la tapa
      const costoTapaTotal = tipoTapa.costo_adicional * formData.tirada;

      // Costos base
      const costoBase = costoPapelTotal + costoTapaTotal;

      // Aplicar porcentajes adicionales
      const depreciacion = costoBase * (parametros.depreciacion_equipo / 100);
      const energia = formData.tirada * 0.5 * parametros.costo_energia_kwh; // Estimado 0.5 kWh por ejemplar
      const derechosAutor = costoBase * (parametros.porcentaje_derechos_autor / 100);
      const costosAdmin = costoBase * (parametros.porcentaje_costos_admin / 100);

      const costoTotal = costoBase + depreciacion + energia + derechosAutor + costosAdmin;
      const precioVenta = costoTotal * 1.4; // Margen del 40%

      setCostoEstimado(costoTotal);
      setPrecioSugerido(precioVenta);

      toast.success('Cálculo realizado exitosamente');
    } catch (error) {
      console.error('Error in calculation:', error);
      toast.error('Error al realizar el cálculo');
    } finally {
      setIsCalculating(false);
    }
  };

  const uploadPortada = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `portadas/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('portadas')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('portadas')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const saveProject = async () => {
    if (!formData.titulo || !formData.num_paginas || !formData.tirada) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    setIsSubmitting(true);

    try {
      let portadaUrl = null;

      // Subir portada si existe
      if (formData.portada_file) {
        portadaUrl = await uploadPortada(formData.portada_file);
        if (!portadaUrl) {
          throw new Error('Error al subir la portada');
        }
      }

      // Guardar proyecto
      const { error } = await supabase
        .from('proyectos_libros')
        .insert({
          titulo: formData.titulo,
          autor: formData.autor || null,
          isbn: formData.isbn || null,
          num_paginas: formData.num_paginas,
          tirada: formData.tirada,
          tipo_papel_id: formData.tipo_papel_id || null,
          tipo_tapa_id: formData.tipo_tapa_id || null,
          portada_url: portadaUrl,
          costo_estimado: costoEstimado,
          precio_venta_sugerido: precioSugerido
        });

      if (error) throw error;

      toast.success('Proyecto guardado exitosamente');
      
      // Limpiar formulario
      setFormData({
        titulo: '',
        autor: '',
        isbn: '',
        num_paginas: 0,
        tirada: 0,
        tipo_papel_id: '',
        tipo_tapa_id: '',
        portada_file: null
      });
      setCostoEstimado(0);
      setPrecioSugerido(0);

    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Error al guardar el proyecto');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Calculadora de Costos de Libros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Información básica del libro */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => handleInputChange('titulo', e.target.value)}
                placeholder="Título del libro"
              />
            </div>
            <div>
              <Label htmlFor="autor">Autor</Label>
              <Input
                id="autor"
                value={formData.autor}
                onChange={(e) => handleInputChange('autor', e.target.value)}
                placeholder="Nombre del autor"
              />
            </div>
            <div>
              <Label htmlFor="isbn">ISBN</Label>
              <Input
                id="isbn"
                value={formData.isbn}
                onChange={(e) => handleInputChange('isbn', e.target.value)}
                placeholder="ISBN del libro"
              />
            </div>
            <div>
              <Label htmlFor="num_paginas">Número de Páginas *</Label>
              <Input
                id="num_paginas"
                type="number"
                value={formData.num_paginas || ''}
                onChange={(e) => handleInputChange('num_paginas', parseInt(e.target.value) || 0)}
                placeholder="Número de páginas"
              />
            </div>
            <div>
              <Label htmlFor="tirada">Tirada (Cantidad de Ejemplares) *</Label>
              <Input
                id="tirada"
                type="number"
                value={formData.tirada || ''}
                onChange={(e) => handleInputChange('tirada', parseInt(e.target.value) || 0)}
                placeholder="Cantidad de ejemplares"
              />
            </div>
          </div>

          {/* Selección de materiales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tipo_papel">Tipo de Papel</Label>
              <Select value={formData.tipo_papel_id} onValueChange={(value) => handleInputChange('tipo_papel_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tipo de papel" />
                </SelectTrigger>
                <SelectContent>
                  {tiposPapel.map((papel) => (
                    <SelectItem key={papel.id} value={papel.id}>
                      {papel.nombre} - ${papel.costo_por_hoja}/hoja
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tipo_tapa">Tipo de Tapa</Label>
              <Select value={formData.tipo_tapa_id} onValueChange={(value) => handleInputChange('tipo_tapa_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tipo de tapa" />
                </SelectTrigger>
                <SelectContent>
                  {tiposTapa.map((tapa) => (
                    <SelectItem key={tapa.id} value={tapa.id}>
                      {tapa.nombre} - +${tapa.costo_adicional}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Upload de portada */}
          <div>
            <Label htmlFor="portada">Portada del Libro</Label>
            <div className="flex items-center gap-2">
              <Input
                id="portada"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="flex-1"
              />
              <Upload className="h-5 w-5 text-gray-500" />
            </div>
            {formData.portada_file && (
              <p className="text-sm text-green-600 mt-2">
                Archivo seleccionado: {formData.portada_file.name}
              </p>
            )}
          </div>

          {/* Botón de cálculo */}
          <Button 
            onClick={calculateCost} 
            disabled={isCalculating || !formData.num_paginas || !formData.tirada}
            className="w-full"
          >
            <Calculator className="h-4 w-4 mr-2" />
            {isCalculating ? 'Calculando...' : 'Calcular Costo'}
          </Button>

          {/* Resultados */}
          {costoEstimado > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2">Resultados del Cálculo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Costo Total Estimado</Label>
                    <p className="text-2xl font-bold text-blue-600">
                      ${costoEstimado.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      ${(costoEstimado / formData.tirada).toFixed(2)} por ejemplar
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Precio de Venta Sugerido</Label>
                    <p className="text-2xl font-bold text-green-600">
                      ${precioSugerido.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      ${(precioSugerido / formData.tirada).toFixed(2)} por ejemplar
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botón de guardar */}
          {costoEstimado > 0 && (
            <Button 
              onClick={saveProject} 
              disabled={isSubmitting}
              className="w-full"
              variant="outline"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Proyecto'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BookCostCalculator;
