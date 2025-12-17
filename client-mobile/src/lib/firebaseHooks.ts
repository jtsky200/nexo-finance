import { useState, useEffect, useCallback, useRef } from 'react';
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
import { db, functions } from './firebase';
import { httpsCallable } from 'firebase/functions';
import { callWithRetry } from './apiRetry';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Retry options for critical operations
const CRITICAL_RETRY_OPTIONS = { maxRetries: 3, initialDelay: 1000 };
const STANDARD_RETRY_OPTIONS = { maxRetries: 2, initialDelay: 500 };

// ========== Reminders Hooks ==========

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  type: 'termin' | 'zahlung' | 'aufgabe';
  dueDate: Date;
  isAllDay: boolean;
  amount?: number | null;
  currency?: string | null;
  notes?: string | null;
  recurrenceRule?: string | null;
  status: 'offen' | 'erledigt' | 'überfällig';
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
              createdAt: createdAt,
              updatedAt: updatedAt,
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
          toast.error('Index fehlt - Bitte Firebase Console prüfen');
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

export async function createReminder(data: Omit<Reminder, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'>) {
  const createReminderFunc = httpsCallable(functions, 'createReminder');
  return callWithRetry(createReminderFunc, data, CRITICAL_RETRY_OPTIONS);
}

export async function updateReminder(id: string, data: Partial<Reminder>) {
  const updateReminderFunc = httpsCallable(functions, 'updateReminder');
  await callWithRetry(updateReminderFunc, { id, ...data }, STANDARD_RETRY_OPTIONS);
}

export async function deleteReminder(id: string) {
  const deleteReminderFunc = httpsCallable(functions, 'deleteReminder');
  await callWithRetry(deleteReminderFunc, { id }, STANDARD_RETRY_OPTIONS);
}

// ========== Finance Hooks ==========

export interface FinanceEntry {
  id: string;
  userId: string;
  date: Date | string;
  type: 'einnahme' | 'ausgabe';
  category: string;
  amount: number;
  currency: string;
  paymentMethod?: string | null;
  notes?: string | null;
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
              type: data.type || 'ausgabe',
              category: data.category || '',
              description: data.description || '',
              amount: data.amount || 0,
              currency: data.currency || 'CHF',
              paymentMethod: data.paymentMethod || 'Karte',
              date: date,
              isRecurring: data.isRecurring || false,
              recurrenceRule: data.recurrenceRule || null,
              createdAt: createdAt,
              updatedAt: updatedAt,
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
          toast.error('Index fehlt - Bitte Firebase Console prüfen');
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
  const createEntryFunc = httpsCallable(functions, 'createFinanceEntry');
  return callWithRetry(createEntryFunc, data, CRITICAL_RETRY_OPTIONS);
}

export async function updateFinanceEntry(id: string, data: Partial<FinanceEntry>) {
  const updateEntryFunc = httpsCallable(functions, 'updateFinanceEntry');
  await callWithRetry(updateEntryFunc, { id, ...data }, STANDARD_RETRY_OPTIONS);
}

export async function deleteFinanceEntry(id: string) {
  const deleteEntryFunc = httpsCallable(functions, 'deleteFinanceEntry');
  await callWithRetry(deleteEntryFunc, { id }, STANDARD_RETRY_OPTIONS);
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

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const getProfilesFunc = httpsCallable(functions, 'getTaxProfiles');
        const result = await getProfilesFunc({});
        const data = result.data as { profiles: any[] };
        
        const mappedProfiles = (data.profiles || []).map((p: any) => ({
          ...p,
          createdAt: p.createdAt?.toDate ? p.createdAt.toDate() : (p.createdAt ? new Date(p.createdAt) : new Date()),
          updatedAt: p.updatedAt?.toDate ? p.updatedAt.toDate() : (p.updatedAt ? new Date(p.updatedAt) : new Date()),
        }));
        
        setProfiles(mappedProfiles);
      } catch (err) {
        console.error('Error fetching tax profiles:', err);
        setError(err as Error);
        setProfiles([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfiles();
  }, [refreshKey]);

  return { data: profiles, isLoading, error };
}

export async function getTaxProfileByYear(year: number) {
  const getProfileFunc = httpsCallable(functions, 'getTaxProfileByYear');
  const result = await getProfileFunc({ year });
  const data = result.data as { profile: any };
  
  if (!data.profile) return null;
  
  return {
    ...data.profile,
    createdAt: data.profile.createdAt?.toDate ? data.profile.createdAt.toDate() : new Date(data.profile.createdAt),
    updatedAt: data.profile.updatedAt?.toDate ? data.profile.updatedAt.toDate() : new Date(data.profile.updatedAt),
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
  totalOwed: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
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
    // Note: If index is missing, try without orderBy first, then add it
    let q: any = query(
      collection(db, 'people'),
      where('userId', '==', user.uid)
    );
    
    // Try to add orderBy, but handle index errors gracefully
    try {
      q = query(q, orderBy('createdAt', 'desc'));
    } catch (err) {
      console.warn('[usePeople] Index missing for createdAt, using unsorted query');
    }

    // Set up real-time listener with error handling
    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot) => {
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
              totalOwed: data.totalOwed || 0,
              currency: data.currency || 'CHF',
              createdAt: createdAt,
              updatedAt: updatedAt,
            };
          }).filter((p) => p !== null) as Person[];
          
          // Sort manually if orderBy failed
          const sortedPeople = mappedPeople.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          setPeople(sortedPeople);
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
                    totalOwed: data.totalOwed || 0,
                    currency: data.currency || 'CHF',
                    createdAt: data.createdAt?.toDate?.() || new Date(),
                    updatedAt: data.updatedAt?.toDate?.() || new Date(),
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

export async function createPerson(data: Omit<Person, 'id' | 'userId' | 'totalOwed' | 'createdAt' | 'updatedAt'>) {
  const createPersonFunc = httpsCallable(functions, 'createPerson');
  return callWithRetry(createPersonFunc, data, CRITICAL_RETRY_OPTIONS);
}

export async function updatePerson(personId: string, data: Partial<Person>) {
  const updatePersonFunc = httpsCallable(functions, 'updatePerson');
  await callWithRetry(updatePersonFunc, { personId, ...data }, STANDARD_RETRY_OPTIONS);
}

export async function deletePerson(personId: string) {
  const deletePersonFunc = httpsCallable(functions, 'deletePerson');
  await callWithRetry(deletePersonFunc, { personId }, STANDARD_RETRY_OPTIONS);
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
        
        const mappedDebts = data.debts.map((d: any) => ({
          ...d,
          date: d.date?.toDate ? d.date.toDate() : new Date(d.date),
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(d.createdAt),
          updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate() : new Date(d.updatedAt),
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

export interface ShoppingItem {
  id: string;
  userId: string;
  item: string;
  quantity: number;
  unit?: string | null;
  category: string;
  estimatedPrice: number;
  actualPrice?: number | null;
  currency: string;
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
        
        const mappedItems = data.items.map((i: any) => ({
          ...i,
          boughtAt: i.boughtAt?.toDate ? i.boughtAt.toDate() : (i.boughtAt ? new Date(i.boughtAt) : null),
          createdAt: i.createdAt?.toDate ? i.createdAt.toDate() : new Date(i.createdAt),
          updatedAt: i.updatedAt?.toDate ? i.updatedAt.toDate() : new Date(i.updatedAt),
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

export async function createShoppingItem(data: Omit<ShoppingItem, 'id' | 'userId' | 'status' | 'boughtAt' | 'linkedExpenseId' | 'createdAt' | 'updatedAt'>) {
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
  isInstallmentPlan?: boolean; // Ratenvereinbarung
  installmentCount?: number; // Anzahl Raten
  installmentInterval?: 'weekly' | 'monthly' | 'quarterly' | 'yearly'; // Ratenintervall
  installments?: Array<{
    number: number;
    amount: number;
    dueDate: Date | null;
    paidAmount?: number;
    paidDate?: Date | null;
    status: 'open' | 'partial' | 'paid';
  }>;
  totalPaid?: number; // Gesamt bezahlt
  installmentEndDate?: Date; // Enddatum der Ratenvereinbarung
  status: 'open' | 'paid' | 'postponed';
  direction: 'incoming' | 'outgoing'; // incoming = Person schuldet mir, outgoing = Ich schulde Person
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export function usePersonInvoices(personId: string) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchInvoices = async () => {
    if (!personId) return;
    
    try {
      setIsLoading(true);
      const getInvoicesFunc = httpsCallable(functions, 'getPersonInvoices');
      const result = await getInvoicesFunc({ personId });
      const data = result.data as { invoices: any[] };
      
      const mappedInvoices = data.invoices.map((inv: any) => {
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
          if (process.env.NODE_ENV === 'development') {
            console.error('Error mapping invoice:', inv, err);
          }
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
  };

  useEffect(() => {
    fetchInvoices();
  }, [personId, refreshKey]);

  const refetch = () => {
    setRefreshKey(prev => prev + 1);
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
  installmentInterval?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}) {
  const createInvoiceFunc = httpsCallable(functions, 'createInvoice');
  const result = await createInvoiceFunc({ personId, ...data });
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

export async function updateInstallmentPlan(personId: string, invoiceId: string, data: {
  installmentCount?: number;
  installmentInterval?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate?: Date;
}) {
  const updatePlanFunc = httpsCallable(functions, 'updateInstallmentPlan');
  const result = await updatePlanFunc({ personId, invoiceId, ...data });
  return result.data;
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

export async function createQuickReminder(title: string, minutesFromNow: number = 5) {
  const createQuickFunc = httpsCallable(functions, 'createQuickReminder');
  await createQuickFunc({ title, minutesFromNow });
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

  useEffect(() => {
    let debounceTimeout: number | null = null;
    let lastRefreshTime = 0;
    const MIN_REFRESH_INTERVAL = 2000;

    const setupEventListeners = async () => {
      const { eventBus, Events } = await import('./eventBus');
      
      const debouncedRefresh = () => {
        const now = Date.now();
        if (now - lastRefreshTime < MIN_REFRESH_INTERVAL) {
          if (debounceTimeout) {
            clearTimeout(debounceTimeout);
          }
          debounceTimeout = window.setTimeout(() => {
            setRefreshKey(prev => prev + 1);
            lastRefreshTime = Date.now();
          }, MIN_REFRESH_INTERVAL);
        } else {
          setRefreshKey(prev => prev + 1);
          lastRefreshTime = now;
        }
      };

      const unsubscribeSync = eventBus.on(Events.DATA_SYNC_START, (data: { type?: string }) => {
        if (!data?.type || data.type === 'all' || data.type === 'chatReminders') {
          debouncedRefresh();
        }
      });

      const unsubscribeReminder = eventBus.on(Events.CHAT_REMINDER_RECEIVED, debouncedRefresh);

      return () => {
        if (debounceTimeout) {
          clearTimeout(debounceTimeout);
        }
        if (unsubscribeSync) unsubscribeSync();
        if (unsubscribeReminder) unsubscribeReminder();
      };
    };

    const cleanup = setupEventListeners();
    
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      cleanup.then(unsubscribe => {
        if (unsubscribe) unsubscribe();
      });
    };
  }, []);

  const fetchReminders = async () => {
    try {
      setIsLoading(true);
      const getChatRemindersFunc = httpsCallable(functions, 'getChatReminders');
      const result = await getChatRemindersFunc({ unreadOnly });
      const data = result.data as { reminders: any[] };
      
      const mappedReminders = data.reminders.map((r: any) => ({
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
  };

  useEffect(() => {
    fetchReminders();
    const interval = setInterval(fetchReminders, 30000);
    return () => clearInterval(interval);
  }, [refreshKey, unreadOnly]);

  const refetch = () => {
    setRefreshKey(prev => prev + 1);
  };

  return { data: reminders, isLoading, error, refetch };
}

export async function markChatReminderAsRead(reminderId: string) {
  const markReadFunc = httpsCallable(functions, 'markChatReminderAsRead');
  await markReadFunc({ reminderId });
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
    // Query with where clause to match security rules
    const q = query(
      collection(db, 'chatConversations'),
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const mappedConversations = snapshot.docs.map((doc) => {
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
        // Only log permission errors, don't show toast for background listeners
        if (err.code === 'permission-denied') {
          console.warn('[useChatConversations] Permission denied - user may not be authenticated');
        } else if (err.code === 'failed-precondition') {
          console.warn('[useChatConversations] Index missing - query may need an index');
          toast.error('Index fehlt. Bitte warten Sie, bis der Index erstellt wurde.');
        } else {
          console.error('[useChatConversations] Firestore listener error:', err);
        }
        setError(err);
        setIsLoading(false);
        setConversations([]);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const refetch = async () => {
    // For real-time listeners, refetch is not needed
    // The onSnapshot listener automatically updates the data in real-time
    // This function is kept for compatibility but does nothing
    if (process.env.NODE_ENV === 'development') {
      console.log('[useChatConversations] refetch called - no action needed (using real-time listener)');
    }
  };

  return { data: conversations, isLoading, error, refetch };
}

// ========== Weather Hooks (Phase 2) ==========

export interface WeatherData {
  id?: string;
  date: string;
  location?: string | null;
  temperature: number;
  condition: string;
  icon: string;
  humidity?: number | null;
  windSpeed?: number | null;
  cached?: boolean;
  fetchedAt?: string;
}

// Cache for weather data to prevent excessive API calls
const weatherCache = new Map<string, { data: WeatherData | null; timestamp: number; error: Error | null }>();
const WEATHER_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const WEATHER_DEBOUNCE_DELAY = 500; // 500ms debounce

export function useWeather(date: Date | null, location?: string | null) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any pending fetch
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }

    if (!date) {
      setWeather(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Create cache key from date and location
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const cacheKey = `${dateStr}_${location || 'no-location'}`;
    
    // Check cache first
    const cached = weatherCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < WEATHER_CACHE_DURATION) {
      setWeather(cached.data);
      setError(cached.error);
      setIsLoading(false);
      return;
    }

    // Debounce the fetch to prevent excessive calls
    fetchTimeoutRef.current = setTimeout(async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (!location) {
          const err = new Error('Location ist erforderlich. Bitte in den Einstellungen einen Standort eingeben.');
          setError(err);
          setWeather(null);
          setIsLoading(false);
          weatherCache.set(cacheKey, { data: null, timestamp: Date.now(), error: err });
          return;
        }
        
        const getWeatherFunc = httpsCallable(functions, 'getWeather');
        const result = await getWeatherFunc({ 
          date: date.toISOString(),
          location: location
        });
        
        const data = result.data as WeatherData | null;
        
        if (!data) {
          // No data returned - could be API error or no cache
          // Check if it's a past date (historical data not available)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const requestDate = new Date(date);
          requestDate.setHours(0, 0, 0, 0);
          
          const err = requestDate < today 
            ? new Error('Historische Wetterdaten sind nur aus dem Cache verfügbar.')
            : new Error('Keine Wetterdaten verfügbar. Bitte überprüfen Sie den Standort in den Einstellungen.');
          
          setError(err);
          setWeather(null);
          weatherCache.set(cacheKey, { data: null, timestamp: Date.now(), error: err });
        } else {
          setWeather(data);
          setError(null);
          weatherCache.set(cacheKey, { data, timestamp: Date.now(), error: null });
        }
      } catch (err: any) {
        // Only log errors that are not resource-related to avoid spam
        if (err?.code !== 'internal' && !err?.message?.includes('ERR_INSUFFICIENT_RESOURCES')) {
          console.error('[useWeather] Error:', err);
        }
        const errorMessage = err?.message || err?.code || 'Unbekannter Fehler beim Laden der Wetterdaten';
        const error = new Error(errorMessage);
        setError(error);
        setWeather(null);
        weatherCache.set(cacheKey, { data: null, timestamp: Date.now(), error });
      } finally {
        setIsLoading(false);
      }
    }, WEATHER_DEBOUNCE_DELAY);

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
    };
  }, [date?.toISOString(), location]); // Use toISOString() to create stable dependency

  return { data: weather, isLoading, error };
}

export async function saveWeatherData(data: Omit<WeatherData, 'id' | 'cached' | 'fetchedAt'>) {
  const saveWeatherFunc = httpsCallable(functions, 'saveWeather');
  return callWithRetry(saveWeatherFunc, data, STANDARD_RETRY_OPTIONS);
}

export async function getWeatherHistory(startDate?: Date, endDate?: Date, location?: string, limit?: number) {
  const getHistoryFunc = httpsCallable(functions, 'getWeatherHistory');
  const result = await getHistoryFunc({
    startDate: startDate?.toISOString(),
    endDate: endDate?.toISOString(),
    location: location || null,
    limit: limit || 30
  });
  return result.data as { weatherHistory: WeatherData[] };
}

// ========== User Settings Hooks (Phase 4) ==========

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

export async function createChatConversation(data: Omit<ChatConversation, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
  const createFunc = httpsCallable(functions, 'createChatConversation');
  const result = await createFunc(data);
  return result.data as { id: string; createdAt: string; updatedAt: string };
}

export async function updateChatConversation(id: string, data: Partial<Pick<ChatConversation, 'title' | 'messages'>>) {
  const updateFunc = httpsCallable(functions, 'updateChatConversation');
  await updateFunc({ id, ...data });
}

export async function deleteChatConversation(id: string) {
  const deleteFunc = httpsCallable(functions, 'deleteChatConversation');
  await deleteFunc({ id });
}

export async function clearAllChatConversations() {
  const clearFunc = httpsCallable(functions, 'clearAllChatConversations');
  const result = await clearFunc({});
  return result.data as { success: boolean; deletedCount: number };
}