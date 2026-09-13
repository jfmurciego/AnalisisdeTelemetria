# Contratos de entrada

## Telemetría Car Scanner

Versión: `carscanner-long-v0.2.0`.

| Campo | Tipo | Regla |
|---|---|---|
| `SECONDS` | número | Obligatorio y finito; se conserva con su precisión original |
| `PID` | texto | Obligatorio; se resuelve contra catálogo sin eliminar PIDs desconocidos |
| `VALUE` | número | Obligatorio y finito; no se imputa durante la ingesta |
| `UNITS` | texto | Unidad original; se contrasta con el catálogo cuando el PID es conocido |
| `LATITUDE` | número opcional | WGS84 |
| `LONGITUDE` o `LONGTITUDE` | número opcional | WGS84; se admite el error histórico de Car Scanner |

El delimitador es punto y coma y se admiten campos entrecomillados, comillas escapadas, BOM UTF-8 y finales de línea CRLF o LF.

### Salida de la ingesta

La ingesta produce:

1. Registros largos válidos, sin alineación temporal implícita.
2. Inventario por PID: filas, unidades, mínimo, máximo, primer y último instante y divergencias de unidad.
3. Capacidades de sesión con estado `available`, `provisional` o `insufficient`.
4. Advertencias explícitas para ausencia de GPS, cobertura HV insuficiente o unidades incompatibles.

La presencia aislada de un PID no habilita una métrica. Voltaje y corriente HV necesitan al menos dos observaciones cada uno; aun entonces la energía es provisional hasta calibrar el signo. El consumo de gasolina prioriza el acumulado `Fuel used`; si falta, el caudal puede integrarse con control de huecos.

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
