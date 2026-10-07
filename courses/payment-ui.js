// The server decides whether checkout is available and sets every price.
export function attachPaymentControls(host,course,request){
  const section=document.createElement('details');section.className='access-details';
  const summary=document.createElement('summary');summary.textContent='Купить курс с автоматическим доступом';section.append(summary);
  const form=document.createElement('form');form.className='access-form';
  function field(label,type,name){const l=document.createElement('label');l.textContent=label;const i=document.createElement('input');i.type=type;i.name=name;i.required=true;l.append(i);form.append(l);return i;}
  const login=field('Логин','text','username');login.minLength=3;login.maxLength=40;login.autocomplete='username';
  const password=field('Пароль от 12 символов','password','password');password.minLength=12;password.autocomplete='current-password';
  const existingLabel=document.createElement('label'),existing=document.createElement('input');existing.type='checkbox';existingLabel.append(existing,document.createTextNode('У меня уже есть аккаунт Syolana'));form.append(existingLabel);
  const offerLabel=document.createElement('label'),accept=document.createElement('input'),offer=document.createElement('a');accept.type='checkbox';accept.required=true;offer.href='/legal/offer.html';offer.target='_blank';offer.rel='noopener';offer.textContent='условия покупки';offerLabel.append(accept,document.createTextNode('Я прочитал(а) и принимаю '),offer);form.append(offerLabel);
  const privacy=document.createElement('a');privacy.href='/legal/privacy.html';privacy.target='_blank';privacy.rel='noopener';privacy.textContent='Как используются данные аккаунта';form.append(privacy);
  const button=document.createElement('button');button.type='submit';button.className='primary';button.textContent='Перейти к оплате';const status=document.createElement('p');status.className='notice';status.setAttribute('role','status');form.append(button,status);section.append(form);host.append(section);
  form.onsubmit=async e=>{e.preventDefault();button.disabled=true;status.textContent='Готовим заказ…';try{
    const session=await request(existing.checked?'login':'register',{username:login.value,password:password.value,acceptedOffer:accept.checked});password.value='';
    const order=await request('checkout',{},session.csrf);const url=new URL(order.paymentUrl);
    if(url.origin!=='https://auth.robokassa.ru'||url.pathname!=='/Merchant/Index.aspx')throw Error('Адрес оплаты не подтверждён.');
    sessionStorage.setItem('syolana-pending-payment',JSON.stringify({course,invoice:order.invoice}));
    window.top.location.href=url.href;
  }catch(error){status.textContent=error.message;button.disabled=false;}};
}
