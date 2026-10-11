// Current language access is deliberately key-only. There are no old purchases
// to preserve and no on-site checkout: payment/communication stays on Avito.
if (typeof document !== 'undefined') {
  const style=document.createElement('style');
  style.textContent=`
#loading.access-screen>.access-details,
#loading.access-screen>.owner-preview{display:none!important}
#loading.access-screen .access-intro{margin-bottom:18px}
`;
  document.head.append(style);
}
export function attachPaymentControls(){
  // Intentionally empty. A confirmed purchase receives one personal key.
}
