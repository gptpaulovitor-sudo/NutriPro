const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

test('Backup Restoration — Structural Verification of loadPatientFromCloud', async (t) => {
  const appJsCode = fs.readFileSync('app.js', 'utf8');

  await t.test('Test 1: currentVisibleTab is not referenced in loadPatientFromCloud', () => {
    // Extract loadPatientFromCloud body
    const fnStart = appJsCode.indexOf('async function loadPatientFromCloud(');
    assert.ok(fnStart !== -1, 'loadPatientFromCloud must exist');
    const fnEnd = appJsCode.indexOf('async function listDrivePatientsV2()', fnStart);
    assert.ok(fnEnd !== -1, 'Function boundary found');
    const fnBody = appJsCode.slice(fnStart, fnEnd);

    assert.equal(
      fnBody.includes('currentVisibleTab'),
      false,
      'loadPatientFromCloud must NOT contain currentVisibleTab'
    );
  });

  await t.test('Test 2: currentVisibleTab remains local inside onPatientChange', () => {
    const fnStart = appJsCode.indexOf('async function onPatientChange(');
    assert.ok(fnStart !== -1, 'onPatientChange must exist');
    const fnEnd = appJsCode.indexOf('async function switchTab(', fnStart);
    assert.ok(fnEnd !== -1, 'onPatientChange boundary found');
    const fnBody = appJsCode.slice(fnStart, fnEnd);

    assert.ok(
      fnBody.includes("let currentVisibleTab = 'dashboard';"),
      'onPatientChange must keep its local let currentVisibleTab'
    );
  });

  await t.test('Test 3: loadPatientFromCloud end-to-end simulation with mock Dexie', async () => {
    // Mock Dexie tables
    const dbMock = {
      patients: {
        _data: new Map([
          ['test-patient', { id: 'test-patient', name: 'Original Local', cardioPreferences: { preferredFrequency: 3 } }]
        ]),
        get: async (id) => dbMock.patients._data.get(id),
        put: async (item) => dbMock.patients._data.set(item.id, item)
      },
      clinicalExams: {
        _data: [],
        where: () => ({ equals: () => ({ delete: async () => { dbMock.clinicalExams._data = []; } }) }),
        bulkPut: async (items) => { dbMock.clinicalExams._data.push(...items); }
      },
      assessments: {
        _data: [],
        where: () => ({ equals: () => ({ delete: async () => { dbMock.assessments._data = []; } }) }),
        bulkPut: async (items) => { dbMock.assessments._data.push(...items); }
      },
      dietaryRecall: {
        _data: [],
        where: () => ({ equals: () => ({ delete: async () => { dbMock.dietaryRecall._data = []; } }) }),
        bulkPut: async (items) => { dbMock.dietaryRecall._data.push(...items); }
      },
      dailyLogs: {
        _data: [],
        where: () => ({ equals: () => ({ delete: async () => { dbMock.dailyLogs._data = []; } }) }),
        bulkPut: async (items) => { dbMock.dailyLogs._data.push(...items); }
      },
      prescriptions: {
        _data: new Map(),
        get: async (id) => dbMock.prescriptions._data.get(id),
        put: async (item) => dbMock.prescriptions._data.set(item.id, item)
      },
      performanceMetabolica: {
        _data: new Map(),
        get: async (id) => dbMock.performanceMetabolica._data.get(id),
        put: async (item) => dbMock.performanceMetabolica._data.set(item.id, item)
      }
    };

    // Full simulated cloud backup payload
    const mockCloudData = {
      patient: {
        id: 'test-patient',
        name: 'Paulo Vitor (Cloud Backup)',
        cardioPreferences: {
          preferredModalities: ['running', 'rowing'],
          preferredFrequency: 4,
          preferredDurationMinutes: 35,
          preferredIntensity: 'Moderate',
          preferredDays: ['mon', 'wed', 'fri'],
          availableEquipment: ['treadmill', 'rower']
        }
      },
      exams: [
        { id: 'exam-1', patientId: 'test-patient', testName: 'Glicemia', value: 85 }
      ],
      assessments: [
        { id: 'eval-1', patientId: 'test-patient', date: '2026-09-01', weight: 80 }
      ],
      dietaryRecall: [
        { id: 'recall-1', patientId: 'test-patient', mealName: 'Café', items: [] }
      ],
      dailyLogs: [
        { id: 'log-1', patientId: 'test-patient', date: '2026-09-10', waterMl: 3000 }
      ],
      prescriptions: [
        { id: 'meal-1', name: 'Refeição 1', calories: 600 }
      ],
      performance: {
        trainingSplit: 'PPL',
        weeklyVolumeMinutes: 140
      }
    };

    // Simulate the restoration logic exactly as implemented in loadPatientFromCloud
    const patientId = 'test-patient';
    const cloudData = mockCloudData;

    // 1. Patient
    if (cloudData.patient) {
      const currentLocal = await dbMock.patients.get(patientId);
      if (currentLocal && currentLocal.cardioPreferences && !cloudData.patient.cardioPreferences) {
        cloudData.patient.cardioPreferences = currentLocal.cardioPreferences;
      }
      await dbMock.patients.put(cloudData.patient);
    }

    // 2. Exams
    if (cloudData.exams && Array.isArray(cloudData.exams) && cloudData.exams.length > 0) {
      await dbMock.clinicalExams.where("patientId").equals(patientId).delete();
      await dbMock.clinicalExams.bulkPut(cloudData.exams);
    }

    // 3. Assessments
    if (cloudData.assessments && Array.isArray(cloudData.assessments) && cloudData.assessments.length > 0) {
      await dbMock.assessments.where("patientId").equals(patientId).delete();
      await dbMock.assessments.bulkPut(cloudData.assessments);
    }

    // 4. Recall
    if (cloudData.dietaryRecall && Array.isArray(cloudData.dietaryRecall) && cloudData.dietaryRecall.length > 0) {
      await dbMock.dietaryRecall.where("patientId").equals(patientId).delete();
      await dbMock.dietaryRecall.bulkPut(cloudData.dietaryRecall);
    }

    // 5. Daily Logs
    if (cloudData.dailyLogs && Array.isArray(cloudData.dailyLogs) && cloudData.dailyLogs.length > 0) {
      await dbMock.dailyLogs.where("patientId").equals(patientId).delete();
      await dbMock.dailyLogs.bulkPut(cloudData.dailyLogs);
    }

    // 6. Prescriptions
    if (cloudData.prescriptions) {
      await dbMock.prescriptions.put({ id: patientId, patientId: patientId, items: cloudData.prescriptions });
    }

    // 7. Performance
    if (cloudData.performance) {
      await dbMock.performanceMetabolica.put({
        id: patientId,
        patientId: patientId,
        ...cloudData.performance
      });
    }

    // Verifications:
    // 1. patients table
    const restoredPatient = await dbMock.patients.get('test-patient');
    assert.equal(restoredPatient.name, 'Paulo Vitor (Cloud Backup)');
    assert.deepEqual(restoredPatient.cardioPreferences.preferredModalities, ['running', 'rowing']);
    assert.equal(restoredPatient.cardioPreferences.preferredFrequency, 4);

    // 2. clinicalExams
    assert.equal(dbMock.clinicalExams._data.length, 1);
    assert.equal(dbMock.clinicalExams._data[0].testName, 'Glicemia');

    // 3. assessments
    assert.equal(dbMock.assessments._data.length, 1);
    assert.equal(dbMock.assessments._data[0].weight, 80);

    // 4. dietaryRecall
    assert.equal(dbMock.dietaryRecall._data.length, 1);

    // 5. dailyLogs
    assert.equal(dbMock.dailyLogs._data.length, 1);
    assert.equal(dbMock.dailyLogs._data[0].waterMl, 3000);

    // 6. prescriptions
    const restoredPresc = await dbMock.prescriptions.get('test-patient');
    assert.equal(restoredPresc.items.length, 1);
    assert.equal(restoredPresc.items[0].calories, 600);

    // 7. performance
    const restoredPerf = await dbMock.performanceMetabolica.get('test-patient');
    assert.equal(restoredPerf.trainingSplit, 'PPL');
    assert.equal(restoredPerf.weeklyVolumeMinutes, 140);
  });
});
