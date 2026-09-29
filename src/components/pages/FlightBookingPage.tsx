import React, { useState } from 'react';
import { Plane, Calendar, Users, ArrowRightLeft, CheckCircle2, X } from 'lucide-react';

interface Props {
  onNavigate: (url: string) => void;
}

interface Flight {
  id: string;
  airline: string;
  flightNo: string;
  from: string;
  to: string;
  depTime: string;
  arrTime: string;
  duration: string;
  stops: string;
  price: number;
}

const AVAILABLE_FLIGHTS: Flight[] = [
  {
    id: 'FL-101',
    airline: 'SkyWing Airlines',
    flightNo: 'SW-804',
    from: 'SFO (San Francisco)',
    to: 'JFK (New York)',
    depTime: '08:30 AM',
    arrTime: '04:50 PM',
    duration: '5h 20m',
    stops: 'Non-stop',
    price: 349,
  },
  {
    id: 'FL-204',
    airline: 'AeroGlobal Express',
    flightNo: 'AG-122',
    from: 'SFO (San Francisco)',
    to: 'JFK (New York)',
    depTime: '11:15 AM',
    arrTime: '07:45 PM',
    duration: '5h 30m',
    stops: 'Non-stop',
    price: 298,
  },
  {
    id: 'FL-309',
    airline: 'Pacific Airways',
    flightNo: 'PA-915',
    from: 'SFO (San Francisco)',
    to: 'JFK (New York)',
    depTime: '02:00 PM',
    arrTime: '10:30 PM',
    duration: '5h 30m',
    stops: 'Non-stop',
    price: 279,
  },
];

export const FlightBookingPage: React.FC<Props> = ({ onNavigate }) => {
  const [fromCity, setFromCity] = useState('San Francisco (SFO)');
  const [toCity, setToCity] = useState('New York (JFK)');
  const [departDate, setDepartDate] = useState('2026-10-15');
  const [passengers, setPassengers] = useState('1 Adult');
  const [searched, setSearched] = useState(false);
  const [bookedFlight, setBookedFlight] = useState<Flight | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
  };

  const handleBookFlight = (flight: Flight) => {
    setBookedFlight(flight);
  };

  return (
    <div className="min-h-full bg-slate-900 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-sky-600 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <Plane className="w-5 h-5" />
          <h1 className="text-base font-bold tracking-tight">SkyQuest Flights</h1>
        </div>
        <span className="text-xs bg-sky-700/80 px-2.5 py-1 rounded-full font-medium">
          Fast Booking Engine
        </span>
      </header>

      {/* Main search card */}
      <main className="max-w-4xl w-full mx-auto p-4 md:p-6 space-y-6">
        <div className="bg-slate-800/90 rounded-2xl border border-slate-700 p-5 shadow-xl">
          <h2 className="text-sm font-bold uppercase tracking-wider text-sky-400 mb-4">
            Search Flights
          </h2>

          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">From</label>
              <input
                id="flight-from-input"
                data-agent-id="flight-from-input"
                type="text"
                value={fromCity}
                onChange={(e) => setFromCity(e.target.value)}
                placeholder="Origin city..."
                className="w-full px-3 py-2 bg-slate-900 text-xs text-white rounded-lg border border-slate-700 focus:border-sky-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">To</label>
              <input
                id="flight-to-input"
                data-agent-id="flight-to-input"
                type="text"
                value={toCity}
                onChange={(e) => setToCity(e.target.value)}
                placeholder="Destination city..."
                className="w-full px-3 py-2 bg-slate-900 text-xs text-white rounded-lg border border-slate-700 focus:border-sky-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Depart Date</label>
              <input
                id="flight-date-input"
                data-agent-id="flight-date-input"
                type="date"
                value={departDate}
                onChange={(e) => setDepartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 text-xs text-white rounded-lg border border-slate-700 focus:border-sky-500 outline-none"
              />
            </div>

            <div className="flex flex-col justify-end">
              <button
                id="btn-search-flights"
                data-agent-id="btn-search-flights"
                type="submit"
                className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow"
              >
                <span>Search Flights</span>
              </button>
            </div>
          </form>
        </div>

        {/* Flight Results */}
        {(searched || true) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Found 3 flights for <strong className="text-white">{fromCity} → {toCity}</strong></span>
              <span>Sorted by best value</span>
            </div>

            {AVAILABLE_FLIGHTS.map((flight) => (
              <div
                key={flight.id}
                className="bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold text-xs border border-sky-500/20">
                    ✈️
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{flight.airline}</h3>
                    <span className="text-[11px] text-slate-400">{flight.flightNo} • Boeing 787</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-center">
                  <div>
                    <div className="text-sm font-bold text-white">{flight.depTime}</div>
                    <div className="text-[11px] text-slate-400">{flight.from.slice(0, 3)}</div>
                  </div>
                  <div className="text-center text-[10px] text-slate-400">
                    <span>{flight.duration}</span>
                    <div className="w-16 h-0.5 bg-slate-600 my-1 relative">
                      <div className="w-1.5 h-1.5 rounded-full bg-sky-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <span className="text-emerald-400">{flight.stops}</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{flight.arrTime}</div>
                    <div className="text-[11px] text-slate-400">{flight.to.slice(0, 3)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-base font-extrabold text-white">${flight.price}</span>
                    <span className="block text-[10px] text-slate-400">one way</span>
                  </div>
                  <button
                    id={`btn-book-flight-${flight.id.toLowerCase()}`}
                    data-agent-id={`btn-book-flight-${flight.id.toLowerCase()}`}
                    onClick={() => handleBookFlight(flight)}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Booking confirmation modal */}
      {bookedFlight && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="font-bold text-base text-white">Booking Confirmed!</h3>
              </div>
              <button
                data-agent-id="btn-close-booking-modal"
                onClick={() => setBookedFlight(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/60 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Confirmation Code:</span>
                <span className="font-mono font-bold text-sky-400">SKY-78291-OK</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Flight:</span>
                <span className="text-white font-medium">{bookedFlight.airline} ({bookedFlight.flightNo})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Route:</span>
                <span className="text-white font-medium">{fromCity} → {toCity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Paid:</span>
                <span className="text-emerald-400 font-bold">${bookedFlight.price}</span>
              </div>
            </div>

            <button
              id="btn-done-booking"
              data-agent-id="btn-done-booking"
              onClick={() => setBookedFlight(null)}
              className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
