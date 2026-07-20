export interface StoreOperatingSettings {
  operating_mode?: 'auto' | 'manual_open' | 'manual_closed' | string;
  opening_time?: string; // Ex: '18:00'
  closing_time?: string; // Ex: '23:30'
  operating_days?: string; // JSON string e.g. '[0,1,2,3,4,5,6]'
  store_open?: boolean | string;
}

export const DAYS_OF_WEEK = [
  { id: 1, label: 'Segunda-feira', short: 'Seg' },
  { id: 2, label: 'Terça-feira', short: 'Ter' },
  { id: 3, label: 'Quarta-feira', short: 'Qua' },
  { id: 4, label: 'Quinta-feira', short: 'Qui' },
  { id: 5, label: 'Sexta-feira', short: 'Sex' },
  { id: 6, label: 'Sábado', short: 'Sáb' },
  { id: 0, label: 'Domingo', short: 'Dom' }
];

export function isStoreCurrentlyOpen(settings: StoreOperatingSettings): boolean {
  const mode = settings.operating_mode || 'auto';

  // Se o modo for forçado manualmente pelo administrador
  if (mode === 'manual_open') return true;
  if (mode === 'manual_closed') return false;

  // Se o modo for 'auto' (automático por horário de funcionamento)
  const openingTime = settings.opening_time || '18:00';
  const closingTime = settings.closing_time || '23:30';
  let days: number[] = [0, 1, 2, 3, 4, 5, 6];

  try {
    if (settings.operating_days) {
      const parsed = typeof settings.operating_days === 'string' ? JSON.parse(settings.operating_days) : settings.operating_days;
      if (Array.isArray(parsed)) days = parsed;
    }
  } catch (e) {
    days = [0, 1, 2, 3, 4, 5, 6];
  }

  const now = new Date();
  const currentDay = now.getDay(); // 0 = Domingo, 1 = Segunda...

  if (!days.includes(currentDay)) {
    return false;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [openH, openM] = openingTime.split(':').map(Number);
  const [closeH, closeM] = closingTime.split(':').map(Number);

  const openMinutes = (openH || 0) * 60 + (openM || 0);
  let closeMinutes = (closeH || 0) * 60 + (closeM || 0);

  // Tratamento para horários noturnos que atravessam a meia-noite (Ex: Abre 18:00 e fecha 02:00)
  if (closeMinutes < openMinutes) {
    closeMinutes += 24 * 60;
    const currentAdjusted = currentMinutes < openMinutes ? currentMinutes + 24 * 60 : currentMinutes;
    return currentAdjusted >= openMinutes && currentAdjusted < closeMinutes;
  }

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}
