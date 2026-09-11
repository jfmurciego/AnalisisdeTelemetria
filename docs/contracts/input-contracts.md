# Contratos de entrada

## Telemetría Car Scanner

| Campo | Tipo | Regla |
|---|---|---|
| `SECONDS` | número | Monótono dentro de sesión |
| `PID` | texto | Identificador del sensor |
| `VALUE` | número | Valor bruto, sin imputación |
| `UNITS` | texto | Unidad original |
| `LATITUDE` | número opcional | WGS84 |
| `LONGITUDE` o `LONGTITUDE` | número opcional | WGS84; se admite el error histórico de Car Scanner |

## Vía

Eje ordenado con `distance_m`, `latitude`, `longitude`, `elevation_m`, procedencia y versión. La elevación debe filtrarse antes de calcular pendiente; la ventana es parámetro, no constante oculta.

## Vehículo

Identificador de perfil, combustible, transmisión, neumáticos, masa de ensayo, relaciones disponibles y catálogo PID con convención de signo. Los valores que varían entre viajes pertenecen a la sesión, no al perfil maestro.

## Clima

Observaciones o previsiones con tiempo, posición o celda, viento medio y racha, dirección, temperatura, precipitación, presión, proveedor y hora de emisión.

## Tráfico

Segmento vial, intervalo temporal, velocidad observada, velocidad libre, incidencia, confianza y proveedor.

## Salida waypoint

Cada punto incluye posición, progresiva, acción, objetivo opcional, evidencia, confianza y versiones de software, fórmula y modelo.
