
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Save } from 'lucide-react';
import { toast } from 'sonner';

interface ParametrosCostos {
  id: string;
  depreciacion_equipo: number;
  costo_energia_kwh: number;
  porcentaje_derechos_autor: number;
  porcentaje_costos_admin: number;
}

const ParametersConfig = () => {
  const [parametros, setParametros] = useState<ParametrosCostos | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadParameters();
  }, []);

  const loadParameters = async () => {
    try {
      const { data, error } = await supabase
        .from('parametros_costos')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      setParametros(data);
    } catch (error) {
      console.error('Error loading parameters:', error);
      toast.error('Error al cargar los parámetros');
    } finally {
      setIsLoading(false);
    }
  };

  const updateParameter = (field: keyof Omit<ParametrosCostos, 'id'>, value: number) => {
    if (!parametros) return;
    setParametros(prev => prev ? { ...prev, [field]: value } : null);
  };

  const saveParameters = async () => {
    if (!parametros) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('parametros_costos')
        .update({
          depreciacion_equipo: parametros.depreciacion_equipo,
          costo_energia_kwh: parametros.costo_energia_kwh,
          porcentaje_derechos_autor: parametros.porcentaje_derechos_autor,
          porcentaje_costos_admin: parametros.porcentaje_costos_admin,
          updated_at: new Date().toISOString()
        })
        .eq('id', parametros.id);

      if (error) throw error;
      toast.success('Parámetros actualizados exitosamente');
    } catch (error) {
      console.error('Error saving parameters:', error);
      toast.error('Error al guardar los parámetros');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!parametros) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Settings className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Error al cargar parámetros</h3>
          <p className="text-gray-500 text-center">
            No se pudieron cargar los parámetros de configuración.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Configuración de Parámetros de Costos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="depreciacion">Depreciación del Equipo (%)</Label>
              <Input
                id="depreciacion"
                type="number"
                step="0.01"
                value={parametros.depreciacion_equipo}
                onChange={(e) => updateParameter('depreciacion_equipo', parseFloat(e.target.value) || 0)}
                placeholder="0.05"
              />
              <p className="text-xs text-gray-500 mt-1">
                Porcentaje de depreciación aplicado sobre el costo base
              </p>
            </div>

            <div>
              <Label htmlFor="energia">Costo de Energía ($/kWh)</Label>
              <Input
                id="energia"
                type="number"
                step="0.01"
                value={parametros.costo_energia_kwh}
                onChange={(e) => updateParameter('costo_energia_kwh', parseFloat(e.target.value) || 0)}
                placeholder="0.12"
              />
              <p className="text-xs text-gray-500 mt-1">
                Costo por kilovatio-hora de energía eléctrica
              </p>
            </div>

            <div>
              <Label htmlFor="derechos">Derechos de Autor (%)</Label>
              <Input
                id="derechos"
                type="number"
                step="0.01"
                value={parametros.porcentaje_derechos_autor}
                onChange={(e) => updateParameter('porcentaje_derechos_autor', parseFloat(e.target.value) || 0)}
                placeholder="10.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Porcentaje aplicado sobre el costo base para derechos de autor
              </p>
            </div>

            <div>
              <Label htmlFor="admin">Costos Administrativos (%)</Label>
              <Input
                id="admin"
                type="number"
                step="0.01"
                value={parametros.porcentaje_costos_admin}
                onChange={(e) => updateParameter('porcentaje_costos_admin', parseFloat(e.target.value) || 0)}
                placeholder="15.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Porcentaje aplicado sobre el costo base para gastos administrativos
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-2">Información del Cálculo</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• El costo base incluye papel y tapa</p>
              <p>• La depreciación se calcula sobre el costo base</p>
              <p>• El costo de energía se estima en 0.5 kWh por ejemplar</p>
              <p>• Los derechos de autor y costos administrativos se calculan sobre el costo base</p>
              <p>• El precio de venta sugerido incluye un margen del 40%</p>
            </div>
          </div>

          <Button 
            onClick={saveParameters} 
            disabled={isSaving}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ParametersConfig;
