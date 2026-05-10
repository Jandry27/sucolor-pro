fetch("https://jqcjemhabtmfasuilbcd.supabase.co/rest/v1/ordenes?select=*", {
  headers: {
    "apikey": "sb_publishable_-9iy9_0VVsy3K2ng5q9kxw_NWW6YviP",
    "Authorization": `Bearer sb_publishable_-9iy9_0VVsy3K2ng5q9kxw_NWW6YviP`
  }
}).then(res => res.json()).then(console.log);
