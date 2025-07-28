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

  // CRITICAL: Prevent any scroll behavior
  useEffect(() => {
    // Lock the body scroll and prevent any auto-scrolling
    const preventScroll = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // Override all scroll functions
    const originalScrollTo = window.scrollTo;
    const originalScrollBy = window.scrollBy;
    const originalScrollIntoView = Element.prototype.scrollIntoView;

    window.scrollTo = () => {};
    window.scrollBy = () => {};
    Element.prototype.scrollIntoView = () => {};

    // Prevent scroll events
    window.addEventListener('scroll', preventScroll, { passive: false });
    document.addEventListener('scroll', preventScroll, { passive: false });

    return () => {
      // Restore original functions
      window.scrollTo = originalScrollTo;
      window.scrollBy = originalScrollBy;
      Element.prototype.scrollIntoView = originalScrollIntoView;
      
      window.removeEventListener('scroll', preventScroll);
      document.removeEventListener('scroll', preventScroll);
    };
  }, []);

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
      // Use requestAnimationFrame to ensure smooth scrolling within container only
      requestAnimationFrame(() => {
        transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
      });
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
      
      {/* FIXED CONTAINER - Never changes dimensions */}
      <div style={{
        width: '100vw',
        height: '100vh',
        maxWidth: '100vw',
        maxHeight: '100vh',
        minWidth: '100vw',
        minHeight: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        overflow: 'hidden',
        fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
        background: 'linear-gradient(145deg, #e1f5fe, #b3e5fc, #81d4fa, #4fc3f7, #29b6f6)',
        color: '#0277bd',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px',
        backgroundAttachment: 'fixed',
        boxSizing: 'border-box',
        zIndex: 1000,
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
          zIndex: -1,
          pointerEvents: 'none',
        }}></div>

        {/* Logo Section - Fixed Height */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '80px',
          flexShrink: 0,
          zIndex: 10,
        }}>
          <img 
            src="https://cdn-ilclclp.nitrocdn.com/uiuLNoPKqvsktnRsIDyDgFJzxCWoSfSE/assets/images/optimized/rev-1557504/protectingpatientrights.com/wp-content/uploads/2024/11/white-logo-1-1.webp"
            alt="Logo"
            style={{
              height: isMobile ? '40px' : '50px',
              width: 'auto',
              filter: 'drop-shadow(0 4px 12px rgba(2, 119, 189, 0.4))',
              maxWidth: '300px',
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

        {/* Main Content - Fixed Height */}
        <div style={{
          display: 'flex',
          gap: isMobile ? '15px' : '30px',
          width: '100%',
          maxWidth: '1000px',
          flexDirection: isMobile ? 'column' : 'row',
          zIndex: 10,
          height: isMobile ? 'calc(100vh - 200px)' : 'calc(100vh - 160px)',
          maxHeight: isMobile ? 'calc(100vh - 200px)' : 'calc(100vh - 160px)',
          minHeight: isMobile ? 'calc(100vh - 200px)' : 'calc(100vh - 160px)',
          overflow: 'hidden',
        }}>
          {/* Audio Sphere Section - Fixed Width */}
          <div style={{
            flex: isMobile ? '0 0 auto' : '0 0 300px',
            width: isMobile ? '100%' : '300px',
            height: isMobile ? '250px' : '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px',
            overflow: 'hidden',
          }}>
            <div 
              onClick={isCallActive ? stopCall : startCall}
              style={{
                width: isMobile ? '120px' : '160px',
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
                fontSize: isMobile ? '1.8rem' : '2.5rem',
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
                padding: isMobile ? '10px 20px' : '12px 30px',
                fontSize: isMobile ? '14px' : '16px',
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
              padding: isMobile ? '6px 12px' : '8px 15px',
              background: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(12px)',
              borderRadius: '30px',
              fontSize: isMobile ? '10px' : '12px',
              fontWeight: '600',
              color: '#0277bd',
              textAlign: 'center',
              width: isMobile ? '200px' : '250px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              flexShrink: 0,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}>
              {callStatus}
            </div>
          </div>

          {/* Transcript Section - ABSOLUTELY FIXED DIMENSIONS */}
          <div style={{
            flex: 1,
            height: '100%',
            maxHeight: '100%',
            minHeight: '100%',
            width: isMobile ? '100%' : 'calc(100% - 330px)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
          }}>
            <h2 style={{
              fontSize: isMobile ? '16px' : '20px',
              fontWeight: '800',
              color: '#0277bd',
              flexShrink: 0,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              textAlign: 'center',
              margin: '0 0 15px 0',
              height: '25px',
              lineHeight: '25px',
            }}>
              LIVE TRANSCRIPT
            </h2>
            
            <div 
              ref={transcriptRef}
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: isMobile ? '12px' : '14px',
                lineHeight: '1.4',
                color: '#0277bd',
                fontWeight: '600',
                overflowY: 'auto',
                overflowX: 'hidden',
                flex: 1,
                paddingRight: '6px',
                scrollBehavior: 'smooth',
                letterSpacing: '0.2px',
                
                // CRITICAL: Absolutely fixed height
                height: 'calc(100% - 40px)',
                maxHeight: 'calc(100% - 40px)',
                minHeight: 'calc(100% - 40px)',
                position: 'relative',
                contain: 'strict',
                isolation: 'isolate',
              }}
            >
              {transcript ? (
                <div style={{ 
                  animation: 'fadeIn 0.5s ease-in',
                  height: 'auto',
                  minHeight: '100%',
                }}>
                  {transcript.split('\n\n').map((line, index) => (
                    <div
                      key={index}
                      style={{
                        marginBottom: '8px',
                        padding: isMobile ? '6px 8px' : '8px 12px',
                        borderRadius: '12px',
                        background: line.startsWith('👩 Gabbi')
                          ? 'rgba(79, 195, 247, 0.3)'
                          : 'rgba(41, 182, 246, 0.2)',
                        maxWidth: '90%',
                        alignSelf: line.startsWith('👩 Gabbi') ? 'flex-start' : 'flex-end',
                        boxShadow: '0 2px 6px rgba(41, 182, 246, 0.2)',
                        display: 'inline-block',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
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
                  marginTop: '50px',
                  fontSize: isMobile ? '11px' : '13px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  YOUR CONVERSATION WILL APPEAR HERE IN REAL-TIME...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Powered by Text - Fixed Position */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '40px',
          flexShrink: 0,
          zIndex: 10,
        }}>
          <div style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: isMobile ? '9px' : '11px',
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
            width: 4px;
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

          /* CRITICAL: Prevent any scroll behavior in the iframe */
          html, body {
            overflow: hidden !important;
            height: 100vh !important;
            max-height: 100vh !important;
            position: fixed !important;
            width: 100vw !important;
            max-width: 100vw !important;
          }
        `}</style>
      </div>
    </>
  );
}
