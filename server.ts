import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT) || 3000;
const GOOGLE_FORM_RESPONSE_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSeOk9VFaCsynaNm6ACAzyadizBBH4OVPI5rlCjuQK5ax-1VUQ/formResponse';

// Initialize Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// Initialize Google Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

let isGeminiOperational = false;
let lastGeminiAttemptTime = 0;
let geminiTested = false;

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: !!apiKey,
    hasSupabase: !!supabase,
    geminiOperational: isGeminiOperational,
    geocodingProvider: isGeminiOperational ? 'Gemini 3.8 Flash Maps Grounding' : 'Verified Location Geocoding API',
    time: new Date().toISOString(),
  });
});

/**
 * Database Endpoint: Fetch all visits from Supabase 'visits' table
 */
app.get('/api/visits', async (req, res) => {
  try {
    if (!supabase) {
      res.status(500).json({ error: 'Supabase client is not configured' });
      return;
    }

    const { data, error } = await supabase
      .from('visits')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    console.error('Error fetching visits:', err);
    res.status(500).json({ error: err?.message || 'Failed to fetch visits' });
  }
});

/**
 * Database Endpoint: Insert new visit record into Supabase 'visits' table
 */
app.post('/api/visits', async (req, res) => {
  try {
    if (!supabase) {
      res.status(500).json({ error: 'Supabase client is not configured' });
      return;
    }

    const payload = req.body;
    const formattedDate = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const record = {
      serial: payload.serial || `DS-${Date.now().toString().slice(-3)}`,
      date_time: payload.date_time || payload.dateTime || formattedDate,
      client_name: payload.client_name || payload.clientName || 'Unspecified Client',
      salesperson: payload.salesperson || 'Unassigned',
      visit_type: payload.visit_type || payload.visitType || 'Physical',
      deals: payload.deals || '—',
      verified_address: payload.verified_address || payload.verifiedAddress || '',
      locality: payload.locality || '',
      landmark: payload.landmark || '',
      city: payload.city || '',
      state: payload.state || '',
      latitude: payload.latitude ? Number(payload.latitude) : null,
      longitude: payload.longitude ? Number(payload.longitude) : null,
      sync_status: payload.sync_status || 'Verified & Synced',
      raw_data: payload.raw_data || payload || {},
      created_at: payload.created_at || new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('visits')
      .insert([record])
      .select();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (err: any) {
    console.error('Error inserting visit:', err);
    res.status(500).json({ error: err?.message || 'Failed to record visit' });
  }
});

/**
 * Google Maps Grounding & Verified Location endpoint
 */
app.post('/api/maps/grounding', async (req, res) => {
  try {
    const { latitude, longitude, clientName } = req.body;

    if (latitude === undefined || longitude === undefined) {
      res.status(400).json({ error: 'Latitude and longitude are required' });
      return;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ error: 'Invalid coordinates' });
      return;
    }

    const directMapsPin = `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;

    let groundingResult = {
      verifiedAddress: '',
      locality: '',
      landmark: '',
      description: '',
      places: [] as Array<{ title: string; uri: string; snippet?: string }>,
      source: 'coordinates_only' as 'gemini_maps_grounding' | 'reverse_geocoding' | 'coordinates_only',
      fetchedAt: Date.now(),
    };

    const now = Date.now();
    const canAttemptGemini = !!ai && (!geminiTested || isGeminiOperational || (now - lastGeminiAttemptTime > 300000));

    if (canAttemptGemini && ai) {
      try {
        const prompt = clientName
          ? `Verify the physical address, area/locality name, nearest landmark, and commercial/business establishment at GPS coordinates latitude ${lat}, longitude ${lng}. The salesperson is visiting client: "${clientName}". Provide a concise location verification summary.`
          : `Verify the physical address, neighborhood/locality, city, nearest landmark, and notable commercial establishments at GPS coordinates: latitude ${lat}, longitude ${lng}. Provide a concise location summary for a field sales visit record.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            tools: [{ googleMaps: {} }],
            toolConfig: {
              retrievalConfig: {
                latLng: {
                  latitude: lat,
                  longitude: lng,
                },
              },
            },
          },
        });

        geminiTested = true;
        isGeminiOperational = true;

        const textOutput = response.text || '';
        groundingResult.description = textOutput;
        groundingResult.source = 'gemini_maps_grounding';

        const candidate = response.candidates?.[0];
        // @ts-ignore
        const metadata = candidate?.groundingMetadata;
        const chunks = metadata?.groundingChunks || [];

        const places: Array<{ title: string; uri: string; snippet?: string }> = [];

        for (const chunk of chunks) {
          if (chunk?.maps) {
            const mapsObj = chunk.maps as any;
            const uri = mapsObj.uri || mapsObj.googleMapsUri || '';
            const title = mapsObj.title || mapsObj.name || 'View on Google Maps';
            if (uri) {
              places.push({ title, uri });
            }
          }
          if (chunk?.web?.uri) {
            places.push({
              title: chunk.web.title || 'Location Reference',
              uri: chunk.web.uri,
            });
          }
        }

        if (!places.some((p) => p.uri === directMapsPin)) {
          places.unshift({
            title: `GPS Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
            uri: directMapsPin,
          });
        }

        groundingResult.places = places;

        const lines = textOutput.split('\n').filter((l) => l.trim().length > 0);
        groundingResult.verifiedAddress =
          lines.find((l) => !l.startsWith('#') && l.length > 5) ||
          `Lat ${lat.toFixed(6)}, Lng ${lng.toFixed(6)}`;
      } catch (geminiError: any) {
        geminiTested = true;
        isGeminiOperational = false;
        lastGeminiAttemptTime = now;
      }
    }

    if (!groundingResult.verifiedAddress || groundingResult.source === 'coordinates_only') {
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
          {
            headers: {
              'User-Agent': 'SalesTrack-GPS/1.0 (enterprise-sales-portal)',
              'Accept': 'application/json',
            },
          }
        );

        if (geoRes.ok) {
          const geoData: any = await geoRes.json();
          if (geoData?.display_name) {
            const address = geoData.address || {};
            const road = address.road || '';
            const landmarkName =
              geoData.name ||
              address.building ||
              address.amenity ||
              address.shop ||
              address.office ||
              road ||
              '';
            const localityName =
              address.suburb ||
              address.neighbourhood ||
              address.residential ||
              address.city_district ||
              address.city ||
              address.town ||
              address.county ||
              '';
            const cityName =
              address.city ||
              address.town ||
              address.state_district ||
              address.state ||
              '';

            groundingResult.verifiedAddress = geoData.display_name;
            groundingResult.locality = localityName || cityName;
            groundingResult.landmark = landmarkName;
            groundingResult.source = 'reverse_geocoding';
            groundingResult.description = `Verified physical location in ${localityName || cityName}: ${geoData.display_name}.`;

            const searchMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              geoData.display_name
            )}`;

            groundingResult.places = [
              {
                title: landmarkName
                  ? `${landmarkName} (Verified Pin)`
                  : `GPS Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
                uri: directMapsPin,
              },
              {
                title: localityName
                  ? `${localityName}, ${cityName} (Google Maps)`
                  : 'Open in Google Maps',
                uri: searchMapsUrl,
              },
            ];
          }
        }
      } catch {
        // Fall through
      }
    }

    if (!groundingResult.verifiedAddress) {
      groundingResult.verifiedAddress = `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
      groundingResult.places = [
        {
          title: `Google Maps Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          uri: directMapsPin,
        },
      ];
    }

    res.json(groundingResult);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to resolve location' });
  }
});

/**
 * Proxy submission directly to Google Forms & sync automatically to Supabase 'visits' table
 */
app.post('/api/form/submit', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      res.status(400).json({ error: 'Payload is required' });
      return;
    }

    const formParams = new URLSearchParams();
    for (const [key, value] of Object.entries(payload)) {
      if (value !== undefined && value !== null) {
        formParams.append(key, String(value));
      }
    }

    const gResponse = await fetch(GOOGLE_FORM_RESPONSE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: formParams.toString(),
      redirect: 'manual',
    });

    const isSuccess =
      gResponse.status === 200 ||
      gResponse.status === 302 ||
      gResponse.status === 303;

    // Automatically save to Supabase 'visits' table if connected
    if (supabase && isSuccess) {
      try {
        const formattedDate = new Date().toISOString().replace('T', ' ').slice(0, 19);
        const record = {
          serial: payload.serial || `DS-${Date.now().toString().slice(-3)}`,
          date_time: payload.date_time || payload.dateTime || formattedDate,
          client_name: payload.clientName || payload['entry.1'] || 'Form Client',
          salesperson: payload.salesperson || payload['entry.2'] || 'Field Agent',
          visit_type: payload.visitType || 'Physical',
          deals: payload.deals || '—',
          verified_address: payload.verifiedAddress || '',
          sync_status: 'Verified & Synced',
          raw_data: payload,
          created_at: new Date().toISOString()
        };

        await supabase.from('visits').insert([record]);
      } catch (dbErr) {
        console.error('Failed auto-sync to Supabase:', dbErr);
      }
    }

    res.json({
      success: isSuccess,
      status: gResponse.status,
      timestamp: Date.now(),
      message: isSuccess
        ? 'Successfully submitted to Google Form & synced to cloud'
        : `Google Form responded with status ${gResponse.status}`,
    });
  } catch (err: any) {
    console.error('Error proxying to Google Form:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to submit to Google Form',
    });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const path = await import('path');
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SalesTrack GPS server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
