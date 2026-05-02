import { useNavigate } from "react-router-dom";

export default function Landing() {
    const navigate = useNavigate();

    return (
        <div style={{ minHeight: '100vh', position: 'relative' }}>
            {/* Navbar simple  */}
            <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', background: 'linear-gradient(to bottom, rgba(10,6,8,0.9), transparent)', borderBottom: '1px solid var(--gold-dim)' }}>
                <span style={{ color: 'var(--gold)', fontWeight: 'bold', fontSize: '1.4rem', fontFamily: 'var(--font-title)' }}>
                    PARQUEADERO
                </span>
                <div style={{ display: 'flex', gap: '12px' }}>

                    <button
                        className="btn"
                        onClick={() => navigate('/login')}
                        style={{
                            clipPath: 'none',
                            borderRadius: '20px',
                            border: '1px solid rgba(201,168,76,0.4)',
                            color: 'var(--gold)',
                            background: 'linear-gradient(135deg, #bdb6a4ff, #9e937aff)',
                        }}
                    >
                        Iniciar Sesión
                    </button>

                    <button
                        className="btn"
                        onClick={() => navigate('/register')}
                        style={{
                            clipPath: 'none',
                            borderRadius: '20px',
                            border: '1px solid rgba(201,168,76,0.4)',
                            color: 'var(--gold)',
                            background: 'linear-gradient(135deg, #bdb6a4ff, #9e937aff)',
                        }}
                    >
                        Registrarse
                    </button>

                </div>
            </nav>

            <div style={{ textAlign: 'center', padding: '80px 40px 60px' }}>
                <div className="glyph-divider"><span>ᛟ</span></div>
                <div style={{
                    fontSize: 'clamp(2rem,6.3vw,4rem)',
                    marginBottom: '24px',
                    color: 'var(--gold)',
                    letterSpacing: '8px',
                    fontFamily: 'var(--font-title)',
                    textShadow: '0 0 20px rgba(201,168,76,0.4)'
                }}>
                    PARQUEADERO
                </div>
                <h1 style={{ color: 'var(--text-body)', fontSize: '3rem', fontWeight: 'bold', marginBottom: '16px', lineHeight: 1.2, padding: '1rem', fontFamily: 'var(--font-title)' }}>
                    SISTEMA DE GESTIÓN <br /> DE PARQUEADERO
                </h1>
                <div className="glyph-divider" style={{ marginBottom: '2rem' }}><span>✦</span></div>
                <p style={{ color: 'var(--text-dim)', fontSize: '1.2rem', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px', fontStyle: 'italic' }}>
                    Control inteligente de entradas y salidas mediante código QR. Olvidate de los tramites en papel eso ya es cosa del pasado.
                </p>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" onClick={() => navigate('/register')} style={{ padding: '14px 36px', fontSize: '1.1rem', borderRadius: '20px' }}>
                        Comenzar ahora
                    </button>
                    <button className="btn" onClick={() => navigate('/login')} style={{ padding: '14px 36px', fontSize: '1.1rem', borderRadius: '20px' }}>
                        Ya tengo cuenta
                    </button>
                </div>
            </div>

            {/* caracteristicas */}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', padding: '40px', maxWidth: '1100px', margin: '0 auto' }}>
                {[
                    { icon: '📱', titulo: 'Codigo QR personal', desc: 'Cada vehiculo tiene su propio QR. El celador lo escanea desde su celular en segundos.' },
                    { icon: '🔒', titulo: 'Acceso Seguto', desc: 'Sistema de roles: Administrador, Celador y Usuarios. Cada uno con sus permisos. ' },
                    { icon: '📊', titulo: 'Estadisticas', desc: 'Panel administrativo con historial, graficas y reportes exportables en Excel y PDF.' },
                    { icon: '🚶', titulo: 'Visitantes', desc: 'Registros temparales para lo visitantes con QR de un solo uso generado por el administrador.' },
                ].map((item, i) => (
                    <div key={i} className="card">
                        <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>{item.icon}</div>
                        <h3 style={{ color: 'var(--gold)', marginBottom: '10px', fontSize: '1.2rem', fontFamily: 'var(--font-heading)' }}>{item.titulo}</h3>
                        <p style={{ color: 'var(--text-dim)', fontSize: '1rem', lineHeight: 1.6 }}>{item.desc}</p>
                    </div>
                ))}
            </div>

            {/* footer  */}
            <div style={{ textAlign: 'center', padding: '40px', borderTop: '1px solid var(--gold-dim)', marginTop: '40px', background: 'var(--void)' }}>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', fontFamily: 'var(--font-body)' }}>
                    Sistema de parqueadero - Todos los derechos estan reservados
                </p>
                <p style={{ color: 'var(--gold-dim)', fontSize: '0.9rem', marginTop: '8px', fontFamily: 'var(--font-heading)' }}>
                    HECHO POR MARTINCITO
                </p>
            </div>
        </div>
    );
}