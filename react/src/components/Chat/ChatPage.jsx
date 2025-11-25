import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMessages, sendMessage } from '../../api/messages';
import './ChatPage.css';

const POLLING_INTERVAL = 3000;

const ChatPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const pollingRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const fetchMessages = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setIsLoading(true);
    }
    
    try {
      const response = await getMessages({ limit: 100, offset: 0 });
      setMessages(response.results || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      if (err.response?.status === 401) {
        setError('Сессия истекла. Пожалуйста, войдите снова.');
      } else {
        setError('Не удалось загрузить сообщения');
      }
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMessages(true);
    }
  }, [isAuthenticated, fetchMessages]);

  useEffect(() => {
    if (isAuthenticated && !error) {
      pollingRef.current = setInterval(() => {
        fetchMessages(false);
      }, POLLING_INTERVAL);

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
      };
    }
  }, [isAuthenticated, error, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    const trimmedMessage = newMessage.trim();
    if (!trimmedMessage || isSending) return;

    setIsSending(true);
    
    try {
      const sentMessage = await sendMessage({ content: trimmedMessage });
      setMessages((prev) => [...prev, sentMessage]);
      setNewMessage('');
      setError(null);
    } catch (err) {
      console.error('Error sending message:', err);
      if (err.response?.status === 401) {
        setError('Сессия истекла. Пожалуйста, войдите снова.');
      } else if (err.response?.data?.content) {
        setError(err.response.data.content[0]);
      } else {
        setError('Не удалось отправить сообщение');
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="chat-auth-required" data-easytag="id1-src/components/Chat/ChatPage.jsx">
        <h2>Доступ ограничен</h2>
        <p>Для доступа к чату необходимо войти в систему</p>
        <Link to="/login" className="chat-auth-btn">
          Войти
        </Link>
      </div>
    );
  }

  return (
    <div className="chat-page" data-easytag="id1-src/components/Chat/ChatPage.jsx">
      <header className="chat-header">
        <div className="chat-header-title">
          <div className="chat-header-logo">C</div>
          <h1>Корпоративный чат</h1>
        </div>
        <div className="chat-header-actions">
          <span className="chat-header-user">{user?.username}</span>
          <button 
            className="header-btn header-btn-profile" 
            onClick={handleProfileClick}
          >
            Профиль
          </button>
          <button 
            className="header-btn header-btn-logout" 
            onClick={handleLogout}
          >
            Выйти
          </button>
        </div>
      </header>

      <div className="chat-messages-container" ref={messagesContainerRef}>
        {isLoading ? (
          <div className="chat-loading">
            <div className="chat-loading-spinner"></div>
            <span>Загрузка сообщений...</span>
          </div>
        ) : error ? (
          <div className="chat-error">
            <p>{error}</p>
            <button 
              className="chat-error-btn" 
              onClick={() => fetchMessages(true)}
            >
              Попробовать снова
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <div className="chat-empty-icon">💬</div>
            <p>Пока нет сообщений. Начните общение!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message-item ${
                message.author?.id === user?.id
                  ? 'message-item-own'
                  : 'message-item-other'
              }`}
            >
              <span className="message-author">
                {message.author?.username || 'Неизвестный'}
              </span>
              <div className="message-bubble">
                <p className="message-content">{message.content}</p>
              </div>
              <span className="message-time">
                {formatTime(message.created_at)}
              </span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <form className="chat-input-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            className="chat-input"
            placeholder="Введите сообщение..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            maxLength={5000}
            disabled={isSending}
          />
          <button
            type="submit"
            className="chat-send-btn"
            disabled={!newMessage.trim() || isSending}
          >
            {isSending ? '...' : '➤'}
            <span>Отправить</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;
