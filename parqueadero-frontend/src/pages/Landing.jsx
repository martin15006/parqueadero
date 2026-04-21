import { useNavigate } from "react-router-dom";

export default function Landing() {
    const navigate = useNavigate();

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #2b2ba3 0%, #3737a3 50%, #2688ff 100%)' }}>
            {/* Navbar simple  */}
            <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px' }}>
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.4rem' }}>
                    Parqueadero
                </span>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => navigate('/login')}
                        style={{ padding: '8px 24px', borderRadius: '8px', border: '2px solid white', background: 'transparent', color: 'white', cursor: 'pointer', fontWeight: '600' }}>
                        Iniciar Sesion
                    </button>
                    <button onClick={() => navigate('/register')}
                        style={{ padding: '8px 24px', borderRadius: '8px', border: 'none', background: '#4361ee', color: 'white', cursor: 'pointer', fontWeight: '600' }}>
                        Registrarse
                    </button>
                </div>
            </nav>

            <div style={{ textAlign: 'center', padding: '80px 40px 60px' }}>
                <div style={{
                    fontSize: 'clamp(2rem,6.3vw,4rem)',
                    marginBottom: '24px',
                    color: 'white',
                    letterSpacing: '8px',
                    wordBreak: 'break-word',
                    textAlign: 'center'
                }}>
                    🄿🄰🅁🅀🅄🄴🄰🄳🄴🅁🄾
                </div>
                <h1 style={{ color: 'white', fontSize: '3rem', fontWeight: 'bold', marginBottom: '16px', lineHeight: 1.2, padding: '1rem' }}>
                    Sistema de Gestion <br /> de Parqueadero
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.2rem', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
                    Control inteligente de entradas y salidas mediante código QR. Olvidate de los tramites en papel eso ya es cosa del pasado.
                </p>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => navigate('/register')}
                        style={{ padding: '14px 36px', borderRadius: '10px', border: 'none', background: '#4361ee', color: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '1.1rem' }}>
                        Comenzar ahora
                    </button>
                    <button onClick={() => navigate('/login')}
                        style={{ padding: '14px 36px', borderRadius: '10px', border: '2px solid rgba(255,255,255,0.5)', background: 'transparent', color: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '1.1rem' }}>
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
                    <div key={i} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '16px', padding: '32px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>{item.icon}</div>
                        <h3 style={{ color: 'white', marginBottom: '10px', fontSize: '1.1rem' }}>{item.titulo}</h3>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem', lineHeight: 1.6 }}>{item.desc}</p>
                    </div>
                ))}
            </div>

            {/* footer  */}
            <div style={{ textAlign: 'center', padding: '40px', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '40px' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
                    Sistema de parqueadero - Todos los derechos estan reservados
                </p>
                <p style={{ color: '#111', fontSize: '0.9rem' }}>
                    Hecho por martincito
                </p>
            </div>
        </div>
    );
}