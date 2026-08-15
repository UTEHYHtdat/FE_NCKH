import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Send, Paperclip, Smile, MoreVertical, Users } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import { useAuth } from '@/contexts/AuthContext';
import { chatboxService, type Conversation, type ChatMessage } from '@/plugins/api';
import {
  connectSocket, disconnectSocket, joinConversation, leaveConversation,
  sendSocketMessage, startTyping, stopTyping, getSocket,
} from '@/plugins/api';

// Helper format thời gian tin nhắn
function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

// Helper lấy tên hiển thị của conversation (với người dùng hiện tại)
function getConvName(conv: Conversation, myUserId: number): string {
  if (conv.conversation_name) return conv.conversation_name;
  const others = conv.conversation_members.filter(m => m.user_id !== myUserId);
  if (others.length === 0) return 'Bạn';
  if (others.length === 1) return others[0].users?.full_name || others[0].users?.username || 'Unknown';
  return `Nhóm (${others.length + 1} thành viên)`;
}

function getConvAvatar(conv: Conversation, myUserId: number): string {
  const others = conv.conversation_members.filter(m => m.user_id !== myUserId);
  return others[0]?.users?.full_name || 'G';
}

export function Messages() {
  const { user } = useAuth();
  const myUserId = (user as any)?.id || (user as any)?.userId;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [search, setSearch] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // ─── Khởi tạo Socket.IO ───────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = connectSocket(token);

    socket.on('newMessage', (rawMsg: any) => {
      const msg: ChatMessage = {
        id: rawMsg.id,
        conversation_id: rawMsg.conversationId || rawMsg.conversation_id,
        sender_id: rawMsg.sender?.id || rawMsg.sender_id,
        content: rawMsg.content,
        created_at: rawMsg.createdAt || rawMsg.created_at,
        users: rawMsg.sender || rawMsg.users,
      };

      setMessages(prev => {
        // Tránh duplicate
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      scrollToBottom();

      // Cập nhật preview tin nhắn cuối trong conversation list
      setConversations(prev => prev.map(c =>
        c.id === msg.conversation_id
          ? { ...c, last_message_at: msg.created_at }
          : c
      ));
    });

    socket.on('userTyping', ({ userId, username }: { userId: number; username: string }) => {
      if (userId !== myUserId) {
        setTypingUsers(prev => prev.includes(username) ? prev : [...prev, username]);
      }
    });

    socket.on('userStopTyping', ({ userId, username }: { userId: number; username: string }) => {
      setTypingUsers(prev => prev.filter(u => u !== username));
    });

    return () => {
      disconnectSocket();
    };
  }, [myUserId]);

  // ─── Load danh sách conversations ─────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    chatboxService.getConversations()
      .then(data => setConversations(data))
      .catch(err => console.error('Lỗi tải conversations:', err))
      .finally(() => setLoading(false));
  }, []);

  // ─── Khi chọn conversation ────────────────────────────────────────────────
  const handleSelectConversation = useCallback(async (conv: Conversation) => {
    // Rời phòng cũ
    if (selectedConv) leaveConversation(selectedConv.id);

    setSelectedConv(conv);
    setMessages([]);
    setNextCursor(null);
    setHasMore(false);
    setTypingUsers([]);

    // Tham gia phòng mới
    joinConversation(conv.id);

    // Load messages
    setLoadingMessages(true);
    try {
      const result = await chatboxService.getMessages(conv.id);
      setMessages(result.messages);
      setHasMore(result.hasMore);
      setNextCursor(result.nextCursor);
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error('Lỗi tải messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [selectedConv]);

  // ─── Load thêm tin nhắn cũ (infinite scroll) ─────────────────────────────
  const loadMore = async () => {
    if (!selectedConv || !nextCursor || !hasMore) return;
    try {
      const result = await chatboxService.getMessages(selectedConv.id, nextCursor);
      setMessages(prev => [...result.messages, ...prev]);
      setHasMore(result.hasMore);
      setNextCursor(result.nextCursor);
    } catch (err) {
      console.error('Lỗi load thêm:', err);
    }
  };

  // ─── Gửi tin nhắn ────────────────────────────────────────────────────────
  const handleSend = () => {
    if (!message.trim() || !selectedConv) return;
    sendSocketMessage(selectedConv.id, message.trim());

    setMessage('');

    // Stop typing indicator
    if (isTypingRef.current) {
      stopTyping(selectedConv.id);
      isTypingRef.current = false;
    }
  };

  // ─── Typing indicator ─────────────────────────────────────────────────────
  const handleTyping = (val: string) => {
    setMessage(val);
    if (!selectedConv) return;

    if (!isTypingRef.current) {
      startTyping(selectedConv.id);
      isTypingRef.current = true;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(selectedConv.id);
      isTypingRef.current = false;
    }, 2000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredConvs = conversations.filter(c =>
    getConvName(c, myUserId).toLowerCase().includes(search.toLowerCase())
  );

  // ─── UI ───────────────────────────────────────────────────────────────────
  return (
    <PageLayout userRole={user?.role as any} userName={(user as any)?.fullName || user?.username || ''}>
      <div className="flex h-[calc(100vh-180px)] bg-card rounded-xl shadow-sm overflow-hidden -mt-8">

        {/* Conversation List */}
        <div className="w-80 border-r border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold mb-3">Tin nhắn</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm kiếm cuộc trò chuyện..."
                className="w-full pl-10 pr-3 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">Đang tải...</div>
            ) : filteredConvs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Users className="w-10 h-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Chưa có cuộc trò chuyện nào</p>
              </div>
            ) : filteredConvs.map(conv => {
              const unread = conv.conversation_members.find(m => m.user_id === myUserId)?.unread_count ?? 0;
              return (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={cn(
                    'flex items-center gap-3 p-4 cursor-pointer transition-colors border-b border-border',
                    selectedConv?.id === conv.id ? 'bg-primary/10' : 'hover:bg-muted'
                  )}
                >
                  <Avatar name={getConvAvatar(conv, myUserId)} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="font-medium truncate text-sm">{getConvName(conv, myUserId)}</p>
                      {conv.last_message_at && (
                        <span className="text-xs text-muted-foreground shrink-0 ml-1">
                          {formatTime(conv.last_message_at)}
                        </span>
                      )}
                    </div>
                    {conv.thesis_id && (
                      <p className="text-xs text-primary truncate">📚 Nhóm đề tài</p>
                    )}
                  </div>
                  {unread > 0 && (
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center shrink-0">
                      <span className="text-xs text-white">{unread}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {!selectedConv ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col gap-2">
              <Users className="w-16 h-16" />
              <p>Chọn cuộc trò chuyện để bắt đầu</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={getConvAvatar(selectedConv, myUserId)} size="md" />
                  <div>
                    <h3 className="font-semibold">{getConvName(selectedConv, myUserId)}</h3>
                    {selectedConv.thesis_id && (
                      <p className="text-xs text-primary">Nhóm đề tài</p>
                    )}
                    {typingUsers.length > 0 && (
                      <p className="text-xs text-muted-foreground italic">
                        {typingUsers.join(', ')} đang nhập...
                      </p>
                    )}
                  </div>
                </div>
                <Button variant="icon">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Load more */}
                {hasMore && (
                  <div className="text-center">
                    <button onClick={loadMore} className="text-xs text-primary hover:underline">
                      Tải tin nhắn cũ hơn
                    </button>
                  </div>
                )}

                {loadingMessages ? (
                  <div className="text-center text-sm text-muted-foreground py-8">Đang tải tin nhắn...</div>
                ) : messages.map((msg) => {
                  const isOwn = Number(msg.sender_id) === Number(myUserId);
                  return (
                    <div key={msg.id} className={cn('flex gap-2', isOwn && 'flex-row-reverse')}>
                      {!isOwn && (
                        <Avatar name={msg.users?.full_name || msg.users?.username || '?'} size="sm" />
                      )}
                      <div className={cn('max-w-[70%]', isOwn && 'flex flex-col items-end')}>
                        {!isOwn && (
                          <p className="text-xs text-muted-foreground mb-1">
                            {msg.users?.full_name || msg.users?.username}
                          </p>
                        )}
                        <div className={cn(
                          'px-4 py-2 rounded-2xl text-sm',
                          isOwn
                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                            : 'bg-muted text-foreground rounded-bl-sm'
                        )}>
                          {msg.content}
                        </div>
                        <span className="text-xs text-muted-foreground mt-1">
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border">
                <div className="flex items-end gap-2">
                  <Button variant="icon">
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <div className="flex-1 relative">
                    <textarea
                      value={message}
                      onChange={(e) => handleTyping(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter xuống dòng)"
                      className="w-full px-4 py-2 pr-12 bg-muted rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary max-h-32 text-sm"
                      rows={1}
                    />
                    <Button variant="icon" className="absolute right-2 bottom-2">
                      <Smile className="w-5 h-5" />
                    </Button>
                  </div>
                  <Button onClick={handleSend} disabled={!message.trim()}>
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
