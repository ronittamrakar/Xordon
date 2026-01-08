import React from 'react';

const DebugSettings = () => {
  const handleClick = () => {
    console.log('DebugSettings clicked!');
    alert('DebugSettings clicked! React is working.');
  };

  const handleGoToSettings = () => {
    window.location.href = '/settings';
  };

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h1 style={{ color: '#333', marginBottom: '20px' }}>Debug Settings Page</h1>
        <p style={{ marginBottom: '30px' }}>This is a minimal React test page. If you can click these buttons, React is working.</p>
        
        <div style={{ marginBottom: '20px' }}>
          <button 
            onClick={handleClick}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              fontWeight: 'bold',
              color: 'white',
              backgroundColor: '#007bff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Test React Click
          </button>
          
          <button 
            onClick={handleGoToSettings}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              fontWeight: 'bold',
              color: 'white',
              backgroundColor: '#28a745',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Go to Settings
          </button>
        </div>
        
        <div style={{
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '5px',
          marginTop: '30px'
        }}>
          <h3>Debug Info:</h3>
          <p><strong>React:</strong> Working (this page is rendered with React)</p>
          <p><strong>Current URL:</strong> {window.location.href}</p>
          <p><strong>Timestamp:</strong> {new Date().toLocaleString()}</p>
        </div>
        
        <div style={{
          padding: '20px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '5px',
          marginTop: '20px'
        }}>
          <h3>If this page works but Settings doesn't:</h3>
          <ol>
            <li>The issue is with the UnifiedSettings component</li>
            <li>Check browser console for JavaScript errors</li>
            <li>There might be an infinite loop or error in the settings component</li>
            <li>Try clearing browser cache</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default DebugSettings;
