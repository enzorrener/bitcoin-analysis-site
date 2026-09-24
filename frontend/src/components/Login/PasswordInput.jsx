import React, { useState } from 'react';
import { EyeIcon, EyeOffIcon } from '../Icons/Icons';

/**
 * Campo de senha com botão para mostrar/ocultar
 */
const PasswordInput = ({ id, invalid, ...props }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`password-field ${invalid ? 'invalid' : ''}`}>
      <input id={id} type={visible ? 'text' : 'password'} aria-invalid={invalid || undefined} {...props} />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
      >
        {visible ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
      </button>
    </div>
  );
};

export default PasswordInput;
