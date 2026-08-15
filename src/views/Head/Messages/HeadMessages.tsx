import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Send, MessageSquare, Paperclip, Smile, MoreVertical, Users } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { chatboxService, type Conversation, type ChatMessage } from '@/plugins/api';
import {
  connectSocket, disconnectSocket, joinConversation, leaveConversation,
  sendSocketMessage, startTyping, stopTyping,
} from '@/plugins/api';

function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function getConvName(conv: Conversation, myUserId: number): string {
  if (conv.conversation_name) return conv.conversation_name;
  const others = conv.conversation_members.filter(m => m.user_id !== myUserId);
  if (others.length === 0) return 'Bạn';
  if (others.length === 1) return others[0].users?.full_name || others[0].users?.username || 'Unknown';
  return `Nhóm (${others.length + 1} thành viên)`;
}

export function HeadMessages() {
  const { user } = useAuth();
  const myUserId = (user as any)?.id || (user as any)?.userId;
  const userRole = user?.role || 'head';

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

  // ─── Socket.IO ───────────────────────────────────────────────────────────
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
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setConversations(prev => prev.map(c =>
        c.id === msg.conversation_id ? { ...c, last_message_at: msg.created_at } : c
      ));
    });

    socket.on('userTyping', ({ userId, username }: any) => {
      if (userId !== myUserId)
        setTypingUsers(prev => prev.includes(username) ? prev : [...prev, username]);
    });

    socket.on('userStopTyping', ({ username }: any) => {
      setTypingUsers(prev => prev.filter(u => u !== username));
    });

    return () => disconnectSocket();
  }, [myUserId]);

  // ─── Load conversations ──────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    chatboxService.getConversations()
      .then(data => setConversations(data))
      .catch(err => console.error('Lỗi tải conversations:', err))
      .finally(() => setLoading(false));
  }, []);

  // ─── Chọn conversation ───────────────────────────────────────────────────
  const handleSelectConversation = useCallback(async (conv: Conversation) => {
    if (selectedConv) leaveConversation(selectedConv.id);
    setSelectedConv(conv);
    setMessages([]);
    setNextCursor(null);
    setHasMore(false);
    setTypingUsers([]);
    joinConversation(conv.id);

    setLoadingMessages(true);
    try {
      const result = await chatboxService.getMessages(conv.id);
      setMessages(result.messages);
      setHasMore(result.hasMore);
      setNextCursor(result.nextCursor);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (err) {
      console.error('Lỗi tải messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [selectedConv]);

  // ─── Gửi tin nhắn ───────────────────────────────────────────────────────
  const handleSendMessage = () => {
    if (!message.trim() || !selectedConv) return;
    sendSocketMessage(selectedConv.id, message.trim());

    setMessage('');

    if (isTypingRef.current) {
      stopTyping(selectedConv.id);
      isTypingRef.current = false;
    }
  };

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

  const filteredConvs = conversations.filter(c =>
    getConvName(c, myUserId).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageLayout
      userRole={userRole as any}
      userName={(user as any)?.fullName || 'PGS. TS. Nguyễn Văn A'}
      title="Tin nhắn"
      subtitle="Giao tiếp với giảng viên và sinh viên"
    >
      <div className="h-[calc(100vh-200px)] flex gap-6">
        {/* Conversation List */}
        <Card className="w-80 flex flex-col overflow-hidden">
          <CardContent className="p-4 flex-1 flex flex-col overflow-hidden">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm..."
                className="pl-10"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1">
              {loading ? (
                <div className="text-center py-8 text-sm text-muted-foreground">Đang tải...</div>
              ) : filteredConvs.length === 0 ? (
                <div className="text-center py-8 flex flex-col items-center gap-2">
                  <MessageSquare className="w-10 h-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Chưa có tin nhắn nào</p>
                </div>
              ) : filteredConvs.map(conv => {
                const unread = conv.conversation_members.find(m => m.user_id === myUserId)?.unread_count ?? 0;
                const isSelected = selectedConv?.id === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={getConvName(conv, myUserId)} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="font-medium truncate text-sm">{getConvName(conv, myUserId)}</p>
                          {conv.last_message_at && (
                            <span className={`text-xs shrink-0 ml-1 ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                              {formatTime(conv.last_message_at)}
                            </span>
                          )}
                        </div>
                        {conv.thesis_id && (
                          <p className={`text-xs truncate ${isSelected ? 'text-primary-foreground/80' : 'text-primary'}`}>
                            📚 Nhóm đề tài
                          </p>
                        )}
                      </div>
                      {unread > 0 && (
                        <Badge variant="destructive" className="ml-1 shrink-0">{unread}</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          {!selectedConv ? (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Chọn một cuộc trò chuyện để bắt đầu</p>
              </div>
            </CardContent>
          ) : (
            <>
              {/* Header */}
              <CardContent className="p-4 border-b border-border shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={getConvName(selectedConv, myUserId)} size="md" />
                    <div>
                      <p className="font-medium">{getConvName(selectedConv, myUserId)}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedConv.thesis_id ? '📚 Nhóm đề tài' : `${selectedConv.conversation_members.length} thành viên`}
                      </p>
                      {typingUsers.length > 0 && (
                        <p className="text-xs text-primary italic">{typingUsers.join(', ')} đang nhập...</p>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </div>
              </CardContent>

              {/* Messages */}
              <CardContent className="flex-1 p-4 overflow-y-auto">
                {hasMore && (
                  <div className="text-center mb-4">
                    <button
                      onClick={async () => {
                        if (!nextCursor) return;
                        const result = await chatboxService.getMessages(selectedConv.id, nextCursor);
                        setMessages(prev => [...result.messages, ...prev]);
                        setHasMore(result.hasMore);
                        setNextCursor(result.nextCursor);
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      Tải tin nhắn cũ hơn
                    </button>
                  </div>
                )}

                {loadingMessages ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">Đang tải tin nhắn...</div>
                ) : (
                  <div className="space-y-3">
                    {messages.map(msg => {
                      const isOwn = Number(msg.sender_id) === Number(myUserId);
                      return (
                        <div key={msg.id} className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                          {!isOwn && (
                            <Avatar name={msg.users?.full_name || '?'} size="sm" />
                          )}
                          <div className={`max-w-[70%] ${isOwn ? 'flex flex-col items-end' : ''}`}>
                            {!isOwn && (
                              <p className="text-xs text-muted-foreground mb-1">{msg.users?.full_name}</p>
                            )}
                            <div className={`rounded-2xl px-4 py-2 text-sm ${
                              isOwn
                                ? 'bg-primary text-primary-foreground rounded-br-sm'
                                : 'bg-muted text-foreground rounded-bl-sm'
                            }`}>
                              {msg.content}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{formatTime(msg.created_at)}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </CardContent>

              {/* Input */}
              <CardContent className="p-4 border-t border-border shrink-0">
                <div className="flex gap-2 items-end">
                  <Button variant="ghost" size="icon">
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <div className="flex-1 relative">
                    <textarea
                      value={message}
                      onChange={e => handleTyping(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
                      }}
                      placeholder="Nhập tin nhắn... (Enter để gửi)"
                      className="w-full px-4 py-2 pr-12 bg-muted rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary text-sm max-h-32"
                      rows={1}
                    />
                    <Button variant="ghost" size="icon" className="absolute right-1 bottom-1">
                      <Smile className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button onClick={handleSendMessage} disabled={!message.trim()}>
                    <Send className="w-4 h-4 mr-2" />
                    Gửi
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </PageLayout>
  );
}
