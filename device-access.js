// Session tokens are sufficient for one active login per key.
// Remove the retired local device seed without inspecting its contents.
try{localStorage.removeItem('syolana.course.device.v1');}catch{}
window.SyolanaDevice={id:async()=>''};
