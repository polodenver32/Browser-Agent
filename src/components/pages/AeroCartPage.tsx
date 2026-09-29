import React, { useState } from 'react';
import { Search, ShoppingBag, Star, Check, Trash2, ArrowRight, ShieldCheck, X } from 'lucide-react';

interface Props {
  onNavigate: (url: string) => void;
}

interface Product {
  id: string;
  name: string;
  category: 'audio' | 'computing' | 'accessories';
  price: number;
  rating: number;
  reviews: number;
  image: string;
  features: string[];
}

const PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'AeroPulse Wireless ANC Headphones',
    category: 'audio',
    price: 199.99,
    rating: 4.8,
    reviews: 320,
    image: '🎧',
    features: ['Active Noise Cancellation', '40hr Battery', 'Spatial Audio'],
  },
  {
    id: 'prod-2',
    name: 'Quantum Mechanical Keyboard 75%',
    category: 'computing',
    price: 149.00,
    rating: 4.9,
    reviews: 412,
    image: '⌨️',
    features: ['Hot-swappable switches', 'PBT Keycaps', 'RGB Backlit'],
  },
  {
    id: 'prod-3',
    name: 'UltraGlide Ergonomic Wireless Mouse',
    category: 'accessories',
    price: 79.50,
    rating: 4.6,
    reviews: 188,
    image: '🖱️',
    features: ['4000 DPI Optical', 'Silent Clicks', 'Bluetooth 5.3'],
  },
  {
    id: 'prod-4',
    name: 'AeroStudio 4K Ultra-Wide Monitor 34"',
    category: 'computing',
    price: 499.00,
    rating: 4.7,
    reviews: 95,
    image: '🖥️',
    features: ['144Hz Refresh', 'HDR600 Color', 'USB-C 90W PD'],
  },
  {
    id: 'prod-5',
    name: 'SonicPod Pro Earbuds',
    category: 'audio',
    price: 129.99,
    rating: 4.5,
    reviews: 240,
    image: '🎵',
    features: ['IPX7 Waterproof', 'Wireless Charging', 'Transparency Mode'],
  },
];

export const AeroCartPage: React.FC<Props> = ({ onNavigate }) => {
  const [products] = useState<Product[]>(PRODUCTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutComplete, setCheckoutComplete] = useState(false);

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.features.some(f => f.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    setCheckoutComplete(true);
    setCart([]);
    setTimeout(() => {
      setCheckoutComplete(false);
      setIsCartOpen(false);
    }, 4000);
  };

  return (
    <div className="min-h-full bg-slate-900 text-slate-100 flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow">
            A
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">AeroCart</h1>
            <span className="text-[10px] text-slate-400 block -mt-0.5">High-Tech Hardware</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="store-search-input"
            data-agent-id="store-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search audio, headphones, keyboard, monitors..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-800 text-xs text-slate-100 placeholder-slate-400 rounded-lg border border-slate-700 focus:border-indigo-500 outline-none"
          />
        </div>

        {/* Cart Toggle Button */}
        <button
          id="btn-open-cart"
          data-agent-id="btn-open-cart"
          onClick={() => setIsCartOpen(!isCartOpen)}
          className="relative p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 transition-colors flex items-center gap-2"
        >
          <ShoppingBag className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold">Cart</span>
          {totalItemCount > 0 && (
            <span
              id="cart-badge-count"
              data-agent-id="cart-badge-count"
              className="w-5 h-5 rounded-full bg-indigo-600 text-[10px] font-bold text-white flex items-center justify-center"
            >
              {totalItemCount}
            </span>
          )}
        </button>
      </header>

      {/* Category Pills Bar */}
      <div className="bg-slate-800/60 border-b border-slate-800 px-4 py-2 flex items-center gap-2 overflow-x-auto">
        <span className="text-xs text-slate-400 font-medium mr-1">Categories:</span>
        {['all', 'audio', 'computing', 'accessories'].map((cat) => (
          <button
            key={cat}
            data-agent-id={`category-${cat}`}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
            }`}
          >
            {cat}
          </button>
        ))}
        <span className="text-xs text-slate-400 ml-auto">
          {filteredProducts.length} items found
        </span>
      </div>

      {/* Main Product Catalog */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between transition-all hover:shadow-lg"
            >
              <div>
                <div className="w-full h-32 bg-slate-900/80 rounded-lg flex items-center justify-center text-5xl mb-3 border border-slate-700/40">
                  {prod.image}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-amber-400 mb-1">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="font-semibold">{prod.rating}</span>
                  <span className="text-slate-400">({prod.reviews} reviews)</span>
                </div>
                <h3 className="font-bold text-sm text-slate-100">{prod.name}</h3>
                <div className="flex flex-wrap gap-1 mt-2 mb-3">
                  {prod.features.map((f, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-700/50 text-slate-300">
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between mt-auto">
                <span className="text-base font-extrabold text-white">
                  ${prod.price.toFixed(2)}
                </span>
                <button
                  id={`btn-add-to-cart-${prod.id}`}
                  data-agent-id={`btn-add-to-cart-${prod.id}`}
                  onClick={() => addToCart(prod)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Slide-out Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex justify-end">
          <div className="w-full max-w-md bg-slate-900 h-full border-l border-slate-800 p-6 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-bold text-white">Shopping Cart ({totalItemCount})</h2>
              </div>
              <button
                id="btn-close-cart"
                data-agent-id="btn-close-cart"
                onClick={() => setIsCartOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {checkoutComplete ? (
              <div className="my-auto text-center p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-emerald-400">Order Placed Successfully!</h3>
                <p className="text-xs text-slate-300 mt-1">Thank you for your purchase with AeroCart.</p>
              </div>
            ) : cart.length === 0 ? (
              <div className="my-auto text-center p-6">
                <p className="text-sm text-slate-400">Your cart is currently empty.</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto py-4 space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 flex items-center justify-between gap-3"
                    >
                      <div className="text-2xl">{item.product.image}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-slate-200 truncate">{item.product.name}</h4>
                        <span className="text-xs text-slate-400">Qty: {item.quantity} × ${item.product.price.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </span>
                        <button
                          data-agent-id={`remove-item-${item.product.id}`}
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1 text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Subtotal</span>
                    <span id="cart-subtotal-price" data-agent-id="cart-subtotal-price" className="text-base font-bold text-white">
                      ${cartTotal.toFixed(2)}
                    </span>
                  </div>
                  <button
                    id="btn-proceed-checkout"
                    data-agent-id="btn-proceed-checkout"
                    onClick={handleCheckout}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-colors"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
