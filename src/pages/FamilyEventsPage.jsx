import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Users, Plus, ArrowLeft } from 'lucide-react';
import dataService from '../services/dataService';

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const EVENT_CONFIG = {
  birth:      { label: 'Birth',       emoji: '🎂', color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
  death:      { label: 'Death',       emoji: '🕊️', color: '#6b7280', bg: '#f9fafb', border: '#d1d5db' },
  marriage:   { label: 'Marriage',    emoji: '💍', color: '#db2777', bg: '#fdf2f8', border: '#f9a8d4' },
  divorce:    { label: 'Divorce',     emoji: '📝', color: '#9333ea', bg: '#faf5ff', border: '#d8b4fe' },
  graduation: { label: 'Graduation',  emoji: '🎓', color: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },
  custom:     { label: 'Event',       emoji: '⭐', color: '#C9731E', bg: '#fff7ed', border: '#fdba74' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}
function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}
function formatDate(iso) {
  const d = parseDate(iso);
  if (!d) return 'Unknown date';
  return d.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
}
function daysUntilAnniversary(isoDate) {
  const d = parseDate(isoDate);
  if (!d) return null;
  const today = new Date();
  const next  = new Date(today.getFullYear(), d.getMonth(), d.getDate());
  if (next < today) next.setFullYear(next.getFullYear() + 1);
  return Math.round((next - today) / 86400000);
}
function getEventLabel(ev) {
  if (ev.type === 'custom' && ev.customType) return ev.customType;
  return EVENT_CONFIG[ev.type]?.label ?? 'Event';
}
function getYearsAgo(isoDate) {
  const d = parseDate(isoDate);
  if (!d) return null;
  return new Date().getFullYear() - d.getFullYear();
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&display=swap');
  .fec-display { font-family:'Fraunces',Georgia,serif; }
  .fec-day-cell {
    min-height:100px; padding:6px; border-right:1px solid #f0f0f0;
    border-bottom:1px solid #f0f0f0; cursor:pointer; transition:background .12s;
    position:relative;
  }
  .fec-day-cell:hover { background:#f9fafb; }
  .fec-day-cell.today { background:#f0fdf4; }
  .fec-day-cell.selected { background:#dcfce7; }
  .fec-day-cell.other-month { opacity:.45; }
  .fec-chip {
    display:flex; align-items:center; gap:4px; padding:2px 6px;
    border-radius:6px; font-size:11px; font-weight:600; margin-top:2px;
    cursor:pointer; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    max-width:100%; border:1px solid transparent; transition:opacity .1s;
  }
  .fec-chip:hover { opacity:.8; }
  .fec-nav-btn {
    width:36px; height:36px; border-radius:10px; border:1.5px solid #e5e7eb;
    background:#fff; cursor:pointer; display:flex; align-items:center;
    justify-content:center; transition:all .15s; color:#374151;
  }
  .fec-nav-btn:hover { background:#f0fdf4; border-color:#86efac; color:#1F724A; }
  .fec-type-pill {
    display:inline-flex; align-items:center; gap:4px; padding:3px 10px;
    border-radius:999px; font-size:12px; font-weight:600; cursor:pointer;
    border:1.5px solid transparent; transition:all .15s;
  }
  .fec-detail-card {
    background:#fff; border-radius:16px; padding:18px; margin-bottom:10px;
    border:1px solid #f0f0f0; box-shadow:0 1px 4px rgba(0,0,0,.06);
    animation:fec-in .15s ease;
  }
  @keyframes fec-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  .fec-upcoming-item {
    display:flex; align-items:center; gap:10px; padding:10px 0;
    border-bottom:1px solid #f5f5f5; cursor:pointer; transition:background .1s;
  }
  .fec-upcoming-item:last-child { border-bottom:none; }
  .fec-upcoming-item:hover { background:#f9fafb; border-radius:8px; padding:10px 6px; }
`;

// ─── Event Detail Panel ────────────────────────────────────────────────────────
function EventDetail({ event, peopleMap, onClose }) {
  const cfg = EVENT_CONFIG[event.type] || EVENT_CONFIG.custom;
  const names = (event.personIds || []).map(id => peopleMap[id] || 'Unknown').join(' & ');
  const years = getYearsAgo(event.date);
  const days  = daysUntilAnniversary(event.date);

  return (
    <div className="fec-detail-card">
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:cfg.bg, border:`1.5px solid ${cfg.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
            {cfg.emoji}
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:cfg.color }}>{getEventLabel(event)}</div>
            <div style={{ fontSize:11, color:'#9ca3af' }}>{formatDate(event.date)}</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:18, lineHeight:1, padding:2 }}>×</button>
      </div>

      {event.title && (
        <div style={{ fontSize:15, fontWeight:700, color:'#111827', marginBottom:4 }}>{event.title}</div>
      )}

      {names && (
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#374151', marginBottom:6 }}>
          <Users size={13} color="#9ca3af"/>{names}
        </div>
      )}

      {event.location && (
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#374151', marginBottom:6 }}>
          <MapPin size={13} color="#9ca3af"/>{event.location}
        </div>
      )}

      {event.description && (
        <div style={{ fontSize:13, color:'#6b7280', lineHeight:1.6, marginTop:4, borderTop:'1px solid #f5f5f5', paddingTop:8 }}>
          {event.description}
        </div>
      )}

      {years !== null && years > 0 && (
        <div style={{ marginTop:8, padding:'6px 10px', background:cfg.bg, borderRadius:8, fontSize:12, color:cfg.color, fontWeight:600 }}>
          {years} year{years !== 1 ? 's' : ''} ago
          {days !== null && days <= 14 && (
            <span style={{ marginLeft:8, color:days === 0 ? '#dc2626' : '#C9731E' }}>
              {days === 0 ? '· Today! 🎉' : `· Anniversary in ${days} day${days !== 1 ? 's' : ''}`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FamilyEventsPage() {
  const { treeId }   = useParams();
  const navigate     = useNavigate();
  const today        = new Date();

  const [year, setYear]           = useState(today.getFullYear());
  const [month, setMonth]         = useState(today.getMonth());
  const [events, setEvents]       = useState([]);
  const [people, setPeople]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selectedDay, setDay]     = useState(null);
  const [selectedEvent, setEvent] = useState(null);
  const [typeFilter, setType]     = useState(null); // null = all

  // Fetch events and people
  useEffect(() => {
    if (!treeId) return;
    const load = async () => {
      setLoading(true);
      try {
        const [evList, pplList] = await Promise.all([
          dataService.getAllEvents(treeId),
          dataService.getPeopleByTreeId(treeId),
        ]);
        setEvents(evList.filter(e => !e.isDeleted && !e.deletedAt));
        setPeople(pplList);
      } catch (err) {
        console.error('FamilyEventsPage load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [treeId]);

  // People name map
  const peopleMap = useMemo(() => {
    const m = {};
    people.forEach(p => { m[p.id] = p.name || p.firstName || 'Unknown'; });
    return m;
  }, [people]);

  // Filtered events
  const filteredEvents = useMemo(() =>
    typeFilter ? events.filter(e => e.type === typeFilter) : events,
  [events, typeFilter]);

  // Events by date string "YYYY-M-D"
  const eventsByDay = useMemo(() => {
    const map = {};
    filteredEvents.forEach(ev => {
      const d = parseDate(ev.date);
      if (!d) return;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [filteredEvents]);

  // Calendar grid
  const { weeks, firstDay } = useMemo(() => {
    const first = new Date(year, month, 1);
    const last  = new Date(year, month + 1, 0);
    const cells = [];
    // Pad start
    for (let i = 0; i < first.getDay(); i++) {
      cells.push(new Date(year, month, 1 - (first.getDay() - i)));
    }
    for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d));
    // Pad end to complete grid
    while (cells.length % 7 !== 0) cells.push(new Date(year, month + 1, cells.length - last.getDate() - first.getDay() + 1));
    const ws = [];
    for (let i = 0; i < cells.length; i += 7) ws.push(cells.slice(i, i + 7));
    return { weeks: ws, firstDay: first };
  }, [year, month]);

  // Upcoming events (next 30 days, recurring anniversary awareness)
  const upcoming = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now.getTime() + 30 * 86400000);
    return filteredEvents
      .map(ev => {
        const d = parseDate(ev.date);
        if (!d) return null;
        // Check this year's anniversary
        const ann = new Date(now.getFullYear(), d.getMonth(), d.getDate());
        if (ann < now) ann.setFullYear(ann.getFullYear() + 1);
        if (ann > cutoff) return null;
        return { ev, ann, days: Math.round((ann - now) / 86400000) };
      })
      .filter(Boolean)
      .sort((a, b) => a.days - b.days)
      .slice(0, 12);
  }, [filteredEvents]);

  // Stats
  const stats = useMemo(() => {
    const counts = {};
    filteredEvents.forEach(e => { counts[e.type] = (counts[e.type] || 0) + 1; });
    return counts;
  }, [filteredEvents]);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const dayEvents = useMemo(() => {
    if (!selectedDay) return [];
    const key = `${selectedDay.getFullYear()}-${selectedDay.getMonth()}-${selectedDay.getDate()}`;
    return eventsByDay[key] || [];
  }, [selectedDay, eventsByDay]);

  if (!treeId) return (
    <div style={{ padding:40, textAlign:'center' }}>
      <div style={{ fontSize:32, marginBottom:12 }}>📅</div>
      <div style={{ fontSize:16, color:'#6b7280' }}>No tree selected. Go to a family tree first.</div>
    </div>
  );

  return (
    <>
      <style>{css}</style>
      <div style={{ background:'#F3EDE0', minHeight:'100vh', padding:'0 0 40px' }}>

        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#14532d,#1F724A)', padding:'18px 28px', display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => navigate(-1)} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8, cursor:'pointer', padding:6, color:'#fff', display:'flex' }}>
            <ArrowLeft size={18}/>
          </button>
          <Calendar size={22} color="rgba(255,255,255,0.85)"/>
          <div>
            <div className="fec-display" style={{ fontSize:20, fontWeight:600, color:'#fff' }}>Family Events</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.65)', marginTop:1 }}>{events.length} events · {people.length} members</div>
          </div>
        </div>

        <div style={{ maxWidth:1200, margin:'0 auto', padding:'24px 20px' }}>
          {loading ? (
            <div style={{ textAlign:'center', padding:80 }}>
              <div style={{ width:36, height:36, border:'3px solid #1F724A', borderTopColor:'transparent', borderRadius:'50%', animation:'spin .7s linear infinite', margin:'0 auto 14px' }}/>
              <div style={{ color:'#9ca3af', fontSize:14 }}>Loading family events…</div>
            </div>
          ) : (
            <div style={{ display:'flex', gap:24, alignItems:'flex-start' }}>

              {/* ── Left: Calendar ── */}
              <div style={{ flex:1, minWidth:0 }}>

                {/* Type filter pills */}
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
                  <button
                    className="fec-type-pill"
                    onClick={() => setType(null)}
                    style={{ background: typeFilter===null?'#1F724A':'#fff', color:typeFilter===null?'#fff':'#374151', borderColor:typeFilter===null?'#1F724A':'#e5e7eb' }}>
                    All ({events.length})
                  </button>
                  {Object.entries(EVENT_CONFIG).map(([type, cfg]) => {
                    const count = stats[type] || 0;
                    if (count === 0) return null;
                    const active = typeFilter === type;
                    return (
                      <button key={type} className="fec-type-pill" onClick={() => setType(active ? null : type)}
                        style={{ background:active?cfg.color:cfg.bg, color:active?'#fff':cfg.color, borderColor:active?cfg.color:cfg.border }}>
                        {cfg.emoji} {cfg.label} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Month nav */}
                <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,.06)', border:'1px solid #f0f0f0' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderBottom:'1px solid #f0f0f0' }}>
                    <button className="fec-nav-btn" onClick={prevMonth}><ChevronLeft size={16}/></button>
                    <div className="fec-display" style={{ fontSize:18, fontWeight:600, color:'#111827' }}>
                      {MONTHS[month]} {year}
                    </div>
                    <button className="fec-nav-btn" onClick={nextMonth}><ChevronRight size={16}/></button>
                  </div>

                  {/* Day headers */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom:'1px solid #f0f0f0' }}>
                    {DAYS.map(d => (
                      <div key={d} style={{ padding:'8px 6px', textAlign:'center', fontSize:12, fontWeight:700, color:'#9ca3af' }}>{d}</div>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  {weeks.map((week, wi) => (
                    <div key={wi} style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
                      {week.map((date, di) => {
                        const isThisMonth = date.getMonth() === month;
                        const isToday     = sameDay(date, today);
                        const isSelected  = selectedDay && sameDay(date, selectedDay);
                        const key         = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                        const dayEvs      = eventsByDay[key] || [];
                        return (
                          <div
                            key={di}
                            className={`fec-day-cell ${isToday?'today':''} ${isSelected?'selected':''} ${!isThisMonth?'other-month':''}`}
                            onClick={() => { setDay(date); setEvent(null); }}
                          >
                            <div style={{
                              width:24, height:24, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                              fontSize:13, fontWeight:isToday||isSelected?700:500,
                              background:isToday?'#1F724A':isSelected?'#bbf7d0':'transparent',
                              color:isToday?'#fff':isSelected?'#14532d':'#374151',
                              marginBottom:2,
                            }}>{date.getDate()}</div>

                            {dayEvs.slice(0,3).map((ev, ei) => {
                              const cfg = EVENT_CONFIG[ev.type] || EVENT_CONFIG.custom;
                              return (
                                <div key={ei} className="fec-chip"
                                  style={{ background:cfg.bg, color:cfg.color, borderColor:cfg.border }}
                                  onClick={e => { e.stopPropagation(); setDay(date); setEvent(ev); }}>
                                  <span>{cfg.emoji}</span>
                                  <span style={{ overflow:'hidden', textOverflow:'ellipsis' }}>
                                    {ev.title || getEventLabel(ev)}
                                  </span>
                                </div>
                              );
                            })}
                            {dayEvs.length > 3 && (
                              <div style={{ fontSize:10, color:'#9ca3af', paddingLeft:2, marginTop:1 }}>+{dayEvs.length-3} more</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Day detail panel */}
                {selectedDay && dayEvents.length > 0 && (
                  <div style={{ marginTop:16 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'#374151', marginBottom:8 }}>
                      {selectedDay.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' })} — {dayEvents.length} event{dayEvents.length!==1?'s':''}
                    </div>
                    {selectedEvent ? (
                      <EventDetail event={selectedEvent} peopleMap={peopleMap} onClose={() => setEvent(null)}/>
                    ) : (
                      dayEvents.map(ev => {
                        const cfg = EVENT_CONFIG[ev.type] || EVENT_CONFIG.custom;
                        const names = (ev.personIds||[]).map(id => peopleMap[id]||'Unknown').join(' & ');
                        return (
                          <div key={ev.id} className="fec-detail-card" style={{ cursor:'pointer' }} onClick={() => setEvent(ev)}>
                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                              <div style={{ width:32, height:32, borderRadius:8, background:cfg.bg, border:`1.5px solid ${cfg.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>{cfg.emoji}</div>
                              <div>
                                <div style={{ fontSize:14, fontWeight:600, color:'#111827' }}>{ev.title || getEventLabel(ev)}</div>
                                <div style={{ fontSize:12, color:'#9ca3af' }}>{names || 'No members linked'}{ev.location ? ` · ${ev.location}` : ''}</div>
                              </div>
                              <ChevronRight size={16} color="#d1d5db" style={{ marginLeft:'auto' }}/>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {selectedDay && dayEvents.length === 0 && (
                  <div style={{ marginTop:12, padding:'14px 16px', background:'#fff', borderRadius:12, border:'1px solid #f0f0f0', textAlign:'center', color:'#9ca3af', fontSize:13 }}>
                    No events on {selectedDay.toLocaleDateString('en-GB', { day:'numeric', month:'long' })}
                  </div>
                )}
              </div>

              {/* ── Right: Sidebar ── */}
              <div style={{ width:280, flexShrink:0 }}>

                {/* Quick stats */}
                <div style={{ background:'#fff', borderRadius:16, padding:18, marginBottom:16, border:'1px solid #f0f0f0', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
                  <div className="fec-display" style={{ fontSize:15, fontWeight:600, color:'#111827', marginBottom:12 }}>Overview</div>
                  {Object.entries(EVENT_CONFIG).map(([type, cfg]) => {
                    const count = stats[type] || 0;
                    if (count === 0) return null;
                    return (
                      <div key={type} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #f9f9f9' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#374151' }}>
                          <span>{cfg.emoji}</span>{cfg.label}
                        </div>
                        <div style={{ fontSize:13, fontWeight:700, color:cfg.color }}>{count}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Upcoming / anniversaries */}
                <div style={{ background:'#fff', borderRadius:16, padding:18, border:'1px solid #f0f0f0', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
                  <div className="fec-display" style={{ fontSize:15, fontWeight:600, color:'#111827', marginBottom:12 }}>Upcoming (30 days)</div>

                  {upcoming.length === 0 ? (
                    <div style={{ textAlign:'center', color:'#9ca3af', fontSize:13, padding:'12px 0' }}>No events in the next 30 days</div>
                  ) : (
                    upcoming.map(({ ev, ann, days }) => {
                      const cfg = EVENT_CONFIG[ev.type] || EVENT_CONFIG.custom;
                      const names = (ev.personIds||[]).map(id => peopleMap[id]||'Unknown').join(' & ');
                      const years = getYearsAgo(ev.date);
                      return (
                        <div key={ev.id} className="fec-upcoming-item" onClick={() => { setDay(ann); setEvent(ev); }}>
                          <div style={{ width:34, height:34, borderRadius:10, background:cfg.bg, border:`1.5px solid ${cfg.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
                            {cfg.emoji}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:13, fontWeight:600, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {ev.title || getEventLabel(ev)}
                            </div>
                            <div style={{ fontSize:11, color:'#9ca3af', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {names}
                            </div>
                          </div>
                          <div style={{ textAlign:'right', flexShrink:0 }}>
                            <div style={{ fontSize:11, fontWeight:700, color: days === 0?'#dc2626':days<=7?'#C9731E':'#9ca3af' }}>
                              {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
                            </div>
                            {years !== null && years > 0 && (
                              <div style={{ fontSize:10, color:'#d1d5db' }}>{years}yr</div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}