// ChatBot 類別
class ChatBot {
    constructor() {
        // ⚠️ 重要：請替換為您的 n8n webhook URL
        this.webhookUrl = 'https://learning.n8n.tw/webhook/chat';
        // 初始化 session ID
        this.sessionId = this.getOrCreateSessionId();
        
        // 創建 ChatBot UI
        this.createChatBotUI();
        
        // DOM 元素
        this.chatbotToggle = document.getElementById('chatbotToggle');
        this.chatbotPanel = document.getElementById('chatbotPanel');
        this.chatbotClose = document.getElementById('chatbotClose');
        this.messagesContainer = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.notificationBadge = document.getElementById('notificationBadge');
        
        // 綁定事件
        this.bindEvents();
        
        // 載入對話歷史
        this.loadChatHistory();
        
        console.log('ChatBot 初始化完成，Session ID:', this.sessionId);
    }
    
    createChatBotUI() {
        // 創建 CSS 樣式
        const style = document.createElement('style');
        style.textContent = `
            .chatbot-widget {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 1000;
            }

            .chatbot-toggle {
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 50%, #6D28D9 100%);
                border: none;
                border-radius: 50%;
                cursor: pointer;
                box-shadow: 0 8px 32px rgba(139, 92, 246, 0.4);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                color: white;
                font-size: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                backdrop-filter: blur(10px);
                border: 2px solid rgba(255, 255, 255, 0.1);
            }

            .chatbot-toggle:hover {
                transform: translateY(-2px) scale(1.05);
                box-shadow: 0 12px 40px rgba(139, 92, 246, 0.5);
                background: linear-gradient(135deg, #9333EA 0%, #8B5CF6 50%, #7C3AED 100%);
            }

            .chatbot-toggle:active {
                transform: translateY(0) scale(0.98);
            }

            .chatbot-panel {
                position: absolute;
                bottom: 80px;
                right: 0;
                width: 350px;
                height: 400px;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.15);
                display: none;
                flex-direction: column;
                overflow: hidden;
                border: 1px solid rgba(139, 92, 246, 0.2);
            }

            .chatbot-panel.active {
                display: flex;
                animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            }

            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(30px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            .chatbot-header {
                background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 50%, #6D28D9 100%);
                color: white;
                padding: 16px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                position: relative;
                overflow: hidden;
            }

            .chatbot-header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
                animation: shine 3s infinite;
            }

            @keyframes shine {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(200%); }
            }

            .chatbot-title {
                font-size: 16px;
                font-weight: 600;
                z-index: 1;
                position: relative;
            }

            .chatbot-close {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                z-index: 1;
                position: relative;
            }

            .chatbot-close:hover {
                background: rgba(255,255,255,0.3);
                transform: scale(1.1);
            }

            .chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 12px;
                background: linear-gradient(180deg, #fafafa 0%, #f5f3ff 100%);
            }

            .message {
                max-width: 80%;
                padding: 12px 16px;
                border-radius: 18px;
                line-height: 1.5;
                word-wrap: break-word;
                font-size: 14px;
                animation: messageSlide 0.3s ease-out;
                position: relative;
            }

            @keyframes messageSlide {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .message.user {
                background: linear-gradient(135deg, #8B5CF6, #7C3AED);
                color: white;
                align-self: flex-end;
                border-bottom-right-radius: 6px;
                box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
            }

            .message.ai {
                background: white;
                color: #374151;
                align-self: flex-start;
                border-bottom-left-radius: 6px;
                border: 1px solid #e5e7eb;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            }

            .message.system {
                background: linear-gradient(135deg, #10B981, #059669);
                color: white;
                align-self: center;
                font-size: 12px;
                max-width: 90%;
                text-align: center;
                box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
            }

            .message.error-message {
                background: linear-gradient(135deg, #EF4444, #DC2626);
                color: white;
                align-self: center;
                font-size: 12px;
                max-width: 90%;
                text-align: center;
                box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
            }

            .typing-indicator {
                display: none;
                align-self: flex-start;
                padding: 12px 16px;
                background: white;
                border-radius: 18px;
                border-bottom-left-radius: 6px;
                border: 1px solid #e5e7eb;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            }

            .typing-dots {
                display: flex;
                gap: 4px;
            }

            .typing-dot {
                width: 6px;
                height: 6px;
                background: #8B5CF6;
                border-radius: 50%;
                animation: typing 1.4s infinite;
            }

            .typing-dot:nth-child(2) {
                animation-delay: 0.2s;
            }

            .typing-dot:nth-child(3) {
                animation-delay: 0.4s;
            }

            @keyframes typing {
                0%, 60%, 100% {
                    transform: scale(1);
                    opacity: 0.5;
                }
                30% {
                    transform: scale(1.2);
                    opacity: 1;
                }
            }

            .chat-input {
                padding: 16px;
                border-top: 1px solid rgba(139, 92, 246, 0.1);
                display: flex;
                gap: 10px;
                background: rgba(255, 255, 255, 0.8);
                backdrop-filter: blur(10px);
            }

            .input-field {
                flex: 1;
                padding: 12px 16px;
                border: 2px solid #e5e7eb;
                border-radius: 25px;
                outline: none;
                font-size: 14px;
                transition: all 0.3s ease;
                background: white;
            }

            .input-field:focus {
                border-color: #8B5CF6;
                box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
            }

            .send-button {
                padding: 12px 20px;
                background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 50%, #6D28D9 100%);
                color: white;
                border: none;
                border-radius: 25px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                transition: all 0.3s ease;
                box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
            }

            .send-button:hover:not(:disabled) {
                transform: translateY(-1px);
                box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
                background: linear-gradient(135deg, #9333EA 0%, #8B5CF6 50%, #7C3AED 100%);
            }

            .send-button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }

            .notification-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                width: 22px;
                height: 22px;
                background: linear-gradient(135deg, #EF4444, #DC2626);
                color: white;
                border-radius: 50%;
                font-size: 12px;
                display: none;
                align-items: center;
                justify-content: center;
                animation: pulse 2s infinite;
                font-weight: 600;
                border: 2px solid white;
                box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
            }

            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }

            /* 響應式設計 */
            @media (max-width: 768px) {
                .chatbot-panel {
                    width: 320px;
                    height: 360px;
                    bottom: 70px;
                }
            }

            @media (max-width: 480px) {
                .chatbot-widget {
                    bottom: 15px;
                    right: 15px;
                }
                
                .chatbot-toggle {
                    width: 50px;
                    height: 50px;
                    font-size: 20px;
                }
                
                .chatbot-panel {
                    width: calc(100vw - 30px);
                    height: 60vh;
                    bottom: 75px;
                    right: -15px;
                }
            }

            .chat-messages::-webkit-scrollbar {
                width: 6px;
            }

            .chat-messages::-webkit-scrollbar-track {
                background: rgba(139, 92, 246, 0.1);
                border-radius: 3px;
            }

            .chat-messages::-webkit-scrollbar-thumb {
                background: linear-gradient(135deg, #8B5CF6, #7C3AED);
                border-radius: 3px;
            }

            .chat-messages::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(135deg, #7C3AED, #6D28D9);
            }
        `;
        document.head.appendChild(style);
        
        // 創建 ChatBot HTML
        const chatbotHTML = `
            <div class="chatbot-widget" id="chatbotWidget">
                <button class="chatbot-toggle" id="chatbotToggle">
                    <i class="fas fa-comments"></i>
                    <div class="notification-badge" id="notificationBadge">!</div>
                </button>
                
                <div class="chatbot-panel" id="chatbotPanel">
                    <div class="chatbot-header">
                        <div class="chatbot-title">🤖 AI 助教-彬彬</div>
                        <button class="chatbot-close" id="chatbotClose">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="chat-messages" id="chatMessages">
                        <div class="message system">
                            歡迎使用 AI 助教！我可以回答您關於欒斌教授或AI課程的任何問題。
                        </div>
                    </div>
                    
                    <div class="typing-indicator" id="typingIndicator">
                        <div class="typing-dots">
                            <div class="typing-dot"></div>
                            <div class="typing-dot"></div>
                            <div class="typing-dot"></div>
                        </div>
                    </div>
                    
                    <div class="chat-input">
                        <input 
                            type="text" 
                            class="input-field" 
                            id="messageInput" 
                            placeholder="輸入您的問題..."
                            maxlength="500"
                        >
                        <button class="send-button" id="sendButton" disabled>發送</button>
                    </div>
                </div>
            </div>
        `;
        
        // 插入到 body 末尾
        document.body.insertAdjacentHTML('beforeend', chatbotHTML);
    }
    
    getOrCreateSessionId() {
        let sessionId = localStorage.getItem('chatbot_session_id');
        if (!sessionId) {
            sessionId = 'web_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('chatbot_session_id', sessionId);
        }
        return sessionId;
    }
    
    bindEvents() {
        // 聊天機器人開關
        this.chatbotToggle.addEventListener('click', () => {
            this.toggleChatbot();
        });
        
        this.chatbotClose.addEventListener('click', () => {
            this.closeChatbot();
        });
        
        // 發送按鈕點擊事件
        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });
        
        // 輸入框按鍵事件
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // 輸入框輸入事件
        this.messageInput.addEventListener('input', () => {
            this.sendButton.disabled = this.messageInput.value.trim() === '';
        });
        
        // 點擊外部關閉聊天機器人
        document.addEventListener('click', (e) => {
            if (!this.chatbotToggle.contains(e.target) && 
                !this.chatbotPanel.contains(e.target) && 
                this.chatbotPanel.classList.contains('active')) {
                this.closeChatbot();
            }
        });
    }
    
    toggleChatbot() {
        if (this.chatbotPanel.classList.contains('active')) {
            this.closeChatbot();
        } else {
            this.openChatbot();
        }
    }
    
    openChatbot() {
        this.chatbotPanel.classList.add('active');
        this.messageInput.focus();
        this.hideNotification();
        this.scrollToBottom();
    }
    
    closeChatbot() {
        this.chatbotPanel.classList.remove('active');
    }
    
    showNotification() {
        this.notificationBadge.style.display = 'flex';
    }
    
    hideNotification() {
        this.notificationBadge.style.display = 'none';
    }
    
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;
        
        // 顯示用戶訊息
        this.addMessage(message, 'user');
        
        // 清空輸入框並禁用發送按鈕
        this.messageInput.value = '';
        this.sendButton.disabled = true;
        
        // 顯示打字指示器
        this.showTypingIndicator();
        
        try {
            // 發送請求到 n8n webhook
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    sessionId: this.sessionId,
                    timestamp: new Date().toISOString()
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.message) {
                this.addMessage(data.message, 'ai');
                
                // 儲存對話到本地
                this.saveChatToLocal(message, data.message);
                
                // 如果聊天機器人已關閉，顯示通知
                if (!this.chatbotPanel.classList.contains('active')) {
                    this.showNotification();
                }
            } else {
                throw new Error('回應格式錯誤');
            }
            
        } catch (error) {
            console.error('發送訊息時發生錯誤:', error);
            this.addMessage('抱歉，發生了錯誤。請檢查網路連線或稍後再試。', 'error-message');
        } finally {
            // 隱藏打字指示器
            this.hideTypingIndicator();
        }
    }
    
    addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = content;
        
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    showTypingIndicator() {
        this.typingIndicator.style.display = 'block';
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        this.typingIndicator.style.display = 'none';
    }
    
    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 100);
    }
    
    saveChatToLocal(userMessage, aiMessage) {
        const chatHistory = JSON.parse(localStorage.getItem('chatbot_history') || '[]');
        
        chatHistory.push({
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            userMessage: userMessage,
            aiMessage: aiMessage
        });
        
        // 限制歷史記錄數量（最多保存 100 條）
        if (chatHistory.length > 100) {
            chatHistory.splice(0, chatHistory.length - 100);
        }
        
        localStorage.setItem('chatbot_history', JSON.stringify(chatHistory));
    }
    
    loadChatHistory() {
        const chatHistory = JSON.parse(localStorage.getItem('chatbot_history') || '[]');
        const currentSessionHistory = chatHistory.filter(chat => chat.sessionId === this.sessionId);
        
        // 只載入最近的 10 條對話
        const recentHistory = currentSessionHistory.slice(-10);
        
        recentHistory.forEach(chat => {
            this.addMessage(chat.userMessage, 'user');
            this.addMessage(chat.aiMessage, 'ai');
        });
        
        if (recentHistory.length === 0) {
            // 如果沒有歷史記錄，顯示歡迎訊息
            setTimeout(() => {
                this.addMessage('你好，我是AI助教v4！有什麼關於欒斌教授或AI課程的問題想要問我嗎？', 'ai');
            }, 1000);
        }
    }
    
    // 清除對話歷史的方法（可以在控制台調用）
    clearHistory() {
        localStorage.removeItem('chatbot_history');
        localStorage.removeItem('chatbot_session_id');
        location.reload();
    }
}

// 初始化 ChatBot
document.addEventListener('DOMContentLoaded', function() {
    // 等待一秒確保頁面完全載入
    setTimeout(() => {
        window.chatBot = new ChatBot();
        
        // 在控制台提供清除歷史的方法
        window.clearChatHistory = () => {
            if (confirm('確定要清除所有對話歷史嗎？')) {
                window.chatBot.clearHistory();
            }
        };
        
        console.log('ChatBot 載入完成！');
        console.log('如需清除對話歷史，請在控制台執行：clearChatHistory()');
    }, 1000);
});
