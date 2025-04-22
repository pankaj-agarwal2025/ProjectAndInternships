import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 text-center text-blue-600 py-4 text-sm mt-auto">
      Designed and Developed by <strong>Palak Jain</strong> and <strong>Purvi Singhal</strong> [B.Sc. CS & DS] | © {new Date().getFullYear()} Project and Internship Management Portal
    </footer>
  );
};

export default Footer;
