# Firestore Database Schema

## Collections

### users
Stores user profile and preferences.

```typescript
{
  uid: string;              // Firebase Auth UID
  email: string;
  displayName: string;
  preferences: {
    language: 'de' | 'en';
    currency: 'CHF' | 'EUR' | 'USD';
    canton: string;         // Swiss canton
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### reminders
Stores user reminders (appointments, payments, tasks).

```typescript
{
  id: string;
  userId: string;
  type: 'appointment' | 'payment' | 'task';
  title: string;
  description?: string;
  dueDate: Timestamp;
  amount?: number;          // For payment type
  status: 'open' | 'completed' | 'overdue';
  recurring?: string;       // RRULE format
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### financeEntries
Stores income and expense entries.

```typescript
{
  id: string;
  userId: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  currency: string;
  date: Timestamp;
  description: string;
  paymentMethod?: string;
  status: 'open' | 'paid';
  personId?: string;        // Reference to person (for debts)
  recurring?: string;       // RRULE format
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### people
Stores people for debt tracking.

```typescript
{
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  totalOwed: number;        // Total amount owed to/by this person
  currency: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### shoppingList
Stores shopping list items.

```typescript
{
  id: string;
  userId: string;
  item: string;
  quantity: number;
  unit?: string;
  category: string;
  estimatedPrice: number;
  actualPrice?: number;
  currency: string;
  status: 'not_bought' | 'bought';
  boughtAt?: Timestamp;
  linkedExpenseId?: string; // Reference to financeEntry
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### taxProfiles
Stores tax profile information.

```typescript
{
  id: string;
  userId: string;
  year: number;
  canton: string;
  maritalStatus: string;
  numberOfChildren: number;
  grossIncome: number;
  otherIncome: number;
  deductions: Array<{
    type: string;
    amount: number;
    description: string;
  }>;
  status: 'draft' | 'submitted' | 'completed';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Indexes

### reminders
- `userId` + `dueDate` (ascending)
- `userId` + `status` + `dueDate` (ascending)

### financeEntries
- `userId` + `date` (descending)
- `userId` + `type` + `date` (descending)
- `userId` + `personId` + `status`

### people
- `userId` + `name` (ascending)

### shoppingList
- `userId` + `status` + `createdAt` (descending)
- `userId` + `category`

### taxProfiles
- `userId` + `year` (descending)
