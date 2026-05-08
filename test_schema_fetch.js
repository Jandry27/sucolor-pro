const url = "https://jqcjemhabtmfasuilbcd.supabase.co/rest/v1/ordenes?select=*&limit=1";
const headers = {
  "apikey": "sb_publishable_-9iy9_0VVsy3K2ng5q9kxw_NWW6YviP",
  "Authorization": "Bearer sb_publishable_-9iy9_0VVsy3K2ng5q9kxw_NWW6YviP"
};
fetch(url, { headers }).then(async r => {
  const data = await r.json();
  console.log(Object.keys(data[0] || {}));
});
