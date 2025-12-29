import React from 'react';

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen w-full bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
