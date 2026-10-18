import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../game/network';
import { sounds } from '../game/audio';
import { Send, X, Terminal } from 'lucide-react';

interface ChatModalProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onClose: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  messages,
  onSendMessage,
  onClose,
}) => {
  const [inputText, setInputText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    sounds.playClick();
    onSendMessage(trimmed);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-between bg-black/60 p-4 font-mono select-none">
      <div className="w-full max-w-xl mx-auto flex-1 flex flex-col justify-end bg-stone-900/95 border-4 border-stone-600 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-3 bg-stone-950 border-b-2 border-stone-700">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Server Chat & Commands</span>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="w-6 h-6 bg-stone-800 hover:bg-stone-700 text-white flex items-center justify-center border border-stone-600 text-xs"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Message Log */}
        <div className="flex-1 p-3 overflow-y-auto space-y-1.5 text-xs max-h-72">
          {messages.length === 0 ? (
            <div className="text-zinc-500 italic text-[11px]">
              Chat history is empty. Type a message or command like /help!
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="leading-relaxed">
                {m.isSystem ? (
                  <span className="text-yellow-400 font-bold">{m.text}</span>
                ) : (
                  <>
                    <span className="text-emerald-400 font-bold">&lt;{m.sender}&gt; </span>
                    <span className="text-zinc-100">{m.text}</span>
                  </>
                )}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick Command Suggestions */}
        <div className="px-3 py-1.5 bg-stone-950/80 border-t border-stone-700 flex gap-2 text-[10px]">
          <button
            onClick={() => setInputText('Hello world!')}
            className="text-zinc-400 hover:text-white underline"
          >
            "Hello"
          </button>
          <button
            onClick={() => setInputText('Check out my build!')}
            className="text-zinc-400 hover:text-white underline"
          >
            "Check my build"
          </button>
          <button
            onClick={() => setInputText('/spawn')}
            className="text-emerald-400 hover:underline"
          >
            /spawn
          </button>
          <button
            onClick={() => setInputText('/help')}
            className="text-sky-400 hover:underline"
          >
            /help
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-stone-950 border-t-2 border-stone-700 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            maxLength={120}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type message or /command... [Enter]"
            className="flex-1 bg-stone-900 border-2 border-stone-700 px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={handleSend}
            className="bg-emerald-600 hover:bg-emerald-500 border-2 border-emerald-400 px-4 py-2 text-white font-bold text-xs flex items-center justify-center gap-1 active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
