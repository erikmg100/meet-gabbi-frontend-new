'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RetellWebClient } from 'retell-client-js-sdk';

export default function Widget() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [callStatus, setCallStatus] = useState('READY TO TALK');
  const [transcript, setTranscript] = useState('');
  const [retellWebClient, setRetellWebClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const client = new RetellWebClient();
    setRetellWebClient(client);

    client.on("call_started", () => {
      console.log("call started");
      setCallStatus('LISTENING...');
      setIsCallActive(true);
      setMessages([{ type: 'system', text: 'Connected! Start speaking...', timestamp: new Date() }]);
    });

    client.on("call_ended", () => {
      console.log("call ended");
      setCallStatus('CALL ENDED');
      setIsCallActive(false);
      setMessages(prev => [...prev, { type: 'system', text: 'Call ended. Thanks for chatting!', timestamp: new Date() }]);
      setTimeout(() => setCallStatus('READY TO TALK'), 3000);
    });

    client.on("update", (update) => {
      console.log("Received update:", update);
      
      if (update.transcript && Array.isArray(update.transcript)) {
        const newMessages = update.transcript.map(item => ({
          type: item.role === 'agent' ? 'gabbi' : 'user',
          text: item.content,
          timestamp: new Date(),
          id: `${item.role}-${Date.now()}-${Math.random()}`
        }));
        setMessages(newMessages);
      }
    });

    client.on("error", (error) => {
      console.error("Retell error:", error);
      setCallStatus('ERROR - TRY AGAIN');
      setMessages(prev => [...prev, { type: 'system', text: 'Connection error. Please try again.', timestamp: new Date() }]);
      setTimeout(() => setCallStatus('READY TO TALK'), 3000);
    });

    return () => {
      client.removeAllListeners();
    };
  }, []);

  const startCall = async () => {
    try {
      setCallStatus('CONNECTING...');
      setMessages([]);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      
      const response = await fetch(`https://backendmain-meet-gabbi-site-voice.vercel.app/create-web-call?t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      
      if (!data.success || !data.access_token) {
        throw new Error(data.error || 'Failed to get access token');
      }

      if (retellWebClient) {
        await retellWebClient.startCall({
          accessToken: data.access_token,
          sampleRate: 24000,
          captureDeviceId: "default",
          playbackDeviceId: "default"
        });
      }
    } catch (error) {
      console.error('Error starting call:', error);
      if (error.name === 'NotAllowedError') {
        setCallStatus('MIC ACCESS DENIED');
        setMessages([{ type: 'system', text: 'Microphone access denied. Please allow microphone access.', timestamp: new Date() }]);
      } else {
        setCallStatus('CONNECTION FAILED');
        setMessages([{ type: 'system', text: 'Connection failed. Please try again.', timestamp: new Date() }]);
      }
      setTimeout(() => setCallStatus('READY TO TALK'), 3000);
    }
  };

  const stopCall = async () => {
    try {
      if (retellWebClient) {
        await retellWebClient.stopCall();
      }
    } catch (error) {
      console.error('Error stopping call:', error);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      
      <div style={{
        fontFamily: "'Manrope', sans-serif",
        background: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '20px',
        minHeight: '600px',
        width: '100%',
        maxWidth: '450px',
        margin: '0 auto',
      }}>
        {/* Audio Sphere */}
        <div 
          onClick={isCallActive ? stopCall : startCall}
          style={{
            width: '140px',
            height: '140px',
            background: isCallActive 
              ? 'linear-gradient(135deg, #66bb6a, #4caf50, #43a047)'
              : 'linear-gradient(135deg, #4fc3f7, #29b6f6, #0288d1)',
            borderRadius: '50%',
            position: 'relative',
            boxShadow: isCallActive 
              ? '0 0 40px rgba(76, 175, 80, 0.8), 0 0 80px rgba(102, 187, 106, 0.5)'
              : '0 0 30px rgba(41, 182, 246, 0.6), 0 0 60px rgba(79, 195, 247, 0.4)',
            cursor: 'pointer',
            transition: 'all 0.4s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.2rem',
            animation: isCallActive 
              ? 'pulse 1s infinite ease-in-out' 
              : 'pulse 2.5s infinite ease-in-out',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            marginBottom: '15px',
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
          <div style={{
            color: 'white',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
          }}>
            🎤
          </div>
          
          {/* Audio waves when active */}
          {isCallActive && (
            <>
              <div style={{
                position: 'absolute',
                width: '180px',
                height: '180px',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '50%',
                animation: 'audioWave 2s ease-in-out infinite',
              }}></div>
              <div style={{
                position: 'absolute',
                width: '220px',
                height: '220px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                animation: 'audioWave 2s ease-in-out infinite 0.5s',
              }}></div>
            </>
          )}
        </div>

        {/* Call Button */}
        <button 
          onClick={isCallActive ? stopCall : startCall}
          style={{
            padding: '10px 25px',
            fontSize: '15px',
            fontWeight: '700',
            color: '#ffffff',
            background: isCallActive 
              ? 'linear-gradient(90deg, #f44336, #d32f2f)'
              : 'linear-gradient(90deg, #4fc3f7, #29b6f6)',
            border: 'none',
            borderRadius: '25px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: isCallActive
              ? '0 4px 15px rgba(244, 67, 54, 0.4)'
              : '0 4px 15px rgba(41, 182, 246, 0.4)',
            fontFamily: "'Manrope', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            minWidth: '130px',
            marginBottom: '10px',
          }}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >
          {isCallActive ? 'END CALL' : 'TALK TO GABBI'}
        </button>

        {/* Status */}
        <div style={{
          padding: '6px 18px',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: '18px',
          fontSize: '12px',
          fontWeight: '600',
          color: '#0277bd',
          textAlign: 'center',
          border: '1px solid rgba(41, 182, 246, 0.2)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '20px',
          boxShadow: '0 2px 10px rgba(41, 182, 246, 0.1)',
        }}>
          {callStatus}
        </div>

        {/* iPhone-Style Messages Container */}
        <div style={{
          width: '100%',
          height: '280px',
          background: 'rgba(0, 0, 0, 0.02)',
          borderRadius: '25px',
          border: '1px solid rgba(41, 182, 246, 0.1)',
          backdropFilter: 'blur(20px)',
          padding: '15px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.05)',
        }}>
          {messages.length === 0 ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'rgba(2, 119, 189, 0.5)',
              fontSize: '14px',
              fontStyle: 'italic',
              textAlign: 'center',
              lineHeight: '1.4',
            }}>
              Start a conversation with Gabbi.<br/>Your chat will appear here in real-time.
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: message.type === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '4px',
                animation: 'messageSlideIn 0.3s ease-out',
              }}>
                {/* Message Bubble */}
                <div style={{
                  maxWidth: '85%',
                  padding: message.type === 'system' ? '8px 12px' : '10px 14px',
                  borderRadius: message.type === 'system' 
                    ? '12px' 
                    : message.type === 'user' 
                      ? '18px 18px 4px 18px' 
                      : '18px 18px 18px 4px',
                  background: message.type === 'system'
                    ? 'rgba(189, 189, 189, 0.15)'
                    : message.type === 'user'
                      ? 'linear-gradient(135deg, #007AFF, #0051D5)'
                      : 'rgba(255, 255, 255, 0.95)',
                  color: message.type === 'system'
                    ? 'rgba(2, 119, 189, 0.7)'
                    : message.type === 'user'
                      ? '#ffffff'
                      : '#1c1c1e',
                  fontSize: message.type === 'system' ? '11px' : '14px',
                  fontWeight: message.type === 'system' ? '500' : '500',
                  lineHeight: '1.4',
                  wordWrap: 'break-word',
                  boxShadow: message.type === 'system' 
                    ? 'none'
                    : message.type === 'user'
                      ? '0 2px 8px rgba(0, 122, 255, 0.25)'
                      : '0 1px 3px rgba(0, 0, 0, 0.1)',
                  border: message.type === 'gabbi' ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
                  textAlign: message.type === 'system' ? 'center' : 'left',
                  fontStyle: message.type === 'system' ? 'italic' : 'normal',
                }}>
                  {message.type === 'gabbi' && (
                    <div style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#007AFF',
                      marginBottom: '2px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      GABBI
                    </div>
                  )}
                  {message.text}
                </div>
                
                {/* Timestamp */}
                {message.type !== 'system' && (
                  <div style={{
                    fontSize: '10px',
                    color: 'rgba(2, 119, 189, 0.5)',
                    marginTop: '2px',
                    fontWeight: '500',
                    alignSelf: message.type === 'user' ? 'flex-end' : 'flex-start',
                  }}>
                    {formatTime(message.timestamp)}
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Compact Branding */}
        <div style={{
          marginTop: '15px',
          fontSize: '10px',
          fontWeight: '600',
          color: 'rgba(2, 119, 189, 0.6)',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          textAlign: 'center',
        }}>
          POWERED BY MEET GABBI
        </div>

        <style jsx>{`
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
              opacity: 0.9;
            }
            50% {
              transform: scale(1.05);
              opacity: 1;
            }
          }

          @keyframes audioWave {
            0% {
              transform: scale(1);
              opacity: 0.6;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.3;
            }
            100% {
              transform: scale(1.2);
              opacity: 0;
            }
          }

          @keyframes messageSlideIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          /* Custom Scrollbar for Messages */
          div::-webkit-scrollbar {
            width: 4px;
          }
          
          div::-webkit-scrollbar-track {
            background: transparent;
          }
          
          div::-webkit-scrollbar-thumb {
            background: rgba(41, 182, 246, 0.3);
            border-radius: 12px;
          }
          
          div::-webkit-scrollbar-thumb:hover {
            background: rgba(41, 182, 246, 0.5);
          }
        `}</style>
      </div>
    </>
  );
}
