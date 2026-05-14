import { useState, useEffect, use } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Configuracion() {
    const navigate = useNavigate();
    const [fontSize, setFontSize] = useState(() => localStorage.getItem('fontSize') || 'normal');
    const [modoClaro, setModoClaro] = useState(() => localStorage.getItem('tema') === 'claro');
    const [exito, setExito] = useState('');

    useEffect(() => {
        if (!localStorage.getItem('token')) { navigate('/login'); return; }
        aplicarFuente(fontSize);
    }, []);

    const aplicarFuente = (size) => {
        const tamaños = { pequeño: '14px', normal: '16px', grande: '18px' };
        document.documentElement.style.fontSize = tamaños[size] || '16px;'
    };

    const guardar = () => {
        localStorage.setItem('fontSize', fontSize);
        localStorage.setItem('tema', modoClaro ? 'claro' : 'oscuro');
        aplicarFuente(fontSize);
        if (modoClaro) {
            document.body.classList.add('light-mode');
        } else {
            document.body.classList.remove('light-mode');
        }
        setExito('Configuración guardada');
        setTimeout(() => setExito(''), 3000);
    };

    return (
        <>
            <Navbar />
            <div className="pagina">
                <div className="glyph-divider"><span>ᛟ</span></div>
                <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Configuración</h1>
                <div className="glyph-divider"><span>✦</span></div>

                {exito && <div className="alerta alerta-exito">{exito}</div>}

                <div className="card">
                    <h3 style={{ marginBottom: '20px' }}>Apariencia</h3>

                    <div className="form-grupo">
                        <label>Tema</label>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                            {[
                                { valor: false, label: '🌙 Modo Oscuro' },
                                { valor: true, label: '☀️ Modo Claro' }
                            ].map(op => (
                                <button key={String(op.valor)}
                                    className={`btn ${modoClaro == op.valor ? 'btn-primary' : ''}`}
                                    style={{ flex: 1 }}
                                    onClick={() => setModoClaro(op.valor)}>
                                    {op.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-grupo">
                        <label>Tamaño de fuente</label>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                            {[
                                { valor: 'pequeño', label: 'A pequeño' },
                                { valor: 'normal', label: 'B Normal' },
                                { valor: 'grande', label: 'C Grande' }
                            ].map(op => (
                                <button key={op.valor}
                                    className={`btn ${fontSize === op.valor ? 'btn-primary' : ''}`}
                                    style={{ flex: 1 }}
                                    onClick={() => { setFontSize(op.valor); aplicarFuente(op.valor); }}>
                                    {op.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button className="btn btn-success" onClick={guardar} style={{ marginTop: '8px', width: '100%' }}>
                        💾 Guardad Configuración 
                    </button>
                </div>
            </div>
        </>
    );
}