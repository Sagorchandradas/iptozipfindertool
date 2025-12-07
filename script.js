function toggleTheme(){
  document.body.classList.toggle("light");
  document.querySelector(".toggle").textContent =
    document.body.classList.contains("light") ? "🌙 Dark" : "☀️ Light";
}

function validateIP(ip){
  const pattern = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
  return pattern.test(ip);
}

let historyChart = null;
function updateChart(labels, data){
  if(historyChart) historyChart.destroy();
  const ctx = document.getElementById("historyChart").getContext("2d");
  historyChart = new Chart(ctx,{
    type:"bar",
    data:{labels, datasets:[{label:"IP Lookup Frequency", data, backgroundColor:"#4e8cff"}]},
    options:{responsive:true, maintainAspectRatio:false}
  });
}

let map = L.map('map').setView([20,0],2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
let marker = null;
let lookupHistory = [];

async function lookupIP(ip=null){
  const ipInput = document.getElementById("ip");
  const errBox = document.getElementById("err");
  const resultBox = document.getElementById("result");
  const output = document.getElementById("output");
  const tableBody = document.getElementById("table-body");
  const loader = document.getElementById("loader");

  errBox.style.display="none";
  resultBox.style.display="none";
  loader.style.display="block";

  if(!ip) ip = ipInput.value.trim();
  if(!validateIP(ip)){
    loader.style.display="none";
    errBox.textContent="❌ Invalid IP!";
    errBox.style.display="block";
    return;
  }

  const apis = [
    `/.netlify/functions/lookup?ip=${ip}`,
    `https://ipapi.co/${ip}/json/`,
    `https://ipwho.is/${ip}`,
    `http://ip-api.com/json/${ip}?fields=status,country,regionName,city,zip,lat,lon`
  ];

  let data = null;
  for(let url of apis){
    try{
      const res = await fetch(url);
      if(!res.ok) continue;
      const json = await res.json();
      if(json.error || json.status === "fail") continue;
      data = json;
      break;
    }catch(e){ continue; }
  }

  loader.style.display="none";

  if(!data){
    errBox.textContent="⚠️ Data not found";
    errBox.style.display="block";
    return;
  }

  const flag = data.country_code ? `https://flagcdn.com/24x18/${data.country_code.toLowerCase()}.png` : "";
  output.innerHTML=`<b>IP:</b> ${ip}<br>
  <b>Country:</b> ${data.country_name||data.country||""} ${flag ? `<img src="${flag}" alt="flag">`:""}<br>
  <b>State:</b> ${data.region||data.regionName||""}<br>
  <b>City:</b> ${data.city||""}<br>
  <b>ZIP:</b> ${data.postal||data.zip||""}`;
  resultBox.style.display="block";

  const tr = document.createElement("tr");
  tr.style.opacity=0; tr.style.transform="translateY(-15px)";
  tr.innerHTML=`<td>${ip}</td><td>${flag ? `<img class="flag" src="${flag}">` : ""}${data.country_name||data.country||""}</td>
  <td>${data.region||data.regionName||""}</td><td>${data.city||""}</td><td>${data.postal||data.zip||""}</td>`;
  tableBody.prepend(tr);
  setTimeout(()=>{tr.style.opacity=1; tr.style.transform="translateY(0)"; tr.style.transition="all 0.5s ease";},10);
  if(tableBody.children.length>5) tableBody.removeChild(tableBody.lastChild);

  lookupHistory.push(data.country_name||data.country||"Unknown");
  const counts = {};
  lookupHistory.forEach(c=>counts[c]=(counts[c]||0)+1);
  updateChart(Object.keys(counts), Object.values(counts));

  const lat = data.latitude||data.loc?.split(",")[0]||20;
  const lon = data.longitude||data.loc?.split(",")[1]||0;
  if(marker) map.removeLayer(marker);
  marker = L.marker([lat,lon]).addTo(map);
  map.setView([lat,lon],4);
}

async function detectIP(){
  try{const res = await fetch(`/.netlify/functions/lookup`); const data=await res.json(); if(data.ip) lookupIP(data.ip);}catch(e){}
}
window.onload=detectIP;

function copyResult(){navigator.clipboard.writeText(document.getElementById("output").innerText); alert("Copied!");}
function downloadJSON(){const blob=new Blob([document.getElementById("output").innerText],{type:"application/json"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="ip_lookup.json"; a.click(); URL.revokeObjectURL(url);}
