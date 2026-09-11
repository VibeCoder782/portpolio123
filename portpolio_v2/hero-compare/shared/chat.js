/* ============================================================
   포트폴리오 안내 챗봇 위젯 (바닐라)
   - 프롬프트·프로필은 서버(api/chat.mjs)에만 있다. 여기서는 대화만 주고받는다.
   - 모든 페이지에서 이 파일 한 줄만 넣으면 붙는다.
   ============================================================ */
(function () {
  'use strict';

  var API = (document.currentScript && document.currentScript.dataset.api) || '/api/chat';
  var MAIL = 'swatsoonmin@gmail.com';
  var KAKAO = 'https://open.kakao.com/o/sarUUgEi';
  var HISTORY_LIMIT = 8;    /* 서버로 보낼 최근 대화 수 — 분당 토큰 한도를 아낀다 */
  var RETRY_MS = 9000;      /* 한도 초과는 잠시 뒤 풀리므로 한 번만 자동 재시도 */

  var GREETING = '안녕하세요. 양순민의 포트폴리오 안내입니다.\n경력이나 사례 중 궁금한 것을 물어보세요.';
  var CHIPS = ['경력을 요약해 주세요', '아르피나 사례가 궁금해요', '어떤 방식으로 일하나요?'];

  var history = [];   /* {role, content} — 화면 표시와 별개로 서버에 보낼 기록 */
  var busy = false;
  var els = {};

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function build() {
    var fab = el('button', 'chat-fab');
    fab.type = 'button';
    fab.id = 'chatFab';
    fab.setAttribute('aria-expanded', 'false');
    fab.setAttribute('aria-controls', 'chatPanel');
    fab.appendChild(el('span', 'chat-fab__dot'));
    fab.appendChild(el('span', null, '무엇이든 물어보세요'));

    var panel = el('section', 'chat-panel');
    panel.id = 'chatPanel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', '포트폴리오 안내 대화');
    panel.setAttribute('aria-hidden', 'true');

    var head = el('div', 'chat-panel__head');
    head.appendChild(el('h2', 'chat-panel__title', '포트폴리오 안내'));
    head.appendChild(el('p', 'chat-panel__note', 'AI가 사이트에 적힌 내용을 바탕으로 답합니다. 더 자세한 이야기는 메일이나 오픈채팅으로.'));
    var close = el('button', 'chat-panel__close', '✕');
    close.type = 'button';
    close.setAttribute('aria-label', '대화 닫기');
    head.appendChild(close);

    var log = el('div', 'chat-log');
    log.setAttribute('role', 'log');
    log.setAttribute('aria-live', 'polite');

    var chips = el('div', 'chat-chips');
    CHIPS.forEach(function (q) {
      var b = el('button', null, q);
      b.type = 'button';
      b.addEventListener('click', function () { send(q); });
      chips.appendChild(b);
    });

    var form = el('form', 'chat-form');
    var input = el('input');
    input.type = 'text';
    input.placeholder = '질문을 입력하세요';
    input.autocomplete = 'off';
    input.setAttribute('aria-label', '질문 입력');
    var submit = el('button', null, '보내기');
    submit.type = 'submit';
    submit.disabled = true;
    form.appendChild(input);
    form.appendChild(submit);

    panel.appendChild(head);
    panel.appendChild(log);
    panel.appendChild(chips);
    panel.appendChild(form);
    document.body.appendChild(panel);
    document.body.appendChild(fab);

    els = { fab: fab, panel: panel, log: log, chips: chips, form: form, input: input, submit: submit };

    fab.addEventListener('click', toggle);
    close.addEventListener('click', function () { toggle(false); });
    input.addEventListener('input', function () { submit.disabled = !input.value.trim(); });
    form.addEventListener('submit', function (e) { e.preventDefault(); send(input.value); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); send(input.value); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && els.fab.getAttribute('aria-expanded') === 'true') toggle(false);
    });

    addMsg('bot', GREETING);
    veil();
  }

  /* 메인 첫 화면에서는 히어로의 안내와 시선이 겹치지 않게 숨겼다가,
     사례 구간으로 넘어오면 조용히 올라온다. 상세 페이지에서는 처음부터 보인다. */
  function veil() {
    if (!document.body.classList.contains('portfolio-main')) return;
    if (window.matchMedia('(max-width: 560px)').matches) els.fab.lastChild.textContent = '물어보기';
    var update = function () {
      var open = els.fab.getAttribute('aria-expanded') === 'true';
      var past = window.scrollY > window.innerHeight * 0.75;
      els.fab.classList.toggle('is-veiled', !open && !past);
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    els.fab.addEventListener('click', update);
    update();
  }

  function toggle(force) {
    var open = typeof force === 'boolean' ? force : els.fab.getAttribute('aria-expanded') !== 'true';
    els.fab.setAttribute('aria-expanded', String(open));
    els.panel.setAttribute('aria-hidden', String(!open));
    var idle = window.matchMedia('(max-width: 560px)').matches && document.body.classList.contains('portfolio-main') ? '물어보기' : '무엇이든 물어보세요';
    els.fab.lastChild.textContent = open ? '대화 닫기' : idle;
    if (open) setTimeout(function () { els.input.focus(); }, 60);
    else els.fab.focus();
  }

  function addMsg(kind, text) {
    var node = el('div', 'chat-msg chat-msg--' + kind, text);
    els.log.appendChild(node);
    els.log.scrollTop = els.log.scrollHeight;
    return node;
  }

  function addError(text) {
    var node = el('div', 'chat-msg chat-msg--error');
    node.appendChild(document.createTextNode(text + ' '));
    var mail = el('a', null, MAIL);
    mail.href = 'mailto:' + MAIL;
    var kakao = el('a', null, '오픈채팅');
    kakao.href = KAKAO;
    kakao.target = '_blank';
    kakao.rel = 'noopener noreferrer';
    node.appendChild(mail);
    node.appendChild(document.createTextNode(' 또는 '));
    node.appendChild(kakao);
    node.appendChild(document.createTextNode('으로 연락 주시면 직접 답변드립니다.'));
    els.log.appendChild(node);
    els.log.scrollTop = els.log.scrollHeight;
  }

  function typing(on) {
    var old = els.log.querySelector('.chat-typing');
    if (old) old.remove();
    if (!on) return;
    var t = el('div', 'chat-typing');
    t.appendChild(el('span'));
    t.appendChild(el('span'));
    t.appendChild(el('span'));
    els.log.appendChild(t);
    els.log.scrollTop = els.log.scrollHeight;
  }

  function send(raw, retried) {
    var q = String(raw || '').trim();
    if (!q || (busy && !retried)) return;

    busy = true;
    els.input.value = '';
    els.submit.disabled = true;
    els.chips.style.display = 'none';
    if (!retried) { addMsg('user', q); }
    history.push({ role: 'user', content: q });
    typing(true);

    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history.slice(-HISTORY_LIMIT) })
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (r) {
        typing(false);
        if (r.ok && r.data.reply) {
          addMsg('bot', r.data.reply);
          history.push({ role: 'assistant', content: r.data.reply });
        } else if (r.data.error === 'busy' && !retried) {
          /* 분당 한도는 잠시 뒤 풀린다 — 사람에게 다시 누르게 시키지 않는다 */
          history.pop();
          var wait = addMsg('bot', '질문이 몰리고 있습니다. 잠시 뒤 다시 답해 드릴게요.');
          setTimeout(function () { wait.remove(); send(q, true); }, RETRY_MS);
          return;
        } else if (r.data.error === 'busy') {
          history.pop();
          addError('지금 질문이 몰려 잠시 답하기 어렵습니다. 잠시 뒤 다시 물어보시거나,');
        } else {
          history.pop();   /* 실패한 질문은 기록에서 빼 다음 대화가 어긋나지 않게 */
          addError('지금은 답변을 가져오지 못했습니다.');
        }
      })
      .catch(function () {
        typing(false);
        history.pop();
        addError('연결이 원활하지 않습니다.');
      })
      .then(function () {
        busy = false;
        els.submit.disabled = !els.input.value.trim();
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
