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
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

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
      console.log('Manually stopping call...');
      if (retellWebClient && isCallActive) {
        await retellWebClient.stopCall();
        setCallStatus('Call Ended');
        setIsCallActive(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        setTimeout(() => {
          setCallStatus('Call Gabbi');
          setShowMessages(false);
          setMessages([]);
        }, 2000);
      }
    } catch (error) {
      console.error('Error stopping call:', error);
      setCallStatus('Call Ended');
      setIsCallActive(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setTimeout(() => {
        setCallStatus('Call Gabbi');
        setShowMessages(false);
        setMessages([]);
      }, 2000);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      
      {/* ABSOLUTE POSITIONED ROOT - COMPLETELY ISOLATED FROM PAGE FLOW */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '450px',
        height: '740px',
        maxWidth: '450px',
        maxHeight: '740px',
        minWidth: '450px',
        minHeight: '740px',
        overflow: 'hidden',
        fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, sans-serif",
        background: 'transparent',
        pointerEvents: 'auto',
        zIndex: 1,
        /* Hardware acceleration for smooth rendering */
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        perspective: '1000px',
        willChange: 'contents',
      }}>
        
        {/* PHONE POSITIONED ABSOLUTELY WITHIN THE 450x740 CONTAINER */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: isLoaded 
            ? 'translate(-50%, -50%) translateY(-10px) scale(1) translateZ(0)' 
            : 'translate(-50%, -50%) translateY(10px) scale(0.95) translateZ(0)',
          width: '320px',
          height: '640px',
          opacity: isLoaded ? 1 : 0,
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          backfaceVisibility: 'hidden',
        }}>
          
          {/* iPhone Frame */}
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(145deg, #1c1c1e, #2c2c2e)',
            borderRadius: '45px',
            padding: '8px',
            boxShadow: '0 35px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            position: 'relative',
            border: '2px solid #3a3a3c',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
          }}>
            
            {/* iPhone Screen */}
            <div style={{
              width: '100%',
              height: '100%',
              background: isCallActive ? '#000000' : 'linear-gradient(180deg, #f2f2f7, #ffffff)',
              borderRadius: '37px',
              overflow: 'hidden',
              position: 'relative',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
            }}>
              
              {/* Status Bar - FIXED HEIGHT */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '44px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 20px 0 20px',
                color: isCallActive ? '#ffffff' : '#000000',
                fontSize: '14px',
                fontWeight: '600',
                zIndex: 10,
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden',
              }}>
                <div>9:41</div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <div style={{ width: '18px', height: '10px', border: `1px solid ${isCallActive ? '#ffffff' : '#000000'}`, borderRadius: '2px', position: 'relative' }}>
                    <div style={{ width: '14px', height: '6px', background: isCallActive ? '#ffffff' : '#000000', borderRadius: '1px', margin: '1px' }}></div>
                  </div>
                </div>
              </div>

              {/* MAIN CONTENT AREA - ABSOLUTE POSITIONED */}
              <div style={{
                position: 'absolute',
                top: '44px',
                left: 0,
                right: 0,
                bottom: '13px', // Leave space for home indicator
                overflow: 'hidden',
                background: isCallActive ? 'linear-gradient(180deg, #1c1c1e, #000000)' : 'transparent',
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden',
              }}>

                {!isCallActive && !showMessages ? (
                  /* Contact Screen - ABSOLUTELY POSITIONED */
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    padding: '20px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden',
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
                      transform: 'translateZ(0)',
                      backfaceVisibility: 'hidden',
                    }}>
                      <img 
                        src="https://storage.googleapis.com/msgsndr/Gyvgsd99IT2dSJS5bwiK/media/6884ce07546316a66b110f2e.jpeg"
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
                      transform: 'translateZ(0)',
                      backfaceVisibility: 'hidden',
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
                      transform: 'translateZ(0)',
                      backfaceVisibility: 'hidden',
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
                        background: 'linear-gradient(135deg, #00E676, #00C853, #00B248)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 20px 40px rgba(0, 230, 118, 0.4), 0 0 30px rgba(0, 230, 118, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.2)',
                        marginBottom: '25px',
                        animation: 'modernCallPulse 3s ease-in-out infinite',
                        position: 'relative',
                        border: '3px solid rgba(255, 255, 255, 0.15)',
                        transform: 'translateZ(0)',
                        backfaceVisibility: 'hidden',
                      }}
                    >
                      {/* Glowing rings */}
                      <div style={{
                        position: 'absolute',
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        border: '2px solid rgba(0, 230, 118, 0.4)',
                        animation: 'glowRing 2s ease-in-out infinite',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%) translateZ(0)',
                        pointerEvents: 'none',
                      }}></div>
                      
                      <div style={{
                        position: 'absolute',
                        width: '140px',
                        height: '140px',
                        borderRadius: '50%',
                        border: '1px solid rgba(0, 230, 118, 0.2)',
                        animation: 'glowRing 2s ease-in-out infinite 0.5s',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%) translateZ(0)',
                        pointerEvents: 'none',
                      }}></div>

                      {/* Phone icon */}
                      <svg
                        width="36"
                        height="36"
                        viewBox="0 0 24 24"
                        fill="none"
                        style={{
                          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
                          position: 'relative',
                          zIndex: 2,
                          pointerEvents: 'none',
                          transform: 'translateZ(0)',
                        }}
                      >
                        <path
                          d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
                          fill="white"
                        />
                      </svg>
                    </div>

                    <div style={{
                      fontSize: '20px',
                      color: '#34c759',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      textShadow: '0 2px 8px rgba(52, 199, 89, 0.3)',
                      animation: 'callTextGlow 2s ease-in-out infinite alternate',
                      transform: 'translateZ(0)',
                      backfaceVisibility: 'hidden',
                    }}>
                      {callStatus}
                    </div>
                  </div>
                ) : (
                  /* Call Active Screen - ABSOLUTELY POSITIONED WITH FIXED LAYOUT */
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden',
                  }}>
                    
                    {/* Call Header - FIXED HEIGHT */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '200px', // Fixed height
                      padding: '20px',
                      textAlign: 'center',
                      color: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: 'translateZ(0)',
                      backfaceVisibility: 'hidden',
                    }}>
                      <div style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #4fc3f7, #29b6f6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '15px',
                        animation: 'callPulse 2s ease-in-out infinite',
                        overflow: 'hidden',
                        border: '3px solid rgba(255, 255, 255, 0.3)',
                        transform: 'translateZ(0)',
                        backfaceVisibility: 'hidden',
                      }}>
                        <img 
                          src="https://storage.googleapis.com/msgsndr/Gyvgsd99IT2dSJS5bwiK/media/6884ce07546316a66b110f2e.jpeg"
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
                        transform: 'translateZ(0)',
                        backfaceVisibility: 'hidden',
                      }}>
                        GABBI
                      </h3>
                      
                      <div style={{
                        fontSize: '16px',
                        color: '#8e8e93',
                        marginBottom: '8px',
                        transform: 'translateZ(0)',
                        backfaceVisibility: 'hidden',
                      }}>
                        {callStatus}
                      </div>

                      <div style={{
                        fontSize: '18px',
                        color: '#ffffff',
                        fontWeight: '500',
                        transform: 'translateZ(0)',
                        backfaceVisibility: 'hidden',
                      }}>
                        {formatTime(callDuration)}
                      </div>
                    </div>

                    {/* Messages During Call - ANTI-FLICKER OPTIMIZED */}
                    <div style={{
                      position: 'absolute',
                      top: '220px',
                      left: '15px',
                      right: '15px',
                      height: '180px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px', // Reduced gap for smoother appearance
                      flexShrink: 0,
                      boxSizing: 'border-box',
                      /* Anti-flicker hardware acceleration */
                      transform: 'translateZ(0)',
                      backfaceVisibility: 'hidden',
                      perspective: '1000px',
                      willChange: 'contents',
                      /* Smooth scrolling */
                      scrollBehavior: 'smooth',
                      /* Font optimization */
                      WebkitFontSmoothing: 'antialiased',
                      MozOsxFontSmoothing: 'grayscale',
                    }}>
                      {messages.map((message, index) => (
                        <div key={`${message.id || index}-${message.type}-${message.text?.substring(0, 10)}`} style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: message.type === 'user' ? 'flex-end' : 'flex-start',
                          marginBottom: '6px', // Reduced margin
                          /* Minimal animation to prevent flicker */
                          animation: 'messageSlideIn 0.1s ease-out', 
                          /* Hardware acceleration */
                          transform: 'translateZ(0)',
                          backfaceVisibility: 'hidden',
                          /* Text optimization */
                          WebkitFontSmoothing: 'antialiased',
                          MozOsxFontSmoothing: 'grayscale',
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
                            /* Anti-flicker for text */
                            transform: 'translateZ(0)',
                            backfaceVisibility: 'hidden',
                            WebkitFontSmoothing: 'antialiased',
                            MozOsxFontSmoothing: 'grayscale',
                          }}>
                            {message.type === 'gabbi' && (
                              <div style={{
                                fontSize: '10px',
                                fontWeight: '600',
                                color: '#4fc3f7',
                                marginBottom: '2px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                transform: 'translateZ(0)',
                                backfaceVisibility: 'hidden',
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

                    {/* Call Controls - ABSOLUTELY POSITIONED AT BOTTOM */}
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '100px', // Fixed height
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      transform: 'translateZ(0)',
                      backfaceVisibility: 'hidden',
                    }}>
                      <div 
                        onClick={stopCall}
                        style={{
                          width: '70px',
                          height: '70px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #FF3B30, #FF453A, #D70015)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: '0 15px 30px rgba(255, 59, 48, 0.5), inset 0 2px 0 rgba(255, 255, 255, 0.2)',
                          border: '2px solid rgba(255, 255, 255, 0.15)',
                          transform: 'translateZ(0)',
                          backfaceVisibility: 'hidden',
                        }}
                      >
                        <svg
                          width="26"
                          height="26"
                          viewBox="0 0 24 24"
                          fill="none"
                          style={{
                            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
                            transform: 'rotate(135deg) translateZ(0)',
                          }}
                        >
                          <path
                            d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
                            fill="white"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Home Indicator - ABSOLUTELY POSITIONED */}
              <div style={{
                position: 'absolute',
                bottom: '8px',
                left: '50%',
                transform: 'translateX(-50%) translateZ(0)',
                width: '134px',
                height: '5px',
                background: isCallActive ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                borderRadius: '3px',
                backfaceVisibility: 'hidden',
              }}></div>
            </div>

            {/* iPhone Notch - ABSOLUTELY POSITIONED */}
            <div style={{
              position: 'absolute',
              top: '8px',
              left: '50%',
              transform: 'translateX(-50%) translateZ(0)',
              width: '100px',
              height: '25px',
              background: '#000000',
              borderRadius: '0 0 15px 15px',
              zIndex: 100,
              backfaceVisibility: 'hidden',
            }}></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes callPulse {
          0%, 100% {
            transform: scale(1) translateZ(0);
            opacity: 1;
          }
          50% {
            transform: scale(1.05) translateZ(0);
            opacity: 0.8;
          }
        }

        @keyframes modernCallPulse {
          0%, 100% {
            transform: scale(1) translateZ(0);
            box-shadow: 0 20px 40px rgba(0, 230, 118, 0.4), 0 0 0 0 rgba(0, 230, 118, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.2);
          }
          25% {
            transform: scale(1.03) translateZ(0);
            box-shadow: 0 25px 45px rgba(0, 230, 118, 0.5), 0 0 20px rgba(0, 230, 118, 0.4), inset 0 3px 0 rgba(255, 255, 255, 0.25);
          }
          50% {
            transform: scale(1.06) translateZ(0);
            box-shadow: 0 30px 50px rgba(0, 230, 118, 0.6), 0 0 35px rgba(0, 230, 118, 0.5), inset 0 4px 0 rgba(255, 255, 255, 0.3);
          }
          75% {
            transform: scale(1.03) translateZ(0);
            box-shadow: 0 25px 45px rgba(0, 230, 118, 0.5), 0 0 20px rgba(0, 230, 118, 0.4), inset 0 3px 0 rgba(255, 255, 255, 0.25);
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
            opacity: 0.8;
            transform: translateY(2px) translateZ(0);
          }
          to {
            opacity: 1;
            transform: translateY(0) translateZ(0);
          }
        }

        /* Optimized scrollbar */
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

        /* Global anti-flicker */
        * {
          -webkit-font-smoothing: antialiased !important;
          -moz-osx-font-smoothing: grayscale !important;
        }
      `}</style>
    </>
  );
}
