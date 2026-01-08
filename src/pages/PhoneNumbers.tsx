import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PhoneNumbers = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check hash for legacy tab links
    const hash = window.location.hash.replace('#', '').toLowerCase();

    if (hash === 'overview') {
      navigate('/reach/numbers/overview', { replace: true });
    } else if (hash === 'provisioning') {
      navigate('/reach/numbers/provisioning', { replace: true });
    } else if (hash === 'calls') {
      navigate('/reach/calls/logs', { replace: true });
    } else if (hash === 'voicemails') {
      navigate('/reach/inbound/calls/voicemails', { replace: true });
    } else if (hash === 'sms') {
      navigate('/reach/inbound/calls/sms', { replace: true });
    } else {
      navigate('/reach/numbers', { replace: true });
    }
  }, [navigate]);

  return null;
};

export default PhoneNumbers;
