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
  const { setItemCount } = useCartStore();

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
  const [paymentMode, setPaymentMode] = useState<'COD' | 'PREPAID' | 'CREDIT'>('COD');
  const [placingOrder, setPlacingOrder] = useState(false);

  // Load Initial Data: Cart and Addresses and Credit Line
  const loadInitialData = async () => {
    try {
      // 1. Fetch Cart
      const cartRes = await fetch('/api/cart');
      const cartData = await cartRes.json();
      if (!cartRes.ok || !cartData.success) {
        throw new Error(cartData.message ?? 'Failed to load cart');
      }
      if (cartData.data.items.length === 0) {
        router.push('/cart');
        return;
      }
      setItems(cartData.data.items);
      setSubtotal(cartData.data.subtotal);
      const totalPieces = cartData.data.items.reduce((s: number, i: CartItem) => s + i.qty, 0);
      setTotalQty(totalPieces);

      // 2. Fetch Addresses
      const addrRes = await fetch('/api/addresses');
      const addrData = await addrRes.json();
      if (addrData.success) {
        setAddresses(addrData.data);
        if (addrData.data.length > 0) {
          setSelectedAddressId(addrData.data[0].id);
        } else {
          setShowNewAddressForm(true);
        }
      }

      // 3. Fetch Credit Line info
      const creditRes = await fetch('/api/account/credit-line');
      const creditData = await creditRes.json();
      if (creditRes.ok && creditData.success) {
        setCreditLine({
          limitAmount: Number(creditData.data.limitAmount),
          usedAmount: Number(creditData.data.usedAmount),
          availableAmount: Number(creditData.data.availableAmount),
        });
      }
    } catch (err: any) {
      setError(err.message ?? 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/checkout');
      return;
    }
    if (status === 'authenticated') {
      loadInitialData();
    }
  }, [status]);

  // Fetch Shipping Methods based on Pincode
  const calculateShipping = async (pincode: string) => {
    try {
      const res = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pincode, totalPieces: totalQty }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setShippingMethods(data.data.methods || []);
        if (data.data.methods && data.data.methods.length > 0) {
          setSelectedShippingId(data.data.methods[0].id);
        }
      } else {
        setShippingMethods([]);
      }
    } catch (err) {
      setShippingMethods([]);
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
      router.push('/account');
    } catch (err) {
      setError('An error occurred while placing your order. Please try again.');
      setPlacingOrder(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-950 text-white">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-gray-400 text-lg flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
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
  const grandTotal = subtotal - discountAmount + shippingCost;

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-white">
      <Navbar />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 py-8">
        <h1 className="text-3xl font-black gradient-text mb-6">Checkout</h1>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 max-w-lg mx-auto">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all ${
                step === s
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : step > s
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-800 text-gray-400'
              }`}>
                {step > s ? '✓' : s}
              </div>
              <span className={`text-xs ${step === s ? 'text-orange-400 font-semibold' : 'text-gray-500'}`}>
                {s === 1 ? 'Address' : s === 2 ? 'Shipping' : s === 3 ? 'Review' : 'Payment'}
              </span>
              {s < 4 && <div className={`w-12 h-0.5 ${step > s ? 'bg-green-500' : 'bg-gray-800'}`}></div>}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* STEP 1: ADDRESS */}
            {step === 1 && (
              <div className="card p-6 space-y-5">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold">Delivery Address</h2>
                  {addresses.length > 0 && (
                    <button
                      onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                      className="text-xs text-orange-400 hover:underline"
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
                            ? 'bg-orange-500/5 border-orange-500/40'
                            : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="mt-1 accent-orange-500"
                        />
                        <div className="text-sm">
                          <p className="font-bold">{addr.name}</p>
                          <p className="text-gray-400 mt-1">{addr.line1}</p>
                          <p className="text-gray-400">{addr.city}, {addr.state} {addr.pincode}</p>
                          <p className="text-gray-500 text-xs mt-1">Phone: {addr.phone}</p>
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
                      {addressErrors.name && <p className="text-red-400 text-xs mt-1">{addressErrors.name}</p>}
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
                      {addressErrors.phone && <p className="text-red-400 text-xs mt-1">{addressErrors.phone}</p>}
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
                      {addressErrors.pincode && <p className="text-red-400 text-xs mt-1">{addressErrors.pincode}</p>}
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
                      {addressErrors.line1 && <p className="text-red-400 text-xs mt-1">{addressErrors.line1}</p>}
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
                      {addressErrors.city && <p className="text-red-400 text-xs mt-1">{addressErrors.city}</p>}
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

                <div className="flex justify-end pt-3">
                  <button onClick={handleNextStep} className="btn-primary px-6 py-2.5 text-sm">
                    Continue to Shipping
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: SHIPPING */}
            {step === 2 && (
              <div className="card p-6 space-y-5">
                <h2 className="text-lg font-bold">Select Shipping Method</h2>

                <div className="space-y-3">
                  {shippingMethods.length === 0 ? (
                    <p className="text-gray-500 text-sm">No shipping methods available for your location.</p>
                  ) : (
                    shippingMethods.map((m) => (
                      <label
                        key={m.id}
                        className={`flex gap-3 p-4 rounded-xl cursor-pointer border transition-all ${
                          selectedShippingId === m.id
                            ? 'bg-orange-500/5 border-orange-500/40'
                            : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="shipping"
                          checked={selectedShippingId === m.id}
                          onChange={() => setSelectedShippingId(m.id)}
                          className="mt-1 accent-orange-500"
                        />
                        <div className="flex-1 text-sm">
                          <div className="flex justify-between items-start">
                            <p className="font-bold">{m.name}</p>
                            <p className="font-semibold text-orange-400">{formatINR(m.cost)}</p>
                          </div>
                          {m.description && <p className="text-gray-400 mt-1">{m.description}</p>}
                          {m.etaText && <p className="text-gray-500 text-xs mt-1">ETA: {m.etaText}</p>}
                        </div>
                      </label>
                    ))
                  )}
                </div>

                <div className="flex justify-between pt-3">
                  <button onClick={() => setStep(1)} className="btn-secondary px-6 py-2.5 text-sm">
                    Back to Address
                  </button>
                  <button onClick={handleNextStep} className="btn-primary px-6 py-2.5 text-sm">
                    Continue to Review
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: REVIEW ORDER */}
            {step === 3 && (
              <div className="card p-6 space-y-6">
                <h2 className="text-lg font-bold">Review Your Order</h2>

                {/* Items list */}
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-900">
                      <div>
                        <p className="font-medium text-sm">{item.variant.product.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Size: {item.variant.size} | Color: {item.variant.color}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatINR(item.unitPrice)} x {item.qty}</p>
                        <p className="text-xs text-gray-400">{formatINR(item.subtotal)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Discount Code Section */}
                <div className="pt-2">
                  <label className="label">Promo / Discount Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="SUMMER20"
                      className="input uppercase max-w-xs"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                    />
                    <button onClick={handleApplyDiscount} className="btn-secondary px-5 py-2.5 text-sm">
                      Apply
                    </button>
                  </div>
                  {discountError && <p className="text-red-400 text-xs mt-1">{discountError}</p>}
                  {discountInfo && (
                    <p className="text-green-400 text-xs mt-1">
                      ✓ Promo Applied: {discountInfo.code} (Saved {formatINR(discountInfo.discount)})
                    </p>
                  )}
                </div>

                <div className="flex justify-between pt-3">
                  <button onClick={() => setStep(2)} className="btn-secondary px-6 py-2.5 text-sm">
                    Back to Shipping
                  </button>
                  <button onClick={handleNextStep} className="btn-primary px-6 py-2.5 text-sm">
                    Proceed to Payment
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: PAYMENT */}
            {step === 4 && (
              <div className="card p-6 space-y-6">
                <h2 className="text-lg font-bold">Choose Payment Method</h2>

                <div className="space-y-3">
                  {/* COD */}
                  <label
                    className={`flex gap-3 p-4 rounded-xl cursor-pointer border transition-all ${
                      paymentMode === 'COD'
                        ? 'bg-orange-500/5 border-orange-500/40'
                        : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMode === 'COD'}
                      onChange={() => setPaymentMode('COD')}
                      className="mt-1 accent-orange-500"
                    />
                    <div className="text-sm">
                      <p className="font-bold">Cash on Delivery (COD)</p>
                      <p className="text-gray-400 mt-1">Pay when your bulk order reaches your doorstep.</p>
                    </div>
                  </label>

                  {/* CREDIT LINE */}
                  {creditLine && creditLine.limitAmount > 0 && (
                    <label
                      className={`flex gap-3 p-4 rounded-xl cursor-pointer border transition-all ${
                        paymentMode === 'CREDIT'
                          ? 'bg-orange-500/5 border-orange-500/40'
                          : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                      } ${grandTotal > creditLine.availableAmount ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMode === 'CREDIT'}
                        disabled={grandTotal > creditLine.availableAmount}
                        onChange={() => setPaymentMode('CREDIT')}
                        className="mt-1 accent-orange-500"
                      />
                      <div className="text-sm">
                        <p className="font-bold">Credit Line / BNPL</p>
                        <p className="text-gray-400 mt-1">
                          Buy Now Pay Later using your business credit line.
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Available Limit: {formatINR(creditLine.availableAmount)} (Outstanding: {formatINR(creditLine.usedAmount)})
                        </p>
                        {grandTotal > creditLine.availableAmount && (
                          <p className="text-red-400 text-xs mt-1">✖ Insufficient credit limit available for this order</p>
                        )}
                      </div>
                    </label>
                  )}

                  {/* PREPAID */}
                  <label
                    className={`flex gap-3 p-4 rounded-xl cursor-pointer border transition-all ${
                      paymentMode === 'PREPAID'
                        ? 'bg-orange-500/5 border-orange-500/40'
                        : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMode === 'PREPAID'}
                      onChange={() => setPaymentMode('PREPAID')}
                      className="mt-1 accent-orange-500"
                    />
                    <div className="text-sm">
                      <p className="font-bold">Online Payment / UPI / Netbanking</p>
                      <p className="text-gray-400 mt-1">Pay instantly online securely via Razorpay.</p>
                    </div>
                  </label>
                </div>

                <div className="flex justify-between pt-3">
                  <button onClick={() => setStep(3)} className="btn-secondary px-6 py-2.5 text-sm">
                    Back to Review
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={placingOrder}
                    className="btn-primary px-8 py-2.5 text-sm flex items-center gap-2"
                  >
                    {placingOrder && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                    {paymentMode === 'PREPAID' ? 'Pay and Place Order' : 'Place Order'}
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Sidebar Summary Panel */}
          <div>
            <div className="card p-5 space-y-4 sticky top-6">
              <h3 className="font-bold text-base">Order Summary</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal ({totalQty} pieces)</span>
                  <span>{formatINR(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-400 font-medium">
                    <span>Discount</span>
                    <span>−{formatINR(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-400">
                  <span>Shipping</span>
                  <span>{selectedShipping ? formatINR(shippingCost) : 'Select shipping...'}</span>
                </div>

                <div className="flex justify-between font-black text-lg pt-2 border-t border-gray-800">
                  <span>Total</span>
                  <span className="gradient-text">{formatINR(grandTotal)}</span>
                </div>
              </div>

              {selectedAddressId && addresses.find(a => a.id === selectedAddressId) && (
                <div className="pt-3 border-t border-gray-800 text-xs text-gray-500">
                  <p className="font-bold text-gray-400 mb-1">Delivering to:</p>
                  {(() => {
                    const addr = addresses.find(a => a.id === selectedAddressId);
                    return addr ? (
                      <>
                        <p className="font-medium text-gray-300">{addr.name}</p>
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
