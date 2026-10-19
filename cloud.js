window.escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
window.cloudAPI = async (path, options = {}) => {
  const response = await fetch('/api' + path, {credentials:'same-origin', ...options, headers:{'Content-Type':'application/json',...options.headers}});
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Không thể kết nối cơ sở dữ liệu');
  return data;
};
// Remove obsolete client-side databases; the cart alone stays in the browser.
for (const key of ['anhem_users_db','anhem_orders','anhem_custom_products','anhem_token']) localStorage.removeItem(key);
