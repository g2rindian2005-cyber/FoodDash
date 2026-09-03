import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { CreditCard, Smartphone, Wallet, Loader2, QrCode, ScanLine, CheckCircle2 } from 'lucide-react';
import Page from '../components/Page';
import QrScanner from '../components/QrScanner';
import api from '../api/axios';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const METHODS = [
  { id: 'card', label: 'Credit / Debit Card', icon: CreditCard },
  { id: 'upi', label: 'UPI / Scan QR', icon: Smartphone },
  { id: 'cod', label: 'Cash on Delivery', icon: Wallet },
];

export default function Payment() {
  const { items, totals, restaurantId, coupon, clearCart } = useCart();
  const navigate = useNavigate();
  const { notify } = useToast();

  const [method, setMethod] = useState('card');
  const [upiMode, setUpiMode] = useState('id'); // 'id' | 'qr'
  const [upiId, setUpiId] = useState('');
  const [qrData, setQrData] = useState(null); // { upi_uri, ref }
  const [qrLoading, setQrLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  if (items.length === 0) {
    navigate('/restaurants', { replace: true });
    return null;
  }

  // Create the order first (used by both the normal flow and the QR flow so
  // the QR encodes a real order id + amount).
  const ensureOrder = async () => {
    const address = JSON.parse(localStorage.getItem('checkoutAddress') || 'null');
    const orderRes = await api.post('/orders', {
      restaurant_id: restaurantId,
      address,
      items: items.map((i) => ({
        food_item_id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
      delivery_fee: totals.deliveryFee,
      taxes: totals.taxes,
      discount: totals.discount,
      coupon_code: coupon?.code || null,
    });
    return orderRes.data;
  };

  const finishPayment = async (order, extra = {}) => {
    await api.post('/payments', {
      order_id: order.id,
      method,
      amount: totals.total,
      ...extra,
    });
    clearCart();
    localStorage.removeItem('checkoutAddress');
    navigate(`/order-success/${order.id}`, { replace: true });
  };

  const pay = async () => {
    setError('');
    setProcessing(true);
    try {
      const order = await ensureOrder();
      await finishPayment(order);
    } catch (err) {
      setError(err.message);
      notify(err.message, 'error');
      setProcessing(false);
    }
  };

  // "Scan to Pay": create the order, ask the backend for a UPI QR payload,
  // then render it as an actual QR code the user can scan with any UPI app.
  const generateQr = async () => {
    setError('');
    setQrLoading(true);
    try {
      const order = await ensureOrder();
      const res = await api.post('/payments/qr', { order_id: order.id, amount: totals.total });
      setQrData({ ...res.data, order });
    } catch (err) {
      setError(err.message);
      notify(err.message, 'error');
    } finally {
      setQrLoading(false);
    }
  };

  const confirmQrPaid = async () => {
    if (!qrData) return;
    setProcessing(true);
    try {
      await finishPayment(qrData.order, { qr_ref: qrData.ref });
    } catch (err) {
      setError(err.message);
      notify(err.message, 'error');
      setProcessing(false);
    }
  };

  // Camera-based scan: scanning any QR (e.g. a restaurant's table QR) creates
  // the order and marks it paid immediately, as a fast "tap & go" demo flow.
  const handleCameraScan = async (decodedText) => {
    setScannerOpen(false);
    setScanned(true);
    setProcessing(true);
    try {
      const order = await ensureOrder();
      await finishPayment(order, { qr_ref: decodedText.slice(0, 80) });
    } catch (err) {
      setError(err.message);
      notify(err.message, 'error');
      setProcessing(false);
    }
  };

  return (
    <Page className="max-w-2xl">
      <h1 className="mb-6 text-3xl font-extrabold">Payment</h1>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="card p-6">
        <h2 className="mb-4 font-bold">Choose a payment method</h2>
        <div className="space-y-3">
          {METHODS.map((m) => (
            <label
              key={m.id}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                method === m.id ? 'border-brand bg-brand/5' : 'border-gray-200'
              }`}
            >
              <input type="radio" name="method" value={m.id} checked={method === m.id}
                onChange={() => { setMethod(m.id); setQrData(null); setError(''); }} className="accent-brand" />
              <m.icon className="h-5 w-5 text-brand" />
              <span className="font-medium">{m.label}</span>
            </label>
          ))}
        </div>

        {/* UPI sub-flow: pay via UPI ID, or scan a "Scan to Pay" QR code */}
        {method === 'upi' && (
          <div className="mt-5 rounded-xl border border-gray-200 p-4">
            <div className="mb-4 flex gap-2 rounded-lg bg-gray-100 p-1 text-sm font-semibold">
              <button
                onClick={() => setUpiMode('id')}
                className={`flex-1 rounded-md py-2 transition ${upiMode === 'id' ? 'bg-white text-brand shadow-sm' : 'text-gray-500'}`}
              >
                Enter UPI ID
              </button>
              <button
                onClick={() => setUpiMode('qr')}
                className={`flex-1 rounded-md py-2 transition ${upiMode === 'qr' ? 'bg-white text-brand shadow-sm' : 'text-gray-500'}`}
              >
                <QrCode className="mr-1 inline h-4 w-4" /> Scan to Pay
              </button>
            </div>

            {upiMode === 'id' ? (
              <input
                className="input"
                placeholder="yourname@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
              />
            ) : (
              <div className="text-center">
                {!qrData ? (
                  <button onClick={generateQr} disabled={qrLoading} className="btn-outline mx-auto px-5 py-2.5">
                    {qrLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                    Generate QR code
                  </button>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-2xl border border-gray-200 bg-white p-4">
                      <QRCodeSVG value={qrData.upi_uri} size={180} includeMargin />
                    </div>
                    <p className="text-sm text-gray-500">
                      Scan with GPay, PhonePe or any UPI app to pay <span className="font-semibold text-gray-800">₹{totals.total}</span>
                    </p>
                    <button onClick={confirmQrPaid} disabled={processing} className="btn-primary w-full py-3">
                      {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                      I've paid — confirm order
                    </button>
                  </div>
                )}

                <div className="my-4 flex items-center gap-3 text-xs text-gray-400">
                  <div className="h-px flex-1 bg-gray-200" /> OR <div className="h-px flex-1 bg-gray-200" />
                </div>

                <button
                  onClick={() => setScannerOpen(true)}
                  disabled={processing}
                  className="btn-outline mx-auto px-5 py-2.5"
                >
                  <ScanLine className="h-4 w-4" /> Use camera to scan a QR &amp; pay instantly
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between rounded-xl bg-gray-50 p-4">
          <span className="text-gray-600">Amount to pay</span>
          <span className="text-2xl font-extrabold">₹{totals.total}</span>
        </div>

        {!(method === 'upi' && upiMode === 'qr') && (
          <button onClick={pay} disabled={processing} className="btn-primary mt-6 w-full py-3">
            {processing ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Processing…</>
            ) : (
              <>Pay ₹{totals.total}</>
            )}
          </button>
        )}
        <p className="mt-3 text-center text-xs text-gray-400">
          This is a mock payment gateway for demo purposes. No real money is charged.
        </p>
      </div>

      {scannerOpen && (
        <QrScanner onScan={handleCameraScan} onClose={() => setScannerOpen(false)} />
      )}
    </Page>
  );
}
