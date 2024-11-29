import { useState } from "react";

const generosColumns = ['Action', 'Adventure', 'Comedy', 'Crime', 'Family', 'Fantasy', 'Mystery', 'Sci-Fi', 'Thriller'];

const JuegoRecomendaciones = () => {
    const [juegos, setJuegos] = useState([]);
    const [recomendaciones, setRecomendaciones] = useState({});
    const [error, setError] = useState('');
    const [detalleJuego, setDetalleJuego] = useState(null);
    const [cargandoJuego, setCargandoJuego] = useState('');

    // Función para obtener las recomendaciones de juegos
    const obtenerRecomendaciones = async () => {
        if (juegos.length !== 3) {
            setError('Se deben ingresar exactamente 3 juegos');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/recomendar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ juegos }),
            });

            if (!response.ok) throw new Error('Error al obtener las recomendaciones');

            const data = await response.json();
            setRecomendaciones(data.recomendaciones || {});
            setError('');
        } catch (err) {
            setError('Hubo un error al obtener las recomendaciones.');
        }
    };

    // Función para obtener los detalles de un juego seleccionado
    const obtenerDetallesJuego = async (nombreJuego) => {
        setCargandoJuego(nombreJuego);
        try {
            const response = await fetch(`http://localhost:5000/juego/${nombreJuego}`);
            if (!response.ok) throw new Error('Error al obtener los detalles del juego');
    
            const data = await response.json();
            console.log('Detalles del juego:', data);  // Revisa la respuesta en la consola
    
            // Filtrar las categorías con valor `true`
            const categorias = Object.entries(data)
                .filter(([key, value]) => generosColumns.includes(key) && value === true)
                .map(([key]) => key);
    
            setDetalleJuego({
                nombre: nombreJuego,
                categorias,
                año: data.year || 'Información no disponible',
                descripcion: data.plot || 'No se encontró una descripción para este juego.',
                rating: data.rating || 'Sin calificación',
            });
            setError('');
        } catch (err) {
            setError('Hubo un error al obtener los detalles del juego.');
        } finally {
            setCargandoJuego('');
        }
    };


    // Función para manejar el cambio en los campos de entrada
    const handleInputChange = (e, index) => {
        const newJuegos = [...juegos];
        newJuegos[index] = e.target.value;
        setJuegos(newJuegos);
    };

    return (
        <div>
            <h1>Recomendaciones de Juegos</h1>
            {Array.from({ length: 3 }, (_, index) => (
                <div key={index}>
                    <input
                        type="text"
                        placeholder={`Juego ${index + 1}`}
                        value={juegos[index] || ''}
                        onChange={(e) => handleInputChange(e, index)}
                    />
                </div>
            ))}
            <button onClick={obtenerRecomendaciones}>Obtener Recomendaciones</button>

            {error && <p>{error}</p>}

            <h2>Recomendaciones y Similitudes:</h2>
            <div>
                {Object.keys(recomendaciones).length > 0 ? (
                    Object.keys(recomendaciones).map((metodo) => (
                        <div key={metodo}>
                            <h3>{metodo.toUpperCase()}</h3>
                            <ul>
                                {recomendaciones[metodo].map((similitud, index) => (
                                    <li
                                        key={index}
                                        onClick={() => obtenerDetallesJuego(similitud.juego_similar)}
                                        style={{ cursor: 'pointer', textDecoration: 'underline', color: 'blue' }}
                                    >
                                        {`Juego Similar: ${similitud.juego_similar}, Similitud: ${similitud.similitud}`}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))
                ) : (
                    <p>No hay recomendaciones disponibles.</p>
                )}
            </div>

            {cargandoJuego && <p>Cargando detalles de {cargandoJuego}...</p>}
            {detalleJuego && (
                <div>
                    <h2>Detalles del Juego:</h2>
                    <h3>{detalleJuego.nombre}</h3>
                    <p><strong>Categorías:</strong> {detalleJuego.categorias.join(', ') || 'No hay categorías disponibles'}</p>
                    <p><strong>Año:</strong> {detalleJuego.año}</p>
                    <p><strong>Descripción:</strong> {detalleJuego.descripcion}</p>
                    <p><strong>Rating:</strong> {detalleJuego.rating}</p>
                </div>
            )}
        </div>
    );
};

export default JuegoRecomendaciones;
