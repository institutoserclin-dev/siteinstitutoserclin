import { useState } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import ptBR from 'date-fns/locale/pt-BR';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, User, Users } from "lucide-react";

// Configuração de local (Brasil)
const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Dados Mockados (Simulando o Banco de Dados)
const initialEvents = [
  {
    id: 1,
    title: 'Dr. Rômulo - Consulta (Sala 1)',
    start: new Date(2024, 1, 12, 10, 0), // Ano, Mês (0-index), Dia, Hora, Min
    end: new Date(2024, 1, 12, 11, 0),
    resourceId: 1, // Sala 1
    professional: 'Rômulo',
    color: '#1e3a8a' // Azul SerClin
  },
  {
    id: 2,
    title: 'Dra. Helenara - Terapia (Sala 2)',
    start: new Date(2024, 1, 12, 10, 0),
    end: new Date(2024, 1, 12, 11, 0),
    resourceId: 2, // Sala 2
    professional: 'Helenara',
    color: '#d97706' // Laranja/Dourado
  },
  {
    id: 3,
    title: 'BLOQUEIO - Manutenção',
    start: new Date(2024, 1, 12, 14, 0),
    end: new Date(2024, 1, 12, 16, 0),
    resourceId: 1,
    professional: 'Sistema',
    color: '#ef4444' // Vermelho
  }
];

export function SystemDemo() {
  const [view, setView] = useState('day'); // Começa vendo o dia
  const [userRole, setUserRole] = useState<'admin' | 'professional' | 'patient'>('admin');

  // Função fictícia para checar choque de horário
  const checkConflict = (sala: number, inicio: Date, fim: Date) => {
    // Aqui entraria a lógica que varre o banco de dados
    console.log(`Verificando conflito na Sala ${sala} das ${format(inicio, 'HH:mm')} às ${format(fim, 'HH:mm')}`);
    return false; // Por enquanto retorna falso
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        
        {/* Cabeçalho do Painel */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-primary">Gestão SerClin</h2>
            <p className="text-gray-600">Simulação do Sistema de Agendamento</p>
          </div>
          
          {/* Seletor de Perfil (Apenas para teste visual) */}
          <div className="flex gap-2 bg-white p-2 rounded-lg shadow-sm border">
            <Button 
              variant={userRole === 'admin' ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setUserRole('admin')}
              className="gap-2"
            >
              <Users size={16} /> Gerente/Secretária
            </Button>
            <Button 
              variant={userRole === 'professional' ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setUserRole('professional')}
              className="gap-2"
            >
              <User size={16} /> Profissional
            </Button>
            <Button 
              variant={userRole === 'patient' ? "default" : "ghost"} 
              size="sm" 
              onClick={() => setUserRole('patient')}
              className="gap-2"
            >
              <Lock size={16} /> Paciente
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          
          {/* Barra Lateral (Log e Filtros) */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Salas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-100">
                  <span className="font-medium text-sm">Consultório 01</span>
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">Livre agora</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-100">
                  <span className="font-medium text-sm">Consultório 02</span>
                  <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">Ocupado</Badge>
                </div>
              </CardContent>
            </Card>

            {userRole === 'admin' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Log do Sistema</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-xs space-y-3 text-gray-600">
                    <li className="border-l-2 border-blue-500 pl-2">
                      <span className="font-bold">10:42</span> - Secretária agendou Dr. Rômulo (Sala 1).
                    </li>
                    <li className="border-l-2 border-orange-500 pl-2">
                      <span className="font-bold">10:30</span> - Dra. Helenara bloqueou agenda (Almoço).
                    </li>
                    <li className="border-l-2 border-red-500 pl-2">
                      <span className="font-bold">09:15</span> - Erro: Tentativa de choque de horário na Sala 2.
                    </li>
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* O Calendário */}
          <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-lg border border-gray-100 h-[600px]">
            <Calendar
              localizer={localizer}
              events={initialEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              messages={{
                next: "Próximo",
                previous: "Anterior",
                today: "Hoje",
                month: "Mês",
                week: "Semana",
                day: "Dia"
              }}
              culture='pt-BR'
              eventPropGetter={(event) => {
                const isMyEvent = userRole === 'professional' ? event.professional === 'Rômulo' : true;
                const backgroundColor = isMyEvent ? event.color : '#e5e7eb';
                const color = isMyEvent ? '#fff' : '#6b7280';
                return { style: { backgroundColor, color } };
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}