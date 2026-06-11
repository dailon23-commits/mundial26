# Actualizaciones automaticas

La app esta preparada para actualizar partidos y resultados automaticamente sin meter el token de Football-Data dentro del movil.

## Arquitectura

1. GitHub Actions ejecuta `ingestion/sync-local-json.mjs` cada 15 minutos.
2. El script consulta Football-Data.org usando el secret `FOOTBALL_DATA_TOKEN`.
3. El script actualiza:

```txt
public/worldCupData.json
mobile/src/data/worldCupSeed.json
```

4. La app movil lee `EXPO_PUBLIC_WORLD_CUP_DATA_URL`.
5. Si hay internet, descarga ese JSON y lo guarda localmente.
6. Si no hay internet, usa la ultima copia guardada en el movil.

## Configuracion en GitHub

1. Sube el proyecto a GitHub.
2. En el repositorio, ve a `Settings` -> `Secrets and variables` -> `Actions`.
3. Crea este secret:

```txt
FOOTBALL_DATA_TOKEN=tu-token-real
```

4. Ve a `Actions` y ejecuta manualmente `Update World Cup Data` una primera vez.
5. Publica `public/worldCupData.json`.

## URL para la app

Puedes usar una URL raw de GitHub con esta forma:

```txt
https://raw.githubusercontent.com/TU_USUARIO/TU_REPO/main/public/worldCupData.json
```

Pon esa URL en:

```txt
mobile/.env
```

```txt
EXPO_PUBLIC_WORLD_CUP_DATA_URL=https://raw.githubusercontent.com/TU_USUARIO/TU_REPO/main/public/worldCupData.json
```

Despues reinicia Expo o reconstruye la app.

## Durante los partidos

El workflow corre cada 15 minutos. La app intenta descargar datos remotos cada 5 minutos como maximo, asi que normalmente veras resultados actualizados con unos minutos de retraso.

Football-Data puede limitar peticiones o retrasar datos segun su plan. Si quieres actualizacion mas agresiva durante partidos en vivo, cambia el cron del workflow, pero conviene respetar limites.
