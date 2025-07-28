'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RetellWebClient } from 'retell-client-js-sdk';
import Head from 'next/head';

export default function Home() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [callStatus, setCallStatus] = useState('READY TO CALL');
  const [retellWebClient, setRetellWebClient] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const transcriptRef = useRef(null);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
    
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    
    const client = new RetellWebClient();
    setRetellWebClient(client);

    client.on("call_started", () => {
      console.log("call started");
      setCallStatus('CALL ACTIVE - SAY SOMETHING!');
      setIsCallActive(true);
    });

    client.on("call_ended", () => {
      console.log("call ended");
      setCallStatus('CALL ENDED');
      setIsCallActive(false);
    });

    client.on("agent_start_talking", () => {
      console.log("agent started talking");
    });

    client.on("agent_stop_talking", () => {
      console.log("agent stopped talking");
    });

    client.on("update", (update) => {
      console.log("Received update:", update);
      
      let transcriptText = '';
      if (update.transcript) {
        if (typeof update.transcript === 'string') {
          transcriptText = update.transcript;
        } else if (Array.isArray(update.transcript)) {
          transcriptText = update.transcript
            .map(item => `${item.role === 'agent' ? '👩 Gabbi' : '👤 You'}: ${item.content}`)
            .join('\n\n');
        }
        setTranscript(transcriptText);
      }
    });

    client.on("error", (error) => {
      console.error("Retell error:", error);
      setCallStatus(`ERROR: ${error.message || 'UNKNOWN ERROR'}`);
    });

    return () => {
      client.removeAllListeners();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  const startCall = async () => {
    try {
      setCallStatus('REQUESTING MICROPHONE ACCESS...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      
      setCallStatus('CREATING CALL...');
      
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

      setCallStatus('CALL STARTING...');
    } catch (error) {
      console.error('Error starting call:', error);
      if (error.name === 'NotAllowedError') {
        setCallStatus('MICROPHONE ACCESS DENIED. PLEASE ALLOW MICROPHONE ACCESS AND TRY AGAIN.');
      } else {
        setCallStatus(`ERROR: ${error.message}`);
      }
    }
  };

  const stopCall = async () => {
    try {
      if (retellWebClient) {
        await retellWebClient.stopCall();
      }
      setCallStatus('CALL STOPPED');
      setIsCallActive(false);
    } catch (error) {
      console.error('Error stopping call:', error);
    }
  };

  return (
    <>
      <Head>
        <title>MEET GABBI FOR LAW FIRMS</title>
      </Head>
      <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      
      {/* CRITICAL: Absolutely positioned container that never changes size */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '750px', // Exact iframe height
        maxHeight: '750px',
        minHeight: '750px',
        overflow: 'hidden',
        fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
        background: 'linear-gradient(145deg, #e1f5fe, #b3e5fc, #81d4fa, #4fc3f7, #29b6f6)',
        color: '#0277bd',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: isMobile ? '10px' : '20px',
        backgroundAttachment: 'fixed',
        boxSizing: 'border-box',
      }}>
        {/* Subtle Animated Background Overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.4) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(41, 182, 246, 0.3) 0%, transparent 50%)',
          animation: 'bgGlow 15s ease-in-out infinite',
          zIndex: 0,
          pointerEvents: 'none',
        }}></div>

        {/* Logo - Smaller for space efficiency */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: isMobile ? '15px' : '20px',
          zIndex: 10,
          flexShrink: 0,
        }}>
          <img 
            src="https://cdn-ilclclp.nitrocdn.com/uiuLNoPKqvsktnRsIDyDgFJzxCWoSfSE/assets/images/optimized/rev-1557504/protectingpatientrights.com/wp-content/uploads/2024/11/white-logo-1-1.webp"
            alt="Logo"
            style={{
              height: isMobile ? '35px' : '45px', // Reduced size
              width: 'auto',
              filter: 'drop-shadow(0 4px 12px rgba(2, 119, 189, 0.4))',
              maxWidth: '85%',
              transition: 'transform 0.3s ease',
            }}
            onError={(e) => {
              console.log('Logo failed to load');
              e.target.style.display = 'none';
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          />
        </div>

        {/* Main Content - Absolutely positioned and sized */}
        <div style={{
          display: 'flex',
          gap: isMobile ? '10px' : '20px',
          width: '100%',
          maxWidth: '420px', // Fit within iframe width
          flexDirection: isMobile ? 'column' : 'row',
          zIndex: 10,
          position: 'absolute',
          top: isMobile ? '70px' : '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          height: isMobile ? '630px' : '620px', // Fixed remaining height
          maxHeight: isMobile ? '630px' : '620px',
        }}>
          {/* Audio Sphere Section */}
          <div style={{
            flex: isMobile ? '0 0 auto' : 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: isMobile ? '5px' : '10px',
            height: isMobile ? 'auto' : '100%',
          }}>
            <div 
              onClick={isCallActive ? stopCall : startCall}
              style={{
                width: isMobile ? '120px' : '160px', // Smaller sizes
                height: isMobile ? '120px' : '160px',
                background: 'linear-gradient(135deg, #4fc3f7, #29b6f6, #0288d1)',
                borderRadius: '50%',
                position: 'relative',
                boxShadow: isCallActive 
                  ? '0 0 40px rgba(41, 182, 246, 0.9), 0 0 80px rgba(79, 195, 247, 0.7)'
                  : '0 0 25px rgba(41, 182, 246, 0.6), 0 0 50px rgba(79, 195, 247, 0.4)',
                cursor: 'pointer',
                transition: 'all 0.4s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isMobile ? '1.8rem' : '2.5rem', // Smaller emoji
                animation: isCallActive 
                  ? 'pulse 1.2s infinite ease-in-out' 
                  : 'pulse 2.5s infinite ease-in-out',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              🎤
            </div>

            <button 
              onClick={isCallActive ? stopCall : startCall}
              style={{
                marginTop: '15px',
                padding: isMobile ? '10px 25px' : '12px 35px', // Smaller padding
                fontSize: isMobile ? '14px' : '16px', // Smaller font
                fontWeight: '700',
                color: '#ffffff',
                background: isCallActive 
                  ? 'linear-gradient(90deg, #f44336, #d32f2f)'
                  : 'linear-gradient(90deg, #4fc3f7, #29b6f6)',
                border: 'none',
                borderRadius: '50px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: isCallActive
                  ? '0 4px 15px rgba(244, 67, 54, 0.5)'
                  : '0 4px 15px rgba(41, 182, 246, 0.5)',
                fontFamily: "'Manrope', sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '1px',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1.05)'}
            >
              {isCallActive ? 'END CALL' : 'START CALL'}
            </button>

            <div style={{
              marginTop: '10px',
              padding: isMobile ? '6px 12px' : '8px 18px', // Smaller padding
              background: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(12px)',
              borderRadius: '30px',
              fontSize: isMobile ? '11px' : '12px', // Smaller font
              fontWeight: '600',
              color: '#0277bd',
              textAlign: 'center',
              minWidth: isMobile ? '150px' : '180px', // Smaller width
              border: '1px solid rgba(255, 255, 255, 0.3)',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              flexShrink: 0,
            }}>
              {callStatus}
            </div>
          </div>

          {/* Transcript Section - ABSOLUTELY SIZED */}
          <div style={{
            flex: 1,
            height: isMobile ? '350px' : '100%', // Exact height
            maxHeight: isMobile ? '350px' : '100%',
            minHeight: isMobile ? '350px' : '100%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
          }}>
            <h2 style={{
              fontSize: isMobile ? '16px' : '20px', // Smaller font
              fontWeight: '800',
              marginBottom: '10px',
              color: '#0277bd',
              flexShrink: 0,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              textAlign: 'center',
              margin: '0 0 10px 0',
              height: isMobile ? '20px' : '25px', // Fixed height
            }}>
              LIVE TRANSCRIPT
            </h2>
            
            <div 
              ref={transcriptRef}
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: isMobile ? '13px' : '14px', // Smaller font
                lineHeight: '1.5', // Tighter line height
                color: '#0277bd',
                fontWeight: '600',
                overflowY: 'auto',
                flex: 1,
                paddingRight: '6px',
                scrollBehavior: 'smooth',
                letterSpacing: '0.2px',
                
                // ABSOLUTELY FIXED HEIGHT
                height: isMobile ? '310px' : 'calc(100% - 35px)', // Remaining space
                maxHeight: isMobile ? '310px' : 'calc(100% - 35px)',
                minHeight: isMobile ? '310px' : 'calc(100% - 35px)',
                position: 'relative',
                contain: 'strict', // Strictest containment
              }}
            >
              {transcript ? (
                <div style={{ animation: 'fadeIn 0.5s ease-in' }}>
                  {transcript.split('\n\n').map((line, index) => (
                    <div
                      key={index}
                      style={{
                        marginBottom: '8px', // Smaller margin
                        padding: isMobile ? '6px 10px' : '8px 12px', // Smaller padding
                        borderRadius: '12px',
                        background: line.startsWith('👩 Gabbi')
                          ? 'rgba(79, 195, 247, 0.3)'
                          : 'rgba(41, 182, 246, 0.2)',
                        maxWidth: isMobile ? '95%' : '85%',
                        alignSelf: line.startsWith('👩 Gabbi') ? 'flex-start' : 'flex-end',
                        boxShadow: '0 2px 6px rgba(41, 182, 246, 0.2)', // Smaller shadow
                        display: 'inline-block',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.02)';
                        e.target.style.boxShadow = '0 3px 10px rgba(41, 182, 246, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.boxShadow = '0 2px 6px rgba(41, 182, 246, 0.2)';
                      }}
                    >
                      {line.startsWith('👩 Gabbi') ? (
                        <span>
                          <span style={{ color: '#0288d1', fontWeight: '700' }}>👩 GABBI:</span>
                          <span style={{ color: '#0277bd' }}>{line.slice(9)}</span>
                        </span>
                      ) : line.startsWith('👤 You') ? (
                        <span>
                          <span style={{ color: '#4fc3f7', fontWeight: '700' }}>👤 YOU:</span>
                          <span style={{ color: '#0277bd' }}>{line.slice(7)}</span>
                        </span>
                      ) : (
                        line
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  color: 'rgba(2, 119, 189, 0.6)',
                  fontStyle: 'italic',
                  fontWeight: '500',
                  textAlign: 'center',
                  marginTop: isMobile ? '30px' : '50px',
                  fontSize: isMobile ? '12px' : '13px', // Smaller font
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  YOUR CONVERSATION WILL APPEAR HERE IN REAL-TIME...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Powered by Text - Fixed position at bottom */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
        }}>
          <div style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: isMobile ? '9px' : '11px', // Smaller font
            fontWeight: '800',
            color: 'rgba(2, 119, 189, 0.8)',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            textAlign: 'center',
            filter: 'drop-shadow(0 2px 6px rgba(41, 182, 246, 0.3))',
            transition: 'color 0.3s ease',
          }}
          onMouseEnter={(e) => e.target.style.color = '#0277bd'}
          onMouseLeave={(e) => e.target.style.color = 'rgba(2, 119, 189, 0.8)'}
          >
            POWERED BY MEET GABBI
          </div>
        </div>

        <style jsx>{`
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
              opacity: 0.85;
            }
            50% {
              transform: scale(1.08);
              opacity: 1;
            }
          }

          @keyframes bgGlow {
            0%, 100% {
              opacity: 0.3;
              transform: scale(1);
            }
            50% {
              opacity: 0.5;
              transform: scale(1.1);
            }
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(3px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          /* Custom Scrollbar */
          div::-webkit-scrollbar {
            width: 4px; /* Thinner scrollbar */
          }
          
          div::-webkit-scrollbar-track {
            background: transparent;
          }
          
          div::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #4fc3f7, #29b6f6);
            border-radius: 8px;
            transition: background 0.3s ease;
          }
          
          div::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, #29b6f6, #0288d1);
          }
        `}</style>
      </div>
    </>
  );
}
