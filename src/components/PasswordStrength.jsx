import { useEffect, useMemo, useState } from 'react';

const PasswordStrength = ({ password = '' }) => {
  const [strength, setStrength] = useState(0);
  const [feedback, setFeedback] = useState('');

  const calculateStrength = useMemo(() => (pass) => {
    if (!pass || typeof pass !== 'string' || pass.length === 0) {
      return { score: 0, feedback: [] };
    }
    
    let score = 0;
    const feedback = [];
    
    // Length check
    if (pass.length >= 8) score += 1;
    else feedback.push('Use at least 8 characters');
    
    // Lowercase check
    if (/[a-z]/.test(pass)) score += 1;
    else feedback.push('Add lowercase letters');
    
    // Uppercase check
    if (/[A-Z]/.test(pass)) score += 1;
    else feedback.push('Add uppercase letters');
    
    // Number check
    if (/[0-9]/.test(pass)) score += 1;
    else feedback.push('Add numbers');
    
    // Special character check
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    else feedback.push('Add special characters');

    return { score, feedback };
  }, []);

  useEffect(() => {
    const { score, feedback } = calculateStrength(password);
    setStrength(score);
    setFeedback(feedback.length > 0 ? `Try adding: ${feedback.join(', ')}` : 'Strong password!');
  }, [password, calculateStrength]);

  const getStrengthColor = () => {
    if (!password) return 'bg-gray-200';
    if (strength <= 1) return 'bg-red-500';
    if (strength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (!password) return '';
    if (strength <= 1) return 'Very Weak';
    if (strength <= 2) return 'Weak';
    if (strength <= 3) return 'Moderate';
    if (strength <= 4) return 'Strong';
    return 'Very Strong';
  };

  if (!password) return null;

  return (
    <div className="w-full mt-2">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Password Strength: {getStrengthText()}</span>
        <span>{strength * 20}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${getStrengthColor()} transition-all duration-300`}
          style={{ width: `${(strength / 5) * 100}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">{feedback}</p>
    </div>
  );
};

export default PasswordStrength;
