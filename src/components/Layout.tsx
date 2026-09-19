import type { FC, PropsWithChildren } from "hono/jsx";

type LayoutProps = PropsWithChildren<{
  title?: string;
  description?: string;
  styles?: string[];
}>;

export const Layout: FC<LayoutProps> = ({ title, description, children, styles }) => {
  const pageTitle = title ? `${title} | Kommerce` : "Kommerce - Clothing Store";
  const pageDescription =
    description ??
    "Shop quality clothing for every occasion at Kommerce. Discover the latest styles in tops, bottoms, outerwear and more.";

  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content={pageDescription} />
        <title>{pageTitle}</title>
        <link rel="stylesheet" href="/styles/core.css" />
        {styles?.map((href) => (
          <link rel="stylesheet" href={href} />
        ))}
      </head>
      <body>
        {children}

        {/* Chat Widget */}
        <div id="chat-widget">
          <button id="chat-toggle" aria-label="Open chat assistant">
            <svg
              id="chat-icon-open"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <svg
              id="chat-icon-close"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              style="display:none"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div id="chat-panel" class="chat-panel-hidden">
            <div id="chat-header">
              <span>Shopping Assistant</span>
              <span id="chat-status">Online</span>
            </div>
            <div id="chat-messages">
              <div class="chat-msg bot">
                <div class="chat-bubble">
                  Hi! I'm your shopping assistant. Ask me about products, categories, sizes, or anything else!
                </div>
              </div>
            </div>
            <form id="chat-form">
              <input id="chat-input" type="text" placeholder="Ask about products..." autocomplete="off" />
              <button type="submit" aria-label="Send">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
          </div>
        </div>

        <style
          dangerouslySetInnerHTML={{
            __html: `
          #chat-widget {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 1000;
            font-family: inherit;
          }
          #chat-toggle {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: #1a1a1a;
            color: #fff;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            transition: transform 0.2s, background 0.2s;
            margin-left: auto;
          }
          #chat-toggle:hover { background: #333; transform: scale(1.05); }
          #chat-panel.chat-panel-hidden { display: none !important; }
          #chat-panel {
            position: absolute;
            bottom: 70px;
            right: 0;
            width: 340px;
            height: 480px;
            background: #fff;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.15);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            animation: chatSlideIn 0.2s ease;
          }
          @keyframes chatSlideIn {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
          #chat-header {
            background: #1a1a1a;
            color: #fff;
            padding: 14px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-weight: 600;
            font-size: 14px;
          }
          #chat-status {
            font-size: 11px;
            font-weight: 400;
            opacity: 0.7;
          }
          #chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .chat-msg { display: flex; }
          .chat-msg.bot { justify-content: flex-start; }
          .chat-msg.user { justify-content: flex-end; }
          .chat-bubble {
            max-width: 80%;
            padding: 10px 14px;
            border-radius: 16px;
            font-size: 13px;
            line-height: 1.5;
            white-space: pre-wrap;
          }
          .chat-msg.bot .chat-bubble {
            background: #f2f2f2;
            color: #1a1a1a;
            border-bottom-left-radius: 4px;
          }
          .chat-msg.user .chat-bubble {
            background: #1a1a1a;
            color: #fff;
            border-bottom-right-radius: 4px;
          }
          .chat-bubble a { color: inherit; text-decoration: underline; }
          .chat-typing .chat-bubble {
            display: flex;
            gap: 4px;
            align-items: center;
            padding: 12px 16px;
          }
          .chat-typing .dot {
            width: 6px; height: 6px;
            background: #999;
            border-radius: 50%;
            animation: chatDot 1.2s infinite;
          }
          .chat-typing .dot:nth-child(2) { animation-delay: 0.2s; }
          .chat-typing .dot:nth-child(3) { animation-delay: 0.4s; }
          @keyframes chatDot {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-5px); }
          }
          #chat-form {
            display: flex;
            gap: 8px;
            padding: 12px;
            border-top: 1px solid #eee;
          }
          #chat-input {
            flex: 1;
            border: 1px solid #ddd;
            border-radius: 20px;
            padding: 8px 14px;
            font-size: 13px;
            outline: none;
            font-family: inherit;
          }
          #chat-input:focus { border-color: #1a1a1a; }
          #chat-form button[type="submit"] {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: #1a1a1a;
            color: #fff;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: background 0.2s;
          }
          #chat-form button[type="submit"]:hover { background: #333; }
          #chat-form button[type="submit"]:disabled { background: #aaa; cursor: not-allowed; }
          @media (max-width: 400px) {
            #chat-panel { width: calc(100vw - 32px); right: 0; }
          }
        `,
          }}
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `
          (function() {
            var messages = [];
            var panel = document.getElementById('chat-panel');
            var toggle = document.getElementById('chat-toggle');
            var iconOpen = document.getElementById('chat-icon-open');
            var iconClose = document.getElementById('chat-icon-close');
            var msgsEl = document.getElementById('chat-messages');
            var form = document.getElementById('chat-form');
            var input = document.getElementById('chat-input');
            var submitBtn = form.querySelector('button[type="submit"]');

            toggle.addEventListener('click', function() {
              var open = panel.classList.contains('chat-panel-hidden');
              panel.classList.toggle('chat-panel-hidden', !open);
              iconOpen.style.display = open ? 'none' : '';
              iconClose.style.display = open ? '' : 'none';
              if (open) input.focus();
            });

            function addMsg(role, text) {
              var div = document.createElement('div');
              div.className = 'chat-msg ' + role;
              var bubble = document.createElement('div');
              bubble.className = 'chat-bubble';
              bubble.textContent = text;
              div.appendChild(bubble);
              msgsEl.appendChild(div);
              msgsEl.scrollTop = msgsEl.scrollHeight;
              return div;
            }

            function addTyping() {
              var div = document.createElement('div');
              div.className = 'chat-msg bot chat-typing';
              div.innerHTML = '<div class="chat-bubble"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>';
              msgsEl.appendChild(div);
              msgsEl.scrollTop = msgsEl.scrollHeight;
              return div;
            }

            form.addEventListener('submit', function(e) {
              e.preventDefault();
              var text = input.value.trim();
              if (!text) return;
              input.value = '';
              submitBtn.disabled = true;

              addMsg('user', text);
              messages.push({ role: 'user', content: text });

              var typing = addTyping();

              fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: messages })
              })
              .then(function(r) { return r.json(); })
              .then(function(data) {
                typing.remove();
                var reply = data.reply || 'Sorry, something went wrong.';
                addMsg('bot', reply);
                messages.push({ role: 'assistant', content: reply });
              })
              .catch(function() {
                typing.remove();
                addMsg('bot', 'Sorry, I could not connect. Please try again.');
              })
              .finally(function() {
                submitBtn.disabled = false;
                input.focus();
              });
            });
          })();
        `,
          }}
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `
          function updateCartBadge() {
            fetch('/api/cart/count', { cache: 'no-store' })
              .then(r => r.json())
              .then(({ count }) => {
                const badge = document.getElementById('cart-badge');
                if (!badge) return;
                if (count > 0) {
                  badge.textContent = count;
                  badge.style.display = '';
                } else {
                  badge.style.display = 'none';
                }
              });
          }
          updateCartBadge();
          window.addEventListener('pageshow', (e) => { if (e.persisted) updateCartBadge(); });
        `,
          }}
        />
      </body>
    </html>
  );
};
