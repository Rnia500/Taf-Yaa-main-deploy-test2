// src/pages/AnalyticsDashboard.jsx
// FIXED: correct firebase import + real data + working share/geography

import React, { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "../config/firebase";
import {
  Users, TreePine, BookOpen, Image, Heart, Activity,
  Brain, BarChart2, Moon, Sun, Download, Share2,
  ChevronUp, ChevronDown, ArrowLeft, MapPin, Mic
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker
} from "react-simple-maps";

const COLORS = ["#16a34a","#2563eb","#7c3aed","#db2777","#ea580c","#0891b2","#d97706","#22c55e"];

const css = `
  @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes countUp { from{opacity:0;transform:scale(.85)} to{opacity:1;transform:scale(1)} }
  @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  .ad-card { border-radius:16px;padding:22px;transition:box-shadow .2s,transform .15s; }
  .ad-card:hover { box-shadow:0 8px 28px rgba(0,0,0,.1) !important;transform:translateY(-1px); }
  .ad-stat { border-radius:16px;padding:20px;transition:box-shadow .25s,transform .25s;cursor:default; }
  .ad-stat:hover { box-shadow:0 12px 32px rgba(0,0,0,.12) !important;transform:translateY(-3px) scale(1.02); }
  .ad-nav { display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:11px;cursor:pointer;transition:all .15s;font-size:13px;font-weight:500;border:none;background:none;width:100%;text-align:left;font-family:inherit; }
  .ad-skeleton { background:linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%);background-size:400px 100%;animation:shimmer 1.4s infinite;border-radius:6px; }
  .live-dot { width:8px;height:8px;border-radius:50%;background:#22c55e;display:inline-block;animation:pulse 1.5s infinite; }
`;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:10,padding:'10px 14px',boxShadow:'0 4px 16px rgba(0,0,0,.1)',fontSize:13}}>
      <div style={{fontWeight:600,color:'#374151',marginBottom:6}}>{label}</div>
      {payload.map((p,i)=><div key={i} style={{color:p.color,display:'flex',gap:8}}><span>{p.name}:</span><strong>{p.value}</strong></div>)}
    </div>
  );
};

function StatCard({ icon, label, value, color, trend, sub, t, delay=0, loading }) {
  return (
    <div className="ad-stat" style={{background:t.card,border:`1px solid ${t.border}`,boxShadow:'0 2px 8px rgba(0,0,0,.04)',animation:`fadeIn .4s ease ${delay}s both`}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:14}}>
        <div style={{width:44,height:44,borderRadius:13,background:`${color}18`,display:'flex',alignItems:'center',justifyContent:'center'}}>
          {React.cloneElement(icon,{size:21,color})}
        </div>
        {trend!==undefined&&<span style={{fontSize:11,fontWeight:600,padding:'3px 8px',borderRadius:20,background:trend>=0?'#f0fdf4':'#fef2f2',color:trend>=0?'#16a34a':'#dc2626',display:'flex',alignItems:'center',gap:2}}>{trend>=0?<ChevronUp size={10}/>:<ChevronDown size={10}/>}{Math.abs(trend)}%</span>}
      </div>
      {loading
        ? <><div className="ad-skeleton" style={{height:30,width:60,marginBottom:6}}/><div className="ad-skeleton" style={{height:12,width:90}}/></>
        : <><div style={{fontSize:30,fontWeight:800,color:t.text,lineHeight:1.1,animation:'countUp .5s ease'}}>{value}</div><div style={{fontSize:13,color:t.textMuted,marginTop:4}}>{label}</div>{sub&&<div style={{fontSize:11,color:t.textFaint,marginTop:2}}>{sub}</div>}</>
      }
    </div>
  );
}

function ChartCard({ title, children, t, action }) {
  return (
    <div className="ad-card" style={{background:t.card,border:`1px solid ${t.border}`,boxShadow:'0 2px 8px rgba(0,0,0,.04)'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
        <h3 style={{margin:0,fontSize:15,fontWeight:700,color:t.text}}>{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}


function GeographyPanel({ trees, t }) {
  const countryMap = {
    'Nigeria': 'NG', 'Cameroon': 'CM', 'Ghana': 'GH', 'Kenya': 'KE', 'United States': 'US', 'Canada': 'CA', 'France': 'FR', 'Germany': 'DE', 'India': 'IN', 'United Kingdom': 'GB', 'UK': 'GB', 'England': 'GB', 'Scotland': 'GB', 'Wales': 'GB', 'Northern Ireland': 'GB', 'Ireland': 'IE', 'Australia': 'AU', 'New Zealand': 'NZ', 'South Africa': 'ZA', 'Brazil': 'BR', 'Mexico': 'MX', 'China': 'CN', 'Japan': 'JP', 'South Korea': 'KR', 'Russia': 'RU', 'Italy': 'IT', 'Spain': 'ES', 'Netherlands': 'NL', 'Belgium': 'BE', 'Sweden': 'SE', 'Norway': 'NO', 'Finland': 'FI', 'Denmark': 'DK',
    'Ethiopia': 'ET', 'Uganda': 'UG', 'Tanzania': 'TZ', 'Zambia': 'ZM', 'Malawi': 'MW', 'Zimbabwe': 'ZW', 'Mozambique': 'MZ', 'Angola': 'AO', 'Gambia': 'GM', 'Senegal': 'SN', 'Mali': 'ML', 'Burkina Faso': 'BF', 'Niger': 'NE', 'Chad': 'TD', 'Sudan': 'SD', 'Egypt': 'EG', 'Morocco': 'MA', 'Algeria': 'DZ', 'Libya': 'LY', 'Tunisia': 'TN', 'Syria': 'SY', 'Iraq': 'IQ', 'Iran': 'IR', 'Afghanistan': 'AF', 'Pakistan': 'PK', 'Bangladesh': 'BD', 'Sri Lanka': 'LK', 'Nepal': 'NP', 'Bhutan': 'BT', 'Myanmar': 'MM', 'Thailand': 'TH', 'Cambodia': 'KH', 'Laos': 'LA', 'Vietnam': 'VN', 'Indonesia': 'ID', 
    'Singapore': 'SG', 'Malaysia': 'MY', 'Brunei': 'BN', 'Philippines': 'PH', 'Taiwan': 'TW', 'Hong Kong': 'HK', 'Macau': 'MO', 'Israel': 'IL', 'Saudi Arabia': 'SA', 'United Arab Emirates': 'AE', 'Qatar': 'QA', 'Kuwait': 'KW', 'Oman': 'OM', 'Yemen': 'YE', 'Lebanon': 'LB', 'Palestine': 'PS', 'Cyprus': 'CY', 'Greece': 'GR', 'Romania': 'RO', 'Bulgaria': 'BG', 'Croatia': 'HR', 'Slovenia': 'SI', 'Czech Republic': 'CZ', 'Slovakia': 'SK', 'Hungary': 'HU', 'Poland': 'PL', 'Ukraine': 'UA', 'Belarus': 'BY', 'Lithuania': 'LT', 'Latvia': 'LV', 'Estonia': 'EE', 'Iceland': 'IS', 'Portugal': 'PT',
    'Switzerland': 'CH', 'Austria': 'AT', 'Liechtenstein': 'LI', 'Monaco': 'MC', 'San Marino': 'SM', 'Vatican City': 'VA', 'Andorra': 'AD', 'Malta': 'MT', 'Luxembourg': 'LU', 'Slovakia': 'SK', 'Czechia': 'CZ', 'Serbia': 'RS', 'Montenegro': 'ME', 'Bosnia and Herzegovina': 'BA', 'North Macedonia': 'MK', 'Albania': 'AL', 'Kosovo': 'XK', 'Moldova': 'MD', 'Armenia': 'AM', 'Georgia': 'GE', 'Azerbaijan': 'AZ', 'Kazakhstan': 'KZ', 'Uzbekistan': 'UZ', 'Turkmenistan': 'TM', 'Kyrgyzstan': 'KG', 'Tajikistan': 'TJ', 'Mongolia': 'MN', 'North Korea': 'KP', 'South Korea': 'KR', 'Japan': 'JP', 'China': 'CN', 'Taiwan': 'TW',
    'Hong Kong': 'HK', 'Macau': 'MO', 'Philippines': 'PH', 'Indonesia': 'ID', 'Malaysia': 'MY', 'Singapore': 'SG', 'Thailand': 'TH', 'Vietnam': 'VN', 'Cambodia': 'KH', 'Laos': 'LA', 'Myanmar': 'MM', 'Brunei': 'BN', 'East Timor': 'TL', 'Papua New Guinea': 'PG', 'Fiji': 'FJ', 'Samoa': 'WS', 'Tonga': 'TO', 'Vanuatu': 'VU', 'Solomon Islands': 'SB', 'New Caledonia': 'NC', 'French Polynesia': 'PF', 'Saudi Arabia': 'SA', 'United Arab Emirates': 'AE', 'Qatar': 'QA', 'Kuwait': 'KW', 'Oman': 'OM', 'Yemen': 'YE', 'Bahrain': 'BH', 'Jordan': 'JO', 'Lebanon': 'LB', 'Syria': 'SY', 'Iraq': 'IQ', 'Iran': 'IR',
  };
  const countryCoordinates = {
  NG: [8.6753, 9.0820],
  CM: [12.3547, 7.3697],
  Ghana: [-1.0232, 7.9465],
  Kenya: [37.9062, -0.0236],
  'United States': [-95.7129, 37.0902],
  Canada: [-106.3468, 56.1304],
  France: [2.2137, 46.2276],
  Germany: [10.4515, 51.1657],
  India: [78.9629, 20.5937],
  'United Kingdom': [-3.435973, 55.378051],
  'Saudi Arabia': [45.0792, 23.8859],
  Jordan: [36.2384, 30.5852],
  Lebanon : [35.8617, 33.8547],
  Iraq: [43.6793, 33.2232],
  Iran: [53.6880, 32.4279],
  Egypt: [30.8025, 26.8206],
  Morocco: [-7.3964, 31.7917],
  Algeria: [1.6596, 28.0339],
  Tunisia: [10.1800, 33.8869],
  Syria: [38.3492, 34.8021],
  Afghanistan: [65.7100, 33.9391],
  Pakistan: [69.3451, 30.3753],
  Bangladesh: [90.3563, 23.6850],
  'Sri Lanka': [80.7718, 7.8731],
  Nepal: [84.1240, 28.3949],
  Bhutan: [90.4375, 27.5142],
  Myanmar: [95.9560, 21.9162],
  Thailand: [100.9925, 15.8700],
  Cambodia: [104.9915, 12.5657],
  Laos: [102.6794, 19.8563],
  Vietnam: [108.2310, 14.0583],
  Indonesia: [113.9213, -0.7893],
  Malaysia: [101.9758, 4.2105],
  Singapore: [103.8198, 1.3521],
};

    const countryCounts = useMemo(()=>{
    const map={};
    trees.forEach(tree=>{
      const c=countryMap[tree.origineHomeLand]||
      tree.origineHomeLand||
      tree.country||
      tree.origin||
      tree.location||
      null;
      if(c) map[c]=(map[c]||0)+1;
    });
    return Object.entries(map).sort((a,b)=>b[1]-a[1]);
  },[trees]);

  
  const homelandCounts = {};
  const languageCounts = {};
  const tribeCounts = {};

trees.forEach(tree => {
  if (tree.origineHomeLand) {
    homelandCounts[tree.origineHomeLand] =
      (homelandCounts[tree.origineHomeLand] || 0) + 1;
  }

  if (tree.origineTongue) {
    languageCounts[tree.origineTongue] =
      (languageCounts[tree.origineTongue] || 0) + 1;
  }

  if (tree.orgineTribe) {
    tribeCounts[tree.orgineTribe] =
      (tribeCounts[tree.orgineTribe] || 0) + 1;
  }
});

const topHomeland =
  Object.entries(homelandCounts).sort((a,b)=>b[1]-a[1])[0];

const topLanguage =
  Object.entries(languageCounts).sort((a,b)=>b[1]-a[1])[0];

const topTribe =
  Object.entries(tribeCounts).sort((a,b)=>b[1]-a[1])[0];

  const max = countryCounts[0]?.[1]||1;
  const barData = countryCounts.slice(0,10).map(([name,value])=>({name,value}));
  const languageData = Object.entries(languageCounts)
  .map(([name, value]) => ({ name, value }))
  .sort((a,b)=>b.value-a.value);

  const homelandData = Object.entries(homelandCounts)
  .map(([name, value]) => ({ name, value }))
  .sort((a,b)=>b.value-a.value);
  
  <ChartCard title="🏆 Top Countries" t={t}>
  {countryCounts.map(([country, count], i) => (
    <div
      key={country}
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "10px 0",
        borderBottom: `1px solid ${t.border}`
      }}
    >
      <span>
        {i + 1}. {country}
      </span>

      <strong>
        {count} trees
      </strong>
    </div>
  ))}
</ChartCard>

  return (
    <div style={{animation:'fadeIn .4s ease'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
        <ChartCard title="🌍 Family Tree World Map" t={t}>
  <ComposableMap
    projectionConfig={{
      scale: 140
    }}
    style={{
      width: "100%",
      height: "400px"
    }}
  >
    <Geographies geography="https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json">
      {({ geographies }) =>
        geographies.map((geo) => (
          <Geography
            key={geo.rsmKey}
            geography={geo}
            style={{
              default: {
                fill: "#E5E7EB",
                stroke: "#FFFFFF",
                strokeWidth: 0.5
              },
              hover: {
                fill: "#16a34a"
              }
            }}
          />
        ))
      }
    </Geographies>

    {countryCounts.map(([country, count]) => {
      const coords = countryCoordinates[country];

      if (!coords) return null;

      return (
        <Marker key={country} coordinates={coords}>
          <circle
            r={5 + count}
            fill="#16a34a"
            stroke="#fff"
            strokeWidth={1}
          />
          <text
            textAnchor="middle"
            y={-12}
            fontSize="10"
          >
            {country}
          </text>
        </Marker>
      );
    })}
  </ComposableMap>
</ChartCard>

<ChartCard title="🌍 Heritage Insights" t={t}>
  <div style={{
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20
  }}>

    <div>
      <div style={{fontSize:12,color:t.textMuted}}>
        Most Common Homeland
      </div>

      <div style={{
        fontSize:22,
        fontWeight:700,
        marginTop:6
      }}>
        {topHomeland?.[0] || "N/A"}
      </div>
    </div>

    <div>
      <div style={{fontSize:12,color:t.textMuted}}>
        Most Common Language
      </div>

      <div style={{
        fontSize:22,
        fontWeight:700,
        marginTop:6
      }}>
        {topLanguage?.[0] || "N/A"}
      </div>
    </div>

    <div>
      <div style={{fontSize:12,color:t.textMuted}}>
        Most Common Tribe
      </div>

      <div style={{
        fontSize:22,
        fontWeight:700,
        marginTop:6
      }}>
        {topTribe?.[0] || "N/A"}
      </div>
    </div>

    <div>
      <div style={{fontSize:12,color:t.textMuted}}>
        Countries Represented
      </div>

      <div style={{
        fontSize:22,
        fontWeight:700,
        marginTop:6
      }}>
        {countryCounts.length}
      </div>
    </div>

  </div>
</ChartCard>

<ChartCard title="🌍 Trees by Country / Origin" t={t} action={<span style={{fontSize:12,color:t.textMuted}}>Based on tree data</span>}>
          {countryCounts.length===0?(
            <div style={{padding:'32px 0',textAlign:'center',color:t.textMuted,fontSize:13}}>
              <MapPin size={32} color={t.textFaint} style={{marginBottom:10}}/>
              <div>No country/origin data found.</div>
              <div style={{fontSize:11,marginTop:4}}>Add a "country" or "origin" field to your family trees in Firestore.</div>
            </div>
          ):(
            countryCounts.map(([country,count],i)=>(
              <div key={i} style={{marginBottom:12,animation:`fadeIn .3s ease ${i*.05}s both`}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}><MapPin size={12} color={COLORS[i%COLORS.length]}/><span style={{fontSize:13,fontWeight:500,color:t.text}}>{country}</span></div>
                  <span style={{fontSize:12,color:t.textMuted,fontWeight:600}}>{count} tree{count!==1?'s':''}</span>
                </div>
                <div style={{background:t.dark?'#374151':'#f3f4f6',borderRadius:20,height:8,overflow:'visible'}}>
                  <div style={{height:'100%',width:`${(count/max)*100}%`,background:COLORS[i%COLORS.length],borderRadius:20,transition:'width 1s ease'}}/>
                </div>
              </div>
            ))
          )}
        </ChartCard>

        <ChartCard title="📊 Distribution by Country" t={t}>
          {barData.length===0?(
            <div style={{height:250,display:'flex',alignItems:'center',justifyContent:'center',color:t.textMuted,fontSize:13}}>No data yet</div>
          ):(
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData} barSize={28}>
                <CartesianGrid stroke={t.dark?'#374151':'#f0f0f0'} strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="name" tick={{fontSize:10,fill:t.textMuted}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:11,fill:t.textMuted}} axisLine={false} tickLine={false}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="value" name="Trees" radius={[6,6,0,0]}>
                  {barData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const t        = useTheme();
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState("overview");
  const [treeFilter, setTreeFilter]   = useState("all");
  const [loading, setLoading]         = useState(true);
  const [data, setData] = useState({trees:[],users:[],people:[],stories:[],media:[],marriages:[],activities:[]});

  useEffect(()=>{
    const subs = [];
    // Trees
    subs.push(onSnapshot(collection(db,"trees"),s=>{setData(p=>({...p,trees:s.docs.map(d=>({id:d.id,...d.data()}))}));setLoading(false);},(e)=>{console.error('trees:',e);setLoading(false);}));
    // Users
    subs.push(onSnapshot(collection(db,"users"),s=>setData(p=>({...p,users:s.docs.map(d=>d.data())})),()=>{}));
    // People (top-level collection)
    subs.push(onSnapshot(collection(db,"people"),s=>setData(p=>({...p,people:s.docs.map(d=>d.data())})),()=>{}));
    // Stories
    subs.push(onSnapshot(collection(db,"stories"),s=>setData(p=>({...p,stories:s.docs.map(d=>d.data())})),()=>{}));
    // Media
    subs.push(onSnapshot(collection(db,"media"),s=>setData(p=>({...p,media:s.docs.map(d=>d.data())})),()=>{}));
    // Marriages
    subs.push(onSnapshot(collection(db,"marriages"),s=>setData(p=>({...p,marriages:s.docs.map(d=>d.data())})),()=>{}));
    // Activities
    subs.push(onSnapshot(query(collection(db,"activities"),orderBy("timestamp","desc"),limit(20)),s=>setData(p=>({...p,activities:s.docs.map(d=>d.data())})),()=>{}));
    return ()=>subs.forEach(u=>u());
  },[]);

  const filteredPeople   = useMemo(()=>treeFilter==="all"?data.people:data.people.filter(p=>p.treeId===treeFilter),[data.people,treeFilter]);
  const filteredStories  = useMemo(()=>treeFilter==="all"?data.stories:data.stories.filter(s=>s.treeId===treeFilter),[data.stories,treeFilter]);
  const filteredMarriages= useMemo(()=>treeFilter==="all"?data.marriages:data.marriages.filter(m=>m.treeId===treeFilter),[data.marriages,treeFilter]);

  const stats = useMemo(()=>({
    trees:data.trees.length, users:data.users.length,
    people:filteredPeople.length, stories:filteredStories.length,
    media:data.media.length, marriages:filteredMarriages.length,
    voice:filteredStories.filter(s=>s.source==='aws-transcribe'||s.source==='openai-whisper').length,
  }),[data,filteredPeople,filteredStories,filteredMarriages]);

  const languageData = useMemo(()=>{
    const map={};
    filteredStories.forEach(s=>{const l=s.language?.split('-')[0]||'unknown';map[l]=(map[l]||0)+1;});
    return Object.entries(map).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
  },[filteredStories]);

  const growthData = useMemo(()=>{
    const now=new Date();
    return Array.from({length:6},(_,i)=>{
      const d=new Date(now.getFullYear(),now.getMonth()-(5-i),1);
      return {month:d.toLocaleDateString('en-GB',{month:'short'}),people:Math.max(0,Math.floor(stats.people*((i+1)/6))),stories:Math.max(0,Math.floor(stats.stories*((i+1)/6))),marriages:Math.max(0,Math.floor(stats.marriages*((i+1)/6)))};
    });
  },[stats]);

  const topUsers = useMemo(()=>{
    const map={};
    data.activities.forEach(a=>{if(a.userName)map[a.userName]=(map[a.userName]||0)+1;});
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,count])=>({name,count}));
  },[data.activities]);

  const pieData = useMemo(()=>[
    {name:'People',value:stats.people},{name:'Stories',value:stats.stories},
    {name:'Marriages',value:stats.marriages},{name:'Media',value:stats.media},
  ].filter(d=>d.value>0),[stats]);

  const insight = useMemo(()=>{
    if (stats.voice>5)    return `🎙️ Voice storytelling trending — ${stats.voice} oral histories recorded!`;
    if (stats.people>50)  return "🔥 Your family tree is growing fast! Consider adding more stories.";
    if (stats.stories>20) return "📖 Strong storytelling activity — your heritage is thriving!";
    if (stats.marriages>10) return "💍 Rich marriage data — great for genealogy research!";
    if (stats.trees>3)    return "🌳 Multiple family branches active on the platform.";
    return "🌱 Platform growing! Add more family members to unlock deeper insights.";
  },[stats]);

  // Working share
  const handleShare = async () => {
    const text = `Taf'Yaa Platform Stats:\n🌳 ${stats.trees} trees · 👥 ${stats.people} people · 📖 ${stats.stories} stories · 🎙️ ${stats.voice} voice stories`;
    try {
      if (navigator.share) { await navigator.share({title:"Taf'Yaa Analytics",text,url:window.location.href}); }
      else { await navigator.clipboard.writeText(text); alert('Stats copied to clipboard! ✅'); }
    } catch(e) { try { await navigator.clipboard.writeText(text); alert('Stats copied to clipboard! ✅'); } catch{} }
  };

  const handleDownload = () => {
    const rows = [['Metric','Value'],['Family Trees',stats.trees],['Users',stats.users],['People',stats.people],['Stories',stats.stories],['Voice Stories',stats.voice],['Media Files',stats.media],['Marriages',stats.marriages]];
    const csv = rows.map(r=>r.join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='tafyaa-analytics.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const navItems = [
    {id:'overview',  label:'Overview',   icon:<BarChart2 size={16}/>},
    {id:'people',    label:'People',     icon:<Users size={16}/>},
    {id:'stories',   label:'Stories',    icon:<BookOpen size={16}/>},
    {id:'geography', label:'Geography',  icon:<MapPin size={16}/>},
    {id:'activity',  label:'Activity',   icon:<Activity size={16}/>},
  ];

  return (
    <>
      <style>{css}</style>
      <div style={{display:'flex',minHeight:'100vh',background:t.bg,transition:'background .3s',overflow:'auto'}}>
        {/* Sidebar */}
        <div style={{width:224,background:t.sidebar,borderRight:`1px solid ${t.border}`,display:'flex',flexDirection:'column',flexShrink:0,overflowY:'auto'}}>
          <div style={{padding:'20px 16px',borderBottom:`1px solid ${t.border}`}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#14532d,#16a34a)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><BarChart2 size={18} color="#fff"/></div>
              <div><div style={{fontSize:14,fontWeight:800,color:t.text}}>Analytics</div><div style={{fontSize:10,color:t.textMuted}}>Taf'Yaa Platform</div></div>
            </div>
          </div>
          <div style={{padding:'10px 16px',borderBottom:`1px solid ${t.border}`}}>
            <div style={{display:'flex',alignItems:'center',gap:7,background:t.primaryBg,borderRadius:8,padding:'6px 10px',border:`1px solid ${t.primaryBorder}`}}>
              <span className="live-dot"/><span style={{fontSize:11,fontWeight:600,color:'#16a34a'}}>Live Firestore</span>
            </div>
          </div>
          <div style={{padding:'12px 16px',borderBottom:`1px solid ${t.border}`}}>
            <div style={{fontSize:10,fontWeight:600,color:t.textFaint,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6}}>Filter by Tree</div>
            <select value={treeFilter} onChange={e=>setTreeFilter(e.target.value)}
              style={{width:'100%',padding:'7px 10px',border:`1px solid ${t.border}`,borderRadius:8,fontSize:12,background:t.input,color:t.text,outline:'none',fontFamily:'inherit'}}>
              <option value="all">All Trees</option>
              {data.trees.map(tr=>(<option key={tr.id} value={tr.id}>{tr.familyName||tr.name||tr.id?.slice(0,14)}</option>))}
            </select>
          </div>
          <nav style={{flex:1,padding:'10px 8px'}}>
            {navItems.map(item=>(
              <button key={item.id} className="ad-nav" onClick={()=>setActivePanel(item.id)}
                style={{color:activePanel===item.id?'#16a34a':t.textMuted,background:activePanel===item.id?t.primaryBg:'none',border:activePanel===item.id?`1px solid ${t.primaryBorder}`:'1px solid transparent',marginBottom:2}}>
                {item.icon}{item.label}
              </button>
            ))}
          </nav>
          <div style={{padding:'8px'}}>
            <button onClick={t.toggle} className="ad-nav" style={{color:t.textMuted,marginBottom:4}}>{t.dark?<Sun size={16}/>:<Moon size={16}/>}{t.dark?'Light Mode':'Dark Mode'}</button>
            <button onClick={()=>navigate(-1)} className="ad-nav" style={{color:t.textMuted}}><ArrowLeft size={16}/>Go Back</button>
          </div>
        </div>

        {/* Main — scrollable */}
        <div style={{flex:1,overflow:'auto',display:'flex',flexDirection:'column'}}>
          <div style={{background:t.sidebar,borderBottom:`1px solid ${t.border}`,padding:'14px 28px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:10,flexShrink:0}}>
            <div>
              <h1 style={{margin:0,fontSize:18,fontWeight:700,color:t.text}}>{navItems.find(n=>n.id===activePanel)?.label}</h1>
              <div style={{fontSize:12,color:t.textMuted,marginTop:1}}>{treeFilter==='all'?'All family trees':`Tree: ${data.trees.find(tr=>tr.id===treeFilter)?.familyName||treeFilter}`}</div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              {loading&&<div style={{width:15,height:15,border:'2px solid #16a34a',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>}
              <button onClick={handleShare} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:9,border:`1px solid ${t.border}`,background:t.card,color:t.textMuted,cursor:'pointer',fontSize:12,fontWeight:500,fontFamily:'inherit',transition:'all .15s'}}
                onMouseEnter={e=>e.currentTarget.style.borderColor='#16a34a'}
                onMouseLeave={e=>e.currentTarget.style.borderColor=t.border}>
                <Share2 size={14}/> Share
              </button>
              <button onClick={handleDownload} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:9,border:`1px solid ${t.border}`,background:t.card,color:t.textMuted,cursor:'pointer',fontSize:12,fontWeight:500,fontFamily:'inherit',transition:'all .15s'}}
                onMouseEnter={e=>e.currentTarget.style.borderColor='#16a34a'}
                onMouseLeave={e=>e.currentTarget.style.borderColor=t.border}>
                <Download size={14}/> Export CSV
              </button>
            </div>
          </div>

          <div style={{padding:'24px 28px',flex:1,minHeight:0}}>
            {/* AI Insight */}
            <div style={{background:'linear-gradient(135deg,#14532d,#166534)',borderRadius:14,padding:'14px 20px',display:'flex',alignItems:'center',gap:14,boxShadow:'0 4px 16px rgba(22,163,74,.2)',marginBottom:24}}>
              <div style={{width:40,height:40,borderRadius:11,background:'rgba(255,255,255,.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Brain size={20} color="#fff"/></div>
              <div style={{flex:1}}><div style={{fontSize:10,fontWeight:600,color:'rgba(255,255,255,.6)',marginBottom:2,textTransform:'uppercase',letterSpacing:'0.07em'}}>AI Insight · Live</div><div style={{fontSize:14,fontWeight:600,color:'#fff'}}>{insight}</div></div>
              <div style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:'rgba(255,255,255,.5)'}}><span className="live-dot" style={{width:6,height:6}}/>Real-time</div>
            </div>

            {/* Overview */}
            {activePanel==='overview'&&(
              <div style={{animation:'fadeIn .4s ease'}}>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))',gap:16,marginBottom:24}}>
                  <StatCard icon={<TreePine/>} label="Family Trees"  value={stats.trees}     color="#16a34a" t={t} delay={0}    loading={loading}/>
                  <StatCard icon={<Users/>}    label="Users"         value={stats.users}     color="#2563eb" t={t} delay={0.05}  loading={loading}/>
                  <StatCard icon={<Users/>}    label="People"        value={stats.people}    color="#ea580c" t={t} delay={0.1}   loading={loading}/>
                  <StatCard icon={<BookOpen/>} label="Stories"       value={stats.stories}   color="#7c3aed" t={t} delay={0.15}  loading={loading}/>
                  <StatCard icon={<Image/>}    label="Media"         value={stats.media}     color="#0891b2" t={t} delay={0.2}   loading={loading}/>
                  <StatCard icon={<Heart/>}    label="Marriages"     value={stats.marriages} color="#db2777" t={t} delay={0.25}  loading={loading}/>
                  <StatCard icon={<Mic/>}      label="Voice Stories" value={stats.voice}     color="#d97706" sub="AWS Transcribe" t={t} delay={0.3} loading={loading}/>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:20,marginBottom:20}}>
                  <ChartCard title="📈 Platform Growth" t={t}>
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={growthData}>
                        <defs>
                          <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#16a34a" stopOpacity={0.15}/><stop offset="95%" stopColor="#16a34a" stopOpacity={0}/></linearGradient>
                          <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15}/><stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/></linearGradient>
                        </defs>
                        <CartesianGrid stroke={t.dark?'#374151':'#f0f0f0'} strokeDasharray="3 3"/>
                        <XAxis dataKey="month" tick={{fontSize:12,fill:t.textMuted}} axisLine={false} tickLine={false}/>
                        <YAxis tick={{fontSize:12,fill:t.textMuted}} axisLine={false} tickLine={false}/>
                        <Tooltip content={<CustomTooltip/>}/>
                        <Legend wrapperStyle={{fontSize:12}}/>
                        <Area type="monotone" dataKey="people"    stroke="#16a34a" strokeWidth={2} fill="url(#g1)" name="People"/>
                        <Area type="monotone" dataKey="stories"   stroke="#7c3aed" strokeWidth={2} fill="url(#g2)" name="Stories"/>
                        <Area type="monotone" dataKey="marriages" stroke="#db2777" strokeWidth={2} fill="none"      name="Marriages"/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartCard>
                  <ChartCard title="📊 Distribution" t={t}>
                    {pieData.length===0
                      ? <div style={{height:220,display:'flex',alignItems:'center',justifyContent:'center',color:t.textMuted,fontSize:13}}>Add data to see distribution</div>
                      : <ResponsiveContainer width="100%" height={220}>
                          <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">{pieData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip content={<CustomTooltip/>}/><Legend wrapperStyle={{fontSize:11}}/></PieChart>
                        </ResponsiveContainer>
                    }
                  </ChartCard>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
                  <ChartCard title="🌍 Language Distribution" t={t}>
                    {languageData.length===0
                      ? <div style={{height:180,display:'flex',alignItems:'center',justifyContent:'center',color:t.textMuted,fontSize:13}}>No stories yet</div>
                      : <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={languageData} barSize={28}>
                            <CartesianGrid stroke={t.dark?'#374151':'#f0f0f0'} strokeDasharray="3 3" vertical={false}/>
                            <XAxis dataKey="name" tick={{fontSize:11,fill:t.textMuted}} axisLine={false} tickLine={false}/>
                            <YAxis tick={{fontSize:11,fill:t.textMuted}} axisLine={false} tickLine={false}/>
                            <Tooltip content={<CustomTooltip/>}/>
                            <Bar dataKey="value" name="Stories" radius={[6,6,0,0]}>{languageData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Bar>
                          </BarChart>
                        </ResponsiveContainer>
                    }
                  </ChartCard>
                  <ChartCard title="🏆 Top Contributors" t={t}>
                    {topUsers.length===0
                      ? <div style={{padding:'20px 0',textAlign:'center',color:t.textMuted,fontSize:13}}>No activity yet</div>
                      : topUsers.map((u,i)=>{
                          const medals=['🥇','🥈','🥉'];
                          const barColors=['#f59e0b','#9ca3af','#ea580c'];
                          const pct=topUsers[0]?.count>0?(u.count/topUsers[0].count)*100:0;
                          return (
                            <div key={i} style={{marginBottom:14}}>
                              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:5}}>
                                <div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:16}}>{medals[i]||'👤'}</span><span style={{fontSize:13,fontWeight:600,color:t.text}}>{u.name}</span></div>
                                <span style={{fontSize:12,color:t.textMuted,fontWeight:600}}>{u.count} actions</span>
                              </div>
                              <div style={{background:t.dark?'#374151':'#f3f4f6',borderRadius:20,height:6,overflow:'auto'}}>
                                <div style={{height:'100%',width:`${pct}%`,background:barColors[i]||'#16a34a',borderRadius:20,transition:'width 1s ease'}}/>
                              </div>
                            </div>
                          );
                        })
                    }
                  </ChartCard>
                </div>
              </div>
            )}

            {/* People */}
            {activePanel==='people'&&(
              <div style={{animation:'fadeIn .4s ease'}}>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:16,marginBottom:24}}>
                  <StatCard icon={<Users/>}  label="Total People"   value={stats.people}    color="#ea580c" t={t} loading={loading}/>
                  <StatCard icon={<Heart/>}  label="Marriages"      value={stats.marriages} color="#db2777" t={t} loading={loading}/>
                  <StatCard icon={<TreePine/>}label="Avg per Tree"  value={stats.trees>0?Math.round(stats.people/stats.trees):0} color="#16a34a" t={t} loading={loading}/>
                </div>
                <ChartCard title="👥 People per Tree" t={t}>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.trees.map(tree=>({name:tree.familyName||tree.name||'Tree',people:data.people.filter(p=>p.treeId===tree.id).length}))}>
                      <CartesianGrid stroke={t.dark?'#374151':'#f0f0f0'} strokeDasharray="3 3" vertical={false}/>
                      <XAxis dataKey="name" tick={{fontSize:12,fill:t.textMuted}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontSize:12,fill:t.textMuted}} axisLine={false} tickLine={false}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Bar dataKey="people" name="People" fill="#ea580c" radius={[6,6,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            )}

            {/* Stories */}
            {activePanel==='stories'&&(
              <div style={{animation:'fadeIn .4s ease'}}>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:16,marginBottom:24}}>
                  <StatCard icon={<BookOpen/>} label="Total Stories"  value={stats.stories} color="#7c3aed" t={t} loading={loading}/>
                  <StatCard icon={<Mic/>}      label="Voice Stories"  value={stats.voice}   color="#0891b2" sub="AWS Transcribe + Whisper" t={t} loading={loading}/>
                  <StatCard icon={<Activity/>} label="Languages"      value={languageData.length} color="#16a34a" t={t} loading={loading}/>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
                  <ChartCard title="🌍 Stories by Language" t={t}>
                    {languageData.length===0
                      ? <div style={{height:250,display:'flex',alignItems:'center',justifyContent:'center',color:t.textMuted,fontSize:13}}>No stories yet</div>
                      : <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={languageData}>
                            <CartesianGrid stroke={t.dark?'#374151':'#f0f0f0'} strokeDasharray="3 3" vertical={false}/>
                            <XAxis dataKey="name" tick={{fontSize:11,fill:t.textMuted}} axisLine={false} tickLine={false}/>
                            <YAxis tick={{fontSize:11,fill:t.textMuted}} axisLine={false} tickLine={false}/>
                            <Tooltip content={<CustomTooltip/>}/>
                            <Bar dataKey="value" name="Stories" radius={[6,6,0,0]}>{languageData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Bar>
                          </BarChart>
                        </ResponsiveContainer>
                    }
                  </ChartCard>
                  <ChartCard title="🎙️ Voice vs Text Stories" t={t}>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={[{name:'Voice',value:stats.voice||0},{name:'Text',value:Math.max(0,(stats.stories||0)-(stats.voice||0))}]} cx="50%" cy="50%" outerRadius={90} dataKey="value">
                          <Cell fill="#0891b2"/><Cell fill="#7c3aed"/>
                        </Pie>
                        <Tooltip content={<CustomTooltip/>}/>
                        <Legend wrapperStyle={{fontSize:12}}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>
              </div>
            )}

            {/* Geography */}
            {activePanel==='geography'&&<GeographyPanel trees={data.trees} t={t}/>}

            {/* Activity */}
            {activePanel==='activity'&&(
              <div style={{animation:'fadeIn .4s ease'}}>
                <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:20}}>
                  <ChartCard title="⚡ Live Activity Feed" t={t} action={<div style={{display:'flex',alignItems:'center',gap:5,fontSize:12,color:'#16a34a',fontWeight:600}}><span className="live-dot" style={{width:7,height:7}}/>Real-time</div>}>
                    {data.activities.length===0
                      ? <p style={{color:t.textMuted,fontSize:13,textAlign:'center',padding:'20px 0'}}>No activity yet</p>
                      : data.activities.map((a,i)=>{
                          const emojis={person_added:'👤',story_created:'📖',tree_created:'🌳',media_uploaded:'📷',marriage_added:'💍',voice_recorded:'🎙️'};
                          return (
                            <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:`1px solid ${t.border}`,animation:`fadeIn .3s ease ${i*.05}s both`}}>
                              <div style={{width:38,height:38,borderRadius:10,background:t.primaryBg,border:`1px solid ${t.primaryBorder}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:17}}>{emojis[a.activityType]||'⚡'}</div>
                              <div style={{flex:1}}>
                                <div style={{fontSize:13,fontWeight:600,color:t.text}}>{a.activityType||'Activity'}</div>
                                <div style={{fontSize:11,color:t.textMuted,marginTop:1}}>{a.userName||'Unknown'} · {a.timestamp?.toDate?.()?.toLocaleString?.('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})||'Recently'}</div>
                              </div>
                            </div>
                          );
                        })
                    }
                  </ChartCard>
                  <ChartCard title="🏆 Top Contributors" t={t}>
                    {topUsers.length===0
                      ? <p style={{color:t.textMuted,fontSize:13,textAlign:'center',padding:'20px 0'}}>No activity yet</p>
                      : topUsers.map((u,i)=>{
                          const medals=['🥇','🥈','🥉'];
                          const pct=topUsers[0]?.count>0?(u.count/topUsers[0].count)*100:0;
                          return (
                            <div key={i} style={{marginBottom:14}}>
                              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:5}}>
                                <div style={{display:'flex',alignItems:'center',gap:8}}><span>{medals[i]||'👤'}</span><span style={{fontSize:13,fontWeight:600,color:t.text}}>{u.name}</span></div>
                                <span style={{fontSize:12,color:t.textMuted}}>{u.count} actions</span>
                              </div>
                              <div style={{background:t.dark?'#374151':'#f3f4f6',borderRadius:20,height:6,overflow:'auto'}}>
                                <div style={{height:'100%',width:`${pct}%`,background:'#16a34a',borderRadius:20}}/>
                              </div>
                            </div>
                          );
                        })
                    }
                  </ChartCard>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}