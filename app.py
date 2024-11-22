from flask import Flask, request, jsonify
from flask_cors import CORS
from Recomendacion import procesar_recomendaciones, obtener_titulo_sugerido, df

app = Flask(__name__)

# Habilitar CORS globalmente para todas las rutas y permitir solicitudes desde cualquier origen
CORS(app, resources={r"/recomendar": {"origins": "*"}}, supports_credentials=True)

@app.route('/recomendar', methods=['POST'])
def recomendar():
    data = request.json
    juegos = data.get('juegos', [])

    if len(juegos) != 3:
        return jsonify({"error": "Se deben ingresar exactamente 3 juegos."}), 400

    recomendaciones = []
    for juego in juegos:
        titulos_encontrados = obtener_titulo_sugerido(juego, df['name_normalized'])
        if titulos_encontrados:
            recomendaciones.append(titulos_encontrados[0])

    if len(recomendaciones) < 3:
        return jsonify({"error": "No se encontraron coincidencias suficientes."}), 400

    resultados = procesar_recomendaciones(recomendaciones)

    return jsonify(resultados)

@app.route('/juego/<nombre>', methods=['GET'])
def obtener_detalles_juego(nombre):
    juego = df[df['name_normalized'] == nombre.lower()]
    
    if juego.empty:
        return jsonify({"error": "Juego no encontrado"}), 404
    
    detalles = juego.iloc[0].to_dict()
    
    return jsonify(detalles)

@app.route('/recomendar', methods=['OPTIONS'])
def handle_options():
    response = jsonify()
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    return response

if __name__ == '__main__':
    app.run(debug=True)
