// /src/lib/orders.ts
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp as st,
  onSnapshot,
  query,
  orderBy,
  limit,
  where,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "./firebase";

/** Tables **/
export interface TableDoc {
  id: string;
  number: number;
  status: "available" | "occupied" | "reserved";
}
export function listenTables(cb: (rows: TableDoc[]) => void) {
  const q = query(collection(db, "tables"), orderBy("number", "asc"));
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => {
        const data = d.data() as any;
        return { id: d.id, number: data.number, status: data.status } as TableDoc;
      })
    );
  });
}

/** Orders **/
export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export interface OrderItemRow {
  menuItemId: string;
  name: string;
  quantity: number;
  pricePerItem: number;
}

export interface OrderDoc {
  id?: string;
  tableId: string;          // tables/{docId}
  tableNumber: number;      // denormalized for quick reads
  customerName: string | null;
  totalAmount: number;
  status: OrderStatus;
  createdAt: any;           // Firestore Timestamp
  updatedAt?: any;
  items: OrderItemRow[];
}

/** Create (you already use this from the customer UI) */
export async function createOrder(params: {
  cart: Array<{ id: string; name: string; price: number; quantity: number }>;
  tableNumber: number;
  customerName?: string | "";
}) {
  const { cart, tableNumber, customerName } = params;
  const total = cart.reduce((s, it) => s + it.price * it.quantity, 0);
  const items = cart.map((it) => ({
    menuItemId: it.id,
    name: it.name,
    quantity: it.quantity,
    pricePerItem: it.price,
  }));

  await runTransaction(db, async (tx) => {
    const tableRef = doc(db, "tables", String(tableNumber));
    const tableSnap = await tx.get(tableRef);
    if (!tableSnap.exists()) {
      tx.set(tableRef, { number: tableNumber, status: "available", updatedAt: st() });
    }
    const status = (tableSnap.data()?.status ?? "available") as string;
    if (status !== "available") throw new Error("Table is occupied");

    tx.update(tableRef, { status: "occupied", updatedAt: st() });

    const orderRef = doc(collection(db, "orders"));
    tx.set(orderRef, {
      tableId: tableRef.id,
      tableNumber,
      customerName: customerName || null,
      totalAmount: total,
      status: "pending",
      items,
      createdAt: st(),
      updatedAt: st(),
    } as Omit<OrderDoc, "id">);
  });
}

/** Real-time: all recent orders (admin screen uses this) */
export function listenRecentOrders(cb: (orders: OrderDoc[]) => void, max = 50) {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(max));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
  });
}

/** Real-time: kitchen wants only active orders in time order (oldest first) */
export function listenKitchenOrders(cb: (orders: OrderDoc[]) => void) {
  // NOTE: If Firestore asks for a composite index, click the console link to create it.
  const q = query(
    collection(db, "orders"),
    where("status", "in", ["pending", "accepted", "preparing", "ready"]),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
  });
}

/** Real-time: cashier needs active orders too */
export function listenActiveOrders(cb: (orders: OrderDoc[]) => void) {
  const q = query(
    collection(db, "orders"),
    where("status", "in", ["pending", "accepted", "preparing", "ready"]),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
  });
}

/** Update status (kitchen transitions) */
export async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
  await updateDoc(doc(db, "orders", orderId), {
    status: newStatus,
    updatedAt: st(),
  });
}

/** Cashier: complete order + free the table atomically */
export async function completeOrder(orderId: string) {
  await runTransaction(db, async (tx) => {
    const orderRef = doc(db, "orders", orderId);
    const snap = await tx.get(orderRef);
    if (!snap.exists()) throw new Error("Order not found");
    const data = snap.data() as OrderDoc;
    tx.update(orderRef, { status: "completed", updatedAt: st() });

    if (data.tableId) {
      const tableRef = doc(db, "tables", data.tableId);
      // If table doc id equals the number string (our createOrder does that):
      const tableRef2 = doc(db, "tables", String(data.tableNumber));
      const target = (await tx.get(tableRef)).exists() ? tableRef : tableRef2;
      tx.update(target, { status: "available", updatedAt: st() });
    }
  });
}
