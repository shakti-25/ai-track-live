import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateGPSAuditStamp,
  formatGoogleMapsUrl,
  getLocationDisplayName,
  buildGoogleFormPayload,
  calculateVisitMetrics,
  FORM_ENTRY_IDS,
} from './formAudit.ts';
import type { DailySalesFormData, GPSLocation, GroundingResult, VisitRecord } from '../types.ts';

const mockLocation: GPSLocation = {
  latitude: 28.613939,
  longitude: 77.209021,
  accuracy: 12.4,
  timestamp: 1792137600000,
  provider: 'browser_gps',
};

const mockGrounding: GroundingResult = {
  verifiedAddress: 'Connaught Place, New Delhi, Delhi 110001, India',
  locality: 'Connaught Place',
  landmark: 'Central Park',
  description: 'Verified commercial hub at Connaught Place',
  places: [
    {
      title: 'Central Park CP',
      uri: 'https://maps.google.com/?cid=12345',
    },
  ],
  source: 'gemini_maps_grounding',
  fetchedAt: 1792137600000,
};

const mockFormData: DailySalesFormData = {
  salesPersonName: 'Vikram Sharma',
  serialNo: 'DS-101',
  date: '2026-10-16',
  time: '14:30',
  clientName: 'Apex Capital Holdings',
  callMeet: 'YES',
  physicalMeet: 'YES',
  followUpDate: '2026-10-23',
  scheduleDone: 'YES',
  businessLumpsum: 'YES',
  businessLumpsumAmount: '500000',
  businessSip: 'YES',
  businessSipAmount: '25000',
  particularRemarks: 'Met CFO Mr. Rajiv regarding portfolio restructuring',
};

test('formatGoogleMapsUrl generates valid coordinates link', () => {
  const url = formatGoogleMapsUrl(28.613939, 77.209021);
  assert.equal(url, 'https://www.google.com/maps?q=28.613939,77.209021');
});

test('getLocationDisplayName formats readable area and city', () => {
  const name = getLocationDisplayName(mockGrounding, mockLocation);
  assert.equal(name, 'Connaught Place, New Delhi');
});

test('generateGPSAuditStamp embeds verified location name and landmark rather than raw coordinates', () => {
  const stamp = generateGPSAuditStamp(mockLocation, mockGrounding, mockFormData.particularRemarks);
  assert.ok(stamp.includes('Location Name: Connaught Place, New Delhi'));
  assert.ok(stamp.includes('Landmark: Central Park'));
  assert.ok(stamp.includes('Met CFO Mr. Rajiv'));
  assert.ok(stamp.includes('https://www.google.com/maps?q=28.613939,77.209021'));
});

test('buildGoogleFormPayload maps all Google Form entry IDs correctly', () => {
  const payload = buildGoogleFormPayload(mockFormData, mockLocation, mockGrounding);

  assert.equal(payload[FORM_ENTRY_IDS.salesPersonName], 'Vikram Sharma');
  assert.equal(payload[FORM_ENTRY_IDS.serialNo], 'DS-101');
  assert.equal(payload[FORM_ENTRY_IDS.clientName], 'Apex Capital Holdings');
  assert.equal(payload[FORM_ENTRY_IDS.callMeet], 'YES');
  assert.equal(payload[FORM_ENTRY_IDS.physicalMeet], 'YES');
  assert.equal(payload[FORM_ENTRY_IDS.businessLumpsum], 'YES');
  assert.equal(payload[FORM_ENTRY_IDS.businessLumpsumAmount], '500000');
  assert.equal(payload[FORM_ENTRY_IDS.businessSip], 'YES');
  assert.equal(payload[FORM_ENTRY_IDS.businessSipAmount], '25000');

  // Date and Time sub-keys
  assert.equal(payload[`${FORM_ENTRY_IDS.date}_year`], '2026');
  assert.equal(payload[`${FORM_ENTRY_IDS.date}_month`], '10');
  assert.equal(payload[`${FORM_ENTRY_IDS.date}_day`], '16');

  assert.equal(payload[`${FORM_ENTRY_IDS.time}_hour`], '14');
  assert.equal(payload[`${FORM_ENTRY_IDS.time}_minute`], '30');

  // Stamped remarks check
  assert.ok(payload[FORM_ENTRY_IDS.particularRemarks].includes('VERIFIED VISIT LOCATION AUDIT'));
  assert.ok(payload[FORM_ENTRY_IDS.particularRemarks].includes('Connaught Place'));
});


test('calculateVisitMetrics aggregates counts and amounts properly', () => {
  const records: VisitRecord[] = [
    {
      id: 'rec-1',
      submittedAt: Date.now(),
      formData: {
        ...mockFormData,
        physicalMeet: 'YES',
        callMeet: 'YES',
        businessLumpsum: 'YES',
        businessLumpsumAmount: '100000',
        businessSip: 'YES',
        businessSipAmount: '10000',
      },
      location: mockLocation,
      gpsAuditText: 'test',
      googleMapsUrl: 'test',
      formStatus: 'synced_google_forms',
    },
    {
      id: 'rec-2',
      submittedAt: Date.now(),
      formData: {
        ...mockFormData,
        physicalMeet: 'NO',
        callMeet: 'YES',
        businessLumpsum: 'NO',
        businessLumpsumAmount: '',
        businessSip: 'YES',
        businessSipAmount: '5000',
      },
      location: mockLocation,
      gpsAuditText: 'test',
      googleMapsUrl: 'test',
      formStatus: 'local_only',
    },
  ];

  const metrics = calculateVisitMetrics(records);
  assert.equal(metrics.totalVisits, 2);
  assert.equal(metrics.physicalVisits, 1);
  assert.equal(metrics.callVisits, 2);
  assert.equal(metrics.totalLumpsum, 100000);
  assert.equal(metrics.totalSip, 15000);
});
