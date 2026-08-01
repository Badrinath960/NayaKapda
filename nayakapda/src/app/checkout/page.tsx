'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { formatINR } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';

type Address = {
  id: string;
  name: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

type ShippingMethod = {
  id: string;
  name: string;
  description: string | null;
  etaText: string | null;
  cost: number;
};

type CartItem = {
  id: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
  variant: {
    id: string;
    size: string;
    color: string;
    sku: string;
    product: { name: string; slug: string; id: string };
  };
};

type CreditLineInfo = {
  limitAmount: number;
  usedAmount: number;
  availableAmount: number;
};

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Delhi', 'J&K', 'Ladakh'
];

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { setItemCount, guestItems, clearGuestCart } = useCartStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Address State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: '',
    phone: '',
    line1: '',
    city: '',
    state: 'Maharashtra',
    pincode: '',
    country: 'India',
  });
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

  // Shipping State
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState<string>('');

  // Cart / Items
  const [items, setItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [totalQty, setTotalQty] = useState(0);

  // Discount
  const [discountCode, setDiscountCode] = useState('');
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [discountInfo, setDiscountInfo] = useState<{ id: string; code: string; discount: number; type: 'PERCENT' | 'FLAT' } | null>(null);

  // Credit Line
  const [creditLine, setCreditLine] = useState<CreditLineInfo | null>(null);

  // Payment Mode
  const [paymentMode, setPaymentMode] = useState<'PREPAID'>('PREPAID');
  const [placingOrder, setPlacingOrder] = useState(false);

  // Load Initial Data: Cart and Addresses and Credit Line
  const loadInitialData = async () => {
    try {
      // 1. If guest items exist, sync them first to DB
      if (guestItems.length > 0) {
        try {
          await fetch('/api/cart/bulk-add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              rows: guestItems.map((gi) => ({ variantId: gi.variantId, qty: gi.qty })),
            }),
          });
          clearGuestCart();
        } catch (err) {
          console.error('Failed to sync guest cart', err);
        }
      }

      // 2. Fetch DB Cart
      const cartRes = await fetch('/api/cart');
      if (!cartRes.ok) throw new Error('Failed to load cart');
      const cartData = await cartRes.json();
      const cartItems: CartItem[] = cartData.data.items || [];
      if (cartItems.length === 0) {
        router.push('/cart');
        return;
      }
      setItems(cartItems);
      setSubtotal(cartData.data.subtotal || 0);
      const totalCount = cartItems.reduce((acc, i) => acc + i.qty, 0);
      setTotalQty(totalCount);

      // 3. Fetch Saved Addresses
      const addrRes = await fetch('/api/addresses');
      if (addrRes.ok) {
        const addrData = await addrRes.json();
        const addrs: Address[] = addrData.data || [];
        setAddresses(addrs);
        if (addrs.length > 0) {
          setSelectedAddressId(addrs[0].id);
          // Calculate shipping for default address pincode
          await calculateShipping(addrs[0].pincode, totalCount);
        } else {
          setShowNewAddressForm(true);
        }
      } else {
        setShowNewAddressForm(true);
      }

      // 4. Fetch Credit Line
      const creditRes = await fetch('/api/account/credit-line');
      if (creditRes.ok) {
        const creditData = await creditRes.json();
        setCreditLine(creditData.data);
      }
    } catch (err: any) {
      setError(err.message || 'Error initializing checkout');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/checkout');
    } else if (status === 'authenticated') {
      loadInitialData();
    }
  }, [status]);

  const calculateShipping = async (pincode: string, piecesCount?: number) => {
    try {
      const res = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pincode,
          totalPieces: piecesCount ?? totalQty,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const methods: ShippingMethod[] = data.data.methods || [];
        setShippingMethods(methods);
        if (methods.length > 0) {
          setSelectedShippingId(methods[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to calculate shipping', err);
    }
  };

  const handleNextStep = async () => {
    setError(null);
    if (step === 1) {
      if (showNewAddressForm) {
        // Validate new address inputs
        const errors: Record<string, string> = {};
        if (!newAddress.name.trim()) errors.name = 'Name is required';
        if (!/^[6-9]\d{9}$/.test(newAddress.phone)) errors.phone = '10-digit Indian phone starting with 6-9 is required';
        if (newAddress.line1.length < 5) errors.line1 = 'Address line 1 must be at least 5 characters';
        if (!newAddress.city.trim()) errors.city = 'City is required';
        if (newAddress.country === 'India' && !/^\d{6}$/.test(newAddress.pincode)) {
          errors.pincode = 'Indian pincode must be exactly 6 digits';
        }
        if (Object.keys(errors).length > 0) {
          setAddressErrors(errors);
          return;
        }

        // Save address
        try {
          const res = await fetch('/api/addresses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newAddress),
          });
          const data = await res.json();
          if (!res.ok) {
            setError(data.message ?? 'Failed to save address');
            return;
          }
          const savedAddr = data.data;
          setAddresses([savedAddr, ...addresses]);
          setSelectedAddressId(savedAddr.id);
          setShowNewAddressForm(false);
          // Proceed to shipping calculation
          await calculateShipping(savedAddr.pincode);
          setStep(2);
        } catch (err) {
          setError('Failed to create address. Please try again.');
        }
      } else {
        if (!selectedAddressId) {
          setError('Please select or add an address');
          return;
        }
        const activeAddr = addresses.find(a => a.id === selectedAddressId);
        if (activeAddr) {
          await calculateShipping(activeAddr.pincode);
        }
        setStep(2);
      }
    } else if (step === 2) {
      if (!selectedShippingId) {
        setError('Please select a shipping method');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleApplyDiscount = async () => {
    setDiscountError(null);
    try {
      const res = await fetch('/api/discount/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: discountCode.toUpperCase(),
          cartTotal: subtotal,
          totalQty,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDiscountInfo({
          id: data.data.discountCodeId || '',
          code: discountCode.toUpperCase(),
          discount: Number(data.data.discount),
          type: data.data.type,
        });
      } else {
        setDiscountError(data.message || 'Invalid or expired code');
        setDiscountInfo(null);
      }
    } catch (err) {
      setDiscountError('Failed to validate discount code');
      setDiscountInfo(null);
    }
  };

  const handlePlaceOrder = async () => {
    setPlacingOrder(true);
    setError(null);
    try {
      const payload: any = {
        addressId: selectedAddressId,
        shippingMethodId: selectedShippingId,
        paymentMode,
      };

      if (discountInfo) {
        payload.discountCodeId = discountInfo.id;
      }

      if (paymentMode === 'PREPAID') {
        // Razorpay Payment Simulation
        payload.razorpayPaymentId = 'pay_sim_' + Math.random().toString(36).slice(2, 10);
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || 'Failed to place order');
        setPlacingOrder(false);
        return;
      }

      // Order placed successfully!
      setItemCount(0); // clear Zustand count
      router.push(`/checkout/success?orderId=${data.data.orderId}`);
    } catch (err) {
      setError('An error occurred while placing your order. Please try again.');
      setPlacingOrder(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-slate-500 font-medium text-sm flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            Loading Checkout Details...
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Calculate prices for preview
  const selectedShipping = shippingMethods.find(m => m.id === selectedShippingId);
  const shippingCost = selectedShipping ? Number(selectedShipping.cost) : 0;
  const discountAmount = discountInfo ? discountInfo.discount : 0;
  const taxableValue = subtotal - discountAmount;
  const gstAmount = Math.round(taxableValue * 0.05 * 100) / 100; // 5% GST for textiles
  const grandTotal = taxableValue + gstAmount + shippingCost;
  const estimatedWeightKg = Math.round(totalQty * 0.25 * 10) / 10; // ~250g per piece

  const copyOrderToClipboard = () => {
    const lines: string[] = ['--- NayaKapda Order Summary ---'];
    items.forEach(item => {
      lines.push(`${item.variant.product.name} | ${item.variant.size}/${item.variant.color} | Qty: ${item.qty} | ${formatINR(item.unitPrice)}/pc = ${formatINR(item.subtotal)}`);
    });
    lines.push('');
    lines.push(`${totalQty} PCS Total | Est. ${estimatedWeightKg}kg`);
    lines.push(`Taxable Value: ${formatINR(taxableValue)}`);
    lines.push(`5% GST: ${formatINR(gstAmount)}`);
    if (shippingCost > 0) lines.push(`Shipping: ${formatINR(shippingCost)}`);
    if (discountAmount > 0) lines.push(`Discount: -${formatINR(discountAmount)}`);
    lines.push(`Total Amount: ${formatINR(grandTotal)}`);
    navigator.clipboard.writeText(lines.join('\n'));
    alert('Order summary copied to clipboard!');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 py-8">
        <h1 className="text-3xl font-black text-slate-900 mb-6">Checkout</h1>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 max-w-lg mx-auto">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                step === s
                  ? 'bg-orange-500 text-white shadow-sm'
                  : step > s
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}>
                {step > s ? '✓' : s}
              </div>
              <span className={`text-xs font-bold ${step === s ? 'text-orange-600' : 'text-slate-500'}`}>
                {s === 1 ? 'Address' : s === 2 ? 'Shipping' : s === 3 ? 'Review' : 'Payment'}
              </span>
              {s < 4 && <div className={`w-12 h-0.5 ${step > s ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* STEP 1: ADDRESS */}
            {step === 1 && (
              <div className="card p-6 space-y-5 bg-white border-slate-200 shadow-sm">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-slate-900">Delivery Address</h2>
                  {addresses.length > 0 && (
                    <button
                      onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                      className="text-xs text-orange-600 font-bold hover:underline"
                    >
                      {showNewAddressForm ? 'Choose Saved Address' : '+ Add New Address'}
                    </button>
                  )}
                </div>

                {!showNewAddressForm ? (
                  <div className="space-y-3">
                    {addresses.map((addr) => (
                      <label
                        key={addr.id}
                        className={`flex gap-3 p-4 rounded-xl cursor-pointer border transition-all ${
                          selectedAddressId === addr.id
                            ? 'bg-orange-50/60 border-orange-400'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="mt-1 accent-orange-500"
                        />
                        <div className="text-xs text-slate-700">
                          <p className="font-bold text-slate-900 text-sm">{addr.name}</p>
                          <p className="mt-1 font-medium">{addr.line1}</p>
                          <p>{addr.city}, {addr.state} {addr.pincode}</p>
                          <p className="text-slate-500 mt-1">Phone: {addr.phone}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="label">Full Name *</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        className="input"
                        value={newAddress.name}
                        onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                      />
                      {addressErrors.name && <p className="text-rose-600 text-xs mt-1 font-medium">{addressErrors.name}</p>}
                    </div>

                    <div>
                      <label className="label">10-Digit Mobile Number *</label>
                      <input
                        type="tel"
                        placeholder="9876543210"
                        className="input"
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      />
                      {addressErrors.phone && <p className="text-rose-600 text-xs mt-1 font-medium">{addressErrors.phone}</p>}
                    </div>

                    <div>
                      <label className="label">Pincode *</label>
                      <input
                        type="text"
                        placeholder="400001"
                        className="input"
                        value={newAddress.pincode}
                        onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                      />
                      {addressErrors.pincode && <p className="text-rose-600 text-xs mt-1 font-medium">{addressErrors.pincode}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <label className="label">Address Line 1 (Street, Building, Area) *</label>
                      <input
                        type="text"
                        placeholder="Flat 101, building name, street name"
                        className="input"
                        value={newAddress.line1}
                        onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                      />
                      {addressErrors.line1 && <p className="text-rose-600 text-xs mt-1 font-medium">{addressErrors.line1}</p>}
                    </div>

                    <div>
                      <label className="label">City *</label>
                      <input
                        type="text"
                        placeholder="Mumbai"
                        className="input"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      />
                      {addressErrors.city && <p className="text-rose-600 text-xs mt-1 font-medium">{addressErrors.city}</p>}
                    </div>

                    <div>
                      <label className="label">State *</label>
                      <select
                        className="input"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      >
                        {INDIAN_STATES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button onClick={handleNextStep} className="btn-primary px-6 py-2.5 text-xs font-bold">
                    Continue to Shipping
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: SHIPPING */}
            {step === 2 && (
              <div className="card p-6 space-y-5 bg-white border-slate-200 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">Select Shipping Method</h2>

                <div className="space-y-3">
                  {shippingMethods.length === 0 ? (
                    <p className="text-slate-500 text-xs font-medium">No shipping methods available for your location.</p>
                  ) : (
                    shippingMethods.map((m) => (
                      <label
                        key={m.id}
                        className={`flex gap-3 p-4 rounded-xl cursor-pointer border transition-all ${
                          selectedShippingId === m.id
                            ? 'bg-orange-50/60 border-orange-400'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="shipping"
                          checked={selectedShippingId === m.id}
                          onChange={() => setSelectedShippingId(m.id)}
                          className="mt-1 accent-orange-500"
                        />
                        <div className="flex-1 text-xs text-slate-700">
                          <div className="flex justify-between items-start">
                            <p className="font-bold text-slate-900 text-sm">{m.name}</p>
                            <p className="font-black text-orange-600 text-sm">{formatINR(m.cost)}</p>
                          </div>
                          {m.description && <p className="text-slate-500 mt-1 font-medium">{m.description}</p>}
                          {m.etaText && <p className="text-slate-400 mt-1 font-semibold">ETA: {m.etaText}</p>}
                        </div>
                      </label>
                    ))
                  )}
                </div>

                <div className="flex justify-between pt-3 border-t border-slate-100">
                  <button onClick={() => setStep(1)} className="btn-secondary px-6 py-2.5 text-xs font-bold">
                    Back to Address
                  </button>
                  <button onClick={handleNextStep} className="btn-primary px-6 py-2.5 text-xs font-bold">
                    Continue to Review
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: REVIEW ORDER */}
            {step === 3 && (
              <div className="card p-6 space-y-6 bg-white border-slate-200 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">Review Your Order</h2>

                {/* Items list */}
                <div className="space-y-3 divide-y divide-slate-100">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center pt-3 first:pt-0">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{item.variant.product.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5 font-medium">
                          Size: {item.variant.size} | Color: {item.variant.color}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-slate-700">{formatINR(item.unitPrice)} x {item.qty}</p>
                        <p className="text-sm font-black text-orange-600">{formatINR(item.subtotal)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Discount Code Section */}
                <div className="pt-3 border-t border-slate-100">
                  <label className="label">Promo / Discount Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="SUMMER20"
                      className="input uppercase max-w-xs"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                    />
                    <button onClick={handleApplyDiscount} className="btn-secondary px-5 py-2.5 text-xs font-bold">
                      Apply
                    </button>
                  </div>
                  {discountError && <p className="text-rose-600 text-xs mt-1 font-medium">{discountError}</p>}
                  {discountInfo && (
                    <p className="text-emerald-700 text-xs mt-1 font-bold">
                      ✓ Promo Applied: {discountInfo.code} (Saved {formatINR(discountInfo.discount)})
                    </p>
                  )}
                </div>

                <div className="flex justify-between pt-3 border-t border-slate-100">
                  <button onClick={() => setStep(2)} className="btn-secondary px-6 py-2.5 text-xs font-bold">
                    Back to Shipping
                  </button>
                  <button onClick={handleNextStep} className="btn-primary px-6 py-2.5 text-xs font-bold">
                    Proceed to Payment
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: PAYMENT */}
            {step === 4 && (
              <div className="card p-6 space-y-6 bg-white border-slate-200 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">Choose Payment Method</h2>

                <div className="space-y-3">
                  {/* PREPAID ONLY */}
                  <div className="flex gap-3 p-4 rounded-xl border bg-orange-50/60 border-orange-300">
                    <input
                      type="radio"
                      name="payment"
                      checked={true}
                      readOnly
                      className="mt-1 accent-orange-500"
                    />
                    <div className="text-xs text-slate-700">
                      <p className="font-bold text-orange-700 text-sm">Online Payment / UPI / Netbanking</p>
                      <p className="text-slate-500 mt-1 font-medium">Pay instantly online securely via Razorpay.</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-3 border-t border-slate-100">
                  <button onClick={() => setStep(3)} className="btn-secondary px-6 py-2.5 text-xs font-bold">
                    Back to Review
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={placingOrder}
                    className="btn-primary px-8 py-2.5 text-xs font-bold flex items-center gap-2 shadow-md"
                  >
                    {placingOrder && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                    Pay and Place Order
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Sidebar Summary Panel */}
          <div>
            <div className="card p-5 space-y-4 sticky top-24 bg-white border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900">Order Summary</h3>
                <button
                  onClick={copyOrderToClipboard}
                  className="text-xs text-orange-600 font-bold hover:underline flex items-center gap-1"
                  title="Copy order details"
                >
                  📋 Copy Order
                </button>
              </div>

              {/* Badges */}
              <div className="flex gap-2">
                <span className="badge-orange text-[10px] font-bold">
                  {totalQty} PCS Total
                </span>
                <span className="badge-blue text-[10px] font-bold">
                  ~{estimatedWeightKg}kg
                </span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between font-medium">
                  <span>Subtotal ({totalQty} pcs)</span>
                  <span className="font-semibold text-slate-900">{formatINR(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Discount ({discountInfo?.code})</span>
                    <span>−{formatINR(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium">
                  <span>Taxable Value</span>
                  <span className="font-semibold text-slate-900">{formatINR(taxableValue)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>5% GST</span>
                  <span className="font-semibold text-slate-900">{formatINR(gstAmount)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Shipping</span>
                  <span className="font-semibold text-slate-900">{selectedShipping ? formatINR(shippingCost) : 'Select shipping...'}</span>
                </div>

                <div className="flex justify-between font-black text-lg pt-3 border-t border-slate-200 text-slate-900">
                  <span>Total Amount</span>
                  <span className="text-orange-600">{formatINR(grandTotal)}</span>
                </div>
                <p className="text-[10px] text-slate-400 text-right font-medium">(Incl. 5% GST)</p>
              </div>

              {selectedAddressId && addresses.find(a => a.id === selectedAddressId) && (
                <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
                  <p className="font-bold text-slate-700 mb-1">Delivering to:</p>
                  {(() => {
                    const addr = addresses.find(a => a.id === selectedAddressId);
                    return addr ? (
                      <>
                        <p className="font-bold text-slate-900">{addr.name}</p>
                        <p>{addr.line1}</p>
                        <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                      </>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
