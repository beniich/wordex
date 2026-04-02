import { useState } from 'react';
import { useMultiAgent } from '@/hooks/use-multi-agent';

interface Agent {
  name: string;
  role: string;
  specialty: string;
  emoji: string;
}

const AVAILABLE_AGENTS: Agent[] = [
  { name: 'analyst', role: 'Analyste Industriel', specialty: 'Analyse TRS/OEE', emoji: '📊' },
  { name: 'writer', role: 'Rédacteur Stratégique', specialty: 'Rapports Direction', emoji: '📝' },
  { name: 'designer', role: 'Designer Visuel', specialty: 'Présentations', emoji: '🎨' },
  { name: 'maintenance', role: 'Spécialiste Maintenance', specialty: 'Prévision', emoji: '🔧' },
  { name: 'quality', role: 'Expert Qualité', specialty: 'Conformité', emoji: '🔍' }
];

export function AgentChatPanel({ selectedAgent, onAgentChange }: { selectedAgent: string; onAgentChange: (agent: string) => void }) {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<Array<{role: string, content: string, timestamp: Date, agent?: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { executeSingleAgent } = useMultiAgent();

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    // Ajouter le message utilisateur
    const userMessage = { role: 'user', content: message, timestamp: new Date() };
    setConversation(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      // Envoyer au backend
      const response = await executeSingleAgent(selectedAgent, message);
      
      // Ajouter la réponse de l'agent
      const agentResponse = { 
        role: 'agent', 
        content: response.response, 
        timestamp: new Date(),
        agent: selectedAgent
      };
      setConversation(prev => [...prev, agentResponse]);
      
    } catch (error) {
      const errorMessage = { 
        role: 'error', 
        content: 'Erreur de communication avec l\'agent', 
        timestamp: new Date() 
      };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedAgentInfo = AVAILABLE_AGENTS.find(a => a.name === selectedAgent);

  return (
    <div className="agent-chat-panel">
      {/* Sélection de l'agent */}
      <div className="agent-selector">
        <h3>Choisissez votre agent :</h3>
        <div className="agents-grid">
          {AVAILABLE_AGENTS.map(agent => (
            <button
              key={agent.name}
              className={`agent-card ${selectedAgent === agent.name ? 'selected' : ''}`}
              onClick={() => onAgentChange(agent.name)}
            >
              <span className="agent-emoji">{agent.emoji}</span>
              <div className="agent-info">
                <strong>{agent.role}</strong>
                <small>{agent.specialty}</small>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat interface */}
      <div className="chat-container">
        {/* Header avec info agent */}
        <div className="chat-header cuivre-light">
          <div className="agent-avatar">
            <span className="agent-emoji-large">{selectedAgentInfo?.emoji || '🤖'}</span>
          </div>
          <div className="agent-details">
            <h4>{selectedAgentInfo?.role || 'Agent IA'}</h4>
            <p>{selectedAgentInfo?.specialty || 'Spécialiste'}</p>
          </div>
        </div>

        {/* Conversation */}
        <div className="chat-messages">
          {conversation.length === 0 ? (
            <div className="welcome-message">
              <p>👋 Bonjour ! Je suis votre {selectedAgentInfo?.role?.toLowerCase() || 'agent IA'}.</p>
              <p>Posez-moi une question sur {selectedAgentInfo?.specialty?.toLowerCase() || 'votre domaine d\'expertise'}.</p>
            </div>
          ) : (
            conversation.map((msg, index) => (
              <div key={index} className={`message ${msg.role}`}>
                {msg.role === 'agent' && (
                  <div className="agent-tag">
                    {AVAILABLE_AGENTS.find(a => a.name === msg.agent)?.emoji || '🤖'} 
                    {AVAILABLE_AGENTS.find(a => a.name === msg.agent)?.role || 'Agent'}
                  </div>
                )}
                <div className="message-content">
                  {msg.content}
                </div>
                <div className="message-timestamp">
                  {msg.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="message agent typing">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="chat-input-area">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
            placeholder={`Message à ${selectedAgentInfo?.role || 'l\'agent'}...`}
            disabled={isLoading}
            rows={3}
          />
          <button 
            onClick={handleSendMessage} 
            disabled={isLoading || !message.trim()}
            className="send-button"
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .agent-chat-panel {
          display: flex;
          gap: 20px;
          height: calc(100vh - 180px);
        }
        
        .agent-selector {
          width: 300px;
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .agents-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .agent-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border: 1px solid #E0E0E0;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .agent-card:hover {
          border-color: #A67B5B;
          background: #FFF5E6;
        }
        
        .agent-card.selected {
          border-color: #A67B5B;
          background: #FFF5E6;
          box-shadow: 0 0 0 2px rgba(166, 123, 91, 0.2);
        }
        
        .agent-emoji {
          font-size: 20px;
        }
        
        .agent-info strong {
          display: block;
          font-size: 14px;
        }
        
        .agent-info small {
          color: #666;
          font-size: 12px;
        }
        
        .chat-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        
        .chat-header {
          display: flex;
          align-items: center;
          padding: 15px 20px;
          border-bottom: 1px solid #E0E0E0;
          background: #FCF9F5;
        }
        
        .agent-avatar {
          font-size: 24px;
          margin-right: 15px;
        }
        
        .chat-messages {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .message {
          max-width: 80%;
          padding: 12px 16px;
          border-radius: 18px;
          position: relative;
        }
        
        .message.user {
          align-self: flex-end;
          background: #A67B5B;
          color: white;
          border-bottom-right-radius: 4px;
        }
        
        .message.agent {
          align-self: flex-start;
          background: #F0F0F0;
          border-bottom-left-radius: 4px;
        }
        
        .agent-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #666;
          margin-bottom: 5px;
        }
        
        .message-timestamp {
          font-size: 10px;
          color: #999;
          margin-top: 5px;
          text-align: right;
        }
        
        .chat-input-area {
          display: flex;
          padding: 15px;
          border-top: 1px solid #E0E0E0;
          background: #FCF9F5;
        }
        
        textarea {
          flex: 1;
          padding: 12px;
          border: 1px solid #E0E0E0;
          border-radius: 18px;
          resize: none;
          font-family: inherit;
        }
        
        .send-button {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          border: none;
          background: #A67B5B;
          color: white;
          margin-left: 10px;
          cursor: pointer;
          font-size: 18px;
        }
        
        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .typing-indicator span {
          width: 8px;
          height: 8px;
          background: #A67B5B;
          border-radius: 50%;
          animation: typing 1.4s infinite ease-in-out;
        }
        
        .typing-indicator span:nth-child(1) { animation-delay: 0s; }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        
        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
        
        .cuivre-light {
          background: #FCF9F5;
        }
      `}</style>
    </div>
  );
}
