'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RetellWebClient } from 'retell-client-js-sdk';

export default function Widget() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [callStatus, setCallStatus] = useState('Call Gabbi');
  const [transcript, setTranscript] = useState('');
  const [retellWebClient, setRetellWebClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showMessages, setShowMessages] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const messagesEndRef = useRef(null);
  const intervalRef = useRef(null);

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
      setCallStatus('Connected');
      setIsCallActive(true);
      setShowMessages(true);
      setCallDuration(0);
      setMessages([{ type: 'system', text: 'Call connected', timestamp: new Date() }]);
      
      // Start call timer
      intervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    });

    client.on("call_ended", () => {
      console.log("call ended");
      setCallStatus('Call Ended');
      setIsCallActive(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setTimeout(() => {
        setCallStatus('Call Gabbi');
        setShowMessages(false);
        setMessages([]);
      }, 3000);
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
      setCallStatus('Call Failed');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setTimeout(() => {
        setCallStatus('Call Gabbi');
        setShowMessages(false);
      }, 3000);
    });

    return () => {
      client.removeAllListeners();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startCall = async () => {
    try {
      setCallStatus('Calling...');
      
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
        setCallStatus('Microphone Access Denied');
      } else {
        setCallStatus('Call Failed');
      }
      setTimeout(() => setCallStatus('Call Gabbi'), 3000);
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMessageTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      
      <div style={{
        fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, sans-serif",
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        minHeight: '700px',
      }}>
        {/* iPhone Frame */}
        <div style={{
          width: '320px',
          height: '640px',
          background: 'linear-gradient(145deg, #1c1c1e, #2c2c2e)',
          borderRadius: '45px',
          padding: '8px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          position: 'relative',
          border: '2px solid #3a3a3c',
        }}>
          {/* iPhone Screen */}
          <div style={{
            width: '100%',
            height: '100%',
            background: isCallActive ? '#000000' : 'linear-gradient(180deg, #f2f2f7, #ffffff)',
            borderRadius: '37px',
            overflow: 'hidden',
            position: 'relative',
          }}>
            
            {/* Status Bar */}
            <div style={{
              height: '44px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 20px',
              color: isCallActive ? '#ffffff' : '#000000',
              fontSize: '14px',
              fontWeight: '600',
              paddingTop: '12px',
            }}>
              <div>9:41</div>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <div style={{ width: '18px', height: '10px', border: `1px solid ${isCallActive ? '#ffffff' : '#000000'}`, borderRadius: '2px', position: 'relative' }}>
                  <div style={{ width: '14px', height: '6px', background: isCallActive ? '#ffffff' : '#000000', borderRadius: '1px', margin: '1px' }}></div>
                </div>
              </div>
            </div>

            {!isCallActive && !showMessages ? (
              /* Contact Screen */
              <div style={{
                padding: '20px',
                textAlign: 'center',
                height: 'calc(100% - 44px)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                {/* Profile Picture */}
                <div style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4fc3f7, #29b6f6, #0288d1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                  boxShadow: '0 10px 30px rgba(41, 182, 246, 0.3)',
                  border: '4px solid rgba(255, 255, 255, 0.8)',
                  overflow: 'hidden',
                }}>
                  <img 
                    src="https://chatdash-bucket.s3.us-east-1.amazonaws.com/685c4a3871002e3108e5194d_project_logo?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIARHJJM3SY5CUVGPJG%2F20250725%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250725T231113Z&X-Amz-Expires=3600&X-Amz-Signature=f8d55c69357685cd9b673b0d171a4b124a824c7313e44cbd2fc6bc4c8e7ab728&X-Amz-SignedHeaders=host&x-id=GetObject"
                    alt="Meet Gabbi Logo"
                    style={{
                      width: '100px',
                      height: '100px',
                      objectFit: 'contain',
                      borderRadius: '50%',
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentNode.innerHTML = '<div style="font-size: 60px; color: white;">👩‍⚖️</div>';
                    }}
                  />
                </div>

                {/* Contact Name */}
                <h2 style={{
                  fontSize: '36px',
                  fontWeight: '800',
                  color: '#000000',
                  marginBottom: '8px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                }}>
                  GABBI
                </h2>

                {/* Contact Subtitle */}
                <p style={{
                  fontSize: '17px',
                  color: '#8e8e93',
                  marginBottom: '50px',
                  fontWeight: '500',
                  lineHeight: '1.3',
                  textAlign: 'center',
                }}>
                  Your Next AI Intake Employee
                </p>

                {/* Call Button */}
                <div 
                  onClick={startCall}
                  style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #34c759, #30d158)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 15px 35px rgba(52, 199, 89, 0.5), 0 0 0 0 rgba(52, 199, 89, 0.4)',
                    marginBottom: '25px',
                    animation: 'callButtonPulse 3s ease-in-out infinite',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.15)';
                    e.target.style.boxShadow = '0 20px 45px rgba(52, 199, 89, 0.7), 0 0 30px rgba(52, 199, 89, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 15px 35px rgba(52, 199, 89, 0.5), 0 0 0 0 rgba(52, 199, 89, 0.4)';
                  }}
                >
                  <div style={{
                    fontSize: '38px',
                    color: '#ffffff',
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
                  }}>
                    📞
                  </div>
                </div>

                <div style={{
                  fontSize: '20px',
                  color: '#34c759',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  textShadow: '0 2px 8px rgba(52, 199, 89, 0.3)',
                  animation: 'callTextGlow 2s ease-in-out infinite alternate',
                }}>
                  {callStatus}
                </div>
              </div>
            ) : (
              /* Call Active Screen */
              <div style={{
                height: 'calc(100% - 44px)',
                display: 'flex',
                flexDirection: 'column',
                background: isCallActive ? 'linear-gradient(180deg, #1c1c1e, #000000)' : '#ffffff',
              }}>
                {isCallActive && (
                  <>
                    {/* Call Header */}
                    <div style={{
                      padding: '30px 20px 20px',
                      textAlign: 'center',
                      color: '#ffffff',
                    }}>
                      <div style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #4fc3f7, #29b6f6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 15px',
                        animation: 'callPulse 2s ease-in-out infinite',
                        overflow: 'hidden',
                        border: '3px solid rgba(255, 255, 255, 0.3)',
                      }}>
                        <img 
                          src="https://chatdash-bucket.s3.us-east-1.amazonaws.com/685c4a3871002e3108e5194d_project_logo?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIARHJJM3SY5CUVGPJG%2F20250725%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250725T231113Z&X-Amz-Expires=3600&X-Amz-Signature=f8d55c69357685cd9b673b0d171a4b124a824c7313e44cbd2fc6bc4c8e7ab728&X-Amz-SignedHeaders=host&x-id=GetObject"
                          alt="Meet Gabbi Logo"
                          style={{
                            width: '70px',
                            height: '70px',
                            objectFit: 'contain',
                            borderRadius: '50%',
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentNode.innerHTML = '<div style="font-size: 45px; color: white;">👩‍⚖️</div>';
                          }}
                        />
                      </div>
                      
                      <h3 style={{
                        fontSize: '26px',
                        fontWeight: '800',
                        marginBottom: '4px',
                        color: '#ffffff',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                      }}>
                        GABBI
                      </h3>
                      
                      <div style={{
                        fontSize: '16px',
                        color: '#8e8e93',
                        marginBottom: '8px',
                      }}>
                        {callStatus}
                      </div>

                      <div style={{
                        fontSize: '18px',
                        color: '#ffffff',
                        fontWeight: '500',
                      }}>
                        {formatTime(callDuration)}
                      </div>
                    </div>

                    {/* Messages During Call */}
                    <div style={{
                      flex: 1,
                      padding: '0 15px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}>
                      {messages.map((message, index) => (
                        <div key={index} style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: message.type === 'user' ? 'flex-end' : 'flex-start',
                          marginBottom: '4px',
                          animation: 'messageSlideIn 0.3s ease-out',
                        }}>
                          <div style={{
                            maxWidth: '80%',
                            padding: message.type === 'system' ? '6px 10px' : '8px 12px',
                            borderRadius: message.type === 'system' 
                              ? '10px' 
                              : message.type === 'user' 
                                ? '16px 16px 4px 16px' 
                                : '16px 16px 16px 4px',
                            background: message.type === 'system'
                              ? 'rgba(142, 142, 147, 0.3)'
                              : message.type === 'user'
                                ? '#007AFF'
                                : 'rgba(255, 255, 255, 0.15)',
                            color: message.type === 'system'
                              ? 'rgba(255, 255, 255, 0.7)'
                              : '#ffffff',
                            fontSize: message.type === 'system' ? '11px' : '14px',
                            fontWeight: '400',
                            lineHeight: '1.3',
                            wordWrap: 'break-word',
                            backdropFilter: 'blur(10px)',
                            border: message.type !== 'system' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                          }}>
                            {message.type === 'gabbi' && (
                              <div style={{
                                fontSize: '10px',
                                fontWeight: '600',
                                color: '#4fc3f7',
                                marginBottom: '2px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                              }}>
                                GABBI
                              </div>
                            )}
                            {message.text}
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Call Controls */}
                    <div style={{
                      padding: '20px',
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '60px',
                      alignItems: 'center',
                    }}>
                      {/* End Call Button */}
                      <div 
                        onClick={stopCall}
                        style={{
                          width: '70px',
                          height: '70px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #ff3b30, #ff453a)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 8px 25px rgba(255, 59, 48, 0.4)',
                        }}
                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                      >
                        <div style={{
                          fontSize: '28px',
                          color: '#ffffff',
                        }}>
                          📞
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Home Indicator */}
            <div style={{
              position: 'absolute',
              bottom: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '134px',
              height: '5px',
              background: isCallActive ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
              borderRadius: '3px',
            }}></div>
          </div>

          {/* iPhone Notch */}
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100px',
            height: '25px',
            background: '#000000',
            borderRadius: '0 0 15px 15px',
            zIndex: 10,
          }}></div>
        </div>

        <style jsx>{`
          @keyframes callPulse {
            0%, 100% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.05);
              opacity: 0.8;
            }
          }

          @keyframes callButtonPulse {
            0%, 100% {
              transform: scale(1);
              box-shadow: 0 15px 35px rgba(52, 199, 89, 0.5), 0 0 0 0 rgba(52, 199, 89, 0.4);
            }
            25% {
              transform: scale(1.05);
              box-shadow: 0 20px 40px rgba(52, 199, 89, 0.6), 0 0 15px rgba(52, 199, 89, 0.5);
            }
            50% {
              transform: scale(1.08);
              box-shadow: 0 25px 45px rgba(52, 199, 89, 0.7), 0 0 25px rgba(52, 199, 89, 0.6);
            }
            75% {
              transform: scale(1.05);
              box-shadow: 0 20px 40px rgba(52, 199, 89, 0.6), 0 0 15px rgba(52, 199, 89, 0.5);
            }
          }

          @keyframes callTextGlow {
            0% {
              text-shadow: 0 2px 8px rgba(52, 199, 89, 0.3);
              color: #34c759;
            }
            100% {
              text-shadow: 0 4px 16px rgba(52, 199, 89, 0.6), 0 0 8px rgba(52, 199, 89, 0.4);
              color: #30d158;
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

          /* Custom Scrollbar */
          div::-webkit-scrollbar {
            width: 3px;
          }
          
          div::-webkit-scrollbar-track {
            background: transparent;
          }
          
          div::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 3px;
          }
        `}</style>
      </div>
    </>
  );
}
