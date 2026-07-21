import { supabase } from '../lib/supabase';

export interface DeliveryRule {
  maxDistance: number;
  fee: number;
}

export interface DeliverySettings {
  storeLat: number | null;
  storeLng: number | null;
  baseFee: number;
  rules: DeliveryRule[];
}

export const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const safeFetchJson = async (url: string): Promise<any> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { 
      signal: controller.signal,
      headers: { 'User-Agent': 'PizzaSennaApp/1.0' } 
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const text = await res.text();
    if (!text || (!text.trim().startsWith('{') && !text.trim().startsWith('['))) {
      return null;
    }
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export const calculateRoadDistance = async (lat1: number, lon1: number, lat2: number, lon2: number): Promise<number> => {
  const haversineDist = calculateHaversineDistance(lat1, lon1, lat2, lon2);
  
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
  const data = await safeFetchJson(osrmUrl);
  if (data && data.routes && data.routes.length > 0 && data.routes[0].distance) {
    const roadKm = parseFloat((data.routes[0].distance / 1000).toFixed(2));
    if (roadKm > 0) return roadKm;
  }

  // Fallback: aplicar fator de tortuosidade urbana (1.35x a distância em linha reta)
  return parseFloat((haversineDist * 1.35).toFixed(2));
};

let cachedSettings: DeliverySettings | null = null;
let lastCacheTime = 0;

export const loadDeliverySettings = async (): Promise<DeliverySettings> => {
  if (cachedSettings && Date.now() - lastCacheTime < 60000) {
    return cachedSettings;
  }

  try {
    const { data } = await supabase.from('system_settings').select('key, value');
    if (data) {
      const latSetting = data.find(s => s.key === 'store_latitude');
      const lngSetting = data.find(s => s.key === 'store_longitude');
      const feeSetting = data.find(s => s.key === 'delivery_base_fee');
      const rulesSetting = data.find(s => s.key === 'delivery_rules');

      let rules: DeliveryRule[] = [];
      if (rulesSetting?.value) {
        try {
          rules = JSON.parse(rulesSetting.value);
        } catch {
          rules = [];
        }
      }

      cachedSettings = {
        storeLat: latSetting?.value ? parseFloat(latSetting.value) : -19.457837,
        storeLng: lngSetting?.value ? parseFloat(lngSetting.value) : -44.243581,
        baseFee: feeSetting?.value ? parseFloat(feeSetting.value) : 5.00,
        rules
      };
      lastCacheTime = Date.now();
      return cachedSettings;
    }
  } catch (err) {
    console.error('Erro ao carregar configurações de entrega:', err);
  }

  return {
    storeLat: -19.457837,
    storeLng: -44.243581,
    baseFee: 5.00,
    rules: []
  };
};

export const getFeeForDistance = (distanceKm: number, settings: DeliverySettings): number => {
  if (!settings.rules || settings.rules.length === 0) {
    return settings.baseFee;
  }

  const sortedRules = [...settings.rules].sort((a, b) => Number(a.maxDistance) - Number(b.maxDistance));
  const matchedRule = sortedRules.find(r => distanceKm <= Number(r.maxDistance));

  if (matchedRule) {
    return Number(matchedRule.fee);
  }

  // Se exceder todas as regras, usa a taxa da maior regra
  const highestRule = sortedRules[sortedRules.length - 1];
  return highestRule ? Number(highestRule.fee) : settings.baseFee;
};

// Geocodificação robusta multi-provedor (Photon API Komoot + Nominatim + ViaCEP)
export const geocodeAddressObj = async (addressObj: any): Promise<{ lat: number; lon: number } | null> => {
  if (!addressObj) return null;

  const rawAddress = addressObj.address || '';
  const rawNeighborhood = addressObj.neighborhood || '';
  const city = addressObj.city || 'Sete Lagoas';
  const state = addressObj.state || 'MG';

  let streetOnly = rawAddress
    .replace(/,?\s*\d+.*$/, '')
    .replace(/n[º°]?\s*\d+/i, '')
    .trim();
  
  streetOnly = streetOnly
    .replace(/^R\.\s*/i, 'Rua ')
    .replace(/^Av\.\s*/i, 'Avenida ')
    .replace(/^Pça\.\s*/i, 'Praça ');

  // 1. Provedor 1: Photon API Komoot (Sem limite de requisição, resposta rápida)
  const photonQuery = `${streetOnly} ${city} ${state}`.trim();
  if (streetOnly) {
    const photonData = await safeFetchJson(`https://photon.komoot.io/api/?q=${encodeURIComponent(photonQuery)}`);
    if (photonData && photonData.features && photonData.features.length > 0) {
      const feat = photonData.features.find((f: any) => {
        const p = f.properties;
        return (p.city && p.city.toLowerCase().includes(city.toLowerCase())) ||
               (p.county && p.county.toLowerCase().includes(city.toLowerCase())) ||
               (p.state && p.state.toLowerCase().includes('minas'));
      }) || photonData.features[0];

      if (feat && feat.geometry && feat.geometry.coordinates) {
        return {
          lat: feat.geometry.coordinates[1],
          lon: feat.geometry.coordinates[0]
        };
      }
    }
  }

  // 2. Provedor 2: Nominatim com múltiplos candidatos seguros
  const candidates = [
    streetOnly && rawNeighborhood ? `${streetOnly}, ${rawNeighborhood}, ${city}, ${state}, Brasil` : null,
    streetOnly ? `${streetOnly}, ${city}, ${state}, Brasil` : null,
    addressObj.zipcode ? `${addressObj.zipcode.replace(/\D/g, '')}, Brasil` : null,
    rawNeighborhood ? `${rawNeighborhood}, ${city}, ${state}, Brasil` : null
  ].filter(Boolean);

  for (const query of candidates) {
    if (!query) continue;
    const data = await safeFetchJson(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`);
    if (data && data.length > 0 && data[0].lat && data[0].lon) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };
    }
  }

  return null;
};

export const calculateFeeForAddressObj = async (
  addressObj: any, 
  settings?: DeliverySettings
): Promise<{ fee: number; distanceKm: number | null }> => {
  const currentSettings = settings || await loadDeliverySettings();

  // Tentar obter endereço do objeto ou fallback para o endereço no localStorage caso o perfil não esteja totalmente preenchido
  let targetAddress = addressObj;
  if (!targetAddress || !targetAddress.address) {
    try {
      const localAddress = localStorage.getItem('delivery.userAddress');
      if (localAddress) {
        targetAddress = JSON.parse(localAddress);
      }
    } catch {
      targetAddress = null;
    }
  }

  // Se mesmo assim não houver endereço definido, retornar a taxa da 2ª ou maior regra (ou base fee)
  if (!targetAddress || !targetAddress.address || !currentSettings.storeLat || !currentSettings.storeLng) {
    const defaultFee = currentSettings.rules.length > 1
      ? Number(currentSettings.rules[1].fee) // ex: R$ 10.00
      : currentSettings.baseFee;
    return { fee: defaultFee, distanceKm: null };
  }

  const coords = await geocodeAddressObj(targetAddress);
  if (coords) {
    const roadDistance = await calculateRoadDistance(
      currentSettings.storeLat,
      currentSettings.storeLng,
      coords.lat,
      coords.lon
    );

    const fee = getFeeForDistance(roadDistance, currentSettings);
    return { fee, distanceKm: roadDistance };
  }

  // Se geocodificação falhou completamente, retornar a taxa padrão adequada
  const fallbackFee = currentSettings.rules.length > 1
    ? Number(currentSettings.rules[1].fee)
    : currentSettings.baseFee;

  return { fee: fallbackFee, distanceKm: null };
};
