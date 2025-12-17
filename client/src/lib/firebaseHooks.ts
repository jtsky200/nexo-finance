import { useState, useEffect, useCallback } from 'react';

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  Timestamp,
  QueryConstraint,
  onSnapshot,
  QuerySnapshot,
  DocumentSnapshot
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

import { db, functions } from './firebase';

// Helper function to handle Firebase function calls with timeout and better error handling
async function callFunctionWithTimeout<T = any>(
  functionName: string,
  data: any,
  timeout: number = 30000 // 30 seconds default
): Promise<T> {
  const func = httpsCallable(functions, functionName);
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timeout: ${functionName} took longer than ${timeout}ms`));
    }, timeout);
  });

  try {
    const result = await Promise.race([func(data), timeoutPromise]);
    return result.data as T;
  } catch (error: any) {
    // Handle specific Firebase errors
    if (error?.code && typeof error.code === 'string') {
      switch (error.code) {
        case 'unauthenticated':
          throw new Error('Bitte melden Sie sich an');
        case 'permission-denied':
          throw new Error('Sie haben keine Berechtigung für diese Aktion');
        case 'not-found':
          throw new Error('Ressource nicht gefunden');
        case 'invalid-argument':
          throw new Error(error.message || 'Ungültige Eingabe');
        case 'deadline-exceeded':
          throw new Error('Anfrage dauerte zu lange. Bitte versuchen Sie es erneut');
        case 'resource-exhausted':
          throw new Error('Service vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut');
        case 'failed-precondition':
          throw new Error('Vorbedingung nicht erfüllt');
        case 'aborted':
          throw new Error('Anfrage wurde abgebrochen');
        case 'out-of-range':
          throw new Error('Wert außerhalb des gültigen Bereichs');
        case 'unimplemented':
          throw new Error('Funktion nicht implementiert');
        case 'internal':
          throw new Error('Interner Serverfehler. Bitte versuchen Sie es später erneut');
        case 'unavailable':
          throw new Error('Service nicht verfügbar. Bitte überprüfen Sie Ihre Internetverbindung');
        case 'data-loss':
          throw new Error('Datenverlust aufgetreten');
        default:
          throw new Error(error.message || 'Ein Fehler ist aufgetreten');
      }
    }
    
    // Handle network errors
    if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
      throw new Error('Anfrage dauerte zu lange. Bitte überprüfen Sie Ihre Internetverbindung');
    }
    
    if (error.message?.includes('network') || error.message?.includes('Network') || error.message?.includes('fetch')) {
      throw new Error('Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung');
    }
    
    // Re-throw with original message if it's already a user-friendly error
    throw error;
  }
}

// ========== Reminders Hooks ==========

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  type: 'termin' | 'zahlung' | 'aufgabe' | string;
  dueDate: Date | string;
  date?: Date | string | null;
  isAllDay: boolean;
  amount?: number | null;
  currency?: string | null;
  notes?: string | null;
  recurrenceRule?: string | null;
  status: 'offen' | 'erledigt' | 'überfällig' | 'ausstehend' | string;
  createdAt: Date;
  updatedAt: Date;
}

export function useReminders(filters?: { startDate?: Date; endDate?: Date; status?: string }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  // Use Firestore real-time listener for immediate synchronization
  useEffect(() => {
    if (!user) {
      setReminders([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // Build Firestore query
    let q: any = query(
      collection(db, 'reminders'),
      where('userId', '==', user.uid)
    );

    // Apply filters
    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters?.startDate) {
      q = query(q, where('dueDate', '>=', Timestamp.fromDate(filters.startDate)));
    }
    if (filters?.endDate) {
      q = query(q, where('dueDate', '<=', Timestamp.fromDate(filters.endDate)));
    }

    // Order by dueDate
    q = query(q, orderBy('dueDate'));

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot) => {
        try {
          const mappedReminders = snapshot.docs.map((doc: DocumentSnapshot) => {
            const data = doc.data();
            if (!data) {
              return null;
            }
            
            // Handle Firestore Timestamps
            let dueDate: Date | string = new Date();
            if (data.dueDate) {
              if (data.dueDate.toDate && typeof data.dueDate.toDate === 'function') {
                dueDate = data.dueDate.toDate();
              } else if (data.dueDate instanceof Date) {
                dueDate = data.dueDate;
              } else if (typeof data.dueDate === 'string') {
                const parsedDate = new Date(data.dueDate);
                if (!isNaN(parsedDate.getTime())) {
                  dueDate = parsedDate;
                }
              }
            }
            
            let createdAt: Date | null = null;
            if (data.createdAt) {
              if (data.createdAt.toDate && typeof data.createdAt.toDate === 'function') {
                createdAt = data.createdAt.toDate();
              } else if (data.createdAt instanceof Date) {
                createdAt = data.createdAt;
              } else if (typeof data.createdAt === 'string') {
                createdAt = new Date(data.createdAt);
                if (isNaN(createdAt.getTime())) {
                  createdAt = null;
                }
              }
            }
            
            let updatedAt: Date | null = null;
            if (data.updatedAt) {
              if (data.updatedAt.toDate && typeof data.updatedAt.toDate === 'function') {
                updatedAt = data.updatedAt.toDate();
              } else if (data.updatedAt instanceof Date) {
                updatedAt = data.updatedAt;
              } else if (typeof data.updatedAt === 'string') {
                updatedAt = new Date(data.updatedAt);
                if (isNaN(updatedAt.getTime())) {
                  updatedAt = null;
                }
              }
            }
            
            return {
              id: doc.id,
              userId: data.userId || user.uid,
              title: data.title || '',
              type: data.type || 'erinnerung',
              dueDate: dueDate,
              isAllDay: data.isAllDay || false,
              amount: data.amount || null,
              currency: data.currency || 'CHF',
              notes: data.notes || null,
              recurrenceRule: data.recurrenceRule || null,
              personId: data.personId || null,
              personName: data.personName || null,
              status: data.status || 'offen',
              createdAt: createdAt || new Date(),
              updatedAt: updatedAt || new Date(),
            };
          }).filter((r) => r !== null) as Reminder[];
          
          setReminders(mappedReminders);
          setError(null);
        } catch (err) {
          setError(err as Error);
          console.error('[useReminders] Error processing snapshot:', err);
        } finally {
          setIsLoading(false);
        }
      },
      (err: any) => {
        // Handle specific Firestore errors gracefully
        if (err?.code === 'failed-precondition') {
          console.error('[useReminders] Firestore index missing:', err.message);
        }
        setError(err);
        setIsLoading(false);
        console.error('[useReminders] Snapshot error:', err);
      }
    );

    return () => unsubscribe();
  }, [user, filters?.startDate, filters?.endDate, filters?.status]);

  const refetch = () => {
    // Real-time listener automatically updates, but we can trigger a re-render
    setReminders(prev => [...prev]);
  };

  return { data: reminders, isLoading, error, refetch };
}

// ========== Person Reminders Hook ==========
export function usePersonReminders(personId: string | undefined) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchReminders = useCallback(async () => {
    if (!personId) {
      setReminders([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await callFunctionWithTimeout<{ reminders: any[] }>('getReminders', { personId });
      
      const mappedReminders = (data.reminders || []).map((r: any) => ({
        ...r,
        dueDate: r.dueDate?.toDate ? r.dueDate.toDate() : (r.dueDate ? new Date(r.dueDate) : new Date()),
        createdAt: r.createdAt?.toDate ? r.createdAt.toDate() : (r.createdAt ? new Date(r.createdAt) : new Date()),
        updatedAt: r.updatedAt?.toDate ? r.updatedAt.toDate() : (r.updatedAt ? new Date(r.updatedAt) : new Date()),
      }));
      
      setReminders(mappedReminders);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [personId]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders, refreshKey]);

  const refetch = async () => {
    await fetchReminders();
  };

  return { data: reminders, isLoading, error, refetch };
}

// ========== All Bills Hook (combines person invoices + payment reminders) ==========
export interface Bill {
  id: string;
  source: 'person' | 'reminder';
  personId: string | null;
  personName: string | null;
  title: string;
  description: string;
  amount: number;
  currency: string;
  status: 'open' | 'paid' | 'postponed';
  direction: 'incoming' | 'outgoing';
  dueDate: Date | null;
  reminderDate: Date | null;
  reminderEnabled: boolean;
  isRecurring: boolean;
  recurringInterval: string | null;
  notes: string | null;
  iban?: string;
  reference?: string;
  creditorName?: string;
  creditorAddress?: string;
  date: Date | null;
  createdAt: Date | null;
  isOverdue: boolean;
}

export interface BillStats {
  total: number;
  open: number;
  openAmount: number;
  overdue: number;
  overdueAmount: number;
  paid: number;
  paidAmount: number;
}

export function useAllBills() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [stats, setStats] = useState<BillStats>({ total: 0, open: 0, openAmount: 0, overdue: 0, overdueAmount: 0, paid: 0, paidAmount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchBills = async () => {
      try {
        setIsLoading(true);
        const data = await callFunctionWithTimeout<{ bills: any[]; stats: BillStats }>('getAllBills', {});
        
        const mappedBills = (data.bills || []).map((b: any) => ({
          ...b,
          dueDate: b.dueDate ? new Date(b.dueDate) : null,
          reminderDate: b.reminderDate ? new Date(b.reminderDate) : null,
          date: b.date ? new Date(b.date) : null,
          createdAt: b.createdAt ? new Date(b.createdAt) : null,
        }));
        
        setBills(mappedBills);
        setStats(data.stats);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBills();
  }, [refreshKey]);

  const refetch = () => setRefreshKey(prev => prev + 1);

  return { data: bills, stats, isLoading, error, refetch };
}

export async function createReminder(data: Omit<Reminder, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'>) {
  // Ensure dueDate is a Date object (not ISO string) for proper timezone handling
  const normalizedData = {
    ...data,
    dueDate: data.dueDate instanceof Date ? data.dueDate : (data.dueDate ? new Date(data.dueDate) : new Date()),
  };
  return await callFunctionWithTimeout('createReminder', normalizedData);
}

export async function updateReminder(id: string, data: Partial<Reminder>) {
  // Ensure dueDate is a Date object (not ISO string) for proper timezone handling
  const normalizedData: any = { id, ...data };
  if (data.dueDate !== undefined) {
    normalizedData.dueDate = data.dueDate instanceof Date ? data.dueDate : (data.dueDate ? new Date(data.dueDate) : new Date());
  }
  return await callFunctionWithTimeout('updateReminder', normalizedData);
}

export async function deleteReminder(id: string) {
  return await callFunctionWithTimeout('deleteReminder', { id });
}

export async function fixReminderTimes() {
  return await callFunctionWithTimeout('fixReminderTimes', {});
}

// ========== Finance Hooks ==========

export interface FinanceEntry {
  id: string;
  userId: string;
  date: Date | string;
  type: 'einnahme' | 'ausgabe' | 'income' | 'expense';
  category: string;
  amount: number;
  currency: string;
  paymentMethod?: string | null;
  notes?: string | null;
  description?: string | null;
  status?: string | null;
  isRecurring: boolean;
  recurrenceRule?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function useFinanceEntries(filters?: { startDate?: Date; endDate?: Date; type?: string }) {
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  // Use Firestore real-time listener for immediate synchronization
  useEffect(() => {
    if (!user) {
      setEntries([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // Build Firestore query
    let q: any = query(
      collection(db, 'financeEntries'),
      where('userId', '==', user.uid)
    );

    // Apply filters
    if (filters?.type) {
      q = query(q, where('type', '==', filters.type));
    }
    if (filters?.startDate) {
      q = query(q, where('date', '>=', Timestamp.fromDate(filters.startDate)));
    }
    if (filters?.endDate) {
      q = query(q, where('date', '<=', Timestamp.fromDate(filters.endDate)));
    }

    // Order by date descending
    q = query(q, orderBy('date', 'desc'));

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot) => {
        try {
          const mappedEntries = snapshot.docs.map((doc: DocumentSnapshot) => {
            const data = doc.data();
            if (!data) {
              return null;
            }
            
            // Handle Firestore Timestamps
            let date: Date = new Date();
            if (data.date) {
              if (data.date.toDate && typeof data.date.toDate === 'function') {
                date = data.date.toDate();
              } else if (data.date instanceof Date) {
                date = data.date;
              } else if (typeof data.date === 'string') {
                const parsedDate = new Date(data.date);
                if (!isNaN(parsedDate.getTime())) {
                  date = parsedDate;
                }
              }
            }
            
            let createdAt: Date | null = null;
            if (data.createdAt) {
              if (data.createdAt.toDate && typeof data.createdAt.toDate === 'function') {
                createdAt = data.createdAt.toDate();
              } else if (data.createdAt instanceof Date) {
                createdAt = data.createdAt;
              } else if (typeof data.createdAt === 'string') {
                createdAt = new Date(data.createdAt);
                if (isNaN(createdAt.getTime())) {
                  createdAt = null;
                }
              }
            }
            
            let updatedAt: Date | null = null;
            if (data.updatedAt) {
              if (data.updatedAt.toDate && typeof data.updatedAt.toDate === 'function') {
                updatedAt = data.updatedAt.toDate();
              } else if (data.updatedAt instanceof Date) {
                updatedAt = data.updatedAt;
              } else if (typeof data.updatedAt === 'string') {
                updatedAt = new Date(data.updatedAt);
                if (isNaN(updatedAt.getTime())) {
                  updatedAt = null;
                }
              }
            }
            
            return {
              id: doc.id,
              userId: data.userId || user.uid,
              type: data.type || 'ausgabe',
              category: data.category || '',
              description: data.description || '',
              amount: data.amount || 0,
              currency: data.currency || 'CHF',
              paymentMethod: data.paymentMethod || 'Karte',
              date: date || new Date(),
              isRecurring: data.isRecurring || false,
              recurrenceRule: data.recurrenceRule || null,
              createdAt: createdAt || new Date(),
              updatedAt: updatedAt || new Date(),
            };
          }).filter((e) => e !== null) as FinanceEntry[];
          
          setEntries(mappedEntries);
          setError(null);
        } catch (err) {
          setError(err as Error);
          console.error('[useFinanceEntries] Error processing snapshot:', err);
        } finally {
          setIsLoading(false);
        }
      },
      (err: any) => {
        // Handle specific Firestore errors gracefully
        if (err?.code === 'failed-precondition') {
          console.error('[useFinanceEntries] Firestore index missing:', err.message);
        }
        setError(err);
        setIsLoading(false);
        console.error('[useFinanceEntries] Snapshot error:', err);
      }
    );

    return () => unsubscribe();
  }, [user, filters?.startDate, filters?.endDate, filters?.type]);

  const refetch = () => {
    // Real-time listener automatically updates, but we can trigger a re-render
    setEntries(prev => [...prev]);
  };

  return { data: entries, isLoading, error, refetch };
}

export async function createFinanceEntry(data: Omit<FinanceEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
  return await callFunctionWithTimeout('createFinanceEntry', data);
}

export async function updateFinanceEntry(id: string, data: Partial<FinanceEntry>) {
  return await callFunctionWithTimeout('updateFinanceEntry', { id, ...data });
}

export async function deleteFinanceEntry(id: string) {
  return await callFunctionWithTimeout('deleteFinanceEntry', { id });
}

// ========== Tax Profile Hooks ==========

export interface TaxProfile {
  id: string;
  userId: string;
  taxYear: number;
  country: string;
  canton?: string | null;
  status: 'unvollständig' | 'vollständig' | 'eingereicht';
  maritalStatus?: string | null;
  numberOfChildren: number;
  grossIncome?: number | null;
  otherIncome?: number | null;
  deductions?: number | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function useTaxProfiles(refreshKey?: number) {
  const [profiles, setProfiles] = useState<TaxProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfiles = useCallback(async () => {
    try {
      setIsLoading(true);
      const getProfilesFunc = httpsCallable(functions, 'getTaxProfiles');
      const result = await getProfilesFunc({});
      const data = result.data as { profiles: any[] };
      
      const mappedProfiles = (data.profiles || []).map((p: any) => ({
        ...p,
        createdAt: p.createdAt?.toDate ? p.createdAt.toDate() : (p.createdAt ? new Date(p.createdAt) : new Date()),
        updatedAt: p.updatedAt?.toDate ? p.updatedAt.toDate() : (p.updatedAt ? new Date(p.updatedAt) : new Date()),
      }));
      
      setProfiles(mappedProfiles);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles, refreshKey]);

  return { data: profiles, isLoading, error, refetch: fetchProfiles };
}

export async function getTaxProfileByYear(year: number) {
  const getProfileFunc = httpsCallable(functions, 'getTaxProfileByYear');
  const result = await getProfileFunc({ year });
  const data = result.data as { profile: any };
  
  if (!data.profile) return null;
  
  return {
    ...data.profile,
    createdAt: data.profile.createdAt?.toDate ? data.profile.createdAt.toDate() : (data.profile.createdAt ? new Date(data.profile.createdAt) : new Date()),
    updatedAt: data.profile.updatedAt?.toDate ? data.profile.updatedAt.toDate() : (data.profile.updatedAt ? new Date(data.profile.updatedAt) : new Date()),
  };
}

export async function createTaxProfile(data: Omit<TaxProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'country' | 'status'>) {
  const createProfileFunc = httpsCallable(functions, 'createTaxProfile');
  const result = await createProfileFunc(data);
  return result.data;
}

export async function updateTaxProfile(id: string, data: Partial<TaxProfile>) {
  const updateProfileFunc = httpsCallable(functions, 'updateTaxProfile');
  await updateProfileFunc({ id, ...data });
}

export async function deleteTaxProfile(id: string) {
  const deleteProfileFunc = httpsCallable(functions, 'deleteTaxProfile');
  await deleteProfileFunc({ id });
}

// ========== People Hooks ==========

export interface Person {
  id: string;
  userId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  type: 'household' | 'external' | 'child'; // Haushalt, Externe Person oder Kind
  relationship?: 'creditor' | 'debtor' | 'both' | null; // Nur für external
  notes?: string | null;
  totalOwed: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  invoices?: Invoice[];
}

export function usePeople() {
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  // Use Firestore real-time listener for immediate synchronization
  useEffect(() => {
    if (!user) {
      setPeople([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // Build Firestore query
    const q = query(
      collection(db, 'people'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const mappedPeople = snapshot.docs.map((doc: DocumentSnapshot) => {
            const data = doc.data();
            if (!data) {
              return null;
            }
            
            // Handle Firestore Timestamps
            let createdAt: Date = new Date();
            if (data.createdAt) {
              if (data.createdAt.toDate && typeof data.createdAt.toDate === 'function') {
                createdAt = data.createdAt.toDate();
              } else if (data.createdAt instanceof Date) {
                createdAt = data.createdAt;
              } else if (typeof data.createdAt === 'string') {
                const parsedDate = new Date(data.createdAt);
                if (!isNaN(parsedDate.getTime())) {
                  createdAt = parsedDate;
                }
              }
            }
            
            let updatedAt: Date = new Date();
            if (data.updatedAt) {
              if (data.updatedAt.toDate && typeof data.updatedAt.toDate === 'function') {
                updatedAt = data.updatedAt.toDate();
              } else if (data.updatedAt instanceof Date) {
                updatedAt = data.updatedAt;
              } else if (typeof data.updatedAt === 'string') {
                const parsedDate = new Date(data.updatedAt);
                if (!isNaN(parsedDate.getTime())) {
                  updatedAt = parsedDate;
                }
              }
            }
            
            return {
              id: doc.id,
              userId: data.userId || user.uid,
              name: data.name || '',
              email: data.email || null,
              phone: data.phone || null,
              type: data.type || 'external',
              relationship: data.relationship || null,
              notes: data.notes || null,
              totalOwed: data.totalOwed || 0,
              currency: data.currency || 'CHF',
              createdAt: createdAt,
              updatedAt: updatedAt,
              invoices: data.invoices || [],
            };
          }).filter((p) => p !== null) as Person[];
          
          setPeople(mappedPeople);
          setError(null);
        } catch (err) {
          setError(err as Error);
          console.error('[usePeople] Error processing snapshot:', err);
        } finally {
          setIsLoading(false);
        }
      },
      (err: any) => {
        // Handle specific Firestore errors gracefully
        if (err?.code === 'failed-precondition') {
          console.error('[usePeople] Firestore index missing:', err.message);
          // Try without orderBy as fallback
          const fallbackQ = query(
            collection(db, 'people'),
            where('userId', '==', user.uid)
          );
          const fallbackUnsubscribe = onSnapshot(
            fallbackQ,
            (snapshot: QuerySnapshot) => {
              try {
                const mappedPeople = snapshot.docs.map((doc: DocumentSnapshot) => {
                  const data = doc.data();
                  if (!data) return null;
                  return {
                    id: doc.id,
                    userId: data.userId || user.uid,
                    name: data.name || '',
                    email: data.email || null,
                    phone: data.phone || null,
                    type: data.type || 'external',
                    relationship: data.relationship || null,
                    notes: data.notes || null,
                    totalOwed: data.totalOwed || 0,
                    currency: data.currency || 'CHF',
                    createdAt: data.createdAt?.toDate?.() || new Date(),
                    updatedAt: data.updatedAt?.toDate?.() || new Date(),
                    invoices: data.invoices || [],
                  };
                }).filter((p) => p !== null) as Person[];
                setPeople(mappedPeople.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
                setError(null);
              } catch (mapErr) {
                setError(mapErr as Error);
                console.error('[usePeople] Error processing fallback snapshot:', mapErr);
              } finally {
                setIsLoading(false);
              }
            },
            (fallbackErr: Error) => {
              setError(fallbackErr);
              setIsLoading(false);
              console.error('[usePeople] Fallback snapshot error:', fallbackErr);
            }
          );
          return () => fallbackUnsubscribe();
        } else {
          setError(err);
          setIsLoading(false);
          console.error('[usePeople] Snapshot error:', err);
        }
      }
    );

    return () => unsubscribe();
  }, [user]);

  const refetch = () => {
    // Real-time listener automatically updates, but we can trigger a re-render
    setPeople(prev => [...prev]);
  };

  return { data: people, isLoading, error, refetch };
}

export async function createPerson(data: Omit<Person, 'id' | 'userId' | 'totalOwed' | 'createdAt' | 'updatedAt' | 'invoices'>) {
  const createPersonFunc = httpsCallable(functions, 'createPerson');
  const result = await createPersonFunc(data);
  return result.data;
}

export async function updatePerson(personId: string, data: Partial<Person>) {
  const updatePersonFunc = httpsCallable(functions, 'updatePerson');
  await updatePersonFunc({ personId, ...data });
}

export async function deletePerson(personId: string) {
  const deletePersonFunc = httpsCallable(functions, 'deletePerson');
  await deletePersonFunc({ personId });
}

// ========== Chat Reminders Hooks ==========

export interface ChatReminder {
  id: string;
  userId: string;
  reminderId: string;
  notificationType: '1day' | '1hour';
  message: string;
  reminderTitle: string;
  reminderType: string;
  dueDate: Date | string;
  isRead: boolean;
  shouldOpenDialog: boolean;
  askForFollowUp?: boolean;
  createdAt: Date | string;
  readAt?: Date | string;
}

export async function createFollowUpReminder(originalReminderId: string, minutesFromNow: number = 15) {
  const createFollowUpFunc = httpsCallable(functions, 'createFollowUpReminder');
  await createFollowUpFunc({ originalReminderId, minutesFromNow });
}

export function useChatReminders(unreadOnly: boolean = true) {
  const [reminders, setReminders] = useState<ChatReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Listen to data sync events and workflow events with debouncing
  useEffect(() => {
    let debounceTimeout: number | null = null;
    let lastRefreshTime = 0;
    let isMounted = true;
    const MIN_REFRESH_INTERVAL = 2000; // Minimum 2 seconds between refreshes

    const setupEventListeners = async () => {
      const { eventBus, Events } = await import('./eventBus');
      
      // Debounced refresh function
      const debouncedRefresh = () => {
        if (!isMounted) return;
        const now = Date.now();
        if (now - lastRefreshTime < MIN_REFRESH_INTERVAL) {
          if (debounceTimeout) {
            clearTimeout(debounceTimeout);
          }
          debounceTimeout = window.setTimeout(() => {
            if (isMounted) {
              setRefreshKey(prev => prev + 1);
              lastRefreshTime = Date.now();
            }
          }, MIN_REFRESH_INTERVAL);
        } else {
          if (isMounted) {
            setRefreshKey(prev => prev + 1);
            lastRefreshTime = now;
          }
        }
      };

      // Listen to data sync events with debouncing
      const unsubscribeSync = eventBus.on(Events.DATA_SYNC_START, (data: { type?: string }) => {
        if (!data?.type || data.type === 'all' || data.type === 'chatReminders') {
          debouncedRefresh();
        }
      });

      // Listen to chat reminder received events with debouncing
      const unsubscribeReminder = eventBus.on(Events.CHAT_REMINDER_RECEIVED, debouncedRefresh);

      return () => {
        if (debounceTimeout) {
          clearTimeout(debounceTimeout);
          debounceTimeout = null;
        }
        if (unsubscribeSync) unsubscribeSync();
        if (unsubscribeReminder) unsubscribeReminder();
      };
    };

    const cleanup = setupEventListeners();
    
    return () => {
      isMounted = false;
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
        debounceTimeout = null;
      }
      cleanup.then(unsubscribe => {
        if (unsubscribe) unsubscribe();
      }).catch(() => {
        // Ignore cleanup errors
      });
    };
  }, []);

  const fetchReminders = useCallback(async () => {
    try {
      setIsLoading(true);
      const getChatRemindersFunc = httpsCallable(functions, 'getChatReminders');
      const result = await getChatRemindersFunc({ unreadOnly });
      const data = result.data as { reminders: any[] };
      
      const mappedReminders = (data.reminders || []).map((r: any) => ({
        ...r,
        createdAt: r.createdAt ? (typeof r.createdAt === 'string' ? new Date(r.createdAt) : r.createdAt) : new Date(),
        dueDate: r.dueDate ? (typeof r.dueDate === 'string' ? new Date(r.dueDate) : r.dueDate) : new Date(),
        readAt: r.readAt ? (typeof r.readAt === 'string' ? new Date(r.readAt) : r.readAt) : undefined,
      }));
      
      setReminders(mappedReminders);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [unreadOnly]);

  useEffect(() => {
    fetchReminders();
    // Poll every 30 seconds for new reminders
    // Using polling instead of real-time listeners to avoid Firestore internal errors
    const interval = setInterval(fetchReminders, 30000);
    return () => clearInterval(interval);
  }, [fetchReminders, refreshKey]);

  const refetch = () => {
    setRefreshKey(prev => prev + 1);
  };

  return { data: reminders, isLoading, error, refetch };
}

export async function markChatReminderAsRead(reminderId: string) {
  const markReadFunc = httpsCallable(functions, 'markChatReminderAsRead');
  await markReadFunc({ reminderId });
}

// ========== Backup Functions ==========

export async function createManualBackup() {
  const backupFunc = httpsCallable(functions, 'createManualBackup');
  const result = await backupFunc({});
  return result.data as {
    backupId: string;
    backupUrl: string;
    documentCount: number;
  };
}

export async function listAllBackups(limit: number = 10) {
  const listFunc = httpsCallable(functions, 'listAllBackups');
  const result = await listFunc({ limit });
  return result.data as {
    backups: Array<{
      id: string;
      backupId: string;
      timestamp: string;
      documentCount: number;
      createdAt: string | null;
    }>;
  };
}

export async function restoreFromBackup(backupId: string, userId?: string) {
  const restoreFunc = httpsCallable(functions, 'restoreFromBackup');
  const result = await restoreFunc({ backupId, userId });
  return result.data as {
    restored: number;
    errors: number;
  };
}

export function usePersonDebts(personId: string) {
  const [debts, setDebts] = useState<FinanceEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!personId) return;

    const fetchDebts = async () => {
      try {
        setIsLoading(true);
        const getDebtsFunc = httpsCallable(functions, 'getPersonDebts');
        const result = await getDebtsFunc({ personId });
        const data = result.data as { debts: any[] };
        
        const mappedDebts = (data.debts || []).map((d: any) => ({
          ...d,
          date: d.date?.toDate ? d.date.toDate() : (d.date ? new Date(d.date) : new Date()),
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : (d.createdAt ? new Date(d.createdAt) : new Date()),
          updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate() : (d.updatedAt ? new Date(d.updatedAt) : new Date()),
        }));
        
        setDebts(mappedDebts);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDebts();
  }, [personId]);

  return { data: debts, isLoading, error };
}

// ========== Shopping List Hooks ==========

export interface ShoppingList {
  id: string;
  userId: string;
  name: string;
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShoppingItem {
  id: string;
  userId: string;
  listId?: string; // ID der Einkaufsliste (optional, wird automatisch auf Standardliste gesetzt)
  item: string;
  quantity: number;
  unit?: string | null;
  category: string;
  estimatedPrice: number;
  actualPrice?: number | null;
  currency: string;
  store?: string | null;
  articleNumber?: string | null; // Artikelnummer (EAN, Barcode, etc.)
  productInfo?: {
    brand?: string;
    description?: string;
    imageUrl?: string;
    scannedData?: any;
  } | null;
  saveToDatabase?: boolean; // Für zukünftige Käufe speichern
  status: 'not_bought' | 'bought';
  boughtAt?: Date | null;
  linkedExpenseId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function useShoppingList(status?: string) {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setIsLoading(true);
        const getItemsFunc = httpsCallable(functions, 'getShoppingList');
        const result = await getItemsFunc({ status });
        const data = result.data as { items: any[] };
        
        const mappedItems = (data.items || []).map((i: any) => ({
          ...i,
          boughtAt: i.boughtAt?.toDate ? i.boughtAt.toDate() : (i.boughtAt ? new Date(i.boughtAt) : null),
          createdAt: i.createdAt?.toDate ? i.createdAt.toDate() : (i.createdAt ? new Date(i.createdAt) : new Date()),
          updatedAt: i.updatedAt?.toDate ? i.updatedAt.toDate() : (i.updatedAt ? new Date(i.updatedAt) : new Date()),
        }));
        
        setItems(mappedItems);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, [status, refreshKey]);

  const refetch = () => setRefreshKey(prev => prev + 1);

  return { data: items, isLoading, error, refetch };
}

export async function createShoppingList(name: string, isDefault?: boolean) {
  const createListFunc = httpsCallable(functions, 'createShoppingList');
  const result = await createListFunc({ name, isDefault });
  return result.data;
}

export async function updateShoppingList(listId: string, data: { name?: string; isDefault?: boolean }) {
  const updateListFunc = httpsCallable(functions, 'updateShoppingList');
  await updateListFunc({ listId, ...data });
}

export async function deleteShoppingList(listId: string) {
  const deleteListFunc = httpsCallable(functions, 'deleteShoppingList');
  await deleteListFunc({ listId });
}

export async function createShoppingItem(data: Omit<ShoppingItem, 'id' | 'userId' | 'status' | 'boughtAt' | 'linkedExpenseId' | 'createdAt' | 'updatedAt'> & { listId?: string }) {
  const createItemFunc = httpsCallable(functions, 'createShoppingItem');
  const result = await createItemFunc(data);
  return result.data;
}

export async function updateShoppingItem(itemId: string, data: Partial<ShoppingItem>) {
  const updateItemFunc = httpsCallable(functions, 'updateShoppingItem');
  await updateItemFunc({ itemId, ...data });
}

export async function deleteShoppingItem(itemId: string) {
  const deleteItemFunc = httpsCallable(functions, 'deleteShoppingItem');
  await deleteItemFunc({ itemId });
}

export async function markShoppingItemAsBought(itemId: string, actualPrice?: number, createExpense?: boolean) {
  const markFunc = httpsCallable(functions, 'markShoppingItemAsBought');
  const result = await markFunc({ itemId, actualPrice, createExpense });
  return result.data;
}

// ========== Invoice Hooks ==========

export interface Invoice {
  id: string;
  amount: number;
  description: string;
  date: Date;
  dueDate?: Date; // Fälligkeitsdatum
  reminderDate?: Date; // Erinnerungsdatum
  reminderEnabled?: boolean;
  isRecurring?: boolean; // Wiederkehrende Rechnung
  recurringInterval?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  status: 'open' | 'paid' | 'postponed';
  direction: 'incoming' | 'outgoing'; // incoming = Person schuldet mir, outgoing = Ich schulde Person
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export function usePersonInvoices(personId: string | undefined) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchInvoices = useCallback(async () => {
    if (!personId) {
      setInvoices([]);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const getInvoicesFunc = httpsCallable(functions, 'getPersonInvoices');
      const result = await getInvoicesFunc({ personId });
      const data = result.data as { invoices: any[] };
      
      const mappedInvoices = (data.invoices || []).map((inv: any) => {
        try {
          const mapped: any = {
            ...inv,
            date: inv.date?.toDate ? inv.date.toDate() : (inv.date ? (typeof inv.date === 'string' ? new Date(inv.date) : new Date(inv.date)) : new Date()),
            createdAt: inv.createdAt?.toDate ? inv.createdAt.toDate() : (inv.createdAt ? (typeof inv.createdAt === 'string' ? new Date(inv.createdAt) : new Date(inv.createdAt)) : new Date()),
            updatedAt: inv.updatedAt?.toDate ? inv.updatedAt.toDate() : (inv.updatedAt ? (typeof inv.updatedAt === 'string' ? new Date(inv.updatedAt) : new Date(inv.updatedAt)) : new Date()),
          };
          
          // Convert installment dates if present
          if (inv.installments && Array.isArray(inv.installments)) {
            mapped.installments = inv.installments.map((inst: any) => ({
              ...inst,
              dueDate: inst.dueDate?.toDate ? inst.dueDate.toDate() : (inst.dueDate ? (typeof inst.dueDate === 'string' ? new Date(inst.dueDate) : new Date(inst.dueDate)) : null),
              paidDate: inst.paidDate?.toDate ? inst.paidDate.toDate() : (inst.paidDate ? (typeof inst.paidDate === 'string' ? new Date(inst.paidDate) : new Date(inst.paidDate)) : null),
            }));
          }
          
          if (inv.installmentEndDate) {
            mapped.installmentEndDate = inv.installmentEndDate?.toDate ? inv.installmentEndDate.toDate() : (typeof inv.installmentEndDate === 'string' ? new Date(inv.installmentEndDate) : new Date(inv.installmentEndDate));
          }
          
          return mapped;
        } catch (err) {
          // Return invoice with safe defaults
          return {
            ...inv,
            date: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
      });
      
      setInvoices(mappedInvoices);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [personId]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const refetch = async () => {
    await fetchInvoices();
  };

  return { data: invoices, isLoading, error, refetch };
}

export async function createInvoice(personId: string, data: { 
  amount: number; 
  description: string; 
  date: Date; 
  status?: string; 
  direction?: 'incoming' | 'outgoing';
  dueDate?: Date;
  reminderDate?: Date;
  reminderEnabled?: boolean;
  notes?: string;
  isRecurring?: boolean;
  recurringInterval?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  isInstallmentPlan?: boolean;
  installmentCount?: number;
  installmentAmount?: number;
  installmentInterval?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}) {
  const createInvoiceFunc = httpsCallable(functions, 'createInvoice');
  const result = await createInvoiceFunc({ personId, ...data });
  return result.data;
}

export async function recordInstallmentPayment(personId: string, invoiceId: string, installmentNumber: number, paidAmount: number, paidDate?: Date) {
  const recordPaymentFunc = httpsCallable(functions, 'recordInstallmentPayment');
  const result = await recordPaymentFunc({ 
    personId, 
    invoiceId, 
    installmentNumber, 
    paidAmount, 
    paidDate: paidDate || new Date() 
  });
  return result.data;
}

export async function updateInvoice(personId: string, invoiceId: string, data: { 
  amount?: number; 
  description?: string; 
  date?: Date;
  dueDate?: Date;
  reminderDate?: Date;
  reminderEnabled?: boolean;
  notes?: string;
  isRecurring?: boolean;
  recurringInterval?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  isInstallmentPlan?: boolean;
  installmentCount?: number;
  installmentInterval?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}) {
  const updateInvoiceFunc = httpsCallable(functions, 'updateInvoice');
  await updateInvoiceFunc({ personId, invoiceId, ...data });
}

export async function updateInvoiceStatus(personId: string, invoiceId: string, status: string) {
  const updateStatusFunc = httpsCallable(functions, 'updateInvoiceStatus');
  await updateStatusFunc({ personId, invoiceId, status });
}

export async function deleteInvoice(personId: string, invoiceId: string) {
  const deleteInvoiceFunc = httpsCallable(functions, 'deleteInvoice');
  await deleteInvoiceFunc({ personId, invoiceId });
}

export async function updateInstallmentPlan(personId: string, invoiceId: string, installments: any[]) {
  const updateFunc = httpsCallable(functions, 'updateInstallmentPlan');
  const result = await updateFunc({ personId, invoiceId, installments });
  return result.data;
}

export async function convertToInstallmentPlan(personId: string, invoiceId: string, data: {
  installmentAmount?: number;
  installmentCount?: number;
  installmentInterval: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate?: Date;
}) {
  const convertFunc = httpsCallable(functions, 'convertToInstallmentPlan');
  const result = await convertFunc({ personId, invoiceId, ...data });
  return result.data;
}

// ========== Stores & Receipt Hooks ==========

export interface StoreItem {
  id: string;
  name: string;
  articleNumber?: string;
  category: string;
  lastPrice: number;
  priceHistory: Array<{ price: number; date: string }>;
  purchaseCount: number;
}

export interface Store {
  id: string;
  name: string;
  address?: string;
  city?: string;
  postalCode?: string;
  createdAt?: string;
}

export interface Receipt {
  id: string;
  storeId: string;
  storeName: string;
  purchaseDate?: string;
  purchaseTime?: string;
  total: number;
  itemCount: number;
  createdAt?: string;
}

export function useStores() {
  const [data, setData] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStores = useCallback(async () => {
    try {
      setIsLoading(true);
      const getStoresFunc = httpsCallable(functions, 'getStores');
      const result = await getStoresFunc({});
      const response = result.data as { success: boolean; stores: Store[] };
      setData(response.stores || []);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  return { data, isLoading, error, refetch: fetchStores };
}

export function useStoreItems(storeId?: string, storeName?: string) {
  const [data, setData] = useState<StoreItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchItems = useCallback(async () => {
    if (!storeId && !storeName) {
      setData([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const getStoreItemsFunc = httpsCallable(functions, 'getStoreItems');
      const result = await getStoreItemsFunc({ storeId, storeName });
      const response = result.data as { success: boolean; items: StoreItem[] };
      setData(response.items || []);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [storeId, storeName]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return { data, isLoading, error, refetch: fetchItems };
}

export function useReceipts(limit?: number, storeId?: string) {
  const [data, setData] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReceipts = useCallback(async () => {
    try {
      setIsLoading(true);
      const getReceiptsFunc = httpsCallable(functions, 'getReceipts');
      const result = await getReceiptsFunc({ limit, storeId });
      const response = result.data as { success: boolean; receipts: Receipt[] };
      setData(response.receipts || []);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [limit, storeId]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  return { data, isLoading, error, refetch: fetchReceipts };
}

// ========== Chat Conversations Hooks ==========

export interface ChatConversation {
  id: string;
  userId: string;
  title: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export function useChatConversations() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // Use Firestore real-time listener for immediate synchronization
    const unsubscribe = onSnapshot(
      collection(db, 'chatConversations'),
      (snapshot) => {
        try {
          const mappedConversations = snapshot.docs
            .filter(doc => doc.data().userId === user.uid)
            .map((doc) => {
              const data = doc.data();
              let createdAt: Date | string = new Date();
              if (data.createdAt) {
                if (data.createdAt.toDate) {
                  createdAt = data.createdAt.toDate().toISOString();
                } else if (typeof data.createdAt === 'string') {
                  createdAt = data.createdAt;
                } else {
                  createdAt = new Date(data.createdAt).toISOString();
                }
              }
              
              let updatedAt: Date | string = new Date();
              if (data.updatedAt) {
                if (data.updatedAt.toDate) {
                  updatedAt = data.updatedAt.toDate().toISOString();
                } else if (typeof data.updatedAt === 'string') {
                  updatedAt = data.updatedAt;
                } else {
                  updatedAt = new Date(data.updatedAt).toISOString();
                }
              }
              
              return {
                id: doc.id,
                userId: data.userId || user.uid,
                title: data.title || 'Neue Konversation',
                messages: data.messages || [],
                createdAt,
                updatedAt,
              };
            });
          
          // Sort by updatedAt descending (most recent first)
          mappedConversations.sort((a, b) => {
            const aTime = typeof a.updatedAt === 'string' ? new Date(a.updatedAt).getTime() : a.updatedAt.getTime();
            const bTime = typeof b.updatedAt === 'string' ? new Date(b.updatedAt).getTime() : b.updatedAt.getTime();
            return bTime - aTime;
          });
          
          setConversations(mappedConversations);
          setError(null);
        } catch (err) {
          console.error('Error processing chat conversations:', err);
          setError(err as Error);
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        console.error('Firestore listener error:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const refetch = async () => {
    // Trigger a refresh by updating refresh key (listener will automatically update)
    // For real-time listeners, refetch is not needed, but kept for compatibility
    if (user) {
      setIsLoading(true);
      try {
        const data = await callFunctionWithTimeout<{ conversations: any[] }>('getChatConversations', {});
        // The listener will update automatically, but we can force a refresh
        setConversations(prev => [...prev]); // Trigger re-render
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return { data: conversations, isLoading, error, refetch };
}

export async function createChatConversation(data: Omit<ChatConversation, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
  const result = await callFunctionWithTimeout<{ id: string; createdAt: string; updatedAt: string }>('createChatConversation', data);
  return result;
}

export async function updateChatConversation(id: string, data: Partial<Pick<ChatConversation, 'title' | 'messages'>>) {
  await callFunctionWithTimeout('updateChatConversation', { id, ...data });
}

export async function deleteChatConversation(id: string) {
  await callFunctionWithTimeout('deleteChatConversation', { id });
}

export async function clearAllChatConversations() {
  const result = await callFunctionWithTimeout<{ success: boolean; deletedCount: number }>('clearAllChatConversations', {});
  return result;
}

// ========== User Settings Hooks ==========

export interface QuickAddTemplate {
  id: string;
  name: string;
  category: string;
  price: number;
}

export interface ShoppingBudget {
  amount: number;
  isSet: boolean;
}

export interface UserSettings {
  ocrProvider?: string;
  openaiApiKey?: string | null;
  autoConfirmDocuments?: boolean;
  defaultFolder?: string;
  language?: string;
  theme?: string;
  weatherLocation?: string;
  shoppingBudget?: ShoppingBudget;
  quickAddTemplates?: QuickAddTemplate[];
  currency?: string;
  canton?: string;
  notificationsEnabled?: boolean;
  glassEffectEnabled?: boolean;
  biometricEnabled?: boolean;
  preferDesktop?: boolean;
  tutorialHighlights?: Array<{ selector: string; title: string; description: string }> | null;
  sidebarWidth?: number;
}

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const getSettingsFunc = httpsCallable(functions, 'getUserSettings');
        const result = await getSettingsFunc({});
        const data = result.data as UserSettings;
        setSettings(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    try {
      const updateSettingsFunc = httpsCallable(functions, 'updateUserSettings');
      await updateSettingsFunc(newSettings);
      
      // Update local state
      setSettings(prev => prev ? { ...prev, ...newSettings } : newSettings as UserSettings);
      return { success: true };
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  return { settings, isLoading, error, updateSettings };
}
