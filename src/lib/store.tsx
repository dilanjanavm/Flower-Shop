"use client";

/**
 * Client-side mock store. It stands in for the NestJS API during the
 * frontend phase: cart (FR-CUST-04.1), auth session, orders and the
 * bank-deposit flow (FR-CUST-05), quotations (FR-CUST-03), addresses and
 * reminders (FR-CUST-06). State persists to localStorage.
 *
 * When the API is ready, replace the action bodies with fetch calls and keep
 * the hook signature — components don't need to change.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Address, CartLine, Customer, Order, OrderStatus, Quotation, Recipient, Reminder, SlotCode } from "./types";
import { buildSeedOrders, buildSeedQuotations, buildSeedReminders, demoCustomer, seedAddresses } from "./mock/account";
import { settings, timeSlots, zoneForCity } from "./mock/delivery";
import { uid } from "./format";
import { todayISO } from "./dates";

const KEY = "sf-store-v1";

export interface Toast {
  id: string;
  title: string;
  body?: string;
  tone?: "default" | "success" | "error";
}

interface PersistedState {
  cart: CartLine[];
  user: Customer | null;
  orders: Order[];
  quotations: Quotation[];
  addresses: Address[];
  reminders: Reminder[];
  wishlist: string[];
}

export interface PlaceOrderInput {
  fulfilment: "DELIVERY" | "PICKUP";
  deliveryDate: string;
  timeSlot: SlotCode;
  recipient: Recipient;
  isAnonymousSender: boolean;
  couponCode?: string;
  discount: number;
  pointsUsed: number;
}

export interface NewQuoteInput {
  items: Quotation["items"];
  style: string;
  wrapId: string;
  ribbonId: string;
  notes: string;
  referencePhotos: string[];
  fulfilment: "DELIVERY" | "PICKUP";
  deliveryDate: string;
  timeSlot: SlotCode;
  recipient: Recipient;
  cardMessage: string;
  isAnonymousSender: boolean;
  estimate?: number;
}

interface StoreValue extends PersistedState {
  hydrated: boolean;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  cartCount: number;
  addToCart: (line: Omit<CartLine, "id">) => void;
  updateQty: (id: string, qty: number) => void;
  removeLine: (id: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;

  login: (identifier?: string) => void;
  logout: () => void;
  updateProfile: (patch: Partial<Customer>) => void;

  placeOrder: (input: PlaceOrderInput) => Order;
  uploadSlip: (orderId: string, fileName: string) => void;
  cancelOrder: (orderId: string) => void;
  simulateAdvance: (orderId: string) => void;
  markReviewed: (orderId: string) => void;

  submitQuote: (input: NewQuoteInput) => Quotation;
  cancelQuote: (id: string) => void;
  declineQuote: (id: string) => void;
  acceptQuote: (id: string) => Order | null;
  simulateOwnerQuote: (id: string) => void;

  saveAddress: (a: Omit<Address, "id"> & { id?: string }) => void;
  deleteAddress: (id: string) => void;
  saveReminder: (r: Omit<Reminder, "id"> & { id?: string }) => void;
  deleteReminder: (id: string) => void;

  toasts: Toast[];
  toast: (t: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

const emptyState: PersistedState = {
  cart: [],
  user: null,
  orders: [],
  quotations: [],
  addresses: [],
  reminders: [],
  wishlist: [],
};

function seedState(): PersistedState {
  return {
    ...emptyState,
    orders: buildSeedOrders(),
    quotations: buildSeedQuotations(),
    addresses: seedAddresses,
    reminders: buildSeedReminders(),
  };
}

function orderNumber(seq: number) {
  return `SF-${todayISO().slice(2).replace(/-/g, "")}-${String(seq).padStart(5, "0")}`;
}

/** Next running number, continuing from the highest existing order (SF-YYMMDD-#####). */
function nextSeq(orders: Order[]): number {
  return orders.reduce((m, o) => Math.max(m, Number(o.orderNumber.slice(-5)) || 0), 52) + 1;
}

/** Payment window: 24 h after ordering, never later than the day before delivery (FR-CUST-05.3). */
function paymentDue(deliveryDate: string): string {
  const byWindow = Date.now() + settings.paymentWindowHours * 3_600_000;
  const dayBefore = new Date(`${deliveryDate}T00:00:00Z`).getTime() - 330 * 60_000 - 6 * 3_600_000; // 6 pm Colombo the day before
  return new Date(Math.min(byWindow, dayBefore)).toISOString();
}

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PAYMENT_REVIEW: "CONFIRMED",
  CONFIRMED: "PREPARING",
  PREPARING: "READY_FOR_DISPATCH",
  READY_FOR_DISPATCH: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(emptyState);
  const [hydrated, setHydrated] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(52);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Load once on the client.
  useEffect(() => {
    let loaded: PersistedState | null = null;
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) loaded = { ...emptyState, ...(JSON.parse(raw) as Partial<PersistedState>) };
    } catch {
      loaded = null;
    }
    setState(loaded ?? seedState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable — keep in memory */
    }
  }, [state, hydrated]);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = uid("t");
    setToasts((prev) => [...prev, { id, ...t }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4200);
  }, []);
  const dismissToast = useCallback((id: string) => setToasts((prev) => prev.filter((x) => x.id !== id)), []);

  const patch = useCallback((fn: (s: PersistedState) => PersistedState) => setState((s) => fn(s)), []);

  /* ───── cart ───── */
  const addToCart = useCallback(
    (line: Omit<CartLine, "id">) => {
      patch((s) => {
        // Same product + same configuration → quantities add (FR-AUTH-01.5 rule reused)
        const key = JSON.stringify({ p: line.productId, c: line.config });
        const existing = s.cart.find((l) => JSON.stringify({ p: l.productId, c: l.config }) === key);
        if (existing) {
          return { ...s, cart: s.cart.map((l) => (l.id === existing.id ? { ...l, qty: Math.min(20, l.qty + line.qty) } : l)) };
        }
        return { ...s, cart: [...s.cart, { ...line, id: uid("cl") }] };
      });
      setCartOpen(true);
    },
    [patch],
  );
  const updateQty = useCallback((id: string, qty: number) => patch((s) => ({ ...s, cart: s.cart.map((l) => (l.id === id ? { ...l, qty: Math.max(1, Math.min(20, qty)) } : l)) })), [patch]);
  const removeLine = useCallback((id: string) => patch((s) => ({ ...s, cart: s.cart.filter((l) => l.id !== id) })), [patch]);
  const clearCart = useCallback(() => patch((s) => ({ ...s, cart: [] })), [patch]);
  const toggleWishlist = useCallback(
    (pid: string) => patch((s) => ({ ...s, wishlist: s.wishlist.includes(pid) ? s.wishlist.filter((x) => x !== pid) : [...s.wishlist, pid] })),
    [patch],
  );

  /* ───── auth (mock) ───── */
  const login = useCallback(
    (identifier?: string) => {
      patch((s) => ({ ...s, user: { ...demoCustomer, email: identifier && identifier.includes("@") ? identifier : demoCustomer.email } }));
      toast({ title: "Welcome back", body: "You're signed in to your Sithuliya Flora account.", tone: "success" });
    },
    [patch, toast],
  );
  const logout = useCallback(() => {
    patch((s) => ({ ...s, user: null }));
    toast({ title: "Signed out" });
  }, [patch, toast]);
  const updateProfile = useCallback((p: Partial<Customer>) => patch((s) => (s.user ? { ...s, user: { ...s.user, ...p } } : s)), [patch]);

  /* ───── orders ───── */
  const placeOrder = useCallback((input: PlaceOrderInput): Order => {
    const s = stateRef.current;
    const now = new Date().toISOString();
    seq.current = Math.max(seq.current, nextSeq(s.orders) - 1) + 1;
    const subtotal = s.cart.reduce((a, l) => a + l.unitPrice * l.qty, 0);
    const zone = input.fulfilment === "DELIVERY" ? zoneForCity(input.recipient.city) : undefined;
    const deliveryFee = input.fulfilment === "PICKUP" ? 0 : zone && zone.freeOver && subtotal >= zone.freeOver ? 0 : zone?.fee ?? 0;
    const surcharge = timeSlots.find((t) => t.code === input.timeSlot)?.surcharge ?? 0;
    const pointsValue = input.pointsUsed * settings.pointsValue;
    const first = s.cart[0];
    const order: Order = {
      id: uid("o"),
      orderNumber: orderNumber(seq.current),
      trackingToken: uid("tk"),
      orderType: "STANDARD",
      fulfilment: input.fulfilment,
      deliveryDate: input.deliveryDate,
      timeSlot: input.timeSlot,
      recipient: input.recipient,
      isAnonymousSender: input.isAnonymousSender,
      cardMessage: first?.config.cardMessage,
      senderName: first?.config.senderName,
      items: s.cart.map((l) => ({
        id: uid("oi"),
        name: l.name,
        image: l.image,
        sizeTier: l.config.sizeTier,
        qty: l.qty,
        unitPrice: l.unitPrice,
        detail: describeConfig(l),
        isCustom: false,
      })),
      subtotal,
      discount: input.discount + pointsValue,
      deliveryFee,
      surcharge,
      total: Math.max(0, subtotal - input.discount - pointsValue + deliveryFee + surcharge),
      couponCode: input.couponCode,
      orderStatus: "PENDING_PAYMENT",
      paymentStatus: "UNPAID",
      paymentDueAt: paymentDue(input.deliveryDate),
      history: [{ status: "PENDING_PAYMENT", at: now }],
      createdAt: now,
    };
    setState((prev) => ({
      ...prev,
      user: prev.user ? { ...prev.user, loyaltyPoints: prev.user.loyaltyPoints - input.pointsUsed } : prev.user,
      cart: [],
      orders: [order, ...prev.orders],
    }));
    return order;
  }, []);

  const setOrder = useCallback(
    (orderId: string, fn: (o: Order) => Order) => patch((s) => ({ ...s, orders: s.orders.map((o) => (o.id === orderId ? fn(o) : o)) })),
    [patch],
  );

  const uploadSlip = useCallback(
    (orderId: string, fileName: string) => {
      setOrder(orderId, (o) => ({
        ...o,
        slipFileName: fileName,
        slipRejectReason: undefined,
        orderStatus: "PAYMENT_REVIEW",
        paymentStatus: "PENDING_VERIFICATION",
        history: [...o.history, { status: "PAYMENT_REVIEW", at: new Date().toISOString() }],
      }));
      toast({ title: "Slip received", body: "We'll verify your payment shortly and confirm by SMS.", tone: "success" });
    },
    [setOrder, toast],
  );

  const cancelOrder = useCallback(
    (orderId: string) => {
      setOrder(orderId, (o) => ({ ...o, orderStatus: "CANCELLED", history: [...o.history, { status: "CANCELLED", at: new Date().toISOString(), note: "Cancelled by customer" }] }));
      toast({ title: "Order cancelled", body: "Your delivery slot has been released." });
    },
    [setOrder, toast],
  );

  /** Demo helper — moves an order one step along the state machine, as the shop would. */
  const simulateAdvance = useCallback(
    (orderId: string) =>
      setOrder(orderId, (o) => {
        const next = NEXT_STATUS[o.orderStatus];
        if (!next) return o;
        return {
          ...o,
          orderStatus: next,
          paymentStatus: next === "CONFIRMED" ? "PAID" : o.paymentStatus,
          podPhoto: next === "DELIVERED" ? o.items[0]?.image : o.podPhoto,
          history: [...o.history, { status: next, at: new Date().toISOString() }],
        };
      }),
    [setOrder],
  );

  const markReviewed = useCallback((orderId: string) => setOrder(orderId, (o) => ({ ...o, reviewed: true })), [setOrder]);

  /* ───── quotations ───── */
  const submitQuote = useCallback(
    (input: NewQuoteInput): Quotation => {
      const q: Quotation = {
        ...input,
        id: uid("q"),
        requestNumber: `QR-${todayISO().slice(2).replace(/-/g, "")}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        status: "REQUESTED",
        createdAt: new Date().toISOString(),
      };
      patch((s) => ({ ...s, quotations: [q, ...s.quotations] }));
      return q;
    },
    [patch],
  );

  const setQuote = useCallback(
    (id: string, fn: (q: Quotation) => Quotation) => patch((s) => ({ ...s, quotations: s.quotations.map((q) => (q.id === id ? fn(q) : q)) })),
    [patch],
  );

  const cancelQuote = useCallback((id: string) => setQuote(id, (q) => ({ ...q, status: "CANCELLED" })), [setQuote]);
  const declineQuote = useCallback((id: string) => setQuote(id, (q) => ({ ...q, status: "DECLINED_BY_CUSTOMER" })), [setQuote]);

  const simulateOwnerQuote = useCallback(
    (id: string) =>
      setQuote(id, (q) => {
        const items = q.items.map((i) => ({ ...i, unitPrice: i.unitPrice ?? 400 }));
        const itemsPrice = items.reduce((s, i) => s + (i.unitPrice ?? 0) * i.qty, 0);
        const deliveryFee = q.fulfilment === "PICKUP" ? 0 : zoneForCity(q.recipient.city)?.fee ?? 750;
        const wrappingPrice = 450;
        return {
          ...q,
          items,
          status: "QUOTED",
          itemsPrice,
          wrappingPrice,
          deliveryFee,
          discount: 0,
          quotedTotal: itemsPrice + wrappingPrice + deliveryFee,
          quoteNote: "All flowers are available for your date. Thank you for choosing us!",
          validUntil: new Date(Date.now() + settings.quotationValidityHours * 3_600_000).toISOString(),
        };
      }),
    [setQuote],
  );

  const acceptQuote = useCallback((id: string): Order | null => {
    const q = stateRef.current.quotations.find((x) => x.id === id);
    if (!q || q.status !== "QUOTED" || !q.quotedTotal) return null;
    if (q.validUntil && new Date(q.validUntil).getTime() < Date.now()) {
      setState((prev) => ({ ...prev, quotations: prev.quotations.map((x) => (x.id === id ? { ...x, status: "EXPIRED" } : x)) }));
      return null;
    }
    seq.current = Math.max(seq.current, nextSeq(stateRef.current.orders) - 1) + 1;
    const now = new Date().toISOString();
    const order: Order = {
      id: uid("o"),
      orderNumber: orderNumber(seq.current),
      trackingToken: uid("tk"),
      orderType: "CUSTOM",
      fulfilment: q.fulfilment,
      deliveryDate: q.deliveryDate,
      timeSlot: q.timeSlot,
      recipient: q.recipient,
      isAnonymousSender: q.isAnonymousSender,
      cardMessage: q.cardMessage,
      items: [
        {
          id: uid("oi"),
          name: "Custom bouquet",
          image: q.items[0]?.image ?? "",
          qty: 1,
          unitPrice: (q.itemsPrice ?? 0) + (q.wrappingPrice ?? 0),
          detail: q.items.map((i) => `${i.qty} × ${i.name}`).join(", "),
          isCustom: true,
        },
      ],
      subtotal: (q.itemsPrice ?? 0) + (q.wrappingPrice ?? 0),
      discount: q.discount ?? 0,
      deliveryFee: q.deliveryFee ?? 0,
      surcharge: 0,
      total: q.quotedTotal,
      orderStatus: "PENDING_PAYMENT",
      paymentStatus: "UNPAID",
      paymentDueAt: paymentDue(q.deliveryDate),
      history: [{ status: "PENDING_PAYMENT", at: now, note: `From quotation ${q.requestNumber}` }],
      createdAt: now,
    };
    setState((prev) => ({
      ...prev,
      orders: [order, ...prev.orders],
      quotations: prev.quotations.map((x) => (x.id === id ? { ...x, status: "ACCEPTED", orderNumber: order.orderNumber } : x)),
    }));
    return order;
  }, []);

  /* ───── address book & reminders ───── */
  const saveAddress = useCallback(
    (a: Omit<Address, "id"> & { id?: string }) =>
      patch((s) => {
        let list = a.id ? s.addresses.map((x) => (x.id === a.id ? ({ ...x, ...a } as Address) : x)) : [...s.addresses, { ...a, id: uid("addr") } as Address];
        if (a.isDefault) {
          const target = a.id ?? list[list.length - 1].id;
          list = list.map((x) => ({ ...x, isDefault: x.id === target }));
        }
        return { ...s, addresses: list.slice(0, 20) };
      }),
    [patch],
  );
  const deleteAddress = useCallback((id: string) => patch((s) => ({ ...s, addresses: s.addresses.filter((a) => a.id !== id) })), [patch]);
  const saveReminder = useCallback(
    (r: Omit<Reminder, "id"> & { id?: string }) =>
      patch((s) => ({
        ...s,
        reminders: r.id ? s.reminders.map((x) => (x.id === r.id ? ({ ...x, ...r } as Reminder) : x)) : [...s.reminders, { ...r, id: uid("r") } as Reminder],
      })),
    [patch],
  );
  const deleteReminder = useCallback((id: string) => patch((s) => ({ ...s, reminders: s.reminders.filter((r) => r.id !== id) })), [patch]);

  const value = useMemo<StoreValue>(
    () => ({
      ...state,
      hydrated,
      cartOpen,
      setCartOpen,
      cartCount: state.cart.reduce((n, l) => n + l.qty, 0),
      addToCart,
      updateQty,
      removeLine,
      clearCart,
      toggleWishlist,
      login,
      logout,
      updateProfile,
      placeOrder,
      uploadSlip,
      cancelOrder,
      simulateAdvance,
      markReviewed,
      submitQuote,
      cancelQuote,
      declineQuote,
      acceptQuote,
      simulateOwnerQuote,
      saveAddress,
      deleteAddress,
      saveReminder,
      deleteReminder,
      toasts,
      toast,
      dismissToast,
    }),
    [state, hydrated, cartOpen, addToCart, updateQty, removeLine, clearCart, toggleWishlist, login, logout, updateProfile, placeOrder, uploadSlip, cancelOrder, simulateAdvance, markReviewed, submitQuote, cancelQuote, declineQuote, acceptQuote, simulateOwnerQuote, saveAddress, deleteAddress, saveReminder, deleteReminder, toasts, toast, dismissToast],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

export function describeConfig(l: CartLine): string {
  const tier = l.config.sizeTier.charAt(0) + l.config.sizeTier.slice(1).toLowerCase();
  const parts = [tier];
  if (l.config.wrapId) parts.push(l.config.wrapId.replace("wrap-", "").replace(/^\w/, (c) => c.toUpperCase()) + " wrap");
  if (l.config.addOnIds.length) parts.push(`${l.config.addOnIds.length} add-on${l.config.addOnIds.length > 1 ? "s" : ""}`);
  return parts.join(" · ");
}
