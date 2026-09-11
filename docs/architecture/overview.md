# Arquitectura objetivo

## Principios

1. **Local primero:** la telemetría real no sale del dispositivo salvo decisión futura explícita.
2. **Origen inmutable:** conservar el archivo original fuera de Git y aplicar transformaciones reversibles.
3. **Tres procedencias:** cada campo es `measured`, `derived` o `external`.
4. **Ausencia honesta:** un valor inválido o no observado no se convierte en cero.
5. **Reproducibilidad:** resultado = entradas versionadas + configuración + fórmulas + software.
6. **Consejo explicable:** cada waypoint conserva evidencia, confianza y versión del modelo.

## Módulos

| Módulo | Responsabilidad | Salida |
|---|---|---|
| Adquisición | Leer telemetría, vía, clima y tráfico | Fuentes tipadas |
| Normalización | Unidades, nombres, tiempo y posición | Observación canónica |
| Calidad | Detectar corrupción, congelación y huecos | Datos válidos + flags |
| Alineación | Unir por reloj y por progresiva | Trayecto contextualizado |
| Analítica | Consumo, energía, gradiente y segmentos | Métricas trazables |
| Optimización | Comparar pasadas equivalentes | Rango eficiente validado |
| Waypoints | Traducir evidencia a anticipación | Itinerario explicable |
| Presentación | Explorar datos y ejecutar el flujo | Aplicación de navegador |

## Separación de planos

- **Plano de datos:** hechos y contexto.
- **Plano de cálculo:** reglas deterministas versionadas.
- **Plano de modelo:** inferencia estadística y confianza.
- **Plano de experiencia:** mapa, gráficos y controles.

Esta separación evita que la interfaz altere cálculos y permite recalcular un viaje histórico con una versión concreta.
