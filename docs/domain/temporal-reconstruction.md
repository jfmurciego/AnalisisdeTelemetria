# Reconstrucción temporal y métricas por segmento

Versión de fórmulas: `telemetry-metrics-v0.3.0`.

## Rejilla temporal

La salida se construye a intervalos de un segundo. Para una señal `x` en el instante `t` se toma exclusivamente la observación más reciente cuyo tiempo cumpla `t_x ≤ t` y cuya antigüedad no supere el umbral configurado:

`age_x = t - t_x`

No se usan observaciones futuras ni interpolación lineal. La salida conserva valor, unidad, instante observado y antigüedad.

## Segmentos de continuidad

Dos filas consecutivas pertenecen a segmentos diferentes cuando:

`t_i - t_(i-1) > 30 s`

El umbral identifica discontinuidades de adquisición, no paradas del vehículo. Una parada con registros continuos permanece dentro del segmento.

## Cobertura

La cobertura de una señal es la suma de intervalos válidos entre observaciones consecutivas, dividida por la duración del segmento. Un intervalo superior a tres segundos no aporta cobertura.

`coverage_x = Σ Δt_valid / segment_duration`

Una señal habilita una métrica cuando contiene al menos dos observaciones y alcanza el 80 % de cobertura, salvo reglas más restrictivas.

## Distancia

Método primario:

`distance_km = distance_accumulator_last - distance_accumulator_first`

Control independiente:

`distance_km_speed = Σ ((v_i + v_(i-1)) / 2) × Δt / 3600`

Si ambos métodos difieren más de 0,05 km o del 5 %, se conserva el acumulador como evidencia primaria, pero el resultado pasa a provisional.

## Gasolina

Método primario:

`fuel_L = fuel_accumulator_last - fuel_accumulator_first`

Control independiente:

`fuel_L_rate = Σ ((q_i + q_(i-1)) / 2) × Δt / 3600`

Si ambos métodos difieren más de 0,005 L o del 5 %, el resultado pasa a provisional. El consumo se calcula únicamente con distancia positiva:

`fuel_L_per_100_km = fuel_L / distance_km × 100`

## Energía de alta tensión

Con voltaje y corriente alineados:

`power_kW = voltage_V × current_A / 1000`

La energía se integra por trapecios. El signo positivo se registra como descarga y el negativo como carga. Ambos resultados permanecen provisionales hasta calibrar la convención de signo del perfil Kia. Con menos del 80 % de cobertura simultánea se devuelven como insuficientes y sin valor.

## Reglas de ausencia

- Un dato imposible se elimina y se contabiliza; no se transforma en cero.
- Un resultado sin entradas suficientes no contiene valor numérico.
- Los huecos, reinicios y divergencias generan códigos de advertencia reproducibles.
