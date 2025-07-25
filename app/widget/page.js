'use client';

import React, { useState, useEffect } from 'react';
import { RetellWebClient } from 'retell-client-js-sdk';

export default function Widget() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [callStatus, setCallStatus] = useState('READY TO TALK');
  const [retellWebClient, setRetellWebClient] = useState(null);

  useEffect(() => {
    const client = new RetellWebClient();
    setRetellWebClient(client);

    client.on("call_started", () => {
      console.log("call started");
      setCallStatus('LISTENING...');
      setIsCallActive(true);
    });

    client.on("call_ended", () => {
      console.log("call ended");
      setCallStatus('CALL ENDED');
      setIsCallActive(false);
      setTimeout(() => setCallStatus('READY TO TALK'), 3000);
    });

    client.on("error", (error) => {
      console.error("Retell error:", error);
      setCallStatus('ERROR - TRY AGAIN');
      setTimeout(() => setCallStatus('READY TO TALK'), 3000);
    });

    return () => {
      client.removeAllListeners();
    };
  }, []);

  const startCall = async () => {
    try {
      setCallStatus('CONNECTING...');
      
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
      } else {
        setCallStatus('CONNECTION FAILED');
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

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap" rel="stylesheet" />
      
      <div style={{
        fontFamily: "'Manrope', sans-serif",
        background: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        minHeight: '300px',
        width: '100%',
        maxWidth: '400px',
        margin: '0 auto',
      }}>
        {/* Audio Sphere */}
        <div 
          onClick={isCallActive ? stopCall : startCall}
          style={{
            width: '160px',
            height: '160px',
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
            fontSize: '2.5rem',
            animation: isCallActive 
              ? 'pulse 1s infinite ease-in-out' 
              : 'pulse 2.5s infinite ease-in-out',
            border: '3px solid rgba(255, 255, 255, 0.3)',
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
                width: '200px',
                height: '200px',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '50%',
                animation: 'audioWave 2s ease-in-out infinite',
              }}></div>
              <div style={{
                position: 'absolute',
                width: '240px',
                height: '240px',
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
            marginTop: '20px',
            padding: '12px 30px',
            fontSize: '16px',
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
            minWidth: '140px',
          }}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >
          {isCallActive ? 'END CALL' : 'TALK TO GABBI'}
        </button>

        {/* Status */}
        <div style={{
          marginTop: '15px',
          padding: '8px 20px',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: '600',
          color: '#0277bd',
          textAlign: 'center',
          border: '1px solid rgba(41, 182, 246, 0.2)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          minWidth: '160px',
          boxShadow: '0 2px 10px rgba(41, 182, 246, 0.1)',
        }}>
          {callStatus}
        </div>

        {/* Compact Branding */}
        <div style={{
          marginTop: '20px',
          fontSize: '11px',
          fontWeight: '600',
          color: 'rgba(2, 119, 189, 0.7)',
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
        `}</style>
      </div>
    </>
  );
}
