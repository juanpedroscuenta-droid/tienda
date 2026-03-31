import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2 } from 'lucide-react';

interface ConfigurationPanelProps {
  onNavigateToSubaccounts: () => void;
  onNavigateToProfile: () => void;
  onNavigateToMailConfig: () => void;
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  onNavigateToSubaccounts,
  onNavigateToProfile,
  onNavigateToMailConfig
}) => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Configuración
        </h1>
        <p className="text-slate-600">
          Gestionar la información y la configuración de su empresa
        </p>
      </div>

      {/* Menú de opciones de configuración */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Opción: Perfil de empresa */}
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-300"
          onClick={onNavigateToProfile}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-lg">Perfil de empresa</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Gestionar información general y logo de la empresa
            </p>
          </CardContent>
        </Card>

        {/* Opción: Subcuentas */}
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-green-300"
          onClick={onNavigateToSubaccounts}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-lg">Subcuentas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Administrar subcuentas con accesos privilegiados
            </p>
          </CardContent>
        </Card>

        {/* Opción: Configuración de Correo */}
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-indigo-300"
          onClick={onNavigateToMailConfig}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
              </div>
              <span className="text-lg">Correos y SMTP</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Credenciales de aplicación para envíos
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
