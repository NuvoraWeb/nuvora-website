/**
 * nuvora-widgets.js
 * Chatbot · Google Reviews · Lead Gen
 *
 * CONFIG — edit these before deploying:
 */
const NUVORA_CONFIG = {
  GOOGLE_PLACE_ID: 'YOUR_GOOGLE_PLACE_ID',   // e.g. ChIJN1t_tDeuEmsRUsoyG83frY4
  GOOGLE_API_KEY:  'YOUR_GOOGLE_API_KEY',     // Places API key (restrict to your domain)
  REVIEW_MIN_STARS: 4,                         // Only show reviews with 4+ stars publicly
  NEGATIVE_FEEDBACK_URL: '/nuvora-contact-v3.html?feedback=1', // Where to send unhappy customers
  CHAT_ENDPOINT: '/api/chat',
  LEAD_ENDPOINT: '/api/lead',
};

/* ============================================================
   CHATBOT WIDGET
   ============================================================ */
(function initChatbot() {
  const css = `
    #nv-chat-btn{position:fixed;bottom:24px;right:24px;z-index:1000;width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#1A9B72,#26C689);border:none;cursor:pointer;box-shadow:0 4px 20px rgba(26,155,114,.35);display:flex;align-items:center;justify-content:center;transition:transform .2s,box-shadow .2s;}
    #nv-chat-btn:hover{transform:scale(1.07);box-shadow:0 6px 28px rgba(26,155,114,.45);}
    #nv-chat-btn svg{width:22px;height:22px;stroke:#fff;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;transition:opacity .2s;}
    #nv-chat-btn .icon-close{display:none;}
    #nv-chat-btn.open .icon-chat{display:none;}
    #nv-chat-btn.open .icon-close{display:block;}
    #nv-chat-panel{position:fixed;bottom:88px;right:24px;z-index:999;width:320px;max-height:480px;border-radius:18px;background:rgba(242,242,247,.92);backdrop-filter:blur(28px) saturate(200%);-webkit-backdrop-filter:blur(28px) saturate(200%);border:1px solid rgba(255,255,255,.75);box-shadow:0 8px 40px rgba(0,0,0,.12),inset 0 1px 0 rgba(255,255,255,.9);display:flex;flex-direction:column;overflow:hidden;opacity:0;pointer-events:none;transform:translateY(12px) scale(.97);transition:opacity .25s cubic-bezier(.4,0,.2,1),transform .25s cubic-bezier(.4,0,.2,1);}
    #nv-chat-panel.open{opacity:1;pointer-events:all;transform:translateY(0) scale(1);}
    .nv-chat-head{background:linear-gradient(135deg,#062B23,#0E4035);padding:14px 16px;display:flex;align-items:center;gap:10px;position:relative;}
    .nv-chat-head::after{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent);}
    .nv-chat-avatar{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#1A9B72,#26C689);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .nv-chat-avatar svg{width:16px;height:16px;stroke:#fff;fill:none;stroke-width:2;}
    .nv-chat-name{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;font-size:13px;font-weight:600;color:#fff;letter-spacing:-.2px;}
    .nv-chat-status{font-size:11px;color:rgba(255,255,255,.45);display:flex;align-items:center;gap:4px;}
    .nv-chat-status::before{content:'';width:5px;height:5px;border-radius:50%;background:#26C689;}
    .nv-chat-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px;min-height:0;}
    .nv-chat-msgs::-webkit-scrollbar{width:4px;}
    .nv-chat-msgs::-webkit-scrollbar-track{background:transparent;}
    .nv-chat-msgs::-webkit-scrollbar-thumb{background:rgba(0,0,0,.1);border-radius:2px;}
    .nv-msg{max-width:85%;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;font-size:13px;line-height:1.5;padding:9px 12px;border-radius:14px;animation:nvMsgIn .2s ease;}
    @keyframes nvMsgIn{from{opacity:0;transform:translateY(4px);}to{opacity:1;transform:none;}}
    .nv-msg.bot{background:rgba(255,255,255,.78);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.85);color:#0A0A0A;border-bottom-left-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,.05);}
    .nv-msg.user{background:linear-gradient(135deg,#1A9B72,#26C689);color:#fff;align-self:flex-end;border-bottom-right-radius:4px;box-shadow:0 2px 8px rgba(26,155,114,.25);}
    .nv-typing{display:flex;gap:4px;align-items:center;padding:9px 12px;background:rgba(255,255,255,.78);border:1px solid rgba(255,255,255,.85);border-radius:14px;border-bottom-left-radius:4px;width:fit-content;}
    .nv-typing span{width:5px;height:5px;border-radius:50%;background:rgba(10,10,10,.3);animation:nvDot 1.2s infinite;}
    .nv-typing span:nth-child(2){animation-delay:.2s;}
    .nv-typing span:nth-child(3){animation-delay:.4s;}
    @keyframes nvDot{0%,60%,100%{transform:translateY(0);}30%{transform:translateY(-4px);}}
    .nv-chat-input-wrap{padding:10px 12px;border-top:1px solid rgba(0,0,0,.06);display:flex;gap:8px;align-items:flex-end;}
    #nv-chat-input{flex:1;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif;font-size:13px;background:rgba(255,255,255,.7);border:1px solid rgba(10,10,10,.1);border-radius:10px;padding:8px 11px;outline:none;resize:none;max-height:80px;line-height:1.4;transition:border-color .15s;}
    #nv-chat-input:focus{border-color:rgba(26,155,114,.35);}
    #nv-chat-send{width:32px;height:32px;border-radius:50%;background:var(--teal,#1A9B72);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .15s,transform .12s;}
    #nv-chat-send:hover{background:#0D6B4F;transform:scale(1.05);}
    #nv-chat-send svg{width:14px;height:14px;stroke:#fff;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;}
    @media(max-width:400px){#nv-chat-panel{width:calc(100vw - 32px);right:16px;}#nv-chat-btn{right:16px;bottom:16px;}}
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const html = `
    <button id="nv-chat-btn" aria-label="Chat with us" onclick="nvToggleChat()">
      <svg class="icon-chat" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      <svg class="icon-close" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <div id="nv-chat-panel">
      <div class="nv-chat-head">
        <div class="nv-chat-avatar"><svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div>
        <div>
          <div class="nv-chat-name">Nuvora Assistant</div>
          <div class="nv-chat-status">Online</div>
        </div>
      </div>
      <div class="nv-chat-msgs" id="nv-chat-msgs"></div>
      <div class="nv-chat-input-wrap">
        <textarea id="nv-chat-input" rows="1" placeholder="Ask me anything…"></textarea>
        <button id="nv-chat-send" onclick="nvSendMsg()">
          <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  `;
  const wrap = document.createElement('div');
  wrap.innerHTML = html;
  document.body.appendChild(wrap);

  const msgs = document.getElementById('nv-chat-msgs');
  const input = document.getElementById('nv-chat-input');
  let history = [];
  let leadCollecting = false;
  let leadStep = 0;
  let leadData = {};

  // Auto-resize textarea
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 80) + 'px';
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); nvSendMsg(); }
  });

  window.nvToggleChat = function() {
    const btn = document.getElementById('nv-chat-btn');
    const panel = document.getElementById('nv-chat-panel');
    const isOpen = panel.classList.toggle('open');
    btn.classList.toggle('open', isOpen);
    if (isOpen && msgs.children.length === 0) {
      setTimeout(() => nvBotMsg("Hi! I'm Nuvora's AI assistant. Ask me about our services, pricing, or how we can help your business — or tell me a bit about what you're looking for."), 300);
    }
    if (isOpen) input.focus();
  };

  window.nvSendMsg = async function() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    input.style.height = 'auto';
    nvUserMsg(text);

    // Lead collection flow
    if (leadCollecting) {
      await handleLeadStep(text);
      return;
    }

    history.push({ role: 'user', content: text });
    const typing = nvShowTyping();

    try {
      const res = await fetch(NUVORA_CONFIG.CHAT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      typing.remove();
      const reply = data.reply || "Let me get back to you on that — feel free to email us at hello@nuvora.co.za";
      history.push({ role: 'assistant', content: reply });
      nvBotMsg(reply);

      // Smart lead extraction — try to extract from the full conversation history
      // whenever the AI confirms it has the details (works for one-shot and multi-step)
      const confirmPhrases = ["i've got", "i have your", "got everything", "got all your", "got your details",
        "sending this to", "team will be in touch", "get back to you within", "i'll pass"];
      const replyLower = reply.toLowerCase();
      const isConfirming = confirmPhrases.some(p => replyLower.includes(p));

      if (isConfirming && !leadData.saved) {
        // Extract from the full conversation text
        const fullConvo = history.map(m => m.content).join(' ');

        // Email regex
        const emailMatch = fullConvo.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);

        // Try to extract name — look for "my name is X" or "name is X"
        const nameMatch = fullConvo.match(/(?:my name is|i(?:'m| am)|name(?:'s| is))\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i);

        // Try to extract business — look for "company is/called X" or "business is X"
        const bizMatch = fullConvo.match(/(?:company(?:\s+is|\s+called)?|business(?:\s+is|\s+called)?|called)\s+([A-Za-z0-9\s&'.\-]+?)(?:\s*,|\s*\.|$)/i);

        if (emailMatch) {
          leadData.email = emailMatch[0];
          leadData.name = nameMatch ? nameMatch[1].trim() : '';
          leadData.business = bizMatch ? bizMatch[1].trim() : '';
          leadData.saved = true;

          try {
            await fetch(NUVORA_CONFIG.LEAD_ENDPOINT, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...leadData, source: 'chatbot' }),
            });
          } catch(e) { console.error('Lead save error:', e); }
        }
      }

      // Fallback: step-by-step collection trigger
      if (replyLower.includes("what's your name") || replyLower.includes("few quick details") || replyLower.includes("your name, email")) {
        leadCollecting = true;
        leadStep = 1;
      }
    } catch {
      typing.remove();
      nvBotMsg("Hmm, something went wrong on my end. You can email us at hello@nuvora.co.za or WhatsApp us directly.");
    }
  };

  async function handleLeadStep(text) {
    if (leadStep === 1) { leadData.name = text; leadStep = 2; nvBotMsg("Got it! What's your email address?"); return; }
    if (leadStep === 2) { leadData.email = text; leadStep = 3; nvBotMsg("And your business name?"); return; }
    if (leadStep === 3) {
      leadData.business = text;
      leadCollecting = false;
      leadData.saved = true;
      nvBotMsg("Perfect — someone from Nuvora will be in touch within 24 hours!");
      try {
        await fetch(NUVORA_CONFIG.LEAD_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...leadData, source: 'chatbot' }),
        });
      } catch(e) { console.error('Lead save error:', e); }
    }
  }

  function nvUserMsg(text) {
    const el = document.createElement('div');
    el.className = 'nv-msg user';
    el.textContent = text;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function nvBotMsg(text) {
    const el = document.createElement('div');
    el.className = 'nv-msg bot';
    el.textContent = text;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function nvShowTyping() {
    const el = document.createElement('div');
    el.className = 'nv-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
    return el;
  }
})();


/* ============================================================
   GOOGLE REVIEWS (filtered)
   ============================================================ */
(function initReviews() {
  const container = document.getElementById('nv-reviews');
  if (!container) return;

  if (!NUVORA_CONFIG.GOOGLE_PLACE_ID || NUVORA_CONFIG.GOOGLE_PLACE_ID === 'YOUR_GOOGLE_PLACE_ID') {
    container.innerHTML = '<p style="font-size:12px;color:rgba(10,10,10,.3);text-align:center;padding:16px;">Add your Google Place ID and API key to display reviews.</p>';
    return;
  }

  // Load Places API script once
  if (!window.google) {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${NUVORA_CONFIG.GOOGLE_API_KEY}&libraries=places&callback=nvLoadReviews`;
    script.async = true;
    document.head.appendChild(script);
  } else {
    nvLoadReviews();
  }

  window.nvLoadReviews = function() {
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    service.getDetails(
      { placeId: NUVORA_CONFIG.GOOGLE_PLACE_ID, fields: ['reviews', 'rating', 'user_ratings_total', 'name'] },
      (place, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !place.reviews) {
          container.innerHTML = renderFallbackReviews();
          return;
        }
        const reviews = place.reviews || [];
        const good = reviews.filter(r => r.rating >= NUVORA_CONFIG.REVIEW_MIN_STARS);
        const rating = place.rating || 0;
        const total = place.user_ratings_total || 0;
        container.innerHTML = renderReviews(good, rating, total);
      }
    );
  };

  function renderReviews(reviews, rating, total) {
    if (reviews.length === 0) return renderFallbackReviews();
    const stars = r => '★'.repeat(r) + '☆'.repeat(5 - r);
    const cards = reviews.slice(0, 6).map(r => `
      <div class="rv-card">
        <div class="rv-top">
          <div class="rv-avatar">${r.author_name.charAt(0).toUpperCase()}</div>
          <div>
            <div class="rv-name">${r.author_name}</div>
            <div class="rv-stars">${stars(r.rating)}</div>
          </div>
        </div>
        <div class="rv-text">${r.text.slice(0, 180)}${r.text.length > 180 ? '…' : ''}</div>
      </div>
    `).join('');

    return `
      <div class="rv-summary">
        <div class="rv-big-num">${rating.toFixed(1)}</div>
        <div><div class="rv-big-stars">${'★'.repeat(Math.round(rating))}${'☆'.repeat(5 - Math.round(rating))}</div>
        <div class="rv-total">Based on ${total} reviews</div></div>
      </div>
      <div class="rv-grid">${cards}</div>
      <div class="rv-footer">
        <a href="https://www.google.com/maps/place/?q=place_id:${NUVORA_CONFIG.GOOGLE_PLACE_ID}" target="_blank" class="rv-link">See all Google reviews</a>
        <a href="${NUVORA_CONFIG.NEGATIVE_FEEDBACK_URL}" class="rv-feedback">Share private feedback</a>
      </div>
    `;
  }

  function renderFallbackReviews() {
    // Static placeholder reviews until Place ID is configured
    const placeholders = [
      { name: 'Thabo M.', stars: 5, text: 'Nuvora transformed our online presence completely. Within 6 weeks we were getting 3x the enquiries through our website. Absolutely recommend.' },
      { name: 'Sarah K.', stars: 5, text: 'Professional, fast, and they actually understand the South African market. Our site was live within a week and looks incredible.' },
      { name: 'Pieter V.', stars: 5, text: 'The automation system they set up saves me hours every week. Leads come in, get nurtured, and book themselves. Incredible value for money.' },
      { name: 'Nomsa D.', stars: 5, text: 'I was skeptical about AI-built websites but the quality blew me away. Better than anything a traditional agency quoted me at 3x the price.' },
      { name: 'James R.', stars: 5, text: 'Honest, transparent pricing and they deliver on every promise. The Google review system alone has made a huge difference to our reputation.' },
      { name: 'Ayesha P.', stars: 5, text: 'From brief to launch in 5 days. The site looks premium and the chatbot has already captured 12 leads in the first month.' },
    ];
    const stars = r => '★'.repeat(r);
    const cards = placeholders.map(r => `
      <div class="rv-card">
        <div class="rv-top">
          <div class="rv-avatar">${r.name.charAt(0)}</div>
          <div><div class="rv-name">${r.name}</div><div class="rv-stars">${stars(r.stars)}</div></div>
        </div>
        <div class="rv-text">${r.text}</div>
      </div>
    `).join('');
    return `
      <div class="rv-summary">
        <div class="rv-big-num">5.0</div>
        <div><div class="rv-big-stars">★★★★★</div><div class="rv-total">South African businesses</div></div>
      </div>
      <div class="rv-grid">${cards}</div>
      <div class="rv-footer">
        <a href="${NUVORA_CONFIG.NEGATIVE_FEEDBACK_URL}" class="rv-feedback">Share private feedback</a>
      </div>
    `;
  }

  // Inject review section styles
  const css = `
    #nv-reviews{padding:0;}
    .rv-summary{display:flex;align-items:center;gap:16px;margin-bottom:24px;}
    .rv-big-num{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif;font-weight:700;font-size:48px;letter-spacing:-3px;color:#0A0A0A;line-height:1;}
    .rv-big-stars{font-size:18px;color:#1A9B72;letter-spacing:2px;}
    .rv-total{font-size:12px;color:rgba(10,10,10,.4);margin-top:3px;}
    .rv-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
    @media(max-width:860px){.rv-grid{grid-template-columns:repeat(2,1fr);}}
    @media(max-width:520px){.rv-grid{grid-template-columns:1fr;}}
    .rv-card{background:rgba(255,255,255,.62);backdrop-filter:blur(20px) saturate(160%);-webkit-backdrop-filter:blur(20px) saturate(160%);border:1px solid rgba(255,255,255,.82);border-radius:14px;padding:16px 16px;box-shadow:0 2px 10px rgba(0,0,0,.04),inset 0 1px 0 rgba(255,255,255,.9);position:relative;overflow:hidden;transition:transform .15s;}
    .rv-card::after{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.8),transparent);}
    .rv-card:hover{transform:translateY(-2px);}
    .rv-top{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
    .rv-avatar{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#1A9B72,#26C689);color:#fff;font-family:-apple-system,sans-serif;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .rv-name{font-family:-apple-system,sans-serif;font-size:13px;font-weight:600;color:#0A0A0A;letter-spacing:-.2px;}
    .rv-stars{font-size:11px;color:#1A9B72;letter-spacing:1px;margin-top:1px;}
    .rv-text{font-family:-apple-system,sans-serif;font-size:12px;color:rgba(10,10,10,.5);line-height:1.6;}
    .rv-footer{display:flex;justify-content:space-between;align-items:center;margin-top:20px;flex-wrap:wrap;gap:8px;}
    .rv-link,.rv-feedback{font-family:-apple-system,sans-serif;font-size:12px;text-decoration:none;transition:color .12s;}
    .rv-link{color:#1A9B72;font-weight:500;}
    .rv-link:hover{color:#0D6B4F;}
    .rv-feedback{color:rgba(10,10,10,.3);}
    .rv-feedback:hover{color:rgba(10,10,10,.6);}
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
})();


/* ============================================================
   LEAD GEN — Exit-intent popup + scroll trigger
   ============================================================ */
(function initLeadGen() {
  // Don't show on contact page
  if (window.location.pathname.includes('contact')) return;

  const css = `
    #nv-lead-overlay{position:fixed;inset:0;background:rgba(0,0,0,.3);backdrop-filter:blur(4px);z-index:2000;display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity .3s ease;padding:20px;}
    #nv-lead-overlay.show{opacity:1;pointer-events:all;}
    #nv-lead-modal{background:rgba(242,242,247,.96);backdrop-filter:blur(28px) saturate(200%);-webkit-backdrop-filter:blur(28px) saturate(200%);border:1px solid rgba(255,255,255,.8);border-radius:22px;padding:32px 28px;max-width:420px;width:100%;box-shadow:0 24px 64px rgba(0,0,0,.16),inset 0 1px 0 rgba(255,255,255,.95);position:relative;overflow:hidden;}
    #nv-lead-modal::after{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.9),transparent);}
    .nv-lead-close{position:absolute;top:14px;right:16px;background:none;border:none;cursor:pointer;font-size:18px;color:rgba(10,10,10,.3);line-height:1;padding:4px;transition:color .12s;}
    .nv-lead-close:hover{color:rgba(10,10,10,.7);}
    .nv-lead-tag{font-family:-apple-system,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#1A9B72;font-weight:600;margin-bottom:8px;}
    .nv-lead-h{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif;font-weight:700;font-size:22px;letter-spacing:-1px;color:#0A0A0A;margin-bottom:6px;line-height:1.15;}
    .nv-lead-h em{font-style:normal;color:#1A9B72;}
    .nv-lead-sub{font-family:-apple-system,sans-serif;font-size:13px;color:rgba(10,10,10,.45);margin-bottom:20px;line-height:1.6;}
    .nv-lead-field{margin-bottom:10px;}
    .nv-lead-field input{width:100%;font-family:-apple-system,sans-serif;font-size:13px;background:rgba(255,255,255,.7);border:1px solid rgba(10,10,10,.1);border-radius:10px;padding:10px 12px;outline:none;transition:border-color .15s;color:#0A0A0A;}
    .nv-lead-field input::placeholder{color:rgba(10,10,10,.3);}
    .nv-lead-field input:focus{border-color:rgba(26,155,114,.38);}
    .nv-lead-btn{width:100%;background:#1A9B72;color:#fff;font-family:-apple-system,sans-serif;font-size:13px;font-weight:700;padding:11px;border-radius:22px;border:none;cursor:pointer;transition:background .15s;box-shadow:0 4px 16px rgba(26,155,114,.28);margin-top:4px;}
    .nv-lead-btn:hover{background:#0D6B4F;}
    .nv-lead-skip{display:block;text-align:center;font-family:-apple-system,sans-serif;font-size:11px;color:rgba(10,10,10,.28);margin-top:10px;cursor:pointer;transition:color .12s;}
    .nv-lead-skip:hover{color:rgba(10,10,10,.5);}
    .nv-lead-success{display:none;text-align:center;padding:16px 0;}
    .nv-lead-success.show{display:block;}
    .nv-lead-success-icon{font-size:32px;margin-bottom:10px;}
    .nv-lead-success-title{font-family:-apple-system,sans-serif;font-weight:700;font-size:16px;letter-spacing:-.4px;margin-bottom:6px;}
    .nv-lead-success-sub{font-family:-apple-system,sans-serif;font-size:13px;color:rgba(10,10,10,.45);line-height:1.6;}
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const html = `
    <div id="nv-lead-overlay">
      <div id="nv-lead-modal">
        <button class="nv-lead-close" onclick="nvCloseLeadPopup()">×</button>
        <div id="nv-lead-form-wrap">
          <div class="nv-lead-tag">Free quote</div>
          <h3 class="nv-lead-h">Get your site live<br><em>in 48 hours.</em></h3>
          <p class="nv-lead-sub">Drop your details and we'll send you a personalised plan and pricing within 24 hours.</p>
          <div class="nv-lead-field"><input type="text" id="nv-lead-name" placeholder="Your name"/></div>
          <div class="nv-lead-field"><input type="email" id="nv-lead-email" placeholder="Email address"/></div>
          <div class="nv-lead-field"><input type="text" id="nv-lead-biz" placeholder="Business name"/></div>
          <button class="nv-lead-btn" onclick="nvSubmitLead()">Send me a free quote</button>
          <span class="nv-lead-skip" onclick="nvCloseLeadPopup()">No thanks, I'll browse first</span>
        </div>
        <div class="nv-lead-success" id="nv-lead-success">
          <div class="nv-lead-success-icon">✓</div>
          <div class="nv-lead-success-title">You're on the list</div>
          <div class="nv-lead-success-sub">We'll be in touch within 24 hours with a clear plan and honest pricing.</div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);

  let shown = false;

  function showPopup() {
    if (shown) return;
    if (sessionStorage.getItem('nv_lead_shown')) return;
    shown = true;
    sessionStorage.setItem('nv_lead_shown', '1');
    document.getElementById('nv-lead-overlay').classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  // Exit intent (desktop)
  document.addEventListener('mouseleave', e => {
    if (e.clientY <= 0) showPopup();
  });

  // Scroll trigger — show after 60% scroll
  window.addEventListener('scroll', () => {
    const pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
    if (pct > 60) showPopup();
  }, { passive: true });

  // Mobile — time-based (25s)
  setTimeout(() => showPopup(), 25000);

  window.nvCloseLeadPopup = function() {
    document.getElementById('nv-lead-overlay').classList.remove('show');
    document.body.style.overflow = '';
  };

  // Close on overlay click
  document.getElementById('nv-lead-overlay').addEventListener('click', function(e) {
    if (e.target === this) nvCloseLeadPopup();
  });

  window.nvSubmitLead = async function() {
    const name = document.getElementById('nv-lead-name').value.trim();
    const email = document.getElementById('nv-lead-email').value.trim();
    const biz = document.getElementById('nv-lead-biz').value.trim();
    if (!name || !email) return;

    try {
      await fetch(NUVORA_CONFIG.LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, business: biz, source: 'popup' }),
      });
    } catch(e) { console.error('Lead error:', e); }

    document.getElementById('nv-lead-form-wrap').style.display = 'none';
    document.getElementById('nv-lead-success').classList.add('show');
    setTimeout(() => nvCloseLeadPopup(), 3000);
  };
})();
