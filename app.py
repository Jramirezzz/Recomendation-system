from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity, euclidean_distances
from sklearn.preprocessing import StandardScaler
from scipy.spatial.distance import correlation
import difflib

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

df = pd.read_csv("imdb-videogames.csv")
df['name_normalized'] = df['name'].str.lower().str.strip()

generos_columns = ['Action', 'Adventure', 'Comedy', 'Crime', 'Family', 'Fantasy', 'Mystery', 'Sci-Fi', 'Thriller']
for col in generos_columns:
    df[col] = df[col].astype(bool)

scaler = StandardScaler()
caracteristicas_normalizadas = scaler.fit_transform(df[generos_columns])

def obtener_titulo_sugerido(titulo_ingresado, lista_titulos, cutoff=0.4):
    return difflib.get_close_matches(titulo_ingresado.lower(), lista_titulos, n=1, cutoff=cutoff)

def calcular_similitud(metodo, caracteristicas_recomendadas, caracteristicas_normalizadas):
    if metodo == 'coseno':
        return cosine_similarity(caracteristicas_recomendadas, caracteristicas_normalizadas)
    elif metodo == 'pearson':
        return np.array([[1 - correlation(caracteristicas_recomendadas[0], row) for row in caracteristicas_normalizadas]])
    elif metodo == 'euclidea':
        return 1 / (1 + euclidean_distances(caracteristicas_recomendadas, caracteristicas_normalizadas))

def procesar_recomendaciones(juegos_recomendados):
    juegos_filtrados = df[df['name_normalized'].isin(juegos_recomendados)]
    perfil_combinado = juegos_filtrados[generos_columns].mean(axis=0).values.reshape(1, -1)
    perfil_combinado_normalizado = scaler.transform(perfil_combinado)

    recomendaciones = {}
    for metodo in ['coseno', 'pearson', 'euclidea']:
        similitudes = calcular_similitud(metodo, perfil_combinado_normalizado, caracteristicas_normalizadas)
        indices_similares = np.argsort(similitudes[0])[::-1][1:4]
        recomendaciones[metodo] = [
            {
                "juego_similar": df.iloc[idx]['name'],
                "similitud": round(similitudes[0][idx], 3)
            }
            for idx in indices_similares
        ]
    return recomendaciones

@app.route('/recomendar', methods=['POST'])
def recomendar():
    data = request.json
    juegos = data.get('juegos', [])
    if len(juegos) != 3:
        return jsonify({"error": "Se deben ingresar exactamente 3 juegos."}), 400

    recomendaciones = []
    for juego in juegos:
        titulos = obtener_titulo_sugerido(juego, df['name_normalized'])
        if titulos:
            recomendaciones.append(titulos[0])

    if len(recomendaciones) < 3:
        return jsonify({"error": "No se encontraron coincidencias suficientes."}), 400

    resultados = procesar_recomendaciones(recomendaciones)
    return jsonify({"recomendaciones": resultados})

@app.route('/juego/<nombre>', methods=['GET'])
def obtener_detalles_juego(nombre):
    juego = df[df['name_normalized'] == nombre.lower()]
    if juego.empty:
        return jsonify({"error": "Juego no encontrado"}), 404

    juego_detalle = juego.iloc[0].to_dict()

    # Asegurarse de que los campos 'year' y 'plot' existan
    juego_detalle['year'] = juego_detalle.get('year', 'Información no disponible')
    juego_detalle['plot'] = juego_detalle.get('plot', 'No se encontró una descripción para este juego.')

    return jsonify(juego_detalle)


if __name__ == '__main__':
    app.run(debug=True)