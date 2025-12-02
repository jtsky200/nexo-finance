# Nexo Database Schema

## Collections

### `people`
Stores information about people (for debts/invoices tracking)

**Document ID**: Auto-generated
**Fields**:
- `userId` (string): Owner's user ID
- `name` (string): Person's name
- `email` (string, optional): Person's email
- `phone` (string, optional): Person's phone number
- `createdAt` (timestamp): Creation date
- `updatedAt` (timestamp): Last update date

### `people/{personId}/invoices`
Subcollection storing invoices for each person

**Document ID**: Auto-generated
**Fields**:
- `description` (string): Invoice description (e.g., "Miete Dezember", "Strom November")
- `amount` (number): Invoice amount in CHF
- `date` (timestamp): Invoice date
- `dueDate` (timestamp, optional): Due date
- `status` (string): Invoice status - "offen" | "bezahlt" | "verschoben"
- `notes` (string, optional): Additional notes
- `expenseId` (string, optional): Reference to expense entry (when status = "bezahlt")
- `createdAt` (timestamp): Creation date
- `updatedAt` (timestamp): Last update date

## Calculated Fields

### Person Open Amount
Sum of all invoices with `status === "offen"` for that person

### Total Expenses Integration
When an invoice is marked as "bezahlt", an expense entry is automatically created in the `expenses` collection with:
- `description`: "{person.name} - {invoice.description}"
- `amount`: invoice.amount
- `date`: invoice.date
- `category`: "Schulden" or "Rechnungen"
- `linkedInvoiceId`: invoice.id
- `linkedPersonId`: person.id
