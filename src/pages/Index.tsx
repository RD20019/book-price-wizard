
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BookCostCalculator from '@/components/BookCostCalculator';
import ProjectsList from '@/components/ProjectsList';
import ParametersConfig from '@/components/ParametersConfig';
import { Calculator, BookOpen, Settings } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Editorial Universitaria
                </h1>
                <p className="text-gray-600">Sistema de Estimación de Costos</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="calculator" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Calculadora
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Proyectos
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuración
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calculator">
            <BookCostCalculator />
          </TabsContent>

          <TabsContent value="projects">
            <ProjectsList />
          </TabsContent>

          <TabsContent value="settings">
            <ParametersConfig />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-500 text-sm">
            © 2024 Editorial Universitaria - Sistema de Estimación de Costos
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
