import React from 'react';
import { initialsOf } from '../../utils/profile';
import { UserIcon } from '../Icons/Icons';

/**
 * Foto do usuário (ou iniciais quando não há foto)
 */
const UserAvatar = ({ user, size = 38, className = '' }) => {
  const initials = initialsOf(user);

  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt=""
        width={size}
        height={size}
        className={`user-avatar-img ${className}`}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
      />
    );
  }

  return initials ? <span className={className}>{initials}</span> : <UserIcon size={Math.round(size / 2.1)} />;
};

export default UserAvatar;
