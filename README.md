# Mundial26

Aplicacion personal/familiar para seguir el Mundial 2026 con almacenamiento local en el movil, un script opcional de ingesta desde Football-Data.org y una app movil Expo con estetica oscura inspirada en FotMob.

## Stack elegido

- Ingesta: Node.js 20+
- App movil: React Native + Expo
- Base de datos/cache: AsyncStorage local en el dispositivo
- API externa: Football-Data.org v4

## Modo actual: sin servidor

La app ya no necesita PocketBase. Guarda los datos en el almacenamiento local del movil con `@react-native-async-storage/async-storage`.

Tambien puede sincronizar desde una URL JSON publica si configuras `EXPO_PUBLIC_WORLD_CUP_DATA_URL`. Ese modo mantiene la app offline-first: descarga resultados cuando hay internet y conserva la ultima copia en el movil.

## Fase 1: Datos locales

No necesitas crear colecciones. Los datos viven en:

```txt
mobile/src/data/worldCupSeed.json
```

La primera vez que abres la app, ese archivo se copia al almacenamiento local del dispositivo. Luego los cambios hechos dentro de la app, como editar el canal de TV, quedan guardados en ese dispositivo.

## Fase 2: Script de ingesta local

El script recomendado sin servidor esta en `ingestion/sync-local-json.mjs`.

### Configuracion

```powershell
cd ingestion
copy .env.example .env
npm install
```

Edita `ingestion/.env` y agrega:

```txt
FOOTBALL_DATA_TOKEN=tu-token-football-data
FOOTBALL_DATA_COMPETITION=WC
```

Ejecuta:

```powershell
npm run sync:local
```

Esto escribe el calendario en:

```txt
mobile/src/data/worldCupSeed.json
public/worldCupData.json
```

Luego reconstruye o reinicia la app para que el seed actualizado quede disponible. Si ya habias abierto la app antes, puedes llamar a `resetWorldCupData()` desde una futura pantalla de ajustes para recargar el seed.

### Actualizacion automatica con GitHub Actions

El workflow `.github/workflows/update-world-cup-data.yml` puede actualizar los datos cada 15 minutos.

Pasos:

1. Sube este proyecto a GitHub.
2. En el repo, ve a `Settings` -> `Secrets and variables` -> `Actions`.
3. Crea el secret `FOOTBALL_DATA_TOKEN` con tu token de Football-Data.org.
4. Activa GitHub Pages o usa la URL raw del archivo `public/worldCupData.json`.
5. En `mobile/.env`, pon:

```txt
EXPO_PUBLIC_WORLD_CUP_DATA_URL=https://TU_URL_PUBLICA/worldCupData.json
```

Cuando la app se abra o vuelva a cargar datos, intentara sincronizar esa URL como maximo cada 5 minutos.

Recomendacion practica:

- Cada 6-12 horas antes del torneo.
- Cada 1-5 minutos durante partidos en vivo, respetando limites de Football-Data.org.

## Fase 3: App movil

Codigo en `mobile`.

### Configuracion

```powershell
cd mobile
copy .env.example .env
npm install
npm start
```

No hace falta configurar URL de servidor.

Opcional, para resultados automaticos:

```txt
EXPO_PUBLIC_WORLD_CUP_DATA_URL=https://TU_URL_PUBLICA/worldCupData.json
```

La app tiene:

- Pestaña `Partidos`: partidos agrupados por fecha, equipos, banderas, marcador, estado y TV.
- Pestaña `Clasificacion`: tabla calculada desde resultados finalizados por grupo A-H.
- Modo oscuro nativo con tarjetas, separadores suaves e indicador `LIVE`.
- Edicion local del canal de TV tocando una tarjeta de partido.

## Verlo desde cualquier parte

El almacenamiento local sirve sin servidor, pero cada movil tiene su propia copia. Para compartir los mismos resultados entre moviles, publica `public/worldCupData.json` en una URL estable y configura `EXPO_PUBLIC_WORLD_CUP_DATA_URL` antes de construir la app.

La guia completa esta en `AUTOMATIC_UPDATES.md`.

## Fuentes usadas

- Football-Data.org API v4: https://www.football-data.org/documentation/api
