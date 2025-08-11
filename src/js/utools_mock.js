// This file is a mock for the utools API, used for development and testing purposes.
// It provides dummy implementations for utools functions.

//import * as mock from './mock.json'
let func;
// Simple in-memory mock database, now backed by localStorage
const LOCAL_STORAGE_KEY = 'utools_mock_db';
let mockDb = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');

function saveMockDb() {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockDb));
  console.log('Mock DB: Data saved to localStorage.');
}

// Simple UUID generator for mock purposes
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default {
  onPluginEnter: function (funz) {
    func = funz;
  },
  callOnPluginEnter: function (data) {
    func(data);
  },
  redirect: function (name, b) {
    console.log(`Mock utools.redirect: ${name}, ${b}`);
  },
  onPluginReady: function () { console.log('Mock utools.onPluginReady called'); },
  showNotification: function (msg) { console.log(`Mock utools.showNotification: ${msg}`); },
  shellBeep: function () { console.log('Mock utools.shellBeep called'); },
  db: {
    put: function (doc) {
      if (!doc || !doc._id) {
        console.warn("Mock DB: Attempted to put document without _id", doc);
        return { ok: false };
      }
      
      // Simulate _rev for updates
      if (mockDb[doc._id]) {
        doc._rev = (parseInt(mockDb[doc._id]._rev || '0') + 1).toString();
      } else {
        doc._rev = '1'; // Initial revision
      }

      mockDb[doc._id] = doc;
      saveMockDb(); // Save to localStorage after put
      console.log(`Mock DB: Stored document with _id: ${doc._id}, _rev: ${doc._rev}`, doc);
      return { ok: true, id: doc._id, rev: doc._rev };
    },
    get: function (id) {
      console.log(`Mock DB: Fetching document with _id: ${id}`);
      return mockDb[id];
    },
    remove: function (id) {
      if (mockDb[id]) {
        delete mockDb[id];
        saveMockDb(); // Save to localStorage after remove
        console.log(`Mock DB: Removed document with _id: ${id}`);
        return { ok: true, id: id };
      }
      console.warn(`Mock DB: Attempted to remove non-existent document with _id: ${id}`);
      return { ok: false };
    },
    allDocs: function (key) {
      console.log(`Mock DB: Fetching all documents (key: ${key})`);
      const allDocs = Object.values(mockDb);
      if (key) {
        // Simple filtering by key prefix for demonstration
        return allDocs.filter(doc => doc._id.startsWith(key));
      }
      return allDocs;
    },
    getUUID: function() {
      const uuid = generateUUID();
      console.log(`Mock DB: Generated UUID: ${uuid}`);
      return uuid;
    }
  },
};

