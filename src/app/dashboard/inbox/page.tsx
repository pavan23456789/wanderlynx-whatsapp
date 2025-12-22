'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

type Message = {
  id: string;
  direction: 'inbound' | 'outbound';
  content: string;
};

export default function InboxPage() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [contactId, setContactId] = React.useState<string | null>(null);

  async function loadMessages(id: string) {
    setContactId(id);
    const res = await fetch(`/api/conversations/messages?contactId=${id}`);
    const data = await res.json();
    setMessages(data);
  }

  return (
    <div className="flex h-full">
      {/* LEFT */}
      <div className="w-1/4 border-r p-4">
        <Button
          className="w-full"
          onClick={() => loadMessages('10aa3b40-d6b8-4c7a-bf7c-c7ba40dcae81')}
        >
          Test User
        </Button>
      </div>

      {/* RIGHT */}
      <div className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 p-4 space-y-2">
          {messages.map(m => (
            <div
              key={m.id}
              className={`max-w-xs p-3 rounded-lg text-sm ${
                m.direction === 'outbound'
                  ? 'ml-auto bg-blue-500 text-white'
                  : 'mr-auto bg-gray-200'
              }`}
            >
              {m.content}
            </div>
          ))}
        </ScrollArea>

        <div className="p-4 text-xs text-muted-foreground">
          Templates must be used when 24-hour window is closed.
        </div>
      </div>
    </div>
  );
}
