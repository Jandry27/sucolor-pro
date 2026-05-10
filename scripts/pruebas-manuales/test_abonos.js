const url = "https://jqcjemhabtmfasuilbcd.supabase.co/rest/v1/orden_abonos?select=*";
const headers = {
  "apikey": "sb_publishable_-9iy9_0VVsy3K2ng5q9kxw_NWW6YviP",
  "Authorization": "Bearer sb_publishable_-9iy9_0VVsy3K2ng5q9kxw_NWW6YviP"
};
fetch(url, { headers }).then(async r => {
  console.log(r.status);
  console.log(await r.text());
});
