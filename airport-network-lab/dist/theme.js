/* Apply the preference before paint; storage may be disabled in private sessions. */
(()=>{
  const key='aeronet-theme';
  let saved=null;
  try{saved=localStorage.getItem(key);}catch{}
  const explicit=saved==='dark'||saved==='light';
  function apply(theme){
    document.documentElement.dataset.theme=theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#101b29':'#f5f7fa');
    const button=document.getElementById('theme-toggle');
    if(button){
      const dark=theme==='dark';
      button.setAttribute('aria-pressed',String(dark));
      button.setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');
      button.querySelector('.theme-icon').textContent=dark?'☀':'☾';
      button.querySelector('.theme-label').textContent=dark?'Light mode':'Dark mode';
    }
  }
  apply(explicit?saved:'dark');
  document.addEventListener('DOMContentLoaded',()=>{
    apply(document.documentElement.dataset.theme);
    document.getElementById('theme-toggle').addEventListener('click',()=>{
      const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';
      apply(theme);
      try{localStorage.setItem(key,theme);}catch{}
    });
  });
})();
