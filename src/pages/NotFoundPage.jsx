import React from "react";
import "../styles/components.css";

const NotFound = () => (
  <div className="notfound-container">
    <h1 className="notfound-title">404</h1>
    <h2 className="notfound-subtitle">Sayfa Bulunamadı</h2>
    <p className="notfound-desc">
      Üzgünüz, aradığınız sayfa mevcut değil veya taşınmış olabilir.
    </p>
    <a href="/login" className="notfound-link">
      Ana Sayfaya Dön
    </a>
  </div>
);

export default NotFound;
