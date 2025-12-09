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
  QueryConstraint
} from 'firebase/firestore';
import { db, functions } from './firebase';
import { httpsCallable } from 'firebase/functions';

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
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchReminders = async () => {
      try {
        setIsLoading(true);
        const getRemindersFunc = httpsCallable(functions, 'getReminders');
        const result = await getRemindersFunc(filters || {});
        const data = result.data as { reminders: any[] };
        
        const mappedReminders = data.reminders.map((r: any) => ({
          ...r,
          dueDate: r.dueDate?.toDate ? r.dueDate.toDate() : new Date(r.dueDate),
          createdAt: r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt),
          updatedAt: r.updatedAt?.toDate ? r.updatedAt.toDate() : new Date(r.updatedAt),
        }));
        
        setReminders(mappedReminders);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReminders();
  }, [filters?.startDate, filters?.endDate, filters?.status, refreshKey]);

  const refetch = () => setRefreshKey(prev => prev + 1);

  return { data: reminders, isLoading, error, refetch };
}

// ========== Person Reminders Hook ==========
export function usePersonReminders(personId: string | undefined) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchReminders = async () => {
    if (!personId) {
      setReminders([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const getRemindersFunc = httpsCallable(functions, 'getReminders');
      const result = await getRemindersFunc({ personId });
      const data = result.data as { reminders: any[] };
      
      const mappedReminders = data.reminders.map((r: any) => ({
        ...r,
        dueDate: r.dueDate?.toDate ? r.dueDate.toDate() : new Date(r.dueDate),
        createdAt: r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt),
        updatedAt: r.updatedAt?.toDate ? r.updatedAt.toDate() : new Date(r.updatedAt),
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
  }, [personId, refreshKey]);

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
        const getAllBillsFunc = httpsCallable(functions, 'getAllBills');
        const result = await getAllBillsFunc({});
        const data = result.data as { bills: any[]; stats: BillStats };
        
        const mappedBills = data.bills.map((b: any) => ({
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
        console.error('Error fetching bills:', err);
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
  const createReminderFunc = httpsCallable(functions, 'createReminder');
  const result = await createReminderFunc(data);
  return result.data;
}

export async function updateReminder(id: string, data: Partial<Reminder>) {
  const updateReminderFunc = httpsCallable(functions, 'updateReminder');
  await updateReminderFunc({ id, ...data });
}

export async function deleteReminder(id: string) {
  const deleteReminderFunc = httpsCallable(functions, 'deleteReminder');
  await deleteReminderFunc({ id });
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

  const fetchEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const getEntriesFunc = httpsCallable(functions, 'getFinanceEntries');
      const result = await getEntriesFunc(filters || {});
      const data = result.data as { entries: any[] };
      
      const mappedEntries = data.entries.map((e: any) => ({
        ...e,
        date: e.date?.toDate ? e.date.toDate() : new Date(e.date),
        createdAt: e.createdAt?.toDate ? e.createdAt.toDate() : new Date(e.createdAt),
        updatedAt: e.updatedAt?.toDate ? e.updatedAt.toDate() : new Date(e.updatedAt),
      }));
      
      setEntries(mappedEntries);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [filters?.startDate, filters?.endDate, filters?.type]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Direct refetch function that immediately fetches new data
  const refetch = useCallback(async () => {
    await fetchEntries();
  }, [fetchEntries]);

  return { data: entries, isLoading, error, refetch };
}

export async function createFinanceEntry(data: Omit<FinanceEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
  const createEntryFunc = httpsCallable(functions, 'createFinanceEntry');
  const result = await createEntryFunc(data);
  return result.data;
}

export async function updateFinanceEntry(id: string, data: Partial<FinanceEntry>) {
  const updateEntryFunc = httpsCallable(functions, 'updateFinanceEntry');
  await updateEntryFunc({ id, ...data });
}

export async function deleteFinanceEntry(id: string) {
  const deleteEntryFunc = httpsCallable(functions, 'deleteFinanceEntry');
  await deleteEntryFunc({ id });
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

export function useTaxProfiles() {
  const [profiles, setProfiles] = useState<TaxProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setIsLoading(true);
        const getProfilesFunc = httpsCallable(functions, 'getTaxProfiles');
        const result = await getProfilesFunc({});
        const data = result.data as { profiles: any[] };
        
        const mappedProfiles = data.profiles.map((p: any) => ({
          ...p,
          createdAt: p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt),
          updatedAt: p.updatedAt?.toDate ? p.updatedAt.toDate() : new Date(p.updatedAt),
        }));
        
        setProfiles(mappedProfiles);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfiles();
  }, []);

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
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchPeople = async () => {
    try {
      setIsLoading(true);
      const getPeopleFunc = httpsCallable(functions, 'getPeople');
      const result = await getPeopleFunc({});
      const data = result.data as { people: any[] };
      
      const mappedPeople = data.people.map((p: any) => ({
        ...p,
        createdAt: p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt),
        updatedAt: p.updatedAt?.toDate ? p.updatedAt.toDate() : new Date(p.updatedAt),
      }));
      
      setPeople(mappedPeople);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, [refreshKey]);

  const refetch = () => {
    setRefreshKey(prev => prev + 1);
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
  store?: string | null;
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

  const fetchInvoices = async () => {
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
          console.error('Error mapping invoice:', inv, err);
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
  }, [personId]);

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

export async function convertToInstallmentPlan(personId: string, invoiceId: string, data: {
  installmentCount: number;
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
