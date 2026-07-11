import { PrismaClient } from '../generated/client/index.js';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const DB_FILE_PATH = path.resolve(process.cwd(), 'mock_db.json');

const defaultPassword = 'secure_password123';
const defaultHash = bcrypt.hashSync(defaultPassword, 10);

let db = null;
if (fs.existsSync(DB_FILE_PATH)) {
  try {
    db = JSON.parse(fs.readFileSync(DB_FILE_PATH, 'utf-8'));
  } catch (err) {
    console.error('Error parsing mock_db.json, recreating standard seed data...', err);
  }
}

let isSupabaseSynced = false;
let lastSyncedTime = 0;

async function uploadToSupabase(data) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  try {
    await fetch(`${SUPABASE_URL}/storage/v1/object/mock-db/mock_db.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
        'x-upsert': 'true'
      },
      body: JSON.stringify(data)
    });
  } catch (err) {
    console.error('[MockDB] Failed to upload database to Supabase:', err);
  }
}

export async function ensureDbLoaded() {
  const now = Date.now();
  if (isSupabaseSynced && (now - lastSyncedTime < 10000)) {
    return;
  }
  
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const res = await fetch(`${SUPABASE_URL}/storage/v1/object/mock-db/mock_db.json`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'apikey': SUPABASE_KEY
        }
      });
      if (res.status === 200) {
        const remoteDb = await res.json();
        if (remoteDb && remoteDb.users && remoteDb.complaints) {
          db = remoteDb;
          isSupabaseSynced = true;
          lastSyncedTime = now;
          console.log('[MockDB] Sync succeeded. Loaded remote database.');
          return;
        }
      }
    } catch (err) {
      console.error('[MockDB] Failed to sync database with Supabase:', err);
    }
  }
}

export function saveToDisk() {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to mock_db.json:', err);
  }
  uploadToSupabase(db).catch(console.error);
}

if (!db) {
  db = {
    users: [
      {
        id: 'citizen-id-1',
        name: 'Rohan Sharma',
        username: 'rohan_sharma',
        phone: '+919876543210',
        passwordHash: defaultHash,
        role: 'CITIZEN',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'admin-id-1',
        name: 'Admin User',
        username: 'admin',
        phone: '+919999999999',
        passwordHash: defaultHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ],
    departments: [
      {
        id: 'dept-sanitation',
        name: 'Sanitation & Waste Management',
        description: 'Responsible for public garbage disposal, cleaning sewers, and disease control.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'dept-roads',
        name: 'Roads & Infrastructure',
        description: 'Handles potholes, broken pavements, damaged streetlights, and traffic signs.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'dept-water',
        name: 'Water Supply & Sewage',
        description: 'Deals with clean drinking water pipes, sewage leaks, and drainage.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'dept-electricity',
        name: 'Electricity & Power Supply',
        description: 'Handles power outages, electrical faults, hanging live wires, and streetlight maintenance.',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ],
    officers: [
      {
        id: 'officer-vijay',
        name: 'Inspector Vijay Kumar',
        username: 'vijay_sanitation',
        passwordHash: defaultHash,
        role: 'DEPT_HEAD',
        status: 'ACTIVE',
        departmentId: 'dept-sanitation',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'officer-anil',
        name: 'Engineer Anil Mehta',
        username: 'anil_roads',
        passwordHash: defaultHash,
        role: 'OFFICER',
        status: 'ACTIVE',
        departmentId: 'dept-roads',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'officer-admin-sanitation',
        name: 'Sanitation Admin',
        username: 'admin.sanitation',
        passwordHash: defaultHash,
        role: 'DEPT_HEAD',
        status: 'ACTIVE',
        departmentId: 'dept-sanitation',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'officer-admin-roads',
        name: 'Roads Admin',
        username: 'admin.roads',
        passwordHash: defaultHash,
        role: 'DEPT_HEAD',
        status: 'ACTIVE',
        departmentId: 'dept-roads',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'officer-admin-water',
        name: 'Water Admin',
        username: 'admin.water',
        passwordHash: defaultHash,
        role: 'DEPT_HEAD',
        status: 'ACTIVE',
        departmentId: 'dept-water',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'officer-admin-electricity',
        name: 'Electricity Admin',
        username: 'admin.electricity',
        passwordHash: defaultHash,
        role: 'DEPT_HEAD',
        status: 'ACTIVE',
        departmentId: 'dept-electricity',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ],
    complaints: [
      {
        id: 'complaint-1',
        title: 'Overflowing Public Garbage Bin',
        description: 'The public dustbin at Sector 15 main market is overflowing. It has not been cleared for three days, causing a severe stench and attracting stray animals.',
        category: 'Waste Management',
        latitude: 28.6139,
        longitude: 77.209,
        address: 'Sector 15 Market, Near Central Park, New Delhi',
        status: 'PENDING',
        severity: 'HIGH',
        userId: 'citizen-id-1',
        departmentId: 'dept-sanitation',
        officerId: 'officer-admin-sanitation',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'complaint-2',
        title: 'Massive Pothole on Main Road',
        description: 'A deep pothole has developed right in the middle of the flyover descent. It is extremely dangerous for two-wheelers, especially during nighttime.',
        category: 'Road Hazards',
        latitude: 28.625,
        longitude: 77.22,
        address: 'Defense Colony Flyover Descent, New Delhi',
        status: 'IN_PROGRESS',
        severity: 'CRITICAL',
        userId: 'citizen-id-1',
        departmentId: 'dept-roads',
        officerId: 'officer-admin-roads',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ],
    images: [
      {
        id: 'image-1',
        url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9',
        complaintId: 'complaint-1',
        createdAt: new Date(),
      },
      {
        id: 'image-2',
        url: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2',
        complaintId: 'complaint-2',
        createdAt: new Date(),
      }
    ],
    aiAnalyses: [
      {
        id: 'ai-1',
        complaintId: 'complaint-1',
        summary: 'Public garbage accumulation detected. Confirmed overflow causing hygiene hazard.',
        tags: ['garbage', 'overflowing', 'health-hazard', 'market'],
        confidenceScore: 0.94,
        detectedSeverity: 'HIGH',
        processedAt: new Date(),
      },
      {
        id: 'ai-2',
        complaintId: 'complaint-2',
        summary: 'Severe road infrastructure damage. Deep depression in road surface presents vehicle damage and safety risk.',
        tags: ['pothole', 'road-damage', 'traffic-hazard', 'infrastructure'],
        confidenceScore: 0.98,
        detectedSeverity: 'CRITICAL',
        processedAt: new Date(),
      }
    ],
    statusHistories: [
      {
        id: 'sh-1',
        complaintId: 'complaint-1',
        previousStatus: 'PENDING',
        newStatus: 'PENDING',
        remarks: 'Complaint registered by citizen.',
        changedById: 'citizen-id-1',
        changedByType: 'USER',
        createdAt: new Date(),
      },
      {
        id: 'sh-2',
        complaintId: 'complaint-2',
        previousStatus: 'PENDING',
        newStatus: 'PENDING',
        remarks: 'Complaint registered by citizen.',
        changedById: 'citizen-id-1',
        changedByType: 'USER',
        createdAt: new Date(),
      },
      {
        id: 'sh-3',
        complaintId: 'complaint-2',
        previousStatus: 'PENDING',
        newStatus: 'IN_PROGRESS',
        remarks: 'Assigned to Engineer Anil Mehta. Status set to In Progress.',
        changedById: 'admin-id-1',
        changedByType: 'USER',
        createdAt: new Date(),
      }
    ],
    notifications: [
      {
        id: 'notif-1',
        title: 'Complaint Registered',
        message: 'Your complaint about Overflowing Public Garbage Bin has been submitted.',
        userId: 'citizen-id-1',
        officerId: null,
        type: 'INFO',
        isRead: false,
        createdAt: new Date(),
      },
      {
        id: 'notif-2',
        title: 'Complaint Assigned',
        message: 'Your complaint about Massive Pothole on Main Road has been assigned to an officer.',
        userId: 'citizen-id-1',
        officerId: null,
        type: 'UPDATE',
        isRead: false,
        createdAt: new Date(),
      },
      {
        id: 'notif-3',
        title: 'New Assignment',
        message: 'You have been assigned a new critical pothole complaint.',
        userId: null,
        officerId: 'officer-anil',
        type: 'ALERT',
        isRead: false,
        createdAt: new Date(),
      }
    ],
    refreshTokens: [],
    auditLogs: []
  };
  saveToDisk();
}

function matches(item, where) {
  if (!where) return true;
  for (const [key, value] of Object.entries(where)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if ('equals' in value) {
        if (item[key] !== value.equals) return false;
      } else if ('contains' in value) {
        const itemVal = (item[key] || '').toString().toLowerCase();
        const searchVal = value.contains.toString().toLowerCase();
        if (!itemVal.includes(searchVal)) return false;
      } else if ('in' in value) {
        if (!value.in.includes(item[key])) return false;
      } else {
        // Fallback basic check
        if (item[key] !== value) return false;
      }
    } else {
      if (item[key] !== value) return false;
    }
  }
  return true;
}

function loadRelations(item, modelName, include) {
  if (!include) return item;
  const newItem = { ...item };
  for (const [key, val] of Object.entries(include)) {
    if (!val) continue;
    if (modelName === 'officer' && key === 'department') {
      newItem.department = db.departments.find(d => d.id === item.departmentId) || null;
    }
    if (modelName === 'complaint') {
      if (key === 'user') {
        newItem.user = db.users.find(u => u.id === item.userId) || null;
      }
      if (key === 'department') {
        newItem.department = db.departments.find(d => d.id === item.departmentId) || null;
      }
      if (key === 'officer') {
        newItem.officer = db.officers.find(o => o.id === item.officerId) || null;
      }
      if (key === 'images') {
        newItem.images = db.images.filter(img => img.complaintId === item.id);
      }
      if (key === 'aiAnalysis') {
        newItem.aiAnalysis = db.aiAnalyses.find(ai => ai.complaintId === item.id) || null;
      }
      if (key === 'statusHistory') {
        newItem.statusHistory = db.statusHistories.filter(sh => sh.complaintId === item.id);
      }
    }
    if (modelName === 'user') {
      if (key === 'notifications') {
        newItem.notifications = db.notifications.filter(n => n.userId === item.id);
      }
    }
    if (modelName === 'department') {
      if (key === 'officers') {
        newItem.officers = db.officers.filter(o => o.departmentId === item.id);
      }
      if (key === 'complaints') {
        newItem.complaints = db.complaints.filter(c => c.departmentId === item.id);
      }
      if (key === '_count') {
        newItem._count = {
          complaints: db.complaints.filter(c => c.departmentId === item.id).length,
          officers: db.officers.filter(o => o.departmentId === item.id).length
        };
      }
    }
  }
  return newItem;
}

class MockModel {
  constructor(arrayName, modelName) {
    this.arrayName = arrayName;
    this.modelName = modelName;
  }

  get list() {
    return db[this.arrayName];
  }

  set list(newList) {
    db[this.arrayName] = newList;
  }

  async findUnique(args) {
    await ensureDbLoaded();
    const item = this.list.find(i => matches(i, args?.where));
    if (!item) return null;
    return loadRelations(item, this.modelName, args?.include);
  }

  async findFirst(args) {
    await ensureDbLoaded();
    const item = this.list.find(i => matches(i, args?.where));
    if (!item) return null;
    return loadRelations(item, this.modelName, args?.include);
  }

  async findMany(args) {
    await ensureDbLoaded();
    let result = this.list.filter(i => matches(i, args?.where));

    if (args?.orderBy) {
      const orderKeys = Object.keys(args.orderBy);
      if (orderKeys.length > 0) {
        const key = orderKeys[0];
        const direction = args.orderBy[key];
        result.sort((a, b) => {
          if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
          if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
          return 0;
        });
      }
    }

    if (args?.skip !== undefined) {
      result = result.slice(args.skip);
    }
    if (args?.take !== undefined) {
      result = result.slice(0, args.take);
    }

    return result.map(i => loadRelations(i, this.modelName, args?.include));
  }

  async create(args) {
    await ensureDbLoaded();
    const id = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const newItem = {
      id,
      ...args.data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.list.push(newItem);
    saveToDisk();
    return loadRelations(newItem, this.modelName, args?.include);
  }

  async createMany(args) {
    await ensureDbLoaded();
    const dataList = Array.isArray(args.data) ? args.data : [args.data];
    const created = [];
    for (const d of dataList) {
      const id = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const newItem = {
        id,
        ...d,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.list.push(newItem);
      created.push(newItem);
    }
    saveToDisk();
    return { count: created.length };
  }

  async update(args) {
    await ensureDbLoaded();
    const index = this.list.findIndex(i => matches(i, args?.where));
    if (index === -1) {
      throw new Error(`Record to update not found.`);
    }
    const item = this.list[index];
    const updatedItem = {
      ...item,
      ...args.data,
      updatedAt: new Date()
    };
    this.list[index] = updatedItem;
    saveToDisk();
    return loadRelations(updatedItem, this.modelName, args?.include);
  }

  async delete(args) {
    await ensureDbLoaded();
    const index = this.list.findIndex(i => matches(i, args?.where));
    if (index === -1) {
      throw new Error(`Record to delete not found.`);
    }
    const deleted = this.list.splice(index, 1)[0];
    saveToDisk();
    return deleted;
  }

  async deleteMany(args) {
    await ensureDbLoaded();
    const originalCount = this.list.length;
    this.list = this.list.filter(i => !matches(i, args?.where));
    saveToDisk();
    return { count: originalCount - this.list.length };
  }

  async count(args) {
    await ensureDbLoaded();
    return this.list.filter(i => matches(i, args?.where)).length;
  }

  async groupBy(args) {
    await ensureDbLoaded();
    const groups = {};
    const filtered = this.list.filter(i => matches(i, args?.where));
    for (const item of filtered) {
      const groupKey = args.by.map(k => item[k]).join('-');
      if (!groups[groupKey]) {
        groups[groupKey] = {
          _count: { id: 0, _all: 0 },
          _sum: {},
          keys: args.by.reduce((acc, k) => ({ ...acc, [k]: item[k] }), {})
        };
      }
      groups[groupKey]._count.id++;
      groups[groupKey]._count._all++;
    }
    return Object.values(groups).map(g => ({
      ...g.keys,
      _count: g._count
    }));
  }
}

export const prisma = {
  user: new MockModel('users', 'user'),
  department: new MockModel('departments', 'department'),
  officer: new MockModel('officers', 'officer'),
  complaint: new MockModel('complaints', 'complaint'),
  image: new MockModel('images', 'image'),
  aIAnalysis: new MockModel('aiAnalyses', 'aiAnalysis'),
  statusHistory: new MockModel('statusHistories', 'statusHistory'),
  notification: new MockModel('notifications', 'notification'),
  refreshToken: new MockModel('refreshTokens', 'refreshToken'),
  auditLog: new MockModel('auditLogs', 'auditLog'),

  async $transaction(arg) {
    if (typeof arg === 'function') {
      return arg(prisma);
    } else if (Array.isArray(arg)) {
      return Promise.all(arg);
    }
    return arg;
  },

  async $disconnect() {
    return Promise.resolve();
  }
};
