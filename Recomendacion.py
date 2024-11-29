from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity, euclidean_distances
from sklearn.preprocessing import StandardScaler
from scipy.spatial.distance import correlation
import difflib

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "*"}})

df = pd.read_csv("imdb-videogames.csv")
df['name_normalized'] = df['name'].str.lower().str.strip()

generos_columns = ['Action', 'Adventure', 'Comedy', 'Crime', 'Family', 'Fantasy', 'Mystery', 'Sci-Fi', 'Thriller']

for col in generos_columns:
    df[col] = df[col].astype(bool)

scaler = StandardScaler()
caracteristicas_normalizadas = scaler.fit_transform(df[generos_columns])
def obtener_titulo_sugerido(titulo_ingresado, lista_titulos, cutoff=0.4):
    titulos_similares = difflib.get_close_matches(titulo_ingresado.lower(), lista_titulos, n=5, cutoff=cutoff)
    if titulos_similares:
        return [titulos_similares[0]]
    else:
        return []

def calcular_similitud(metodo, caracteristicas_recomendadas, caracteristicas_normalizadas):
    if metodo == 'coseno':
        return cosine_similarity(caracteristicas_recomendadas, caracteristicas_normalizadas)
    elif metodo == 'pearson':
        similitudes_pearson = []
        for i in range(len(caracteristicas_recomendadas)):
            similitudes_pearson.append([1 - correlation(caracteristicas_recomendadas[i], row) for row in caracteristicas_normalizadas])
        return np.array(similitudes_pearson)
    elif metodo == 'euclidea':
        return 1 / (1 + euclidean_distances(caracteristicas_recomendadas, caracteristicas_normalizadas))

def procesar_recomendaciones(juegos_recomendados):
    juegos_filtrados = df[df['name_normalized'].isin(juegos_recomendados)]
    caracteristicas_recomendadas = juegos_filtrados[generos_columns]

    perfil_combinado = caracteristicas_recomendadas.mean(axis=0).values.reshape(1, -1)
    
    perfil_combinado_normalizado = scaler.transform(perfil_combinado)

    recomendaciones = {}

    for metodo in ['coseno', 'pearson', 'euclidea']:
        similitudes = calcular_similitud(metodo, perfil_combinado_normalizado, caracteristicas_normalizadas)

        indices_similares = np.argsort(similitudes[0])[::-1][1:4]  

        recomendaciones_metodo = []
        for idx in indices_similares:
            recomendaciones_metodo.append({
                "juego_similar": df.iloc[idx]['name'],
                "similitud": round(similitudes[0][idx], 3),
                "generos": df.iloc[idx][generos_columns].to_dict()
            })

        recomendaciones[metodo] = recomendaciones_metodo

    return recomendaciones

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

    recomendaciones_resultado = procesar_recomendaciones(recomendaciones)

    return jsonify({"recomendaciones": recomendaciones_resultado})

if __name__ == '__main__':
    app.run(debug=True)
